# Papfast 📄✨

自动从 PubMed 检索顶刊文献，翻译并邮件推送。

## 🙏 致谢

本项目由 [WispTerm](https://github.com/xuzhougeng/wispterm) AI Agent 辅助开发完成。

## ✨ 功能

- 🔍 **PubMed 自动检索** — 按关键词/期刊每日搜索最新论文
- 🌐 **自动翻译** — 标题 + 摘要翻译为中文（支持智谱/DeepSeek/OpenAI）
- 📊 **期刊等级** — 查询影响因子、中科院分区、JCR 分区（EasyScholar）
- 📧 **邮件推送** — 格式化推送至指定邮箱
- 🔁 **自动去重** — 已推送论文不会重复发送
- 🤖 **GitHub Actions** — 云端定时运行，无需本地服务器

## 🚀 快速开始

### 1️⃣ 一键配置（Windows 推荐 ✅）

**双击 `setup.bat`** — 全自动完成：

```bash
✔ 检测 Node.js（未安装则自动下载）
✔ 安装依赖
✔ 自动打开浏览器配置页面
```

浏览器中填写你的凭据，点击 **"保存配置"** 即可。

### 2️⃣ 一键运行

**双击 `start.bat`** — 立即检索论文并推送邮件。

### 3️⃣ 命令行方式

```bash
git clone https://github.com/Yu-Qiao-sjtu/Papfast-private.git
cd Papfast-private
npm install          # 安装依赖
npm run setup        # 启动配置向导（浏览器自动打开）
npm start            # 开始推送
```

### 手动配置

也可以直接复制示例文件后编辑：

```bash
copy config\config.local.json.example config\config.local.json
# 编辑填入你的 API Key 和邮箱配置
```

## ⚙️ GitHub Actions 部署

1. Fork 此仓库
2. 在 Settings → Secrets and variables → Actions 中添加：

| Secret | 说明 |
|--------|------|
| `SMTP_HOST` | SMTP 服务器地址（如 smtp.163.com） |
| `SMTP_PORT` | 端口（如 465） |
| `SMTP_USER` | 邮箱地址 |
| `SMTP_PASS` | SMTP 授权码 |
| `LLM_API_KEY` | LLM API Key |
| `EASYSCHOLAR_KEY` | EasyScholar 密钥（可选） |

3. 编辑 `config/config.json` 中的模块关键词和收件人
4. Actions 会自动按计划运行

## 🧩 项目结构

```
Papfast-private/
├── setup.bat                    # 一键安装 + 配置向导 ← 用户双击这个
├── start.bat                    # 一键运行 ← 双击启动推送
├── config/
│   ├── config.json              # 默认配置（占位符，安全可上传）
│   └── config.local.json        # 你的真实配置（已 gitignore，不会上传）
├── src/
│   ├── index.js                 # 主程序入口
│   ├── fetch.js                 # PubMed 检索
│   ├── translate.js             # 翻译模块
│   ├── email.js                 # 邮件发送
│   ├── journal-rank.js          # 期刊等级查询
│   ├── report.js                # 报告导出
│   └── wechat-style.js          # 格式化样式
├── setup-server.cjs             # 网页配置向导
├── config_base.py               # Python 版配置（用于旧版）
├── config_lung_am.py            # Python 版模块配置
└── pubmed_fetcher.py            # Python 版主程序
```

## 📝 配置说明

所有敏感信息（邮箱密码、API Key）只保存在本地的 `config.local.json` 中，该文件已加入 `.gitignore`，**不会上传到 GitHub**。

## 📄 开源协议

MIT
