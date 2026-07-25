import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, Target, Flame, Award, Users, MessageCircle,
  BarChart3, Trophy, Settings, LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/app/goals', label: 'Goals', icon: Target },
  { to: '/app/habits', label: 'Habits', icon: Flame },
  { to: '/app/achievements', label: 'Achievements', icon: Award },
  { to: '/app/friends', label: 'Friends', icon: Users },
  { to: '/app/chat', label: 'Chat', icon: MessageCircle },
  { to: '/app/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/app/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-6">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="h-9 w-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold">F</div>
        <div>
          <div className="font-semibold text-slate-900">Focus Friends</div>
          <div className="text-xs text-slate-500">Build together</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 p-3">
          <Avatar name={user.name} src={user.avatar} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-900">{user.name}</div>
            <div className="text-xs text-slate-500">Level {user.level} · {user.streak}🔥</div>
          </div>
          <button onClick={onLogout} className="text-slate-400 hover:text-rose-500" title="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
}
