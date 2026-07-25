import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { api } from '@/lib/api';

interface Stats {
  todayCompleted: number;
  weekCompleted: number;
  monthCompleted: number;
  activeTasks: number;
  totalTasks: number;
  totalHabits: number;
  achievements: number;
  last7Days: { date: string; completed: number }[];
}

interface Recs {
  bestHours: number[];
  struggling: { taskId: string; title: string; suggestion: string }[];
  weeklySummary: string;
}

export default function Statistics() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get<Stats>('/stats/me'),
  });
  const { data: recs } = useQuery({
    queryKey: ['recs'],
    queryFn: () => api.get<Recs>('/recommendations'),
  });

  const last7 = stats?.last7Days ?? [];
  const max = Math.max(1, ...last7.map((d) => d.completed));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Statistics</h1>
        <p className="text-sm text-slate-500">What's working, what isn't.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-slate-500">Today</div>
          <div className="text-3xl font-bold">{stats?.todayCompleted ?? 0}</div>
          <div className="text-xs text-slate-500">tasks completed</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">This week</div>
          <div className="text-3xl font-bold">{stats?.weekCompleted ?? 0}</div>
          <div className="text-xs text-slate-500">tasks completed</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">This month</div>
          <div className="text-3xl font-bold">{stats?.monthCompleted ?? 0}</div>
          <div className="text-xs text-slate-500">tasks completed</div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Last 7 days" subtitle="Tasks completed per day" />
        <div className="flex items-end gap-2 h-40">
          {last7.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-brand-500 to-brand-300"
                style={{ height: `${(d.completed / max) * 100}%` }}
                title={`${d.completed} done`}
              />
              <div className="mt-1 text-[10px] text-slate-500">
                {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="AI recommendations" />
        {recs ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">{recs.weeklySummary}</p>
            {recs.bestHours.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-500">Best hours</div>
                <div className="mt-1 flex gap-1">
                  {recs.bestHours.map((h) => (
                    <span key={h} className="badge-brand">{h}:00</span>
                  ))}
                </div>
              </div>
            )}
            {recs.struggling.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-500">Needs attention</div>
                <ul className="mt-1 space-y-1">
                  {recs.struggling.slice(0, 3).map((s) => (
                    <li key={s.taskId} className="text-sm text-slate-700">
                      <span className="font-medium">{s.title}</span> — {s.suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-slate-500">Generating…</div>
        )}
      </Card>
    </div>
  );
}
