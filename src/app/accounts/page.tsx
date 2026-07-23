"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Server,
  PlugZap,
  RotateCcw,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
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

interface Account {
  id: string;
  name: string;
  email: string;
  host: string;
  port: number;
  secure: boolean;
  authUser: string;
  authPass: string;
  replyTo: string | null;
  dailyLimit: number;
  hourlyLimit: number;
  sendInterval: number;
  weight: number;
  enabled: boolean;
  todaySent: number;
  todaySentDate: string | null;
  createdAt: string;
}

const defaultForm = {
  name: "",
  email: "",
  host: "smtp.exmail.qq.com",
  port: 465,
  secure: true,
  authUser: "",
  authPass: "",
  replyTo: "",
  dailyLimit: 500,
  hourlyLimit: 50,
  sendInterval: 3000,
  weight: 1,
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState(defaultForm);
  const [testing, setTesting] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (error) {
      toast.error("获取账号列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditId(null);
  };

  const openNew = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEdit = (account: Account) => {
    setEditId(account.id);
    setForm({
      name: account.name,
      email: account.email,
      host: account.host,
      port: account.port,
      secure: account.secure,
      authUser: account.authUser,
      authPass: account.authPass,
      replyTo: account.replyTo || "",
      dailyLimit: account.dailyLimit,
      hourlyLimit: account.hourlyLimit,
      sendInterval: account.sendInterval,
      weight: account.weight,
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    try {
      const body = {
        ...form,
        replyTo: form.replyTo || null,
      };

      let res: Response;
      if (editId) {
        res = await fetch(`/api/accounts/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        toast.success(editId ? "账号已更新" : "账号创建成功");
        setShowDialog(false);
        resetForm();
        fetchAccounts();
      } else {
        const err = await res.json();
        toast.error(err.error || "保存失败");
      }
    } catch (error) {
      toast.error("保存账号失败");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/accounts/${deleteId}`, { method: "DELETE" });
      toast.success("账号已删除");
      setDeleteId(null);
      fetchAccounts();
    } catch (error) {
      toast.error("删除失败");
    }
  };

  const handleToggle = async (account: Account) => {
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !account.enabled }),
      });

      if (res.ok) {
        toast.success(account.enabled ? "账号已禁用" : "账号已启用");
        fetchAccounts();
      } else {
        toast.error("操作失败");
      }
    } catch (error) {
      toast.error("操作失败");
    }
  };

  const handleTestConnection = async (id: string) => {
    setTesting(true);
    try {
      const res = await fetch(`/api/accounts/${id}?action=test`, {
        method: "POST",
      });
      const result = await res.json();

      if (result.success) {
        toast.success(`连接成功 - ${result.message || "SMTP连接正常"}`);
      } else {
        toast.error(`连接失败 - ${result.error || "无法连接"}`);
      }
    } catch (error) {
      toast.error("测试连接失败");
    } finally {
      setTesting(false);
    }
  };

  const handleResetCount = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todaySent: 0 }),
      });

      if (res.ok) {
        toast.success("每日计数已重置");
        fetchAccounts();
      } else {
        toast.error("重置失败");
      }
    } catch (error) {
      toast.error("重置失败");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">账号管理</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-lg h-[200px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">账号管理</h1>
          <p className="text-muted-foreground text-sm mt-1">
            管理SMTP发件账号，支持连接测试和多策略发送
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              添加账号
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "编辑账号" : "添加SMTP账号"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>名称 *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="例如: 企业邮箱主账号"
                  />
                </div>
                <div>
                  <Label>邮箱地址 *</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="sender@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label>SMTP主机 *</Label>
                  <Input
                    value={form.host}
                    onChange={(e) => setForm({ ...form, host: e.target.value })}
                    placeholder="smtp.exmail.qq.com"
                  />
                </div>
                <div>
                  <Label>端口</Label>
                  <Input
                    type="number"
                    value={form.port}
                    onChange={(e) =>
                      setForm({ ...form, port: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.secure}
                    onCheckedChange={(v) => setForm({ ...form, secure: v })}
                  />
                  <Label>SSL/TLS加密</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>认证用户 *</Label>
                  <Input
                    value={form.authUser}
                    onChange={(e) =>
                      setForm({ ...form, authUser: e.target.value })
                    }
                    placeholder="通常与邮箱相同"
                  />
                </div>
                <div>
                  <Label>认证密码 *</Label>
                  <Input
                    type="password"
                    value={form.authPass}
                    onChange={(e) =>
                      setForm({ ...form, authPass: e.target.value })
                    }
                    placeholder="SMTP密码或授权码"
                  />
                </div>
              </div>
              <div>
                <Label>回复地址（可选）</Label>
                <Input
                  value={form.replyTo}
                  onChange={(e) => setForm({ ...form, replyTo: e.target.value })}
                  placeholder="reply@example.com"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>每日限额</Label>
                  <Input
                    type="number"
                    value={form.dailyLimit}
                    onChange={(e) =>
                      setForm({ ...form, dailyLimit: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>每小时限额</Label>
                  <Input
                    type="number"
                    value={form.hourlyLimit}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        hourlyLimit: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>发送间隔 (ms)</Label>
                  <Input
                    type="number"
                    value={form.sendInterval}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sendInterval: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>权重（用于加权策略）</Label>
                <Input
                  type="number"
                  value={form.weight}
                  onChange={(e) =>
                    setForm({ ...form, weight: Number(e.target.value) })
                  }
                  min={1}
                  max={100}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit}>
                {editId ? "保存修改" : "添加账号"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Account Cards */}
      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className={!account.enabled ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">{account.name}</CardTitle>
                    <Badge
                      variant={account.enabled ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {account.enabled ? "启用" : "禁用"}
                    </Badge>
                  </div>
                  <Switch
                    checked={account.enabled}
                    onCheckedChange={() => handleToggle(account)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">邮箱</span>
                    <span>{account.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">服务器</span>
                    <span className="font-mono">
                      {account.host}:{account.port}
                      {account.secure ? " (SSL)" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">每日用量</span>
                    <span>
                      <span
                        className={
                          account.todaySent >= account.dailyLimit
                            ? "text-destructive font-medium"
                            : ""
                        }
                      >
                        {account.todaySent}
                      </span>
                      {" / "}
                      {account.dailyLimit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">发送间隔</span>
                    <span>{account.sendInterval}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">权重</span>
                    <span>{account.weight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">创建时间</span>
                    <span className="text-xs">
                      {new Date(account.createdAt).toLocaleString("zh-CN")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(account.id)}
                    disabled={testing}
                  >
                    <PlugZap className="mr-2 h-3 w-3" />
                    {testing ? "测试中..." : "测试连接"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetCount(account.id)}
                  >
                    <RotateCcw className="mr-2 h-3 w-3" />
                    重置计数
                  </Button>
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(account)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(account.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">暂无发件账号，请添加SMTP账号</p>
            <Button className="mt-4" onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              添加第一个账号
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除此账号吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
