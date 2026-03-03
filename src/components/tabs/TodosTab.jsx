import { useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../api.js';

function getItemText(item) {
  return typeof item === 'string' ? item : item?.text || '';
}

function getItemPriority(item) {
  if (typeof item === 'string') {
    if (item.startsWith('🔴') || item.startsWith('[!]')) return 'high';
    if (item.startsWith('🟡') || item.startsWith('[*]')) return 'medium';
    return 'normal';
  }
  return item?.priority || 'normal';
}

const PRIORITY_BADGE = {
  high: { cls: 'badge badge-red', label: '긴급' },
  medium: { cls: 'badge badge-yellow', label: '중요' },
  normal: { cls: '', label: '' },
};

export default function TodosTab() {
  const { data, loading, reload } = useApi(api.todos, [], 30000);
  const [filter, setFilter] = useState('all'); // all, pending, done

  const pending = data?.pending || [];
  const done = data?.done || [];
  const total = pending.length + done.length;
  const pct = total > 0 ? Math.round(done.length / total * 100) : 0;

  return (
    <div className="tab-content animate-in">
      {/* Progress overview */}
      <div className="card">
        <div className="card-title">
          진행 상황
          <button className="btn-refresh" onClick={reload}>↻</button>
        </div>
        <div className="stat-grid" style={{marginBottom:12}}>
          <div className="stat-item">
            <div className="stat-value text-purple">{pending.length}</div>
            <div className="stat-label">진행 중</div>
          </div>
          <div className="stat-item">
            <div className="stat-value text-green">{done.length}</div>
            <div className="stat-label">완료</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{color:'var(--t)'}}>{pct}%</div>
            <div className="stat-label">달성률</div>
          </div>
        </div>
        <div className="progress-bar" style={{height:8}}>
          <div className="progress-fill" style={{width:`${pct}%`,background:pct===100?'var(--g)':'linear-gradient(90deg,var(--p),var(--pl))'}} />
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{display:'flex',gap:6,padding:'0 2px'}}>
        {[['all','전체',total],['pending','진행중',pending.length],['done','완료',done.length]].map(([k,l,c])=>(
          <button key={k} onClick={()=>setFilter(k)}
            className={`filter-btn ${filter===k?'active':''}`}
            style={{flex:1}}>
            {l} ({c})
          </button>
        ))}
      </div>

      {/* Pending items */}
      {(filter === 'all' || filter === 'pending') && pending.length > 0 && (
        <div className="card">
          <div className="card-title">진행 중</div>
          {pending.map((t, i) => {
            const text = getItemText(t);
            const pri = getItemPriority(t);
            const priInfo = PRIORITY_BADGE[pri];
            return (
              <div key={i} className="list-item" style={{alignItems:'center'}}>
                <div className="todo-check" />
                <div className="li-body">
                  <div className="todo-text">{text}</div>
                </div>
                {priInfo.label && <span className={priInfo.cls}>{priInfo.label}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Done items */}
      {(filter === 'all' || filter === 'done') && done.length > 0 && (
        <div className="card" style={{opacity:filter==='all'?0.7:1}}>
          <div className="card-title">완료됨</div>
          {done.map((t, i) => (
            <div key={i} className="list-item" style={{alignItems:'center'}}>
              <div className="todo-check done">✓</div>
              <div className="li-body">
                <div className="todo-text done">{getItemText(t)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {loading && !data && <div className="loading">로딩 중...</div>}
      {!loading && total === 0 && (
        <div className="card" style={{textAlign:'center',padding:24}}>
          <div style={{fontSize:32,marginBottom:8}}>🎉</div>
          <div style={{color:'var(--m)'}}>할 일이 없어요!</div>
        </div>
      )}
    </div>
  );
}
