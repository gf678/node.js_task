import { Request, Response } from "express";
import { prisma } from "../prisma";
import {
  createPost,
  getPosts,
  updatePost,
  deletePost
} from "../services/post.service"; 

// 掲示板名をキーとし、該当掲示板の投稿配列を値とする型定義
type PostParams = { boardName: string };
type PostQuery = {
  page?: string;
  size?: string;
  keyword?: string;
  sort?: string;
};

// 投稿作成ハンドラー
export const createPostHandler = async (req: Request, res: Response) => {
  // リクエストから掲示板名、タイトル、内容を抽出
  const boardName = req.params.boardName as string;
  const { title, content } = req.body;
  // authMiddlewareで設定されたユーザー情報
  const user = req.user;
  if (!user) return res.status(401).json({ message: "UNAUTHORIZED" });
  // 投稿作成サービス関数を呼び出して新しい投稿を作成
  const result = await createPost(
    title,
    content,
    boardName,
    user.loginId
  );
  // 作成された投稿情報をクライアントに返却
  return res.json(result);
};

// 投稿一覧取得ハンドラー
export const getPostsHandler = async (
  req: Request<PostParams, any, any, PostQuery>,
  res: Response
) => {
  // リクエストから掲示板名、ページ番号、ページサイズ、検索キーワード、ソート基準を抽出
  const { boardName } = req.params;
  const { page = "0", size = "15", keyword, sort } = req.query;
  // 投稿取得サービス関数を呼び出して投稿一覧を取得
  const posts = await getPosts(
    boardName,
    Number(page),
    Number(size),
    keyword,
    sort
  );
  // 取得した投稿一覧をクライアントに返却
  return res.json(posts);
};

// 投稿詳細取得ハンドラー
export const getPostDetailHandler = async (req: Request, res: Response) => {

  // リクエストから投稿IDと掲示板名を抽出
  const { postId, boardName } = req.params;

  // 該当する投稿を検索（IDと掲示板名が一致するもの）
  const post = await prisma.post.findFirst({
    where: {
      postId: Number(postId),
      board: {
        name: String(boardName),
      },
    },
    include: {
      user: true,
      board: true,
      comments: {
        include: { user: true },
      },
    },
  });

  // 投稿が存在しない場合は404エラーを返却
  if (!post) {
    return res.status(404).json({ message: "POST_NOT_FOUND" });
  }

  return res.json(post);
};

// 投稿修正ハンドラー
export const updatePostHandler = async (req: Request, res: Response) => {
  // リクエストから投稿ID、タイトル、内容を抽出
  const { postId } = req.params;
  const { title, content } = req.body;

  // authMiddlewareで設定されたユーザー情報
  const user = req.user;
  if (!user) return res.status(401).json({ message: "UNAUTHORIZED" });

  // 投稿修正サービス関数を呼び出して内容を更新
  const result = await updatePost(
    Number(postId),
    title,
    content,
    user.loginId
  );

  // 更新された投稿情報をクライアントに返却
  return res.json(result);
};

// 投稿削除ハンドラー
export const deletePostHandler = async (req: Request, res: Response) => {
  // リクエストから投稿IDを抽出
  const { postId } = req.params;
  // authMiddlewareで設定されたユーザー情報
  const user = req.user;
  if (!user) return res.status(401).json({ message: "UNAUTHORIZED" });
  // 投稿削除サービス関数を呼び出して投稿を削除
  const result = await deletePost(
    Number(postId),
    user.loginId
  );
  // 削除完了の結果をクライアントに返却
  return res.json(result);
};

// いいね / よくないね（リアクション）ハンドラー
export const reactionHandler = async (req: Request, res: Response) => {
  // リクエストから投稿IDとリアクションタイプ（LIKEまたはDISLIKE）を抽出
  const postId = Number(req.params.postId);
  const type = req.query.type as "LIKE" | "DISLIKE";

  // authMiddlewareで設定されたユーザー情報
  const user = req.user;
  if (!user) return res.status(401).json({ message: "UNAUTHORIZED" });

  // IDのバリデーションおよびタイプのチェック
  if (isNaN(postId)) return res.status(400).json({ message: "INVALID_POST_ID" });
  if (type !== "LIKE" && type !== "DISLIKE") { // タイプが無効な場合は400エラーを返却
    return res.status(400).json({ message: "INVALID_TYPE" });
  }

  // 本日、すでに該当投稿にリアクション済みか確認（1日1回制限）
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 翌日の日付を計算
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // 本日のリアクション記録があるかデータベースを照会
  const already = await prisma.postReaction.findFirst({
    where: {
      postId,
      userId: user.id,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  // すでに本日リアクション済みの場合は400エラーを返却
  if (already) {
    return res.status(400).json({ message: "ALREADY_REACTED_TODAY" });
  }

  // 新しいリアクションを保存し、投稿のカウントを増加
  await prisma.postReaction.create({
    data: {
      post: { connect: { postId } },
      user: { connect: { loginId: user.loginId } },
      type,
    },
  });

  // 投稿のいいね数またはよくないね数をインクリメント
  const updated = await prisma.post.update({
    where: { postId },
    data: {
      likes: type === "LIKE" ? { increment: 1 } : undefined,
      dislikes: type === "DISLIKE" ? { increment: 1 } : undefined,
    },
  });

  // 更新された投稿情報をクライアントに返却
  return res.json(updated);
};

// 投稿の閲覧数増加ハンドラー
export const increasePostView = async (req: Request, res: Response) => {
  // リクエストから投稿IDを抽出
  const postId = Number(req.params.postId);

  // 投稿IDが有効な整数か確認
  if (!Number.isInteger(postId)) { // 無効な場合は400エラーを返却
    return res.status(400).json({ message: "INVALID_POST_ID" });
  }

  // 閲覧数を1増やし、更新された情報を取得
  const post = await prisma.post.update({
    where: { postId },
    data: {
      views: {
        increment: 1,
      },
    },
    select: {
      postId: true,
      views: true,
    },
  });

  // 投稿が存在しない場合は404エラーを返却
  if (!post) {
    return res.status(404).json({ message: "POST_NOT_FOUND" });
  }
  
  // 更新された閲覧数情報をクライアントに返却
  return res.json(post);
};