// Tiny WebSocket client with auto-reconnect and ping.
// Falls back gracefully if the connection drops — callers should also re-fetch via REST.

import { useAuthStore } from '@/store/auth';

type Handler = (data: unknown) => void;

class ChatSocket {
  private ws: WebSocket | null = null;
  private handlers: Handler[] = [];
  private reconnectTimer: number | null = null;
  private url: string;
  private intentionallyClosed = false;

  constructor(baseHttpUrl: string) {
    // Convert http(s) → ws(s)
    this.url = baseHttpUrl.replace(/^http/, 'ws') + '/ws';
  }

  connect() {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    this.intentionallyClosed = false;
    const ws = new WebSocket(`${this.url}?token=${encodeURIComponent(token)}`);
    this.ws = ws;

    ws.addEventListener('open', () => {
      // Hello received from server
    });

    ws.addEventListener('message', (e) => {
      try {
        const data = JSON.parse(e.data);
        for (const h of this.handlers) h(data);
      } catch {
        // ignore non-JSON
      }
    });

    ws.addEventListener('close', () => {
      this.ws = null;
      if (!this.intentionallyClosed) this.scheduleReconnect();
    });

    ws.addEventListener('error', () => {
      ws.close();
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer != null) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }

  send(payload: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  on(h: Handler) {
    this.handlers.push(h);
    return () => {
      this.handlers = this.handlers.filter((x) => x !== h);
    };
  }

  close() {
    this.intentionallyClosed = true;
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}

let _instance: ChatSocket | null = null;

export function getChatSocket(): ChatSocket {
  if (!_instance) {
    const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/api$/, '');
    _instance = new ChatSocket(base);
    _instance.connect();
  }
  return _instance;
}
