import type { Request, Response } from "express";

// 画像アップロードとファイルアップロードで共通して使用するオリジン構築関数
const buildOrigin = (req: Request) => {
  return `${req.protocol}://${req.get("host")}`;
};

// 画像アップロードハンドラー
export const uploadImage = (req: Request, res: Response) => {
  // リクエストにファイルが含まれているか確認
  if (!req.file) { // ファイルがない場合は400エラーを返却
    return res.status(400).json({ message: "NO_FILE" });
  }

  // アップロードされたファイルのパスとURLを生成
  const filePath = `/uploads/images/${req.file.filename}`;
  const url = `${buildOrigin(req)}${filePath}`;

  // ファイル情報とURLをクライアントに返却
  return res.status(201).json({
    name: req.file.originalname,
    filename: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    path: filePath,
    url,
  });
};

// ファイルアップロードハンドラー
export const uploadFile = (req: Request, res: Response) => {
  // リクエストにファイルが含まれているか確認
  if (!req.file) { // ファイルがない場合は400エラーを返却
    return res.status(400).json({ message: "NO_FILE" });
  }

  // アップロードされたファイルのパスとURLを生成
  const filePath = `/uploads/files/${req.file.filename}`;
  const url = `${buildOrigin(req)}${filePath}`;
  
  // ファイル情報とURLをクライアントに返却
  return res.status(201).json({
    name: req.file.originalname,
    filename: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    path: filePath,
    url,
  });
};