// API URL은 환경변수로 주입 (.env 파일 또는 빌드 시 VITE_API_URL)
export const API = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window === 'undefined') return '';
  const { protocol, hostname, port } = window.location;
  // 3001 웹서버 → 3000 API로 직접 (스트리밍 프록시 문제 우회)
  const apiPort = port === '3001' ? '3000' : port;
  return `${protocol}//${hostname}:${apiPort}`;
})();

export async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, options);
  return res.json();
}

export const api = {
  health:        () => apiFetch('/health'),
  status:        () => apiFetch('/dashboard/status'),
  system:        () => apiFetch('/dashboard/system'),
  sessions:      () => apiFetch('/dashboard/sessions'),
  todos:         () => apiFetch('/dashboard/todos'),
  restart:       () => apiFetch('/dashboard/restart', { method: 'POST' }),
  claudeStatus:  () => apiFetch('/dashboard/claude-status'),
  sessionStatus: () => apiFetch('/dashboard/session-status'),
  logs:          () => apiFetch('/dashboard/logs'),
  todayStats:    () => apiFetch('/dashboard/today-stats'),
  tokenUsage:    () => apiFetch('/dashboard/token-usage'),
  hourlyStats:   () => apiFetch('/dashboard/hourly-stats'),
  openclawInfo:  () => apiFetch('/dashboard/openclaw-info'),
  chatStream:    (text, sessionKey) => API + '/chat/stream',
  todoAdd:       (text) => apiFetch('/dashboard/todos/add', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text }) }),
  todoToggle:    (text, done) => apiFetch('/dashboard/todos/toggle', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text, done }) }),
  todoDelete:    (text) => apiFetch('/dashboard/todos/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text }) }),
  history:       (sessionKey, limit) => apiFetch(`/dashboard/history?session=${encodeURIComponent(sessionKey)}&limit=${limit||30}`),
  chat:          (text, sessionKey) => apiFetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, channel: sessionKey || 'default' }),
  }),
};

// (appended)
