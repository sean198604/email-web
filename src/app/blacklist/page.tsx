"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface BlacklistEntry {
  id: string;
  type: string;
  value: string;
  reason: string | null;
  createdAt: string;
}

export default function BlacklistPage() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [form, setForm] = useState({ type: "email", value: "", reason: "" });

  // Batch form
  const [batchValue, setBatchValue] = useState("");
  const [batchType, setBatchType] = useState("email");

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showClearAlert, setShowClearAlert] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/blacklist");
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (error) {
      toast.error("获取黑名单失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleAdd = async () => {
    if (!form.value.trim()) {
      toast.error("请输入值");
      return;
    }

    try {
      const res = await fetch("/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          value: form.value.trim(),
          reason: form.reason || null,
        }),
      });

      if (res.ok) {
        toast.success("已添加到黑名单");
        setForm({ type: "email", value: "", reason: "" });
        fetchEntries();
      } else {
        const err = await res.json();
        toast.error(err.error || "添加失败");
      }
    } catch (error) {
      toast.error("添加失败");
    }
  };

  const handleBatchAdd = async () => {
    const lines = batchValue
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      toast.error("请输入至少一条");
      return;
    }

    let success = 0;
    for (const line of lines) {
      try {
        await fetch("/api/blacklist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: batchType, value: line }),
        });
        success++;
      } catch {
        /* skip */
      }
    }

    toast.success(`成功添加 ${success}/${lines.length} 条`);
    setBatchValue("");
    fetchEntries();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/blacklist/${deleteId}`, { method: "DELETE" });
      toast.success("已从黑名单移除");
      setDeleteId(null);
      fetchEntries();
    } catch (error) {
      toast.error("删除失败");
    }
  };

  const handleClearAll = async () => {
    try {
      for (const entry of entries) {
        await fetch(`/api/blacklist/${entry.id}`, { method: "DELETE" });
      }
      toast.success("黑名单已清空");
      setShowClearAlert(false);
      fetchEntries();
    } catch (error) {
      toast.error("清空失败");
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "email":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600">邮箱</Badge>;
      case "domain":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600">域名</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">黑名单</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-1 animate-pulse bg-muted rounded-lg h-[200px]" />
          <div className="col-span-2 animate-pulse bg-muted rounded-lg h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">黑名单</h1>
          <p className="text-muted-foreground text-sm mt-1">
            管理邮箱和域名黑名单，系统不会向黑名单中的地址发送邮件
          </p>
        </div>
        {entries.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowClearAlert(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            清空全部
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Add Form */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              添加黑名单
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>类型</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v || "email" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">邮箱</SelectItem>
                  <SelectItem value="domain">域名</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>值 *</Label>
              <Input
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={
                  form.type === "email"
                    ? "spam@example.com"
                    : "@spam-domain.com"
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
              />
            </div>
            <div>
              <Label>原因（可选）</Label>
              <Input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="添加原因"
              />
            </div>
            <Button onClick={handleAdd} className="w-full" size="sm">
              添加
            </Button>

            <div className="border-t pt-4">
              <Label className="mb-2 block">批量添加</Label>
              <Textarea
                value={batchValue}
                onChange={(e) => setBatchValue(e.target.value)}
                placeholder="每行一个邮箱或域名..."
                className="min-h-[80px]"
              />
              <div className="mt-2">
                <Label>批量类型</Label>
                <Select value={batchType} onValueChange={(v) => v && setBatchType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">邮箱</SelectItem>
                    <SelectItem value="domain">域名</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleBatchAdd}
                className="w-full mt-2"
                size="sm"
                variant="outline"
                disabled={!batchValue.trim()}
              >
                批量添加
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              黑名单列表 ({entries.length}条)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {entries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>类型</TableHead>
                    <TableHead>值</TableHead>
                    <TableHead>原因</TableHead>
                    <TableHead>添加时间</TableHead>
                    <TableHead className="w-[60px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{getTypeBadge(entry.type)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {entry.value}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.reason || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString("zh-CN")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(entry.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                黑名单为空
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认移除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要从黑名单中移除此项吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>确认移除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Alert */}
      <AlertDialog open={showClearAlert} onOpenChange={setShowClearAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空黑名单</AlertDialogTitle>
            <AlertDialogDescription>
              确定要清空所有黑名单条目吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll}>
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
