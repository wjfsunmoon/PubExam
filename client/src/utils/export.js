/**
 * 题目导出工具 — Markdown / JSON 双格式
 */

/** 将题目数据转换为规范化的 Markdown 解析文档 */
export function questionToMarkdown(q) {
  const { metadata: meta, question: que, analysis: an } = q;
  const trapList = an.trapAnalysis || [];
  const stars = '★'.repeat(meta.difficulty) + '☆'.repeat(5 - meta.difficulty);

  let md = `### 📌 题目元数据\n`;
  md += `- 模块/子模块: ${meta.module}-${meta.submodule}-${meta.questionType}\n`;
  md += `- 难度系数: ${stars}\n`;
  md += `- 核心考点: ${(meta.tags || []).join(', ')}\n`;
  md += `- 考查频次: ${meta.frequency}${meta.year ? ` (${meta.year})` : ''}\n\n`;

  md += `### 📝 题目\n\n${que.stem}\n\n`;
  (que.options || []).forEach((opt) => {
    const marker = opt.label === que.correctAnswer ? ' ✅' : '';
    md += `${opt.label}. ${opt.content}${marker}\n`;
  });
  md += `\n**正确答案：${que.correctAnswer}**\n\n`;

  md += `### 🔍 深度解析\n\n`;
  md += `- **破题眼**: ${an.breakthrough || ''}\n\n`;
  md += `- **正确项分析**:\n\n${an.correctAnalysis || ''}\n\n`;

  if (trapList.length > 0) {
    md += `- **干扰项排雷**:\n\n`;
    trapList.forEach((t) => {
      md += `  - **${t.option}** (${t.errorType}): ${t.explanation}\n`;
    });
    md += `\n`;
  }

  md += `### 💡 方法总结\n\n${an.methodSummary || ''}\n\n`;
  md += `### ⚠️ 备考提醒\n\n${an.examTips || ''}\n`;

  return md;
}

/** 触发文件下载 */
export function downloadFile(content, filename, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMarkdown(q) {
  const md = questionToMarkdown(q);
  downloadFile(md, `题目_${q.id}_${q.metadata.submodule}.md`, 'text/markdown');
}

export function exportJSON(q) {
  const json = JSON.stringify(q, null, 2);
  downloadFile(json, `题目_${q.id}.json`, 'application/json');
}
