import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { getAllUsers, getAllTasks, deleteUser, User } from '@/lib/store';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, CheckSquare, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Admin() {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);

  const users = useMemo(() => getAllUsers(), [refresh]);
  const tasks = useMemo(() => getAllTasks(), [refresh]);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const handleDeleteUser = (u: User) => {
    if (u.id === user.id) { toast.error("Can't delete yourself"); return; }
    deleteUser(u.id);
    toast.success(`Deleted ${u.name}`);
    setRefresh(r => r + 1);
  };

  const getTaskCount = (userId: string) => tasks.filter(t => t.userId === userId).length;
  const getCompletedCount = (userId: string) => tasks.filter(t => t.userId === userId && t.completed).length;

  return (
    <AppLayout>
      <h1 className="text-3xl font-display mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
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
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckSquare className="h-5 w-5 text-success" />
            <div>
              <p className="text-2xl font-semibold">{tasks.length}</p>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                  </TableCell>
                  <TableCell>{getTaskCount(u.id)}</TableCell>
                  <TableCell>{getCompletedCount(u.id)}</TableCell>
                  <TableCell>{format(new Date(u.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    {u.id !== user.id && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteUser(u)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
