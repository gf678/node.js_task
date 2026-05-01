import { prisma } from "../prisma";
import { Role } from "@prisma/client";
// コメントサービスファイルです。コメントに関連するデータベース操作を行う関数を定義します。

// コメント作成
export const createCommentService = async (
  postId: number,
  content: string,
  loginId: string,
  role: Role,
  parentId?: number
) => {
  // 投稿が存在するか確認
  const post = await prisma.post.findUnique({ where: { postId } });
  if (!post) throw new Error("POST_NOT_FOUND"); // 投稿が存在しない場合はエラーを投げます。

  // 作成者情報の取得
  const user = await prisma.user.findUnique({ where: { loginId } });
  if (!user) throw new Error("USER_NOT_FOUND"); // ユーザーが存在しない場合はエラーを投げます。

  // コメント作成
  return prisma.comment.create({
    data: {
      content,
      postId,
      userId: user.id,
      parentId: parentId ?? null,
    },
  });
};

// コメント修正
export const updateCommentService = async (
  id: number,
  content: string,
  loginId: string
) => {

  // コメントが存在するか確認
  const comment = await prisma.comment.findUnique({
    where: { commentId: id },
    include: { user: true }
  });

  // コメントが存在しない場合はエラーを投げます。
  if (!comment) throw new Error("COMMENT_NOT_FOUND");

  // コメント作成者とログインユーザーが異なる場合はエラーを投げます。
  if (comment.user.loginId !== loginId) {
    throw new Error("FORBIDDEN");
  }

  // コメント更新
  return prisma.comment.update({
    where: { commentId: id },
    data: { content }
  });
};

// コメント削除
export const deleteCommentService = async (
  id: number,
  loginId: string,
  role: Role
) => {
  // コメントが存在するか確認
  const comment = await prisma.comment.findUnique({
    where: { commentId: id },
    include: { user: true },
  });

  // コメントが存在しない場合はエラーを投げます。
  if (!comment) throw new Error("COMMENT_NOT_FOUND");

  // コメント作成者、管理者(ADMIN)、モデレーター(MODERATOR)のみ削除できるように権限チェック
  const isOwner = comment.user.loginId === loginId;
  const isAdmin = role === "ADMIN";
  const isModerator = role === "MODERATOR";

  // 権限がない場合はエラーを投げます。
  if (!isOwner && !isAdmin && !isModerator) {
    throw new Error("FORBIDDEN");
  }

  // コメント削除 (論理削除としてisDeletedフラグをtrueに設定)
  return prisma.comment.update({
    where: { commentId: id },
    data: { isDeleted: true },
  });
};