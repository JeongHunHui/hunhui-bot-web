import { useState, useEffect } from 'react';
import { api } from '../../api.js';

const TICK = 10000;

function Gauge({ label, pct, val, sub }) {
  const p = Math.min(100, Math.max(0, pct || 0));
  const color = p > 85 ? '#ef4444' : p > 60 ? '#fbbf24' : '#10b981';
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', marginBottom: 3 }}>
        <span style={{ color: 'var(--m)' }}>{label}</span>
        <span style={{ fontFamily: 'monospace', color: '#e8e8f0' }}>{val}</span>
      </div>
      <div style={{ height: 8, background: 'var(--b)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${p}%`, background: color, borderRadius: 4, transition: 'width .5s ease', boxShadow: `0 0 6px ${color}66` }} />
      </div>
      {sub && <div style={{ fontSize: '.65rem', color: 'var(--m)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--b)', borderRadius: 8, padding: '10px 12px', flex: 1, minWidth: 80 }}>
      <div style={{ fontSize: '.7rem', color: 'var(--m)' }}>{icon} {label}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: color || '#e8e8f0', marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: '.65rem', color: 'var(--m)' }}>{sub}</div>}
    </div>
  );
}

export default function SystemTab() {
  const [st, setSt]       = useState(null);
  const [sys, setSys]     = useState(null);
  const [claude, setClaude] = useState(null);
  const [sst, setSst]     = useState(null);
  const [restarting, setRestarting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  async function fetchAll() {
    try {
      const [s, sy, cl, ss] = await Promise.allSettled([
        api.status(), api.system(), api.claudeStatus(), api.sessionStatus()
      ]);
      if (s.status === 'fulfilled') setSt(s.value);
      if (sy.status === 'fulfilled') setSys(sy.value);
      if (cl.status === 'fulfilled') setClaude(cl.value);
      if (ss.status === 'fulfilled') setSst(ss.value);
      setLastUpdate(new Date().toLocaleTimeString('ko-KR'));
    } catch {}
  }

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, TICK);
    return () => clearInterval(t);
  }, []);

  async function restart() {
    setRestarting(true);
    try { await api.restart(); } catch {}
    setTimeout(() => { setRestarting(false); fetchAll(); }, 5000);
  }

  const gwOk = st?.ok && st?.gateway;

  // session-status 텍스트 파싱
  const sstLines = sst?.text ? sst.text.split('\n').filter(Boolean) : [];

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', height: '100%' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '.7rem', color: 'var(--m)' }}>🔄 {lastUpdate ? `${lastUpdate} 업데이트` : '로딩 중...'}</span>
        <button onClick={fetchAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--m)', fontSize: 14 }}>↻</button>
      </div>

      {/* OpenClaw 상태 */}
      <div className="card" style={{ borderColor: gwOk ? '#10b98144' : '#ef444444' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: gwOk ? '#10b981' : '#ef4444', boxShadow: `0 0 8px ${gwOk ? '#10b981' : '#ef4444'}` }} />
          <span style={{ fontWeight: 600, fontSize: '.95rem' }}>OpenClaw</span>
          <span style={{ marginLeft: 'auto', fontSize: '.7rem', color: 'var(--m)' }}>
            {gwOk ? '🟢 정상' : '🔴 응답 없음'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <StatCard icon="🔧" label="PID" value={st?.pid || '-'} />
          <StatCard icon="🤖" label="모델" value={(claude?.model || '-').replace('anthropic/','').replace('claude-sonnet-4-6','sonnet-4.6')} />
          <StatCard icon="📦" label="버전" value={claude?.version || (sst?.text?.match(/OpenClaw [\d.]+/)?.[0]?.replace('OpenClaw ','') || '-')} />
          <StatCard icon="🔑" label="API 키" value={claude?.apiKeyOk ? '✅ 정상' : '❌ 없음'} color={claude?.apiKeyOk ? '#10b981' : '#ef4444'} />
        </div>
        {!gwOk && (
          <button onClick={restart} disabled={restarting}
            style={{ marginTop: 10, width: '100%', padding: '8px', background: '#ef444422', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 8, cursor: 'pointer', fontSize: '.85rem' }}>
            {restarting ? '⏳ 재시작 중...' : '🔄 OpenClaw 재시작'}
          </button>
        )}
      </div>

      {/* Mac mini 리소스 */}
      <div className="card">
        <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: 12 }}>💻 Mac mini 리소스</div>
        {sys?.ok ? (
          <>
            <Gauge label="CPU" pct={sys.cpu} val={`${sys.cpu}%`} />
            <Gauge label="RAM" pct={sys.mem} val={`${sys.memUsed}/${sys.memTotal} GB`} sub={`${sys.mem}% 사용`} />
            {sys.disk && <Gauge label="Disk" pct={parseInt(sys.disk.pct)} val={sys.disk.pct} sub={`${sys.disk.used} / ${sys.disk.size}`} />}
            <div style={{ fontSize: '.75rem', color: 'var(--m)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--b)' }}>
              ⏱ 업타임: <span style={{ fontFamily: 'monospace', color: '#e8e8f0' }}>{sys.uptime}</span>
            </div>
          </>
        ) : <div style={{ color: 'var(--m)', fontSize: '.8rem', textAlign: 'center', padding: 20 }}>로딩 중...</div>}
      </div>

      {/* 세션 현황 */}
      <div className="card">
        <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: 10 }}>📊 세션 현황</div>
        {sstLines.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sstLines.map((line, i) => {
              const isHeader = line.includes('OpenClaw') || line.includes('Time:');
              const isModel = line.includes('Model:') || line.includes('Session:') || line.includes('Channel:');
              return (
                <div key={i} style={{
                  fontSize: '.75rem',
                  fontFamily: isModel ? 'monospace' : 'inherit',
                  color: isHeader ? '#e8e8f0' : 'var(--m)',
                  padding: '2px 0',
                }}>
                  {line}
                </div>
              );
            })}
          </div>
        ) : <div style={{ color: 'var(--m)', fontSize: '.8rem' }}>데이터 없음</div>}
      </div>
    </div>
  );
}
// GRAFANA_THEME_V2
