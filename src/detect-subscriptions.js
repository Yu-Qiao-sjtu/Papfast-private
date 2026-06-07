#!/usr/bin/env node
import config from './config.js';

function looksLikeTemplateModule(module = {}) {
  const text = `${module.name || ''} ${(module.keywords || []).join(' ')}`.toLowerCase();
  const markers = [
    '示例',
    'example',
    'your pubmed search string here',
    'another pubmed search string'
  ];

  return markers.some(marker => text.includes(marker));
}

const modules = config.modules || [];
const enabledModules = modules.filter(m => m.enabled !== false);
const customModules = enabledModules.filter(m => !looksLikeTemplateModule(m));

console.log('=== 订阅检测结果 ===');
console.log(`模块总数: ${modules.length}`);
console.log(`启用模块: ${enabledModules.length}`);
console.log(`自定义启用模块: ${customModules.length}`);

if (customModules.length === 0) {
  console.log('当前未检测到用户自定义订阅（很可能仍是示例配置）。');
} else {
  console.log('检测到以下自定义订阅模块:');
  customModules.forEach((m, idx) => {
    console.log(`${idx + 1}. ${m.name}`);
    console.log(`   关键词: ${(m.keywords || []).join(' | ')}`);
    console.log(`   收件人: ${(m.recipients || []).join(', ') || '未设置'}`);
  });
}
