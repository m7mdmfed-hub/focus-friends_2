import { Link } from 'react-router-dom';
import { CheckCircle, Flame, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const FEATURES = [
  { icon: CheckCircle, title: 'Task Management', body: 'Daily, weekly, monthly, or one-time. With points, priority, and visibility.' },
  { icon: Flame, title: 'Habit Tracking', body: 'Streaks that reset on failure. Reading, exercise, prayer, language learning — anything.' },
  { icon: Trophy, title: 'Gamification', body: 'XP, levels, coins, badges, streaks. The dopamine hit that keeps you going.' },
  { icon: Users, title: 'Social Accountability', body: 'Friends, challenges, leaderboards. Build alone if you want, but better together.' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-brand-50/40">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold">F</div>
          <div className="font-semibold text-slate-900">Focus Friends</div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login"><Button variant="ghost">Log in</Button></Link>
          <Link to="/signup"><Button>Sign up</Button></Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="badge-brand">Build habits. Together.</span>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              The routine tracker you'll <span className="text-brand-500">actually</span> stick to.
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Tasks, habits, XP, friends. Focus Friends turns the boring work of building routines into a game you play with people who care.
            </p>
            <div className="mt-8 flex gap-3">
              <Link to="/signup"><Button size="lg">Get started — it's free</Button></Link>
              <Link to="/login"><Button size="lg" variant="secondary">I have an account</Button></Link>
            </div>
            <p className="mt-3 text-xs text-slate-500">Try alice@focus.app / password after seeding.</p>
          </div>

          <div className="relative">
            <div className="card rotate-1">
              <div className="text-sm text-slate-500">Today</div>
              <div className="mt-1 text-2xl font-semibold">Level 7 · 3,420 XP</div>
              <div className="mt-4 space-y-2">
                {[
                  { t: 'Morning run', done: true, p: 30 },
                  { t: 'Read 30 min', done: true, p: 20 },
                  { t: 'Meditate', done: false, p: 15 },
                ].map((t) => (
                  <div key={t.t} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full border-2 ${t.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`} />
                      <span className={t.done ? 'line-through text-slate-400' : 'text-slate-800'}>{t.t}</span>
                    </div>
                    <span className="text-xs text-slate-500">+{t.p} XP</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card absolute -bottom-6 -left-6 -rotate-2 hidden md:block">
              <div className="text-xs text-slate-500">7-day streak 🔥</div>
              <div className="text-xl font-bold">Keep going!</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-bold text-slate-900">What you get</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <f.icon className="h-6 w-6 text-brand-500" />
              <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-slate-500">
        © Focus Friends. Built for people who'd rather not procrastinate.
      </footer>
    </div>
  );
}
