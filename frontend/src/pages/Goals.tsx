import { useQuery } from '@tanstack/react-query';
import { Target } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { Progress } from '@/components/ui/Progress';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  goal: string | null;
  startDate: string;
  endDate: string;
  owner: { id: string; name: string; avatar: string | null };
  _count?: { members: number };
}

export default function Goals() {
  const { data } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => api.get<{ challenges: Challenge[] }>('/challenges'),
  });
  const challenges = data?.challenges ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Goals & Challenges</h1>
        <p className="text-sm text-slate-500">Pick a fight worth having.</p>
      </div>

      {challenges.length === 0 ? (
        <Card><div className="py-12 text-center text-slate-500">No challenges yet.</div></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map((c) => {
            const total = new Date(c.endDate).getTime() - new Date(c.startDate).getTime();
            const elapsed = Date.now() - new Date(c.startDate).getTime();
            const pct = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
            return (
              <Card key={c.id}>
                <div className="flex items-center gap-2 text-brand-600">
                  <Target className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Challenge</span>
                </div>
                <h3 className="mt-2 font-semibold text-slate-900">{c.title}</h3>
                {c.description && <p className="mt-1 text-sm text-slate-600">{c.description}</p>}
                {c.goal && <div className="badge-brand mt-2">🎯 {c.goal}</div>}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{pct}% elapsed</span>
                    <span>{c._count?.members ?? 0} members</span>
                  </div>
                  <Progress className="mt-1" value={pct} />
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  Until {new Date(c.endDate).toLocaleDateString()}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
