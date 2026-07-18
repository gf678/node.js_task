import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createComment,
  updateComment,
  deleteComment
} from "../controllers/comment.controller";

import multer from "multer";


const router = Router();


// 임시 저장
const upload = multer({
  dest: "uploads/tmp",
  limits:{
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter(req,file,cb){

    if(file.mimetype.startsWith("image/")){
      cb(null,true);
    }else{
      cb(new Error("IMAGE_ONLY"));
    }

  }
});


// 모든 댓글 API 인증
router.use(authMiddleware);


// 댓글 작성 + 이미지
router.post(
  "/posts/:postId/comments",
  upload.single("image"),
  createComment
);


// 댓글 수정 + 이미지 변경
router.put(
  "/posts/:postId/comments/:id",
  upload.single("image"),
  updateComment
);


// 댓글 삭제
router.delete(
  "/posts/:postId/comments/:id",
  deleteComment
);


export default router;