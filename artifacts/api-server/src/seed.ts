import { count } from "drizzle-orm";
import { db, booksTable } from "@workspace/db";
import { logger } from "./lib/logger";

const SEED_BOOKS = [
  { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "978-0-06-112008-4", category: "Fiction", quantity: 8 },
  { title: "1984", author: "George Orwell", isbn: "978-0-452-28423-4", category: "Fiction", quantity: 6 },
  { title: "Pride and Prejudice", author: "Jane Austen", isbn: "978-0-14-143951-8", category: "Fiction", quantity: 5 },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0-7432-7356-5", category: "Fiction", quantity: 7 },
  { title: "Sapiens", author: "Yuval Noah Harari", isbn: "978-0-06-231609-7", category: "Non-Fiction", quantity: 4 },
  { title: "A Brief History of Time", author: "Stephen Hawking", isbn: "978-0-553-38016-3", category: "Science", quantity: 3 },
  { title: "The Selfish Gene", author: "Richard Dawkins", isbn: "978-0-19-878860-7", category: "Science", quantity: 4 },
  { title: "Introduction to Algorithms", author: "Thomas H. Cormen", isbn: "978-0-262-03384-8", category: "Technology", quantity: 6 },
  { title: "Clean Code", author: "Robert C. Martin", isbn: "978-0-13-235088-4", category: "Technology", quantity: 5 },
  { title: "The Pragmatic Programmer", author: "David Thomas", isbn: "978-0-13-595705-9", category: "Technology", quantity: 4 },
  { title: "A People's History of the United States", author: "Howard Zinn", isbn: "978-0-06-239194-9", category: "History", quantity: 3 },
  { title: "Guns, Germs, and Steel", author: "Jared Diamond", isbn: "978-0-393-31755-8", category: "History", quantity: 4 },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", isbn: "978-0-374-53355-7", category: "Psychology", quantity: 5 },
  { title: "The Art of War", author: "Sun Tzu", isbn: "978-0-14-043919-9", category: "Philosophy", quantity: 6 },
  { title: "Meditations", author: "Marcus Aurelius", isbn: "978-0-14-044933-4", category: "Philosophy", quantity: 4 },
  { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", isbn: "978-0-59-035342-7", category: "Fantasy", quantity: 10 },
  { title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "978-0-547-92822-7", category: "Fantasy", quantity: 7 },
  { title: "Dune", author: "Frank Herbert", isbn: "978-0-441-17271-9", category: "Science Fiction", quantity: 5 },
  { title: "The Diary of a Young Girl", author: "Anne Frank", isbn: "978-0-553-29698-3", category: "Biography", quantity: 3 },
  { title: "Educated", author: "Tara Westover", isbn: "978-0-39-959050-4", category: "Biography", quantity: 4 },
];

export async function seedDatabase() {
  try {
    const [result] = await db.select({ value: count() }).from(booksTable);
    if ((result?.value ?? 0) > 0) {
      logger.info("Database already has books, skipping seed");
      return;
    }

    await db.insert(booksTable).values(SEED_BOOKS);
    logger.info({ count: SEED_BOOKS.length }, "Seeded sample books");
  } catch (err) {
    logger.error({ err }, "Failed to seed database");
  }
}
