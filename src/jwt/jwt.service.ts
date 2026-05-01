import jwt from "jsonwebtoken";

// JWT関連のサービス関数を定義するモジュールです。アクセストークンとリフレッシュトークンの生成および検証機能を提供します。
const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

// アクセストークンを生成する関数です。渡されたペイロードをJWT_SECRETで署名し、1時間有効なトークンを返します。
export const generateAccessToken = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
};

// リフレッシュトークンを生成する関数です。渡されたペイロードをREFRESH_SECRETで署名し、7日間有効なトークンを返します。
export const generateRefreshToken = (payload: object) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
};

// アクセストークンを検証する関数です。渡されたトークンをJWT_SECRETで検証し、ペイロードを返します。検証に失敗した場合は例外が発生します。
export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};

// リフレッシュトークンを検証する関数です。渡されたトークンをREFRESH_SECRETで検証し、ペイロードを返します。検証に失敗した場合は例外が発生します。
export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_SECRET);
};