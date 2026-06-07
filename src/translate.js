import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from './config.js';

/**
 * 使用智谱 GLM 进行翻译
 */
async function translateWithGLM(text) {
  if (!text) return '';

  const textStr = String(text).trim();
  if (textStr.length === 0) return '';

  // 检查 LLM 配置
  if (!config.llm?.enabled) {
    console.log('[翻译] LLM 未启用，跳过翻译');
    return text;
  }

  try {
    const res = await fetch(`${config.llm.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.llm.apiKey}`
      },
      body: JSON.stringify({
        model: config.llm.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的学术翻译，将英文翻译成中文。保持学术准确性，使用专业的医学术语。直接输出翻译结果，不要解释。'
          },
          {
            role: 'user',
            content: `将以下英文翻译成中文：\n\n${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!res.ok) {
      console.error(`[翻译] API 错误: ${res.status}`);
      return text;
    }

    const data = await res.json();
    // GLM-5 推理模型可能返回 reasoning_content 而非 content
    const message = data.choices?.[0]?.message;
    const translated = message?.content || message?.reasoning_content;

    if (!translated) {
      console.error('[翻译] API 返回空结果');
      return text;
    }

    return translated;
  } catch (error) {
    console.error('[翻译] 失败:', error.message);
    return text;
  }
}

/**
 * 翻译文本（使用 GLM）
 */
export async function translateText(text, sourceLang = 'en', targetLang = 'zh-CN') {
  if (!text) return '';
  
  // 确保是字符串
  const textStr = String(text).trim();
  if (textStr.length === 0) return '';
  
  // 使用 GLM 翻译（无字符限制，质量更高）
  return await translateWithGLM(textStr);
}

/**
 * 批量翻译关键词（一次 API 调用翻译所有关键词，节省请求次数）
 */
async function translateKeywordsBatch(keywords) {
  if (!keywords || keywords.length === 0) return [];
  
  const batchText = keywords.map((kw, i) => `${i + 1}. ${kw}`).join('\n');
  const prompt = `将以下学术关键词翻译成中文，保持编号格式，每行一个翻译结果，不要解释：\n\n${batchText}`;
  
  try {
    const res = await translateWithGLM(prompt);
    
    if (res === prompt) return [...keywords]; // 翻译失败，返回原文
    
    // 解析翻译结果
    const lines = res.split('\n').filter(l => l.trim());
    const translated = [];
    for (const line of lines) {
      // 去掉编号前缀（如 "1. " 或 "1、"）
      const cleaned = line.replace(/^\d+[\.\、]\s*/, '').trim();
      if (cleaned) translated.push(cleaned);
    }
    
    // 如果解析出的数量不匹配，返回原文
    if (translated.length !== keywords.length) {
      console.warn(`[翻译] 关键词数量不匹配 (期望${keywords.length}, 得到${translated.length})，使用原文`);
      return [...keywords];
    }
    
    return translated;
  } catch (error) {
    console.error('[翻译] 批量翻译关键词失败:', error.message);
    return [...keywords];
  }
}

/**
 * 翻译论文信息
 */
export async function translatePaper(paper) {
  console.log(`[翻译] 正在翻译: ${paper.title.slice(0, 50)}...`);
  
  try {
    // 一次性翻译标题和摘要（更高效）
    const combinedText = `标题：${paper.title}\n\n摘要：${paper.abstract}`;
    const translatedCombined = await translateText(combinedText);
    
    // 解析翻译结果
    let titleZh = paper.title;
    let abstractZh = paper.abstract;
    
    if (translatedCombined !== combinedText) {
      // 尝试多种格式匹配
      const titleMatch = translatedCombined.match(/标题[：:]\s*(.+?)(?=\n\n摘要[：:]|摘要[：:]|\n\n)/s);
      const abstractMatch = translatedCombined.match(/摘要[：:]\s*([\s\S]+)/);
      
      if (titleMatch) titleZh = titleMatch[1].trim();
      if (abstractMatch) abstractZh = abstractMatch[1].trim();
    }
    
    // 批量翻译关键词（一次 API 调用，替代逐个翻译）
    const keywordsToTranslate = paper.keywords.slice(0, 5);
    const keywordsZh = await translateKeywordsBatch(keywordsToTranslate);
    
    return {
      ...paper,
      titleZh,
      abstractZh,
      keywordsZh
    };
  } catch (error) {
    console.error(`[翻译] 论文翻译失败: ${paper.pmid}`, error.message);
    return {
      ...paper,
      titleZh: paper.title,
      abstractZh: paper.abstract,
      keywordsZh: paper.keywords
    };
  }
}

/**
 * 翻译所有论文
 */
export async function translateAllPapers(papers) {
  const translated = [];
  
  for (const paper of papers) {
    try {
      const translatedPaper = await translatePaper(paper);
      translated.push(translatedPaper);
      // 延迟避免 API 限流
      await new Promise(r => setTimeout(r, 300));
    } catch (error) {
      console.error(`[翻译] 论文翻译失败: ${paper.pmid}`);
      translated.push({
        ...paper,
        titleZh: paper.title,
        abstractZh: paper.abstract,
        keywordsZh: paper.keywords
      });
    }
  }
  
  return translated;
}
