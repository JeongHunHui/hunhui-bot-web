// API URL은 환경변수로 주입 (.env 파일 또는 빌드 시 VITE_API_URL)
// .env 파일을 만들고 VITE_API_URL을 설정하세요 (절대 커밋하지 마세요)
export const API = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, options);
  return res.json();
}

export const api = {
  health:  () => apiFetch('/health'),
  status:  () => apiFetch('/dashboard/status'),
  system:  () => apiFetch('/dashboard/system'),
  sessions:() => apiFetch('/dashboard/sessions'),
  todos:   () => apiFetch('/dashboard/todos'),
  restart: () => apiFetch('/dashboard/restart', { method: 'POST' }),
  chat:    (text) => apiFetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }),
};
