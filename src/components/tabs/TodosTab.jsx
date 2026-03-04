import { useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../api.js';

const FILTERS = ['전체', '진행중', '완료'];

export default function TodosTab() {
  const { data, loading, reload } = useApi(api.todos, [], 30000);
  const [filter, setFilter] = useState('전체');
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [busyItem, setBusyItem] = useState(null);

  const pending = data?.pending || [];
  const done = data?.done || [];
  const total = pending.length + done.length;
  const pct = total > 0 ? Math.round((done.length / total) * 100) : 0;

  async function handleAdd() {
    const text = input.trim();
    if (!text || adding) return;
    setAdding(true);
    try {
      await api.todoAdd(text);
      setInput('');
      reload();
    } catch {}
    setAdding(false);
  }

  async function handleToggle(text, isDone) {
    setBusyItem(text);
    try {
      await api.todoToggle(text, !isDone);
      reload();
    } catch {}
    setBusyItem(null);
  }

  async function handleDelete(text) {
    if (!confirm('삭제할까요?\n"' + text + '"')) return;
    setBusyItem(text + '__del');
    try {
      await api.todoDelete(text);
      reload();
    } catch {}
    setBusyItem(null);
  }

  const visiblePending = filter === '완료' ? [] : pending;
  const visibleDone = filter === '진행중' ? [] : done;

  return (
    <div className="tab-content">
      {!loading && total > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">진행률</span>
            <span className="mono text-sm text-purple">{done.length}/{total} ({pct}%)</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: pct + '%' }} />
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 10 }}>
        <div className="flex items-center gap-2">
          <input
            className="search-input"
            style={{ flex: 1 }}
            type="text"
            placeholder="새 할 일 추가..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            disabled={adding}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !input.trim()}
            style={{
              background: 'var(--p)', border: 'none', borderRadius: 8, color: '#fff',
              padding: '7px 14px', cursor: 'pointer', fontSize: '.82rem', fontWeight: 600,
              opacity: (adding || !input.trim()) ? 0.5 : 1, flexShrink: 0,
            }}
          >{adding ? '...' : '추가'}</button>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: 8 }}>
        {FILTERS.map(f => (
          <button key={f} className={'filter-btn ' + (filter === f ? 'active' : '')} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
        <button className="btn-refresh" onClick={reload} style={{ marginLeft: 'auto' }}>↻</button>
      </div>

      {filter !== '완료' && (
        <div className="card">
          <div className="card-title">진행 중 ({pending.length})</div>
          {loading ? <p className="loading">로딩 중...</p> :
           !visiblePending.length
            ? <p className="text-green text-center" style={{ padding: 12, fontSize: '.82rem' }}>
                {filter === '진행중' ? '진행 중인 항목 없음' : '모두 완료! 🎉'}
              </p>
            : visiblePending.map((t, i) => {
                const text = typeof t === 'object' ? t.text : t;
                const busy = busyItem === text;
                return (
                  <div key={i} className="list-item" style={{ gap: 8 }}>
                    <button
                      onClick={() => handleToggle(text, false)}
                      disabled={busy}
                      style={{
                        width: 18, height: 18, borderRadius: 4, border: '2px solid var(--p)',
                        background: 'transparent', cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: busy ? 0.4 : 1,
                      }}
                    />
                    <div className="li-body" style={{ flex: 1 }}>
                      <div className="todo-text">{text}</div>
                    </div>
                    <button
                      onClick={() => handleDelete(text)}
                      disabled={busyItem === text + '__del'}
                      style={{
                        background: 'none', border: 'none', color: 'var(--r)', cursor: 'pointer',
                        fontSize: '.85rem', padding: '2px 6px', borderRadius: 4, opacity: 0.6, flexShrink: 0,
                      }}
                    >✕</button>
                  </div>
                );
              })
          }
        </div>
      )}

      {filter !== '진행중' && (
        <div className="card">
          <div className="card-title">완료됨 ({done.length})</div>
          {loading ? <p className="loading">로딩 중...</p> :
           !visibleDone.length
            ? <p className="text-sm text-muted text-center" style={{ padding: 8 }}>완료 항목 없음</p>
            : visibleDone.map((t, i) => {
                const text = typeof t === 'object' ? t.text : t;
                const busy = busyItem === text;
                return (
                  <div key={i} className="list-item" style={{ gap: 8, opacity: 0.7 }}>
                    <button
                      onClick={() => handleToggle(text, true)}
                      disabled={busy}
                      style={{
                        width: 18, height: 18, borderRadius: 4, border: '2px solid var(--g)',
                        background: 'var(--g)', cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 10, fontWeight: 700, opacity: busy ? 0.4 : 1,
                      }}
                    >✓</button>
                    <div className="li-body" style={{ flex: 1 }}>
                      <div className="todo-text done">{text}</div>
                    </div>
                    <button
                      onClick={() => handleDelete(text)}
                      disabled={busyItem === text + '__del'}
                      style={{
                        background: 'none', border: 'none', color: 'var(--r)', cursor: 'pointer',
                        fontSize: '.85rem', padding: '2px 6px', borderRadius: 4, opacity: 0.5, flexShrink: 0,
                      }}
                    >✕</button>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}
