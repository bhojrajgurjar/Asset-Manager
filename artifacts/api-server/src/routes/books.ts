import { Router } from "express";
import { db, booksTable, transactionsTable } from "@workspace/db";
import { eq, sql, ilike, and, or } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { CreateBookBody, UpdateBookBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

async function getActiveCounts(): Promise<Map<number, number>> {
  const rows = await db
    .select({ bookId: transactionsTable.bookId, count: sql<number>`count(*)` })
    .from(transactionsTable)
    .where(sql`${transactionsTable.status} IN ('active', 'overdue')`)
    .groupBy(transactionsTable.bookId);
  return new Map(rows.map(r => [r.bookId, Number(r.count)]));
}

function toBookResponse(book: typeof booksTable.$inferSelect, activeCount = 0) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    category: book.category,
    quantity: book.quantity,
    availableQuantity: Math.max(0, book.quantity - activeCount),
    createdAt: book.createdAt.toISOString(),
  };
}

router.get("/categories", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .selectDistinct({ category: booksTable.category })
      .from(booksTable)
      .orderBy(booksTable.category);
    res.json(rows.map(r => r.category));
  } catch (err) {
    logger.error({ err }, "List categories error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  const { search, category } = req.query as { search?: string; category?: string };
  try {
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(booksTable.title, `%${search}%`),
          ilike(booksTable.author, `%${search}%`),
          ilike(booksTable.category, `%${search}%`)
        )!
      );
    }
    if (category) {
      conditions.push(eq(booksTable.category, category));
    }

    const books =
      conditions.length === 0
        ? await db.select().from(booksTable).orderBy(booksTable.title)
        : conditions.length === 1
          ? await db.select().from(booksTable).where(conditions[0]).orderBy(booksTable.title)
          : await db.select().from(booksTable).where(and(...conditions)).orderBy(booksTable.title);

    const activeMap = await getActiveCounts();
    res.json(books.map(b => toBookResponse(b, activeMap.get(b.id) ?? 0)));
  } catch (err) {
    logger.error({ err }, "List books error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  const parsed = CreateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const [book] = await db.insert(booksTable).values(parsed.data).returning();
    res.status(201).json(toBookResponse(book, 0));
  } catch (err) {
    logger.error({ err }, "Create book error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [book] = await db.select().from(booksTable).where(eq(booksTable.id, id)).limit(1);
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    const [activeRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.bookId, id), sql`${transactionsTable.status} IN ('active', 'overdue')`));
    res.json(toBookResponse(book, Number(activeRow?.count ?? 0)));
  } catch (err) {
    logger.error({ err }, "Get book error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const [book] = await db.update(booksTable).set(parsed.data).where(eq(booksTable.id, id)).returning();
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    const [activeRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.bookId, id), sql`${transactionsTable.status} IN ('active', 'overdue')`));
    res.json(toBookResponse(book, Number(activeRow?.count ?? 0)));
  } catch (err) {
    logger.error({ err }, "Update book error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [book] = await db.delete(booksTable).where(eq(booksTable.id, id)).returning();
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    res.json({ message: "Book deleted" });
  } catch (err) {
    logger.error({ err }, "Delete book error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
