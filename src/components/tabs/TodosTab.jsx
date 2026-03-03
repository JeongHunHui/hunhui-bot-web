import { useApi } from '../../hooks/useApi.js';
import { api } from '../../api.js';

export default function TodosTab() {
  const { data, loading, reload } = useApi(api.todos, [], 60000);

  const pending = data?.pending || [];
  const done = data?.done || [];
  const total = pending.length + done.length;
  const pct = total > 0 ? Math.round((done.length / total) * 100) : 0;

  return (
    <div className="tab-content">
      {/* 진행률 */}
      {!loading && total > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">진행률</span>
            <span className="mono text-sm text-purple">{done.length}/{total} ({pct}%)</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{width:`${pct}%`}} />
          </div>
        </div>
      )}

      {/* 진행 중 */}
      <div className="card">
        <div className="card-title">진행 중 ({pending.length}) <button className="btn-refresh" onClick={reload}>↻</button></div>
        {loading ? <p className="loading">로딩 중...</p> :
         !pending.length ? <p className="text-green text-center" style={{padding:12,fontSize:'.82rem'}}>모두 완료!</p> :
         pending.map((t, i) => (
          <div key={i} className="list-item">
            <div className="todo-check" />
            <div className="li-body"><div className="todo-text">{typeof t === 'object' ? t.text : t}</div></div>
          </div>
        ))}
      </div>

      {/* 완료됨 */}
      <div className="card">
        <div className="card-title">완료됨 ({done.length})</div>
        {loading ? <p className="loading">로딩 중...</p> :
         !done.length ? <p className="text-sm text-muted text-center" style={{padding:8}}>완료 항목 없음</p> :
         done.map((t, i) => (
          <div key={i} className="list-item">
            <div className="todo-check done">✓</div>
            <div className="li-body"><div className="todo-text done">{typeof t === 'object' ? t.text : t}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
