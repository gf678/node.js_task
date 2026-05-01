import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../jwt/jwt.types";

// 認証ミドルウェアです。リクエストのAuthorizationヘッダーからJWTトークンを抽出し、検証を行います。有効な場合はユーザー情報をreq.userに保存します。トークンがない場合や無効な場合は401 Unauthorizedレスポンスを返します。
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Authorizationヘッダーからトークンを抽出
  const header = req.headers.authorization;

  // ヘッダーが存在しない、または"Bearer "で始まらない場合は401レスポンスを返却
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "NO_TOKEN" });
  }
  // トークン部分のみを取得
  const token = header.split(" ")[1];
  
  try {
    // トークンを検証してデコード
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload; 

    // デコードされた情報をreq.userに保存
    req.user = {
      id: decoded.id,
      loginId: decoded.loginId,
      role: decoded.role,
    };
    // 次のミドルウェアへ移動
    next();
  } catch (err) { // トークンの検証に失敗した場合は401レスポンスを返却
    return res.status(401).json({ message: "INVALID_TOKEN" });
  }
};