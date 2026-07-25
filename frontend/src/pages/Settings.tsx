import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import type { User } from '@/types';

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();

  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio ?? '');
      setAvatar(user.avatar ?? '');
    }
  }, [user]);

  const update = useMutation({
    mutationFn: (data: { name?: string; bio?: string | null; avatar?: string | null }) =>
      api.patch<{ user: User }>('/users/me', data),
    onSuccess: ({ user: u }) => {
      setUser(u);
      qc.invalidateQueries({ queryKey: ['me'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({
      name: name.trim() || undefined,
      bio: bio.trim() ? bio.trim() : null,
      avatar: avatar.trim() ? avatar.trim() : null,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your profile and preferences.</p>
      </div>

      <Card>
        <CardHeader title="Profile" subtitle="Visible to friends and on the leaderboard." />
        <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled />
          </div>
          <div className="md:col-span-2">
            <Label>Avatar URL</Label>
            <Input
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://…"
              type="url"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Bio</Label>
            <Input
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              placeholder="What are you focusing on?"
            />
            <div className="mt-1 text-xs text-slate-500">{bio.length}/280</div>
          </div>
          <div className="md:col-span-2 flex items-center justify-end gap-3">
            {saved && (
              <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
            {update.isError && (
              <span className="text-sm text-rose-600">{update.error?.message}</span>
            )}
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Account" />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Level</span>
            <span className="font-medium">{user?.level ?? 1}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total XP</span>
            <span className="font-medium">{user?.xp ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Coins</span>
            <span className="font-medium">{user?.coins ?? 0} 🪙</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Streak</span>
            <span className="font-medium">{user?.streak ?? 0} 🔥</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Customization" subtitle="Unlock with coins earned from tasks and habits." />
        <div className="grid gap-3 md:grid-cols-3">
          {['🌈 Themes', '🖼️ Avatars', '🏅 Frames', '🎨 Colors', '⭐ Badges', '🚀 Trails'].map((item) => (
            <div key={item} className="rounded-xl border border-slate-200 p-4 text-center">
              <div className="text-2xl">{item.split(' ')[0]}</div>
              <div className="mt-1 text-sm font-medium">{item.split(' ').slice(1).join(' ')}</div>
              <div className="mt-2 text-xs text-slate-500">Coming soon</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
