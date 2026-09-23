import { prisma } from "./db";

const DEFAULT_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface IntroLetterInput {
  name?: string | null;
  company?: string | null;
  country?: string | null;
  title?: string | null;
  customerProfile?: string | null;
  needs: string;
  productContext?: string | null;
  language?: "en" | "zh" | "auto";
  tone?: string | null;
  senderName?: string | null;
  senderTitle?: string | null;
  senderCompany?: string | null;
}

export async function getAiConfig(userId: string): Promise<AiConfig> {
  let overrides: Record<string, unknown> = {};
  try {
    const setting = await prisma.setting.findUnique({ where: { userId } });
    if (setting?.data) overrides = JSON.parse(setting.data);
  } catch {
    // ignore parse errors, fall back to env
  }
  const apiKey =
    (overrides.aiApiKey as string) || process.env.DEEPSEEK_API_KEY || "";
  const baseUrl = (overrides.aiBaseUrl as string) || DEFAULT_BASE_URL;
  const model = (overrides.aiModel as string) || DEFAULT_MODEL;
  return { apiKey, baseUrl, model };
}

const SYSTEM_PROMPT = `You are a senior B2B foreign-trade development email copywriter for "EGO International", a Chinese international trading company (brand: yellow logo on white background, accent color #f5b301).

Your task: write a professional, polite, personalized introductory / business-development email to a potential overseas buyer.

Strict output rules:
- Return ONLY a complete, self-contained HTML email (a full <!DOCTYPE html> document is fine, or just the body content). Use INLINE CSS styles only — email clients do not reliably support <style> blocks or external CSS.
- Design: clean, responsive, centered container with max-width ~600px, generous spacing, a subtle EGO International branded header (wordmark "EGO International" with a yellow #f5b301 accent), and a professional sign-off.
- Personalize using the recipient's name, company, country and any customer profile / research notes provided. Naturally reference the user's products, needs and value proposition — be helpful and credible, NOT spammy or over-promising.
- Keep it concise (150–280 words), warm but professional, anti-spam compliant (no ALL CAPS, no deceptive claims, clear sender identity, a simple one-line unsubscribe/reply invitation is welcome).
- Do NOT wrap the output in markdown code fences. Return raw HTML only.`;

function langInstruction(language?: "en" | "zh" | "auto"): string {
  switch (language) {
    case "zh":
      return "用简体中文撰写。";
    case "auto":
      return "根据收件人国家选择语言：英语市场默认用英文；仅当国家为华语地区时使用中文；其它情况默认英文。";
    default:
      return "Write in English (the recipient is an overseas buyer unless stated otherwise).";
  }
}

function buildUserPrompt(input: IntroLetterInput): string {
  return `Write the introductory email with these details:

[Recipient]
- Name: ${input.name || "(unknown)"}
- Company: ${input.company || "(unknown)"}
- Country / Region: ${input.country || "(unknown)"}
- Title: ${input.title || "(unknown)"}
- Customer profile / research notes: ${input.customerProfile || "(none provided)"}

[Our side — EGO International]
- Sender name: ${input.senderName || "(your name)"}
- Sender title: ${input.senderTitle || "(your title)"}
- What we offer / our needs & pitch: ${input.needs}
- Additional product context: ${input.productContext || "(none)"}

[Language] ${langInstruction(input.language)}
[Tone] ${input.tone || "professional and friendly"}

Produce the HTML email now.`;
}

function stripCodeFences(s: string): string {
  const m = s.match(/```(?:html)?\s*([\s\S]*?)```/);
  return (m ? m[1] : s).trim();
}

export async function generateIntroLetter(
  input: IntroLetterInput,
  config: AiConfig
): Promise<string> {
  if (!config.apiKey) {
    throw new Error(
      "未配置 AI API Key：请在「设置」页填写 AI API Key，或在服务端 .env 配置 DEEPSEEK_API_KEY"
    );
  }

  const url = config.baseUrl.replace(/\/+$/, "") + "/chat/completions";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input) },
        ],
        temperature: 0.7,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      let detail = text.slice(0, 300);
      try {
        const j = JSON.parse(text);
        if (j?.error?.message) detail = j.error.message;
      } catch {
        // keep raw text
      }
      throw new Error(`AI 接口返回错误 (${res.status}): ${detail}`);
    }

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content || "";
    if (!content.trim()) throw new Error("AI 返回内容为空");
    return stripCodeFences(content);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("AI 调用超时（60s），请稍后重试或换用更快的模型");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
