import express from "express";
import { loginHandler, refreshHandler, logoutHandler, signupHandler, requestPasswordReset, resetPassword } from "../controllers/auth.controller";

const router = express.Router();

// ログイン
router.post("/login", loginHandler);

// トークン再発行
router.post("/refresh", refreshHandler);

// ログアウト
router.post("/logout", logoutHandler);

// 会員登録
router.post("/signup", signupHandler);

router.post("/find-password", requestPasswordReset);

router.post("/reset-password", resetPassword);

export default router;