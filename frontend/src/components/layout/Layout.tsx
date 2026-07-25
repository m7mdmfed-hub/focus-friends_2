import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useFeedRealtime } from '@/hooks/useFeedRealtime';

export function Layout() {
  // Keep the feed cache warm regardless of which page the user is on.
  useFeedRealtime(['feed']);
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
