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

const PORT = 3456;
const HOST = '127.0.0.1';

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
  .container {
    max-width: 820px;
    margin: 0 auto;
  }
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
  .header p {
    color: #aaa;
    margin-top: 8px;
    font-size: 14px;
  }
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
  }
  .card-title .icon { font-size: 20px; }
  .form-group {
    margin-bottom: 16px;
  }
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
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
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.2s;
  }
  .btn-primary {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
  }
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(102,126,234,0.4);
  }
  .btn-success {
    background: linear-gradient(135deg, #11998e, #38ef7d);
    color: #fff;
    margin-top: 10px;
  }
  .btn-success:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(17,153,142,0.4);
  }
  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
  }
  .badge-info { background: rgba(102,126,234,0.2); color: #667eea; }
  .badge-warn { background: rgba(255,183,77,0.15); color: #ffb74d; }
  .module-card {
    background: rgba(0,0,0,0.2);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid rgba(255,255,255,0.06);
  }
  .module-card .form-row { grid-template-columns: 1fr 1fr 80px; }
  .module-card .remove-btn {
    background: rgba(255,82,82,0.15);
    color: #ff5252;
    border: 1px solid rgba(255,82,82,0.3);
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 12px;
    margin-top: 22px;
    width: 100%;
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
    .form-row { grid-template-columns: 1fr; }
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
      <p style="font-size:13px;color:#888;margin-bottom:14px">每个模块定义一组关键词和收件人，可添加多个。</p>
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
// ======== 默认模块模板 ========
const defaultModule = {
  name: '',
  keywords: [''],
  recipients: [''],
  maxResults: 15,
  daysBack: 7,
  fallbackFromYear: 2020,
  enabled: true
};

let moduleCount = 0;

function addModule(data) {
  const m = data || { ...defaultModule, name: \`模块 \${++moduleCount}\` };
  const container = document.getElementById('modulesContainer');
  const div = document.createElement('div');
  div.className = 'module-card';
  div.dataset.index = container.children.length;
  div.innerHTML = \`
    <div class="form-row" style="grid-template-columns:1fr 1fr 80px">
      <div class="form-group">
        <label>模块名称</label>
        <input type="text" class="mod-name" placeholder="示例模块 A" value="\${m.name || ''}">
      </div>
      <div class="form-group">
        <label>收件人邮箱</label>
        <input type="email" class="mod-recipients" placeholder="user@example.com" value="\${(m.recipients && m.recipients[0]) || ''}">
      </div>
      <button type="button" class="remove-btn" onclick="this.closest('.module-card').remove()">✕ 删除</button>
    </div>
    <div class="form-group">
      <label>PubMed 检索关键词 <span class="hint">(支持 AND/OR, 可用 [Title]/[Journal] 等字段)</span></label>
      <textarea class="mod-keywords" rows="3" placeholder='("alveolar macrophag*"[Title]) AND ("Nature"[Journal] OR ...)'>\${(m.keywords && m.keywords[0]) || ''}</textarea>
    </div>
    <div class="form-row" style="grid-template-columns:1fr 1fr 1fr 1fr">
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
}

// 初始载入 1 个模块
addModule();

// ======== 表单提交 ========
document.getElementById('configForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  // 收集模块数据
  const moduleCards = document.querySelectorAll('.module-card');
  const modules = [];
  moduleCards.forEach(card => {
    modules.push({
      name: card.querySelector('.mod-name').value.trim(),
      keywords: [card.querySelector('.mod-keywords').value.trim()],
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
      baseUrl: document.getElementById('llmBaseUrl').value.trim().replace(/\/+$/, '') + '/',
      apiKey: document.getElementById('llmApiKey').value,
      model: document.getElementById('llmModel').value.trim()
    },
    easyScholarKey: document.getElementById('easyScholarKey').value.trim(),
    modules: modules
  };

  // 发送到服务器保存
  try {
    const resp = await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const result = await resp.json();
    const status = document.getElementById('status');
    if (result.success) {
      status.className = 'success';
      status.innerHTML = '✅ 配置已保存！现在可以关闭此页面，运行 <code>node src/index.js</code> 启动推送。';
    } else {
      status.className = 'error';
      status.textContent = '❌ 保存失败: ' + (result.error || '未知错误');
    }
  } catch (err) {
    const status = document.getElementById('status');
    status.className = 'error';
    status.textContent = '❌ 网络错误: ' + err.message;
  }
});

// ======== 服务商切换 ========
document.getElementById('llmProvider').addEventListener('change', function() {
  const presets = {
    zhipu: { url: 'https://open.bigmodel.cn/api/paas/v4/', model: 'glm-4-flash' },
    deepseek: { url: 'https://api.deepseek.com', model: 'deepseek-chat' },
    openai: { url: 'https://api.openai.com/v1/', model: 'gpt-4o-mini' },
    custom: { url: '', model: '' }
  };
  const p = presets[this.value];
  if (p) {
    document.getElementById('llmBaseUrl').value = p.url;
    if (p.model) document.getElementById('llmModel').value = p.model;
  }
});
</script>
</body>
</html>`;

// ======================== HTTP 服务器 ========================

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, `http://${HOST}:${PORT}`);
  const pathname = parsed.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET / → HTML 配置页面
  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML_PAGE);
    return;
  }

  // GET /config → 返回当前配置（供页面预填充）
  if (req.method === 'GET' && pathname === '/config') {
    try {
      const raw = fs.readFileSync(localConfigPath, 'utf-8');
      const config = JSON.parse(raw);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, config }));
    } catch {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, config: null }));
    }
    return;
  }

  // POST /save → 保存配置
  if (req.method === 'POST' && pathname === '/save') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const config = JSON.parse(body);

        // 验证必填字段
        const errors = [];
        if (!config.email?.smtp?.user) errors.push('邮箱地址不能为空');
        if (!config.email?.smtp?.pass) errors.push('SMTP 授权码不能为空');
        if (config.llm?.enabled && !config.llm?.apiKey) errors.push('LLM API Key 不能为空（或关闭翻译）');
        if (!config.modules?.length) errors.push('至少需要一个推送模块');
        if (config.modules?.some(m => !m.name || !m.recipients?.[0] || !m.keywords?.[0])) {
          errors.push('每个模块的名称、收件人、关键词不能为空');
        }

        if (errors.length) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: errors.join('；') }));
          return;
        }

        // 确保 config 目录存在
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }

        // 漂亮写入
        fs.writeFileSync(localConfigPath, JSON.stringify(config, null, 4), 'utf-8');
        console.log(`[${new Date().toLocaleTimeString()}] ✅ 配置已保存`);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║        🔬 Papfast 配置向导已启动             ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  ➜  打开浏览器访问:                         ║`);
  console.log(`║       ${url}                  ║`);
  console.log('║                                            ║');
  console.log('║  填写你的 API 密钥和邮箱信息                ║');
  console.log('║  配置仅保存在 config.local.json             ║');
  console.log('║  按 Ctrl+C 停止服务器                       ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});
