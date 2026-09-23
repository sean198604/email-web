"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Sparkles,
  Save,
  Copy,
  ArrowLeft,
  Send,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContactOption {
  id: string;
  name: string | null;
  email: string;
  customer?: string | null;
}

export default function AiIntroPage() {
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [contactId, setContactId] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("contactId") || "";
  });

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [title, setTitle] = useState("");
  const [needs, setNeeds] = useState("");
  const [productContext, setProductContext] = useState("");
  const [language, setLanguage] = useState("en");
  const [tone, setTone] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderTitle, setSenderTitle] = useState("");

  const [generating, setGenerating] = useState(false);
  const [html, setHtml] = useState("");
  const [showSource, setShowSource] = useState(false);

  // 保存为模板
  const [tplName, setTplName] = useState("");
  const [tplSubject, setTplSubject] = useState("");
  const [savingTpl, setSavingTpl] = useState(false);

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ContactOption[]) => setContacts(Array.isArray(data) ? data : []))
      .catch(() => setContacts([]));

  }, []);

  // 选中联系人后带出姓名/公司/国家/职位/调研摘要
  useEffect(() => {
    if (!contactId) return;
    fetch(`/api/contacts/${contactId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (!c) return;
        let vars: Record<string, unknown> = {};
        try {
          vars = c.variables ? JSON.parse(c.variables) : {};
        } catch {
          // ignore
        }
        setName(c.name || "");
        setCompany(c.customer || "");
        setCountry((vars.country as string) || "");
        setTitle((vars.title as string) || "");
      })
      .catch(() => {
        // ignore
      });
  }, [contactId]);

  const handleGenerate = async () => {
    if (!needs.trim()) {
      toast.error("请填写需求 / 产品卖点");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/intro-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contactId || undefined,
          name,
          company,
          country,
          title,
          needs,
          productContext,
          language,
          tone,
          senderName,
          senderTitle,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setHtml(data.html);
        if (!tplSubject)
          setTplSubject(
            company ? `Introduction - EGO International × ${company}` : "Introduction - EGO International"
          );
        if (!tplName)
          setTplName(company ? `${company} 介绍信` : "AI 介绍信");
        toast.success("介绍信已生成");
      } else {
        toast.error(data.error || "生成失败");
      }
    } catch (error) {
      toast.error("生成失败");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      toast.success("HTML 已复制");
    } catch {
      toast.error("复制失败，请手动选择");
    }
  };

  const handleSaveTemplate = async () => {
    if (!tplName.trim() || !tplSubject.trim() || !html) {
      toast.error("请先生成介绍信并填写模板名称/主题");
      return;
    }
    setSavingTpl(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tplName,
          subject: tplSubject,
          htmlContent: html,
          category: "AI 介绍信",
        }),
      });
      if (res.ok) {
        toast.success("已保存为邮件模板");
      } else {
        const err = await res.json();
        toast.error(err.error || "保存失败");
      }
    } catch (error) {
      toast.error("保存失败");
    } finally {
      setSavingTpl(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 介绍信生成
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            按客户名称与需求，调用 AI 生成专业 HTML 格式的介绍信，可直接存为模板群发
          </p>
        </div>
        <Link
          href="/contacts"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回联系人
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 表单 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">客户与需求</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>选择已有联系人（可选，自动带出资料）</Label>
              <Select value={contactId} onValueChange={(v) => setContactId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="手动填写或选择联系人" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name || c.email}
                      {c.customer ? ` · ${c.customer}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>客户姓名</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
              </div>
              <div>
                <Label>公司</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="ABC Trading Ltd." />
              </div>
              <div>
                <Label>国家 / 地区</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Germany" />
              </div>
              <div>
                <Label>职位</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Purchasing Manager" />
              </div>
            </div>
            <div>
              <Label>需求 / 产品卖点 *</Label>
              <Textarea
                value={needs}
                onChange={(e) => setNeeds(e.target.value)}
                placeholder="例如：我们主营 xx 品类，可提供 OEM/ODM、交期稳定、通过 CE 认证，希望与贵司建立长期供应合作…"
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label>补充产品背景（可选）</Label>
              <Textarea
                value={productContext}
                onChange={(e) => setProductContext(e.target.value)}
                placeholder="目标市场、认证、最小起订量、价格优势等"
                className="min-h-[70px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>语言</Label>
                <Select value={language} onValueChange={(v) => setLanguage(v ?? "en")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">英文（默认）</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="auto">自动（按国家）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>语气（可选）</Label>
                <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="专业且友好" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>发件人姓名（可选）</Label>
                <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="你的名字" />
              </div>
              <div>
                <Label>发件人职位（可选）</Label>
                <Input value={senderTitle} onChange={(e) => setSenderTitle(e.target.value)} placeholder="Sales Manager" />
              </div>
            </div>
            <Button className="w-full" onClick={handleGenerate} disabled={generating}>
              {generating ? "生成中..." : "生成介绍信"}
            </Button>
          </CardContent>
        </Card>

        {/* 预览 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">预览</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSource((s) => !s)} disabled={!html}>
                {showSource ? "预览" : "HTML 源码"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={!html}>
                <Copy className="mr-1 h-3 w-3" />
                复制
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!html ? (
              <div className="py-16 text-center text-muted-foreground text-sm">
                填写左侧需求后点击「生成介绍信」
              </div>
            ) : showSource ? (
              <Textarea value={html} readOnly className="min-h-[460px] font-mono text-xs" />
            ) : (
              <iframe
                srcDoc={html}
                title="intro-letter-preview"
                className="w-full h-[460px] border rounded-md bg-white"
                sandbox="allow-same-origin"
              />
            )}

            {html && (
              <div className="border-t pt-4 mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>模板名称</Label>
                    <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="模板名称" />
                  </div>
                  <div>
                    <Label>邮件主题</Label>
                    <Input value={tplSubject} onChange={(e) => setTplSubject(e.target.value)} placeholder="邮件主题" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveTemplate} disabled={savingTpl}>
                    <Save className="mr-2 h-4 w-4" />
                    {savingTpl ? "保存中..." : "保存为模板"}
                  </Button>
                  <Link
                    href="/tasks"
                    className={cn(buttonVariants({ variant: "outline" }))}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    去群发
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
