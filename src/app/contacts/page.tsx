"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Upload,
  Search,
  Trash2,
  FolderInput,
  ShieldBan,
  Pencil,
  GitMerge,
  Sparkles,
  Contact,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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

interface Contact {
  id: string;
  name: string | null;
  email: string;
  tags: string;
  customer?: string | null;
  groupId: string | null;
  group?: { id: string; name: string };
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  _count: { contacts: number };
  createdAt: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
  errors?: string[];
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    tags: "",
    customer: "",
    groupId: "",
  });
  const [editId, setEditId] = useState<string | null>(null);

  const [groupForm, setGroupForm] = useState({ name: "", description: "" });
  const [editGroupId, setEditGroupId] = useState<string | null>(null);

  const [mergeSourceId, setMergeSourceId] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");

  // Import
  const [importPreview, setImportPreview] = useState<Record<string, string>[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  // 名片宝导入
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [cardBaseUrl, setCardBaseUrl] = useState("");
  const [cardTesting, setCardTesting] = useState(false);
  const [cardTest, setCardTest] = useState<{ ok: boolean; count?: number; error?: string } | null>(null);
  const [cardImporting, setCardImporting] = useState(false);
  const [cardResult, setCardResult] = useState<ImportResult | null>(null);
  const [cardGroupId, setCardGroupId] = useState("");

  // Bulk action state
  const [bulkGroupId, setBulkGroupId] = useState("");

  const fetchContacts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/contacts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (error) {
      toast.error("获取联系人列表失败");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (error) {
      toast.error("获取分组列表失败");
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchGroups();
  }, [fetchContacts, fetchGroups]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    }
  };

  // Add/Edit contact
  const handleAddContact = async () => {
    try {
      const body: Record<string, unknown> = {
        name: formData.name || null,
        email: formData.email,
        tags: formData.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        groupId: formData.groupId || null,
        customer: formData.customer || null,
      };

      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("联系人添加成功");
        setShowAddDialog(false);
        setFormData({ name: "", email: "", tags: "", customer: "", groupId: "" });
        fetchContacts();
      } else {
        const err = await res.json();
        toast.error(err.error || "添加失败");
      }
    } catch (error) {
      toast.error("添加联系人失败");
    }
  };

  const handleEditContact = async () => {
    if (!editId) return;
    try {
      const body: Record<string, unknown> = {
        name: formData.name || null,
        email: formData.email,
        tags: formData.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        groupId: formData.groupId || null,
        customer: formData.customer || null,
      };

      const res = await fetch(`/api/contacts/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("联系人已更新");
        setShowEditDialog(false);
        setEditId(null);
        setFormData({ name: "", email: "", tags: "", customer: "", groupId: "" });
        fetchContacts();
      } else {
        toast.error("更新失败");
      }
    } catch (error) {
      toast.error("更新联系人失败");
    }
  };

  const openEdit = (contact: Contact) => {
    setEditId(contact.id);
    const tags: string[] = contact.tags ? JSON.parse(contact.tags) : [];
    setFormData({
      name: contact.name || "",
      email: contact.email,
      tags: tags.join(", "),
      customer: contact.customer || "",
      groupId: contact.groupId || "",
    });
    setShowEditDialog(true);
  };

  // Delete contacts
  const handleDeleteSelected = async () => {
    try {
      for (const id of selectedIds) {
        await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      }
      toast.success(`已删除 ${selectedIds.size} 个联系人`);
      setSelectedIds(new Set());
      setShowDeleteAlert(false);
      fetchContacts();
    } catch (error) {
      toast.error("删除失败");
    }
  };

  // Bulk move to group
  const handleBulkMove = async () => {
    if (!bulkGroupId) return;
    try {
      for (const id of selectedIds) {
        await fetch(`/api/contacts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupId: bulkGroupId }),
        });
      }
      toast.success(`已将 ${selectedIds.size} 个联系人移至目标分组`);
      setSelectedIds(new Set());
      fetchContacts();
    } catch (error) {
      toast.error("移动失败");
    }
  };

  // Bulk add to blacklist
  const handleBulkBlacklist = async () => {
    try {
      for (const id of selectedIds) {
        const contact = contacts.find((c) => c.id === id);
        if (contact) {
          await fetch("/api/blacklist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "email", value: contact.email, reason: "批量添加" }),
          });
        }
      }
      toast.success(`已将 ${selectedIds.size} 个联系人加入黑名单`);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error("操作失败");
    }
  };

  // Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const buf = new Uint8Array(ev.target?.result as ArrayBuffer);
      // 优先 UTF-8 解码；若含替换符（非法 UTF-8，多为 Excel 导出的 GBK/ANSI 编码），回退 GBK 解码
      const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buf);
      let text = utf8.includes("�")
        ? new TextDecoder("gbk").decode(buf)
        : utf8;
      text = text.replace(/^\uFEFF/, ""); // 去除可能的 UTF-8 BOM
      const lines = text.split("\n").filter(Boolean);
      if (lines.length > 0) {
        const headers = lines[0].split(",").map((h) => h.trim());
        const rows = lines.slice(1).map((line) => {
          const values = line.split(",");
          const row: Record<string, string> = {};
          headers.forEach((h, i) => {
            row[h] = values[i]?.trim() || "";
          });
          return row;
        });
        setImportPreview(rows);
        setImportResult(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const items = importPreview.map((row) => ({
        name: row.name || row.姓名 || null,
        email: row.email || row.邮箱 || row.Email || "",
        customer: row.customer || row.客户 || null,
        tags: row.tags
          ? row.tags.split(",").map((s) => s.trim())
          : [],
        // "none" 表示不指定分组，必须转为 null（否则会传入字面量 "none" 导致外键错误）
        groupId:
          formData.groupId && formData.groupId !== "none"
            ? formData.groupId
            : null,
      }));

      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      });

      if (res.ok) {
        const result = await res.json();
        setImportResult(result);
        if (result.imported > 0) {
          toast.success(`成功导入 ${result.imported} 条`);
          fetchContacts();
        }
        if (result.warnings && result.warnings.length > 0) {
          toast.warning(
            `有 ${result.warnings.length} 条联系人的分组不存在，已放入「未分组」`
          );
        }
      } else {
        toast.error("导入失败");
      }
    } catch (error) {
      toast.error("导入失败");
    } finally {
      setImporting(false);
    }
  };

  // 名片宝导入：测试连接 + 执行导入
  const testCardConnection = async () => {
    setCardTesting(true);
    setCardTest(null);
    try {
      const params = new URLSearchParams();
      if (cardBaseUrl.trim()) params.set("baseUrl", cardBaseUrl.trim());
      const res = await fetch(`/api/contacts/import-cardresearch?${params}`);
      const data = await res.json();
      setCardTest(data);
      if (!data.ok) {
        toast.error(data.error || "连接名片宝失败");
      } else {
        toast.success(`连接成功，名片宝共有 ${data.count} 条客户档案`);
      }
    } catch (error) {
      toast.error("连接名片宝失败");
    } finally {
      setCardTesting(false);
    }
  };

  const importFromCard = async () => {
    setCardImporting(true);
    setCardResult(null);
    try {
      const res = await fetch("/api/contacts/import-cardresearch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: cardBaseUrl.trim() || undefined,
          groupId: cardGroupId && cardGroupId !== "none" ? cardGroupId : null,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setCardResult(result);
        if (result.imported > 0) {
          toast.success(`已从名片宝导入 ${result.imported} 条`);
          fetchContacts();
        } else {
          toast.info("没有新导入的记录（可能已全部存在）");
        }
        if (result.errors && result.errors.length > 0) {
          toast.warning(`${result.errors.length} 条导入出错`);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "导入失败");
      }
    } catch (error) {
      toast.error("从名片宝导入失败");
    } finally {
      setCardImporting(false);
    }
  };

  // Group management
  const handleCreateGroup = async () => {
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupForm),
      });

      if (res.ok) {
        toast.success("分组创建成功");
        setShowGroupDialog(false);
        setGroupForm({ name: "", description: "" });
        fetchGroups();
      } else {
        toast.error("创建失败");
      }
    } catch (error) {
      toast.error("创建分组失败");
    }
  };

  const handleEditGroup = async () => {
    if (!editGroupId) return;
    try {
      const res = await fetch(`/api/groups/${editGroupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupForm),
      });

      if (res.ok) {
        toast.success("分组已更新");
        setShowGroupDialog(false);
        setEditGroupId(null);
        setGroupForm({ name: "", description: "" });
        fetchGroups();
      } else {
        toast.error("更新失败");
      }
    } catch (error) {
      toast.error("更新分组失败");
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await fetch(`/api/groups/${id}`, { method: "DELETE" });
      toast.success("分组已删除");
      fetchGroups();
    } catch (error) {
      toast.error("删除分组失败");
    }
  };

  const handleMergeGroups = async () => {
    if (!mergeSourceId || !mergeTargetId) return;
    try {
      const res = await fetch(`/api/groups/${mergeSourceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "merge", targetGroupId: mergeTargetId }),
      });

      if (res.ok) {
        toast.success("分组已合并");
        setShowMergeDialog(false);
        setMergeSourceId("");
        setMergeTargetId("");
        fetchGroups();
      } else {
        toast.error("合并失败");
      }
    } catch (error) {
      toast.error("合并分组失败");
    }
  };

  const openEditGroup = (group: Group) => {
    setEditGroupId(group.id);
    setGroupForm({
      name: group.name,
      description: group.description || "",
    });
    setShowGroupDialog(true);
  };

  const getGroupName = (groupId: string | null) => {
    if (!groupId) return "-";
    const group = groups.find((g) => g.id === groupId);
    return group?.name || "-";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">联系人管理</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/3" />
          <div className="h-[400px] bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">联系人管理</h1>
          <p className="text-muted-foreground text-sm mt-1">
            管理联系人及分组，支持批量导入和操作
          </p>
        </div>
      </div>

      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts">联系人列表</TabsTrigger>
          <TabsTrigger value="groups">分组管理</TabsTrigger>
        </TabsList>

        {/* Contacts List Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索姓名或邮箱..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      添加联系人
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>添加联系人</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label>姓名</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="请输入姓名"
                        />
                      </div>
                      <div>
                        <Label>邮箱 *</Label>
                        <Input
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="请输入邮箱"
                          required
                        />
                      </div>
                      <div>
                        <Label>标签（逗号分隔）</Label>
                        <Input
                          value={formData.tags}
                          onChange={(e) =>
                            setFormData({ ...formData, tags: e.target.value })
                          }
                          placeholder="例如: VIP, 客户, 活跃"
                        />
                      </div>
                      <div>
                        <Label>客户</Label>
                        <Input
                          value={formData.customer}
                          onChange={(e) =>
                            setFormData({ ...formData, customer: e.target.value })
                          }
                          placeholder="例如: XX公司"
                        />
                      </div>
                      <div>
                        <Label>分组</Label>
                        <Select
                          value={formData.groupId}
                          onValueChange={(v) =>
                            setFormData({ ...formData, groupId: v ?? "" })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择分组" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">无</SelectItem>
                            {groups.map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        取消
                      </Button>
                      <Button onClick={handleAddContact}>确定添加</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                  <DialogTrigger>
                    <Button variant="outline" size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      导入
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>导入联系人</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>选择CSV文件</Label>
                        <Input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleFileUpload}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          CSV格式要求: 首行为列名(name/姓名, email/邮箱, customer/客户等)，支持 name, email, tags, customer 列
                        </p>
                      </div>

                      {importPreview.length > 0 && (
                        <div>
                          <Label>数据预览（共{importPreview.length}条）</Label>
                          <div className="border rounded-md max-h-[200px] overflow-auto mt-1">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {Object.keys(importPreview[0] || {}).map((key) => (
                                    <TableHead key={key}>{key}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {importPreview.slice(0, 20).map((row, i) => (
                                  <TableRow key={i}>
                                    {Object.values(row).map((val, j) => (
                                      <TableCell key={j} className="text-xs">
                                        {val}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {importResult && (
                        <div className="p-3 rounded-md bg-muted">
                          <p>导入结果: 成功 {importResult.imported} 条, 跳过 {importResult.skipped} 条（共 {importResult.total} 条）</p>
                          {importResult.errors && importResult.errors.length > 0 && (
                            <div className="mt-2 text-xs text-destructive">
                              {importResult.errors.slice(0, 5).map((err, i) => (
                                <p key={i}>{err}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <Label>导入到分组</Label>
                        <Select
                          value={formData.groupId}
                          onValueChange={(v) =>
                            setFormData({ ...formData, groupId: v ?? "" })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择分组" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">不指定</SelectItem>
                            {groups.map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowImportDialog(false);
                          setImportPreview([]);
                          setImportResult(null);
                        }}
                      >
                        取消
                      </Button>
                      <Button
                        onClick={handleImport}
                        disabled={importPreview.length === 0 || importing}
                      >
                        {importing ? "导入中..." : "确认导入"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Link
                  href="/ai-intro"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI 介绍信
                </Link>

                <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
                  <DialogTrigger>
                    <Button variant="outline" size="sm">
                      <Contact className="mr-2 h-4 w-4" />
                      从名片宝导入
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>从名片宝导入客户档案</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>名片宝地址</Label>
                        <Input
                          value={cardBaseUrl}
                          onChange={(e) => setCardBaseUrl(e.target.value)}
                          placeholder="http://host.docker.internal:7004（默认）"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          名片宝（customer-research, 端口 7004）需正在运行。容器间用 host.docker.internal 访问宿主机。
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={testCardConnection} disabled={cardTesting}>
                          {cardTesting ? "测试中..." : "测试连接"}
                        </Button>
                        {cardTest && (
                          <span className={cardTest.ok ? "text-xs text-green-600" : "text-xs text-destructive"}>
                            {cardTest.ok ? `已连接，共 ${cardTest.count} 条` : cardTest.error}
                          </span>
                        )}
                      </div>
                      <div>
                        <Label>导入到分组</Label>
                        <Select value={cardGroupId} onValueChange={(v) => setCardGroupId(v ?? "")}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择分组" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">不指定</SelectItem>
                            {groups.map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {cardResult && (
                        <div className="p-3 rounded-md bg-muted text-sm">
                          <p>
                            导入结果：成功 {cardResult.imported} 条，跳过 {cardResult.skipped} 条（共 {cardResult.total} 条）
                          </p>
                          {cardResult.errors && cardResult.errors.length > 0 && (
                            <div className="mt-2 text-xs text-destructive">
                              {cardResult.errors.slice(0, 5).map((err, i) => (
                                <p key={i}>{err}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCardDialog(false)}>
                        关闭
                      </Button>
                      <Button onClick={importFromCard} disabled={cardImporting || !cardTest?.ok}>
                        {cardImporting ? "导入中..." : "开始导入"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Bulk Actions */}
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    已选择 {selectedIds.size} 项
                  </span>
                  <Select value={bulkGroupId} onValueChange={(v) => v && setBulkGroupId(v)}>
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                      <SelectValue placeholder="移动到分组..." />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={handleBulkMove} disabled={!bulkGroupId}>
                    <FolderInput className="mr-1 h-3 w-3" />
                    移动
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBulkBlacklist}>
                    <ShieldBan className="mr-1 h-3 w-3" />
                    加入黑名单
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowDeleteAlert(true)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    批量删除
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {contacts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            selectedIds.size === contacts.length &&
                            contacts.length > 0
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead>邮箱</TableHead>
                      <TableHead>标签</TableHead>
                      <TableHead>客户</TableHead>
                      <TableHead>分组</TableHead>
                      <TableHead className="w-[100px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => {
                      const tags: string[] = contact.tags
                        ? JSON.parse(contact.tags)
                        : [];
                      return (
                        <TableRow key={contact.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(contact.id)}
                              onCheckedChange={() => toggleSelect(contact.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {contact.name || "-"}
                          </TableCell>
                          <TableCell>{contact.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {tags.map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{contact.customer || "-"}</TableCell>
                          <TableCell>{getGroupName(contact.groupId)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(contact)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Link
                                href={`/ai-intro?contactId=${contact.id}`}
                                title="写 AI 介绍信"
                                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                              >
                                <Sparkles className="h-3 w-3" />
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  暂无联系人
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">分组列表</CardTitle>
              <div className="flex gap-2">
                <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
                  <DialogTrigger>
                    <Button variant="outline" size="sm">
                      <GitMerge className="mr-2 h-4 w-4" />
                      合并分组
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>合并分组</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label>源分组</Label>
                        <Select value={mergeSourceId} onValueChange={(v) => v && setMergeSourceId(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择源分组" />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.name} ({g._count?.contacts || 0})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>目标分组</Label>
                        <Select value={mergeTargetId} onValueChange={(v) => v && setMergeTargetId(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择目标分组" />
                          </SelectTrigger>
                          <SelectContent>
                            {groups
                              .filter((g) => g.id !== mergeSourceId)
                              .map((g) => (
                                <SelectItem key={g.id} value={g.id}>
                                  {g.name} ({g._count?.contacts || 0})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowMergeDialog(false)}>
                        取消
                      </Button>
                      <Button onClick={handleMergeGroups} disabled={!mergeSourceId || !mergeTargetId}>
                        确认合并
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
                  <DialogTrigger>
                    <Button size="sm" onClick={() => {
                      setEditGroupId(null);
                      setGroupForm({ name: "", description: "" });
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      创建分组
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editGroupId ? "编辑分组" : "创建分组"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label>名称 *</Label>
                        <Input
                          value={groupForm.name}
                          onChange={(e) =>
                            setGroupForm({ ...groupForm, name: e.target.value })
                          }
                          placeholder="分组名称"
                        />
                      </div>
                      <div>
                        <Label>描述</Label>
                        <Textarea
                          value={groupForm.description}
                          onChange={(e) =>
                            setGroupForm({
                              ...groupForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="分组描述（可选）"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowGroupDialog(false)}>
                        取消
                      </Button>
                      <Button
                        onClick={editGroupId ? handleEditGroup : handleCreateGroup}
                      >
                        确定
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {groups.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>联系人数量</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="w-[120px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {group.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {group._count?.contacts || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(group.createdAt).toLocaleString("zh-CN")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditGroup(group)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGroup(group.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  暂无分组，请创建第一个分组
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Contact Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑联系人</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>姓名</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>邮箱 *</Label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label>标签（逗号分隔）</Label>
              <Input
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
              />
            </div>
            <div>
              <Label>客户</Label>
              <Input
                value={formData.customer}
                onChange={(e) =>
                  setFormData({ ...formData, customer: e.target.value })
                }
                placeholder="例如: XX公司"
              />
            </div>
            <div>
              <Label>分组</Label>
              <Select
                value={formData.groupId}
                onValueChange={(v) =>
                  setFormData({ ...formData, groupId: v ?? "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分组" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleEditContact}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除选中的 {selectedIds.size} 个联系人吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
