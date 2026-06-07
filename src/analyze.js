/**
 * 论文深度分析模块
 * 使用 LLM 进行科研文献结构拆解
 */

import { SYSTEM_PROMPT, generateAnalysisPrompt } from './prompts/literature-analysis.js';
import config from './config.js';

/**
 * 调用 LLM API 进行分析
 * 支持多种后端：OpenAI、智谱、本地模型等
 */
export async function callLLM(prompt, options = {}) {
  // 检查是否配置了 LLM
  if (!config.llm?.enabled) {
    console.log('[LLM] 未配置 LLM，使用简化分析');
    return generateSimpleAnalysis(prompt);
  }

  const { baseUrl, apiKey, model } = config.llm;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'glm-4-plus',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT.slice(0, 8000) },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!res.ok) {
      throw new Error(`LLM API 错误: ${res.status}`);
    }

    const data = await res.json();
    // GLM-5 推理模型可能返回 reasoning_content 而非 content
    const message = data.choices[0]?.message;
    return message?.content || message?.reasoning_content || '';
  } catch (error) {
    console.error('[LLM] 调用失败:', error.message);
    return generateSimpleAnalysis(prompt);
  }
}

/**
 * 简化分析（无 LLM 时使用）
 */
function generateSimpleAnalysis(prompt) {
  // 提取论文信息
  const titleMatch = prompt.match(/\*\*标题\*\*:\s*(.+)/);
  const abstractMatch = prompt.match(/\*\*摘要.*?\*\*:\n([\s\S]+?)(?=\n\*\*|$)/);

  const title = titleMatch ? titleMatch[1] : '未知标题';
  const abstract = abstractMatch ? abstractMatch[1].trim() : '';

  return `
# 📚 科研文献结构拆解

## 论文标题
${title}

## ⚠️ 深度分析说明
当前未配置 LLM API，无法进行完整的科研文献结构拆解。
如需启用完整分析，请在配置文件中添加 LLM 配置：

\`\`\`json
{
  "llm": {
    "enabled": true,
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "your-api-key",
    "model": "gpt-4"
  }
}
\`\`\`

## 简要内容
${abstract.slice(0, 500)}${abstract.length > 500 ? '...' : ''}

## 建议
1. 配置 OpenAI / 智谱 / DeepSeek 等 LLM API
2. 或手动将论文内容发送给 AI 助手进行分析
`;
}

/**
 * 深度分析论文
 * @param {Object} paper - 论文对象
 */
export async function analyzePaper(paper) {
  console.log(`[分析] 正在深度分析: ${paper.title.slice(0, 50)}...`);

  const prompt = generateAnalysisPrompt(paper);
  const analysis = await callLLM(prompt);

  return {
    ...paper,
    deepAnalysis: analysis
  };
}

/**
 * 批量分析论文
 */
export async function analyzeAllPapers(papers) {
  const analyzed = [];

  for (const paper of papers) {
    try {
      const result = await analyzePaper(paper);
      analyzed.push(result);
      // 避免请求过快
      await new Promise(r => setTimeout(r, 2000));
    } catch (error) {
      console.error(`[分析] 论文分析失败: ${paper.pmid}`);
      analyzed.push(paper);
    }
  }

  return analyzed;
}
