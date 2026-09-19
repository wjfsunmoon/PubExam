import { SYSTEM_PROMPT, buildUserPrompt } from '../utils/prompts.js';

/**
 * AI 解析引擎
 * AI 模式: 调用 LLM API（Workers 原生 fetch）
 * 模板模式: 无 API Key 时降级生成框架
 */
export async function analyzeQuestion(questionData, env) {
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    return generateTemplateAnalysis(questionData);
  }

  return await callLLM(questionData, env);
}

async function callLLM(questionData, env) {
  const baseUrl = env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = env.OPENAI_MODEL || 'gpt-4o';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(questionData) },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API 调用失败 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  const jsonStr = content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  let analysis;
  try {
    analysis = JSON.parse(jsonStr);
  } catch {
    analysis = {
      breakthrough: '[解析格式异常]',
      correctAnalysis: content,
      trapAnalysis: [],
      methodSummary: '',
      examTips: '',
    };
  }

  return {
    ...analysis,
    analysisSource: 'ai',
    aiModel: model,
  };
}

function generateTemplateAnalysis(questionData) {
  const que = questionData.question || questionData;
  const options = que.options || [];
  const correct = que.correctAnswer || '';
  const wrongOptions = options.filter((o) => o.label !== correct);

  return {
    breakthrough: `[待 AI 生成] 本题需识别题干论证结构，定位核心考点后确定解题方向。配置 OPENAI_API_KEY 后可获取 AI 自动解析。`,
    correctAnalysis: `**正确答案：${correct}**\n\n[待 AI 生成] 当前为模板模式。请在 Cloudflare 后台配置 OPENAI_API_KEY 以启用 AI 自动解析功能。`,
    trapAnalysis: wrongOptions.map((opt) => ({
      option: opt.label,
      errorType: '待分析',
      explanation: '[待 AI 生成] 配置 AI API 后将自动生成干扰项分析。',
    })),
    methodSummary: `[待 AI 生成] 配置 AI API 后将自动生成可迁移的解题方法论。`,
    examTips: `[待 AI 生成] 配置 AI API 后将自动生成备考提醒与易混淆点对比。`,
    analysisSource: 'template',
    aiModel: null,
  };
}
