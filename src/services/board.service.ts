import { prisma } from "../prisma";
// 掲示板サービスファイルです。掲示板に関連するデータベース操作を行う関数を定義します。

// 掲示板一覧の取得
export const getBoards = async () => {
  return prisma.board.findMany({
    include: {
      posts: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
};

// 掲示板名による掲示板と投稿の取得
export const getBoardByName = async (name: string) => {
  return prisma.board.findUnique({
    where: { name },
  });
};