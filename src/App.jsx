import { useState, useEffect } from 'react';
import TabNav from './components/TabNav.jsx';
import ChatTab from './components/tabs/ChatTab.jsx';
import SystemTab from './components/tabs/SystemTab.jsx';
import AgentsTab from './components/tabs/AgentsTab.jsx';
import TodosTab from './components/tabs/TodosTab.jsx';
import SettingsTab from './components/tabs/SettingsTab.jsx';
import LogsTab from './components/tabs/LogsTab.jsx';

const TAB_COMPONENTS = {
  chat: ChatTab, system: SystemTab, agents: AgentsTab, todos: TodosTab, logs: LogsTab, settings: SettingsTab,
};

function isTailscaleRange(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false;
  // 100.64.0.0/10: 100.64 ~ 100.127
  return parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127;
}

export default function App() {
  const [tab, setTab] = useState('chat');
  const [allowed, setAllowed] = useState(null); // null=loading, true=ok, false=blocked

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const host = window.location.hostname;
    // 앱 WebView 즉시 허용
    if (typeof window.HunhuiNative !== 'undefined' || ua.indexOf('HunhuiBot-Android') !== -1) {
      setAllowed(true); return;
    }
    // localhost 허용
    if (host === 'localhost' || host === '127.0.0.1') {
      setAllowed(true); return;
    }
    // Tailscale IP로 직접 접속한 경우 (서버가 이미 IP 체크함)
    if (isTailscaleRange(host)) {
      setAllowed(true); return;
    }
    // 서버가 Tailscale 체크 담당 - 여기까지 왔으면 허용
    setAllowed(true);
  }, []);

  if (allowed === null) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#0f0f1a',color:'#a78bfa',fontFamily:'sans-serif',fontSize:'14px'}}>
      확인 중...
    </div>
  );

  if (!allowed) return (
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
// build: Wed Mar  4 02:43:12 KST 2026
