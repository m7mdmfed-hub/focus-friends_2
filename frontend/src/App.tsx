import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '@/types';

import { Layout } from '@/components/layout/Layout';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import Tasks from '@/pages/Tasks';
import Goals from '@/pages/Goals';
import Habits from '@/pages/Habits';
import Achievements from '@/pages/Achievements';
import Friends from '@/pages/Friends';
import Chat from '@/pages/Chat';
import Statistics from '@/pages/Statistics';
import Leaderboard from '@/pages/Leaderboard';
import Settings from '@/pages/Settings';

function Protected({ children }: { children: React.ReactNode }) {
  const access = useAuthStore((s) => s.accessToken);
  if (!access) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const access = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  // Refresh user info on mount if we have a token
  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ user: User }>('/auth/me'),
    enabled: !!access,
  });
  useEffect(() => {
    if (data?.user) setUser(data.user);
  }, [data, setUser]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/app"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="goals" element={<Goals />} />
        <Route path="habits" element={<Habits />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="friends" element={<Friends />} />
        <Route path="chat" element={<Chat />} />
        <Route path="chat/:userId" element={<Chat />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
