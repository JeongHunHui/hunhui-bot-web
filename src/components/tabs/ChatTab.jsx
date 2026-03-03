import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../../api.js';

function timeAgo(ts) {
  if (!ts) return '';
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60) return `${d}초 전`;
  if (d < 3600) return `${Math.floor(d / 60)}분 전`;
  if (d < 86400) return `${Math.floor(d / 3600)}시간 전`;
  return `${Math.floor(d / 86400)}일 전`;
}

function formatDate(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const CH_COLOR = { slack: '#10b981', telegram: '#3b82f6', discord: '#a78bfa', unknown: '#555570' };

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <button onClick={copy} style={{
      position: 'absolute', top: 4, right: 4,
      background: 'rgba(0,0,0,.5)', border: 'none', borderRadius: 4,
      color: copied ? '#10b981' : '#888',
      fontSize: '.65rem', padding: '2px 6px', cursor: 'pointer',
      opacity: 0, transition: 'opacity .2s',
    }} className="copy-btn">
      {copied ? '✓' : '복사'}
    </button>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
      <div style={{
        maxWidth: '82%', padding: '10px 14px', position: 'relative',
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isUser ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'var(--s)',
        border: isUser ? 'none' : '1px solid var(--b)',
        fontSize: '.85rem', lineHeight: 1.6, wordBreak: 'break-word',
      }}
        onMouseEnter={e => { const b = e.currentTarget.querySelector('.copy-btn'); if (b) b.style.opacity = 1; }}
        onMouseLeave={e => { const b = e.currentTarget.querySelector('.copy-btn'); if (b) b.style.opacity = 0; }}
      >
        <CopyButton text={msg.text} />
        {isUser ? (
          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
        ) : (
          <div className="markdown-body" style={{ fontSize: '.85rem' }}>
            <ReactMarkdown
              components={{
                code({ inline, children, ...props }) {
                  return inline
                    ? <code style={{ background: 'rgba(255,255,255,.08)', padding: '1px 5px', borderRadius: 4, fontSize: '.8rem', fontFamily: 'var(--font-mono)' }} {...props}>{children}</code>
                    : <pre style={{ background: 'rgba(0,0,0,.3)', padding: 10, borderRadius: 8, overflow: 'auto', fontSize: '.75rem', fontFamily: 'var(--font-mono)', margin: '6px 0' }}><code {...props}>{children}</code></pre>;
                },
                p({ children }) { return <div style={{ marginBottom: 6 }}>{children}</div>; },
                a({ href, children }) { return <a href={href} target="_blank" rel="noopener" style={{ color: 'var(--pl)' }}>{children}</a>; },
              }}
            >
              {msg.text}
            </ReactMarkdown>
          </div>
        )}
        <div style={{ fontSize: '.63rem', color: 'rgba(255,255,255,.35)', marginTop: 4, textAlign: 'right' }}>
          {timeAgo(msg.ts)}
        </div>
      </div>
    </div>
  );
}

export default function ChatTab() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingSess, setLoadingSess] = useState(true);
  const [loadingHist, setLoadingHist] = useState(false);
  const [showSessions, setShowSessions] = useState(true);
  const bottomRef = useRef(null);

  async function loadSessions() {
    setLoadingSess(true);
    try {
      const d = await api.sessions();
      const list = d.sessions || [];
      setSessions(list);
      if (!selected && list.length) {
        const main = list.find(s => s.active) || list[0];
        setSelected(main);
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

  useEffect(() => {
    window.HunhuiNativeCallback = window.HunhuiNativeCallback || {};
    window.HunhuiNativeCallback.onVoiceResult = (text) => setInput(text);
    window.HunhuiNativeCallback.onVoiceStateChanged = () => {};
    window.HunhuiNativeCallback.onVoiceError = () => {};
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text, ts: Date.now() }]);
    try {
      const sk = selected?.sessionId || selected?.key?.split(':').pop() || 'main';
      const res = await api.chat(text, sk);
      if (res.reply) setMessages(prev => [...prev, { role: 'assistant', text: res.reply, ts: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: '오류: ' + e.message, ts: Date.now() }]);
    }
    setSending(false);
  }

  function startVoice() {
    if (window.HunhuiNative?.startVoice) { window.HunhuiNative.startVoice(); return; }
    if ('webkitSpeechRecognition' in window) {
      const rec = new window.webkitSpeechRecognition();
      rec.lang = 'ko-KR'; rec.interimResults = false;
      rec.onresult = e => setInput(e.results[0][0].transcript);
      rec.start();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      {/* Session panel */}
      <div style={{ background: 'var(--s)', borderBottom: '1px solid var(--b)' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', gap: 8 }}>
          <span style={{ fontSize: '.7rem', color: 'var(--m)', flex: 1 }}>
            세션 {loadingSess ? '...' : `${sessions.length}개`}
          </span>
          <button onClick={loadSessions} className="btn-refresh" style={{ padding: '2px 6px' }}>↻</button>
          <button onClick={() => setShowSessions(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--m)', fontSize: 11 }}>
            {showSessions ? '▲' : '▼'}
          </button>
        </div>

        {showSessions && (
          <div style={{ maxHeight: 180, overflowY: 'auto', padding: '0 8px 8px' }}>
            {sessions.map(s => (
              <div key={s.sessionId || s.key}
                onClick={() => setSelected(s)}
                style={{
                  padding: '7px 10px', borderRadius: 8, marginBottom: 4, cursor: 'pointer',
                  background: selected?.sessionId === s.sessionId ? 'rgba(124,58,237,.2)' : 'rgba(255,255,255,.03)',
                  border: selected?.sessionId === s.sessionId ? '1px solid rgba(124,58,237,.4)' : '1px solid transparent',
                  display: 'flex', gap: 8, alignItems: 'flex-start', transition: 'all .15s',
                }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.active ? '#10b981' : (CH_COLOR[s.channel] || '#555570'), marginTop: 5, flexShrink: 0, boxShadow: s.active ? '0 0 4px #10b981' : 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '.78rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.displayName || s.sessionId?.slice(0, 8)}
                    </span>
                    {s.active && <span className="badge badge-green">활성</span>}
                  </div>
                  <div style={{ fontSize: '.63rem', color: 'var(--m)', display: 'flex', gap: 6, marginTop: 2 }}>
                    <span>#{s.channel}</span>
                    <span>{formatDate(s.updatedAt)}</span>
                    <span>{s.lineCount}줄</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {selected && (
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '.68rem', color: 'var(--m)', background: 'var(--s)', borderRadius: 8, padding: '3px 10px', border: '1px solid var(--b)' }}>
              {selected.displayName} · {formatDate(selected.updatedAt)}
            </span>
          </div>
        )}
        {loadingHist ? (
          <div className="loading" style={{ marginTop: 40 }}>히스토리 로딩 중...</div>
        ) : !messages.length ? (
          <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--m2)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            <div style={{ fontSize: '.82rem' }}>대화 내역 없음</div>
          </div>
        ) : messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ padding: '8px 12px', background: 'var(--s)', borderTop: '1px solid var(--b)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="메시지 입력..."
          rows={1}
          style={{ flex: 1, resize: 'none', background: 'rgba(255,255,255,.04)', border: '1px solid var(--b)', color: 'var(--t)', borderRadius: 8, padding: '8px 10px', fontSize: '.85rem', outline: 'none', lineHeight: 1.5, transition: 'border-color .2s' }}
        />
        <button onClick={startVoice} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '4px 6px', color: 'var(--m)' }}>🎤</button>
        <button onClick={send} disabled={sending || !input.trim()}
          style={{ background: sending || !input.trim() ? 'rgba(124,58,237,.3)' : 'var(--p)', border: 'none', borderRadius: 8, color: '#fff', padding: '8px 14px', cursor: 'pointer', fontSize: '.85rem', fontWeight: 600, transition: 'all .15s' }}>
          {sending ? '...' : '전송'}
        </button>
      </div>
    </div>
  );
}
