import { Role } from "@prisma/client";

// JWTペイロードの型を定義するインターフェースです。ユーザーID、ログインID、ロール（権限）情報を含みます。
export interface JwtPayload {
  id: number;
  loginId: string;
  role: Role;
}