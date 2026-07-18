import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import multer from "multer";

// ルーターとミドルウェアをインポートします。
import boardRouter from "./routes/board.route";
import postRouter from "./routes/post.route";
import commentRouter from "./routes/comment.route";
import authRouter from "./routes/auth.route";
import userRouter from "./routes/user.route";
import adminRouter from "./routes/admin.route";
import subscriptionRouter from "./routes/subscription.route";
import uploadRouter from "./routes/upload.route";
import { httpLogger } from "./middleware/httpLogger";
import { visitorTracker, visitorStatsHandler } from "./middleware/visitorTracker";

// Expressアプリケーションを生成します。
const app = express();

// 必要なディレクトリが存在しない場合に生成するユーティリティ関数です。
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// プロキシ設定を有効にし、クライアントの実際のIPアドレスを取得できるようにします。
app.set("trust proxy", true);

// アップロード用ディレクトリが存在しない場合は作成します。
ensureDir(path.resolve("uploads/images"));
ensureDir(path.resolve("uploads/files"));
ensureDir(path.resolve("uploads/comments"));
// 静的ファイル提供のため、アップロードディレクトリをExpressの静的ディレクトリとして設定します。
// クライアントは /uploads パスを通じてアップロードされた画像やファイルにアクセスできます。
app.use(
  "/uploads",
  express.static(path.resolve("uploads"))
);

// CORS設定を適用し、特定のオリジンからのリクエストを許可します。
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://deer2922.ddns.net:5173",
    ],
    credentials: true, // クライアントがクッキーを含むリクエストを送信できるように許可します。
  })
);

// 各種ミドルウェア
app.use(express.json());
app.use(cookieParser());
app.use(httpLogger);
app.use(visitorTracker);

// 訪問者統計情報を返却するハンドラーを登録
app.get("/api/visitor-stats", visitorStatsHandler);

// APIルーター
app.use("/api/upload", uploadRouter);
app.use("/api/boards", boardRouter);
app.use("/api/posts", postRouter);
app.use("/api/comments", commentRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/subscription", subscriptionRouter);

// ヘルスチェック用エンドポイントです。サーバーが正常に稼働しているか確認できます。
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// エラーハンドリングミドルウェアです。multerのアップロードエラーや一般的なサーバーエラーを処理し、適切なHTTPステータスコードとメッセージを返却します。
app.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);

    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message: "UPLOAD_ERROR",
        error: err.message,
      });
    }

    if (err instanceof Error && err.message === "ONLY_IMAGE_UPLOAD_ALLOWED") {
      return res.status(400).json({
        message: "ONLY_IMAGE_UPLOAD_ALLOWED",
      });
    }

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Server Error",
    });
  }
);

// サーバーを起動し、指定されたポートでリクエストを待機します。
app.listen(3003, () => {
  console.log("Server running on http://localhost:3003");
});