import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { imageUpload } from "../middleware/upload.middleware";
import { getMe, editUser } from "../controllers/user.controller";

const router = Router();

// 自分の情報を取得
router.get("/me", authMiddleware, getMe);

// 自分の情報を更新 (画像アップロードを含む)
router.put("/me", authMiddleware, imageUpload.single("imageFile"), editUser);

// 自分の情報を修正 (画像アップロードなし、または代替エンドポイント用)
router.post("/edit", authMiddleware, imageUpload.single("imageFile"), editUser);

export default router;