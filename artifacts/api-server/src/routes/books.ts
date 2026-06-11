import { Router } from "express";
import { db, booksTable, transactionsTable } from "@workspace/db";
import { eq, like, or, sql, ilike } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { CreateBookBody, UpdateBookBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

function computeAvailableQuantity(bookId: number, quantity: number, activeCount: number) {
  return Math.max(0, quantity - activeCount);
}

router.get("/categories", requireAuth, async (req, res) => {
  try {
    const rows = await db.selectDistinct({ category: booksTable.category }).from(booksTable).orderBy(booksTable.category);
    res.json(rows.map(r => r.category));
  } catch (err) {
    logger.error({ err }, "List categories error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  const { search, category } = req.query as { search?: string; category?: string };
  try {
    let query = db.select().from(booksTable);
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(booksTable.title, `%${search}%`),
          ilike(booksTable.author, `%${search}%`),
          ilike(booksTable.category, `%${search}%`)
        )
      );
    }
    if (category) {
      conditions.push(eq(booksTable.category, category));
    }
    const books = conditions.length > 0
      ? await query.where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`)
      : await query;

    const activeTransactions = await db
      .select({ bookId: transactionsTable.bookId, count: sql<number>`count(*)` })
      .from(transactionsTable)
      .where(eq(transactionsTable.status, "active"))
      .groupBy(transactionsTable.bookId);

    const activeMap = new Map(activeTransactions.map(t => [t.bookId, Number(t.count)]));

    const result = books.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      quantity: book.quantity,
      availableQuantity: computeAvailableQuantity(book.id, book.quantity, activeMap.get(book.id) ?? 0),
      createdAt: book.createdAt.toISOString(),
    }));

    res.json(result);
  } catch (err) {
    logger.error({ err }, "List books error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  const parsed = CreateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  try {
    const [book] = await db.insert(booksTable).values(parsed.data).returning();
    res.status(201).json({
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      quantity: book.quantity,
      availableQuantity: book.quantity,
      createdAt: book.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Create book error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [book] = await db.select().from(booksTable).where(eq(booksTable.id, id)).limit(1);
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }
    const [activeRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactionsTable)
      .where(eq(transactionsTable.bookId, id));
    const activeCount = Number(activeRow?.count ?? 0);
    res.json({
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      quantity: book.quantity,
      availableQuantity: computeAvailableQuantity(book.id, book.quantity, activeCount),
      createdAt: book.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Get book error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
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
      .where(eq(transactionsTable.bookId, id));
    const activeCount = Number(activeRow?.count ?? 0);
    res.json({
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      quantity: book.quantity,
      availableQuantity: computeAvailableQuantity(book.id, book.quantity, activeCount),
      createdAt: book.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Update book error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
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
