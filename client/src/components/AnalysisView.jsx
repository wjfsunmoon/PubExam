import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { exportMarkdown, exportJSON } from '../utils/export';

function DifficultyStars({ level }) {
  return (
    <span className="text-sm">
      <span className="text-yellow-500">{'★'.repeat(level)}</span>
      <span className="text-gray-300">{'☆'.repeat(5 - level)}</span>
    </span>
  );
}

/**
 * 结构化解析展示组件
 * 渲染：元数据 → 题目 → 破题眼 → 正确项分析 → 干扰项排雷 → 方法总结 → 备考提醒
 */
export default function AnalysisView({ question }) {
  const { metadata: meta, question: que, analysis: an, analysisSource, aiModel } = question;
  const trapList = an.trapAnalysis || [];

  return (
    <div className="space-y-5">
      {/* ── 题目元数据 ── */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="px-2.5 py-1 rounded bg-brand-100 text-brand-700 text-sm font-medium">
            {meta.module}
          </span>
          <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-sm">
            {meta.submodule}
          </span>
          <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-sm">
            {meta.questionType}
          </span>
          <DifficultyStars level={meta.difficulty} />
          <span className="px-2 py-1 rounded bg-orange-50 text-orange-700 text-sm">
            {meta.frequency}
          </span>
          {meta.year && (
            <span className="text-sm text-gray-400">{meta.year}</span>
          )}
          {analysisSource === 'ai' && (
            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-xs">
              AI 解析 · {aiModel}
            </span>
          )}
          {analysisSource === 'manual' && (
            <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs">
              人工解析
            </span>
          )}
          {analysisSource === 'template' && (
            <span className="px-2 py-0.5 rounded bg-gray-50 text-gray-500 text-xs">
              模板模式
            </span>
          )}
        </div>
        {meta.tags?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {meta.tags.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-xs">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── 题目 ── */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-base font-bold mb-3 flex items-center gap-2 text-gray-800">
          <span className="text-brand-600">📝</span> 题目
        </h2>
        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm mb-4 bg-gray-50 p-3 rounded">
          {que.stem}
        </div>
        <div className="space-y-2">
          {que.options?.map((opt) => {
            const isCorrect = opt.label === que.correctAnswer;
            return (
              <div
                key={opt.label}
                className={`flex gap-2 p-2.5 rounded text-sm ${
                  isCorrect
                    ? 'bg-green-50 border border-green-300'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-gray-500'}`}>
                  {opt.label}.
                </span>
                <span className="flex-1 text-gray-700">{opt.content}</span>
                {isCorrect && (
                  <span className="text-green-600 text-xs font-medium whitespace-nowrap">✓ 正确答案</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 破题眼 ── */}
      {an.breakthrough && (
        <div className="bg-gradient-to-r from-brand-50 to-blue-50 rounded-xl shadow-sm p-5 border-l-4 border-brand-500">
          <h2 className="text-base font-bold mb-2 flex items-center gap-2">
            <span className="text-brand-600">🎯</span> 破题眼
          </h2>
          <p className="text-gray-700 leading-relaxed text-sm">{an.breakthrough}</p>
        </div>
      )}

      {/* ── 正确项分析 ── */}
      {an.correctAnalysis && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <span className="text-green-600">✓</span> 正确项分析
          </h2>
          <div className="markdown-content text-gray-700 text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {an.correctAnalysis}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* ── 干扰项排雷 ── */}
      {trapList.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <span className="text-red-500">⚠️</span> 干扰项排雷
          </h2>
          <div className="space-y-3">
            {trapList.map((trap, i) => (
              <div key={i} className="border border-red-100 rounded-lg p-3 bg-red-50/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-bold text-red-600 text-sm">{trap.option}</span>
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs">
                    {trap.errorType}
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{trap.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 方法总结 ── */}
      {an.methodSummary && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <span className="text-blue-500">💡</span> 方法总结
          </h2>
          <div className="markdown-content text-gray-700 text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {an.methodSummary}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* ── 备考提醒 ── */}
      {an.examTips && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <span className="text-orange-500">📌</span> 备考提醒
          </h2>
          <div className="markdown-content text-gray-700 text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {an.examTips}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* ── 导出 ── */}
      <div className="flex gap-3">
        <button
          onClick={() => exportMarkdown(question)}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          📄 导出 Markdown
        </button>
        <button
          onClick={() => exportJSON(question)}
          className="px-4 py-2 rounded-lg bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          📦 导出 JSON
        </button>
      </div>
    </div>
  );
}
