/**
 * Mermaid 渲染模块
 * 将 Mermaid 代码转换为 base64 PNG 图片，用于邮件推送
 *
 * 使用 mermaid.ink API 进行在线转换
 */

import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const MERMAID_INK_API = 'https://mermaid.ink/img';

/**
 * 将 Mermaid 代码转换为 base64 PNG 图片
 * @param {string} mermaidCode - Mermaid 代码
 * @param {Object} options - 配置选项
 * @returns {Promise<string>} - base64 PNG 数据 URL
 */
export async function renderMermaidToBase64(mermaidCode, options = {}) {
  if (!mermaidCode || !mermaidCode.trim()) {
    return null;
  }

  const {
    theme = 'neutral',
    bgColor = 'white',
    width = 800,
    scale = 2
  } = options;

  try {
    // 对 Mermaid 代码进行 base64 编码，然后 URL 编码
    // encodeURIComponent 处理 base64 中的 +/和 = 字符
    const base64Code = Buffer.from(mermaidCode.trim(), 'utf-8').toString('base64');
    const encodedCode = encodeURIComponent(base64Code);

    // 构建 mermaid.ink URL
    const params = new URLSearchParams({
      type: 'png',
      bgColor,
      theme,
      width: String(width),
      scale: String(scale)
    });

    const url = `${MERMAID_INK_API}/${encodedCode}?${params.toString()}`;

    console.log(`[Mermaid] 正在渲染图表...`);

    // 获取图片
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`mermaid.ink API 错误: ${response.status}`);
    }

    // 转换为 base64（使用 arrayBuffer 代替已弃用的 buffer）
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    console.log(`[Mermaid] 渲染成功，大小: ${(base64.length / 1024).toFixed(1)} KB`);

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('[Mermaid] 渲染失败:', error.message);
    return null;
  }
}

/**
 * 从 Markdown 文本中提取 Mermaid 代码块
 * @param {string} markdown - Markdown 文本
 * @returns {Array<{code: string, index: number, startIndex: number, length: number}>} - Mermaid 代码块数组
 */
export function extractMermaidBlocks(markdown) {
  const blocks = [];
  const re = /```mermaid\s*\n([\s\S]*?)```/g;
  let match;
  let index = 0;

  while ((match = re.exec(markdown)) !== null) {
    blocks.push({
      code: match[1].trim(),
      index: index++,
      startIndex: match.index,  // 匹配的起始位置
      fullMatch: match[0],      // 完整匹配的字符串
      length: match[0].length   // 匹配字符串的长度
    });
  }

  return blocks;
}

/**
 * 将 Markdown 中的 Mermaid 代码块替换为 base64 PNG 图片
 * @param {string} markdown - Markdown 文本
 * @param {Object} options - 渲染选项
 * @returns {Promise<string>} - 替换后的 HTML
 */
export async function renderMermaidInMarkdown(markdown, options = {}) {
  const blocks = extractMermaidBlocks(markdown);

  if (blocks.length === 0) {
    return markdown;
  }

  console.log(`[Mermaid] 发现 ${blocks.length} 个图表待渲染`);

  let result = markdown;

  // 从后往前替换，避免索引错位
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    const base64Png = await renderMermaidToBase64(block.code, options);

    if (base64Png) {
      const imgTag = `<img src="${base64Png}" alt="因果流程图" style="max-width: 100%; height: auto; display: block; margin: 1em auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />`;
      result = result.slice(0, block.startIndex) + imgTag + result.slice(block.startIndex + block.length);
    } else {
      // 渲染失败，保留原始代码块
      console.warn(`[Mermaid] 图表 ${i + 1} 渲染失败，保留原始代码`);
    }

    // 避免请求过快
    if (i > 0) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return result;
}

/**
 * 生成简单的因果流程图 HTML（备用方案，无需 API）
 * 当 mermaid.ink 不可用时使用
 * @param {Object} causalChain - 因果链数据
 * @returns {string} - HTML 表格/流程图
 */
export function generateCausalChainHtml(causalChain) {
  if (!causalChain) return '';

  const { upstream, mechanism, downstream, risks } = causalChain;

  const parts = [];

  if (upstream) {
    parts.push(`<div style="background: #e3f2fd; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px;">
      <strong>🔹 上游变量 (X)</strong><br/>
      <span style="color: #1565c0;">${upstream}</span>
    </div>`);
  }

  if (mechanism) {
    parts.push(`<div style="text-align: center; color: #666; font-size: 20px;">↓</div>`);
    parts.push(`<div style="background: #fff3e0; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px;">
      <strong>🔸 中间机制 (Z)</strong><br/>
      <span style="color: #e65100;">${mechanism}</span>
    </div>`);
  }

  if (downstream) {
    parts.push(`<div style="text-align: center; color: #666; font-size: 20px;">↓</div>`);
    parts.push(`<div style="background: #e8f5e9; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px;">
      <strong>🔹 下游表型 (Y)</strong><br/>
      <span style="color: #2e7d32;">${downstream}</span>
    </div>`);
  }

  if (risks && risks.length > 0) {
    parts.push(`<div style="margin-top: 12px; padding: 10px; background: #fff8e1; border-left: 3px solid #ff9800; border-radius: 4px;">
      <strong>⚠️ 逻辑风险</strong><br/>
      ${risks.map(r => `<span style="color: #e65100;">• ${r}</span>`).join('<br/>')}
    </div>`);
  }

  return `
  <div style="background: #fafafa; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #e0e0e0;">
    <h4 style="margin: 0 0 12px 0; color: #333;">📊 因果链结构</h4>
    ${parts.join('')}
  </div>`;
}

// 测试
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const testMermaid = `
flowchart TD
    A[现象观察] --> B[相关性分析]
    B --> C[干预实验]
    C --> D{Rescue验证}
    D -->|成功| E[机制确证]
    D -->|失败| F[单路径风险]
  `;

  renderMermaidToBase64(testMermaid).then(base64 => {
    if (base64) {
      console.log('渲染成功！');
      console.log('Base64 长度:', base64.length);
    }
  });
}
