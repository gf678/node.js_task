import "dotenv/config";
import { defineConfig } from "prisma/config"; // 또는 'prisma'

export default defineConfig({
  schema: "prisma/schema.prisma",
  // v7에서 이 설정이 있으면 PrismaClient() 호출 시 자동으로 이 URL을 사용합니다.
  datasource: {
    url: process.env.DATABASE_URL
  },
});