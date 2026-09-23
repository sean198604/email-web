/**
 * 内置默认邮件模板
 * ------------------------------------------------------------------
 * 供两处复用：
 *  1. 用户注册时自动播种（src/app/api/auth/register/route.ts）
 *  2. 老用户手动补默认模板（src/app/api/templates/seed/route.ts）
 *
 * 约定：
 *  - 变量使用双花括号占位，如 {{name}} / {{email}}，发送时由 sender.ts 替换为收件人真实值。
 *  - 分类沿用模板页的枚举：营销 / 通知 / 邀请 / 确认 / 问候。
 *  - 所有样式内联，兼容主流邮件客户端；布局用 max-width 容器 + 表格回退。
 */

export interface DefaultTemplate {
  name: string;
  subject: string;
  category: string;
  htmlContent: string;
  textContent: string;
}

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    name: "欢迎邮件",
    category: "问候",
    subject: "欢迎加入，{{name}}！开启您的邮件营销之旅",
    htmlContent: `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5fb;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(79,70,229,0.08);">
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:36px 32px;text-align:center;">
          <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:1px;">欢迎加入我们</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 12px;font-size:20px;color:#1f2937;">你好，{{name}} 👋</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4b5563;">非常感谢您的注册！我们很高兴能成为您邮件营销路上的伙伴。在这里，您可以轻松管理联系人、设计精美模板，并向客户批量发送专业邮件。</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#4b5563;">下面是三个快速上手的小建议：</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:10px 0;font-size:15px;color:#374151;">① 导入您的联系人分组</td></tr>
            <tr><td style="padding:10px 0;font-size:15px;color:#374151;">② 挑选或自定义一封邮件模板</td></tr>
            <tr><td style="padding:10px 0;font-size:15px;color:#374151;">③ 创建群发任务并一键发送</td></tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
            <tr><td style="background:#4f46e5;border-radius:10px;">
              <a href="{{email}}" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">开始使用</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#fafafe;padding:20px 32px;border-top:1px solid #eef0f6;font-size:12px;color:#9ca3af;text-align:center;">本邮件由系统自动发送，请勿直接回复。</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    textContent:
      "你好，{{name}}！\n\n感谢您的注册，欢迎加入我们。\n快速上手：1) 导入联系人分组 2) 挑选或自定义模板 3) 创建群发任务一键发送。\n本邮件由系统自动发送，请勿直接回复。",
  },
  {
    name: "促销活动通知",
    category: "营销",
    subject: "{{name}}，限时优惠等您来领 🎉",
    htmlContent: `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff7ed;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(249,115,22,0.10);">
        <tr><td style="background:linear-gradient(135deg,#f97316,#ef4444);padding:40px 32px;text-align:center;">
          <div style="font-size:13px;letter-spacing:3px;color:#ffe7d3;font-weight:600;">LIMITED TIME</div>
          <div style="font-size:26px;font-weight:800;color:#ffffff;margin-top:8px;">限时狂欢 · 全场低至 5 折</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4b5563;">亲爱的 {{name}}，专属于您的优惠已就位！活动期间下单即享超值折扣，数量有限，先到先得。</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border-radius:12px;">
            <tr><td style="padding:20px;text-align:center;">
              <div style="font-size:40px;font-weight:800;color:#ea580c;">5折</div>
              <div style="font-size:13px;color:#9a3412;margin-top:4px;">指定商品 · 仅限本周</div>
            </td></tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
            <tr><td style="background:#ea580c;border-radius:10px;">
              <a href="{{email}}" style="display:inline-block;padding:13px 34px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">立即抢购</a>
            </td></tr>
          </table>
          <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">优惠截止时间以活动页面为准，最终解释权归主办方所有。</p>
        </td></tr>
        <tr><td style="background:#fafafa;padding:20px 32px;border-top:1px solid #f0f0f0;font-size:12px;color:#9ca3af;text-align:center;">您收到此邮件是因为您是我们的注册用户。</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    textContent:
      "亲爱的 {{name}}，\n专属于您的优惠已就位！活动期间下单即享全场低至 5 折，数量有限先到先得。\n立即抢购，优惠截止以活动页面为准。",
  },
  {
    name: "订单确认函",
    category: "确认",
    subject: "您的订单已确认 - {{name}}",
    htmlContent: `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ecfdf5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(16,185,129,0.10);">
        <tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:32px;text-align:center;">
          <div style="font-size:30px;">✅</div>
          <div style="font-size:20px;font-weight:700;color:#ffffff;margin-top:8px;">订单已确认</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4b5563;">{{name}}，您好！我们已收到您的订单，正在为您安排发货。以下是订单概要：</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
            <tr><td style="padding:12px 16px;background:#f9fafb;font-size:14px;color:#6b7280;width:40%;">订单状态</td><td style="padding:12px 16px;font-size:14px;color:#065f46;font-weight:600;">已确认 · 待发货</td></tr>
            <tr><td style="padding:12px 16px;background:#f9fafb;font-size:14px;color:#6b7280;">预计送达</td><td style="padding:12px 16px;font-size:14px;color:#1f2937;">1-3 个工作日</td></tr>
            <tr><td style="padding:12px 16px;background:#f9fafb;font-size:14px;color:#6b7280;">客服邮箱</td><td style="padding:12px 16px;font-size:14px;color:#1f2937;">{{email}}</td></tr>
          </table>
          <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#4b5563;">如有任何疑问，欢迎随时联系我们的客服团队，我们将竭诚为您服务。</p>
        </td></tr>
        <tr><td style="background:#f0fdf4;padding:20px 32px;border-top:1px solid #d1fae5;font-size:12px;color:#6b7280;text-align:center;">感谢您的信任与支持！</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    textContent:
      "{{name}}，您好！我们已收到您的订单，正在为您安排发货。\n订单状态：已确认·待发货；预计送达：1-3 个工作日。\n如有疑问请联系客服。感谢您的信任与支持！",
  },
  {
    name: "会议邀请",
    category: "邀请",
    subject: "诚邀 {{name}} 参加我们的线上会议",
    htmlContent: `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf5ff;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(139,92,246,0.10);">
        <tr><td style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);padding:36px 32px;text-align:center;">
          <div style="font-size:13px;letter-spacing:3px;color:#ede9fe;font-weight:600;">INVITATION</div>
          <div style="font-size:22px;font-weight:700;color:#ffffff;margin-top:8px;">诚邀您参加线上会议</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4b5563;">{{name}}，您好！我们诚挚邀请您参加本次线上交流会议，共同探讨合作机会与行业洞察。</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ede9fe;border-radius:10px;overflow:hidden;">
            <tr><td style="padding:12px 16px;background:#faf5ff;font-size:14px;color:#7c3aed;font-weight:600;width:40%;">会议时间</td><td style="padding:12px 16px;font-size:14px;color:#1f2937;">2026-09-30 14:00 (GMT+8)</td></tr>
            <tr><td style="padding:12px 16px;background:#faf5ff;font-size:14px;color:#7c3aed;font-weight:600;">会议形式</td><td style="padding:12px 16px;font-size:14px;color:#1f2937;">腾讯会议 · 链接见按钮</td></tr>
            <tr><td style="padding:12px 16px;background:#faf5ff;font-size:14px;color:#7c3aed;font-weight:600;">联系人</td><td style="padding:12px 16px;font-size:14px;color:#1f2937;">{{email}}</td></tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
            <tr><td style="background:#7c3aed;border-radius:10px;">
              <a href="{{email}}" style="display:inline-block;padding:13px 34px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">加入会议</a>
            </td></tr>
          </table>
          <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">期待您的出席，如需调整时间请提前告知。</p>
        </td></tr>
        <tr><td style="background:#faf5ff;padding:20px 32px;border-top:1px solid #ede9fe;font-size:12px;color:#9ca3af;text-align:center;">本邀请函由系统自动发送。</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    textContent:
      "{{name}}，您好！诚邀您参加本次线上交流会议。\n时间：2026-09-30 14:00 (GMT+8)；形式：腾讯会议；联系人：{{email}}。\n期待您的出席！",
  },
  {
    name: "系统通知",
    category: "通知",
    subject: "重要通知：{{name}}，请查收",
    htmlContent: `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eff6ff;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(59,130,246,0.10);">
        <tr><td style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:30px 32px;">
          <div style="font-size:18px;font-weight:700;color:#ffffff;">📢 系统通知</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4b5563;">{{name}}，您好！这是一封系统自动推送的重要通知，请留意以下事项：</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:8px;">
            <tr><td style="padding:16px 18px;font-size:14px;line-height:1.7;color:#1e40af;">为提升服务稳定性，系统将于本周末进行例行维护，期间部分功能可能短暂不可用，敬请谅解。</td></tr>
          </table>
          <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#4b5563;">如您对本次通知有任何疑问，可回复本邮件或联系管理员。感谢您的理解与配合。</p>
        </td></tr>
        <tr><td style="background:#eff6ff;padding:20px 32px;border-top:1px solid #dbeafe;font-size:12px;color:#9ca3af;text-align:center;">系统通知邮件，无需回复。</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    textContent:
      "{{name}}，您好！这是一封系统自动推送的重要通知。\n为提升服务稳定性，系统将于本周末进行例行维护，期间部分功能可能短暂不可用。\n如有疑问请联系管理员。",
  },
  {
    name: "每周电子报",
    category: "营销",
    subject: "{{name}}，本周精选资讯已送达 📰",
    htmlContent: `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.06);">
        <tr><td style="background:#0f172a;padding:28px 32px;">
          <div style="font-size:18px;font-weight:800;color:#ffffff;">每周电子报</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:4px;">第 01 期 · 为您精选</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#4b5563;">{{name}}，又到周五！我们为您整理了本周最值得关注的内容：</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
              <div style="font-size:15px;font-weight:600;color:#1f2937;">📌 行业洞察：2026 邮件营销趋势</div>
              <div style="font-size:13px;color:#64748b;margin-top:4px;">个性化与自动化将成为增长关键。</div>
            </td></tr>
            <tr><td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
              <div style="font-size:15px;font-weight:600;color:#1f2937;">🛠 产品更新：模板编辑器升级</div>
              <div style="font-size:13px;color:#64748b;margin-top:4px;">支持变量替换与实时预览。</div>
            </td></tr>
            <tr><td style="padding:14px 0;">
              <div style="font-size:15px;font-weight:600;color:#1f2937;">💡 实用技巧：提升打开率</div>
              <div style="font-size:13px;color:#64748b;margin-top:4px;">优化主题行，避开垃圾邮件关键词。</div>
            </td></tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
            <tr><td style="background:#0f172a;border-radius:10px;">
              <a href="{{email}}" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">阅读全文</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #f1f5f9;font-size:12px;color:#9ca3af;text-align:center;">您订阅了我们的每周电子报，可随时退订。</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    textContent:
      "{{name}}，本周精选资讯：\n1) 行业洞察：2026 邮件营销趋势——个性化与自动化成为增长关键。\n2) 产品更新：模板编辑器支持变量替换与实时预览。\n3) 实用技巧：优化主题行提升打开率。\n阅读全文请点击邮件内链接。",
  },
];
