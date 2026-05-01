import express from "express";
import { loginHandler, refreshHandler, logoutHandler, signupHandler } from "../controllers/auth.controller";

const router = express.Router();

// ログイン
router.post("/login", loginHandler);

// トークン再発行
router.post("/refresh", refreshHandler);

// ログアウト
router.post("/logout", logoutHandler);

// 会員登録
router.post("/signup", signupHandler);

export default router;