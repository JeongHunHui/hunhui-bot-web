import { useApi } from '../../hooks/useApi.js';
import { api } from '../../api.js';

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
  return `${Math.floor(diff/86400)}일 전`;
}

function AgentRow({ s, isActive }) {
  return (
    <div className={`list-item`} style={{padding:'8px 0'}}>
      <div style={{
        width:8, height:8, borderRadius:'50%', flexShrink:0, marginTop:5,
        background: isActive ? 'var(--g)' : 'var(--m)',
        boxShadow: isActive ? '0 0 6px var(--g)' : 'none',
        opacity: isActive ? 1 : 0.5,
      }} />
      <div className="li-body">
        <div className="li-title" style={{color: isActive ? 'var(--t)' : 'var(--m)'}}>
          {s.displayName || s.sessionId?.slice(0,8)}
        </div>
        <div className="li-sub">
          #{s.channel} · {timeAgo(s.updatedAt)} · {s.lineCount}줄
        </div>
      </div>
      {isActive && <span className="badge badge-green">활성</span>}
    </div>
  );
}

export default function AgentsTab() {
  const { data, loading, reload } = useApi(api.sessions, [], 15000);
  const sessions = data?.sessions || [];

  const active = sessions.filter(s => s.active);
  const recent = sessions.filter(s => !s.active).slice(0, 20);

  return (
    <div className="tab-content">
      {/* 활성 에이전트 */}
      <div className={`card ${active.length ? 'glow-green' : ''}`}>
        <div className="card-title">
          활성 에이전트 ({active.length})
          <button className="btn-refresh" onClick={reload}>↻</button>
        </div>
        {loading ? <p className="loading">로딩 중...</p> :
         !active.length ? <p className="text-sm text-muted text-center" style={{padding:8}}>활성 에이전트 없음</p> :
         active.map(s => <AgentRow key={s.key || s.sessionId} s={s} isActive />)
        }
      </div>

      {/* 최근 세션 이력 */}
      <div className="card">
        <div className="card-title">최근 세션 이력 ({recent.length})</div>
        {loading ? <p className="loading">로딩 중...</p> :
         !recent.length ? <p className="text-sm text-muted text-center" style={{padding:8}}>최근 세션 없음</p> :
         recent.map(s => <AgentRow key={s.key || s.sessionId} s={s} isActive={false} />)
        }
      </div>
    </div>
  );
}
