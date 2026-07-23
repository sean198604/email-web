export interface SpamCheckResult {
  score: number;
  quality: "优秀" | "一般" | "较差";
  issues: string[];
  suggestions: string[];
}

const DEFAULT_SPAM_WORDS = [
  "免费", "赚钱", "暴富", "月入", "日入", "一夜暴富", "不花一分钱",
  "零风险", "无风险", "保底", "保本保息", "稳赚不赔", "高回报",
  "信用卡套现", "代还信用卡", "现金贷", "网贷", "小额贷", "以贷养贷",
  "刷信誉", "刷好评", "六合彩", "时时彩", "老虎机", "赌博",
  "包治百病", "药到病除", "排毒养颜", "祖传秘方", "美白祛斑",
  "学历提升", "保录取", "办理", "证件",
  "加QQ", "加微信", "扫码领取", "点击领取",
  "限时", "最后机会", "仅限今日", "马上截止", "名额有限", "仅剩",
  "亏本", "血亏", "清仓甩卖", "跳楼价", "出厂价",
  "兼职", "打字员", "挂机赚钱", "在家赚钱", "网络兼职",
  "投资", "理财", "区块链", "虚拟币", "薅羊毛",
  "美女", "约会", "视频聊天",
  "恭喜", "中奖", "领取",
  "注册机", "破解", "激活码",
];

// Suspicious patterns that score higher (multi-word patterns have stronger signal)
const PATTERNS = [
  { regex: /[!！]{3,}/, desc: "主题含多个感叹号", weight: 15 },
  { regex: /[A-Z]{8,}/, desc: "主题含连续大写字母", weight: 10 },
  { regex: /【.*】/, desc: "主题含特殊括号", weight: 5 },
  { regex: /[￥¥$]\d+万/, desc: "含金额夸张表达", weight: 15 },
];

export function getDefaultSpamWords(): string[] {
  return [...DEFAULT_SPAM_WORDS];
}

export function checkSpam(
  subject: string,
  htmlContent: string,
  customWords: string[] = []
): SpamCheckResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  const allWords = [...DEFAULT_SPAM_WORDS, ...customWords];
  const subjectLower = subject.toLowerCase();
  const htmlLower = htmlContent.toLowerCase();

  // Check spam words in subject
  for (const word of allWords) {
    if (subjectLower.includes(word.toLowerCase())) {
      issues.push(`主题含敏感词"${word}"`);
      score += 20;
    }
  }

  // Check spam words in content (lower weight for content)
  for (const word of allWords) {
    if (htmlLower.includes(word.toLowerCase())) {
      score += 5;
    }
  }

  // Check patterns in subject
  for (const pattern of PATTERNS) {
    if (pattern.regex.test(subject)) {
      issues.push(pattern.desc);
      score += pattern.weight;
    }
  }

  // Subject length checks
  if (!subject || subject.length < 2) {
    issues.push("主题为空或过短");
    score += 30;
  } else if (subject.length < 5) {
    issues.push("主题较短");
    score += 10;
  } else if (subject.length > 100) {
    issues.push("主题过长");
    score += 5;
  }

  // Content checks
  if (!htmlContent || htmlContent.length < 50) {
    issues.push("无内容");
    score += 40;
  }

  // Check unsubscribe link
  if (
    !htmlLower.includes("unsubscribe") &&
    !htmlLower.includes("退订") &&
    !htmlLower.includes("取消订阅")
  ) {
    suggestions.push("建议添加退订链接");
    score += 10;
  }

  // Check image-to-text ratio
  const imgCount = (htmlContent.match(/<img[^>]*>/gi) || []).length;
  const textLength = htmlContent.replace(/<[^>]*>/g, "").trim().length;
  if (imgCount > 3 && textLength < 100) {
    issues.push("图文比例偏高(图片为主)");
    score += 15;
  }

  // Determine quality
  let quality: SpamCheckResult["quality"];
  if (score <= 20) {
    quality = "优秀";
    suggestions.push("质量评分越高送达率越好");
  } else if (score <= 50) {
    quality = "一般";
    suggestions.push("建议优化后发送");
  } else {
    quality = "较差";
    suggestions.push("极可能进入垃圾箱，建议大幅修改");
  }

  if (issues.length === 0) {
    issues.push("未检出常见垃圾邮件特征");
  }

  return { score, quality, issues, suggestions };
}

export function checkCompliance(
  subject: string,
  htmlContent: string,
  hasUnsubscribeLink: boolean,
  hasFooter: boolean
): { passed: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!subject || subject.trim().length === 0) {
    issues.push("缺少邮件主题");
  }

  if (!htmlContent || htmlContent.trim().length < 20) {
    issues.push("邮件内容过短");
  }

  if (!hasUnsubscribeLink) {
    issues.push("缺少退订链接");
  }

  if (!hasFooter) {
    issues.push("缺少页脚信息");
  }

  return { passed: issues.length === 0, issues };
}
