import { pgTable, serial, integer, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { booksTable } from "./books";

export const transactionStatusEnum = pgEnum("transaction_status", ["active", "returned", "overdue"]);

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => booksTable.id, { onDelete: "cascade" }),
  issueDate: timestamp("issue_date", { withTimezone: true }).notNull().defaultNow(),
  returnDate: timestamp("return_date", { withTimezone: true }).notNull(),
  actualReturnDate: timestamp("actual_return_date", { withTimezone: true }),
  fineAmount: numeric("fine_amount", { precision: 10, scale: 2 }),
  status: transactionStatusEnum("status").notNull().default("active"),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
