import { useState, useRef } from 'react';

export default function ChatTab() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState({ msg: '', type: '' });
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  async function sendMsg() {
    const token = localStorage.getItem('slack_token');
    const channel = localStorage.getItem('slack_channel');
    if (!token || !channel) { setStatus({ msg: '설정에서 토큰과 채널을 먼저 입력하세요', type: 'err' }); return; }
    if (!text.trim()) { setStatus({ msg: '메시지를 입력하세요', type: 'err' }); return; }
    setStatus({ msg: '전송 중...', type: '' });
    try {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, text: text.trim(), as_user: true }),
      });
      const data = await res.json();
      if (data.ok) { setStatus({ msg: '✓ 전송 완료!', type: 'ok' }); setText(''); }
      else setStatus({ msg: `오류: ${data.error}`, type: 'err' });
    } catch { setStatus({ msg: '네트워크 오류', type: 'err' }); }
  }

  function toggleVoice() {
    if (listening) { stopVoice(); return; }
    if (window.HunhuiNative) { window.HunhuiNative.startVoice(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatus({ msg: '음성 인식 미지원', type: 'err' }); return; }
    const r = new SR(); r.lang = 'ko-KR'; r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onresult = (e) => { setText(e.results[0][0].transcript); setStatus({ msg: '인식 완료', type: 'ok' }); };
    r.onerror = (e) => setStatus({ msg: `오류: ${e.error}`, type: 'err' });
    r.onend = () => setListening(false);
    r.start(); recognitionRef.current = r;
  }

  function stopVoice() {
    if (window.HunhuiNative) window.HunhuiNative.stopVoice();
    recognitionRef.current?.stop(); recognitionRef.current = null;
    setListening(false);
  }

  window.HunhuiNativeCallback = {
    onVoiceResult: (t) => { setText(t); setStatus({ msg: '인식 완료', type: 'ok' }); setListening(false); },
    onVoiceError: (e) => { setStatus({ msg: `음성 오류: ${e}`, type: 'err' }); setListening(false); },
    onVoiceStateChanged: (s) => setListening(s === 'listening'),
  };

  return (
    <div className="tab-content">
      <button className={`btn ${listening ? 'btn-danger listening' : 'btn-success'}`} onClick={toggleVoice}>
        {listening ? '🔴 듣는 중... (탭하면 중지)' : '🎤 음성 입력'}
      </button>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="메시지를 입력하거나 음성 버튼을 누르세요..."
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
      />
      <button className="btn btn-primary" onClick={sendMsg}>📤 전송</button>
      {status.msg && <p className={`status ${status.type}`}>{status.msg}</p>}
    </div>
  );
}
