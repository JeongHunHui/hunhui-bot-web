import { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { api } from '../../api.js';

function timeAgo(ts) {
  if (!ts) return '';
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60) return `${d}초 전`;
  if (d < 3600) return `${Math.floor(d/60)}분 전`;
  if (d < 86400) return `${Math.floor(d/3600)}시간 전`;
  return `${Math.floor(d/86400)}일 전`;
}

function formatDate(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('ko-KR', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

const CH_COLOR = { slack:'#10b981', telegram:'#3b82f6', discord:'#a78bfa', unknown:'#6b7280' };

function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  function copy() {
    navigator.clipboard?.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{display:'flex',justifyContent:isUser?'flex-end':'flex-start',marginBottom:8}}>
      <div style={{maxWidth:'85%',position:'relative'}}
        onMouseEnter={e => { const b = e.currentTarget.querySelector('.copy-btn'); if(b) b.style.opacity='1'; }}
        onMouseLeave={e => { const b = e.currentTarget.querySelector('.copy-btn'); if(b) b.style.opacity='0'; }}>
        <div style={{
          padding:'8px 12px',
          borderRadius:isUser?'12px 12px 4px 12px':'12px 12px 12px 4px',
          background:isUser?'var(--p)':'var(--s)',
          border:isUser?'none':'1px solid var(--b)',
          wordBreak:'break-word',
        }}>
          {isUser ? (
            <div style={{fontSize:'.85rem',lineHeight:1.5,whiteSpace:'pre-wrap'}}>{msg.text}</div>
          ) : (
            <div style={{fontSize:'.85rem',lineHeight:1.6}}>
              <Markdown
                components={{
                  pre: ({children}) => <pre style={{background:'rgba(0,0,0,.3)',borderRadius:8,padding:10,overflowX:'auto',margin:'8px 0',fontFamily:'var(--font-mono)',fontSize:'.78rem'}}>{children}</pre>,
                  code: ({inline, children}) => inline
                    ? <code style={{background:'rgba(124,58,237,.15)',padding:'1px 5px',borderRadius:4,fontFamily:'var(--font-mono)',fontSize:'.78rem'}}>{children}</code>
                    : <code style={{fontFamily:'var(--font-mono)',fontSize:'.78rem'}}>{children}</code>,
                  a: ({href, children}) => <a href={href} target="_blank" rel="noopener" style={{color:'var(--pl)',textDecoration:'none'}}>{children}</a>,
                }}
              >{msg.text}</Markdown>
            </div>
          )}
          <div style={{fontSize:'.6rem',color:'rgba(255,255,255,.3)',marginTop:4,textAlign:'right'}}>
            {timeAgo(msg.ts)}
          </div>
        </div>
        {!isUser && (
          <button className="copy-btn" onClick={copy}
            style={{position:'absolute',top:4,right:4,background:'rgba(0,0,0,.5)',border:'1px solid var(--b)',borderRadius:4,color:'var(--m)',fontSize:'.65rem',padding:'2px 6px',cursor:'pointer',opacity:0,transition:'opacity .2s'}}>
            {copied ? '✓' : '복사'}
          </button>
        )}
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
    <div style={{display:'flex',flexDirection:'column',height:'100%',padding:0}}>
      {/* 세션 패널 */}
      <div style={{background:'var(--s)',borderBottom:'1px solid var(--b)'}}>
        <div className="flex items-center" style={{padding:'6px 12px',gap:8}}>
          <span className="text-xs text-muted flex-1">
            세션 {loadingSess ? '...' : `${sessions.length}개`}
          </span>
          <button onClick={loadSessions} className="btn-refresh" style={{padding:'2px 6px'}}>↻</button>
          <button onClick={() => setShowSessions(v=>!v)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--m)',fontSize:12}}>
            {showSessions ? '▲' : '▼'}
          </button>
        </div>

        {showSessions && (
          <div style={{maxHeight:200,overflowY:'auto',padding:'0 8px 8px'}}>
            {sessions.map(s => (
              <div key={s.sessionId || s.key}
                onClick={() => setSelected(s)}
                style={{
                  padding:'7px 10px', borderRadius:8, marginBottom:4, cursor:'pointer',
                  background: selected?.sessionId === s.sessionId ? 'rgba(124,58,237,.3)' : 'var(--bg)',
                  border: s.active ? '1px solid var(--pl)' : '1px solid var(--b)',
                  display:'flex', gap:8, alignItems:'flex-start',
                  transition:'all .2s',
                }}>
                <div style={{width:8,height:8,borderRadius:'50%',background:CH_COLOR[s.channel]||'#6b7280',marginTop:4,flexShrink:0}} />
                <div style={{flex:1,minWidth:0}}>
                  <div className="flex items-center gap-2">
                    <span className="truncate" style={{fontSize:'.8rem',fontWeight:500}}>
                      {s.displayName || s.sessionId?.slice(0,8)}
                    </span>
                    {s.active && <span className="badge badge-purple">활성</span>}
                  </div>
                  <div className="text-xs text-muted flex gap-2" style={{marginTop:2,flexWrap:'wrap'}}>
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

      {/* 메시지 영역 */}
      <div style={{flex:1,overflowY:'auto',padding:'8px 12px'}}>
        {selected && (
          <div className="text-center mb-2">
            <span className="text-xs text-muted" style={{background:'var(--s)',borderRadius:8,padding:'3px 10px'}}>
              {selected.displayName} · {formatDate(selected.updatedAt)} · {selected.lineCount}줄
            </span>
          </div>
        )}
        {loadingHist
          ? <p className="loading">히스토리 로딩 중...</p>
          : !messages.length
            ? <p className="text-muted text-center mt-3">대화 내역 없음</p>
            : messages.map((m, i) => <MessageBubble key={i} msg={m} />)
        }
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div style={{padding:'8px 12px',background:'var(--s)',borderTop:'1px solid var(--b)',display:'flex',gap:8,alignItems:'flex-end'}}>
        <textarea
          value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} }}
          placeholder="메시지 입력..."
          rows={1}
          style={{flex:1,resize:'none',background:'var(--bg)',border:'1px solid var(--b)',color:'var(--t)',borderRadius:8,padding:'8px 10px',fontSize:'.85rem',outline:'none',lineHeight:1.5,minHeight:'auto'}}
        />
        <button onClick={startVoice} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,padding:'4px 6px',color:'var(--m)'}}>🎤</button>
        <button onClick={send} disabled={sending||!input.trim()}
          style={{background:'var(--p)',border:'none',borderRadius:8,color:'#fff',padding:'8px 14px',cursor:'pointer',fontSize:'.85rem',fontWeight:600,opacity:(sending||!input.trim())?0.5:1,transition:'opacity .2s'}}>
          {sending ? '...' : '전송'}
        </button>
      </div>
    </div>
  );
}
