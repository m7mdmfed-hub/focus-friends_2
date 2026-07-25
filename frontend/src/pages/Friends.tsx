import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Check, X, Search } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Friend, User } from '@/types';

export default function Friends() {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const { data } = useQuery({
    queryKey: ['friends'],
    queryFn: () => api.get<{ friends: Friend[]; incoming: Friend[]; outgoing: Friend[] }>('/friends'),
  });

  const accept = useMutation({
    mutationFn: (id: string) => api.post(`/friends/${id}/accept`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends'] }),
  });
  const decline = useMutation({
    mutationFn: (id: string) => api.del(`/friends/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Friends</h1>
          <p className="text-sm text-slate-500">Build with people you trust.</p>
        </div>
        <AddFriendDialog onAdded={() => qc.invalidateQueries({ queryKey: ['friends'] })} />
      </div>

      {data?.incoming && data.incoming.length > 0 && (
        <Card>
          <CardHeader title="Incoming requests" subtitle={`${data.incoming.length} pending`} />
          <div className="space-y-2">
            {data.incoming.map((f) => (
              <div key={f.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={f.sender?.name ?? 'User'} src={f.sender?.avatar} />
                  <div>
                    <div className="text-sm font-medium">{f.sender?.name}</div>
                    <div className="text-xs text-slate-500">Level {f.sender?.level}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => accept.mutate(f.id)}>
                    <Check className="h-4 w-4" /> Accept
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => decline.mutate(f.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Your friends" subtitle={`${data?.friends.length ?? 0} friends`} />
        {data?.friends.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No friends yet — click "Add friend" to find people.
          </div>
        ) : (
          <div className="space-y-3">
            {data?.friends.map((f) => {
              const display = f.senderId === me?.id ? f.receiver : f.sender;
              if (!display) return null;
              return (
                <div key={f.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={display.name} src={display.avatar} />
                    <div>
                      <div className="text-sm font-medium">{display.name}</div>
                      <div className="text-xs text-slate-500">
                        Lvl {display.level} · {display.streak}🔥
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function AddFriendDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const { data, isFetching } = useQuery({
    queryKey: ['users-search', q],
    queryFn: () => api.get<{ users: User[] }>('/users/search', { q }),
    enabled: q.trim().length >= 2,
    staleTime: 10_000,
  });

  const send = useMutation({
    mutationFn: (userId: string) => api.post('/friends/request', { userId }),
    onSuccess: () => {
      onAdded();
      setQ('');
      setOpen(false);
    },
  });

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" /> Add friend
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onClick={() => setOpen(false)}>
      <div
        className="card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Find friends</h3>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9"
          />
        </div>
        <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
          {q.trim().length < 2 && (
            <div className="py-8 text-center text-sm text-slate-500">Type at least 2 characters…</div>
          )}
          {q.trim().length >= 2 && !isFetching && data?.users.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500">No users found.</div>
          )}
          {isFetching && <div className="py-4 text-center text-sm text-slate-500">Searching…</div>}
          {data?.users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <Avatar name={u.name} src={u.avatar} size="sm" />
                <div>
                  <div className="text-sm font-medium">{u.name}</div>
                  <div className="text-xs text-slate-500">Lvl {u.level} · {u.streak}🔥</div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => send.mutate(u.id)}
                disabled={send.isPending}
              >
                <UserPlus className="h-4 w-4" /> Add
              </Button>
            </div>
          ))}
        </div>
        {send.isError && (
          <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {send.error instanceof Error ? send.error.message : 'Failed to send request'}
          </div>
        )}
      </div>
    </div>
  );
}
