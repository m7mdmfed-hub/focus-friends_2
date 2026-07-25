import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

interface Entry {
  id: string;
  name: string;
  avatar: string | null;
  level: number;
  xp: number;
  streak: number;
  coins: number;
}

export default function Leaderboard() {
  const { data } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get<{ leaderboard: Entry[] }>('/leaderboard'),
  });
  const me = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
        <p className="text-sm text-slate-500">The top 50 most consistent humans.</p>
      </div>
      <Card>
        <CardHeader title="Top players" />
        <div className="divide-y divide-slate-100">
          {data?.leaderboard.map((e, i) => {
            const isMe = e.id === me?.id;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
            return (
              <div key={e.id} className={cn('flex items-center gap-3 py-3', isMe && 'bg-brand-50/60 rounded-xl px-2')}>
                <div className="w-10 text-center font-semibold text-slate-600">{medal}</div>
                <Avatar name={e.name} src={e.avatar} />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{e.name} {isMe && <span className="badge-brand">you</span>}</div>
                  <div className="text-xs text-slate-500">Lvl {e.level} · {e.streak}🔥</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{e.xp.toLocaleString()} XP</div>
                  <div className="text-xs text-slate-500">{e.coins} 🪙</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
