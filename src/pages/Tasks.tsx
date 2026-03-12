import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  getOrderedTasks,
  Task,
  toggleTaskCompletion,
} from "@/lib/store";

import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Checkbox } from "@/components/ui/checkbox";

import { Plus, Pencil, Trash2, Filter } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type Priority = "low" | "medium" | "high";

interface TaskForm {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
}

const priorityColors: Record<Priority, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-success/10 text-success border-success/20",
};

const emptyForm: TaskForm = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: format(new Date(), "yyyy-MM-dd"),
};

export default function Tasks() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [refresh, setRefresh] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [form, setForm] = useState<TaskForm>(emptyForm);

  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterDate, setFilterDate] = useState("");

  /* ---------------- LOAD TASKS ---------------- */

  useEffect(() => {
    if (!user) return;

    const loadTasks = async () => {
      try {
        const data = await getTasks();
        setTasks(data || []);
      } catch {
        toast.error("Failed to load tasks");
      }
    };

    loadTasks();
  }, [user, refresh]);

  /* ---------------- FILTER + ORDER ---------------- */

  const filteredTasks = useMemo(() => {
    let ordered = getOrderedTasks(tasks);

    if (filterPriority !== "all") {
      ordered = ordered.filter((t) => t.priority === filterPriority);
    }

    if (filterDate) {
      ordered = ordered.filter((t) => t.dueDate === filterDate);
    }

    return ordered;
  }, [tasks, filterPriority, filterDate]);

  /* ---------------- OPEN CREATE ---------------- */

  const openCreate = () => {
    setEditingTask(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  /* ---------------- OPEN EDIT ---------------- */

  const openEdit = (task: Task) => {
    setEditingTask(task);

    setForm({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "medium",
      dueDate: task.dueDate || format(new Date(), "yyyy-MM-dd"),
    });

    setDialogOpen(true);
  };

  /* ---------------- SAVE TASK ---------------- */

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!user) return;

    try {
      if (editingTask) {
        await updateTask(editingTask.id, form);
        toast.success("Task updated");
      } else {
        const result = await addTask({
          ...form,
          userId: user.id,
          completed: false,
        });

        if (!result) {
          toast.error("Failed to create task");
          return;
        }

        toast.success("Task created");
      }

      setDialogOpen(false);
      setRefresh((r) => r + 1);
    } catch {
      toast.error("Operation failed");
    }
  };

  /* ---------------- DELETE TASK ---------------- */

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      toast.success("Task deleted");
      setRefresh((r) => r + 1);
    } catch {
      toast.error("Delete failed");
    }
  };

  /* ---------------- TOGGLE COMPLETE ---------------- */

  const toggleComplete = async (task: Task) => {
    try {
      await toggleTaskCompletion(task.id,  true );
      setRefresh((r) => r + 1);
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display">Tasks</h1>

        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-44"
            />

            {(filterPriority !== "all" || filterDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterPriority("all");
                  setFilterDate("");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-lg mb-2">No tasks found</p>
            <p className="text-sm">Create your first task</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <Card key={task.id} className={task.completed ? "opacity-60" : ""}>
              <CardContent className="py-4 flex items-center gap-4">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleComplete(task)}
                />

                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium ${
                      task.completed
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    {task.title}
                  </p>

                  {task.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {task.description}
                    </p>
                  )}
                </div>

                <Badge
                  variant="outline"
                  className={priorityColors[task.priority]}
                >
                  {task.priority}
                </Badge>

                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {task.dueDate
                    ? format(new Date(task.dueDate), "MMM d")
                    : "-"}
                </span>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(task)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(task.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit Task" : "New Task"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>

                <Select
                  value={form.priority}
                  onValueChange={(v: Priority) =>
                    setForm((f) => ({ ...f, priority: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>

                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>

            <Button onClick={handleSave}>
              {editingTask ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}