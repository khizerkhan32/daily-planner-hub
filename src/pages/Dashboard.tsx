import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { getTasks, getOrderedTasks } from '@/lib/store';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock, AlertTriangle, Plus } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

const priorityColors: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-success/10 text-success border-success/20',
};

export default function Dashboard() {
  const { user } = useAuth();
  const tasks = useMemo(() => user ? getOrderedTasks(getTasks(user.id)) : [], [user]);

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    overdue: tasks.filter(t => !t.completed && isPast(new Date(t.dueDate))).length,
    today: tasks.filter(t => isToday(new Date(t.dueDate))).length,
  }), [tasks]);

  const upcomingTasks = tasks.filter(t => !t.completed).slice(0, 5);

  const formatDueDate = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'MMM d');
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Here's your day at a glance</p>
        </div>
        <Link to="/tasks">
          <Button className="gap-2"><Plus className="h-4 w-4" /> New Task</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Tasks', value: stats.total, icon: Circle, color: 'text-primary' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-success' },
          { label: 'Due Today', value: stats.today, icon: Clock, color: 'text-warning' },
          { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-destructive' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Suggested Order */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Suggested Task Order</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No pending tasks. <Link to="/tasks" className="text-primary hover:underline">Create one</Link></p>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map((task, i) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm font-semibold text-muted-foreground w-6">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDueDate(task.dueDate)}</p>
                  </div>
                  <Badge variant="outline" className={priorityColors[task.priority]}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
