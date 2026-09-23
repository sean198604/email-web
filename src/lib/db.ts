import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  // 默认给一个 postgres 占位串：PocketBay 构建期不会注入 DATABASE_URL，
  // 此时走纯 JS 的 PrismaPg 适配器，避免触碰 better-sqlite3 原生模块导致构建失败。
  // 运行时平台会注入真实 postgresql:// 连接串；本地 Docker 注入 file: 路径走 SQLite。
  const url = process.env.DATABASE_URL || "postgresql://db.invalid:5432/build_placeholder";

  // 平台托管 PostgreSQL：使用 @prisma/adapter-pg 驱动适配器（纯 JS，无需编译）。
  // 用变量包裹包名，防止打包器在构建期静态解析该依赖——即便本地未安装也不影响构建，
  // 运行时容器已安装则正常加载。
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    const pgPkg = "@prisma/adapter-pg";
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require(pgPkg);
    const adapter = new PrismaPg({
      connectionString: url,
      // 平台侧另有代理连接池，应用侧每个进程少量连接即可
      max: 5,
    });
    return new PrismaClient({ adapter });
  }

  // 本地 / 开发：SQLite（better-sqlite3 驱动适配器）。
  // 仅本地 Docker 会走到这里，平台走 postgres 分支，故按需 require，
  // 避免平台因缺少原生编译依赖（better-sqlite3）而安装/构建失败。
  // 用变量包裹包名，防止打包器在构建期静态解析该可选依赖（平台未安装也不应报错）。
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sqlitePkg = "@prisma/adapter-better-sqlite3";
  const { PrismaBetterSqlite3 } = require(sqlitePkg);
  const dbPath = url.replace(/^file:/, "");
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
