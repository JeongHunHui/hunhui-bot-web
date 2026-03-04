import { useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../api.js';

function fmtTokens(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
  if (n >= 1000) return (n/1000).toFixed(1)+'K';
  return String(n);
}

function Gauge({ label, pct, detail, color }) {
  const c = color || (pct > 85 ? 'var(--r)' : pct > 60 ? 'var(--y)' : 'var(--g)');
  return (
    <div style={{marginBottom:8}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:'.75rem',marginBottom:3}}>
        <span style={{color:'var(--m)'}}>{label}</span>
        <span className="mono">{detail}</span>
      </div>
      <div style={{height:6,background:'var(--b)',borderRadius:3}}>
        <div style={{height:'100%',borderRadius:3,background:c,width:Math.min(pct,100)+'%',transition:'width .5s'}} />
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'3px 12px',marginBottom:3}}>
      <span style={{color:'var(--m)',fontSize:'.75rem'}}>{label}</span>
      <span className={mono ? 'mono' : ''} style={{fontSize:'.75rem',wordBreak:'break-all'}}>{value}</span>
    </div>
  );
}

function formatUptime(str) {
  if (!str) return '-';
  const m = str.match(/(\d+)h\s*(\d+)m/);
  if (!m) return str;
  const hours = parseInt(m[1]);
  const days = Math.floor(hours/24);
  const rem = hours%24;
  return days > 0 ? `${days}d ${rem}h ${m[2]}m` : str;
}

function timeAgo(ms) {
  if (!ms) return '-';
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
  return `${Math.floor(diff/86400)}일 전`;
}

export default function SystemTab() {
  const { data: sys, loading: sysL, reload: sysR } = useApi(api.system, [], 15000);
  const { data: oci, loading: ociL, reload: ociR } = useApi(api.openclawInfo, [], 20000);
  const { data: ocs, loading: ocsL, reload: ocsR } = useApi(api.openclawStatus, [], 30000);
  const { data: och, loading: ochL, reload: ochR } = useApi(api.openclawHealth, [], 60000);
  const { data: stats } = useApi(api.todayStats, [], 60000);

  const sessions = ocs?.sessions?.recent || [];
  const activeSessions = sessions.filter(s => s.percentUsed > 0);
  const slackHealth = och?.channels?.slack;
  const updateInfo = ocs?.update;
  const osInfo = ocs?.os;

  function reloadAll() { sysR(); ociR(); ocsR(); ochR(); }

  return (
    <div className="tab-content" style={{overflowY:'auto',height:'100%'}}>

      {/* 상단 stat 카드 */}
      <div className="stat-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        <div className="stat-item">
          <div className="stat-value text-green">{ocs?.sessions?.count || 0}</div>
          <div className="stat-label">전체 세션</div>
        </div>
        <div className="stat-item">
          <div className="stat-value text-purple">{activeSessions.length}</div>
          <div className="stat-label">활성 세션</div>
        </div>
        <div className="stat-item">
          <div className="stat-value text-blue">{fmtTokens(stats?.totalTokens)}</div>
          <div className="stat-label">오늘 토큰</div>
        </div>
      </div>

      {/* OpenClaw 현재 세션 상태 */}
      <div className="card">
        <div className="card-title">
          현재 세션 상태
          <button className="btn-refresh" onClick={ociR}>↻</button>
        </div>
        {ociL ? <p className="loading">확인 중...</p> : oci?.ok ? (
          <>
            <InfoRow label="버전" value={oci.version} mono />
            <InfoRow label="모델" value={oci.model} mono />
            <InfoRow label="Thinking" value={oci.thinking} mono />
            <InfoRow label="큐 상태" value={oci.queue} mono />
            <InfoRow label="세션 키" value={oci.sessionKey} mono />
            <InfoRow label="압축" value={oci.compactions !== undefined ? oci.compactions+'회' : null} />
            {oci.contextPct !== undefined && (
              <div style={{marginTop:8}}>
                <Gauge label="컨텍스트" pct={oci.contextPct}
                  detail={`${oci.contextUsed}/${oci.contextMax} (${oci.contextPct}%)`}
                  color={oci.contextPct > 80 ? 'var(--r)' : oci.contextPct > 60 ? 'var(--y)' : 'var(--pl)'} />
                <Gauge label="캐시 히트율" pct={oci.cacheHit || 0}
                  detail={`${oci.cacheHit || 0}%`} color="var(--g)" />
              </div>
            )}
          </>
        ) : <p style={{fontSize:'.78rem',color:'var(--m)'}}>정보 없음</p>}
      </div>

      {/* 활성 세션 목록 (openclaw status에서) */}
      <div className="card">
        <div className="card-title">
          세션 컨텍스트 현황 ({sessions.length}개)
          <button className="btn-refresh" onClick={ocsR}>↻</button>
        </div>
        {ocsL ? <p className="loading">로딩 중...</p> : !sessions.length
          ? <p style={{fontSize:'.78rem',color:'var(--m)',textAlign:'center',padding:8}}>세션 없음</p>
          : sessions.slice(0,8).map((s, i) => {
              const pct = s.percentUsed || 0;
              const ch = s.key.includes('slack') ? 'slack' : s.key.includes('telegram') ? 'telegram' : 'unknown';
              const chColor = { slack:'#10b981', telegram:'#3b82f6', unknown:'#6b7280' }[ch];
              return (
                <div key={i} style={{marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'.72rem',marginBottom:3}}>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:chColor,flexShrink:0}} />
                      <span style={{color:'var(--t)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:140}}>
                        {s.key.replace('agent:main:','').replace('slack:channel:','#slack ')}
                      </span>
                    </div>
                    <span className="mono" style={{color:pct>80?'var(--r)':pct>60?'var(--y)':'var(--m)',flexShrink:0}}>
                      {fmtTokens(s.totalTokens)} / {fmtTokens(s.contextTokens)} ({pct}%)
                    </span>
                  </div>
                  <div style={{height:4,background:'var(--b)',borderRadius:2}}>
                    <div style={{
                      height:'100%',borderRadius:2,transition:'width .5s',
                      background:pct>80?'var(--r)':pct>60?'var(--y)':'var(--pl)',
                      width:Math.min(pct,100)+'%'
                    }} />
                  </div>
                  <div style={{fontSize:'.65rem',color:'var(--m)',marginTop:2}}>
                    {timeAgo(s.updatedAt)} · {s.abortedLastRun ? '⚠️ abort' : '✓'} · {s.model?.replace('claude-','c-')}
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* Mac mini 리소스 */}
      <div className="card">
        <div className="card-title">
          Mac mini 리소스
          <button className="btn-refresh" onClick={sysR}>↻</button>
        </div>
        {sysL ? <p className="loading">로딩 중...</p> : sys?.ok ? (
          <>
            <Gauge label="CPU" pct={sys.cpu} detail={`${sys.cpu}% · ${sys.cpuCores||8}코어`} />
            <Gauge label="RAM" pct={sys.mem} detail={`${sys.memUsed}/${sys.memTotal}GB`} />
            {sys.disk && <Gauge label="Disk" pct={parseInt(sys.disk.pct)} detail={`${sys.disk.used}/${sys.disk.total}`} />}
            <div style={{fontSize:'.72rem',color:'var(--m)',marginTop:6,display:'flex',gap:8}}>
              <span>업타임: <span className="mono">{formatUptime(sys.uptime)}</span></span>
              {osInfo && <span>OS: <span className="mono">{osInfo.label}</span></span>}
            </div>
          </>
        ) : <p style={{color:'var(--m)',fontSize:'.78rem'}}>로딩 실패</p>}
      </div>

      {/* 채널 상태 (health) */}
      <div className="card">
        <div className="card-title">
          채널 상태
          <button className="btn-refresh" onClick={ochR}>↻</button>
        </div>
        {ochL ? <p className="loading">확인 중...</p> : och?.ok ? (
          <div>
            {och.channels && Object.entries(och.channels).map(([name, ch]) => (
              <div key={name} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,padding:'6px 0',borderBottom:'1px solid var(--b)'}}>
                <div style={{
                  width:8,height:8,borderRadius:'50%',flexShrink:0,
                  background:ch.probe?.ok?'var(--g)':'var(--r)',
                  boxShadow:ch.probe?.ok?'0 0 5px var(--g)':'none',
                }} />
                <div style={{flex:1}}>
                  <div style={{fontSize:'.8rem',fontWeight:600,textTransform:'capitalize'}}>{name}</div>
                  {ch.probe?.bot && (
                    <div style={{fontSize:'.7rem',color:'var(--m)'}}>
                      @{ch.probe.bot.name} · {ch.probe.team?.name} · {ch.probe.elapsedMs}ms
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize:'.65rem',padding:'2px 7px',borderRadius:4,
                  background:ch.probe?.ok?'rgba(16,185,129,.15)':'rgba(239,68,68,.15)',
                  color:ch.probe?.ok?'var(--g)':'var(--r)',
                }}>{ch.probe?.ok?'OK':'FAIL'}</span>
              </div>
            ))}
            <div style={{fontSize:'.72rem',color:'var(--m)',marginTop:4}}>
              probe: {och.durationMs}ms · {new Date(och.ts).toLocaleTimeString('ko-KR')}
            </div>
          </div>
        ) : <p style={{color:'var(--m)',fontSize:'.78rem'}}>정보 없음</p>}
      </div>

      {/* OpenClaw 업데이트 정보 */}
      {ocs?.update && (
        <div className="card">
          <div className="card-title">업데이트 정보</div>
          <InfoRow label="현재 버전" value={oci?.version} mono />
          <InfoRow label="최신 버전" value={ocs.update.registry?.latestVersion} mono />
          <InfoRow label="채널" value={ocs.updateChannel} />
          {ocs.update.registry?.latestVersion && oci?.version &&
           ocs.update.registry.latestVersion !== oci.version && (
            <div style={{marginTop:8,padding:'6px 10px',borderRadius:6,background:'rgba(251,191,36,.1)',border:'1px solid rgba(251,191,36,.3)',fontSize:'.75rem',color:'var(--y)'}}>
              ⬆️ 업데이트 가능: {oci.version} → {ocs.update.registry.latestVersion}
            </div>
          )}
        </div>
      )}

      {/* 오늘 통계 */}
      <div className="card">
        <div className="card-title">오늘 통계</div>
        <div className="stat-grid">
          <div className="stat-item">
            <div className="stat-value text-purple">{stats?.sessionCount || 0}</div>
            <div className="stat-label">세션</div>
          </div>
          <div className="stat-item">
            <div className="stat-value text-blue">{stats?.messageCount || 0}</div>
            <div className="stat-label">메시지</div>
          </div>
          <div className="stat-item">
            <div className="stat-value text-green">{fmtTokens(stats?.totalTokens)}</div>
            <div className="stat-label">토큰</div>
          </div>
        </div>
      </div>

    </div>
  );
}
