import { useState, useEffect } from 'react';
import TabNav from './components/TabNav.jsx';
import ChatTab from './components/tabs/ChatTab.jsx';
import SystemTab from './components/tabs/SystemTab.jsx';
import AgentsTab from './components/tabs/AgentsTab.jsx';
import TodosTab from './components/tabs/TodosTab.jsx';
import SettingsTab from './components/tabs/SettingsTab.jsx';

// Tailscale 접근 제한
const host = window.location.hostname;
const isTailscale = /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host) || host.endsWith('.ts.net') || host === 'localhost' || host === '127.0.0.1';

const TAB_COMPONENTS = {
  chat: ChatTab, system: SystemTab, agents: AgentsTab, todos: TodosTab, settings: SettingsTab,
};

export default function App() {
  const [tab, setTab] = useState('chat');

  if (!isTailscale) return (
    <div className="blocked">
      <div>🔒</div>
      <h1>접근 제한됨</h1>
      <p>Tailscale VPN 연결 후 이용 가능합니다</p>
    </div>
  );

  const TabComponent = TAB_COMPONENTS[tab];
  return (
    <div className="app">
      <TabNav active={tab} onChange={setTab} />
      <main className="main">
        <TabComponent />
      </main>
    </div>
  );
}
