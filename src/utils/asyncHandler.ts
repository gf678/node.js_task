import { Request, Response, NextFunction } from "express";

// 非同期ハンドラーを簡潔に記述できるようにサポートするユーティリティ関数です。
export const asyncHandler =
  (fn: any) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };