import { useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../api.js';

function Gauge({ label, pct, val, extra }) {
  const p = Math.min(100, Math.max(0, pct || 0));
  const color = p > 85 ? '#ef4444' : p > 60 ? '#fbbf24' : '#10b981';
  return (
    <div className="gauge-row">
      <span className="gauge-label">{label}</span>
      <div className="gauge-bar">
        <div className="gauge-fill" style={{ width: `${p}%`, background: color }} />
      </div>
      <span className="gauge-val">{val}</span>
      {extra && <span style={{fontSize:'.68rem',color:'var(--m)',width:48,textAlign:'right'}}>{extra}</span>}
    </div>
  );
}

function parseSessionText(text) {
  if (!text) return {};
  const r = {};
  for (const line of text.split('\n')) {
    const [k, ...v] = line.split(':');
    if (k && v.length) {
      const key = k.trim().toLowerCase();
      const val = v.join(':').trim();
      if (key === 'session') r.session = val;
      else if (key === 'model') r.model = val;
      else if (key.includes('context')) r.context = val;
      else if (key.includes('cost')) r.cost = val;
      else if (key.includes('time')) r.time = val;
      else if (key.includes('channel')) r.channel = val;
    }
  }
  return r;
}

function formatTokens(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

function formatCost(n) {
  if (!n || n === 0) return '$0.00';
  if (n < 0.01) return '<$0.01';
  return '$' + n.toFixed(2);
}

export default function SystemTab() {
  const { data: st, loading: stL, reload: stR } = useApi(api.status, [], 30000);
  const { data: sys, loading: sysL, reload: sysR } = useApi(api.system, [], 10000);
  const { data: claude, loading: claudeL } = useApi(api.claudeStatus, [], 60000);
  const { data: sst } = useApi(api.sessionStatus, [], 30000);
  const { data: token } = useApi(api.tokenUsage, [], 30000);
  const { data: today } = useApi(api.todayStats, [], 60000);
  const [restarting, setRestarting] = useState(false);

  async function restart() {
    setRestarting(true);
    try { await api.restart(); } catch {}
    setTimeout(() => { setRestarting(false); stR(); }, 4000);
  }

  const isOk = st?.ok && st?.gateway;
  const sess = parseSessionText(sst?.text);

  // Parse context tokens for progress bar
  let ctxUsed = 0, ctxMax = 0;
  if (sess.context) {
    const m = sess.context.match(/([\d,]+)\s*\/\s*([\d,]+)/);
    if (m) {
      ctxUsed = parseInt(m[1].replace(/,/g, ''));
      ctxMax = parseInt(m[2].replace(/,/g, ''));
    }
  }
  const ctxPct = ctxMax > 0 ? Math.round(ctxUsed / ctxMax * 100) : 0;

  return (
    <div className="tab-content animate-in">
      {/* Section 1: OpenClaw Status */}
      <div className={`card ${isOk ? 'glow-green' : 'glow-red'}`}>
        <div className="card-title">
          OpenClaw 서버
          <button className="btn-refresh" onClick={stR}>↻</button>
        </div>
        {stL && !st ? <div className="loading">확인 중...</div> : (
          <>
            <div className="status-row" style={{marginBottom:8}}>
              <div className={`dot ${isOk ? 'green' : 'red'} ${isOk ? '' : 'pulse'}`} />
              <span className="status-label">{isOk ? '정상 동작 중' : '응답 없음'}</span>
              {st?.pid && <span className="status-sub">PID {st.pid}</span>}
            </div>
            {isOk && (
              <div style={{display:'flex',flexDirection:'column',gap:4,marginTop:4}}>
                {st?.url && <div style={{fontSize:'.73rem',color:'var(--m)'}}>Gateway: <span className="mono" style={{color:'var(--pl)'}}>{st.url}</span></div>}
                {(claude?.model || token?.model) && <div style={{fontSize:'.73rem',color:'var(--m)'}}>모델: <span style={{color:'var(--t)'}}>{claude?.model || token?.model}</span></div>}
                {claude?.version && <div style={{fontSize:'.73rem',color:'var(--m)'}}>Claude: <span style={{color:'var(--t)'}}>{claude.version}</span></div>}
              </div>
            )}
            {!isOk && (
              <button className="btn btn-danger" onClick={restart} disabled={restarting} style={{marginTop:10}}>
                {restarting ? '재시작 중...' : '재시작'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Section 2: Mac mini Resources */}
      <div className="card">
        <div className="card-title">
          Mac mini 리소스
          <button className="btn-refresh" onClick={sysR}>↻</button>
        </div>
        {sysL && !sys ? <div className="loading">로딩 중...</div> : sys?.ok ? (
          <>
            <Gauge label="CPU" pct={sys.cpu} val={`${sys.cpu}%`} extra="8코어" />
            <Gauge label="RAM" pct={sys.mem} val={`${sys.memUsed}/${sys.memTotal}G`} />
            {sys.disk && <Gauge label="Disk" pct={parseInt(sys.disk.pct)} val={sys.disk.pct} />}
            <div style={{fontSize:'.73rem',color:'var(--m)',marginTop:6,display:'flex',alignItems:'center',gap:6}}>
              <span>업타임:</span>
              <span className="mono" style={{color:'var(--t)'}}>{sys.uptime}</span>
            </div>
          </>
        ) : <div className="err">로딩 실패</div>}
      </div>

      {/* Section 3: Current Session */}
      <div className="card">
        <div className="card-title">현재 세션</div>
        {sst?.text ? (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {sess.session && (
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div className="dot blue" />
                <span style={{fontSize:'.8rem'}}>{sess.session.split(':').pop()}</span>
              </div>
            )}
            {sess.model && (
              <div style={{fontSize:'.73rem',color:'var(--m)'}}>모델: <span style={{color:'var(--t)'}}>{sess.model}</span></div>
            )}
            {ctxMax > 0 && (
              <div>
                <div style={{fontSize:'.73rem',color:'var(--m)',marginBottom:4}}>
                  컨텍스트: <span className="mono" style={{color:'var(--t)'}}>{formatTokens(ctxUsed)}</span>
                  <span style={{color:'var(--m2)'}}> / {formatTokens(ctxMax)}</span>
                  <span style={{color: ctxPct > 80 ? 'var(--r)' : ctxPct > 50 ? 'var(--y)' : 'var(--g)', marginLeft:6}}>{ctxPct}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${ctxPct}%`,
                    background: ctxPct > 80 ? 'var(--r)' : ctxPct > 50 ? 'var(--y)' : 'linear-gradient(90deg,var(--p),var(--pl))'
                  }} />
                </div>
              </div>
            )}
            {sess.cost && (
              <div style={{fontSize:'.73rem',color:'var(--m)'}}>비용: <span className="mono" style={{color:'var(--y)'}}>{sess.cost}</span></div>
            )}
            {sess.time && (
              <div style={{fontSize:'.73rem',color:'var(--m)'}}>시간: <span style={{color:'var(--t)'}}>{sess.time}</span></div>
            )}
            {token?.totalTokens && (
              <div style={{fontSize:'.73rem',color:'var(--m)'}}>
                총 토큰: <span className="mono" style={{color:'var(--t)'}}>{formatTokens(token.totalTokens)}</span>
                <span style={{color:'var(--m2)',marginLeft:6}}>
                  (in:{formatTokens(token.inputTokens)} out:{formatTokens(token.outputTokens)} cache:{formatTokens(token.cacheRead)})
                </span>
              </div>
            )}
          </div>
        ) : <div className="loading">세션 정보 없음</div>}
      </div>

      {/* Section 4: Today Stats */}
      <div className="card">
        <div className="card-title">오늘 통계</div>
        {today?.ok ? (
          <div className="stat-grid">
            <div className="stat-item">
              <div className="stat-value text-purple">{today.sessionCount || 0}</div>
              <div className="stat-label">세션</div>
            </div>
            <div className="stat-item">
              <div className="stat-value text-blue">{formatTokens(today.totalTokens)}</div>
              <div className="stat-label">토큰</div>
            </div>
            <div className="stat-item">
              <div className="stat-value text-yellow">{formatCost(today.estimatedCost)}</div>
              <div className="stat-label">비용</div>
            </div>
          </div>
        ) : <div className="loading">통계 로딩 중...</div>}
      </div>
    </div>
  );
}
