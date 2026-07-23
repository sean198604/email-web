"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Server,
  Send,
  Play,
  TrendingUp,
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
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  totalContacts: number;
  totalAccounts: number;
  todaySent: number;
  activeTasks: number;
  completedTasks: number;
  trend: { date: string; count: number }[];
}

interface SendRecord {
  id: string;
  taskId: string;
  contactEmail: string;
  contactName: string | null;
  customer?: string | null;
  accountEmail: string | null;
  status: string;
  errorMessage?: string | null;
  sentAt: string;
}

const statCards = [
  {
    key: "totalContacts" as const,
    label: "联系人总数",
    icon: Users,
    color: "border-l-blue-500",
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    key: "totalAccounts" as const,
    label: "发件账号",
    icon: Server,
    color: "border-l-green-500",
    bgColor: "bg-green-500/10",
    iconColor: "text-green-500",
  },
  {
    key: "todaySent" as const,
    label: "今日发送",
    icon: Send,
    color: "border-l-orange-500",
    bgColor: "bg-orange-500/10",
    iconColor: "text-orange-500",
  },
  {
    key: "activeTasks" as const,
    label: "活跃任务",
    icon: Play,
    color: "border-l-purple-500",
    bgColor: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [records, setRecords] = useState<SendRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecords();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }

  async function fetchRecords() {
    try {
      const res = await fetch("/api/logs?page=1&pageSize=10");
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-600">成功</Badge>;
      case "failed":
        return <Badge variant="destructive">失败</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">仪表盘</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-[100px]" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">仪表盘</h1>
          <p className="text-muted-foreground text-sm mt-1">
            邮件群发系统运行概览
          </p>
        </div>
        <Button size="sm" onClick={fetchStats} variant="outline">
          <TrendingUp className="mr-2 h-4 w-4" />
          刷新数据
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats ? stats[card.key] : 0;
          return (
            <Card
              key={card.key}
              className={`border-l-4 ${card.color} shadow-sm`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {typeof value === "number"
                        ? value.toLocaleString()
                        : value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 7-day Trend & Completed */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">近7天发送趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.trend && stats.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => d.slice(5)}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(label) => `日期: ${label}`}
                    formatter={(value) => [`${value} 封`, "发送量"]}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                暂无发送数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Records */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">最近发送记录</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchRecords}>
            刷新
          </Button>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务</TableHead>
                  <TableHead>联系人</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>账号</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-xs">
                      {record.taskId?.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-xs">
                      {record.contactName ? (
                        <span className="font-medium">{record.contactName}</span>
                      ) : null}
                      <span className={record.contactName ? "block text-muted-foreground" : ""}>
                        {record.contactEmail || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {record.customer || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {record.accountEmail || "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(record.sentAt).toLocaleString("zh-CN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              暂无发送记录
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
