import { useState, useEffect, useRef } from 'react';
import { api } from '../../api';

export default function LogsTab() {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const bottomRef = useRef(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const r = await api.logs();
      if (r.ok) setLines(r.lines || []);
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

  const levelColor = (line) => {
    if (line.includes('[ERROR]')) return 'text-red-400';
    if (line.includes('[WARN ]')) return 'text-yellow-400';
    if (line.includes('[HTTP ]')) return 'text-blue-400';
    return 'text-gray-300';
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold">서버 로그</h2>
        <button onClick={fetchLogs} disabled={loading}
          className="px-3 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50">
          {loading ? '로딩...' : '새로고침'}
        </button>
        <label className="flex items-center gap-1 text-sm cursor-pointer">
          <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
          자동 갱신 (3초)
        </label>
        <span className="text-xs text-gray-500 ml-auto">최근 100줄</span>
      </div>

      <div className="bg-black rounded-lg p-3 font-mono text-xs overflow-y-auto h-[60vh]">
        {lines.length === 0
          ? <p className="text-gray-500">로그 없음</p>
          : lines.map((line, i) => (
              <div key={i} className={`whitespace-pre-wrap break-all ${levelColor(line)}`}>{line}</div>
            ))
        }
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
