import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ListOrdered } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/lib/auth-context";
import { getAllTasks, getAllUsers, getOrderedTasks, Task } from "@/lib/store";

type Priority = Task["priority"];

const priorityLabel: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const priorityClass: Record<Priority, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-success/10 text-success border-success/20",
};

export default function AdminMonitoring() {
  const { user } = useAuth();
  const [userFilter, setUserFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dueBefore, setDueBefore] = useState<string>("");

  const usersQ = useQuery({
    queryKey: ["admin", "users"],
    queryFn: getAllUsers,
  });

  const tasksQ = useQuery({
    queryKey: ["admin", "tasks"],
    queryFn: getAllTasks,
  });

  const users = usersQ.data ?? [];
  const tasks = tasksQ.data ?? [];

  const suggested = useMemo(() => {
    let list = getOrderedTasks(tasks).filter((t) => !t.completed);

    if (userFilter !== "all") list = list.filter((t) => t.userId === userFilter);
    if (priorityFilter !== "all") list = list.filter((t) => t.priority === priorityFilter);
    if (dueBefore) {
      const cutoff = new Date(dueBefore).getTime();
      list = list.filter((t) => new Date(t.dueDate).getTime() <= cutoff);
    }

    return list;
  }, [tasks, userFilter, priorityFilter, dueBefore]);

  const getUserName = (id: string) => users.find((u) => u.id === id)?.name ?? "Unknown";

  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display">Admin · Monitoring</h1>
          <p className="text-muted-foreground text-sm">
            Suggested task order based on priority and deadlines.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin">Back to Admin</Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>User</Label>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Due on/before</Label>
            <Input type="date" value={dueBefore} onChange={(e) => setDueBefore(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {tasksQ.isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Loading tasks…
          </CardContent>
        </Card>
      ) : suggested.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No matching tasks.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {suggested.map((t, idx) => (
            <Card key={t.id}>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="w-10 text-center text-sm text-muted-foreground">
                  #{idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{t.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {getUserName(t.userId)} · Due{" "}
                    {t.dueDate ? format(new Date(t.dueDate), "MMM d, yyyy") : "-"}
                  </p>
                </div>
                <Badge variant="outline" className={priorityClass[t.priority]}>
                  {priorityLabel[t.priority]}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

