import { useState, useEffect, useRef } from 'react';
import { api } from '../../api.js';

const FILTERS = ['ALL', 'INFO', 'WARN', 'ERROR', 'HTTP'];

export default function LogsTab() {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [prevCount, setPrevCount] = useState(0);
  const bottomRef = useRef(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const r = await api.logs();
      if (r.ok) {
        setPrevCount(lines.length);
        setLines(r.lines || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(fetchLogs, 3000);
    return () => clearInterval(t);
  }, [autoRefresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const getLevel = (line) => {
    if (line.includes('[ERROR]')) return 'ERROR';
    if (line.includes('[WARN ]') || line.includes('[WARN]')) return 'WARN';
    if (line.includes('[HTTP ]') || line.includes('[HTTP]')) return 'HTTP';
    return 'INFO';
  };

  const levelClass = {
    ERROR: 'log-error',
    WARN: 'log-warn',
    HTTP: 'log-http',
    INFO: 'log-info',
  };

  const filtered = lines.filter(line => {
    if (filter !== 'ALL' && getLevel(line) !== filter) return false;
    if (search && !line.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="tab-content">
      <div className="card" style={{padding:12}}>
        {/* 필터 바 */}
        <div className="filter-bar">
          {FILTERS.map(f => (
            <button key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        {/* 검색 + 옵션 */}
        <div className="flex items-center gap-2 mb-2">
          <input
            className="search-input"
            type="text"
            placeholder="검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{flex:1}}
          />
          <label className="flex items-center gap-2 text-xs text-muted shrink-0" style={{cursor:'pointer'}}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            자동
          </label>
          <button className="btn-refresh" onClick={fetchLogs} disabled={loading}>
            {loading ? '...' : '↻'}
          </button>
        </div>

        <div className="text-xs text-muted mb-2" style={{textAlign:'right'}}>
          {filtered.length}/{lines.length}줄
        </div>

        {/* 로그 영역 */}
        <div className="log-viewer">
          {filtered.length === 0
            ? <p className="text-muted">로그 없음</p>
            : filtered.map((line, i) => {
                const level = getLevel(line);
                const isNew = i >= prevCount && prevCount > 0;
                return (
                  <div key={i}
                    className={`log-line ${levelClass[level] || ''}`}
                    style={isNew ? {background:'rgba(124,58,237,.1)'} : undefined}>
                    {line}
                  </div>
                );
              })
          }
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
