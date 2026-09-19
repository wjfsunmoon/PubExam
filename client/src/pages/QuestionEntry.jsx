import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionApi, analysisApi } from '../api';

const MODULES = ['行测', '申论', '公基', '面试'];
const SUBMODULES = {
  行测: ['言语理解', '判断推理', '数量关系', '资料分析', '常识判断'],
  申论: ['归纳概括', '综合分析', '提出对策', '应用文写作', '文章写作'],
  公基: ['法律', '政治', '经济', '管理', '公文', '科技', '历史人文', '地理'],
  面试: ['综合分析', '计划组织', '人际关系', '应急应变', '言语表达'],
};
const FREQUENCIES = ['高频', '中频', '低频'];

export default function QuestionEntry() {
  const navigate = useNavigate();
  const [aiStatus, setAiStatus] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    module: '行测',
    submodule: '判断推理',
    questionType: '削弱型',
    difficulty: 3,
    frequency: '高频',
    year: '',
    tags: '另有他因, 因果论证',
    stem: '',
    options: [
      { label: 'A', content: '' },
      { label: 'B', content: '' },
      { label: 'C', content: '' },
      { label: 'D', content: '' },
    ],
    correctAnswer: 'A',
  });

  useEffect(() => {
    analysisApi.status().then(({ data }) => setAiStatus(data)).catch(() => {});
  }, []);

  const setOption = (index, field, value) => {
    const options = [...form.options];
    options[index] = { ...options[index], [field]: value };
    setForm({ ...form, options });
  };

  const addOption = () => {
    const nextLabel = String.fromCharCode(65 + form.options.length);
    setForm({ ...form, options: [...form.options, { label: nextLabel, content: '' }] });
  };

  const removeOption = (index) => {
    if (form.options.length <= 2) return;
    const options = form.options.filter((_, i) => i !== index);
    setForm({ ...form, options });
  };

  const buildQuestionData = () => ({
    metadata: {
      module: form.module,
      submodule: form.submodule,
      questionType: form.questionType,
      difficulty: form.difficulty,
      frequency: form.frequency,
    },
    question: {
      stem: form.stem,
      options: form.options.filter((o) => o.content.trim()),
      correctAnswer: form.correctAnswer,
    },
  });

  const handleAnalyze = async () => {
    setError('');
    if (!form.stem.trim()) {
      setError('题干不能为空');
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const { data } = await analysisApi.generate(buildQuestionData());
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || '解析生成失败');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const tags = form.tags.split(/[,，、\s]+/).filter(Boolean);
      const payload = {
        metadata: {
          module: form.module,
          submodule: form.submodule,
          questionType: form.questionType,
          difficulty: form.difficulty,
          tags,
          frequency: form.frequency,
          year: form.year || null,
        },
        question: {
          stem: form.stem,
          options: form.options.filter((o) => o.content.trim()),
          correctAnswer: form.correctAnswer,
        },
        analysis: result
          ? {
              breakthrough: result.breakthrough,
              correctAnalysis: result.correctAnalysis,
              trapAnalysis: result.trapAnalysis,
              methodSummary: result.methodSummary,
              examTips: result.examTips,
            }
          : {},
        analysisSource: result?.analysisSource || 'manual',
        aiModel: result?.aiModel || null,
      };
      const { data } = await questionApi.create(payload);
      navigate(`/question/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">录入题目</h1>
          <p className="text-sm text-gray-500 mt-1">粘贴题目 → AI 自动生成结构化解析 → 保存题库</p>
        </div>
        {aiStatus && (
          <span
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              aiStatus.aiEnabled ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {aiStatus.aiEnabled ? `🤖 AI 已启用 · ${aiStatus.model}` : '📝 模板模式'}
          </span>
        )}
      </div>

      {/* 元数据表单 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-base font-bold mb-4 text-gray-800">题目元数据</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="模块">
            <select
              value={form.module}
              onChange={(e) => {
                const subs = SUBMODULES[e.target.value] || [];
                setForm({ ...form, module: e.target.value, submodule: subs[0] || '' });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              {MODULES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="子模块">
            <select
              value={form.submodule}
              onChange={(e) => setForm({ ...form, submodule: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              {(SUBMODULES[form.module] || []).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="题型">
            <input
              type="text"
              value={form.questionType}
              onChange={(e) => setForm({ ...form, questionType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="如: 削弱型"
            />
          </Field>
          <Field label="难度">
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>{'★'.repeat(d)}{'☆'.repeat(5 - d)}</option>
              ))}
            </select>
          </Field>
          <Field label="频次">
            <select
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </Field>
          <Field label="年份（选填）">
            <input
              type="text"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="如: 2023"
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="标签（逗号分隔）">
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="如: 另有他因, 因果论证, 对照实验"
            />
          </Field>
        </div>
      </div>

      {/* 题目内容 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-base font-bold mb-4 text-gray-800">题目内容</h2>
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">题干</label>
          <textarea
            value={form.stem}
            onChange={(e) => setForm({ ...form, stem: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-36 resize-y focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            placeholder="粘贴题干内容..."
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm text-gray-600">选项（点击"正确"标记答案）</label>
          {form.options.map((opt, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="font-bold text-gray-500 w-6 text-center text-sm">{opt.label}.</span>
              <input
                type="text"
                value={opt.content}
                onChange={(e) => setOption(i, 'content', e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                placeholder={`选项 ${opt.label} 内容`}
              />
              <label className="flex items-center gap-1 text-sm cursor-pointer whitespace-nowrap">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={form.correctAnswer === opt.label}
                  onChange={() => setForm({ ...form, correctAnswer: opt.label })}
                  className="text-green-600 accent-green-600"
                />
                正确
              </label>
              {form.options.length > 2 && (
                <button
                  onClick={() => removeOption(i)}
                  className="text-red-400 hover:text-red-600 text-sm w-8"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {form.options.length < 6 && (
            <button
              onClick={addOption}
              className="text-sm text-brand-600 hover:text-brand-700 mt-1"
            >
              + 添加选项
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3 sticky bottom-4">
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="px-5 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-lg"
        >
          {analyzing ? '🤖 AI 解析中...' : '🤖 生成解析'}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 shadow-lg"
        >
          {saving ? '保存中...' : '💾 保存到题库'}
        </button>
      </div>

      {/* 解析结果预览 */}
      {result && (
        <div className="bg-white rounded-xl shadow-sm p-5 border-2 border-brand-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">解析结果预览</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">
              {result.analysisSource === 'ai' ? `AI · ${result.aiModel}` : '模板模式（配置 API Key 后启用 AI）'}
            </span>
          </div>
          <div className="space-y-3 text-sm">
            <PreviewBlock icon="🎯" label="破题眼" color="text-brand-600" content={result.breakthrough} />
            <PreviewBlock icon="✓" label="正确项分析" color="text-green-600" content={result.correctAnalysis} />
            {result.trapAnalysis?.length > 0 && (
              <div>
                <span className="font-bold text-red-500">⚠️ 干扰项排雷</span>
                {result.trapAnalysis.map((t, i) => (
                  <div key={i} className="text-gray-700 mt-1 ml-4 text-sm">
                    <span className="font-bold text-red-600">{t.option}</span>
                    <span className="text-gray-500"> ({t.errorType}): </span>
                    {t.explanation}
                  </div>
                ))}
              </div>
            )}
            <PreviewBlock icon="💡" label="方法总结" color="text-blue-500" content={result.methodSummary} />
            <PreviewBlock icon="📌" label="备考提醒" color="text-orange-500" content={result.examTips} />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function PreviewBlock({ icon, label, color, content }) {
  if (!content) return null;
  return (
    <div>
      <span className={`font-bold ${color}`}>
        {icon} {label}:
      </span>
      <p className="text-gray-700 mt-1 whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
    </div>
  );
}
