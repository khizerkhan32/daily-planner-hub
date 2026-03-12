import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Trash2, Users } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useAuth } from "@/lib/auth-context";
import { deleteUser, getAllTasks, getAllUsers, Task, User } from "@/lib/store";

export default function AdminUsers() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const usersQ = useQuery({
    queryKey: ["admin", "users"],
    queryFn: getAllUsers,
  });

  const tasksQ = useQuery({
    queryKey: ["admin", "tasks"],
    queryFn: getAllTasks,
  });

  const del = useMutation({
    mutationFn: async (u: User) => {
      if (u.id === user?.id) throw new Error("self_delete");
      const ok = await deleteUser(u.id);
      if (!ok) throw new Error("delete_failed");
      return u;
    },
    onSuccess: (u) => {
      toast.success(`Deleted ${u.name}`);
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "tasks"] });
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === "self_delete") {
        toast.error("Can't delete yourself");
      } else {
        toast.error("Delete failed");
      }
    },
  });

  const users = usersQ.data ?? [];
  const tasks = tasksQ.data ?? [];

  const byUser = useMemo(() => {
    const map = new Map<string, { total: number; completed: number }>();
    for (const t of tasks as Task[]) {
      const cur = map.get(t.userId) ?? { total: 0, completed: 0 };
      cur.total += 1;
      if (t.completed) cur.completed += 1;
      map.set(t.userId, cur);
    }
    return map;
  }, [tasks]);

  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display">Admin · Users</h1>
          <p className="text-muted-foreground text-sm">
            View registered users, totals, and delete users.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin">Back to Admin</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-semibold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Registered Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-sm">
              {usersQ.isLoading || tasksQ.isLoading
                ? "Loading…"
                : usersQ.isError || tasksQ.isError
                  ? "Using local fallback data (no admin API detected)."
                  : "Loaded from API."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const counts = byUser.get(u.id) ?? { total: 0, completed: 0 };
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/admin/users/${u.id}`}
                        className="hover:underline"
                      >
                        {u.name}
                      </Link>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={u.role === "admin" ? "default" : "secondary"}
                      >
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{counts.total}</TableCell>
                    <TableCell>{counts.completed}</TableCell>
                    <TableCell>
                      {u.createdAt
                        ? format(new Date(u.createdAt), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.id !== user.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => del.mutate(u)}
                          disabled={del.isPending}
                          aria-label={`Delete ${u.name}`}
                          title={`Delete ${u.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}

