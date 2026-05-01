import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  toggleSubscription,
  getMySubscriptions
} from "../controllers/board.controller";

const router = Router();

// 自分の購読中の掲示板一覧を取得
router.get("/", authMiddleware, getMySubscriptions);

// 掲示板の購読登録 / 解除
router.post("/:boardId", authMiddleware, toggleSubscription);

export default router;