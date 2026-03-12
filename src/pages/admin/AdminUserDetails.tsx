import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useAuth } from "@/lib/auth-context";
import { getAllTasks, getUserById, Task } from "@/lib/store";

export default function AdminUserDetails() {
  const { user } = useAuth();
  const { id } = useParams();

  const userQ = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => (id ? getUserById(id) : Promise.resolve(null)),
    enabled: !!id,
  });

  const tasksQ = useQuery({
    queryKey: ["admin", "tasks"],
    queryFn: getAllTasks,
  });

  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  const u = userQ.data;
  const tasks = (tasksQ.data ?? []).filter((t: Task) => t.userId === id);
  const completed = tasks.filter((t) => t.completed).length;

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display">Admin · User Details</h1>
          <p className="text-muted-foreground text-sm">User profile + task summary.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/users">Back to Users</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin">Admin Home</Link>
          </Button>
        </div>
      </div>

      {userQ.isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Loading user…
          </CardContent>
        </Card>
      ) : !u ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            User not found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-lg font-semibold truncate">{u.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                </div>
                <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                  {u.role}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Joined:{" "}
                {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "-"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-2xl font-semibold">{tasks.length}</p>
              <p className="text-sm text-muted-foreground">Total tasks</p>
              <p className="text-sm text-muted-foreground">{completed} completed</p>
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}

