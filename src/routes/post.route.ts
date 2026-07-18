import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { boardAccessMiddleware } from "../middleware/boardAccess.middleware";

import {
  createPostHandler,
  getPostsHandler,
  updatePostHandler,
  deletePostHandler,
  getPostDetailHandler,
  reactionHandler,
  increasePostView
} from "../controllers/post.controller";

import multer from "multer";


// Multer 설정
const upload = multer({
  dest: "uploads/tmp"
});


const router = Router();



// =====================================
// 게시글 작성
// =====================================
router.post(
  "/:boardName",
  authMiddleware,
  boardAccessMiddleware,
  upload.array("files"),
  createPostHandler
);



// =====================================
// 게시글 상세 조회
// =====================================
router.get(
  "/:boardName/:postId",
  authMiddleware,
  boardAccessMiddleware,
  getPostDetailHandler
);



// =====================================
// 게시글 목록 조회
// =====================================
router.get(
  "/:boardName",
  authMiddleware,
  boardAccessMiddleware,
  getPostsHandler
);



// =====================================
// 게시글 추천 / 비추천
// =====================================
router.post(
  "/:postId/reaction",
  authMiddleware,
  reactionHandler
);



// =====================================
// 게시글 수정
// =====================================
router.put(
  "/:postId",
  authMiddleware,
  upload.array("files"),
  updatePostHandler
);



// =====================================
// 게시글 삭제
// =====================================
router.delete(
  "/:postId",
  authMiddleware,
  deletePostHandler
);



// =====================================
// 조회수 증가
// =====================================
router.post(
  "/:postId/view",
  increasePostView
);



export default router;