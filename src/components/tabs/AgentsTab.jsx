import { useApi } from '../../hooks/useApi.js';
import { api } from '../../api.js';

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

function formatTokens(n) {
  if (!n) return '-';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return Math.round(n / 1_000) + 'K';
  return String(n);
}

export default function AgentsTab() {
  const { data, loading, reload } = useApi(api.sessions, [], 15000);
  const sessions = data?.sessions || [];
  const active = sessions.filter(s => s.active);
  const recent = sessions.filter(s => !s.active);

  return (
    <div className="tab-content animate-in">
      {/* Summary stats */}
      <div className="stat-grid">
        <div className="stat-item">
          <div className="stat-value text-green">{active.length}</div>
          <div className="stat-label">활성</div>
        </div>
        <div className="stat-item">
          <div className="stat-value text-purple">{sessions.length}</div>
          <div className="stat-label">전체</div>
        </div>
        <div className="stat-item">
          <div className="stat-value text-blue">{formatTokens(sessions.reduce((s, x) => s + (x.totalTokens || 0), 0))}</div>
          <div className="stat-label">토큰</div>
        </div>
      </div>

      {/* Active agents */}
      <div className={`card ${active.length ? 'glow-green' : ''}`}>
        <div className="card-title">
          활성 에이전트
          <button className="btn-refresh" onClick={reload}>↻</button>
        </div>
        {loading && !data ? <div className="loading">로딩 중...</div> :
         !active.length ? <div className="loading" style={{color:'var(--m2)'}}>활성 에이전트 없음</div> :
         active.map(s => (
          <div key={s.sessionId} className="list-item">
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,paddingTop:2}}>
              <div className="dot green pulse" />
            </div>
            <div className="li-body">
              <div className="li-title">{s.displayName || s.sessionId?.slice(0, 8)}</div>
              <div className="li-sub" style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:3}}>
                <span>#{s.channel}</span>
                <span className="mono">{timeAgo(s.updatedAt)}</span>
                <span>{s.lineCount}줄</span>
                {s.totalTokens ? <span className="mono">{formatTokens(s.totalTokens)}</span> : null}
              </div>
              {s.firstMsg && (
                <div style={{fontSize:'.68rem',color:'var(--m2)',marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.firstMsg}</div>
              )}
            </div>
            <span className="badge badge-green">활성</span>
          </div>
        ))}
      </div>

      {/* Recent sessions */}
      <div className="card">
        <div className="card-title">최근 세션 이력</div>
        {!recent.length ? <div className="loading" style={{color:'var(--m2)'}}>이력 없음</div> :
         recent.slice(0, 15).map(s => (
          <div key={s.sessionId} className="list-item">
            <div style={{paddingTop:3}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:'var(--m2)'}} />
            </div>
            <div className="li-body">
              <div className="li-title" style={{fontWeight:500}}>{s.displayName || s.sessionId?.slice(0, 8)}</div>
              <div className="li-sub" style={{display:'flex',gap:8}}>
                <span>#{s.channel}</span>
                <span>{timeAgo(s.updatedAt)}</span>
                <span>{s.lineCount}줄</span>
                {s.totalTokens ? <span className="mono">{formatTokens(s.totalTokens)}</span> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
