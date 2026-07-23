# 邮件群发工具 · 网页版 · Email-Web

> 📧 将商业桌面邮件群发工具复现为**多用户隔离**的网页版 SaaS 邮件发送系统  
> 📧 A web-based, multi-tenant email mass-mailing platform reimplemented from a desktop tool.

---

## 📋 项目信息

| 项目 | 详情 |
|---|---|
| **名称** | 邮件群发工具 · 网页版（email-web） |
| **版本** | 0.1.0 |
| **框架** | Next.js 16（App Router） |
| **端口** | 5051 |
| **数据库** | SQLite（Prisma 7 + better-sqlite3） |
| **部署** | Docker Compose |
| **仓库** | [sean198604/email-web](https://github.com/sean198604/email-web) |

## 项目概述

本项目将一款商业桌面（Electron）邮件群发工具，复现为**纯网页、多用户隔离**的邮件发送系统。保留原版核心业务能力（联系人、模板、群发任务、账号轮发、日志、黑名单、垃圾词检测），并移除了原版的软件激活 / 卡密模块。技术上采用 Next.js 全栈方案，每个注册用户拥有独立数据空间。

## ✨ 功能特性

- 👥 **多用户隔离**：注册即分配独立数据空间，JWT + httpOnly Cookie 鉴权；10 张业务表全部按 `userId` 隔离，API 查询强制 `where: { userId }`
- 📇 **联系人管理**：分组 / 标签、CSV / Excel 批量导入、变量占位符
- 📝 **邮件模板**：HTML + 纯文本双版本、变量替换、克隆
- 🚀 **群发任务**：创建向导、账号轮发策略（轮询 / 权重 / 智能）、日 / 时限额、发送间隔、暂停 / 停止
- 📮 **多 SMTP 账号**：连接测试、轮发策略、限流控制
- 📊 **仪表盘**：统计卡片 + 7 天发送趋势图
- 🚫 **黑名单 + 垃圾词检测**：邮箱 / 域名屏蔽、合规发送
- 🐳 **容器化部署**：多阶段 Docker 构建 + Compose，数据持久化到命名卷

## 🛠 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16（App Router）+ React 19 + TypeScript 5 |
| 样式 | Tailwind CSS 4 + shadcn/ui（@base-ui/react） |
| ORM | Prisma 7 + @prisma/adapter-better-sqlite3（SQLite） |
| 发信 | nodemailer 9 |
| 认证 | jose（JWT）+ bcryptjs |
| 表格 / 图表 | @tanstack/react-table + recharts |
| 状态 / 动画 | zustand + framer-motion |

## 📁 目录结构

```
email-web/
├── src/
│   ├── app/              # 页面 + API 路由（App Router）
│   │   ├── page.tsx      # 仪表盘
│   │   ├── contacts/ templates/ tasks/ accounts/
│   │   ├── logs/ blacklist/ settings/ admin/
│   │   ├── login/ register/
│   │   └── api/          # 21 个后端接口
│   ├── components/       # 侧边栏、主题、ui/*（shadcn/base-ui）
│   ├── lib/              # auth / db / mailer / sender / spam-detector
│   └── middleware.ts     # 登录态守卫（未登录跳 /login）
├── prisma/
│   ├── schema.prisma     # 10 张业务表 + User（均含 userId 外键）
│   └── migrations/
├── Dockerfile            # 多阶段构建（deps → builder → runner）
├── docker-compose.yml    # 端口 5051 + 命名卷 + 环境变量 + healthcheck
├── .env.example          # 环境变量模板（真实值留在被忽略的 .env）
└── package.json
```

## 🚀 快速开始

### 本地开发

```bash
npm ci
npx prisma migrate deploy   # 初始化数据库（或 migrate dev）
npm run dev                 # 访问 http://localhost:5051
```

### Docker 部署

```bash
# 1. 准备环境变量（含密钥，切勿提交到仓库）
cp .env.example .env
#   编辑 .env，填入：
#     JWT_SECRET="<openssl rand -base64 48 生成的强随机值>"
#     ADMIN_PASSWORD="<管理员密码>"

# 2. 构建并启动
docker compose up -d --build
#   访问 http://<服务器IP>:5051
#   用 .env 中的 ADMIN_EMAIL(admin@ego.com) + ADMIN_PASSWORD 注册，自动成为管理员
```

> ⚠️ **密钥安全**：`JWT_SECRET` 与 `ADMIN_PASSWORD` 通过 `.env` 注入，**请勿硬编码进 `docker-compose.yml`**。本地数据库 `dev.db` 与 `.env` 均已被 `.gitignore` 忽略，不会进入仓库或镜像。

## 📚 详细文档

- `项目说明.md` — 完整技术架构、功能模块、数据模型、API 总览、与原版能力对照
- `源码位置说明.md` — 源码位置澄清与三种运行 / 部署方式
- `容器化与性能分析.md` — 容器化方案与性能分析

---

*本项目为原商业桌面邮件群发工具的网页版复现，已移除激活 / 卡密模块，仅供学习与技术研究使用。*
