import { prisma } from "../prisma";
// 掲示板サービスファイルです。掲示板に関連するデータベース操作を行う関数を定義します。

// 掲示板一覧の取得
export const getBoards = async () => {
  const boards = await prisma.board.findMany({
    include: {
      posts: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  return boards.map(board => ({
    ...board,
    posts: board.isProtected ? [] : board.posts,
  }));
};

// 掲示板名による掲示板と投稿の取得
export const getBoardByName = async (
  name:string,
  userId?:number
)=>{
  const board = await prisma.board.findUnique({
    where:{name},
    include:{
      posts:{
        include:{
          user:true,
          comments:true
        },
        orderBy:{
          createdAt:"desc"
        }
      }
    }
  });


  if(!board){
    return null;
  }


  if(board.isProtected){

    if(!userId){
      throw new Error("BOARD_LOCKED");
    }


    const access = await prisma.boardAccess.findUnique({
      where:{
        boardId_userId:{
          boardId:board.boardId,
          userId
        }
      }
    });


    if(!access){
      throw new Error("BOARD_LOCKED");
    }
  }

  return board;
};