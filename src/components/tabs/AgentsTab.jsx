import { useApi } from '../../hooks/useApi.js';
import { api } from '../../api.js';

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
  return `${Math.floor(diff/3600)}시간 전`;
}

export default function AgentsTab() {
  const { data, loading, reload } = useApi(api.sessions, [], 15000);
  const sessions = data?.sessions || [];

  return (
    <div className="tab-content">
      <div className="card">
        <div className="card-title">진행 중인 작업 <button className="btn-refresh" onClick={reload}>↻</button></div>
        {loading ? <p className="loading">로딩 중...</p> :
         !sessions.length ? <p className="loading">활성 세션 없음</p> :
         sessions.map(s => (
          <div key={s.key} className="list-item">
            <div className="li-icon">{s.abortedLastRun ? '⚠️' : '🤖'}</div>
            <div className="li-body">
              <div className="li-title">{s.displayName || s.key}</div>
              <div className="li-sub">
                {s.model?.split('/').pop()} · {timeAgo(s.updatedAt)}
                {s.totalTokens ? ` · ${Math.round(s.totalTokens/1000)}k tokens` : ''}
              </div>
            </div>
            <span className={`badge ${s.abortedLastRun ? 'badge-red' : 'badge-green'}`}>
              {s.abortedLastRun ? '중단' : '활성'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
