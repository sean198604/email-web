// 邮件追踪工具：在发送前对 HTML 注入打开追踪像素、并把链接改写为点击追踪跳转。
// 追踪以 SendRecord.id 作为身份令牌（cuid 不可猜测），端点据此反查 userId / 联系人。

// 追踪基址：默认走线上域名；本地/自建可用 APP_URL 覆盖。
export function getTrackingBaseUrl(): string {
  return (
    process.env.APP_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://email.pocketbay.app"
      : "http://localhost:5051")
  );
}

// 1x1 透明 GIF（用于打开追踪像素）
export const TRANSPARENT_GIF_BUFFER = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

// 打开追踪像素 <img>
export function openPixelHtml(sendRecordId: string, baseUrl: string): string {
  const src = `${baseUrl}/api/track/open?t=${encodeURIComponent(sendRecordId)}`;
  return `<img src="${src}" width="1" height="1" alt="" border="0" style="display:none;width:1px;height:1px;" />`;
}

// 把 HTML 中的 http(s) 链接改写为点击追踪跳转。
// 跳过 mailto:/tel:/# 锚点等（这些不是可追踪的外链）。
export function rewriteLinksForTracking(
  html: string,
  sendRecordId: string,
  baseUrl: string
): string {
  const clickBase = `${baseUrl}/api/track/click?t=${encodeURIComponent(
    sendRecordId
  )}&u=`;
  // 同时兼容双引号与单引号 href
  const linkRe = /(href\s*=\s*)(["'])(https?:\/\/[^"']+)\2/gi;
  return html.replace(linkRe, (_m, pre: string, q: string, url: string) => {
    return `${pre}${q}${clickBase}${encodeURIComponent(url)}${q}`;
  });
}

// 汇总：返回注入了打开像素 + 改写链接后的 HTML。
export function injectTracking(
  html: string,
  sendRecordId: string,
  baseUrl: string,
  opts: { trackOpens?: boolean; trackClicks?: boolean } = {}
): string {
  const trackOpens = opts.trackOpens !== false; // 默认开启
  const trackClicks = opts.trackClicks !== false; // 默认开启

  let result = html;
  if (trackClicks) {
    result = rewriteLinksForTracking(result, sendRecordId, baseUrl);
  }
  if (trackOpens) {
    result += openPixelHtml(sendRecordId, baseUrl);
  }
  return result;
}
