import { SYSTEM_PROMPT, buildUserPrompt } from '../utils/prompts.js';

/**
 * AI 解析引擎
 *
 * 两种模式：
 * - AI 模式：调用 OpenAI 兼容 LLM API，自动生成完整结构化解析
 * - 模板模式（无 API key）：生成基础框架，标注"待 AI 生成"，确保流程可走通
 *
 * @param {Object} questionData — 题目数据（含 metadata + question）
 * @returns {Promise<Object>} — 结构化解析结果
 */
export async function analyzeQuestion(questionData) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return generateTemplateAnalysis(questionData);
  }

  return await callLLM(questionData);
}

/** AI 模式：调用 LLM API */
async function callLLM(questionData) {
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

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

  // 解析 JSON（兼容模型可能输出的 markdown 代码块）
  const jsonStr = content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  let analysis;
  try {
    analysis = JSON.parse(jsonStr);
  } catch {
    // 如果 JSON 解析失败，将原始内容作为 correctAnalysis 返回
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

/** 模板模式：无 API key 时的降级策略 */
function generateTemplateAnalysis(questionData) {
  const que = questionData.question || questionData;
  const options = que.options || [];
  const correct = que.correctAnswer || '';
  const wrongOptions = options.filter((o) => o.label !== correct);

  return {
    breakthrough: `[待 AI 生成] 本题需识别题干论证结构，定位核心考点后确定解题方向。配置 OPENAI_API_KEY 后可获取 AI 自动解析。`,
    correctAnalysis: `**正确答案：${correct}**\n\n[待 AI 生成] 当前为模板模式。请在 server/.env 中配置 OPENAI_API_KEY 以启用 AI 自动解析功能。`,
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
