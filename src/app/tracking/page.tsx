"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  MousePointerClick,
  Send,
  TrendingUp,
  BarChart3,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Summary {
  sent: number;
  opened: number;
  openRate: number;
  totalClicks: number;
  clickedContacts: number;
  clickRate: number;
}

interface PerTask {
  taskId: string;
  taskName: string;
  sent: number;
  opened: number;
  clicks: number;
}

interface ContactRow {
  contactEmail: string;
  contactName: string | null;
  customer: string | null;
  opens: number;
  lastOpenedAt: string | null;
  clicks: number;
  lastClickedAt: string | null;
  lastClickUrl: string | null;
}

interface TrackingData {
  summary: Summary;
  perTask: PerTask[];
  contacts: ContactRow[];
  tasks: { id: string; name: string }[];
}

function fmtPct(v: number): string {
  return (v * 100).toFixed(1) + "%";
}

function fmtTime(v: string | null): string {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("zh-CN");
  } catch {
    return "—";
  }
}

function truncateUrl(u: string | null, n = 42): string {
  if (!u) return "—";
  return u.length > n ? u.slice(0, n) + "…" : u;
}

export default function TrackingPage() {
  const [data, setData] = useState<TrackingData | null>(null);
  const [taskId, setTaskId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  async function load() {
    setLoading(true);
    try {
      const qs = taskId ? `?taskId=${encodeURIComponent(taskId)}` : "";
      const res = await fetch("/api/tracking" + qs);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const s = data?.summary;
  const cards = [
    {
      label: "总发送",
      value: s?.sent ?? 0,
      icon: Send,
      color: "border-l-blue-500",
      bg: "bg-blue-500/10",
      ic: "text-blue-500",
    },
    {
      label: "打开数",
      value: s?.opened ?? 0,
      sub: s ? `打开率 ${fmtPct(s.openRate)}` : "",
      icon: Eye,
      color: "border-l-green-500",
      bg: "bg-green-500/10",
      ic: "text-green-500",
    },
    {
      label: "总点击",
      value: s?.totalClicks ?? 0,
      sub: s ? `点击率 ${fmtPct(s.clickRate)}` : "",
      icon: MousePointerClick,
      color: "border-l-orange-500",
      bg: "bg-orange-500/10",
      ic: "text-orange-500",
    },
    {
      label: "点击人数",
      value: s?.clickedContacts ?? 0,
      icon: TrendingUp,
      color: "border-l-purple-500",
      bg: "bg-purple-500/10",
      ic: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">邮件追踪</h1>
          <p className="text-muted-foreground text-sm mt-1">
            打开率、链接点击与按联系人/任务的互动统计（仅对 HTML 邮件生效）
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load}>
          <TrendingUp className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      {/* 任务筛选 */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">任务筛选</span>
        <select
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">全部任务</option>
          {(data?.tasks || []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-[100px]" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* 概览卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.label} className={`border-l-4 ${c.color} shadow-sm`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{c.label}</p>
                        <p className="text-3xl font-bold mt-1">{c.value}</p>
                        {c.sub ? (
                          <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
                        ) : null}
                      </div>
                      <div className={`p-3 rounded-lg ${c.bg}`}>
                        <Icon className={`h-5 w-5 ${c.ic}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 按任务柱状图 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                各任务打开 / 点击
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.perTask || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={data!.perTask.map((t) => ({
                      name: t.taskName.length > 10 ? t.taskName.slice(0, 10) + "…" : t.taskName,
                      opened: t.opened,
                      clicks: t.clicks,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="opened" name="打开" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="clicks" name="点击" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  暂无数据
                </div>
              )}
            </CardContent>
          </Card>

          {/* 按联系人表格 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">按联系人互动明细</CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.contacts || []).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>联系人</TableHead>
                      <TableHead>客户</TableHead>
                      <TableHead>打开数</TableHead>
                      <TableHead>最后打开</TableHead>
                      <TableHead>点击数</TableHead>
                      <TableHead>最后点击</TableHead>
                      <TableHead>最近点击链接</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data!.contacts.map((c, i) => (
                      <TableRow key={c.contactEmail + i}>
                        <TableCell>
                          {c.contactName ? (
                            <span className="font-medium">{c.contactName}</span>
                          ) : null}
                          <span className={c.contactName ? "block text-muted-foreground text-xs" : ""}>
                            {c.contactEmail}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.customer || "—"}
                        </TableCell>
                        <TableCell className="text-sm">{c.opens}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {fmtTime(c.lastOpenedAt)}
                        </TableCell>
                        <TableCell className="text-sm">{c.clicks}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {fmtTime(c.lastClickedAt)}
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {c.lastClickUrl ? (
                            <a
                              href={c.lastClickUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                              title={c.lastClickUrl}
                            >
                              {truncateUrl(c.lastClickUrl)}
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  暂无追踪数据，发送邮件后即可查看打开与点击情况
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
