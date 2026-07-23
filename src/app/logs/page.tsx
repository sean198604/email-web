"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Search,
  Download,
  Trash2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

export default function LogsPage() {
  const [records, setRecords] = useState<SendRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Clear dialog
  const [showClearAlert, setShowClearAlert] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "20");
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        let filtered = data.data || [];
        setTotal(data.total || filtered.length);
        setTotalPages(data.totalPages || 1);

        // Client-side search (since API doesn't support text search)
        if (search) {
          const lower = search.toLowerCase();
          filtered = filtered.filter(
            (r: SendRecord) =>
              r.taskId?.toLowerCase().includes(lower) ||
              r.contactEmail?.toLowerCase().includes(lower) ||
              r.contactName?.toLowerCase().includes(lower) ||
              (r.accountEmail && r.accountEmail.toLowerCase().includes(lower)) ||
              (r.errorMessage && r.errorMessage.toLowerCase().includes(lower))
          );
        }

        // Client-side date filter
        if (dateFrom) {
          const from = new Date(dateFrom).getTime();
          filtered = filtered.filter(
            (r: SendRecord) => new Date(r.sentAt).getTime() >= from
          );
        }
        if (dateTo) {
          const to = new Date(dateTo + "T23:59:59").getTime();
          filtered = filtered.filter(
            (r: SendRecord) => new Date(r.sentAt).getTime() <= to
          );
        }

        setRecords(filtered);
      }
    } catch (error) {
      toast.error("获取日志失败");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearLogs = async () => {
    try {
      const res = await fetch("/api/logs", { method: "DELETE" });
      if (res.ok) {
        toast.success("日志已清空");
        setShowClearAlert(false);
        fetchLogs();
      } else {
        toast.error("清空失败");
      }
    } catch (error) {
      toast.error("清空日志失败");
    }
  };

  const handleExport = () => {
    const headers = ["ID", "任务ID", "联系人", "联系人邮箱", "客户", "发件账号", "状态", "错误信息", "时间"];
    const rows = records.map((r) =>
      [
        r.id,
        r.taskId,
        r.contactName || "",
        r.contactEmail,
        r.customer || "",
        r.accountEmail || "",
        r.status,
        r.errorMessage || "",
        new Date(r.sentAt).toLocaleString("zh-CN"),
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `send_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("导出成功");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">发送日志</h1>
          <p className="text-muted-foreground text-sm mt-1">
            查看和导出所有邮件发送记录
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={records.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            导出日志
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowClearAlert(true)}
            disabled={records.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            清空日志
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索ID、错误信息..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(v) => {
                setStatusFilter(v ?? "all");
                setPage(1);
              }}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="success">成功</SelectItem>
                  <SelectItem value="failed">失败</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-[150px]"
              />
              <span className="text-muted-foreground">至</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-[150px]"
              />
            </div>
            <div className="flex-1" />
            <span className="text-sm text-muted-foreground">
              共 {total} 条记录
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded" />
                ))}
              </div>
            </div>
          ) : records.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>任务</TableHead>
                    <TableHead>联系人</TableHead>
                    <TableHead>客户</TableHead>
                    <TableHead>账号</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="max-w-[200px]">错误信息</TableHead>
                    <TableHead>发送时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-xs">
                        {record.taskId?.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium">{record.contactName || record.contactEmail}</span>
                        {record.contactName ? (
                          <span className="block text-muted-foreground">{record.contactEmail}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {record.customer || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {record.accountEmail || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === "success" ? "default" : "destructive"
                          }
                          className={
                            record.status === "success"
                              ? "bg-green-600"
                              : ""
                          }
                        >
                          {record.status === "success" ? "成功" : "失败"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-red-500 max-w-[200px] truncate">
                        {record.errorMessage || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(record.sentAt).toLocaleString("zh-CN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    第 {page} / {totalPages} 页
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              暂无发送记录
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear Alert */}
      <AlertDialog open={showClearAlert} onOpenChange={setShowClearAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空日志</AlertDialogTitle>
            <AlertDialogDescription>
              确定要清空所有发送日志吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearLogs}>
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
