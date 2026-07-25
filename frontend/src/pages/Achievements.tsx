import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/Card';
import type { Achievement, UserAchievement } from '@/types';

export default function Achievements() {
  const all = useQuery({
    queryKey: ['achievements'],
    queryFn: () => api.get<{ achievements: Achievement[] }>('/achievements'),
  });
  const mine = useQuery({
    queryKey: ['my-achievements'],
    queryFn: () => api.get<{ earned: UserAchievement[] }>('/achievements/me'),
  });

  const earnedIds = new Set(mine.data?.earned.map((e) => e.achievementId) ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Achievements</h1>
        <p className="text-sm text-slate-500">Badges you can earn. {mine.data?.earned.length ?? 0} earned so far.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {all.data?.achievements.map((a) => {
          const earned = earnedIds.has(a.id);
          return (
            <Card key={a.id} className={earned ? '' : 'opacity-50'}>
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-2xl">
                  {a.icon ?? '🏆'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{a.title}</h3>
                  {a.description && <p className="text-sm text-slate-600">{a.description}</p>}
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="badge-brand">+{a.xpReward} XP</span>
                    <span className="badge-warn">+{a.coinReward} 🪙</span>
                    {earned && <span className="badge-success">Earned</span>}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
