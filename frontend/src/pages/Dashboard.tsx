import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Flame, Sparkles, Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardHeader } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Avatar } from '@/components/ui/Avatar';
import { xpForLevel } from '@/lib/level';
import type { Task, Friend, Post } from '@/types';

interface Stats {
  todayCompleted: number;
  weekCompleted: number;
  monthCompleted: number;
  activeTasks: number;
  totalHabits: number;
  achievements: number;
  last7Days: { date: string; completed: number }[];
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get<{ tasks: Task[] }>('/tasks'),
  });
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get<Stats>('/stats/me'),
  });
  const { data: feed } = useQuery({
    queryKey: ['feed'],
    queryFn: () => api.get<{ posts: Post[] }>('/posts'),
  });
  const { data: friends } = useQuery({
    queryKey: ['friends'],
    queryFn: () => api.get<{ friends: Friend[] }>('/friends'),
  });

  const tasks = tasksData?.tasks ?? [];
  const todayTasks = tasks.filter((t) => !t.logs?.length);
  const doneToday = tasks.filter((t) => t.logs && t.logs.length > 0).length;
  const todayProgress = tasks.length ? Math.round((doneToday / tasks.length) * 100) : 0;

  const levelStart = user ? xpForLevel(user.level) : 0;
  const levelNext = user ? xpForLevel(user.level + 1) : 100;
  const xpIntoLevel = user ? user.xp - levelStart : 0;
  const xpToNext = levelNext - levelStart;
  const xpPct = Math.round((xpIntoLevel / xpToNext) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your day</h1>
          <p className="text-sm text-slate-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-100 p-2 text-brand-600"><Sparkles className="h-5 w-5" /></div>
            <div>
              <div className="text-sm text-slate-500">Level</div>
              <div className="text-xl font-bold">{user?.level ?? 1}</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{xpIntoLevel} / {xpToNext} XP</span>
              <span>{xpPct}%</span>
            </div>
            <Progress className="mt-1" value={xpIntoLevel} max={xpToNext} />
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-100 p-2 text-orange-600"><Flame className="h-5 w-5" /></div>
            <div>
              <div className="text-sm text-slate-500">Streak</div>
              <div className="text-xl font-bold">{user?.streak ?? 0} days</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">Don't break the chain.</div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600"><Target className="h-5 w-5" /></div>
            <div>
              <div className="text-sm text-slate-500">Today</div>
              <div className="text-xl font-bold">{doneToday} / {tasks.length}</div>
            </div>
          </div>
          <Progress className="mt-3" value={todayProgress} />
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-2 text-violet-600"><TrendingUp className="h-5 w-5" /></div>
            <div>
              <div className="text-sm text-slate-500">This week</div>
              <div className="text-xl font-bold">{stats?.weekCompleted ?? 0} done</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">{stats?.achievements ?? 0} achievements earned</div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Today's tasks"
            subtitle={`${doneToday} of ${tasks.length} done`}
            action={<Link to="/app/tasks" className="btn-ghost text-sm">View all</Link>}
          />
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No tasks yet. <Link to="/app/tasks" className="text-brand-600 font-medium">Add your first</Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {tasks.slice(0, 6).map((t) => {
                const done = t.logs && t.logs.length > 0;
                return (
                  <li key={t.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center gap-3">
                      {done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <div className="h-5 w-5 rounded-full border-2 border-slate-300" />}
                      <div>
                        <div className={`text-sm font-medium ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{t.title}</div>
                        <div className="text-xs text-slate-500">{t.repeat} · +{t.points} XP</div>
                      </div>
                    </div>
                    <span className="badge">{t.priority}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Friends" action={<Link to="/app/friends" className="btn-ghost text-sm">See all</Link>} />
            <div className="space-y-2">
              {friends?.friends.slice(0, 4).map((f) => {
                const other = f.senderId === user?.id ? f.receiver : f.sender;
                if (!other) return null;
                return (
                  <div key={f.id} className="flex items-center gap-3">
                    <Avatar name={other.name} src={other.avatar} size="sm" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{other.name}</div>
                      <div className="text-xs text-slate-500">Lvl {other.level} · {other.streak}🔥</div>
                    </div>
                  </div>
                );
              })}
              {(!friends?.friends || friends.friends.length === 0) && (
                <div className="text-sm text-slate-500">No friends yet — <Link to="/app/friends" className="text-brand-600">find some</Link></div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Activity" />
            <div className="space-y-3">
              {feed?.posts.slice(0, 3).map((p) => (
                <div key={p.id} className="flex gap-2">
                  <Avatar name={p.user.name} src={p.user.avatar} size="sm" />
                  <div className="flex-1">
                    <div className="text-xs text-slate-500">{p.user.name} · {p.type.toLowerCase().replace('_', ' ')}</div>
                    <div className="text-sm text-slate-800">{p.content}</div>
                  </div>
                </div>
              ))}
              {(!feed?.posts || feed.posts.length === 0) && (
                <div className="text-sm text-slate-500">No activity yet.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
