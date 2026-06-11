import { Router } from "express";
import { db, transactionsTable, booksTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

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

router.get("/admin", requireAdmin, async (req, res) => {
  try {
    await updateOverdueStatus();
    const [totalBooksRow] = await db.select({ count: sql<number>`count(*)` }).from(booksTable);
    const [totalUsersRow] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const [activeRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactionsTable)
      .where(eq(transactionsTable.status, "active"));
    const [overdueRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactionsTable)
      .where(eq(transactionsTable.status, "overdue"));
    const [totalFinesRow] = await db
      .select({ total: sql<number>`COALESCE(SUM(fine_amount), 0)` })
      .from(transactionsTable)
      .where(eq(transactionsTable.status, "returned"));
    const [pendingFinesRow] = await db
      .select({ total: sql<number>`COALESCE(SUM(GREATEST(EXTRACT(DAY FROM (NOW() - return_date)), 0)), 0)` })
      .from(transactionsTable)
      .where(eq(transactionsTable.status, "overdue"));

    const booksByCategory = await db
      .select({ category: booksTable.category, count: sql<number>`count(*)` })
      .from(booksTable)
      .groupBy(booksTable.category)
      .orderBy(booksTable.category);

    const recentTxs = await db
      .select()
      .from(transactionsTable)
      .orderBy(sql`${transactionsTable.issueDate} DESC`)
      .limit(10);

    const recentTransactions = await Promise.all(
      recentTxs.map(async tx => {
        const [book] = await db.select().from(booksTable).where(eq(booksTable.id, tx.bookId)).limit(1);
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tx.userId)).limit(1);
        return {
          id: tx.id,
          userId: tx.userId,
          bookId: tx.bookId,
          issueDate: tx.issueDate.toISOString(),
          returnDate: tx.returnDate.toISOString(),
          actualReturnDate: tx.actualReturnDate ? tx.actualReturnDate.toISOString() : null,
          fineAmount: tx.fineAmount ? Number(tx.fineAmount) : null,
          status: tx.status,
          book: { id: book.id, title: book.title, author: book.author, isbn: book.isbn, category: book.category, quantity: book.quantity, availableQuantity: 0, createdAt: book.createdAt.toISOString() },
          user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt.toISOString() },
        };
      })
    );

    res.json({
      totalBooks: Number(totalBooksRow.count),
      totalUsers: Number(totalUsersRow.count),
      activeRentals: Number(activeRow.count),
      overdueRentals: Number(overdueRow.count),
      totalFinesCollected: Number(totalFinesRow.total),
      pendingFines: Number(pendingFinesRow.total),
      booksByCategory: booksByCategory.map(r => ({ category: r.category, count: Number(r.count) })),
      recentTransactions,
    });
  } catch (err) {
    logger.error({ err }, "Admin dashboard error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/student", requireAuth, async (req, res) => {
  try {
    await updateOverdueStatus();
    const userId = req.session.userId!;
    const [currentlyBorrowedRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.status, "active")));
    const [overdueRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.status, "overdue")));
    const [totalBorrowedRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactionsTable)
      .where(eq(transactionsTable.userId, userId));
    const [outstandingRow] = await db
      .select({ total: sql<number>`COALESCE(SUM(GREATEST(EXTRACT(DAY FROM (NOW() - return_date)), 0)), 0)` })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.status, "overdue")));
    const [unreadRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationsTable)
      .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));

    const activeTxs = await db
      .select()
      .from(transactionsTable)
      .where(and(eq(transactionsTable.userId, userId), sql`status IN ('active', 'overdue')`))
      .orderBy(sql`${transactionsTable.returnDate} ASC`);

    const activeTransactions = await Promise.all(
      activeTxs.map(async tx => {
        const [book] = await db.select().from(booksTable).where(eq(booksTable.id, tx.bookId)).limit(1);
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tx.userId)).limit(1);
        return {
          id: tx.id,
          userId: tx.userId,
          bookId: tx.bookId,
          issueDate: tx.issueDate.toISOString(),
          returnDate: tx.returnDate.toISOString(),
          actualReturnDate: tx.actualReturnDate ? tx.actualReturnDate.toISOString() : null,
          fineAmount: tx.fineAmount ? Number(tx.fineAmount) : null,
          status: tx.status,
          book: { id: book.id, title: book.title, author: book.author, isbn: book.isbn, category: book.category, quantity: book.quantity, availableQuantity: 0, createdAt: book.createdAt.toISOString() },
          user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt.toISOString() },
        };
      })
    );

    res.json({
      currentlyBorrowed: Number(currentlyBorrowedRow.count),
      totalBorrowed: Number(totalBorrowedRow.count),
      outstandingFines: Number(outstandingRow.total),
      overdueBooks: Number(overdueRow.count),
      activeTransactions,
      unreadNotifications: Number(unreadRow.count),
    });
  } catch (err) {
    logger.error({ err }, "Student dashboard error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
