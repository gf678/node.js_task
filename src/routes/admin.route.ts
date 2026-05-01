import express from "express";
import {
  getAdminDashboard,
  createBoard,
  searchUsers,
  updateUserRole,
} from "../controllers/admin.controller";
import { updateBoard } from "../controllers/board.controller";

const router = express.Router();

// 管理者ダッシュボード - 掲示板とユーザー情報を一括で取得して返却
router.get("/boards", getAdminDashboard);

// 掲示板作成
router.post("/boards", createBoard);

// 掲示板修正
router.put("/boards/:boardId", updateBoard);

// ユーザー検索
router.get("/users/search", searchUsers);

// ユーザー権限の更新
router.post("/users/role", updateUserRole);

export default router;