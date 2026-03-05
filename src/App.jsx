import { useState, useEffect } from 'react';
import TabNav from './components/TabNav.jsx';
import ChatTab from './components/tabs/ChatTab.jsx';
import SystemTab from './components/tabs/SystemTab.jsx';
import AgentsTab from './components/tabs/AgentsTab.jsx';
import TodosTab from './components/tabs/TodosTab.jsx';
import LogsTab from './components/tabs/LogsTab.jsx';
import StatsTab from './components/tabs/StatsTab.jsx';
import SettingsTab from './components/tabs/SettingsTab.jsx';
import MemoryTab from './components/tabs/MemoryTab.jsx';
import { api } from './api.js';

const TAB_COMPONENTS = {
  chat: ChatTab, system: SystemTab, agents: AgentsTab,
  todos: TodosTab, logs: LogsTab, stats: StatsTab, memory: MemoryTab, settings: SettingsTab,
};

// Tailscale IP 허용 범위
function isTailscaleRange(ip) {
  if (!ip) return false;
  const m = ip.match(/^100\.(\d+)\./);
  if (m && parseInt(m[1]) >= 64 && parseInt(m[1]) < 128) return true;
  return ip === '127.0.0.1' || ip === 'localhost' || ip === '::1';
}

export default function App() {
  const [tab, setTab] = useState(() => localStorage.getItem('activeTab') || 'chat');
  const [allowed, setAllowed] = useState(null);
  const [gwOk, setGwOk] = useState(null);

  useEffect(() => {
    const h = window.location.hostname;
    setAllowed(isTailscaleRange(h) || h === 'localhost' || h.endsWith('.ts.net'));
  }, []);

  useEffect(() => {
    api.status().then(d => setGwOk(d?.gateway)).catch(() => setGwOk(false));
    const t = setInterval(() => {
      api.status().then(d => setGwOk(d?.gateway)).catch(() => setGwOk(false));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  if (allowed === null) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: 'var(--m)', fontSize: '.85rem' }}>
      확인 중...
    </div>
  );

  if (!allowed) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', gap: 12, padding: 24 }}>
      <span style={{ fontSize: '3rem' }}>🔒</span>
      <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>접근 불가</h1>
      <p style={{ color: 'var(--m)', fontSize: '.85rem', textAlign: 'center' }}>Tailscale 네트워크에서만 접근 가능합니다.</p>
    </div>
  );

  const TabComp = TAB_COMPONENTS[tab] || ChatTab;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* 헤더 */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px', background: 'var(--s)',
        borderBottom: '1px solid var(--b)', flexShrink: 0,
      }}>
        <span style={{ fontSize: '1rem' }}>🤖</span>
        <span style={{ fontWeight: 700, fontSize: '.9rem' }}>훈이봇</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: gwOk === null ? 'var(--m)' : gwOk ? 'var(--g)' : 'var(--r)',
            boxShadow: gwOk ? '0 0 5px var(--g)' : 'none',
          }} />
          <span style={{ fontSize: '.65rem', color: 'var(--m)' }}>
            {gwOk === null ? '...' : gwOk ? 'Online' : 'Offline'}
          </span>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '.65rem', color: 'var(--m)' }}>
          {window.location.hostname}
        </span>
      </header>

      {/* 탭 컨텐츠 */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <TabComp style={{ flex: 1, minHeight: 0 }} />
      </div>

      {/* 탭 네비 */}
      <TabNav active={tab} onChange={t => { setTab(t); localStorage.setItem('activeTab', t); }} />
    </div>
  );
}
