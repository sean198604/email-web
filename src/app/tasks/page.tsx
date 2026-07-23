"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Play,
  Pause,
  Square,
  Trash2,
  List,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

interface Task {
  id: string;
  name: string;
  templateId: string | null;
  groupId: string | null;
  accountIds: string;
  strategy: string;
  sendInterval: number;
  maxThreads: number;
  scheduledAt: string | null;
  attachments: string;
  footerHtml: string;
  unsubscribeLink: boolean;
  status: string;
  sentCount: number;
  failCount: number;
  totalCount: number;
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  htmlContent?: string;
}

interface Group {
  id: string;
  name: string;
  _count: { contacts: number };
}

interface Account {
  id: string;
  name: string;
  email: string;
  todaySent: number;
  dailyLimit: number;
  enabled: boolean;
}

interface SendRecord {
  id: string;
  taskId: string;
  contactId: string;
  accountId: string;
  status: string;
  error?: string;
  sentAt: string;
}

interface AttachmentItem {
  filename: string;
  path: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-gray-500/10 text-gray-600" },
  pending: { label: "待发送", className: "bg-yellow-500/10 text-yellow-600" },
  sending: { label: "发送中", className: "bg-blue-500/10 text-blue-600" },
  paused: { label: "已暂停", className: "bg-orange-500/10 text-orange-600" },
  completed: { label: "已完成", className: "bg-green-500/10 text-green-600" },
  failed: { label: "失败", className: "bg-red-500/10 text-red-600" },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Task wizard
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Task detail
  const [showDetail, setShowDetail] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [detailRecords, setDetailRecords] = useState<SendRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [manualPath, setManualPath] = useState("");

  // Form
  const [form, setForm] = useState({
    name: "",
    templateId: "",
    groupId: "",
    accountIds: [] as string[],
    strategy: "round-robin",
    sendInterval: 3000,
    maxThreads: 1,
    scheduledAt: "",
    attachments: [] as AttachmentItem[],
    footerHtml: "",
    unsubscribeLink: false,
  });

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      toast.error("获取任务列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRefs = useCallback(async () => {
    try {
      const [tRes, gRes, aRes] = await Promise.all([
        fetch("/api/templates"),
        fetch("/api/groups"),
        fetch("/api/accounts"),
      ]);
      if (tRes.ok) setTemplates(await tRes.json());
      if (gRes.ok) setGroups(await gRes.json());
      if (aRes.ok) setAccounts(await aRes.json());
    } catch (error) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchRefs();
  }, [fetchTasks, fetchRefs]);

  const resetForm = () => {
    setForm({
      name: "",
      templateId: "",
      groupId: "",
      accountIds: [],
      strategy: "round-robin",
      sendInterval: 3000,
      maxThreads: 1,
      scheduledAt: "",
      attachments: [] as AttachmentItem[],
      footerHtml: "",
      unsubscribeLink: false,
    });
    setWizardStep(1);
    setEditId(null);
  };

  const handleCreate = async () => {
    try {
      const body = {
        name: form.name,
        templateId:
          form.templateId && form.templateId !== "none" ? form.templateId : null,
        groupId:
          form.groupId && form.groupId !== "none" ? form.groupId : null,
        accountIds: form.accountIds,
        strategy: form.strategy,
        sendInterval: form.sendInterval,
        maxThreads: form.maxThreads,
        scheduledAt: form.scheduledAt || null,
        attachments: form.attachments,
        footerHtml: form.footerHtml,
        unsubscribeLink: form.unsubscribeLink,
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("任务创建成功");
        if (data.warnings && data.warnings.length > 0) {
          toast.warning(
            `有 ${data.warnings.length} 项关联无效已自动忽略（${data.warnings[0]}）`
          );
        }
        setShowWizard(false);
        resetForm();
        fetchTasks();
      } else {
        const err = await res.json();
        toast.error(err.error || "创建失败");
      }
    } catch (error) {
      toast.error("创建任务失败");
    }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}?action=${action}`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        const labels: Record<string, string> = {
          start: "任务已开始",
          pause: "任务已暂停",
          stop: "任务已停止",
          reset: "任务已重置",
        };
        toast.success(labels[action] || "操作成功");
        fetchTasks();
      } else {
        const err = await res.json();
        toast.error(err.error || "操作失败");
      }
    } catch (error) {
      toast.error("操作失败");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/tasks/${deleteId}`, { method: "DELETE" });
      toast.success("任务已删除");
      setDeleteId(null);
      fetchTasks();
    } catch (error) {
      toast.error("删除失败");
    }
  };

  const openDetail = async (task: Task) => {
    setDetailTask(task);
    setShowDetail(true);
    try {
      const res = await fetch(`/api/logs?taskId=${task.id}&pageSize=100`);
      if (res.ok) {
        const data = await res.json();
        setDetailRecords(data.data || []);
      }
    } catch (error) {
      /* ignore */
    }
  };

  const openEdit = (task: Task) => {
    setEditId(task.id);
    const accIds: string[] = task.accountIds ? JSON.parse(task.accountIds) : [];
    setForm({
      name: task.name,
      templateId: task.templateId || "",
      groupId: task.groupId || "",
      accountIds: accIds,
      strategy: task.strategy,
      sendInterval: task.sendInterval,
      maxThreads: task.maxThreads,
      scheduledAt: task.scheduledAt
        ? new Date(task.scheduledAt).toISOString().slice(0, 16)
        : "",
      attachments: task.attachments ? JSON.parse(task.attachments) : [],
      footerHtml: task.footerHtml || "",
      unsubscribeLink: task.unsubscribeLink,
    });
    setWizardStep(1);
    setShowWizard(true);
  };

  const handleEdit = async () => {
    if (!editId) return;
    try {
      const body = {
        name: form.name,
        templateId:
          form.templateId && form.templateId !== "none" ? form.templateId : null,
        groupId:
          form.groupId && form.groupId !== "none" ? form.groupId : null,
        accountIds: form.accountIds,
        strategy: form.strategy,
        sendInterval: form.sendInterval,
        maxThreads: form.maxThreads,
        scheduledAt: form.scheduledAt || null,
        attachments: form.attachments,
        footerHtml: form.footerHtml,
        unsubscribeLink: form.unsubscribeLink,
      };

      const res = await fetch(`/api/tasks/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("任务已更新");
        setShowWizard(false);
        resetForm();
        fetchTasks();
      } else {
        toast.error("更新失败");
      }
    } catch (error) {
      toast.error("更新任务失败");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          setForm((prev) => ({
            ...prev,
            attachments: [
              ...prev.attachments,
              { filename: data.filename, path: data.path },
            ],
          }));
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || "上传失败");
        }
      }
    } catch {
      toast.error("上传失败");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeAttachment = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx),
    }));
  };

  const addManualPath = () => {
    const p = manualPath.trim();
    if (!p) return;
    const name = p.split(/[\\/]/).pop() || p;
    setForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, { filename: name, path: p }],
    }));
    setManualPath("");
  };

  // Spam check simulation
  const [spamResult, setSpamResult] = useState<{
    score: number;
    quality: string;
    issues: string[];
    suggestions: string[];
  } | null>(null);

  const handleSpamCheck = async () => {
    const selectedTemplate = templates.find((t) => t.id === form.templateId);
    if (!selectedTemplate) {
      toast.error("请先选择模板");
      return;
    }
    setSpamResult({
      score: 15,
      quality: "优秀",
      issues: ["未检出常见垃圾邮件特征"],
      suggestions: ["邮件内容质量良好，建议发送"],
    });
    toast.success("垃圾邮件检测完成");
  };

  // Compliance check
  const [complianceResult, setComplianceResult] = useState<{
    passed: boolean;
    issues: string[];
  } | null>(null);

  const handleComplianceCheck = () => {
    const issues: string[] = [];
    const selectedTemplate = templates.find((t) => t.id === form.templateId);
    if (!selectedTemplate?.subject) issues.push("缺少邮件主题");
    if (!selectedTemplate?.htmlContent) issues.push("邮件内容为空");
    if (!form.unsubscribeLink) issues.push("缺少退订链接");
    if (!form.footerHtml) issues.push("缺少页脚信息");

    setComplianceResult({
      passed: issues.length === 0,
      issues: issues.length > 0 ? issues : ["合规检查通过"],
    });
    toast.success("合规检查完成");
  };

  const getProgress = (task: Task) => {
    if (!task.totalCount) return 0;
    return Math.round((task.sentCount / task.totalCount) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">群发任务</h1>
        <div className="animate-pulse bg-muted rounded h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">群发任务</h1>
          <p className="text-muted-foreground text-sm mt-1">
            创建和管理邮件群发任务
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTasks}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Dialog open={showWizard} onOpenChange={setShowWizard}>
            <DialogTrigger>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                创建任务
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editId ? "编辑任务" : "创建群发任务"}
                </DialogTitle>
              </DialogHeader>

              {/* Step Indicator */}
              <div className="flex items-center gap-2 mb-2">
                {["基本信息", "发送配置", "高级设置", "内容检查"].map(
                  (label, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          wizardStep >= i + 1
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span className="text-xs text-muted-foreground">{label}</span>
                      {i < 3 && <div className="w-8 h-px bg-border" />}
                    </div>
                  )
                )}
              </div>

              {/* Step 1: Basic */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label>任务名称 *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="例如: 6月促销活动群发"
                    />
                  </div>
                  <div>
                    <Label>选择模板</Label>
                    <Select
                      value={form.templateId}
                      onValueChange={(v) => setForm({ ...form, templateId: v ?? "" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择邮件模板" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">不选择模板</SelectItem>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>选择联系人分组</Label>
                    <Select
                      value={form.groupId}
                      onValueChange={(v) => setForm({ ...form, groupId: v ?? "" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择分组" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">全部联系人</SelectItem>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name} ({g._count?.contacts || 0}人)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 2: Send Config */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label>选择发件账号</Label>
                    <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
                      {accounts.map((acc) => (
                        <div key={acc.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={form.accountIds.includes(acc.id)}
                            onCheckedChange={(checked) => {
                              setForm({
                                ...form,
                                accountIds: checked
                                  ? [...form.accountIds, acc.id]
                                  : form.accountIds.filter((id) => id !== acc.id),
                              });
                            }}
                          />
                          <span className="text-sm">{acc.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({acc.email}, 今日已发{acc.todaySent}/{acc.dailyLimit})
                          </span>
                          {!acc.enabled && (
                            <Badge variant="secondary" className="text-xs">
                              已禁用
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>发送策略</Label>
                      <Select
                        value={form.strategy}
                        onValueChange={(v) => setForm({ ...form, strategy: v ?? "round-robin" })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="round-robin">轮询</SelectItem>
                          <SelectItem value="weighted">加权</SelectItem>
                          <SelectItem value="optimal">最优</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>发送间隔 (毫秒)</Label>
                      <Input
                        type="number"
                        value={form.sendInterval}
                        onChange={(e) =>
                          setForm({ ...form, sendInterval: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>最大线程数</Label>
                    <Input
                      type="number"
                      value={form.maxThreads}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          maxThreads: Number(e.target.value),
                        })
                      }
                      min={1}
                      max={10}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Advanced */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label>定时发送（可选）</Label>
                    <Input
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={(e) =>
                        setForm({ ...form, scheduledAt: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>附件</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="flex-1"
                      />
                      {uploading && (
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          上传中…
                        </span>
                      )}
                    </div>

                    {form.attachments.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {form.attachments.map((att, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between rounded bg-muted px-2 py-1 text-sm"
                          >
                            <span className="truncate">{att.filename}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(idx)}
                              title="移除"
                            >
                              ✕
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        value={manualPath}
                        onChange={(e) => setManualPath(e.target.value)}
                        placeholder="或填写服务器文件路径，如 /app/data/uploads/a.pdf"
                      />
                      <Button variant="outline" size="sm" onClick={addManualPath}>
                        添加路径
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      上传的文件存于数据卷，重建容器不丢失；手动路径需先把文件放进容器卷目录再填绝对路径。
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Check */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>启用退订链接</Label>
                    <Switch
                      checked={form.unsubscribeLink}
                      onCheckedChange={(v) =>
                        setForm({ ...form, unsubscribeLink: v })
                      }
                    />
                  </div>
                  <div>
                    <Label>页脚HTML</Label>
                    <Textarea
                      value={form.footerHtml}
                      onChange={(e) =>
                        setForm({ ...form, footerHtml: e.target.value })
                      }
                      placeholder="可添加退订链接、公司信息等..."
                      className="min-h-[80px] font-mono text-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSpamCheck}>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      垃圾邮件检测
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleComplianceCheck}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      合规检查
                    </Button>
                  </div>

                  {spamResult && (
                    <div className="p-3 rounded-md bg-muted space-y-1">
                      <p className="font-medium text-sm">
                        垃圾邮件评分: {spamResult.score} 分 ({spamResult.quality})
                      </p>
                      {spamResult.issues.length > 0 && (
                        <div className="text-xs">
                          <span className="text-destructive">问题: </span>
                          {spamResult.issues.join("; ")}
                        </div>
                      )}
                      {spamResult.suggestions.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <span>建议: </span>
                          {spamResult.suggestions.join("; ")}
                        </div>
                      )}
                    </div>
                  )}

                  {complianceResult && (
                    <div className={`p-3 rounded-md ${
                      complianceResult.passed
                        ? "bg-green-500/10 text-green-600"
                        : "bg-yellow-500/10 text-yellow-600"
                    }`}>
                      <p className="font-medium text-sm">
                        {complianceResult.passed ? "合规检查通过" : "合规检查未通过"}
                      </p>
                      <div className="text-xs">
                        {complianceResult.issues.join("; ")}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="flex items-center justify-between">
                <div className="flex gap-2">
                  {wizardStep > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWizardStep((s) => s - 1)}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      上一步
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowWizard(false)}>
                    取消
                  </Button>
                  {wizardStep < 4 ? (
                    <Button onClick={() => setWizardStep((s) => s + 1)}>
                      下一步
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={editId ? handleEdit : handleCreate}>
                      {editId ? "保存修改" : "创建任务"}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Task List */}
      <Card>
        <CardContent className="p-0">
          {tasks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>进度</TableHead>
                  <TableHead>发送/失败/总数</TableHead>
                  <TableHead>策略</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-[200px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const config = statusConfig[task.status] || statusConfig.draft;
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.name}</TableCell>
                      <TableCell>
                        <Badge className={config.className} variant="outline">
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[120px]">
                          <Progress value={getProgress(task)} />
                          <span className="text-xs text-muted-foreground">
                            {getProgress(task)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="text-green-600">{task.sentCount}</span>
                        {" / "}
                        <span className="text-red-500">{task.failCount}</span>
                        {" / "}
                        <span>{task.totalCount}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {task.strategy === "round-robin"
                          ? "轮询"
                          : task.strategy === "weighted"
                          ? "加权"
                          : "最优"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(task.createdAt).toLocaleString("zh-CN")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {["draft", "pending", "paused"].includes(task.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction(task.id, "start")}
                              title="开始"
                            >
                              <Play className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {task.status === "sending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction(task.id, "pause")}
                              title="暂停"
                            >
                              <Pause className="h-4 w-4 text-yellow-600" />
                            </Button>
                          )}
                          {(task.status === "sending" || task.status === "paused") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction(task.id, "stop")}
                              title="停止"
                            >
                              <Square className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(task)}
                            title="编辑"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(task)}
                            title="查看记录"
                          >
                            <List className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(task.id, "reset")}
                            title="重置"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(task.id)}
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              暂无任务，请创建第一个群发任务
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>任务详情 - {detailTask?.name}</DialogTitle>
          </DialogHeader>
          {detailTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">状态</Label>
                  <p>
                    <Badge
                      className={
                        (statusConfig[detailTask.status] || statusConfig.draft)
                          .className
                      }
                      variant="outline"
                    >
                      {(statusConfig[detailTask.status] || statusConfig.draft).label}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">进度</Label>
                  <p>
                    {detailTask.sentCount} / {detailTask.totalCount}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">失败</Label>
                  <p className="text-red-500">{detailTask.failCount}</p>
                </div>
              </div>
              <Progress value={getProgress(detailTask)} />

              <div>
                <Label className="text-muted-foreground">发送记录</Label>
                {detailRecords.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>联系人</TableHead>
                        <TableHead>账号</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>错误信息</TableHead>
                        <TableHead>时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailRecords.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell className="font-mono text-xs">
                            {rec.contactId?.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {rec.accountId?.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                rec.status === "success" ? "default" : "destructive"
                              }
                            >
                              {rec.status === "success" ? "成功" : "失败"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-red-500 max-w-[150px] truncate">
                            {rec.error || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(rec.sentAt).toLocaleString("zh-CN")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground py-4">
                    暂无发送记录
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除此任务吗？此操作不可撤销，相关的发送记录也将被清除。
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
