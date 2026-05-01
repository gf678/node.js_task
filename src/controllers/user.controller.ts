import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../prisma";

// ユーザー情報取得および更新ハンドラーで共通して使用するselectオプションの定義
const meSelect = {
  id: true,
  loginId: true,
  alias: true,
  email: true,
  phone: true,
  profileImg: true,
  role: true,
} as const;

// ユーザーIDでユーザー情報を取得する関数の定義
const findMeById = (userId: number) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: meSelect,
  });
};

// ユーザー情報取得ハンドラー
export const getMe = async (req: Request, res: Response) => {
  res.set("Cache-Control", "no-store"); // キャッシュ防止ヘッダーの設定
  
  // authMiddlewareで設定されたユーザーIDを取得
  const userId = req.user?.id;
  if (!userId) { // ユーザーIDがない場合は401エラーを返却
    return res.status(401).json({ message: "UNAUTHORIZED" });
  }

  // ユーザーIDでユーザー情報を取得
  const user = await findMeById(userId);
  if (!user) { // ユーザーが存在しない場合は404エラーを返却
    return res.status(404).json({ message: "USER_NOT_FOUND" });
  }

  // 取得したユーザー情報をクライアントに返却
  return res.json(user);
};

// ユーザー情報更新ハンドラー
export const editUser = async (req: Request, res: Response) => {
  // authMiddlewareで設定されたユーザーIDを取得
  const userId = req.user?.id;
  // リクエストからremoveProfileImgの値を取り出し、booleanに変換
  const removeProfileImg = req.body.removeProfileImg === "true";

  // ユーザーIDがない場合は401エラーを返却
  if (!userId) {
    return res.status(401).json({ message: "UNAUTHORIZED" });
  }

  // ユーザーIDで現在のユーザー情報をデータベースから取得し、存在を確認
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      profileImg: true,
    },
  });

  // ユーザーが存在しない場合は404エラーを返却
  if (!currentUser) {
    return res.status(404).json({ message: "USER_NOT_FOUND" });
  }

  // リクエストからユーザー情報（ニックネーム、メール、電話番号、パスワード）を抽出
  const alias =
    typeof req.body.alias === "string" ? req.body.alias.trim() : undefined;
  const email =
    typeof req.body.email === "string" ? req.body.email.trim() : undefined;
  const phone =
    typeof req.body.phone === "string" ? req.body.phone.trim() : undefined;
  const password =
    typeof req.body.password === "string" ? req.body.password.trim() : "";

  // 更新する情報を格納するオブジェクトを生成（必要なフィールドのみ含む）
  const data: {
    alias?: string;
    email?: string;
    phone?: string;
    password?: string;
    profileImg?: string | null;
  } = {};

  // 各項目が提供されている場合、更新用データオブジェクトに追加
  if (alias !== undefined) data.alias = alias;
  if (email !== undefined) data.email = email;
  if (phone !== undefined) data.phone = phone;

  // パスワードが提供された場合、ハッシュ化して追加
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }
  
  // プロフィール画像削除の指示がある場合、profileImgをnullに設定
  if (removeProfileImg) {
    data.profileImg = null;
  }
  
  // 新しいファイルがアップロードされた場合、パスを保存
  if (req.file) {
    data.profileImg = `/uploads/images/${req.file.filename}`;
  }
  
  // データベースのユーザー情報を更新
  await prisma.user.update({
    where: { id: userId },
    data,
  });

  // 更新されたユーザー情報を再度取得して存在を確認
  const updatedUser = await findMeById(userId);
  
  // ユーザーが存在しない場合は404エラーを返却
  if (!updatedUser) {
    return res.status(404).json({ message: "USER_NOT_FOUND" });
  }

  // 更新されたユーザー情報をメッセージと共に返却
  return res.json({
    message: "USER_UPDATED",
    user: updatedUser,
  });
  
};