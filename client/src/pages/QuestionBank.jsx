import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questionApi } from '../api';

const MODULES = ['行测', '申论', '公基', '面试'];

export default function QuestionBank() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ module: '', difficulty: '', q: '' });
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => ({ ...f, q: searchInput }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadQuestions();
  }, [filters.module, filters.difficulty, filters.q]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.module) params.module = filters.module;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.q) params.q = filters.q;
      const { data } = await questionApi.list(params);
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除这道题目？此操作不可撤销。')) return;
    try {
      await questionApi.delete(id);
      loadQuestions();
    } catch (err) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">题库浏览</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 道题目</p>
        </div>
        <Link
          to="/entry"
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          + 录入新题
        </Link>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex gap-3 flex-wrap items-center">
        <select
          value={filters.module}
          onChange={(e) => setFilters({ ...filters, module: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">全部模块</option>
          {MODULES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={filters.difficulty}
          onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">全部难度</option>
          {[1, 2, 3, 4, 5].map((d) => (
            <option key={d} value={d}>{'★'.repeat(d)}{'☆'.repeat(5 - d)}</option>
          ))}
        </select>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="搜索题干关键词..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
        />
      </div>

      {/* 题目列表 */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-400 py-12 bg-white rounded-xl shadow-sm">
          <p className="text-lg mb-2">📭 暂无题目</p>
          <Link to="/entry" className="text-brand-600 text-sm hover:underline">
            去录入第一道题目 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <Link to={`/question/${q.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-700 text-xs font-medium">
                      {q.metadata.module}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">
                      {q.metadata.submodule}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">
                      {q.metadata.questionType}
                    </span>
                    <span className="text-xs">
                      <span className="text-yellow-500">{'★'.repeat(q.metadata.difficulty)}</span>
                      <span className="text-gray-200">{'☆'.repeat(5 - q.metadata.difficulty)}</span>
                    </span>
                    <span className="text-xs text-orange-600">{q.metadata.frequency}</span>
                    {q.analysisSource === 'ai' && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 text-xs">AI</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                    {q.question.stem}
                  </p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {q.metadata.tags?.slice(0, 4).map((tag, i) => (
                      <span key={i} className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </Link>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="text-gray-400 hover:text-red-500 text-sm whitespace-nowrap px-2"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
