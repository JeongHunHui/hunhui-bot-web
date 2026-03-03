import { useState } from 'react';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../api.js';

function Gauge({ label, pct, val }) {
  const color = pct > 85 ? '#ef4444' : pct > 60 ? '#fbbf24' : '#34d399';
  return (
    <div className="gauge-row">
      <span className="gauge-label">{label}</span>
      <div className="gauge-bar"><div className="gauge-fill" style={{ width: `${pct}%`, background: color }} /></div>
      <span className="gauge-val">{val}</span>
      <div className="card">
        <div className="card-title">Claude Code <button className="btn-refresh" onClick={claudeR}>↻</button></div>
        {claudeL ? <p className="loading">확인 중...</p> : claude ? (
          <>
            <div className="status-row">
              <div className={`dot ${claude.apiKeyOk ? 'green' : 'red'}`} />
              <span className="status-label">{claude.apiKeyOk ? 'API 키 정상' : 'API 키 없음'}</span>
            </div>
            {claude.version && <p style={{fontSize:'.75rem',color:'var(--m)',marginTop:6}}>버전: {claude.version}</p>}
            {claude.model && <p style={{fontSize:'.75rem',color:'var(--m)'}}>모델: {claude.model}</p>}
            {!claude.apiKeyOk && <p style={{fontSize:'.75rem',color:'#ef4444',marginTop:6}}>⚠️ ANTHROPIC_API_KEY 확인 필요</p>}
          </>
        ) : <p className="err">로딩 실패</p>}
      </div>
      <div className="card">
        <div className="card-title">세션 상태 <button className="btn-refresh" onClick={sstR}>↻</button></div>
        {sstL ? <p className="loading">확인 중...</p> : sst?.text ? (
          <pre style={{fontSize:'.7rem',color:'var(--m)',whiteSpace:'pre-wrap',margin:0,lineHeight:1.5}}>{sst.text}</pre>
        ) : <p className="err">로딩 실패</p>}
      </div>
    </div>
  );
}

export default function SystemTab() {
  const { data: st, loading: stL, reload: stR } = useApi(api.status, [], 30000);
  const { data: sys, loading: sysL, reload: sysR } = useApi(api.system, [], 10000);
  const { data: claude, loading: claudeL, reload: claudeR } = useApi(api.claudeStatus, [], 60000);
  const { data: sst, loading: sstL, reload: sstR } = useApi(api.sessionStatus, [], 30000);
  const [restarting, setRestarting] = useState(false);

  async function restart() {
    setRestarting(true);
    try { await api.restart(); } catch {}
    setTimeout(() => { setRestarting(false); stR(); }, 4000);
  }

  const isOk = st?.ok && st?.gateway;

  return (
    <div className="tab-content">
      <div className="card">
        <div className="card-title">OpenClaw <button className="btn-refresh" onClick={stR}>↻</button></div>
        {stL ? <p className="loading">확인 중...</p> : (
          <>
            <div className="status-row">
              <div className={`dot ${isOk ? 'green' : 'red'}`} />
              <span className="status-label">{isOk ? '정상 동작 중' : '응답 없음'}</span>
              {st?.pid && <span className="status-sub">PID {st.pid}</span>}
            </div>
            {!isOk && <button className="btn btn-danger" onClick={restart} disabled={restarting} style={{marginTop:10}}>
              {restarting ? '⏳ 재시작 중...' : '🔄 OpenClaw 재시작'}
            </button>}
          </>
        )}
      </div>
      <div className="card">
        <div className="card-title">Mac mini 리소스 <button className="btn-refresh" onClick={sysR}>↻</button></div>
        {sysL ? <p className="loading">로딩 중...</p> : sys?.ok ? (
          <>
            <Gauge label="CPU" pct={sys.cpu} val={`${sys.cpu}%`} />
            <Gauge label="RAM" pct={sys.mem} val={`${sys.memUsed}/${sys.memTotal}G`} />
            {sys.disk && <Gauge label="Disk" pct={parseInt(sys.disk.pct)} val={sys.disk.pct} />}
            <p style={{fontSize:'.75rem',color:'var(--m)',marginTop:8}}>⏱ 업타임: {sys.uptime}</p>
          </>
        ) : <p className="err">로딩 실패</p>}
      </div>
      <div className="card">
        <div className="card-title">Claude Code <button className="btn-refresh" onClick={claudeR}>↻</button></div>
        {claudeL ? <p className="loading">확인 중...</p> : claude ? (
          <>
            <div className="status-row">
              <div className={`dot ${claude.apiKeyOk ? 'green' : 'red'}`} />
              <span className="status-label">{claude.apiKeyOk ? 'API 키 정상' : 'API 키 없음'}</span>
            </div>
            {claude.version && <p style={{fontSize:'.75rem',color:'var(--m)',marginTop:6}}>버전: {claude.version}</p>}
            {claude.model && <p style={{fontSize:'.75rem',color:'var(--m)'}}>모델: {claude.model}</p>}
            {!claude.apiKeyOk && <p style={{fontSize:'.75rem',color:'#ef4444',marginTop:6}}>⚠️ ANTHROPIC_API_KEY 확인 필요</p>}
          </>
        ) : <p className="err">로딩 실패</p>}
      </div>
      <div className="card">
        <div className="card-title">세션 상태 <button className="btn-refresh" onClick={sstR}>↻</button></div>
        {sstL ? <p className="loading">확인 중...</p> : sst?.text ? (
          <pre style={{fontSize:'.7rem',color:'var(--m)',whiteSpace:'pre-wrap',margin:0,lineHeight:1.5}}>{sst.text}</pre>
        ) : <p className="err">로딩 실패</p>}
      </div>
    </div>
  );
}
