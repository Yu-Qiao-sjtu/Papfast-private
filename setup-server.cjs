/**
 * Papfast 配置向导 — 本地 Web 配置工具
 * =========================================
 * 使用方法: node setup-server.js
 * 然后在浏览器中打开 http://localhost:3456
 *
 * 安全设计:
 * - 仅监听本地 127.0.0.1，不暴露到网络
 * - 配置写入 config/config.local.json（已在 .gitignore 中）
 * - 不会读取或上传任何数据
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { exec } = require('child_process');

const PORT = 3456;
const HOST = '127.0.0.1';
const openUrl = `http://${HOST}:${PORT}`;

// 文件路径
const configDir = path.join(__dirname, 'config');
const localConfigPath = path.join(configDir, 'config.local.json');
const configTemplatePath = path.join(configDir, 'config.json');

// ======================== HTML 页面 ========================

const HTML_PAGE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Papfast 配置向导</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    min-height: 100vh;
    color: #e0e0e0;
    padding: 20px;
  }
  .container { max-width: 880px; margin: 0 auto; }
  .header {
    text-align: center;
    padding: 30px 0 20px;
  }
  .header h1 {
    font-size: 28px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .header p { color: #aaa; margin-top: 8px; font-size: 14px; }
  .card {
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 28px 32px;
    margin-bottom: 20px;
    transition: border-color 0.2s;
  }
  .card:hover { border-color: rgba(255,255,255,0.2); }
  .card-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .card-title .icon { font-size: 20px; }
  .form-group { margin-bottom: 16px; }
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .form-row-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
  }
  .form-row-4 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 16px;
  }
  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #ccc;
    margin-bottom: 5px;
  }
  label .hint {
    font-weight: 400;
    color: #888;
    font-size: 12px;
  }
  input, textarea, select {
    width: 100%;
    padding: 10px 14px;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    color: #fff;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
  }
  input:focus, textarea:focus, select:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102,126,234,0.2);
  }
  input::placeholder, textarea::placeholder { color: #555; }
  textarea { resize: vertical; min-height: 60px; font-family: 'Consolas','Courier New',monospace; font-size: 13px; }
  select { cursor: pointer; }
  select option { background: #1a1a2e; color: #e0e0e0; }
  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 4px;
  }
  .checkbox-group input[type="checkbox"] {
    width: auto;
    accent-color: #667eea;
  }
  .btn {
    padding: 14px;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.2s;
  }
  .btn-primary {
    width: 100%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
  }
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(102,126,234,0.4);
  }
  .btn-success {
    width: 100%;
    background: linear-gradient(135deg, #11998e, #38ef7d);
    color: #fff;
    margin-top: 10px;
  }
  .btn-success:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(17,153,142,0.4);
  }
  .btn-sm {
    padding: 6px 14px;
    font-size: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.06);
    color: #aaa;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-sm:hover { background: rgba(255,255,255,0.12); color: #fff; }
  .btn-danger-sm {
    padding: 6px 14px;
    font-size: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,82,82,0.3);
    background: rgba(255,82,82,0.12);
    color: #ff5252;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-danger-sm:hover { background: rgba(255,82,82,0.25); }
  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
  }
  .badge-info { background: rgba(102,126,234,0.2); color: #667eea; }
  .badge-warn { background: rgba(255,183,77,0.15); color: #ffb74d; }
  .badge-success { background: rgba(17,153,142,0.15); color: #38ef7d; }

  /* 模块卡片 */
  .module-card {
    background: rgba(0,0,0,0.2);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 14px;
    border: 1px solid rgba(255,255,255,0.06);
  }
  .module-card .remove-btn {
    background: rgba(255,82,82,0.15);
    color: #ff5252;
    border: 1px solid rgba(255,82,82,0.3);
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.2s;
  }
  .module-card .remove-btn:hover { background: rgba(255,82,82,0.3); }
  .add-btn {
    background: rgba(255,255,255,0.06);
    border: 1px dashed rgba(255,255,255,0.2);
    border-radius: 10px;
    padding: 10px;
    color: #aaa;
    cursor: pointer;
    width: 100%;
    font-size: 13px;
    transition: all 0.2s;
  }
  .add-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

  /* 检索策略构建器 */
  .strategy-builder {
    background: rgba(0,0,0,0.15);
    border-radius: 10px;
    padding: 14px;
    margin-top: 10px;
    border: 1px solid rgba(255,255,255,0.04);
  }
  .strategy-builder .section-label {
    font-size: 12px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 10px;
  }
  .keyword-group {
    background: rgba(255,255,255,0.03);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 10px;
    border: 1px solid rgba(255,255,255,0.06);
  }
  .keyword-row {
    display: grid;
    grid-template-columns: 1fr 140px 48px 36px;
    gap: 8px;
    margin-bottom: 6px;
    align-items: center;
  }
  .keyword-row .kw-term input { font-size: 13px; padding: 7px 10px; }
  .keyword-row .kw-field select { font-size: 12px; padding: 7px 8px; }
  .group-operator-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 8px 0;
    font-size: 12px;
    color: #888;
  }
  .group-operator-bar .op-badge {
    padding: 2px 12px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
  }
  .op-badge-and { background: rgba(102,126,234,0.2); color: #667eea; }
  .op-badge-or { background: rgba(56,239,125,0.15); color: #38ef7d; }
  .query-preview {
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 10px 14px;
    font-family: 'Consolas','Courier New',monospace;
    font-size: 12px;
    color: #88ccff;
    margin-top: 10px;
    max-height: 120px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }
  .query-preview .placeholder {
    color: #555;
    font-style: italic;
  }

  /* 高级过滤 */
  .filters-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 10px;
  }
  .filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
  }
  .filter-chip.selected {
    background: rgba(102,126,234,0.2);
    border-color: #667eea;
    color: #667eea;
  }
  .filter-chip:hover { border-color: rgba(255,255,255,0.25); }

  /* 快捷预设 */
  .preset-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  .preset-btn {
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: #aaa;
    cursor: pointer;
    transition: all 0.2s;
  }
  .preset-btn:hover {
    background: rgba(102,126,234,0.15);
    border-color: #667eea;
    color: #667eea;
  }

  .toggle-strategy-mode {
    font-size: 12px;
    color: #667eea;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
    opacity: 0.6;
    transition: opacity 0.2s;
  }
  .toggle-strategy-mode:hover { opacity: 1; }

  #status {
    text-align: center;
    margin-top: 12px;
    padding: 12px;
    border-radius: 10px;
    font-size: 14px;
    display: none;
  }
  #status.success { display: block; background: rgba(17,153,142,0.15); color: #38ef7d; border: 1px solid rgba(17,153,142,0.3); }
  #status.error { display: block; background: rgba(255,82,82,0.15); color: #ff5252; border: 1px solid rgba(255,82,82,0.3); }
  .footer {
    text-align: center;
    padding: 20px 0 10px;
    color: #555;
    font-size: 12px;
  }
  @media (max-width: 640px) {
    .form-row, .form-row-3, .form-row-4 { grid-template-columns: 1fr; }
    .keyword-row { grid-template-columns: 1fr 100px 40px 32px; }
    .filters-grid { grid-template-columns: 1fr; }
    .card { padding: 20px 16px; }
  }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🔬 Papfast 配置向导</h1>
    <p>填写你的 API 密钥和邮箱信息，所有数据仅保存在本地</p>
  </div>

  <form id="configForm">
    <!-- ====== 基本设置 ====== -->
    <div class="card">
      <div class="card-title"><span class="icon">📧</span> 邮箱配置 <span class="badge badge-info">必需</span></div>
      <div class="form-row">
        <div class="form-group">
          <label>SMTP 服务器 <span class="hint">(例: smtp.163.com)</span></label>
          <input type="text" name="smtpHost" id="smtpHost" placeholder="smtp.163.com" value="smtp.163.com">
        </div>
        <div class="form-group">
          <label>SMTP 端口</label>
          <input type="number" name="smtpPort" id="smtpPort" value="465">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>邮箱地址 <span class="hint">(发件人)</span></label>
          <input type="email" name="smtpUser" id="smtpUser" placeholder="yourname@163.com">
        </div>
        <div class="form-group">
          <label>SMTP 授权码 <span class="hint">(密码)</span></label>
          <input type="password" name="smtpPass" id="smtpPass" placeholder="开启 SMTP 后获取的授权码">
        </div>
      </div>
      <div class="checkbox-group">
        <input type="checkbox" name="smtpSecure" id="smtpSecure" checked>
        <label for="smtpSecure" style="margin:0;cursor:pointer">启用 SSL（465 端口默认开启）</label>
      </div>
      <button type="button" class="btn-sm" style="margin-top:12px" onclick="testSmtp()">🔌 测试 SMTP 连接</button>
      <div id="smtpTestResult" style="margin-top:8px;font-size:12px;display:none"></div>
    </div>

    <!-- ====== LLM 翻译配置 ====== -->
    <div class="card">
      <div class="card-title"><span class="icon">🤖</span> 翻译服务（LLM）<span class="badge badge-info">必需</span></div>
      <div class="form-row">
        <div class="form-group">
          <label>服务商</label>
          <select name="llmProvider" id="llmProvider">
            <option value="zhipu">智谱 GLM (bigmodel.cn)</option>
            <option value="deepseek">DeepSeek</option>
            <option value="openai">OpenAI</option>
            <option value="custom">自定义 (兼容 OpenAI API)</option>
          </select>
        </div>
        <div class="form-group">
          <label>模型名称</label>
          <input type="text" name="llmModel" id="llmModel" placeholder="glm-4-flash" value="glm-4-flash">
        </div>
      </div>
      <div class="form-group">
        <label>API 地址 <span class="hint">(基础 URL)</span></label>
        <input type="url" name="llmBaseUrl" id="llmBaseUrl" placeholder="https://open.bigmodel.cn/api/paas/v4/" value="https://open.bigmodel.cn/api/paas/v4/">
      </div>
      <div class="form-group">
        <label>API Key <span class="hint">(你的密钥)</span></label>
        <input type="password" name="llmApiKey" id="llmApiKey" placeholder="sk- 或类似格式的 API Key">
      </div>
      <div class="checkbox-group">
        <input type="checkbox" name="llmEnabled" id="llmEnabled" checked>
        <label for="llmEnabled" style="margin:0;cursor:pointer">启用翻译（关闭则跳过摘要翻译）</label>
      </div>
      <button type="button" class="btn-sm" style="margin-top:12px" onclick="testLlm()">🤖 测试 LLM 连接</button>
      <div id="llmTestResult" style="margin-top:8px;font-size:12px;display:none"></div>
    </div>

    <!-- ====== 期刊等级查询 ====== -->
    <div class="card">
      <div class="card-title"><span class="icon">📊</span> 期刊影响因子查询 <span class="badge badge-warn">可选</span></div>
      <div class="form-group">
        <label>easyScholar 密钥 <span class="hint">(不填则不显示影响因子/分区)</span></label>
        <input type="text" name="easyScholarKey" id="easyScholarKey" placeholder="easyscholar.cc 获取的 SecretKey">
      </div>
    </div>

    <!-- ====== 推送模块 ====== -->
    <div class="card">
      <div class="card-title"><span class="icon">📦</span> 推送模块 <span class="badge badge-info">必需</span></div>
      <p style="font-size:13px;color:#888;margin-bottom:14px">每个模块定义一组检索策略和收件人，可添加多个。</p>
      <div id="modulesContainer">
        <!-- 由 JS 动态渲染 -->
      </div>
      <button type="button" class="add-btn" onclick="addModule()">＋ 添加模块</button>
    </div>

    <!-- ====== 提交 ====== -->
    <button type="submit" class="btn btn-primary">💾 保存配置</button>
    <div id="status"></div>
  </form>
  <div class="footer">
    Papfast · 配置仅保存在 <code>config/config.local.json</code> · 不会上传到任何服务器
  </div>
</div>

<script>
// ============================================================
//  PubMed 检索策略构建器
// ============================================================

// ============================================================
//  PubMed 全部字段标签
// ============================================================

const FIELD_LABELS = {
  'Title': '标题 [Title]',
  'Title/Abstract': '标题/摘要 [Title/Abstract]',
  'Abstract': '摘要 [Abstract]',
  'MeSH': 'MeSH 主题词 [MeSH Terms]',
  'MeSH Major': '主要 MeSH [MeSH Major Topic]',
  'MeSH:noexp': 'MeSH 不扩展 [MeSH:noexp]',
  'Text Word': '全文文本词 [Text Word]',
  'Journal': '期刊 [Journal]',
  'Author': '作者 [Author]',
  'Affiliation': '机构 [Affiliation]',
  'Substance Name': '物质名称 [Substance Name]',
  'Supplementary Concept': '补充概念 [Supplementary Concept]',
  'Grant Number': '基金号 [Grant Number]',
  'Publication Type': '出版类型 [Publication Type]',
  'EC/RN Number': '酶代码/登记号 [EC/RN Number]',
  'Pharmacological Action': '药理作用 [Pharmacological Action]',
  'Investigator': '调查者 [Investigator]',
  'Publisher': '出版商 [Publisher]',
  'ISBN': 'ISBN [ISBN]',
  'Location ID': '位置 ID [Location ID]',
  'Secondary Source ID': '二次来源 ID [Secondary Source ID]',
  'All Fields': '所有字段 [All Fields]'
};

const FIELD_MAP = {
  'Title': '[Title]',
  'Title/Abstract': '[Title/Abstract]',
  'Abstract': '[Abstract]',
  'MeSH': '[MeSH Terms]',
  'MeSH Major': '[MeSH Major Topic]',
  'MeSH:noexp': '[MeSH:noexp]',
  'Text Word': '[Text Word]',
  'Journal': '[Journal]',
  'Author': '[Author]',
  'Affiliation': '[Affiliation]',
  'Substance Name': '[Substance Name]',
  'Supplementary Concept': '[Supplementary Concept]',
  'Grant Number': '[Grant Number]',
  'Publication Type': '[Publication Type]',
  'EC/RN Number': '[EC/RN Number]',
  'Pharmacological Action': '[Pharmacological Action]',
  'Investigator': '[Investigator]',
  'Publisher': '[Publisher]',
  'ISBN': '[ISBN]',
  'Location ID': '[Location ID]',
  'Secondary Source ID': '[Secondary Source ID]',
  'All Fields': ''
};

// ============================================================
//  所有 PubMed 过滤条件
// ============================================================

const ARTICLE_TYPES = [
  { id: 'review', label: '📋 Review' },
  { id: 'clinical-trial', label: '🔬 Clinical Trial' },
  { id: 'meta-analysis', label: '📊 Meta-Analysis' },
  { id: 'randomized', label: '🎲 RCT' },
  { id: 'systematic-review', label: '📚 Systematic Review' },
  { id: 'observational-study', label: '👁 Observational Study' },
  { id: 'case-reports', label: '📋 Case Reports' },
  { id: 'comparative-study', label: '⚖️ Comparative Study' },
  { id: 'editorial', label: '✏️ Editorial' },
  { id: 'letter', label: '💌 Letter' },
  { id: 'comment', label: '💬 Comment' },
  { id: 'news', label: '📰 News' },
  { id: 'guideline', label: '📋 Guideline' },
  { id: 'consensus', label: '🤝 Consensus' }
];

const SPECIES_FILTERS = [
  { id: 'human', label: '🧑 Human' },
  { id: 'animal', label: '🐾 Animal' }
];

const SEX_FILTERS = [
  { id: 'male', label: '♂ Male' },
  { id: 'female', label: '♀ Female' }
];

const AGE_GROUPS = [
  { id: 'all-infant', label: '👶 All Infant (0-23 months)' },
  { id: 'all-child', label: '🧒 All Child (0-18)' },
  { id: 'all-adult', label: '🧑 All Adult (19+)' },
  { id: 'newborn', label: '👼 Newborn (birth-1 mo)' },
  { id: 'infant', label: '👶 Infant (1-23 mo)' },
  { id: 'preschool', label: '🧒 Preschool (2-5 yr)' },
  { id: 'child', label: '🧒 Child (6-12 yr)' },
  { id: 'adolescent', label: '🧑 Adolescent (13-18)' },
  { id: 'adult', label: '🧑 Adult (19-44)' },
  { id: 'middle-aged', label: '🧑 Middle Aged (45-64)' },
  { id: 'aged', label: '👴 Aged (65+)' },
  { id: '80plus', label: '👴 80 and over' }
];

const TEXT_AVAILABILITY = [
  { id: 'abstract', label: '📄 Abstract available' },
  { id: 'free-full-text', label: '🔓 Free full text' },
  { id: 'full-text', label: '📖 Full text' }
];

const FIELD_OPTIONS = Object.entries(FIELD_LABELS)
  .map(([k, v]) => \`<option value="\${k}">\${v}</option>\`).join('');

/**
 * 将检索策略对象构建为 PubMed 查询字符串
 */
function buildPubMedQuery(strategy) {
  if (!strategy || !strategy.groups || strategy.groups.length === 0) return '';

  const parts = [];

  for (let gi = 0; gi < strategy.groups.length; gi++) {
    const group = strategy.groups[gi];
    if (!group.terms || group.terms.length === 0) continue;

    const groupParts = [];
    for (const term of group.terms) {
      if (!term.term || term.term.trim() === '') continue;
      const fieldSuffix = FIELD_MAP[term.field] || '';
      const termText = term.term.trim();

      // 判断是否需要引号（包含空格或通配符/运算符的需要引号）
      const needsQuote = /[\s\(\)\*\[\]]/.test(termText);
      const quoted = needsQuote ? \`"\${termText}"\` : termText;

      // 如果选择了 proximity 邻近搜索
      if (term.proximity && term.proximity > 0) {
        groupParts.push(\`\${quoted}\${fieldSuffix}:~\${term.proximity}\`);
      } else {
        groupParts.push(quoted + fieldSuffix);
      }
    }

    if (groupParts.length > 0) {
      const groupOperator = (group.groupOperator || 'OR').toUpperCase();
      if (groupParts.length === 1) {
        parts.push(groupParts[0]);
      } else {
        parts.push('(' + groupParts.join(' ' + groupOperator + ' ') + ')');
      }
    }
  }

  if (parts.length === 0) return '';

  const filters = strategy.filters || {};
  let filterParts = [];

  // 1. 文章类型过滤（Publication Type）
  const TYPE_MAP = {
    'review': \`"review"[Publication Type]\`,
    'clinical-trial': \`"Clinical Trial"[Publication Type]\`,
    'meta-analysis': \`"Meta-Analysis"[Publication Type]\`,
    'randomized': \`"Randomized Controlled Trial"[Publication Type]\`,
    'systematic-review': \`"Systematic Review"[Publication Type]\`,
    'observational-study': \`"Observational Study"[Publication Type]\`,
    'case-reports': \`"Case Reports"[Publication Type]\`,
    'comparative-study': \`"Comparative Study"[Publication Type]\`,
    'editorial': \`"Editorial"[Publication Type]\`,
    'letter': \`"Letter"[Publication Type]\`,
    'comment': \`"Comment"[Publication Type]\`,
    'news': \`"News"[Publication Type]\`,
    'guideline': \`"Guideline"[Publication Type]\`,
    'consensus': \`"Consensus Development Conference"[Publication Type]\`
  };
  if (filters.articleTypes && filters.articleTypes.length > 0) {
    for (const at of filters.articleTypes) {
      if (TYPE_MAP[at]) filterParts.push(TYPE_MAP[at]);
    }
  }

  // 2. 语种过滤（多语种）
  if (filters.languages && filters.languages.length > 0) {
    for (const lang of filters.languages) {
      if (lang === 'english') filterParts.push('english[Language]');
      if (lang === 'chinese') filterParts.push('chinese[Language]');
      if (lang === 'french') filterParts.push('french[Language]');
      if (lang === 'german') filterParts.push('german[Language]');
      if (lang === 'japanese') filterParts.push('japanese[Language]');
      if (lang === 'russian') filterParts.push('russian[Language]');
      if (lang === 'spanish') filterParts.push('spanish[Language]');
    }
  }

  // 3. 物种过滤（Human/Animal）
  if (filters.species && filters.species.length > 0) {
    const speciesParts = filters.species.map(s => {
      if (s === 'human') return \`"humans"[MeSH Terms]\`;
      if (s === 'animal') return \`"animals"[MeSH Terms]\`;
      return '';
    }).filter(Boolean);
    if (filters.species.length === 1) {
      filterParts.push(speciesParts[0]);
    } else {
      filterParts.push('(' + speciesParts.join(' OR ') + ')');
    }
  }

  // 4. 性别过滤
  if (filters.sex && filters.sex.length > 0) {
    const sexParts = filters.sex.map(s => {
      if (s === 'male') return \`"male"[MeSH Terms]\`;
      if (s === 'female') return \`"female"[MeSH Terms]\`;
      return '';
    }).filter(Boolean);
    if (sexParts.length > 0) {
      filterParts.push('(' + sexParts.join(' OR ') + ')');
    }
  }

  // 5. 年龄段过滤
  if (filters.ageGroups && filters.ageGroups.length > 0) {
    const AGE_MAP = {
      'all-infant': \`"infant"[MeSH Terms]\`,
      'all-child': \`"child"[MeSH Terms]\`,
      'all-adult': \`"adult"[MeSH Terms]\`,
      'newborn': \`"infant, newborn"[MeSH Terms]\`,
      'infant': \`"infant"[MeSH Terms]\`,
      'preschool': \`"child, preschool"[MeSH Terms]\`,
      'child': \`"child"[MeSH Terms]\`,
      'adolescent': \`"adolescent"[MeSH Terms]\`,
      'adult': \`"adult"[MeSH Terms]\`,
      'middle-aged': \`"middle aged"[MeSH Terms]\`,
      'aged': \`"aged"[MeSH Terms]\`,
      '80plus': \`"aged, 80 and over"[MeSH Terms]\`
    };
    for (const age of filters.ageGroups) {
      if (AGE_MAP[age]) filterParts.push(AGE_MAP[age]);
    }
  }

  // 6. 全文可用性过滤
  if (filters.textAvailability && filters.textAvailability.length > 0) {
    const TXT_MAP = {
      'abstract': 'hasabstract[text]',
      'free-full-text': 'free full text[sb]',
      'full-text': 'hasfulltext[text]'
    };
    for (const ta of filters.textAvailability) {
      if (TXT_MAP[ta]) filterParts.push(TXT_MAP[ta]);
    }
  }

  // 7. 排除关键词
  if (filters.excludeTerms && filters.excludeTerms.trim()) {
    const ex = filters.excludeTerms.trim();
    filterParts.push(\`NOT (\${ex})\`);
  }

    // 9. 日期范围过滤
  if (filters.dateFrom || filters.dateTo) {
    const dFrom = filters.dateFrom || '1800';
    const dTo = filters.dateTo || '2026';
    filterParts.push(\`("\${dFrom}"[Date - Publication] : "\${dTo}"[Date - Publication])\`);
  }

// 8. 自定义附加过滤（高级用户直接输入 PubMed 语法）
  if (filters.customFilter && filters.customFilter.trim()) {
    filterParts.push(filters.customFilter.trim());
  }

  const mainQuery = parts.join(' ' + (strategy.operator || 'AND') + ' ');

  if (filterParts.length > 0) {
    return '(' + mainQuery + ') AND ' + filterParts.join(' AND ');
  }

  return mainQuery;
}
/**
 * 渲染关键词行（单个 term）
 */
function renderKeywordRow(term, groupEl) {
  const row = document.createElement('div');
  row.className = 'keyword-row';
  row.innerHTML = \`
    <div class="kw-term">
      <input type="text" class="kw-input" placeholder="输入关键词" value="\${(term && term.term) || ''}">
    </div>
    <div class="kw-field">
      <select class="kw-field-select">\${FIELD_OPTIONS}</select>
    </div>
    <div>
      <button type="button" class="btn-danger-sm" style="padding:6px 10px;font-size:14px;width:36px;height:36px;display:flex;align-items:center;justify-content:center" onclick="this.closest('.keyword-row').remove();updateQueryPreview(this.closest('.keyword-group'))">✕</button>
    </div>
  \`;
  if (term && term.field) {
    row.querySelector('.kw-field-select').value = term.field;
  }
  // 输入变化时更新预览
  row.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', () => updateQueryPreview(groupEl));
    el.addEventListener('input', () => updateQueryPreview(groupEl));
  });
  return row;
}

/**
 * 渲染一个关键词组
 */
function renderKeywordGroup(group, container) {
  const groupEl = document.createElement('div');
  groupEl.className = 'keyword-group';

  const terms = (group && group.terms) || [{ term: '', field: 'Title/Abstract' }];

  // 组内连接词（OR/AND）
  const groupOperator = (group && group.groupOperator) || 'OR';

  let html = \`
    <div class="group-operator-bar">
      <span>词组内连接：</span>
      <select class="group-operator-select" style="width:auto;display:inline-block;padding:3px 10px;font-size:12px;border-radius:12px;">
        <option value="OR" \${groupOperator === 'OR' ? 'selected' : ''}>OR（任一匹配）</option>
        <option value="AND" \${groupOperator === 'AND' ? 'selected' : ''}>AND（全部匹配）</option>
      </select>
      <span style="flex:1"></span>
      <button type="button" class="btn-danger-sm" style="padding:4px 10px;font-size:11px" onclick="removeKeywordGroup(this)">🗑 删除词组</button>
    </div>
    <div class="keyword-rows-container"></div>
    <button type="button" class="btn-sm" style="margin-top:6px" onclick="addKeywordRow(this)">＋ 添加关键词</button>
  \`;
  groupEl.innerHTML = html;

  const rowsContainer = groupEl.querySelector('.keyword-rows-container');
  for (const term of terms) {
    rowsContainer.appendChild(renderKeywordRow(term, groupEl));
  }

  // 组连接词变化时刷新预览
  groupEl.querySelector('.group-operator-select').addEventListener('change', () => updateQueryPreview(groupEl));

  container.appendChild(groupEl);
  updateQueryPreview(groupEl);
}

/**
 * 更新某个组的 PubMed 查询预览
 */
function updateQueryPreview(groupEl) {
  const root = groupEl.closest('.strategy-builder');
  if (!root) return;
  rebuildFullQuery(root);
}

/**
 * 重建完整查询并更新预览
 */
function rebuildFullQuery(root) {
  const strategy = collectStrategyFromUI(root);
  const query = buildPubMedQuery(strategy);
  const preview = root.querySelector('.query-preview');
  if (preview) {
    if (query) {
      preview.textContent = query;
      preview.classList.remove('placeholder');
    } else {
      preview.innerHTML = '<span class="placeholder">请输入关键词以生成 PubMed 查询语句...</span>';
    }
  }
  // 同步到隐藏的 textarea
  const hiddenInput = root.closest('.module-card')?.querySelector('.mod-keywords');
  if (hiddenInput) {
    hiddenInput.value = query;
  }
}

/**
 * 从 DOM 收集当前检索策略
 */
function collectStrategyFromUI(root) {
  const operatorSelect = root.querySelector(".strategy-operator");
  const strategy = {
    operator: (operatorSelect && operatorSelect.value) || "AND",
    groups: [],
    filters: {
      articleTypes: [],
      languages: [],
      species: [],
      sex: [],
      ageGroups: [],
      textAvailability: [],
      excludeTerms: "",
      customFilter: ""
    }
  };

  // 收集所有过滤条件
  root.querySelectorAll(".filter-chip.selected").forEach(chip => {
    const type = chip.dataset.filterType;
    const val = chip.dataset.filterVal;
    if (type === "articleType") {
      if (!strategy.filters.articleTypes.includes(val)) strategy.filters.articleTypes.push(val);
    }
    if (type === "language") {
      if (!strategy.filters.languages.includes(val)) strategy.filters.languages.push(val);
    }
    if (type === "species") {
      if (!strategy.filters.species.includes(val)) strategy.filters.species.push(val);
    }
    if (type === "sex") {
      if (!strategy.filters.sex.includes(val)) strategy.filters.sex.push(val);
    }
    if (type === "ageGroup") {
      if (!strategy.filters.ageGroups.includes(val)) strategy.filters.ageGroups.push(val);
    }
    if (type === "textAvailability") {
      if (!strategy.filters.textAvailability.includes(val)) strategy.filters.textAvailability.push(val);
    }
  });

  const excludeInput = root.querySelector(".filter-exclude-input");
  if (excludeInput) strategy.filters.excludeTerms = excludeInput.value;

  const customInput = root.querySelector(".filter-custom-input");
  if (customInput) strategy.filters.customFilter = customInput.value;

  // 收集日期范围
  const dateFrom = root.querySelector(".date-from");
  const dateTo = root.querySelector(".date-to");
  if (dateFrom && dateFrom.value) strategy.filters.dateFrom = dateFrom.value;
  if (dateTo && dateTo.value) strategy.filters.dateTo = dateTo.value;

  // 收集词组
  const groups = root.querySelectorAll(".keyword-group");
  groups.forEach((groupEl, gi) => {
    const groupOperator = groupEl.querySelector(".group-operator-select")?.value || "OR";
    const terms = [];
    groupEl.querySelectorAll(".keyword-row").forEach(row => {
      const termInput = row.querySelector(".kw-input");
      const fieldSelect = row.querySelector(".kw-field-select");
      const proxSelect = row.querySelector(".kw-proximity");
      if (termInput && termInput.value.trim()) {
        const termObj = {
          term: termInput.value.trim(),
          field: fieldSelect ? fieldSelect.value : "Title/Abstract"
        };
        if (proxSelect && proxSelect.value && parseInt(proxSelect.value) > 0) {
          termObj.proximity = parseInt(proxSelect.value);
        }
        terms.push(termObj);
      }
    });
    if (terms.length > 0) {
      strategy.groups.push({ groupOperator, terms });
    }
  });

  return strategy;
}

/** 添加关键词行到某个词组 */
function addKeywordRow(btn) {
  const groupEl = btn.closest('.keyword-group');
  const rowsContainer = groupEl.querySelector('.keyword-rows-container');
  rowsContainer.appendChild(renderKeywordRow({ term: '', field: 'Title/Abstract' }, groupEl));
  updateQueryPreview(groupEl);
}

/** 删除整个词组 */
function removeKeywordGroup(btn) {
  const groupEl = btn.closest('.keyword-group');
  const root = groupEl.closest('.strategy-builder');
  groupEl.remove();
  rebuildFullQuery(root);
}

// ============================================================
//  模块管理
// ============================================================

let moduleCount = 0;

/**
 * 添加一个模块卡片到页面
 */
function addModule(data) {
  const m = data || {};
  const container = document.getElementById('modulesContainer');
  const div = document.createElement('div');
  div.className = 'module-card';
  div.dataset.index = container.children.length;
  div.innerHTML = \`
    <div class="form-row" style="grid-template-columns:1fr 1fr 80px">
      <div class="form-group">
        <label>模块名称</label>
        <input type="text" class="mod-name" placeholder="例如：肿瘤免疫" value="\${m.name || '模块 ' + (++moduleCount)}">
      </div>
      <div class="form-group">
        <label>收件人邮箱</label>
        <input type="email" class="mod-recipients" placeholder="user@example.com" value="\${(m.recipients && m.recipients[0]) || ''}">
      </div>
      <button type="button" class="remove-btn" style="margin-top:22px" onclick="this.closest('.module-card').remove()">✕ 删除</button>
    </div>

    <!-- PubMed 检索策略构建器 -->
    <div class="strategy-builder">
      <div class="section-label">🔍 PubMed 检索策略</div>

      <!-- 快捷预设 -->
      <div class="preset-grid">
        <button type="button" class="preset-btn" onclick="applyPreset('tumor-immunology', this)">🦠 肿瘤免疫</button>
        <button type="button" class="preset-btn" onclick="applyPreset('neuro', this)">🧠 神经科学</button>
        <button type="button" class="preset-btn" onclick="applyPreset('cardio', this)">❤️ 心血管</button>
        <button type="button" class="preset-btn" onclick="applyPreset('cell-biology', this)">🔬 细胞生物学</button>
        <button type="button" class="preset-btn" onclick="applyPreset('microbiome', this)">🦠 微生物组</button>
        <button type="button" class="preset-btn" onclick="applyPreset('genetics', this)">🧬 遗传学</button>
      </div>

      <!-- 词组间连接 -->
      <div class="group-operator-bar" style="margin-bottom:10px">
        <span>词组间逻辑：</span>
        <select class="strategy-operator" style="width:auto;display:inline-block;padding:4px 12px;font-size:12px;border-radius:12px;">
          <option value="AND" \${(!m.searchStrategy || m.searchStrategy.operator === 'AND') ? 'selected' : ''}>AND（全部词组都需匹配）</option>
          <option value="OR" \${(m.searchStrategy && m.searchStrategy.operator === 'OR') ? 'selected' : ''}>OR（任一词组匹配即可）</option>
        </select>
      </div>

      <!-- 关键词组容器 -->
      <div class="groups-container"></div>
      <button type="button" class="btn-sm" style="margin-top:6px" onclick="addGroup(this)">＋ 添加词组</button>

            <!-- 全部 PubMed 过滤条件 ▸</summary>

        <!-- 文章类型 -->
        <div style="margin-bottom:10px">
          <label style="font-size:11px;color:#777;margin-bottom:4px;display:block">📖 文章类型</label>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            \${ARTICLE_TYPES.map(at => \`<span class="filter-chip \${(m.searchStrategy && m.searchStrategy.filters && m.searchStrategy.filters.articleTypes && m.searchStrategy.filters.articleTypes.includes(at.id)) ? 'selected' : ''}" data-filter-type="articleType" data-filter-val="\${at.id}" onclick="toggleFilterChip(this)">\${at.label}</span>\`).join('')}
          </div>
        </div>

        <!-- 语种 -->
        <div style="margin-bottom:10px">
          <label style="font-size:11px;color:#777;margin-bottom:4px;display:block">🌍 语种</label>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            <span class="filter-chip \u0024{(m.searchStrategy && m.searchStrategy.filters && m.searchStrategy.filters.languages && m.searchStrategy.filters.languages.includes('english')) ? 'selected' : ''}" data-filter-type="language" data-filter-val="english" onclick="toggleFilterChip(this)">🇬🇧 英文</span>
            <span class="filter-chip \u0024{(m.searchStrategy && m.searchStrategy.filters && m.searchStrategy.filters.languages && m.searchStrategy.filters.languages.includes('chinese')) ? 'selected' : ''}" data-filter-type="language" data-filter-val="chinese" onclick="toggleFilterChip(this)">🇨🇳 中文</span>
            <span class="filter-chip \u0024{(m.searchStrategy && m.searchStrategy.filters && m.searchStrategy.filters.languages && m.searchStrategy.filters.languages.includes('french')) ? 'selected' : ''}" data-filter-type="language" data-filter-val="french" onclick="toggleFilterChip(this)">🇫🇷 法文</span>
            <span class="filter-chip \u0024{(m.searchStrategy && m.searchStrategy.filters && m.searchStrategy.filters.languages && m.searchStrategy.filters.languages.includes('german')) ? 'selected' : ''}" data-filter-type="language" data-filter-val="german" onclick="toggleFilterChip(this)">🇩🇪 德文</span>
            <span class="filter-chip \u0024{(m.searchStrategy && m.searchStrategy.filters && m.searchStrategy.filters.languages && m.searchStrategy.filters.languages.includes('japanese')) ? 'selected' : ''}" data-filter-type="language" data-filter-val="japanese" onclick="toggleFilterChip(this)">🇯🇵 日文</span>
            <span class="filter-chip \u0024{(m.searchStrategy && m.searchStrategy.filters && m.searchStrategy.filters.languages && m.searchStrategy.filters.languages.includes('spanish')) ? 'selected' : ''}" data-filter-type="language" data-filter-val="spanish" onclick="toggleFilterChip(this)">🇪🇸 西班牙文</span>
          </div>
        </div>

        <!-- 物种 -->
        <div style="margin-bottom:10px">
          <label style="font-size:11px;color:#777;margin-bottom:4px;display:block">🐾 物种</label>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            \${SPECIES_FILTERS.map(s => \`<span class="filter-chip \${(m.searchStrategy && m.searchStrategy.filters && m.searchStrategy.filters.species && m.searchStrategy.filters.species.includes(s.id)) ? 'selected' : ''}" data-filter-type="species" data-filter-val="\${s.id}" onclick="toggleFilterChip(this)">\${s.label}</span>\`).join('')}
          </div>
        </div>

        <!-- 性别 -->
        <div style="margin-bottom:10px">
          <label style="font-size:11px;color:#777;margin-bottom:4px;display:block">🦾 性别</label>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            \${SEX_FILTERS.map(s => \`<span class="filter-chip \${(m.searchStrategy && m.searchStrategy.filters && m.searchStrategy.filters.sex && m.searchStrategy.filters.sex.includes(s.id)) ? 'selected' : ''}" data-filter-type="sex" data-filter-val="\${s.id}" onclick="toggleFilterChip(this)">\${s.label}</span>\`).join('')}
          </div>
        </div>

        <!-- 年龄段 -->
        <div style="margin-bottom:10px">
          <label style="font-size:11px;color:#777;margin-bottom:4px;display:block">👶 年龄段</label>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            \${AGE_GROUPS.map(a => \`<span class="filter-chip \${(m.searchStrategy && m.searchStrategy.filters && m.searchStrategy.filters.ageGroups && m.searchStrategy.filters.ageGroups.includes(a.id)) ? 'selected' : ''}" data-filter-type="ageGroup" data-filter-val="\${a.id}" onclick="toggleFilterChip(this)">\${a.label}</span>\`).join('')}
          </div>
        </div>

        <!-- 全文可用性 -->
        <div style="margin-bottom:10px">
          <label style="font-size:11px;color:#777;margin-bottom:4px;display:block">📄 全文可用性</label>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            \${TEXT_AVAILABILITY.map(t => \`<span class="filter-chip \${(m.searchStrategy && m.searchStrategy.filters && m.searchStrategy.filters.textAvailability && m.searchStrategy.filters.textAvailability.includes(t.id)) ? 'selected' : ''}" data-filter-type="textAvailability" data-filter-val="\${t.id}" onclick="toggleFilterChip(this)">\${t.label}</span>\`).join('')}
          </div>
        </div>

        <!-- 日期范围 -->
        <div style="margin-bottom:10px">
          <label style="font-size:11px;color:#777;margin-bottom:4px;display:block">📅 出版日期范围</label>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="date" class="date-from" style="flex:1;font-size:12px;padding:5px 8px" value="\${(m.searchStrategy && m.searchStrategy.filters && m.searchStrategy.filters.dateFrom) || ''}">
            <span style="color:#666;font-size:12px">—</span>
            <input type="date" class="date-to" style="flex:1;font-size:12px;padding:5px 8px" value="\${(m.searchStrategy && m.searchStrategy.filters && m.searchStrategy.filters.dateTo) || ''}">
          </div>
        </div>

        <!-- 排除关键词 -->
        <div class="form-group" style="margin-bottom:8px">
          <label>排除关键词 <span class="hint">(含这些词的论文将被过滤)</span></label>
          <input type="text" class="filter-exclude-input" placeholder="review, case report" style="font-size:13px;padding:7px 10px" value="\${(m.searchStrategy && m.searchStrategy.filters && m.searchStrategy.filters.excludeTerms) || ''}">
        </div>

        <!-- 自定义附加过滤 -->
        <div class="form-group" style="margin-bottom:0">
          <label>🎯 自定义 PubMed 过滤语法 <span class="hint">(高级用户直接输入 PubMed 过滤语句)</span></label>
          <input type="text" class="filter-custom-input" placeholder="例如: systematic[sb] AND 2023[dp]" style="font-size:13px;padding:7px 10px;font-family:monospace" value="\${(m.searchStrategy && m.searchStrategy.filters && m.searchStrategy.filters.customFilter) || ''}">
        </div></div>

      <!-- 查询预览 -->
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06)">
        <div class="section-label">📋 生成的 PubMed 查询</div>
        <div class="query-preview"><span class="placeholder">请输入关键词以生成 PubMed 查询语句...</span></div>
      </div>

      <!-- 隐藏字段，保存最终查询字符串 -->
      <textarea class="mod-keywords" style="display:none"></textarea>
    </div>

    <!-- 模块参数 -->
    <div class="form-row-4" style="margin-top:12px">
      <div class="form-group">
        <label>最大结果数</label>
        <input type="number" class="mod-maxResults" value="\${m.maxResults || 15}">
      </div>
      <div class="form-group">
        <label>回溯天数</label>
        <input type="number" class="mod-daysBack" value="\${m.daysBack || 7}">
      </div>
      <div class="form-group">
        <label>回退年份</label>
        <input type="number" class="mod-fallbackYear" value="\${m.fallbackFromYear || 2020}">
      </div>
      <div class="checkbox-group" style="margin-top:22px">
        <input type="checkbox" class="mod-enabled" \${m.enabled !== false ? 'checked' : ''}>
        <label style="margin:0;cursor:pointer;font-size:12px">启用</label>
      </div>
    </div>
  \`;

  container.appendChild(div);

  // 初始化检索策略
  const sb = div.querySelector('.strategy-builder');
  const groupsContainer = sb.querySelector('.groups-container');

  // 从已有数据恢复，或创建默认词组
  let groups = [];
  if (m.searchStrategy && m.searchStrategy.groups && m.searchStrategy.groups.length > 0) {
    groups = m.searchStrategy.groups;
  } else if (m.keywords && m.keywords[0]) {
    // 已有纯文本关键词 → 尝试解析，如果失败则创建默认词组
    groups = [{ groupOperator: 'OR', terms: [{ term: m.keywords[0], field: 'Title/Abstract' }] }];
  } else {
    groups = [{ groupOperator: 'OR', terms: [{ term: '', field: 'Title/Abstract' }] }];
  }

  for (const g of groups) {
    renderKeywordGroup(g, groupsContainer);
  }

  // 连接词切换事件
  sb.querySelector('.strategy-operator').addEventListener('change', () => rebuildFullQuery(sb));

  // 排除词输入事件
  const excludeInput = sb.querySelector('.filter-exclude-input');
  if (excludeInput) {
    excludeInput.addEventListener('input', () => rebuildFullQuery(sb));
  }
  
  // 日期范围事件
  const dateFrom = sb.querySelector('.date-from');
  const dateTo = sb.querySelector('.date-to');
  if (dateFrom) dateFrom.addEventListener('change', () => rebuildFullQuery(sb));
  if (dateTo) dateTo.addEventListener('change', () => rebuildFullQuery(sb));
  
  // 自定义过滤输入事件
  const customInput = sb.querySelector('.filter-custom-input');
  if (customInput) customInput.addEventListener('input', () => rebuildFullQuery(sb));

  // 初次构建查询预览
  rebuildFullQuery(sb);
}

/** 添加新的词组 */
function addGroup(btn) {
  const root = btn.closest('.strategy-builder');
  const groupsContainer = root.querySelector('.groups-container');
  const group = { groupOperator: 'OR', terms: [{ term: '', field: 'Title/Abstract' }] };
  renderKeywordGroup(group, groupsContainer);
}

/** 切换过滤标签 */
function toggleFilterChip(el) {
  el.classList.toggle('selected');
  const root = el.closest('.strategy-builder');
  rebuildFullQuery(root);
}

/** 应用快捷预设 */
const PRESETS = {
  'tumor-immunology': {
    operator: 'AND',
    groups: [
      { groupOperator: 'OR', terms: [
        { term: 'tumor microenvironment', field: 'Title/Abstract' },
        { term: 'cancer immunology', field: 'Title/Abstract' },
        { term: 'immune checkpoint', field: 'Title/Abstract' }
      ]},
      { groupOperator: 'OR', terms: [
        { term: 'Nature', field: 'Journal' },
        { term: 'Science', field: 'Journal' },
        { term: 'Cell', field: 'Journal' },
        { term: 'Immunity', field: 'Journal' }
      ]}
    ],
    filters: { articleTypes: [], languages: ['english'], excludeTerms: '' }
  },
  'neuro': {
    operator: 'AND',
    groups: [
      { groupOperator: 'OR', terms: [
        { term: 'neurodegeneration', field: 'MeSH' },
        { term: 'synaptic plasticity', field: 'Title/Abstract' },
        { term: 'neuroinflammation', field: 'Title/Abstract' }
      ]}
    ],
    filters: { articleTypes: ['review'], languages: ['english'], excludeTerms: '' }
  },
  'cardio': {
    operator: 'AND',
    groups: [
      { groupOperator: 'OR', terms: [
        { term: 'heart failure', field: 'Title/Abstract' },
        { term: 'cardiac remodeling', field: 'Title/Abstract' },
        { term: 'atherosclerosis', field: 'Title/Abstract' }
      ]}
    ],
    filters: { articleTypes: [], languages: ['english'], excludeTerms: 'case report' }
  },
  'cell-biology': {
    operator: 'AND',
    groups: [
      { groupOperator: 'OR', terms: [
        { term: 'autophagy', field: 'Title/Abstract' },
        { term: 'apoptosis', field: 'Title/Abstract' },
        { term: 'cell signaling', field: 'Title/Abstract' }
      ]}
    ],
    filters: { articleTypes: [], languages: ['english'], excludeTerms: '' }
  },
  'microbiome': {
    operator: 'AND',
    groups: [
      { groupOperator: 'OR', terms: [
        { term: 'gut microbiome', field: 'Title/Abstract' },
        { term: 'intestinal microbiota', field: 'Title/Abstract' }
      ]}
    ],
    filters: { articleTypes: [], languages: ['english'], excludeTerms: '' }
  },
  'genetics': {
    operator: 'AND',
    groups: [
      { groupOperator: 'OR', terms: [
        { term: 'GWAS', field: 'Title/Abstract' },
        { term: 'genome-wide association', field: 'Title/Abstract' },
        { term: 'polygenic risk', field: 'Title/Abstract' }
      ]}
    ],
    filters: { articleTypes: [], languages: ['english'], excludeTerms: '' }
  }
};

function applyPreset(name, btn) {
  const preset = PRESETS[name];
  if (!preset) return;

  const root = btn.closest('.strategy-builder');
  const groupsContainer = root.querySelector('.groups-container');

  // 清空已有词组
  groupsContainer.innerHTML = '';

  // 设置 operator
  const opSelect = root.querySelector('.strategy-operator');
  if (opSelect) opSelect.value = preset.operator;

  // 渲染词组
  for (const group of preset.groups) {
    renderKeywordGroup(group, groupsContainer);
  }

  // 设置过滤条件
  const chips = root.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    const type = chip.dataset.filterType;
    const val = chip.dataset.filterVal;
    if (preset.filters) {
      if (type === 'articleType' && preset.filters.articleTypes.includes(val)) {
        chip.classList.add('selected');
      } else if (type === 'language' && preset.filters.languages && preset.filters.languages.includes(val)) {
        chip.classList.add('selected');
      } else {
        chip.classList.remove('selected');
      }
    }
  });

  const excludeInput = root.querySelector('.filter-exclude-input');
  if (excludeInput && preset.filters) {
    excludeInput.value = preset.filters.excludeTerms || '';
  }

  // 更新预览
  rebuildFullQuery(root);
}

// 初始加载 1 个模块
addModule();

// ============================================================
//  连接测试
// ============================================================

async function testSmtp() {
  const resultEl = document.getElementById('smtpTestResult');
  resultEl.style.display = 'block';
  resultEl.style.color = '#ffb74d';
  resultEl.textContent = '⏳ 正在测试 SMTP 连接...';

  const host = document.getElementById('smtpHost').value.trim();
  const port = parseInt(document.getElementById('smtpPort').value) || 465;
  const user = document.getElementById('smtpUser').value.trim();
  const pass = document.getElementById('smtpPass').value;
  const secure = document.getElementById('smtpSecure').checked;

  if (!host || !user || !pass) {
    resultEl.style.color = '#ff5252';
    resultEl.textContent = '❌ 请先填写 SMTP 服务器、邮箱和授权码';
    return;
  }

  try {
    const res = await fetch('/test-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, port, user, pass, secure })
    });
    const data = await res.json();
    if (data.success) {
      resultEl.style.color = '#38ef7d';
      resultEl.textContent = '✅ SMTP 连接成功！邮件发送正常';
    } else {
      resultEl.style.color = '#ff5252';
      resultEl.textContent = '❌ ' + (data.error || '连接失败');
    }
  } catch (err) {
    resultEl.style.color = '#ff5252';
    resultEl.textContent = '❌ 请求失败: ' + err.message;
  }
}

async function testLlm() {
  const resultEl = document.getElementById('llmTestResult');
  resultEl.style.display = 'block';
  resultEl.style.color = '#ffb74d';
  resultEl.textContent = '⏳ 正在测试 LLM API 连接...';

  const baseUrl = document.getElementById('llmBaseUrl').value.trim();
  const apiKey = document.getElementById('llmApiKey').value;
  const model = document.getElementById('llmModel').value.trim();

  if (!baseUrl || !apiKey) {
    resultEl.style.color = '#ff5252';
    resultEl.textContent = '❌ 请先填写 API 地址和 API Key';
    return;
  }

  try {
    const res = await fetch('/test-llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl, apiKey, model })
    });
    const data = await res.json();
    if (data.success) {
      resultEl.style.color = '#38ef7d';
      resultEl.textContent = '✅ LLM API 连接成功！模型: ' + (data.model || model);
    } else {
      resultEl.style.color = '#ff5252';
      resultEl.textContent = '❌ ' + (data.error || '连接失败');
    }
  } catch (err) {
    resultEl.style.color = '#ff5252';
    resultEl.textContent = '❌ 请求失败: ' + err.message;
  }
}
// ============================================================
//  表单提交
// ============================================================
document.getElementById('configForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const moduleCards = document.querySelectorAll('.module-card');
  const modules = [];
  moduleCards.forEach(card => {
    const sb = card.querySelector('.strategy-builder');
    const strategy = collectStrategyFromUI(sb);
    const queryString = buildPubMedQuery(strategy);

    modules.push({
      name: card.querySelector('.mod-name').value.trim(),
      searchStrategy: strategy,
      keywords: queryString ? [queryString] : [],
      recipients: [card.querySelector('.mod-recipients').value.trim()],
      maxResults: parseInt(card.querySelector('.mod-maxResults').value) || 15,
      daysBack: parseInt(card.querySelector('.mod-daysBack').value) || 7,
      fallbackFromYear: parseInt(card.querySelector('.mod-fallbackYear').value) || 2020,
      enabled: card.querySelector('.mod-enabled').checked
    });
  });

  const config = {
    email: {
      smtp: {
        host: document.getElementById('smtpHost').value.trim(),
        port: parseInt(document.getElementById('smtpPort').value) || 465,
        secure: document.getElementById('smtpSecure').checked,
        user: document.getElementById('smtpUser').value.trim(),
        pass: document.getElementById('smtpPass').value
      },
      from: document.getElementById('smtpUser').value.trim()
    },
    llm: {
      enabled: document.getElementById('llmEnabled').checked,
      provider: document.getElementById('llmProvider').value,
      baseUrl: document.getElementById('llmBaseUrl').value.trim(),
      apiKey: document.getElementById('llmApiKey').value,
      model: document.getElementById('llmModel').value.trim()
    },
    easyScholarKey: document.getElementById('easyScholarKey').value.trim(),
    modules: modules.filter(m => m.name && m.recipients[0])
  };

  // 验证
  if (!config.email.smtp.user || !config.email.smtp.pass) {
    showStatus('请填写邮箱地址和 SMTP 授权码', 'error');
    return;
  }
  if (config.llm.enabled && !config.llm.apiKey) {
    showStatus('翻译已启用，请填写 LLM API Key', 'error');
    return;
  }
  if (config.modules.length === 0) {
    showStatus('请至少添加一个推送模块', 'error');
    return;
  }

  try {
    const res = await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const data = await res.json();
    if (data.success) {
      showStatus('✅ 配置已保存到 config/config.local.json！可以关闭此页面了。', 'success');
    } else {
      showStatus('❌ 保存失败: ' + (data.error || '未知错误'), 'error');
    }
  } catch (err) {
    showStatus('❌ 保存失败: ' + err.message, 'error');
  }
});

function showStatus(msg, type) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = type;
}
</script>
</body>
</html>`;

// ======================== 服务器逻辑 ========================

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${HOST}:${PORT}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (method === 'GET' && (pathname === '/' || pathname === '')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML_PAGE);
    return;
  }

  if (method === 'POST' && pathname === '/save') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const config = JSON.parse(body);
        
        // 确保 config 目录存在
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }

        // 写入 config.local.json（美化输出）
        fs.writeFileSync(localConfigPath, JSON.stringify(config, null, 2), 'utf-8');
        console.log('\n[配置] ✅ 已保存到 config/config.local.json');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('[配置] ❌ 保存失败:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // ======================== 测试 SMTP 连接 ========================
  if (method === 'POST' && pathname === '/test-smtp') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { host, port, user, pass, secure } = JSON.parse(body);
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host, port, secure,
          auth: { user, pass },
          connectionTimeout: 10000,
          greetingTimeout: 10000
        });
        await transporter.verify();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // ======================== 测试 LLM API 连接 ========================
  if (method === 'POST' && pathname === '/test-llm') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { baseUrl, apiKey, model } = JSON.parse(body);
        const url = baseUrl.replace(/\/+$/, '') + '/chat/completions';
        const llmRes = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model || 'glm-4-flash',
            messages: [{ role: 'user', content: '你好，请回复"连接成功"' }],
            max_tokens: 20
          }),
          signal: AbortSignal.timeout(15000)
        });
        if (!llmRes.ok) {
          const errText = await llmRes.text().catch(() => '');
          throw new Error(`API 返回 ${llmRes.status}: ${errText.slice(0, 100)}`);
        }
        const data = await llmRes.json();
        const reply = data.choices?.[0]?.message?.content || '未知响应';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, model: data.model || model, reply }));
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }


  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║        🔬 Papfast 配置向导已启动             ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  ➜  正在自动打开浏览器...                    ║`);
  console.log(`║      http://${HOST}:${PORT}                  ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // 尝试自动打开浏览器
  const startCmd = process.platform === 'win32'
    ? `start http://${HOST}:${PORT}`
    : process.platform === 'darwin'
      ? `open http://${HOST}:${PORT}`
      : `xdg-open http://${HOST}:${PORT}`;

  exec(startCmd, (err) => {
    if (err) {
      console.log(`  浏览器未自动打开，请手动访问:`);
      console.log(`  →  http://${HOST}:${PORT}`);
      console.log('');
    }
  });
});
