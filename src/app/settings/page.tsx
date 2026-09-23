"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Settings,
  Palette,
  Database,
  Shield,
  Mail,
  Info,
  Save,
  Download,
  Upload,
  Bot,
  Contact,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { applyTheme } from "@/lib/theme";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AppSettings {
  theme?: string;
  spamWords?: string[];
  unsubscribeLink?: boolean;
  footerHtml?: string;
  language?: string;
  aiApiKey?: string;
  aiBaseUrl?: string;
  aiModel?: string;
  cardResearchUrl?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local state
  const [theme, setTheme] = useState("light");
  const [spamWords, setSpamWords] = useState("");
  const [unsubscribeLink, setUnsubscribeLink] = useState(false);
  const [footerHtml, setFooterHtml] = useState("");

  // AI 与名片宝
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiBaseUrl, setAiBaseUrl] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [cardResearchUrl, setCardResearchUrl] = useState("");

  // Import/Export
  const [importFile, setImportFile] = useState<File | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setTheme(data.theme || "light");
        setSpamWords((data.spamWords || []).join("\n"));
        setUnsubscribeLink(data.unsubscribeLink || false);
        setFooterHtml(data.footerHtml || "");
        setAiApiKey(data.aiApiKey || "");
        setAiBaseUrl(data.aiBaseUrl || "");
        setAiModel(data.aiModel || "");
        setCardResearchUrl(data.cardResearchUrl || "");
      }
    } catch (error) {
      toast.error("获取设置失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: AppSettings = {
        ...settings,
        theme,
        spamWords: spamWords
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        unsubscribeLink,
        footerHtml,
        aiApiKey: aiApiKey || undefined,
        aiBaseUrl: aiBaseUrl || undefined,
        aiModel: aiModel || undefined,
        cardResearchUrl: cardResearchUrl || undefined,
      };

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("设置已保存");
        setSettings(data);
      } else {
        toast.error("保存失败");
      }
    } catch (error) {
      toast.error("保存设置失败");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      // Export settings
      const settingsBlob = new Blob([JSON.stringify(settings, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(settingsBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `email_tool_settings_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("设置已导出");
    } catch (error) {
      toast.error("导出失败");
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("设置已导入");
        setImportFile(null);
        fetchSettings();
      } else {
        toast.error("导入失败");
      }
    } catch (error) {
      toast.error("导入失败，请检查文件格式");
    }
  };

  const handleExportAllData = async () => {
    toast.success("数据导出功能准备中...");
  };

  const handleBackup = async () => {
    toast.success("备份功能准备中...");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">设置</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[100px] bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">设置</h1>
          <p className="text-muted-foreground text-sm mt-1">
            应用配置、外观和数据管理
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "保存中..." : "保存设置"}
        </Button>
      </div>

      <Accordion multiple defaultValue={["appearance", "data", "spam", "unsubscribe", "about"]}>
        {/* Appearance */}
        <AccordionItem value="appearance">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span>外观设置</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>颜色主题</Label>
                  <Select
                    value={theme}
                    onValueChange={(v) => {
                      if (!v) return;
                      setTheme(v);
                      applyTheme(v);
                    }}
                  >
                    <SelectTrigger className="max-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">浅色模式</SelectItem>
                      <SelectItem value="dark">深色模式</SelectItem>
                      <SelectItem value="system">跟随系统</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Data Management */}
        <AccordionItem value="data">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>数据管理</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div>
                    <Label>导出数据库</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      导出所有数据为JSON格式
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportAllData}>
                    <Download className="mr-2 h-4 w-4" />
                    导出数据
                  </Button>
                </div>
                <div className="border-t pt-4">
                  <div>
                    <Label>导入数据库（恢复）</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      从导出的JSON文件恢复数据
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <Input
                      type="file"
                      accept=".json"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="max-w-[300px]"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleImport}
                      disabled={!importFile}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      导入
                    </Button>
                  </div>
                </div>
                <div className="border-t pt-4 flex items-center gap-4">
                  <div>
                    <Label>备份数据</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      创建当前状态的完整备份
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleBackup}>
                    <Database className="mr-2 h-4 w-4" />
                    创建备份
                  </Button>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Spam Words */}
        <AccordionItem value="spam">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>垃圾词设置</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label>自定义垃圾邮件敏感词</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    每行一个词，系统会结合内置词库检测发送内容
                  </p>
                </div>
                <Textarea
                  value={spamWords}
                  onChange={(e) => setSpamWords(e.target.value)}
                  placeholder={"促销\n限时抢购\n点击领取\n..."}
                  className="min-h-[150px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  已添加 {spamWords.split("\n").filter(Boolean).length} 个自定义敏感词
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Unsubscribe */}
        <AccordionItem value="unsubscribe">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>退订设置</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>默认启用退订链接</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      新建任务时默认开启退订链接
                    </p>
                  </div>
                  <Switch
                    checked={unsubscribeLink}
                    onCheckedChange={setUnsubscribeLink}
                  />
                </div>
                <div>
                  <Label>默认页脚HTML</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    新建任务时的默认页脚内容，可包含退订链接和公司信息
                  </p>
                </div>
                <Textarea
                  value={footerHtml}
                  onChange={(e) => setFooterHtml(e.target.value)}
                  placeholder={'<p style="color:#999;font-size:12px;">\n  此邮件由系统自动发送...\n</p>'}
                  className="min-h-[120px] font-mono text-sm"
                />
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* AI & 名片宝 */}
        <AccordionItem value="ai">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span>AI 介绍信 & 名片宝</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>AI 服务商</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    当前使用 DeepSeek（OpenAI 兼容协议）。未填写时回退服务端 .env 的 DEEPSEEK_API_KEY
                  </p>
                </div>
                <div>
                  <Label>AI API Key（可选，留空则用服务端密钥）</Label>
                  <Input
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="sk-...（仅本人可见，保存在本账户设置中）"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>API Base URL</Label>
                    <Input
                      value={aiBaseUrl}
                      onChange={(e) => setAiBaseUrl(e.target.value)}
                      placeholder="https://api.deepseek.com/v1"
                    />
                  </div>
                  <div>
                    <Label>模型</Label>
                    <Input
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      placeholder="deepseek-chat"
                    />
                  </div>
                </div>
                <div className="border-t pt-4">
                  <Label>名片宝地址（customer-research）</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Contact className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={cardResearchUrl}
                      onChange={(e) => setCardResearchUrl(e.target.value)}
                      placeholder="http://host.docker.internal:7004"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    名片宝（端口 7004）需正在运行。留空使用默认地址（容器内访问宿主机的 host.docker.internal:7004）
                  </p>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* About */}
        <AccordionItem value="about">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>关于</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">邮件群发工具</span>
                    <span className="text-sm text-muted-foreground">v1.0.0</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    专业高效的邮件群发桌面软件，支持多账号管理、模板编辑、垃圾邮件检测和合规发送。
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">技术栈</span>
                      <span>Next.js 15 + Tailwind CSS + SQLite</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">框架</span>
                      <span>shadcn/ui</span>
                    </div>
                    <div className="pt-1 text-sm text-muted-foreground">
                      如有问题请联系业务管理部
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
