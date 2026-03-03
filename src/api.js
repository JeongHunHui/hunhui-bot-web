// API URL은 환경변수로 주입 (.env 파일 또는 빌드 시 VITE_API_URL)
export const API = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

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
  history:       (sessionKey, limit) => apiFetch(`/dashboard/history?session=${encodeURIComponent(sessionKey)}&limit=${limit||30}`),
  chat:          (text, sessionKey) => apiFetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, channel: sessionKey || 'default' }),
  }),
};
