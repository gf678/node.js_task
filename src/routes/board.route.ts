import { Router } from "express";
import {
  getBoardsHandler,
  getBoardByNameHandler,
  unlockBoardHandler,
} from "../controllers/board.controller";

import { authMiddleware } from "../middleware/auth.middleware";
import { boardAccessMiddleware } from "../middleware/boardAccess.middleware";


const router = Router();


// 掲示板一覧の取得
router.get(
  "/",
  getBoardsHandler
);


// 掲示板解除
router.post(
  "/:boardName/unlock",
  authMiddleware,
  unlockBoardHandler
);


// 掲示板名による掲示板の取得
router.get(
  "/:boardName",
  authMiddleware,
  boardAccessMiddleware,
  getBoardByNameHandler
);


export default router;