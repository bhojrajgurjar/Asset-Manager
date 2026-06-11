import { Router } from "express";
import { db, transactionsTable, booksTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { IssueBookBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

function formatUser(user: { id: number; name: string; email: string; role: "Admin" | "Student"; createdAt: Date }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt.toISOString() };
}

function formatBook(book: { id: number; title: string; author: string; isbn: string; category: string; quantity: number; createdAt: Date }, availableQuantity = 0) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    category: book.category,
    quantity: book.quantity,
    availableQuantity,
    createdAt: book.createdAt.toISOString(),
  };
}

function formatTransaction(
  tx: typeof transactionsTable.$inferSelect,
  book: typeof booksTable.$inferSelect,
  user: typeof usersTable.$inferSelect
) {
  return {
    id: tx.id,
    userId: tx.userId,
    bookId: tx.bookId,
    issueDate: tx.issueDate.toISOString(),
    returnDate: tx.returnDate.toISOString(),
    actualReturnDate: tx.actualReturnDate ? tx.actualReturnDate.toISOString() : null,
    fineAmount: tx.fineAmount ? Number(tx.fineAmount) : null,
    status: tx.status,
    book: formatBook(book),
    user: formatUser(user),
  };
}

async function updateOverdueStatus() {
  const now = new Date();
  await db
    .update(transactionsTable)
    .set({ status: "overdue" })
    .where(
      and(
        eq(transactionsTable.status, "active"),
        sql`${transactionsTable.returnDate} < ${now}`
      )
    );
}

router.get("/", requireAdmin, async (req, res) => {
  try {
    await updateOverdueStatus();
    const txs = await db.select().from(transactionsTable).orderBy(sql`${transactionsTable.issueDate} DESC`);
    const result = await Promise.all(
      txs.map(async tx => {
        const [book] = await db.select().from(booksTable).where(eq(booksTable.id, tx.bookId)).limit(1);
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tx.userId)).limit(1);
        return formatTransaction(tx, book, user);
      })
    );
    res.json(result);
  } catch (err) {
    logger.error({ err }, "List transactions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/my", requireAuth, async (req, res) => {
  try {
    await updateOverdueStatus();
    const txs = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.userId, req.session.userId!))
      .orderBy(sql`${transactionsTable.issueDate} DESC`);
    const result = await Promise.all(
      txs.map(async tx => {
        const [book] = await db.select().from(booksTable).where(eq(booksTable.id, tx.bookId)).limit(1);
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tx.userId)).limit(1);
        return formatTransaction(tx, book, user);
      })
    );
    res.json(result);
  } catch (err) {
    logger.error({ err }, "List my transactions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/issue", requireAuth, async (req, res) => {
  const parsed = IssueBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { bookId, dueDays = 14 } = parsed.data;
  try {
    const [book] = await db.select().from(booksTable).where(eq(booksTable.id, bookId)).limit(1);
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    const [activeRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.bookId, bookId), eq(transactionsTable.status, "active")));
    const activeCount = Number(activeRow?.count ?? 0);
    if (activeCount >= book.quantity) {
      res.status(400).json({ error: "No copies available" });
      return;
    }
    const issueDate = new Date();
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + dueDays);
    const [tx] = await db.insert(transactionsTable).values({
      userId: req.session.userId!,
      bookId,
      issueDate,
      returnDate,
      status: "active",
    }).returning();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
    await db.insert(notificationsTable).values({
      userId: req.session.userId!,
      message: `You have borrowed "${book.title}". Due date: ${returnDate.toLocaleDateString()}.`,
      isRead: false,
    });
    res.status(201).json(formatTransaction(tx, book, user));
  } catch (err) {
    logger.error({ err }, "Issue book error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/return", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id)).limit(1);
    if (!tx) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    if (tx.userId !== req.session.userId! && req.session.userRole !== "Admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (tx.status === "returned") {
      res.status(400).json({ error: "Book already returned" });
      return;
    }
    const now = new Date();
    const dueDate = tx.returnDate;
    let fineAmount: number | null = null;
    if (now > dueDate) {
      const diffMs = now.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      fineAmount = diffDays * 1.0;
    }
    const [updated] = await db
      .update(transactionsTable)
      .set({
        actualReturnDate: now,
        fineAmount: fineAmount !== null ? String(fineAmount) : null,
        status: "returned",
      })
      .where(eq(transactionsTable.id, id))
      .returning();
    const [book] = await db.select().from(booksTable).where(eq(booksTable.id, tx.bookId)).limit(1);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tx.userId)).limit(1);
    if (fineAmount && fineAmount > 0) {
      await db.insert(notificationsTable).values({
        userId: tx.userId,
        message: `You returned "${book.title}" late. Fine charged: $${fineAmount.toFixed(2)}.`,
        isRead: false,
      });
    } else {
      await db.insert(notificationsTable).values({
        userId: tx.userId,
        message: `You returned "${book.title}" successfully. Thank you!`,
        isRead: false,
      });
    }
    res.json(formatTransaction(updated, book, user));
  } catch (err) {
    logger.error({ err }, "Return book error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
