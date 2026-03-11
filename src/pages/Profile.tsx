import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { updateProfile } from '@/lib/store';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Profile() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    updateProfile(user.id, { name, email });
    refresh();
    toast.success('Profile updated');
  };

  return (
    <AppLayout>
      <h1 className="text-3xl font-display mb-6">Profile</h1>
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Your Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={user?.role || ''} disabled className="bg-muted" />
            </div>
            <Button type="submit">Save changes</Button>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
