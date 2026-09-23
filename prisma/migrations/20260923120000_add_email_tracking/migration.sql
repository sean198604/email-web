-- 为既有 SQLite 安装补充邮件打开/点击追踪字段。
-- PostgreSQL 托管环境由启动脚本的 `prisma db push` 同步相同 Schema。
ALTER TABLE "SendRecord" ADD COLUMN "openedAt" DATETIME;
ALTER TABLE "SendRecord" ADD COLUMN "openCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SendRecord" ADD COLUMN "clickedAt" DATETIME;
ALTER TABLE "SendRecord" ADD COLUMN "clickCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SendRecord" ADD COLUMN "lastClickUrl" TEXT;
