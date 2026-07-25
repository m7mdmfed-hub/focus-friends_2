import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { attachChatServer } from './services/chat.gateway.js';

const app = createApp();
const server = http.createServer(app);
attachChatServer(server);

server.listen(env.PORT, () => {
  console.log(`🚀 Focus Friends API ready → http://localhost:${env.PORT}`);
  console.log(`   Health:    http://localhost:${env.PORT}/health`);
  console.log(`   WebSocket: ws://localhost:${env.PORT}/ws?token=...`);
  console.log(`   CORS:      ${env.CORS_ORIGIN}`);
});
