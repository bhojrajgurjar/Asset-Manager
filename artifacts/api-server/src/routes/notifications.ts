import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const notifications = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, req.session.userId!))
      .orderBy(sql`${notificationsTable.timestamp} DESC`);
    res.json(notifications.map(n => ({
      id: n.id,
      userId: n.userId,
      message: n.message,
      isRead: n.isRead,
      timestamp: n.timestamp.toISOString(),
    })));
  } catch (err) {
    logger.error({ err }, "List notifications error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/read-all", requireAuth, async (req, res) => {
  try {
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, req.session.userId!));
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    logger.error({ err }, "Mark all read error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/read", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [notification] = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.session.userId!)))
      .returning();
    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.json({
      id: notification.id,
      userId: notification.userId,
      message: notification.message,
      isRead: notification.isRead,
      timestamp: notification.timestamp.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Mark notification read error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
