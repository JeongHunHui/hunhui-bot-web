import { useState, useEffect } from 'react';
import TabNav from './components/TabNav.jsx';
import ChatTab from './components/tabs/ChatTab.jsx';
import SystemTab from './components/tabs/SystemTab.jsx';
import AgentsTab from './components/tabs/AgentsTab.jsx';
import TodosTab from './components/tabs/TodosTab.jsx';
import SettingsTab from './components/tabs/SettingsTab.jsx';

// 접근 허용 (Firebase 공개 호스팅 - Tailscale 체크 불필요)
const isTailscale = true;

const TAB_COMPONENTS = {
  chat: ChatTab, system: SystemTab, agents: AgentsTab, todos: TodosTab, settings: SettingsTab,
};

export default function App() {
  const [tab, setTab] = useState('chat');

  if (!isTailscale) return (
    <div className="blocked">
      <div style={{fontSize:'56px',marginBottom:'16px'}}>📱</div>
      <h1>앱에서만 접속 가능해요</h1>
      <p>훈희봇은 전용 앱을 통해서만 이용할 수 있어요</p>
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
