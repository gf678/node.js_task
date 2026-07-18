import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";

export const boardAccessMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const boardName = Array.isArray(req.params.boardName)
      ? req.params.boardName[0]
      : req.params.boardName;

    if (!boardName) {
      return res.status(404).json({
        message: "BOARD_NOT_FOUND"
      });
    }

    const board = await prisma.board.findUnique({
      where:{
        name: boardName
      }
    });


    if(!board){
      return res.status(404).json({
        message:"BOARD_NOT_FOUND"
      });
    }


    // 공개 게시판
    if(!board.isProtected){
      return next();
    }



    const user = req.user;


    if(!user){
      return res.status(401).json({
        message:"UNAUTHORIZED"
      });
    }



    // ⭐ 관리자 무조건 통과
    if(user.role === "ADMIN"){
      return next();
    }



    // 일반 사용자 접근 확인

    const access = await prisma.boardAccess.findUnique({
      where:{
        boardId_userId:{
          boardId: board.boardId,
          userId:user.id
        }
      }
    });



    if(!access){

      return res.status(403).json({
        message:"BOARD_LOCKED"
      });

    }



    next();


  }catch(err){

    console.error(err);

    return res.status(500).json({
      message:"SERVER_ERROR"
    });

  }

};