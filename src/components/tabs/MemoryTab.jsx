import { useState, useEffect } from 'react';
import { api } from '../../api.js';

function timeAgo(iso) {
  if (!iso) return '-';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function MemoryTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFile, setActiveFile] = useState(0);

  useEffect(() => {
    api.memory().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{textAlign:'center',padding:'40px',color:'#64748b'}}>로딩 중...</div>;
  if (!data?.ok) return <div style={{textAlign:'center',padding:'40px',color:'#ef4444'}}>데이터 불러오기 실패</div>;

  const active = (data.sessions||[]).filter(s=>s.status==='active');
  const archived = (data.sessions||[]).filter(s=>s.status!=='active');

  return (
    <div style={{padding:'16px',display:'flex',flexDirection:'column',gap:'20px'}}>

      {/* Sessions */}
      <section>
        <h2 style={{fontSize:'.85rem',fontWeight:700,color:'#a78bfa',marginBottom:'10px',letterSpacing:'.04em'}}>
          ⚡ 활성 세션 <span style={{color:'#475569',fontWeight:400}}>({active.length})</span>
        </h2>
        {!data.sessions?.length && <Empty>등록된 세션 없음</Empty>}
        {active.map(s => <SessionCard key={s.id} s={s} />)}
        {archived.length > 0 && (
          <details style={{marginTop:'6px'}}>
            <summary style={{cursor:'pointer',color:'#475569',fontSize:'.75rem',padding:'4px 0'}}>
              아카이브 {archived.length}개
            </summary>
            {archived.map(s => <SessionCard key={s.id} s={s} />)}
          </details>
        )}
      </section>

      {/* Memory files tabs */}
      {data.memoryFiles?.length > 0 && (
        <section>
          <h2 style={{fontSize:'.85rem',fontWeight:700,color:'#a78bfa',marginBottom:'10px',letterSpacing:'.04em'}}>📝 메모리 파일</h2>
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'10px'}}>
            {data.memoryFiles.map((f,i) => (
              <button key={f.name} onClick={() => setActiveFile(i)}
                style={{padding:'4px 10px',borderRadius:'8px',border:'1px solid',fontSize:'.72rem',cursor:'pointer',
                  borderColor: i===activeFile ? '#7c3aed' : '#2d2d4e',
                  background: i===activeFile ? 'rgba(124,58,237,.2)' : 'transparent',
                  color: i===activeFile ? '#a78bfa' : '#64748b'}}>
                {f.name.replace('.md','')}
              </button>
            ))}
          </div>
          <Prose content={data.memoryFiles[activeFile]?.content || ''} />
        </section>
      )}

      {/* MEMORY.md */}
      <section>
        <h2 style={{fontSize:'.85rem',fontWeight:700,color:'#a78bfa',marginBottom:'10px',letterSpacing:'.04em'}}>🧠 장기 메모리 (MEMORY.md)</h2>
        {data.memory ? <Prose content={data.memory} /> : <Empty>비어있음</Empty>}
      </section>

      {/* Heartbeat */}
      <section>
        <h2 style={{fontSize:'.85rem',fontWeight:700,color:'#a78bfa',marginBottom:'10px',letterSpacing:'.04em'}}>💓 Heartbeat 설정</h2>
        <pre style={{background:'#0f0f1a',border:'1px solid #2d2d4e',borderRadius:'10px',padding:'12px',fontSize:'.72rem',color:'#94a3b8',whiteSpace:'pre-wrap',lineHeight:1.6,overflow:'auto'}}>
          {data.heartbeat || '비어있음'}
        </pre>
      </section>

      <p style={{textAlign:'center',fontSize:'.68rem',color:'#334155'}}>실시간 데이터 (hunhui-bot-server)</p>
    </div>
  );
}

function SessionCard({ s }) {
  return (
    <div style={{background:'rgba(124,58,237,.07)',border:'1px solid rgba(124,58,237,.18)',borderRadius:'12px',padding:'12px 14px',marginBottom:'8px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px',flexWrap:'wrap'}}>
        <span style={{fontWeight:700,fontSize:'.88rem',color:'#e0e7ff'}}>{s.label||s.id}</span>
        <span style={{fontSize:'.65rem',fontWeight:700,padding:'2px 7px',borderRadius:'99px',
          background: s.status==='active' ? 'rgba(16,185,129,.15)' : 'rgba(100,116,139,.15)',
          color: s.status==='active' ? '#34d399' : '#94a3b8',
          border: `1px solid ${s.status==='active' ? 'rgba(16,185,129,.3)' : 'rgba(100,116,139,.3)'}`}}>
          {s.status==='active' ? '● ACTIVE' : 'ARCHIVED'}
        </span>
      </div>
      {s.keywords?.length > 0 && (
        <div style={{display:'flex',flexWrap:'wrap',gap:'4px',margin:'6px 0'}}>
          {s.keywords.map(k=>(
            <span key={k} style={{fontSize:'.63rem',padding:'1px 7px',background:'rgba(139,92,246,.15)',color:'#c4b5fd',borderRadius:'99px',border:'1px solid rgba(139,92,246,.2)'}}>{k}</span>
          ))}
        </div>
      )}
      {s.summary && <p style={{fontSize:'.77rem',color:'#94a3b8',marginTop:'5px',lineHeight:1.5}}>{s.summary}</p>}
      <p style={{fontSize:'.67rem',color:'#475569',marginTop:'4px'}}>마지막 활동: {timeAgo(s.lastActivity)}</p>
    </div>
  );
}

function Prose({ content }) {
  return (
    <div style={{background:'rgba(124,58,237,.06)',border:'1px solid rgba(124,58,237,.15)',borderRadius:'10px',padding:'14px 16px',fontSize:'.8rem',lineHeight:1.7,color:'#cbd5e1',whiteSpace:'pre-wrap'}}>
      {content}
    </div>
  );
}

function Empty({ children }) {
  return <div style={{color:'#475569',fontSize:'.82rem',padding:'14px',textAlign:'center',background:'rgba(124,58,237,.04)',border:'1px dashed rgba(124,58,237,.15)',borderRadius:'10px'}}>{children}</div>;
}
