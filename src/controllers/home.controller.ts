import { Request, Response } from "express";
import { prisma } from "../prisma";

// ホームデータ取得ハンドラー
export const getHomeData = async (req: Request, res: Response) => {
  try {
    // 掲示板と投稿リストをデータベースから取得
    const boards = await prisma.board.findMany({
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
    
    // 掲示板名をキーとし、該当掲示板の投稿配列を値とするマップを作成
    const boardMap: Record<string, (typeof boards)[number]["posts"]> = {};

    // 取得した掲示板リストをループし、マップに掲示板名と投稿配列を格納
    for (const board of boards) {
      boardMap[board.name] = board.posts;
    }

    // 人気投稿も併せて取得（いいね数基準の降順でソート）
    const popularPosts = await prisma.post.findMany({
      orderBy: [
        { likes: "desc" },
        { createdAt: "desc" },
      ],
      take: 10,
    });

    // 掲示板リスト、投稿マップ、人気投稿をまとめて返却
    return res.json({
      boards: boards.map(({ posts, ...b }) => b),
      boardMap,
      popularPosts,
    });

  } catch (err) { // エラーハンドリング
    console.error(err);
    return res.status(500).json({ message: "DB Error" });
  }
};