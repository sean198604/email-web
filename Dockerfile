# syntax=docker/dockerfile:1

# ============================================================
# 阶段 1：依赖安装 + Prisma Client 生成
# 安装 better-sqlite3 需要编译工具（prebuild 失败时可回退编译）
# ============================================================
FROM node:22-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate

# ============================================================
# 阶段 2：生产构建（next build）
# ============================================================
FROM node:22-slim AS builder
WORKDIR /app
# 本地构建传 PRISMA_SCHEMA_FILE=prisma/schema.sqlite.prisma 生成 SQLite 客户端；
# 平台构建不传（默认空）→ 使用 schema.prisma（postgresql）。
ARG PRISMA_SCHEMA_FILE
ENV PRISMA_SCHEMA_FILE=$PRISMA_SCHEMA_FILE
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# ============================================================
# 阶段 3：运行镜像（精简运行时）
# ============================================================
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5051
ENV DATABASE_URL="file:/data/dev.db"
ENV NEXT_TELEMETRY_DISABLED=1

# 安装 openssl（Prisma 引擎依赖，消除 libssl 版本警告）
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# 数据库文件持久化目录：PocketBay 挂载 /data 持久卷（跨更新保留）；本地 docker-compose 用 environment 覆盖为 /app/data
RUN mkdir -p /data

# 运行时同样透传 PRISMA_SCHEMA_FILE（本地 compose 会设为 sqlite；平台不传则使用默认 postgresql schema）
ENV PRISMA_SCHEMA_FILE=$PRISMA_SCHEMA_FILE

# 复制运行所需文件
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated ./src/generated

EXPOSE 5051

# 启动由 scripts/start.mjs 按 DATABASE_URL 自动选择 db push / migrate deploy，再 next start
CMD ["npm", "run", "start"]
