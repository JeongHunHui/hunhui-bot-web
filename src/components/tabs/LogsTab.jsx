import { useState, useEffect, useRef } from 'react';
import { API } from '../../api.js';

const FILTERS = ['ALL', 'INFO', 'WARN', 'ERROR', 'HTTP'];

function getLevel(line) {
  if (line.includes('[ERROR]')) return 'ERROR';
  if (line.includes('[WARN ]') || line.includes('[WARN]')) return 'WARN';
  if (line.includes('[HTTP ]') || line.includes('[HTTP]')) return 'HTTP';
  return 'INFO';
}

const levelClass = { ERROR: 'log-error', WARN: 'log-warn', HTTP: 'log-http', INFO: 'log-info' };

export default function LogsTab() {
  const [lines, setLines] = useState([]);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [newCount, setNewCount] = useState(0);
  const bottomRef = useRef(null);
  const esRef = useRef(null);

  function connect() {
    if (esRef.current) { esRef.current.close(); }
    const es = new EventSource(API + '/dashboard/logs/stream');
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'init') {
          setLines(d.lines || []);
          setNewCount(0);
        } else if (d.type === 'update') {
          setLines(prev => {
            const next = [...prev, ...(d.lines || [])].slice(-500);
            setNewCount(c => c + (d.lines?.length || 0));
            return next;
          });
        }
      } catch {}
    };
  }

  useEffect(() => {
    connect();
    return () => { if (esRef.current) esRef.current.close(); };
  }, []);

  useEffect(() => {
    if (newCount > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setNewCount(0);
    }
  }, [lines]);

  const filtered = lines.filter(line => {
    if (filter !== 'ALL' && getLevel(line) !== filter) return false;
    if (search && !line.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="tab-content" style={{overflowY:"auto",height:"100%"}}>
      <div className="card" style={{ padding: 12 }}>
        <div className="filter-bar">
          {FILTERS.map(f => (
            <button key={f} className={'filter-btn ' + (filter === f ? 'active' : '')} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <input
            className="search-input"
            type="text"
            placeholder="검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? 'var(--g)' : 'var(--r)',
              boxShadow: connected ? '0 0 6px var(--g)' : 'none',
            }} />
            <span className="text-xs text-muted">{connected ? 'LIVE' : '연결 끊김'}</span>
          </div>
          <button className="btn-refresh" onClick={connect} title="재연결">↻</button>
        </div>

        <div className="text-xs text-muted mb-2" style={{ textAlign: 'right' }}>
          {filtered.length}/{lines.length}줄
        </div>

        <div className="log-viewer">
          {filtered.length === 0
            ? <p className="text-muted">로그 없음</p>
            : filtered.map((line, i) => {
                const level = getLevel(line);
                return (
                  <div key={i} className={'log-line ' + (levelClass[level] || '')}>
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
