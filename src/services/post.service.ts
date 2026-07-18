import { prisma } from "../prisma";
// 投稿サービスファイルです。投稿に関連するデータベース操作を行う関数を定義します。

// 投稿の作成
export const createPost = async (
  title: string,
  content: string,
  boardName: string,
  loginId: string,
  files?: { name: string; url: string }[] // 添付ファイル情報 (オプション)
) => {
  // 作成者情報と掲示板情報の取得
  const user = await prisma.user.findUnique({ where: { loginId } });
  const board = await prisma.board.findUnique({ where: { name: boardName } });
  
  if (!user) throw new Error("USER_NOT_FOUND"); // 作成者が存在しない場合はエラーを投げます。
  if (!board) throw new Error("BOARD_NOT_FOUND"); // 掲示板が存在しない場合はエラーを投げます。

  // 投稿の作成
  return prisma.post.create({
    data: {
      title,
      content,
      userId: user.id,
      boardId: board.boardId,

      // 添付ファイルがある場合のみファイルを作成し、ない場合はundefinedを設定して無視
      files: files
        ? {
            create: files.map((f) => ({
              name: f.name,
              url: f.url,
            })),
          }
        : undefined,
    },
  });
};

// 投稿一覧の取得
export const getPosts = async (
  boardName: string,
  page: number,
  size: number,
  keyword?: string,
  sort?: string
) => {
  // 掲示板名で掲示板を照会し、該当する掲示板の投稿を条件に合わせてフィルタリングして返します。
  return prisma.post.findMany({
    where: {
      // 掲示板名が一致する投稿のみ取得
      board: { name: boardName },

      // 検索キーワードがある場合、タイトルにキーワードが含まれる投稿のみ取得
      ...(keyword
        ? { title: { contains: keyword } }
        : {}),

      // ソート基準が「人気順」の場合、いいね数が10以上の投稿のみ取得
      ...(sort === "popular" && {
        likes: {
          gte: 10, // 人気投稿の条件
        },
      }),
    },

    // 投稿と一緒に作成者、コメント数を取得
    include: {
      user: {
        select: {
          alias: true,
          loginId: true,
        },
      },
      comments: {
        select: {
          commentId: true,
        },
      },
    },

    // 常に最新順にソート (人気投稿はいいね数でフィルタリングのみ行い、ソートは最新順を維持)
    orderBy: {
      createdAt: "desc", 
    },

    // ページネーションのためのスキップとテイクの設定
    skip: page * size,
    take: size,
  });
};

// 投稿の修正
export const updatePost = async (
  postId: number,
  title: string,
  content: string,
  loginId: string
) => {
  // 投稿が存在するか確認
  const post = await prisma.post.findUnique({
    where: { postId },
    include: { user: true },
  });

  if (!post) throw new Error("POST_NOT_FOUND"); // 投稿が存在しない場合はエラーを投げます。
  if (post.user.loginId !== loginId) throw new Error("FORBIDDEN"); // 作成者とログインユーザーが異なる場合はエラーを投げます。

  // 投稿の更新
  return prisma.post.update({
    where: { postId },
    data: { title, content },
  });
};

// 投稿の削除
// 게시글 삭제
export const deletePost = async (
  postId: number,
  loginId: string
) => {

  // 게시글 존재 확인
  const post = await prisma.post.findUnique({
    where: {
      postId,
    },
    include: {
      user: true,
    },
  });


  if (!post) {
    throw new Error("POST_NOT_FOUND");
  }


  // 작성자 확인
  if (post.user.loginId !== loginId) {
    throw new Error("FORBIDDEN");
  }


  // 댓글 삭제 후 게시글 삭제
  return prisma.$transaction(async (tx) => {

    // 댓글 먼저 삭제 (FK 제약 해결)
    await tx.comment.deleteMany({
      where: {
        postId,
      },
    });


    // 게시글 삭제
    return tx.post.delete({
      where: {
        postId,
      },
    });

  });
};