import { Request, Response } from "express";
import { prisma } from "../prisma";
import bcrypt from "bcrypt";

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

    const {
      name,
      description,
      isProtected,
      password,
    } = req.body;


    // ロック掲示板の場合パスワード必須
    if (isProtected && !password) {
      return res.status(400).json({
        message: "PASSWORD_REQUIRED",
      });
    }


    let passwordHash = null;


    // パスワード暗号化
    if (isProtected) {
      passwordHash = await bcrypt.hash(
        password,
        10
      );
    }


    const board = await prisma.board.create({
      data: {
        name,
        description,

        isProtected: Boolean(isProtected),

        passwordHash,

        protectedAt: isProtected
          ? new Date()
          : null,
      },
    });


    return res.status(201).json(board);


  } catch (err) {

    console.error(err);

    return res.status(500).json({
      message: "SERVER_ERROR",
    });

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