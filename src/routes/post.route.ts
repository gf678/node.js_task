import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createPostHandler,
  getPostsHandler,
  updatePostHandler,
  deletePostHandler,
  getPostDetailHandler,
  reactionHandler,
  increasePostView
} from "../controllers/post.controller";
import multer from "multer";

// Multer設定 - ファイルアップロード用のテンポラリディレクトリを指定
const upload = multer({ dest: "uploads/tmp" });

const router = Router();

// 認証が必要なAPI
router.post(
  "/:boardName",
  authMiddleware,
  upload.array("files"),
  createPostHandler
);
// 投稿に対するリアクション（いいね/よくないね）
router.post("/:postId/reaction", authMiddleware, reactionHandler);

// 投稿の詳細取得
router.get("/:boardName/:postId", authMiddleware, getPostDetailHandler);

// 投稿の修正
router.put("/:postId", authMiddleware, updatePostHandler);

// 投稿の削除
router.delete("/:postId", authMiddleware, deletePostHandler);

// 投稿の閲覧数増加
router.post("/:postId/view", increasePostView);

// 掲示板名による投稿一覧の取得
router.get("/:boardName", getPostsHandler);

export default router;