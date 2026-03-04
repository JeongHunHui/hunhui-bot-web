import { useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../api.js';

function Gauge({ label, pct, detail }) {
  const color = pct > 85 ? 'var(--r)' : pct > 60 ? 'var(--y)' : 'var(--g)';
  return (
    <div className="gauge-row">
      <span className="gauge-label">{label}</span>
      <div className="gauge-bar">
        <div className="gauge-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <span className="gauge-val mono">{detail}</span>
    </div>
  );
}

function parseSessionStatus(text) {
  if (!text) return null;
  const result = {};
  for (const line of text.split('\n')) {
    const modelMatch = line.match(/Model:\s*(\S+)/i);
    if (modelMatch) result.model = modelMatch[1];
    const tokenMatch = line.match(/([\d,]+)\s*tokens/i);
    if (tokenMatch) result.tokens = tokenMatch[1];
    const costMatch = line.match(/\$[\d.]+/);
    if (costMatch) result.cost = costMatch[0];
    if (/session/i.test(line) && /:/.test(line) && !result.session) {
      result.session = line.split(/:\s*/).slice(1).join(':').trim();
    }
    if (/time/i.test(line) && !/uptime/i.test(line)) {
      const v = line.split(/Time:\s*/i).pop()?.trim();
      if (v) result.time = v;
    }
  }
  return Object.keys(result).length ? result : null;
}

function formatUptime(str) {
  if (!str) return '-';
  const m = str.match(/(\d+)h\s*(\d+)m/);
  if (!m) return str;
  const hours = parseInt(m[1]);
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return days > 0 ? `${days}d ${rem}h ${m[2]}m` : str;
}

function fmtTokens(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

export default function SystemTab() {
  const { data: st, loading: stL, reload: stR } = useApi(api.status, [], 30000);
  const { data: oci, loading: ociL, reload: ociR } = useApi(api.openclawInfo, [], 20000);
  const { data: sys, loading: sysL, reload: sysR } = useApi(api.system, [], 10000);
  const { data: claude, loading: claudeL } = useApi(api.claudeStatus, [], 60000);
  const { data: sst, loading: sstL } = useApi(api.sessionStatus, [], 30000);
  const { data: stats, loading: statsL } = useApi(api.todayStats, [], 60000);
  const [restarting, setRestarting] = useState(false);

  async function restart() {
    setRestarting(true);
    try { await api.restart(); } catch {}
    setTimeout(() => { setRestarting(false); stR(); }, 4000);
  }

  const isOk = st?.ok && st?.gateway;
  const sessionInfo = parseSessionStatus(sst?.text);

  return (
    <div className="tab-content" style={{overflowY:"auto",height:"100%"}}>
      {/* OpenClaw + 서버 상태 */}
      <div className={`card ${isOk ? 'glow-green' : 'glow-red'}`}>
        <div className="card-title">OpenClaw 상태 <button className="btn-refresh" onClick={stR}>↻</button></div>
        {stL ? <p className="loading">확인 중...</p> : (
          <>
            <div className="status-row" style={{marginBottom:10}}>
              <div className={`dot ${isOk ? 'green' : 'red'} ${isOk ? 'pulse' : ''}`} />
              <span className="status-label">{isOk ? '정상 동작 중' : '응답 없음'}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'4px 12px',fontSize:'.78rem'}}>
              {st?.pid && <><span style={{color:'var(--m)'}}>PID</span><span className="mono">{st.pid}</span></>}
              {st?.url && <><span style={{color:'var(--m)'}}>Gateway</span><span className="mono" style={{fontSize:'.72rem'}}>{st.url}</span></>}
              {!claudeL && claude?.model && <><span style={{color:'var(--m)'}}>모델</span><span className="mono">{claude.model}</span></>}
              {!claudeL && claude?.version && <><span style={{color:'var(--m)'}}>Claude 버전</span><span className="mono">{claude.version}</span></>}
            </div>
            {!isOk && (
              <button className="btn btn-danger" onClick={restart} disabled={restarting} style={{marginTop:12}}>
                {restarting ? '재시작 중...' : '재시작'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Mac mini 리소스 게이지 */}
      <div className="card">
        <div className="card-title">Mac mini 리소스 <button className="btn-refresh" onClick={sysR}>↻</button></div>
        {sysL ? <p className="loading">로딩 중...</p> : sys?.ok ? (
          <>
            <Gauge label="CPU" pct={sys.cpu} detail={`${sys.cpu}% · ${sys.cpuCores || 8}코어`} />
            <Gauge label="RAM" pct={sys.mem} detail={`${sys.memUsed}/${sys.memTotal}GB`} />
            {sys.disk && <Gauge label="Disk" pct={parseInt(sys.disk.pct)} detail={`${sys.disk.used}/${sys.disk.total}`} />}
            <div style={{fontSize:'.75rem',color:'var(--m)',marginTop:6,display:'flex',alignItems:'center',gap:6}}>
              <span>업타임:</span>
              <span className="mono">{formatUptime(sys.uptime)}</span>
            </div>
          </>
        ) : <p className="err">로딩 실패</p>}
      </div>

      {/* 세션 현황 */}
      <div className="card">
        <div className="card-title">세션 현황</div>
        {sstL ? <p className="loading">확인 중...</p> : sst?.text ? (
          sessionInfo ? (
            <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'4px 12px',fontSize:'.78rem'}}>
              {sessionInfo.session && <><span style={{color:'var(--m)'}}>현재 세션</span><span className="mono" style={{fontSize:'.72rem'}}>{sessionInfo.session}</span></>}
              {sessionInfo.model && <><span style={{color:'var(--m)'}}>모델</span><span className="mono">{sessionInfo.model}</span></>}
              {sessionInfo.tokens && <><span style={{color:'var(--m)'}}>컨텍스트</span><span className="mono">{sessionInfo.tokens} 토큰</span></>}
              {sessionInfo.cost && <><span style={{color:'var(--m)'}}>비용 추정</span><span className="mono">~{sessionInfo.cost}</span></>}
              {sessionInfo.time && <><span style={{color:'var(--m)'}}>시간</span><span className="mono">{sessionInfo.time}</span></>}
            </div>
          ) : (
            <pre style={{fontSize:'.7rem',color:'var(--m)',whiteSpace:'pre-wrap',margin:0,lineHeight:1.5}}>{sst.text}</pre>
          )
        ) : <p style={{fontSize:'.78rem',color:'var(--m)'}}>세션 정보 없음</p>}
      </div>

      {/* OpenClaw 상세 정보 */}
      <div className="card">
        <div className="card-title">OpenClaw 상세 <button className="btn-refresh" onClick={ociR}>↻</button></div>
        {ociL ? <p className="loading">확인 중...</p> : oci?.ok ? (
          <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'4px 12px',fontSize:'.78rem'}}>
            {oci.version && <><span style={{color:'var(--m)'}}>버전</span><span className="mono">{oci.version}</span></>}
            {oci.contextPct !== undefined && (
              <>
                <span style={{color:'var(--m)'}}>컨텍스트</span>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{flex:1,height:6,background:'var(--b)',borderRadius:3}}>
                    <div style={{height:'100%',borderRadius:3,background:oci.contextPct>80?'var(--r)':oci.contextPct>60?'var(--y)':'var(--pl)',width:oci.contextPct+'%',transition:'width .5s'}} />
                  </div>
                  <span className="mono" style={{flexShrink:0}}>{oci.contextUsed}/{oci.contextMax} ({oci.contextPct}%)</span>
                </div>
              </>
            )}
            {oci.cacheHit !== undefined && <><span style={{color:'var(--m)'}}>캐시 히트</span><span className="mono text-green">{oci.cacheHit}%</span></>}
            {oci.compactions !== undefined && <><span style={{color:'var(--m)'}}>압축 횟수</span><span className="mono">{oci.compactions}</span></>}
            {oci.thinking && <><span style={{color:'var(--m)'}}>Thinking</span><span className="mono">{oci.thinking}</span></>}
            {oci.queue && <><span style={{color:'var(--m)'}}>큐 상태</span><span className="mono" style={{fontSize:'.72rem'}}>{oci.queue}</span></>}
          </div>
        ) : <p style={{fontSize:'.78rem',color:'var(--m)'}}>정보 없음</p>}
      </div>

      {/* 오늘 통계 */}
      <div className="card">
        <div className="card-title">오늘 통계</div>
        {statsL ? <p className="loading">로딩 중...</p> : stats?.ok ? (
          <div className="stat-grid">
            <div className="stat-item">
              <div className="stat-value text-purple">{stats.sessionCount || 0}</div>
              <div className="stat-label">세션</div>
            </div>
            <div className="stat-item">
              <div className="stat-value text-blue">{stats.messageCount || 0}</div>
              <div className="stat-label">메시지</div>
            </div>
            <div className="stat-item">
              <div className="stat-value text-green">{fmtTokens(stats.totalTokens)}</div>
              <div className="stat-label">토큰 (오늘)</div>
            </div>
          </div>
        ) : <p style={{fontSize:'.78rem',color:'var(--m)'}}>통계 로딩 실패</p>}
      </div>
    </div>
  );
}
