import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
router.use(requireAuth);

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY must be set.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are Alexandria, a friendly AI librarian assistant for the Alexandria Library Management System. Your role is to help students discover and choose books from our library.

When recommending books, be warm, enthusiastic, and helpful. Ask clarifying questions to understand their interests, reading level, and what they're looking for. Suggest specific books that match their needs and explain why each book would be a good fit.

You can help with:
- Finding books by genre, topic, or mood
- Recommending books similar to ones they've enjoyed
- Suggesting books for academic subjects or personal interests
- Explaining what a book is about
- Helping students decide between multiple books

Keep responses concise and engaging. If a student asks about something unrelated to books or the library, gently redirect the conversation back to helping them find great books to read.`;

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
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
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
    console.error("[Gemini chat error]", errMsg);
    const isQuota = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED");
    const msg = isQuota
      ? "I've hit the free usage limit for now. Please wait a minute and try again — Gemini's free tier resets quickly!"
      : "Sorry, I encountered an error. Please try again.";
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
