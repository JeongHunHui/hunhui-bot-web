import { useState, useEffect } from 'react';

export default function SettingsTab() {
  const [token, setToken] = useState('');
  const [channel, setChannel] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem('slack_token') || '');
    setChannel(localStorage.getItem('slack_channel') || '');
  }, []);

  function save() {
    localStorage.setItem('slack_token', token.trim());
    localStorage.setItem('slack_channel', channel.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="tab-content">
      <div className="card">
        <div className="card-title">Slack 설정</div>
        <div className="form-group">
          <label className="form-label">Bot Token (xoxb-...)</label>
          <input type="password" className="form-input" value={token} onChange={e => setToken(e.target.value)} placeholder="xoxb-..." />
        </div>
        <div className="form-group" style={{marginTop:12}}>
          <label className="form-label">Channel ID</label>
          <input type="text" className="form-input" value={channel} onChange={e => setChannel(e.target.value)} placeholder="C0AJLQUM2KA" />
        </div>
        <button className="btn btn-primary" onClick={save} style={{marginTop:12}}>💾 저장</button>
        {saved && <p className="status ok">저장됨 ✓</p>}
      </div>
      <div className="card">
        <div className="card-title">서버 정보</div>
        <div className="info-text">
          🌐 Mac mini: 100.73.43.27<br/>
          🔌 서버: http://100.73.43.27:3001<br/>
          🔒 Tailscale 전용
        </div>
      </div>
    </div>
  );
}
