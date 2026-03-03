import { useState, useEffect, useRef } from 'react';
import { api } from '../../api.js';

function timeAgo(ts) {
  if (!ts) return '';
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60) return `${d}초 전`;
  if (d < 3600) return `${Math.floor(d/60)}분 전`;
  return `${Math.floor(d/3600)}시간 전`;
}

const CHANNEL_BADGE = { slack: '#34d399', telegram: '#60a5fa', discord: '#a78bfa', unknown: '#6b7280' };

export default function ChatTab() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const bottomRef = useRef(null);

  // 세션 목록 로드
  async function loadSessions() {
    setLoadingSessions(true);
    try {
      const d = await api.sessions();
      setSessions(d.sessions || []);
      if (!selected && d.sessions?.length) {
        // 'main' 세션 기본 선택
        const main = d.sessions.find(s => s.key === 'agent:main:main' || s.key.includes('main'));
        setSelected(main || d.sessions[0]);
      }
    } catch {}
    setLoadingSessions(false);
  }

  // 채팅 히스토리 로드
  async function loadHistory(session) {
    if (!session) return;
    setLoadingHistory(true);
    try {
      const d = await api.history(session.key);
      setMessages(d.messages || []);
    } catch {}
    setLoadingHistory(false);
  }

  useEffect(() => { loadSessions(); }, []);
  useEffect(() => { loadHistory(selected); }, [selected]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // 안드로이드 음성 콜백
  useEffect(() => {
    window.HunhuiNativeCallback = window.HunhuiNativeCallback || {};
    window.HunhuiNativeCallback.onVoiceResult = (text) => { setInput(text); };
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
      const sessionKey = selected?.key || 'main';
      // sessionKey에서 실제 key 추출 (agent:main:main → main)
      const sk = sessionKey.split(':').pop();
      const res = await api.chat(text, sk);
      if (res.reply) {
        setMessages(prev => [...prev, { role: 'assistant', text: res.reply, ts: Date.now() }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ 오류: ' + e.message, ts: Date.now() }]);
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
    <div className="tab-content" style={{display:'flex',flexDirection:'column',height:'100%',padding:0}}>
      {/* 세션 선택 */}
      <div style={{padding:'8px 12px',background:'var(--s)',borderBottom:'1px solid var(--b)'}}>
        <div style={{fontSize:'.7rem',color:'var(--m)',marginBottom:4}}>세션 선택</div>
        {loadingSessions ? <span style={{fontSize:'.8rem',color:'var(--m)'}}>로딩 중...</span> : (
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {sessions.map(s => (
              <button key={s.key}
                onClick={() => setSelected(s)}
                style={{
                  padding:'4px 10px', borderRadius:12, border:'none', cursor:'pointer', fontSize:'.75rem',
                  background: selected?.key === s.key ? '#a78bfa' : 'var(--b)',
                  color: selected?.key === s.key ? '#fff' : 'var(--t)',
                }}>
                {s.displayName || s.key.split(':').pop()}
                <span style={{marginLeft:4,width:6,height:6,borderRadius:'50%',background:CHANNEL_BADGE[s.channel]||'#6b7280',display:'inline-block'}} />
              </button>
            ))}
            {!sessions.length && <span style={{fontSize:'.8rem',color:'var(--m)'}}>세션 없음</span>}
          </div>
        )}
      </div>

      {/* 메시지 영역 */}
      <div style={{flex:1,overflowY:'auto',padding:'8px 12px'}}>
        {loadingHistory ? <p style={{color:'var(--m)',textAlign:'center',marginTop:20}}>히스토리 로딩 중...</p> :
         !messages.length ? <p style={{color:'var(--m)',textAlign:'center',marginTop:20}}>대화 내역이 없어요</p> :
         messages.map((m, i) => (
          <div key={i} style={{
            display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom:8
          }}>
            <div style={{
              maxWidth:'80%', padding:'8px 12px', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              background: m.role === 'user' ? '#7c3aed' : 'var(--s)',
              color:'var(--t)', fontSize:'.85rem', lineHeight:1.5, whiteSpace:'pre-wrap', wordBreak:'break-word'
            }}>
              {m.text}
              <div style={{fontSize:'.65rem',color:'rgba(255,255,255,0.4)',marginTop:4,textAlign:'right'}}>{timeAgo(m.ts)}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div style={{padding:'8px 12px',background:'var(--s)',borderTop:'1px solid var(--b)',display:'flex',gap:8,alignItems:'flex-end'}}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="메시지 입력..."
          rows={1}
          style={{flex:1,resize:'none',background:'var(--b)',border:'none',color:'var(--t)',borderRadius:8,padding:'8px 10px',fontSize:'.85rem',outline:'none',lineHeight:1.5}}
        />
        <button onClick={startVoice} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,padding:'4px 6px',color:'var(--m)'}}>🎤</button>
        <button onClick={send} disabled={sending || !input.trim()}
          style={{background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',padding:'8px 14px',cursor:'pointer',fontSize:'.85rem',opacity:(sending||!input.trim())?0.5:1}}>
          {sending ? '...' : '전송'}
        </button>
      </div>
    </div>
  );
}

// UNIQUE_BUILD_MARKER_12345
