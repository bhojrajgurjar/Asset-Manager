import { Router } from "express";
import { db, booksTable, conversations, messages } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../lib/logger.js";

const router = Router();
router.use(requireAuth);

const PLACEHOLDER_KEYS = new Set(["local-dev-placeholder", "your-api-key-here", "changeme"]);

function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || PLACEHOLDER_KEYS.has(key)) return null;
  return key;
}

function getGenAI(): GoogleGenerativeAI {
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error("GEMINI_NOT_CONFIGURED");
  }
  return new GoogleGenerativeAI(key);
}

const BASE_SYSTEM_PROMPT = `You are Pustaka AI, a friendly librarian assistant for the Pustaka Library Management System. Your role is to help students discover and choose books from our library.

When recommending books, be warm, enthusiastic, and helpful. Ask clarifying questions to understand their interests, reading level, and what they're looking for. Suggest specific books from the library catalog below when possible and explain why each book would be a good fit.

You can help with:
- Finding books by genre, topic, or mood
- Recommending books similar to ones they've enjoyed
- Suggesting books for academic subjects or personal interests
- Explaining what a book is about
- Helping students decide between multiple books

Keep responses concise and engaging. If a student asks about something unrelated to books or the library, gently redirect the conversation back to helping them find great books to read.`;

async function buildSystemPrompt(): Promise<string> {
  const books = await db
    .select({
      title: booksTable.title,
      author: booksTable.author,
      category: booksTable.category,
    })
    .from(booksTable)
    .orderBy(booksTable.title)
    .limit(50);

  if (books.length === 0) {
    return BASE_SYSTEM_PROMPT;
  }

  const catalog = books
    .map((b) => `- "${b.title}" by ${b.author} (${b.category})`)
    .join("\n");

  return `${BASE_SYSTEM_PROMPT}

Current library catalog (recommend from these when relevant):
${catalog}`;
}

function chatErrorMessage(err: unknown): string {
  const errMsg = err instanceof Error ? err.message : String(err);

  if (errMsg === "GEMINI_NOT_CONFIGURED") {
    return "Pustaka AI isn't configured yet. Add a valid GEMINI_API_KEY from Google AI Studio to the server .env file, then restart the API.";
  }

  if (
    errMsg.includes("API_KEY_INVALID") ||
    errMsg.includes("API key not valid") ||
    errMsg.includes("API key expired")
  ) {
    return "The AI API key is invalid. Please update GEMINI_API_KEY in the server .env file with a key from https://aistudio.google.com/apikey and restart the API.";
  }

  if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
    return "I've hit the free usage limit for now. Please wait a minute and try again — Gemini's free tier resets quickly!";
  }

  if (errMsg.includes("404") && errMsg.includes("models/")) {
    return "The AI model is temporarily unavailable. Please try again in a moment.";
  }

  return "Sorry, I encountered an error. Please try again.";
}

router.get("/conversations", async (req, res) => {
  const userId = req.session.userId!;
  const result = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(conversations.createdAt);
  res.json(result);
});

router.post("/conversations", async (req, res) => {
  const userId = req.session.userId!;
  const title: string = req.body.title || "New conversation";
  const [conv] = await db
    .insert(conversations)
    .values({ userId, title })
    .returning();
  res.status(201).json(conv);
});

router.get("/conversations/:id", async (req, res) => {
  const userId = req.session.userId!;
  const id = parseInt(req.params.id);
  const [conv] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);
  res.json({ ...conv, messages: msgs });
});

router.delete("/conversations/:id", async (req, res) => {
  const userId = req.session.userId!;
  const id = parseInt(req.params.id);
  const [conv] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).end();
});

router.post("/conversations/:id/messages", async (req, res) => {
  const userId = req.session.userId!;
  const id = parseInt(req.params.id);
  const userContent: string = req.body.content;

  const [conv] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  await db.insert(messages).values({ conversationId: id, role: "user", content: userContent });

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";
  try {
    const genAI = getGenAI();
    const systemInstruction = await buildSystemPrompt();

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction,
    });

    const geminiHistory = history.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history: geminiHistory });
    const stream = await chat.sendMessageStream(userContent);

    for await (const chunk of stream.stream) {
      const text = chunk.text();
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error({ err: errMsg }, "Gemini chat error");
    const msg = chatErrorMessage(err);
    fullResponse = msg;
    res.write(`data: ${JSON.stringify({ content: msg })}\n\n`);
  }

  if (fullResponse) {
    await db.insert(messages).values({ conversationId: id, role: "assistant", content: fullResponse });
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
