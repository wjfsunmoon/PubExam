/**
 * AI 解析引擎 — Prompt 工程核心模块
 *
 * 设计思路：
 * 1. system prompt 定义角色 + 约束 + 输出格式，确保结构化、可解析
 * 2. user prompt 注入题目上下文，引导模型逐项生成
 * 3. 无 API key 时降级为模板模式（生成框架，标注"待 AI 生成"）
 */

export const SYSTEM_PROMPT = `你是一位拥有10年以上国考/省考命题研究与教学经验的资深公考教研专家。请对以下考公题目进行深度解析。

## 解析原则（绝对红线）
1. 禁止编造：不确定的知识点必须标注"待核实"，严禁杜撰法条、数据或政策
2. 政治中立：严格遵循官方表述，不对敏感时政做主观评价
3. 拒绝模糊：不使用"可能""大概"等词汇，解析必须有明确依据
4. 涉及法律/政策题，以最新有效版本为准，注明适用时效

## 解析要求
1. 破题眼：一句话点明解题切入点，直指核心考点
2. 正确项分析：说明正确选项的完整逻辑推导过程
3. 干扰项排雷：逐项分析每个错误选项，必须说明"为什么错"（偷换概念/过度推断/无关项/另有他因等）
4. 方法总结：归纳可迁移的解题技巧/公式/记忆口诀
5. 备考提醒：常见误区、关联知识点、易混淆点对比

## 输出格式
请严格输出以下JSON格式。不要输出任何其他内容，不要使用 markdown 代码块：

{
  "breakthrough": "一句话点明解题切入点",
  "correctAnalysis": "正确选项的逻辑推导过程（可使用 Markdown 格式）",
  "trapAnalysis": [
    {
      "option": "选项字母（如 B）",
      "errorType": "错误类型分类",
      "explanation": "为什么错的具体分析"
    }
  ],
  "methodSummary": "可迁移的解题技巧/公式/记忆口诀（可使用 Markdown 格式）",
  "examTips": "常见误区/关联知识点/易混淆点对比（可使用 Markdown 格式）"
}`;

/** 构建用户 prompt，注入题目上下文 */
export function buildUserPrompt(questionData) {
  const meta = questionData.metadata || questionData;
  const que = questionData.question || questionData;
  const optionsText = (que.options || [])
    .map((o) => `${o.label}. ${o.content}`)
    .join('\n');

  return `## 题目元数据
- 模块: ${meta.module || '未指定'}
- 子模块: ${meta.submodule || '未指定'}
- 题型: ${meta.questionType || '未指定'}
- 难度: ${meta.difficulty || 3}/5
- 考查频次: ${meta.frequency || '中频'}

## 题干
${que.stem || '（无题干）'}

## 选项
${optionsText || '（无选项）'}

## 正确答案
${que.correctAnswer || '（未指定）'}

请按照系统提示中的格式要求输出结构化解析。`;
}
