const TABS = [
  { id: 'chat',    label: '💬', title: '채팅' },
  { id: 'system',  label: '🖥️', title: '시스템' },
  { id: 'agents',  label: '🤖', title: '에이전트' },
  { id: 'todos',   label: '📋', title: '할일' },
  { id: 'logs',    label: '📄', title: '로그' },
  { id: 'settings',label: '⚙️', title: '설정' },
];

export default function TabNav({ active, onChange }) {
  return (
    <nav style={{
      display: 'flex',
      background: 'var(--s)',
      borderBottom: '1px solid var(--b)',
      overflowX: 'auto',
      flexShrink: 0,
    }}>
      {TABS.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, minWidth: 48, padding: '10px 4px 8px',
          background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: `2px solid ${active === t.id ? 'var(--p)' : 'transparent'}`,
          color: active === t.id ? 'var(--t)' : 'var(--m)',
          transition: 'all .15s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        }}>
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{t.label}</span>
          <span style={{ fontSize: '.6rem', fontWeight: active === t.id ? 600 : 400 }}>{t.title}</span>
        </button>
      ))}
    </nav>
  );
}
