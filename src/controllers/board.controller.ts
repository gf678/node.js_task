import { Request, Response } from "express";
// 掲示板関連のサービス関数をインポート
import { getBoards, getBoardByName } from "../services/board.service"; 
import { Post } from "@prisma/client";
import { prisma } from "../prisma";
import bcrypt from "bcrypt";

// 掲示板参照ハンドラーの型定義
type BoardParams = {
  boardName: string;
};
// 掲示板名をキーとし、該当掲示板の投稿配列を値とする型定義
type BoardMap = Record<string, Post[]>;

// 掲示板一覧取得ハンドラー
export const getBoardsHandler = async (req: Request, res: Response) => {
  // すべての掲示板と該当する投稿をデータベースから取得
  const boards = await getBoards();
  // 取得した掲示板リストをクライアントに返却するためのマップ作成
  const boardMap: BoardMap = boards.reduce((acc, board) => {
    acc[board.name] = board.posts;
    return acc;
  }, {} as BoardMap);
  // 掲示板リストと投稿マップを一緒に返却
  res.json({ boards, boardMap });
};

// 掲示板名による掲示板取得ハンドラー
export const getBoardByNameHandler = async (
  req: Request<BoardParams>,
  res: Response
) => {

  const { boardName } = req.params;

  const userId = req.user?.id;


  const board = await getBoardByName(
    boardName,
    userId
  );


  if (!board) {
    return res.status(404).json({
      message:"NOT_FOUND"
    });
  }


  res.json(board);
};

// 掲示板の購読・解除切り替え
export const toggleSubscription = async (req: Request, res: Response) => {
  try {
    // リクエストから掲示板IDを抽出
    const boardId = Number(req.params.boardId);

    // authMiddlewareで設定された値を取得
    const loginId = (req as any).user?.loginId;
    // ログインIDがない場合は401エラーを返却
    if (!loginId) {
      return res.status(401).json({ message: "UNAUTHORIZED" });
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { loginId },
    });
    // ユーザーが存在しない場合は404エラーを返却
    if (!user) {
      return res.status(404).json({ message: "USER_NOT_FOUND" });
    }

    // 掲示板情報を取得
    const board = await prisma.board.findUnique({
      where: { boardId },
    });
    // 掲示板が存在しない場合は404エラーを返却
    if (!board) {
      return res.status(404).json({ message: "BOARD_NOT_FOUND" });
    }

    // すでに購読済みか確認
    const existing = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        boardId: board.boardId,
      },
    });

    // 購読中の場合は削除（購読解除）
    if (existing) {
      await prisma.subscription.delete({
        where: { id: existing.id },
      });

      return res.status(200).json("unsubscribed");
    }

    // 購読していない場合は作成（購読登録）
    await prisma.subscription.create({
      data: {
        userId: user.id,
        boardId: board.boardId,
      },
    });

    return res.status(200).json("subscribed");

  } catch (err) { // エラーハンドリング
    console.error(err);
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
};

// 自分の購読中の掲示板一覧を取得
export const getMySubscriptions = async (req: Request, res: Response) => {
  // authMiddlewareで設定されたユーザーIDを取得
  const userId = (req as any).user?.id;

  // 購読情報を取得
  const subs = await prisma.subscription.findMany({
    where: { userId },
    include: { board: true },
  });
  // 購読している掲示板リストのみをクライアントに返却
  return res.json(subs.map(s => s.board));
};

// 掲示板情報の更新
/**
 * 掲示板更新
 * 名前・説明・ロック設定変更
 */
export const updateBoard = async (
  req: Request,
  res: Response
) => {

  try {

    const boardId = Number(req.params.boardId);

    const {
      name,
      description,
      isProtected,
      password,
    } = req.body;


    const protect = isProtected === true;


    const board = await prisma.board.findUnique({
      where:{
        boardId,
      },
    });


    if(!board){

      return res.status(404).json({
        message:"BOARD_NOT_FOUND",
      });

    }


    let passwordHash = board.passwordHash;


    // 🔒 보호 게시판 설정
    if(protect){


      // 공개 → 보호 변경인데 비밀번호 없음
      if(!board.isProtected && !password){

        return res.status(400).json({
          message:"PASSWORD_REQUIRED",
        });

      }


      // 비밀번호 변경
      if(password){

        passwordHash = await bcrypt.hash(
          password,
          10
        );

      }


    }else{


      // 보호 해제
      passwordHash = null;


    }



    const updatedBoard = await prisma.board.update({

      where:{
        boardId,
      },


      data:{

        name,

        description,


        isProtected:protect,


        passwordHash,


        protectedAt:protect
          ? board.protectedAt ?? new Date()
          : null,

      },

    });


    return res.json(updatedBoard);


  }catch(err){

    console.error(err);


    return res.status(500).json({
      message:"SERVER_ERROR",
    });

  }

};

export const deleteBoard = async (
  req: Request,
  res: Response
) => {

  try {

    const boardId = Number(req.params.boardId);


    const board = await prisma.board.findUnique({
      where:{
        boardId,
      },
    });


    if(!board){

      return res.status(404).json({
        message:"BOARD_NOT_FOUND",
      });

    }


    await prisma.board.delete({

      where:{
        boardId,
      },

    });


    return res.json({
      message:"BOARD_DELETED",
    });


  } catch(err){

    console.error(err);


    return res.status(500).json({
      message:"SERVER_ERROR",
    });

  }

};

// 掲示板ロック解除ハンドラー
export const unlockBoardHandler = async (
  req: Request<BoardParams>,
  res: Response
) => {
  try {
    const { boardName } = req.params;

    // authMiddlewareからユーザーID取得
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "UNAUTHORIZED",
      });
    }


    // 掲示板取得
    const board = await prisma.board.findUnique({
      where: {
        name: boardName,
      },
    });


    if (!board) {
      return res.status(404).json({
        message: "BOARD_NOT_FOUND",
      });
    }


    // ロックされていない場合
    if (!board.isProtected) {
      return res.status(400).json({
        message: "BOARD_NOT_LOCKED",
      });
    }


    // パスワードチェック
    const password = req.body.password;

    if (!password) {
      return res.status(400).json({
        message: "PASSWORD_REQUIRED",
      });
    }


    const isMatch = await bcrypt.compare(
      password,
      board.passwordHash!
    );


    if (!isMatch) {
      return res.status(403).json({
        message: "INVALID_PASSWORD",
      });
    }


    // すでにアクセス権があるか確認
    const existingAccess = await prisma.boardAccess.findFirst({
      where:{
        boardId: board.boardId,
        userId,
      },
    });


    if (!existingAccess) {

      await prisma.boardAccess.create({
        data: {
          boardId: board.boardId,
          userId,
        },
      });

    }


    return res.json({
      message: "BOARD_UNLOCKED",
    });


  } catch (err) {

    console.error(err);

    return res.status(500).json({
      message: "SERVER_ERROR",
    });

  }
};

export const checkBoardPassword = async (
  req:Request,
  res:Response
)=>{

 try{

  const boardId = Number(req.params.boardId);

  const {
    password
  } = req.body;


  const user = req.user;


  const board = await prisma.board.findUnique({
    where:{
      boardId
    }
  });


  if(!board){
    return res.status(404).json({
      message:"BOARD_NOT_FOUND"
    });
  }


  // 공개 게시판
  if(!board.isProtected){

    return res.json({
      success:true
    });

  }


  if(!password){

    return res.status(400).json({
      message:"PASSWORD_REQUIRED"
    });

  }


  const valid =
    await bcrypt.compare(
      password,
      board.passwordHash!
    );


  if(!valid){

    return res.status(401).json({
      message:"INVALID_PASSWORD"
    });

  }



  // ⭐ 추가
  // 비밀번호 인증 성공 기록

  await prisma.boardAccess.upsert({
    where:{
      boardId_userId:{
        boardId,
        userId:user.id
      }
    },
    update:{
      createdAt:new Date()
    },
    create:{
      boardId,
      userId:user.id
    }
  });

  return res.json({
    success:true
  });


 }catch(err){

  console.error(err);

  res.status(500).json({
    message:"SERVER_ERROR"
  });

 }

};