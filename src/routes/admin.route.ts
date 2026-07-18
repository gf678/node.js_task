import express from "express";
import {
  getAdminDashboard,
  createBoard,
  searchUsers,
  updateUserRole,
} from "../controllers/admin.controller";
import { 
        updateBoard,
        deleteBoard} from "../controllers/board.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";
const router = express.Router();


// 管理者ダッシュボード
// 管理者ダッシュボード
router.get(
  "/boards",
  authMiddleware,
  adminMiddleware,
  getAdminDashboard
);


// 掲示板作成
router.post(
  "/boards",
  authMiddleware,
  adminMiddleware,
  createBoard
);


// 掲示板修正
router.put(
  "/boards/:boardId",
  authMiddleware,
  adminMiddleware,
  updateBoard
);

router.delete(
  "/boards/:boardId",
  authMiddleware,
  adminMiddleware,
  deleteBoard
);

// ユーザー検索
router.get(
  "/users/search",
  authMiddleware,
  adminMiddleware,
  searchUsers
);


// ユーザー権限変更
router.post(
  "/users/role",
  authMiddleware,
  adminMiddleware,
  updateUserRole
);


export default router;