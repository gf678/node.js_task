import { Router } from "express";
import {
  getBoardsHandler,
  getBoardByNameHandler
} from "../controllers/board.controller";

const router = Router();

// 掲示板一覧の取得
router.get("/", getBoardsHandler);

// 掲示板名による掲示板の取得
router.get("/:boardName", getBoardByNameHandler);

export default router;