import { Router } from "express";
import {
  getBoardsHandler,
  getBoardByNameHandler,
  checkBoardPassword
} from "../controllers/board.controller";

import { authMiddleware } from "../middleware/auth.middleware";
import { boardAccessMiddleware } from "../middleware/boardAccess.middleware";


const router = Router();


// 게시판 목록
router.get(
  "/",
  getBoardsHandler
);


// 비밀번호 인증
router.post(
  "/:boardId/access",
  authMiddleware,
  checkBoardPassword
);


// 게시판 조회
router.get(
  "/:boardName",
  authMiddleware,
  boardAccessMiddleware,
  getBoardByNameHandler
);


export default router;