/**
 * 公众号风格 HTML 格式化工具
 * 将 Markdown 分析结果转换为微信公众号风格
 * 
 * 支持两种模板风格：
 * - full（详细版）：完整论文信息，包含作者、单位、摘要等
 * - compact（简洁版）：精简展示，只保留标题、期刊、中文摘要
 */

/**
 * 格式化期刊信息徽章
 */
export function formatJournalBadge(journalInfo) {
  if (!journalInfo) return '';
  
  const badges = [];
  
  // 影响因子
  if (journalInfo.impactFactor) {
    badges.push(`<span style="display: inline-block; padding: 3px 8px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; font-size: 12px; font-weight: bold; border-radius: 4px; margin-right: 6px;">IF: ${journalInfo.impactFactor}</span>`);
  }
  
  // 中科院分区
  if (journalInfo.cas) {
    const casColors = {
      '1': '#dc2626', '1区': '#dc2626', '一区': '#dc2626',
      '2': '#ea580c', '2区': '#ea580c', '二区': '#ea580c',
      '3': '#16a34a', '3区': '#16a34a', '三区': '#16a34a',
      '4': '#2563eb', '4区': '#2563eb', '四区': '#2563eb'
    };
    const color = casColors[journalInfo.cas] || '#6b7280';
    badges.push(`<span style="display: inline-block; padding: 3px 8px; background: ${color}; color: white; font-size: 12px; font-weight: bold; border-radius: 4px; margin-right: 6px;">中科院 ${journalInfo.cas}</span>`);
  }
  
  // JCR 分区
  if (journalInfo.jcr) {
    const jcrColors = {
      'Q1': '#dc2626', 'Q2': '#ea580c', 'Q3': '#16a34a', 'Q4': '#2563eb',
      '1': '#dc2626', '2': '#ea580c', '3': '#16a34a', '4': '#2563eb'
    };
    const color = jcrColors[journalInfo.jcr] || '#6b7280';
    badges.push(`<span style="display: inline-block; padding: 3px 8px; background: ${color}; color: white; font-size: 12px; font-weight: bold; border-radius: 4px; margin-right: 6px;">JCR ${journalInfo.jcr}</span>`);
  }
  
  // TOP 标记
  if (journalInfo.top) {
    badges.push(`<span style="display: inline-block; padding: 3px 8px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; font-size: 12px; font-weight: bold; border-radius: 4px; margin-right: 6px;">🔥 TOP</span>`);
  }
  
  return badges.join('');
}

/**
 * ============ 详细版模板（full）============
 */
function generatePaperCardFull(paper, index) {
  const authorsStr = paper.authors.slice(0, 5).join(', ') + (paper.authors.length > 5 ? ' 等' : '');
  const affiliationsStr = paper.affiliations.slice(0, 2).join('; ') + (paper.affiliations.length > 2 ? ' ...' : '');
  const keywordsStr = (paper.keywordsZh || paper.keywords || []).slice(0, 5).join(', ');

  // 期刊信息徽章
  const journalBadge = paper.journalInfo ? formatJournalBadge(paper.journalInfo) : '';
  const journalLine = paper.journal ? `<p style="margin: 5px 0; font-size: 13px;"><strong>期刊:</strong> ${paper.journal} ${journalBadge}</p>` : '';

  return `
    <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #fafafa;">
      <h3 style="margin: 0 0 10px 0; color: #1565c0;">
        <a href="${paper.url}" style="color: #1565c0; text-decoration: none;">${index + 1}. ${paper.title}</a>
      </h3>
      ${paper.titleZh ? `<p style="color: #666; margin: 0 0 10px 0; font-size: 14px;"><strong>中文:</strong> ${paper.titleZh}</p>` : ''}

      ${journalLine}
      <p style="margin: 5px 0; font-size: 14px;"><strong>作者:</strong> ${authorsStr}</p>
      ${affiliationsStr ? `<p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>单位:</strong> ${affiliationsStr}</p>` : ''}
      <p style="margin: 5px 0; font-size: 12px; color: #888;"><strong>PMID:</strong> ${paper.pmid} | <strong>DOI:</strong> ${paper.doi || '无'}</p>

      ${paper.abstract ? `
      <div style="margin: 15px 0; padding: 10px; background: #fff; border-left: 3px solid #1565c0;">
        <p style="margin: 0; font-size: 13px; color: #333;"><strong>摘要:</strong></p>
        <p style="margin: 5px 0; font-size: 13px; color: #444; line-height: 1.6;">${paper.abstract}</p>
      </div>
      ` : ''}

      ${paper.abstractZh ? `
      <div style="margin: 15px 0; padding: 10px; background: #fff; border-left: 3px solid #4caf50;">
        <p style="margin: 0; font-size: 13px; color: #333;"><strong>摘要 (中文翻译):</strong></p>
        <p style="margin: 5px 0; font-size: 13px; color: #444; line-height: 1.6;">${paper.abstractZh}</p>
      </div>
      ` : ''}

      ${keywordsStr ? `<p style="margin: 10px 0 0 0; font-size: 12px; color: #888;"><strong>关键词:</strong> ${keywordsStr}</p>` : ''}

      <p style="margin: 10px 0 0 0; font-size: 12px;">
        <a href="${paper.url}" style="color: #1565c0;">查看原文 →</a>
      </p>
    </div>
    `;
}

/**
 * ============ 简洁版模板（compact）============
 */
function generatePaperCardCompact(paper, index) {
  const journalBadge = paper.journalInfo ? formatJournalBadge(paper.journalInfo) : '';

  return `
    <div style="border-left: 3px solid #1565c0; padding: 12px 15px; margin-bottom: 15px; background: #fafafa; border-radius: 0 6px 6px 0;">
      <h4 style="margin: 0 0 6px 0; font-size: 15px;">
        <a href="${paper.url}" style="color: #1565c0; text-decoration: none;">${index + 1}. ${paper.titleZh || paper.title}</a>
      </h4>
      ${paper.titleZh && paper.titleZh !== paper.title ? `<p style="margin: 0 0 6px 0; font-size: 12px; color: #999;">${paper.title}</p>` : ''}
      <div style="margin: 4px 0;">
        ${paper.journal ? `<span style="font-size: 12px; color: #555;">${paper.journal}</span>` : ''}
        ${journalBadge}
      </div>
      ${paper.abstractZh ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #444; line-height: 1.5;">${paper.abstractZh.length > 300 ? paper.abstractZh.slice(0, 300) + '...' : paper.abstractZh}</p>` : ''}
      <p style="margin: 6px 0 0 0; font-size: 11px;">
        <a href="${paper.url}" style="color: #1565c0;">查看原文 →</a>
        ${paper.pmid ? `<span style="color: #aaa; margin-left: 10px;">PMID: ${paper.pmid}</span>` : ''}
      </p>
    </div>
    `;
}

/**
 * 生成邮件 HTML（根据模板风格）
 */
export function generateEmailHtml(papers, date, moduleName = '论文', isFallback = false, fallbackYear = null, templateStyle = 'full') {
  const dateStr = date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // 根据是否回退模式生成不同的摘要
  let summaryText = '';
  if (isFallback && fallbackYear) {
    summaryText = `<p style="margin: 0;"><strong>📚 追溯推送: ${papers.length} 篇精选论文</strong></p>
    <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">近 7 天无新论文，已从 ${fallbackYear} 年以来的文献中精选 ${papers.length} 篇高质量论文</p>`;
  } else {
    summaryText = `<p style="margin: 0;"><strong>今日新增论文: ${papers.length} 篇</strong></p>
    <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">共 ${papers.length} 篇论文</p>`;
  }

  // 根据模板风格选择卡片生成函数
  const generateCard = templateStyle === 'compact' ? generatePaperCardCompact : generatePaperCardFull;
  const papersHtml = papers.map((paper, index) => generateCard(paper, index)).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #1565c0; border-bottom: 2px solid #1565c0; padding-bottom: 10px; }
    .summary { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <h1>📊 ${moduleName}论文日报</h1>
  <p style="color: #666;">${dateStr}</p>

  <div class="summary">
    ${summaryText}
  </div>

  ${papersHtml}

  <div class="footer">
    <p>本邮件由 Papfast 自动生成</p>
    <p>如需调整订阅关键词或频率，请联系管理员</p>
  </div>
</body>
</html>
  `;
}
