import { Request, Response } from "express";
import { prisma } from "../prisma";

/**
 * 管理者ダッシュボード
 * boards と users を一度に取得
 * responseで2つのデータをまとめてフロントに返す
 * 
 */
export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const [boards, users] = await Promise.all([
      prisma.board.findMany(),
      prisma.user.findMany(),
    ]);

    return res.json({ boards, users });
  } catch (err) {
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
};

// 掲示板作成
export const createBoard = async (req: Request, res: Response) => {
  try {
    // リクエストから掲示板名と説明を取得
    const { name, description } = req.body;

    // 掲示板をデータベースに作成
    const board = await prisma.board.create({
      data: {
        name,
        description,
      },
    });

    // 作成された掲示板情報を返す
    return res.json(board);
  } catch (err) {
    // エラーハンドリング
    console.error(err);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
};

/**
 * ユーザー検索
 */
export const searchUsers = async (req: Request, res: Response) => {
  try {
    // リクエストから検索キーワード（ユーザーID）を取得
    const { loginId } = req.query;

    // ユーザーIDに検索キーワードを含むユーザーをデータベースから取得
    const users = await prisma.user.findMany({
      where: {
        loginId: {
          contains: String(loginId || ""),
        },
      },
    });

    // 検索結果を返す
    return res.json(users);
  } catch (err) {
    // エラーハンドリング
    console.error(err);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
};

/**
 * ユーザー権限の変更
 */
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    // リクエストからユーザーIDと新しい権限を取得
    const { userId, newRole } = req.body;

    // ユーザーIDで該当ユーザーをデータベースから取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // ユーザーが存在しない場合は404を返す
      return res.status(404).json({ message: "USER_NOT_FOUND" });
    }

    // ADMINは変更不可
    if (user.role === "ADMIN") {
      // 管理者権限を変更しようとした場合は403を返す
      return res.status(403).json({ message: "FORBIDDEN" });
    }
    
    // ユーザー権限を更新
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        role: newRole,
      },
    });

    // 更新されたユーザー情報を返す
    return res.json(updated);
  } catch (err) {
    // エラーハンドリング
    console.error(err);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
};