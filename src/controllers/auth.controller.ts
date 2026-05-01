import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import bcrypt from "bcrypt";

// REFRESH TOKENの有効期限（7日）
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

// クッキー設定
const refreshCookieBaseOptions = {
  // httpOnly: クライアント側からのアクセスを禁止
  httpOnly: true,
  // SameSite: CSRF対策（lax）
  sameSite: "lax" as const,
  // secure: HTTPS環境のみ送信（開発環境ではfalse）
  secure: false, 
  // パス設定
  path: "/api/auth",
};

// REFRESH TOKEN用クッキーオプション（有効期限付き）
const refreshCookieOptions = {
  // 基本オプション展開
  ...refreshCookieBaseOptions,
  // 有効期限設定
  maxAge: REFRESH_TOKEN_EXPIRES_MS,
};

/* ======================
    TOKEN GENERATION
====================== */
// アクセストークン生成
const generateAccessToken = (user: any) =>
  jwt.sign(
    {
      id: user.id,
      loginId: user.loginId,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

// リフレッシュトークン生成
const generateRefreshToken = (user: any) =>
  jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: "7d" }
  );

/* ======================
    LOGIN
====================== */
export const loginHandler = async (req: Request, res: Response) => {
  // リクエストから認証情報取得
  let { loginId, password } = req.body;
  // 文字列化およびトリム処理
  loginId = loginId?.trim();
  password = password?.toString().trim();

  const user = await prisma.user.findUnique({ where: { loginId } });

  // ユーザー未存在時は401
  if (!user) {
    return res.status(401).json({ message: "INVALID_LOGIN" });
  }

  // パスワード検証
  const ok = await bcrypt.compare(password, user.password);

  // 不一致時は401
  if (!ok) {
    return res.status(401).json({ message: "INVALID_LOGIN" });
  }

  // トークン生成
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // 既存トークン削除
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });

  // 新規トークン保存
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
    },
  });

  // クッキー設定
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  // レスポンス返却
  return res.json({
    accessToken,
    user: {
      id: user.id,
      loginId: user.loginId,
      alias: user.alias,
      profileImg: user.profileImg,
      role: user.role,
    },
  });
};

/* ======================
   LOGOUT
====================== */
export const logoutHandler = async (req: Request, res: Response) => {
  // トークン取得
  const token = req.cookies?.refreshToken;

  // 存在時は削除
  if (token) {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  // クッキー削除
  res.clearCookie("refreshToken", refreshCookieBaseOptions);

  // 正常終了
  return res.json({ message: "LOGOUT_SUCCESS" });
};

/* ======================
   REFRESH
====================== */
export const refreshHandler = async (req: Request, res: Response) => {
  // トークン取得
  const token = req.cookies?.refreshToken;

  // 未存在時は401
  if (!token) {
    return res.status(401).json({ message: "NO_REFRESH_TOKEN" });
  }

  try {
    // 検証・デコード
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET!
    ) as { id: number };

    // DB存在確認
    const saved = await prisma.refreshToken.findFirst({
      where: { token },
    });

    // 未存在時は401
    if (!saved) {
      res.clearCookie("refreshToken", refreshCookieBaseOptions);
      return res.status(401).json({ message: "TOKEN_NOT_FOUND" });
    }
    
    // 期限切れ判定
    if (saved.expiresAt.getTime() < Date.now()) {
      await prisma.refreshToken.deleteMany({
        where: { token },
      });

      res.clearCookie("refreshToken", refreshCookieBaseOptions);
      return res.status(401).json({ message: "TOKEN_EXPIRED" });
    }

    // ユーザー取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    // 未存在時は削除して401
    if (!user) {
      await prisma.refreshToken.deleteMany({
        where: { token },
      });

      res.clearCookie("refreshToken", refreshCookieBaseOptions);
      return res.status(401).json({ message: "USER_NOT_FOUND" });
    }

    // 新規アクセストークン生成
    const newAccessToken = generateAccessToken(user);

    // レスポンス返却
    return res.json({
      accessToken: newAccessToken,
    });
  } catch (e) {
    // 検証失敗時は削除
    await prisma.refreshToken.deleteMany({
      where: { token },
    }).catch(() => null);

    res.clearCookie("refreshToken", refreshCookieBaseOptions);

    // 401返却
    return res.status(401).json({ message: "INVALID_REFRESH_TOKEN" });
  }
};

/* ======================
   SIGNUP
====================== */
export const signupHandler = async (req: Request, res: Response) => {
  // 入力取得
  const { loginId, password, email, alias } = req.body;

  // パスワードハッシュ化
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    // ユーザー作成
    await prisma.user.create({
      data: {
        loginId,
        password: hashedPassword,
        email,
        alias,
        role: "USER",
      },
    });

    // 正常終了
    return res.json({ message: "SIGNUP_SUCCESS" });
  } catch (err) {
    // エラー時400
    return res.status(400).json({
      message: "SIGNUP_FAILED",
      error: err instanceof Error ? err.message : err,
    });
  }
};