import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Users } from "lucide-react";

export default function Admin() {
  const { user } = useAuth();

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display">Admin</h1>
          <p className="text-muted-foreground text-sm">
            Monitoring and user management.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:bg-muted/30 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Users
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              View registered users, counts, and delete users. Open user details.
            </p>
            <Button asChild>
              <Link to="/admin/users">Go to Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-muted/30 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Suggested task order based on priority and deadlines.
            </p>
            <Button asChild>
              <Link to="/admin/monitoring">Go to Monitoring</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
