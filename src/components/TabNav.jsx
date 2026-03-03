export const TABS = [
  { id: 'chat',     label: '💬 채팅' },
  { id: 'system',   label: '🖥 시스템' },
  { id: 'agents',   label: '🤖 에이전트' },
  { id: 'todos',    label: '✅ 할 일' },
  { id: 'settings', label: '⚙️ 설정' },
];

export default function TabNav({ active, onChange }) {
  return (
    <nav className="tab-nav">
      {TABS.map(t => (
        <button key={t.id} className={`tab ${active === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
