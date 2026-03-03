import { useApi } from '../../hooks/useApi.js';
import { api } from '../../api.js';

export default function TodosTab() {
  const { data, loading, reload } = useApi(api.todos, [], 60000);

  return (
    <div className="tab-content">
      <div className="card">
        <div className="card-title">진행 중 <button className="btn-refresh" onClick={reload}>↻</button></div>
        {loading ? <p className="loading">로딩 중...</p> :
         !(data?.pending?.length) ? <p className="loading">모두 완료됐어요! 🎉</p> :
         data.pending.map((t, i) => (
          <div key={i} className="list-item">
            <div className="todo-check" />
            <div className="li-body"><div className="todo-text">{t}</div></div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-title">완료됨</div>
        {loading ? <p className="loading">로딩 중...</p> :
         !(data?.done?.length) ? <p className="loading">완료 항목 없음</p> :
         data.done.map((t, i) => (
          <div key={i} className="list-item">
            <div className="todo-check done">✓</div>
            <div className="li-body"><div className="todo-text done">{t}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
