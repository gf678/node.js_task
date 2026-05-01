import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

// pgプールの生成
const pool = new Pool({ connectionString });

// Prisma用PostgreSQLアダプターの設定
const adapter = new PrismaPg(pool);

// v7ランタイムエラーを防止するため、anyで強制的に注入
export const prisma = new PrismaClient({
  adapter: adapter as any
} as any);