export const API = 'https://jeonghunhuiui-macmini.tail82ec06.ts.net:8443';

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
