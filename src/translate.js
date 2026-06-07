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
 * 从 LLM 翻译结果中智能拆分标题和摘要
 * 支持多种分隔格式：标题/摘要、Title/Abstract、数字编号等
 */
function parseTranslatedResult(translated, originalTitle, originalAbstract) {
  let titleZh = '';
  let abstractZh = '';

  // 策略1: 按"标题"和"摘要"关键词拆分（中英文冒号都支持）
  const patterns = [
    // 中文格式：标题：...  摘要：...
    { title: /标题[：:]\s*([\s\S]+?)(?=\n\s*摘要[：:]|\n\s*Abstract[：:]|$)/i, abs: /摘要[：:]\s*([\s\S]+)/i },
    // 英文格式：Title: ...  Abstract: ...
    { title: /Title[：:]\s*([\s\S]+?)(?=\n\s*Abstract[：:]|\n\s*摘要[：:]|$)/i, abs: /Abstract[：:]\s*([\s\S]+)/i },
    // 【标题】...  【摘要】... 格式
    { title: /[【\[]标题[】\]]\s*([\s\S]+?)(?=[【\[]摘要[】\]]|$)/, abs: /[【\[]摘要[】\]]\s*([\s\S]+)/ },
    // 1. 标题 ... 2. 摘要 ... 格式
    { title: /1[.、)\s]+([\s\S]+?)(?=2[.、)\s]+|$)/, abs: /2[.、)\s]+([\s\S]+)/ },
  ];

  for (const { title: tRe, abs: aRe } of patterns) {
    const tm = translated.match(tRe);
    const am = translated.match(aRe);
    if (tm && am) {
      titleZh = tm[1].trim();
      abstractZh = am[1].trim();
      break;
    }
    // 只匹配到标题，没有摘要标记
    if (tm && !am) {
      titleZh = tm[1].trim();
    }
  }

  // 策略2: 如果都没匹配到，按换行数量判断（摘要通常比标题长很多）
  if (!titleZh && !abstractZh) {
    const doubleNewline = translated.indexOf('\n\n');
    if (doubleNewline > 0 && doubleNewline < 200) {
      // 第一个双换行前是标题，后面是摘要
      titleZh = translated.slice(0, doubleNewline).trim();
      abstractZh = translated.slice(doubleNewline + 2).trim();
    } else {
      // 单换行分割
      const firstNewline = translated.indexOf('\n');
      if (firstNewline > 0 && firstNewline < 200) {
        titleZh = translated.slice(0, firstNewline).trim();
        abstractZh = translated.slice(firstNewline + 1).trim();
      } else {
        // 整段当作摘要（标题用原文）
        titleZh = '';
        abstractZh = translated.trim();
      }
    }
  }

  // 策略3: 根据长度合理性校验
  // 标题通常 < 150 字，摘要 > 50 字
  if (titleZh.length > 300 && !abstractZh) {
    // 可能标题和摘要没有被正确拆分，整个都当作摘要
    abstractZh = titleZh;
    titleZh = '';
  }

  // 回退：没有解析出标题就用原文
  if (!titleZh) titleZh = originalTitle;
  if (!abstractZh) abstractZh = originalAbstract;

  return { titleZh, abstractZh };
}

/**
 * 翻译论文信息
 */
export async function translatePaper(paper) {
  console.log(`[翻译] 正在翻译: ${paper.title.slice(0, 50)}...`);
  
  try {
    // 使用结构化提示词，引导 LLM 按固定格式输出
    const prompt = `请将以下学术论文的标题和摘要翻译成中文。请严格按照以下格式输出，不要添加其他内容：

标题：
（翻译后的标题）

摘要：
（翻译后的摘要）

---
原文标题：${paper.title}

原文摘要：
${paper.abstract}`;

    const translatedCombined = await translateText(prompt);
    
    // 智能解析翻译结果
    let titleZh = paper.title;
    let abstractZh = paper.abstract;
    
    if (translatedCombined !== prompt) {
      const parsed = parseTranslatedResult(translatedCombined, paper.title, paper.abstract);
      titleZh = parsed.titleZh;
      abstractZh = parsed.abstractZh;
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
