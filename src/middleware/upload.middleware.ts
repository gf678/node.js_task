import fs from "fs";
import path from "path";
import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";

// アップロードディレクトリが存在しない場合に作成する関数です。指定されたパスが存在しない場合、再帰的にディレクトリを作成します。
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 画像およびファイルアップロードのためのMulterミドルウェア設定です。それぞれのアップロードタイプに対してストレージとファイルフィルタを定義します。画像は「uploads/images」、ファイルは「uploads/files」ディレクトリに保存されます。画像アップロードはMIMEタイプが「image/」で始まるファイルのみを許可し、それぞれ最大ファイルサイズを設定します。
const imageDir = path.resolve("uploads/images");
const fileDir = path.resolve("uploads/files");

// アップロードディレクトリが存在しない場合は作成します。
ensureDir(imageDir);
ensureDir(fileDir);

// アップロードされたファイルのファイル名を生成する関数です。元のファイル名から拡張子を抽出し、一意の識別子を生成して新しいファイル名を返します。一意の識別子は現在のタイムスタンプと乱数を組み合わせて生成されます。
const makeFilename = (file: Express.Multer.File) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${unique}${ext}`;
};

// 画像アップロード用のMulterストレージ設定です。アップロードされたファイルを指定されたディレクトリに保存し、ファイル名はmakeFilename関数を使用して生成されます。
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, imageDir);
  },
  filename: (_req, file, cb) => {
    cb(null, makeFilename(file));
  },
});

// ファイルアップロード用のMulterストレージ設定です。アップロードされたファイルをfileDirに保存し、ファイル名はmakeFilename関数を使用して生成されます。
const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, fileDir);
  },
  filename: (_req, file, cb) => {
    cb(null, makeFilename(file));
  },
});

// 画像アップロード用のファイルフィルタです。アップロードされたファイルのMIMEタイプが「image/」で始まる場合のみ許可し、それ以外の場合はエラーを返します。
const imageFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("ONLY_IMAGE_UPLOAD_ALLOWED"));
    return;
  }

  cb(null, true);
};

// Multerミドルウェアのインスタンスです。imageUploadは画像アップロードを処理し、fileUploadはファイルアップロードを処理します。各インスタンスは対応するストレージとフィルタを使用して設定されています。画像アップロードは最大5MB、ファイルアップロードは最大20MBまで許可されます。
export const imageUpload = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// 一般ファイルアップロード用のMulterミドルウェアインスタンスです。fileStorageを使用し、最大ファイルサイズは20MBに設定されています。
export const fileUpload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});