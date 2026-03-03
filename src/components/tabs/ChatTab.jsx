import { useState, useEffect, useRef } from 'react';
import { api } from '../../api.js';

// 간단한 마크다운 → HTML 변환
function renderMd(text) {
  if (!text) return '';
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^#{3} (.+)$/gm, '<h3 style="font-size:.9rem;margin:.5em 0 .3em">$1</h3>')
    .replace(/^#{2} (.+)$/gm, '<h2 style="font-size:1rem;margin:.6em 0 .3em">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.1rem;margin:.7em 0 .3em">$1</h1>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:1em;list-style:disc">$1</li>')
    .replace(/\n/g, '<br>');
}

function timeAgo(ts) {
  if (!ts) return '';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}초 전`;
  if (s < 3600) return `${Math.floor(s/60)}분 전`;
  return `${Math.floor(s/3600)}시간 전`;
}

function fmt(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('ko-KR', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

const CH_COLOR = { slack:'#10b981', telegram:'#3b82f6', discord:'#7c3aed', unknown:'#78788a' };

export default function ChatTab() {
  const [sessions, setSessions]     = useState([]);
  const [selected, setSelected]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [sending, setSending]       = useState(false);
  const [loadingSess, setLoadingSess] = useState(true);
  const [loadingHist, setLoadingHist] = useState(false);
  const [showSessions, setShowSessions] = useState(true);
  const [copied, setCopied]         = useState(null);
  const bottomRef = useRef(null);

  async function loadSessions() {
    setLoadingSess(true);
    try {
      const d = await api.sessions();
      const list = d.sessions || [];
      setSessions(list);
      if (!selected && list.length) {
        setSelected(list.find(s => s.active) || list[0]);
      }
    } catch {}
    setLoadingSess(false);
  }

  async function loadHistory(session) {
    if (!session) return;
    setLoadingHist(true);
    try {
      const d = await api.history(session.sessionId || session.key);
      setMessages(d.messages || []);
    } catch {}
    setLoadingHist(false);
  }

  useEffect(() => { loadSessions(); }, []);
  useEffect(() => { if (selected) loadHistory(selected); }, [selected]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text, ts: Date.now() }]);
    try {
      const sk = selected?.sessionId || 'main';
      const res = await api.chat(text, sk);
      if (res.reply) setMessages(prev => [...prev, { role: 'assistant', text: res.reply, ts: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ ' + e.message, ts: Date.now() }]);
    }
    setSending(false);
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 세션 패널 */}
      <div style={{ background: 'var(--s)', borderBottom: '1px solid var(--b)' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', gap: 8 }}>
          <span style={{ fontSize: '.7rem', color: 'var(--m)', flex: 1 }}>
            세션 {loadingSess ? '...' : `${sessions.length}개`}
            {selected && <span style={{ marginLeft: 6, color: 'var(--t)' }}>— {selected.displayName?.slice(0,20)}</span>}
          </span>
          <button onClick={loadSessions} className="btn-refresh">↻</button>
          <button onClick={() => setShowSessions(v=>!v)} className="btn-refresh">{showSessions ? '▲' : '▼'}</button>
        </div>

        {showSessions && (
          <div style={{ maxHeight: 180, overflowY: 'auto', padding: '0 8px 8px' }}>
            {sessions.map(s => (
              <div key={s.sessionId} onClick={() => setSelected(s)} style={{
                padding: '6px 10px', borderRadius: 8, marginBottom: 3, cursor: 'pointer',
                background: selected?.sessionId === s.sessionId ? '#3b1f7a' : 'var(--b)',
                border: `1px solid ${selected?.sessionId === s.sessionId ? 'var(--p)' : s.active ? CH_COLOR[s.channel]+'44' : 'transparent'}`,
                display: 'flex', gap: 8, alignItems: 'center', transition: 'all .15s',
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: CH_COLOR[s.channel]||'#888', flexShrink: 0, boxShadow: s.active ? `0 0 5px ${CH_COLOR[s.channel]}` : 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: '.78rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.displayName || s.sessionId?.slice(0,8)}
                    </span>
                    {s.active && <span className="badge badge-green" style={{ fontSize: '.55rem' }}>활성</span>}
                  </div>
                  <div style={{ fontSize: '.62rem', color: 'var(--m)', display: 'flex', gap: 6 }}>
                    <span>{fmt(s.updatedAt)}</span>
                    <span>{s.lineCount}줄</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 선택된 세션 정보 */}
      {selected && (
        <div style={{ padding: '4px 12px', background: 'var(--b)', borderBottom: '1px solid var(--b2)', fontSize: '.68rem', color: 'var(--m)', display: 'flex', gap: 10 }}>
          <span>#{selected.channel}</span>
          <span>{fmt(selected.updatedAt)}</span>
          <span className="mono">{selected.lineCount}줄</span>
          <span className="mono" style={{ marginLeft: 'auto' }}>{selected.sessionId?.slice(0,8)}</span>
        </div>
      )}

      {/* 메시지 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {loadingHist
          ? <div style={{ color: 'var(--m)', textAlign: 'center', paddingTop: 30, fontSize: '.8rem' }}>히스토리 로딩 중...</div>
          : !messages.length
            ? <div style={{ color: 'var(--m)', textAlign: 'center', paddingTop: 30, fontSize: '.8rem' }}>대화 내역 없음</div>
            : messages.map((m, i) => (
              <div key={i} className="fade-in" style={{ display: 'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start', marginBottom: 10, position: 'relative' }}>
                <div style={{
                  maxWidth: '82%', padding: '9px 13px',
                  borderRadius: m.role==='user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role==='user' ? 'linear-gradient(135deg, #7c3aed, #9f5af7)' : 'var(--s)',
                  border: m.role!=='user' ? '1px solid var(--b)' : 'none',
                  fontSize: '.85rem', lineHeight: 1.6,
                  boxShadow: m.role==='user' ? '0 2px 10px rgba(124,58,237,.3)' : 'none',
                }}>
                  {m.role === 'assistant'
                    ? <div dangerouslySetInnerHTML={{ __html: renderMd(m.text) }} />
                    : <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</div>
                  }
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: '.6rem', opacity: .5 }}>{timeAgo(m.ts)}</span>
                    <button onClick={() => copyText(m.text)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '.6rem',
                      color: copied === m.text ? 'var(--g)' : 'rgba(255,255,255,.3)', padding: '0 2px',
                    }}>
                      {copied === m.text ? '✓' : '복사'}
                    </button>
                  </div>
                </div>
              </div>
            ))
        }
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div style={{ padding: '8px 12px', background: 'var(--s)', borderTop: '1px solid var(--b)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="메시지 입력... (Shift+Enter 줄바꿈)"
          rows={1}
          style={{
            flex: 1, resize: 'none', background: 'var(--b)', border: '1px solid var(--b2)',
            color: 'var(--t)', borderRadius: 10, padding: '8px 12px', fontSize: '.85rem',
            outline: 'none', lineHeight: 1.5, transition: 'border-color .15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--p)'}
          onBlur={e => e.target.style.borderColor = 'var(--b2)'}
        />
        <button onClick={send} disabled={sending || !input.trim()} className="btn btn-primary"
          style={{ padding: '8px 16px', borderRadius: 10 }}>
          {sending ? '···' : '전송'}
        </button>
      </div>
    </div>
  );
}
