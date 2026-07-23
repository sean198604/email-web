"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  FileText,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface Template {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  category: string | null;
  variables: string;
  createdAt: string;
}

const categoryColors: Record<string, string> = {
  营销: "bg-blue-500/10 text-blue-600",
  通知: "bg-green-500/10 text-green-600",
  邀请: "bg-purple-500/10 text-purple-600",
  确认: "bg-orange-500/10 text-orange-600",
  问候: "bg-pink-500/10 text-pink-600",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Dialog
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState({
    name: "",
    subject: "",
    category: "",
    htmlContent: "",
    textContent: "",
  });

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      toast.error("获取模板列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const resetForm = () => {
    setForm({ name: "", subject: "", category: "", htmlContent: "", textContent: "" });
    setEditId(null);
  };

  const openNew = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEdit = (template: Template) => {
    setEditId(template.id);
    setForm({
      name: template.name,
      subject: template.subject,
      category: template.category || "",
      htmlContent: template.htmlContent,
      textContent: template.textContent || "",
    });
    setShowDialog(true);
  };

  const openClone = (template: Template) => {
    resetForm();
    setForm({
      name: `${template.name} (副本)`,
      subject: template.subject,
      category: template.category || "",
      htmlContent: template.htmlContent,
      textContent: template.textContent || "",
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    try {
      const body = {
        name: form.name,
        subject: form.subject,
        htmlContent: form.htmlContent,
        textContent: form.textContent || null,
        category: form.category || null,
      };

      let res: Response;
      if (editId) {
        res = await fetch(`/api/templates/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        toast.success(editId ? "模板已更新" : "模板创建成功");
        setShowDialog(false);
        resetForm();
        fetchTemplates();
      } else {
        const err = await res.json();
        toast.error(err.error || "保存失败");
      }
    } catch (error) {
      toast.error("保存模板失败");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/templates/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("模板已删除");
        setDeleteId(null);
        fetchTemplates();
      } else {
        toast.error("删除失败");
      }
    } catch (error) {
      toast.error("删除模板失败");
    }
  };

  const filtered = templates.filter((t) => {
    if (!search) return true;
    const lower = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(lower) ||
      t.subject.toLowerCase().includes(lower) ||
      (t.category && t.category.toLowerCase().includes(lower))
    );
  });

  const getCategoryBadge = (category: string | null) => {
    if (!category) return null;
    const style = categoryColors[category] || "bg-muted text-muted-foreground";
    return (
      <Badge className={style} variant="outline">
        {category}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">邮件模板</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-lg h-[180px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">邮件模板</h1>
          <p className="text-muted-foreground text-sm mt-1">
            管理邮件模板，支持HTML编辑和变量替换
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          新建模板
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索模板名称、主题或分类..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((template) => (
            <Card
              key={template.id}
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => openEdit(template)}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <h3 className="font-medium truncate">{template.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {template.subject}
                    </p>
                  </div>
                  {getCategoryBadge(template.category)}
                </div>
                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(template.createdAt).toLocaleString("zh-CN")}
                  </span>
                  <div
                    className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(template)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openClone(template)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(template.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {search ? "没有找到匹配的模板" : "暂无邮件模板，请新建"}
            </p>
            {!search && (
              <Button className="mt-4" onClick={openNew}>
                <Plus className="mr-2 h-4 w-4" />
                创建第一个模板
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "编辑模板" : "新建模板"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>模板名称 *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例如: 促销活动邮件"
                />
              </div>
              <div>
                <Label>邮件主题 *</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="例如: {{name}}您好，限时优惠" />
              </div>
            </div>
            <div>
              <Label>分类</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="营销">营销</SelectItem>
                  <SelectItem value="通知">通知</SelectItem>
                  <SelectItem value="邀请">邀请</SelectItem>
                  <SelectItem value="确认">确认</SelectItem>
                  <SelectItem value="问候">问候</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>HTML内容 *</Label>
              <Textarea
                value={form.htmlContent}
                onChange={(e) => setForm({ ...form, htmlContent: e.target.value })}
                placeholder="HTML邮件内容，支持 {{name}} 等变量..."
                className="min-h-[250px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                支持变量格式: {"{{name}}"}, {"{{email}}"} 等
              </p>
            </div>
            <div>
              <Label>纯文本内容（可选）</Label>
              <Textarea
                value={form.textContent}
                onChange={(e) => setForm({ ...form, textContent: e.target.value })}
                placeholder="纯文本版本，用于不支持HTML的邮件客户端..."
                className="min-h-[100px] font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editId ? "保存修改" : "创建模板"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除此模板吗？此操作不可撤销，使用该模板的任务将不受影响。
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
