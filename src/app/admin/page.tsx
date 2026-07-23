"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  Users,
  Send,
  RefreshCw,
  Lock,
  Eye,
  Contact as ContactIcon,
  Mail,
  Loader2,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

interface AdminRecord {
  id: string;
  userId: string;
  taskId: string;
  contactEmail: string;
  contactName: string | null;
  accountEmail: string | null;
  status: string;
  sentAt: string;
  user: { email: string; name: string | null };
  task: { name: string } | null;
}

interface DetailAccount {
  id: string;
  name: string;
  email: string;
  host: string;
  port: number;
  secure: boolean;
  replyTo: string | null;
  dailyLimit: number;
  hourlyLimit: number;
  enabled: boolean;
  todaySent: number;
  createdAt: string;
}

interface DetailContact {
  id: string;
  name: string | null;
  email: string;
  customer: string | null;
  tags: string;
  groupId: string | null;
  group: { name: string } | null;
  createdAt: string;
}

interface UserDetail {
  user: AdminUser;
  accounts: DetailAccount[];
  contacts: DetailContact[];
  stats: {
    accountCount: number;
    contactCount: number;
    groupCount: number;
    templateCount: number;
    taskCount: number;
    sendRecordCount: number;
  };
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  // 用户详情弹窗
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<UserDetail | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function openDetail(u: AdminUser) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`);
      if (res.ok) {
        const d = await res.json();
        setDetail(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  }

  function parseTags(raw: string): string[] {
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  async function loadData() {
    setLoading(true);
    setForbidden(false);
    try {
      const uRes = await fetch("/api/admin/users");
      if (uRes.status === 403) {
        setForbidden(true);
        return;
      }
      if (uRes.ok) {
        const u = await uRes.json();
        setUsers(u.users || []);
      }
      const rRes = await fetch("/api/admin/records?pageSize=50");
      if (rRes.ok) {
        const r = await rRes.json();
        setRecords(r.data || []);
      }
    } catch (e) {
      console.error(e);
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

  const getRoleBadge = (role: string) => {
    return role === "admin" ? (
      <Badge variant="default" className="bg-purple-600">管理员</Badge>
    ) : (
      <Badge variant="secondary">用户</Badge>
    );
  };

  if (forbidden) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-purple-500" />
          系统管理
        </h1>
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-muted-foreground">
            <Lock className="h-10 w-10 mb-3" />
            <p>仅管理员可访问此页面</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-purple-500" />
          系统管理
        </h1>
        <div className="grid grid-cols-1 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-[200px]" />
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-500" />
            系统管理
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            查看所有注册用户与全站群发记录
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={loadData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      {/* 用户列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            注册用户（{users.length}）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>邮箱</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>注册时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow
                    key={u.id}
                    className="cursor-pointer"
                    onClick={() => openDetail(u)}
                  >
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>{u.name || "-"}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(u);
                        }}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        查看
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">暂无用户</div>
          )}
        </CardContent>
      </Card>

      {/* 全站发送记录 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4" />
            全站群发记录（{records.length}）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>发送者</TableHead>
                  <TableHead>任务</TableHead>
                  <TableHead>收件邮箱</TableHead>
                  <TableHead>收件人</TableHead>
                  <TableHead>发件账号</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{r.user?.email || "-"}</TableCell>
                    <TableCell className="text-xs">{r.task?.name || r.taskId?.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs">{r.contactEmail}</TableCell>
                    <TableCell className="text-xs">{r.contactName || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{r.accountEmail || "-"}</TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.sentAt).toLocaleString("zh-CN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">暂无发送记录</div>
          )}
        </CardContent>
      </Card>

      {/* 用户详情弹窗：联系人 + 绑定邮箱 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              用户详情
            </DialogTitle>
            <DialogDescription>
              {detail
                ? `${detail.user.email}${detail.user.name ? ` · ${detail.user.name}` : ""}`
                : "加载中…"}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-16 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              加载中…
            </div>
          ) : detail ? (
            <div className="space-y-6">
              {/* 统计概览 */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { label: "绑定邮箱", value: detail.stats.accountCount },
                  { label: "联系人", value: detail.stats.contactCount },
                  { label: "分组", value: detail.stats.groupCount },
                  { label: "模板", value: detail.stats.templateCount },
                  { label: "任务", value: detail.stats.taskCount },
                  { label: "发送记录", value: detail.stats.sendRecordCount },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl bg-muted/40 p-3 text-center"
                  >
                    <div className="text-lg font-semibold">{s.value}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* 绑定邮箱（发件账号） */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                  <Mail className="h-4 w-4" />
                  绑定邮箱（{detail.accounts.length}）
                </div>
                {detail.accounts.length > 0 ? (
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>名称</TableHead>
                          <TableHead>邮箱</TableHead>
                          <TableHead>SMTP 服务器</TableHead>
                          <TableHead>端口</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>日限/时限</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.accounts.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="text-xs">{a.name}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {a.email}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {a.host}
                            </TableCell>
                            <TableCell className="text-xs">
                              {a.port}
                              {a.secure ? " (SSL)" : ""}
                            </TableCell>
                            <TableCell>
                              {a.enabled ? (
                                <Badge className="bg-green-600">启用</Badge>
                              ) : (
                                <Badge variant="secondary">停用</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {a.dailyLimit}/{a.hourlyLimit}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground rounded-xl bg-muted/30">
                    该用户暂无绑定邮箱
                  </div>
                )}
              </div>

              {/* 联系人 */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                  <ContactIcon className="h-4 w-4" />
                  联系人（{detail.contacts.length}）
                </div>
                {detail.contacts.length > 0 ? (
                  <div className="rounded-xl border overflow-hidden max-h-[320px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>邮箱</TableHead>
                          <TableHead>姓名</TableHead>
                          <TableHead>客户</TableHead>
                          <TableHead>分组</TableHead>
                          <TableHead>标签</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.contacts.map((c) => {
                          const tags = parseTags(c.tags);
                          return (
                            <TableRow key={c.id}>
                              <TableCell className="font-mono text-xs">
                                {c.email}
                              </TableCell>
                              <TableCell className="text-xs">
                                {c.name || "-"}
                              </TableCell>
                              <TableCell className="text-xs">
                                {c.customer || "-"}
                              </TableCell>
                              <TableCell className="text-xs">
                                {c.group?.name || "-"}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {tags.length > 0 ? (
                                    tags.map((t, i) => (
                                      <Badge
                                        key={i}
                                        variant="secondary"
                                        className="text-[10px]"
                                      >
                                        {t}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      -
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground rounded-xl bg-muted/30">
                    该用户暂无联系人
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              加载失败，请重试
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
