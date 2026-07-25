import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Notification } from '@/types';
import { useAuthStore } from '@/store/auth';

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<{ notifications: Notification[] }>('/notifications'),
  });
  const unread = data?.notifications.filter((n) => !n.read).length ?? 0;

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <div className="text-sm text-slate-500">Welcome back</div>
        <div className="font-semibold text-slate-900">{user?.name ?? 'Friend'} 👋</div>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/app/settings" className="btn-ghost text-sm">Settings</Link>
        <Link to="/app" className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
