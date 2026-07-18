import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";

export const boardAccessMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const boardName = Array.isArray(req.params.boardName)
    ? req.params.boardName[0]
    : req.params.boardName;

  if (!boardName) {
    return next();
  }

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

  if (!board.isProtected) {
    return next();
  }

  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({
      message: "UNAUTHORIZED",
    });
  }

  const access = await prisma.boardAccess.findUnique({
    where: {
      boardId_userId: {
        boardId: board.boardId,
        userId,
      },
    },
  });

  if (!access) {
    return res.status(403).json({
      message: "BOARD_LOCKED",
    });
  }

  next();
};