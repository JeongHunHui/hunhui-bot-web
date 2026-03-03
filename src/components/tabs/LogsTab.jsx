import { useState, useEffect, useRef } from 'react';
import { api, API } from '../../api.js';

const LEVELS = ['ALL', 'INFO', 'WARN', 'ERROR', 'HTTP'];

function getLevel(line) {
  if (line.includes('[ERROR]')) return 'ERROR';
  if (line.includes('[WARN')) return 'WARN';
  if (line.includes('[HTTP')) return 'HTTP';
  if (line.includes('[INFO')) return 'INFO';
  return 'DEBUG';
}

function getLevelClass(level) {
  switch (level) {
    case 'ERROR': return 'log-error';
    case 'WARN': return 'log-warn';
    case 'HTTP': return 'log-http';
    case 'INFO': return 'log-info';
    default: return 'log-debug';
  }
}

export default function LogsTab() {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [newCount, setNewCount] = useState(0);
  const bottomRef = useRef(null);
  const prevCountRef = useRef(0);
  const sseRef = useRef(null);

  // Initial load via polling (SSE as enhancement)
  const fetchLogs = async () => {
    try {
      const r = await api.logs();
      if (r.ok) {
        const newLines = r.lines || [];
        if (newLines.length > prevCountRef.current) {
          setNewCount(newLines.length - prevCountRef.current);
          setTimeout(() => setNewCount(0), 3000);
        }
        prevCountRef.current = newLines.length;
        setLines(newLines);
      }
    } catch {} finally {
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
    if (autoRefresh) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines, autoRefresh]);

  // Filter logic
  const filtered = lines.filter(line => {
    if (filter !== 'ALL' && getLevel(line) !== filter) return false;
    if (search && !line.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="tab-content animate-in">
      <div className="card">
        <div className="card-title">
          <span>서버 로그 {newCount > 0 && <span className="badge badge-green" style={{marginLeft:6}}>+{newCount}</span>}</span>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <label style={{display:'flex',alignItems:'center',gap:4,cursor:'pointer',fontSize:'.7rem',color: autoRefresh ? 'var(--g)' : 'var(--m)'}}>
              <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)}
                style={{accentColor:'var(--p)'}} />
              자동
            </label>
            <button className="btn-refresh" onClick={fetchLogs}>↻</button>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          className="search-input"
          placeholder="검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{marginBottom:8}}
        />

        {/* Level filter */}
        <div className="filter-bar">
          {LEVELS.map(l => (
            <button key={l}
              className={`filter-btn ${filter === l ? 'active' : ''}`}
              onClick={() => setFilter(l)}>
              {l}
              {l !== 'ALL' && <span style={{marginLeft:3,opacity:.6}}>
                {lines.filter(line => getLevel(line) === l).length}
              </span>}
            </button>
          ))}
        </div>

        {/* Log lines */}
        {loading ? <div className="loading">로그 로딩 중...</div> : (
          <div className="log-viewer">
            {filtered.length === 0 ? (
              <div style={{color:'var(--m2)',textAlign:'center',padding:16}}>
                {search ? '검색 결과 없음' : '로그 없음'}
              </div>
            ) : filtered.map((line, i) => (
              <div key={i} className={`log-line ${getLevelClass(getLevel(line))}`}>
                {line}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:'.68rem',color:'var(--m2)'}}>
          <span>{filtered.length} / {lines.length}줄</span>
          <span>3초 갱신</span>
        </div>
      </div>
    </div>
  );
}
