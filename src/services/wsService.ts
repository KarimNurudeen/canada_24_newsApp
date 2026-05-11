import { API_BASE_URL } from './api';

function getWsBaseUrl(): string {
  // Convert http(s):// to ws(s):// and strip /api/v1 suffix
  return API_BASE_URL
    .replace(/\/api\/v1\/?$/, '')
    .replace(/^https:\/\//, 'wss://')
    .replace(/^http:\/\//, 'ws://');
}

type MessageHandler = (data: unknown) => void;

export function createWebSocket(path: string, onMessage: MessageHandler): () => void {
  const url = `${getWsBaseUrl()}${path}`;
  let ws: WebSocket | null = null;
  let retryTimeout: ReturnType<typeof setTimeout> | null = null;
  let retryDelay = 2000;
  let stopped = false;

  function connect() {
    ws = new WebSocket(url);

    ws.onopen = () => {
      retryDelay = 2000;
    };

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data as string);
        onMessage(data);
      } catch {}
    };

    ws.onerror = () => {};

    ws.onclose = () => {
      if (stopped) return;
      retryTimeout = setTimeout(() => {
        retryDelay = Math.min(retryDelay * 2, 30000);
        connect();
      }, retryDelay);
    };
  }

  connect();

  return () => {
    stopped = true;
    if (retryTimeout) clearTimeout(retryTimeout);
    ws?.close();
  };
}
