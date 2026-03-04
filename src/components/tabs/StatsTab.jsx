import { useApi } from '../../hooks/useApi.js';
import { api } from '../../api.js';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

function fmtTokens(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
  if (n >= 1000) return (n/1000).toFixed(1)+'K';
  return String(n);
}

const CHANNEL_COLORS = { slack:'#10b981', telegram:'#3b82f6', discord:'#a78bfa', unknown:'#6b7280' };

export default function StatsTab() {
  const { data, loading, reload } = useApi(api.hourlyStats, [], 60000);
  const { data: td } = useApi(api.todayStats, [], 60000);

  const hourly = data?.hourlyTokens || [];
  const channels = data ? Object.entries(data.channelStats || {}).map(([name, count]) => ({ name, count })) : [];
  const totalTokens = hourly.reduce((a, b) => a + b.tokens, 0);
  const totalCost = hourly.reduce((a, b) => a + b.cost, 0);

  return (
    <div className="tab-content" style={{overflowY:"auto",height:"100%"}}>
      {/* 상단 stat 카드 */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
        <div className="stat-item">
          <div className="stat-value text-purple">{fmtTokens(totalTokens)}</div>
          <div className="stat-label">오늘 총 토큰</div>
        </div>
        <div className="stat-item">
          <div className="stat-value text-blue">{data?.sessionCount || 0}</div>
          <div className="stat-label">세션 수</div>
        </div>
      </div>

      {/* 시간별 토큰 차트 */}
      <div className="card">
        <div className="card-title">시간별 토큰 사용량 (구독 모델) <button className="btn-refresh" onClick={reload}>↻</button></div>
        {loading ? <p className="loading">로딩 중...</p> : !hourly.length ? <p className="text-sm text-muted text-center">데이터 없음</p> : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={hourly} margin={{ top:5, right:5, bottom:5, left:0 }}>
              <defs>
                <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
              <XAxis dataKey="hour" tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={fmtTokens} tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{ background:'#1a1a24', border:'1px solid #252535', borderRadius:8, fontSize:12 }}
                labelStyle={{ color:'#e8e8f0' }}
                formatter={(v) => [fmtTokens(v), '토큰']}
              />
              <Area type="monotone" dataKey="tokens" stroke="#7c3aed" strokeWidth={2} fill="url(#tokenGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>



      {/* 채널별 분포 */}
      {channels.length > 0 && (
        <div className="card">
          <div className="card-title">채널별 세션 분포</div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={channels} layout="vertical" margin={{ top:5, right:20, bottom:5, left:40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
              <XAxis type="number" tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill:'#e8e8f0', fontSize:11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background:'#1a1a24', border:'1px solid #252535', borderRadius:8, fontSize:12 }} />
              <Bar dataKey="count" radius={[0,4,4,0]}>
                {channels.map((entry, i) => (
                  <Cell key={i} fill={CHANNEL_COLORS[entry.name] || '#8888aa'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
