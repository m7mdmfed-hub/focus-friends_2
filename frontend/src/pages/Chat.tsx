import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { relativeTime } from '@/lib/utils';
import { getChatSocket } from '@/lib/ws';
import type { Message, Friend } from '@/types';

export default function Chat() {
  const { userId } = useParams<{ userId?: string }>();
  const me = useAuthStore((s) => s.user);
  const { data: friendsData } = useQuery({
    queryKey: ['friends'],
    queryFn: () => api.get<{ friends: Friend[] }>('/friends'),
  });

  if (!userId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <Card>
          <div className="space-y-2">
            {friendsData?.friends.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">
                Add friends first — <Link to="/app/friends" className="text-brand-600">go to Friends</Link>
              </div>
            )}
            {friendsData?.friends.map((f) => {
              const other = f.senderId === me?.id ? f.receiver : f.sender;
              if (!other) return null;
              return (
                <Link key={f.id} to={`/app/chat/${other.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50">
                  <Avatar name={other.name} src={other.avatar} />
                  <div>
                    <div className="text-sm font-medium">{other.name}</div>
                    <div className="text-xs text-slate-500">Tap to chat</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  return <Thread otherId={userId} />;
}

function Thread({ otherId }: { otherId: string }) {
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [wsReady, setWsReady] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['messages', otherId],
    queryFn: () => api.get<{ messages: Message[] }>(`/messages/${otherId}`),
  });

  // Open WebSocket once per mount
  useEffect(() => {
    const socket = getChatSocket();

    // Wait for socket to be open before allowing sends.
    const checkReady = () => {
      if (socket && (socket as unknown as { ws: WebSocket | null }).ws?.readyState === WebSocket.OPEN) {
        setWsReady(true);
      } else {
        setTimeout(checkReady, 100);
      }
    };
    checkReady();

    const off = socket.on((msg) => {
      const m = msg as { type: string; message?: Message; from?: string };
      if (m.type === 'message' && m.message) {
        if (
          (m.message.senderId === otherId && m.message.receiverId === me?.id) ||
          (m.message.senderId === me?.id && m.message.receiverId === otherId)
        ) {
          qc.setQueryData<{ messages: Message[] }>(['messages', otherId], (prev) => ({
            messages: [...(prev?.messages ?? []), m.message!],
          }));
        }
      } else if (m.type === 'typing' && m.from === otherId) {
        setTyping(true);
        setTimeout(() => setTyping(false), 1500);
      }
    });

    return () => {
      off();
    };
  }, [otherId, me?.id, qc]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages.length]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    const socket = getChatSocket();
    const ok = socket.send({ type: 'message', to: otherId, content });
    if (!ok) {
      // Fallback to REST if WS not ready
      api.post(`/messages/${otherId}`, { content }).then(() => {
        qc.invalidateQueries({ queryKey: ['messages', otherId] });
      });
    }
    setText('');
  };

  const onType = (v: string) => {
    setText(v);
    if (v.length > 0) {
      getChatSocket().send({ type: 'typing', to: otherId });
    }
  };

  const messages = data?.messages ?? [];
  const other = messages.find((m) => m.senderId !== me?.id)?.sender;

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col">
      <div className="mb-3 flex items-center gap-3">
        <Avatar name={other?.name ?? '?'} src={other?.avatar} />
        <div>
          <div className="font-semibold">{other?.name ?? 'Chat'}</div>
          <div className="text-xs text-slate-500">
            {typing ? 'typing…' : wsReady ? '● online' : 'connecting…'}
          </div>
        </div>
      </div>
      <Card className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500">Say hi 👋</div>
          )}
          {messages.map((m) => {
            const mine = m.senderId === me?.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-800'}`}>
                  <div>{m.content}</div>
                  <div className={`mt-1 text-[10px] ${mine ? 'text-brand-100' : 'text-slate-500'}`}>
                    {relativeTime(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottom} />
        </div>
      </Card>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <Input
          value={text}
          onChange={(e) => onType(e.target.value)}
          placeholder={wsReady ? 'Type a message…' : 'Connecting…'}
          disabled={!wsReady}
        />
        <Button type="submit" disabled={!text.trim() || !wsReady}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
