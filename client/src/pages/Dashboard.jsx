import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questionApi } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    questionApi
      .stats()
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-gray-400 py-12">加载中...</div>;
  if (!stats) return <div className="text-center text-red-500 py-12">加载失败，请检查服务是否启动</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据看板</h1>
          <p className="text-sm text-gray-500 mt-1">题库统计概览</p>
        </div>
        <Link
          to="/entry"
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          + 录入新题
        </Link>
      </div>

      {/* 总题量 + 模块卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-brand-500">
          <div className="text-sm text-gray-500">总题量</div>
          <div className="text-3xl font-bold text-brand-600 mt-1">{stats.total}</div>
        </div>
        {stats.byModule.map((m, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-gray-300">
            <div className="text-sm text-gray-500">{m.module}</div>
            <div className="text-3xl font-bold text-gray-800 mt-1">{m.count}</div>
          </div>
        ))}
        {stats.byModule.length === 0 && stats.total === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-gray-200 col-span-3 flex items-center justify-center text-gray-400 text-sm">
            暂无题目，点击右上角录入
          </div>
        )}
      </div>

      {/* 模块分布 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-bold mb-4">模块分布</h2>
        {stats.byModule.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">暂无数据</p>
        ) : (
          <div className="space-y-3">
            {stats.byModule.map((m, i) => {
              const pct = stats.total > 0 ? (m.count / stats.total) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-600 font-medium">{m.module}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
                    <div
                      className="bg-brand-500 h-full rounded-full flex items-center justify-end px-2 text-white text-xs font-medium transition-all"
                      style={{ width: `${Math.max(pct, 10)}%` }}
                    >
                      {m.count} 题
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 w-10 text-right">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 难度分布 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-bold mb-4">难度分布</h2>
        {stats.total === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">暂无数据</p>
        ) : (
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((level) => {
              const found = stats.byDifficulty.find((d) => d.difficulty === level);
              const count = found?.count || 0;
              return (
                <div key={level} className="text-center">
                  <div className="text-lg">
                    <span className="text-yellow-500">{'★'.repeat(level)}</span>
                    <span className="text-gray-200">{'☆'.repeat(5 - level)}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mt-1">{count}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 子模块分布 */}
      {stats.bySubmodule.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-bold mb-4">子模块分布</h2>
          <div className="flex gap-2 flex-wrap">
            {stats.bySubmodule.map((s, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm flex items-center gap-1.5"
              >
                {s.submodule}
                <span className="bg-brand-100 text-brand-700 px-1.5 rounded text-xs font-bold">
                  {s.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
