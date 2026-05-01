import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createComment,
  updateComment,
  deleteComment
} from "../controllers/comment.controller";

const router = Router();

// すべてのコメント関連ルートにauthMiddlewareを適用
router.use(authMiddleware);

// コメント作成
router.post("/posts/:postId/comments", createComment);

// コメント修正
router.put("/posts/:postId/comments/:id", updateComment);

// コメント削除
router.delete("/posts/:postId/comments/:id", deleteComment);

export default router;