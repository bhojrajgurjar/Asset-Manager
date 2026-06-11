import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import booksRouter from "./books";
import transactionsRouter from "./transactions";
import usersRouter from "./users";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/books", booksRouter);
router.use("/transactions", transactionsRouter);
router.use("/users", usersRouter);
router.use("/notifications", notificationsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
