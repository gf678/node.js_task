import express from "express";
import { uploadImage, uploadFile } from "../controllers/upload.controller";
import { imageUpload, fileUpload } from "../middleware/upload.middleware";

const router = express.Router();

// 画像アップロード
router.post("/image", imageUpload.single("file"), uploadImage);

// ファイルアップロード
router.post("/file", fileUpload.single("file"), uploadFile);

export default router;