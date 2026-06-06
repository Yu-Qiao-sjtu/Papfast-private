/**
 * 公众号风格 HTML 格式化工具
 * 将 Markdown 分析结果转换为微信公众号风格
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
 * 将 Markdown 转换为公众号风格 HTML
 */
