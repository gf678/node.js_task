// src/types/express.d.ts
import { Role } from "@prisma/client";

declare global { // JWTペイロードに含まれるユーザー情報とロールを定義するインターフェース
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};