import { Request, Response } from "express";
import {
  createCommentService,
  updateCommentService,
  deleteCommentService
} from "../services/comment.service";
import { prisma } from "../prisma";

/**
 * コメント作成
 */
export const createComment = async (req: Request, res: Response) => {
  try {
    // リクエストから投稿ID、コメント内容、親コメントIDを抽出
    const { postId } = req.params;
    const { content, parentId } = req.body;
    // authMiddlewareで設定されたユーザー情報
    const user = req.user;
    if (!user) return res.status(401).json({ message: "UNAUTHORIZED" });
    // コメント作成サービス関数を呼び出して新しいコメントを作成
    const result = await createCommentService(
      Number(postId),
      content,
      user.loginId,
      user.role,
      parentId ? Number(parentId) : undefined // ✅ ここを修正
    );
    // 作成されたコメント情報をクライアントに返却
    res.json(result);
  } catch (err) { // エラーハンドリング
    res.status(500).json({ message: "SERVER_ERROR" });
  }
};

/**
 * コメント修正
 */
export const updateComment = async (req: Request, res: Response) => {
  try {
    // リクエストからコメントIDと新しいコメント内容を抽出
    const { id } = req.params;
    const { content } = req.body;
    // authMiddlewareで設定されたユーザー情報
    const user = req.user;
    if (!user) return res.status(401).json({ message: "UNAUTHORIZED" });

    // コメント修正サービス関数を呼び出してコメントを更新
    const result = await updateCommentService(
      Number(id),
      content,
      user.loginId
    );
    // 更新されたコメント情報をクライアントに返却
    res.json(result);
  } catch (err) { // エラーハンドリング
    res.status(500).json({ message: "SERVER_ERROR" });
  }
};

/**
 * コメント削除
 */
export const deleteComment = async (req: Request, res: Response) => {
  // リクエストからコメントIDを抽出
  const commentId = Number(req.params.id);
  const userId = req.user?.id;

  // ログインIDがない場合は401エラーを返却
  if (!userId) {
    return res.status(401).json({ message: "UNAUTHORIZED" });
  }

  // コメントIDが不正な場合は400エラーを返却
  if (!Number.isInteger(commentId)) {
    return res.status(400).json({
      message: "INVALID_COMMENT_ID",
      params: req.params,
    });
  }
  // データベースからコメントを取得し、存在確認と作成者の確認を行う
  const comment = await prisma.comment.findUnique({
    where: { commentId },
  });

  // コメントが存在しない場合は404エラーを返却
  if (!comment) {
    return res.status(404).json({ message: "COMMENT_NOT_FOUND" });
  }

  // コメント作成者と現在のログインユーザーが異なる場合は403エラーを返却
  if (comment.userId !== userId) {
    return res.status(403).json({ message: "FORBIDDEN" });
  }
  // コメントを論理削除（isDeletedフラグをtrueに設定し、内容を「削除されたコメントです。」に変更）
  await prisma.comment.update({
    where: { commentId },
    data: {
      isDeleted: true,
      content: "削除されたコメントです。",
    },
  });
  // 削除完了メッセージをクライアントに返却
  return res.json({ message: "COMMENT_SOFT_DELETED" });
};