// 智能启动脚本：根据 DATABASE_URL 选择数据库同步方式，再启动 Next.js
// - 有 postgresql:// 连接串（PocketBay 托管库）：prisma db push（空库最稳，幂等）
// - 有 file: 路径（本地/开发 SQLite）：prisma migrate deploy
// - 缺失连接串：跳过同步，先让应用起来
//   打破「先有库才能部署成功，但库只在部署成功后才注入」的死结：
//   应用先起来 → 平台健康检查通过 → 控制台绑定托管 PostgreSQL → 注入真实
//   DATABASE_URL → 平台重启容器 → 下次启动用真实连接串完成 db push。
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL || "";
const isPostgres =
  url.startsWith("postgresql://") || url.startsWith("postgres://");

function run(cmd) {
  console.log(`[start] ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
}

if (url) {
  try {
    if (isPostgres) {
      run("npx prisma db push");
    } else {
      run("npx prisma migrate deploy");
    }
  } catch (e) {
    // 同步失败不再阻断启动：应用先起来，平台才能绑定托管 PostgreSQL 并注入
    // 真实 DATABASE_URL，下一次重启即可用真实连接串完成同步。
    console.error("[start] 数据库同步失败(非阻断，应用继续启动):", e.message);
  }
} else {
  console.warn(
    "[start] 未检测到 DATABASE_URL，跳过数据库同步，先启动应用。请在平台绑定托管 PostgreSQL 后重启以使配置生效。"
  );
}

// PocketBay 健康检查探测 8080；同时尊重平台注入的 PORT 环境变量。
const port = process.env.PORT || 8080;
run(`next start -p ${port}`);
