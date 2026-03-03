import { useState, useEffect, useRef } from 'react';
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

const CH_COLOR = { slack:'#34d399', telegram:'#60a5fa', discord:'#a78bfa', unknown:'#6b7280' };

export default function ChatTab() {
  const [sessions, setSessions]     = useState([]);
  const [selected, setSelected]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [sending, setSending]       = useState(false);
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
        // 활성 세션 우선 선택
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
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ ' + e.message, ts: Date.now() }]);
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
        <div style={{display:'flex',alignItems:'center',padding:'6px 12px',gap:8}}>
          <span style={{fontSize:'.7rem',color:'var(--m)',flex:1}}>
            세션 {loadingSess ? '로딩...' : `${sessions.length}개`}
          </span>
          <button onClick={loadSessions} style={{background:'none',border:'none',cursor:'pointer',color:'var(--m)',fontSize:12}}>↻</button>
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
                  background: selected?.sessionId === s.sessionId ? '#4c1d95' : 'var(--b)',
                  border: s.active ? '1px solid #a78bfa' : '1px solid transparent',
                  display:'flex', gap:8, alignItems:'flex-start',
                }}>
                {/* 채널 도트 */}
                <div style={{width:8,height:8,borderRadius:'50%',background:CH_COLOR[s.channel]||'#6b7280',marginTop:4,flexShrink:0}} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:'.8rem',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {s.displayName || s.sessionId?.slice(0,8)}
                    </span>
                    {s.active && <span style={{fontSize:'.6rem',background:'#7c3aed',color:'#fff',borderRadius:4,padding:'1px 5px'}}>활성</span>}
                  </div>
                  <div style={{fontSize:'.65rem',color:'var(--m)',display:'flex',gap:8,marginTop:2,flexWrap:'wrap'}}>
                    <span>#{s.channel}</span>
                    <span>{formatDate(s.updatedAt)}</span>
                    <span>{s.lineCount}줄</span>
                    {s.firstMsg && <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:120}}>{s.firstMsg}</span>}
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
          <div style={{textAlign:'center',marginBottom:8}}>
            <span style={{fontSize:'.7rem',color:'var(--m)',background:'var(--s)',borderRadius:8,padding:'3px 8px'}}>
              {selected.displayName} · {formatDate(selected.updatedAt)} · {selected.lineCount}줄
            </span>
          </div>
        )}
        {loadingHist
          ? <p style={{color:'var(--m)',textAlign:'center',marginTop:20}}>히스토리 로딩 중...</p>
          : !messages.length
            ? <p style={{color:'var(--m)',textAlign:'center',marginTop:20}}>대화 내역 없음</p>
            : messages.map((m, i) => (
              <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',marginBottom:8}}>
                <div style={{
                  maxWidth:'80%',padding:'8px 12px',
                  borderRadius:m.role==='user'?'12px 12px 4px 12px':'12px 12px 12px 4px',
                  background:m.role==='user'?'#7c3aed':'var(--s)',
                  fontSize:'.85rem',lineHeight:1.5,whiteSpace:'pre-wrap',wordBreak:'break-word',
                }}>
                  {m.text}
                  <div style={{fontSize:'.65rem',color:'rgba(255,255,255,.4)',marginTop:4,textAlign:'right'}}>{timeAgo(m.ts)}</div>
                </div>
              </div>
            ))
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
          style={{flex:1,resize:'none',background:'var(--b)',border:'none',color:'var(--t)',borderRadius:8,padding:'8px 10px',fontSize:'.85rem',outline:'none',lineHeight:1.5}}
        />
        <button onClick={startVoice} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,padding:'4px 6px',color:'var(--m)'}}>🎤</button>
        <button onClick={send} disabled={sending||!input.trim()}
          style={{background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',padding:'8px 14px',cursor:'pointer',fontSize:'.85rem',opacity:(sending||!input.trim())?0.5:1}}>
          {sending ? '...' : '전송'}
        </button>
      </div>
    </div>
  );
}
