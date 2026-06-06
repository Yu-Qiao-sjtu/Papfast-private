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

### 1️⃣ 下载项目

```bash
git clone https://github.com/Yu-Qiao-sjtu/Papfast-private.git
cd Papfast-private
```

### 2️⃣ 双击 `setup.bat` — 一键配置 ✅

全自动完成（**无需任何命令行操作**）：

```
✔ 检测 Node.js 环境
✔ 自动安装依赖
✔ 浏览器自动打开配置页面
✔ 填写你的密钥 → 点击保存
```

在浏览器中填写你的凭据：

| 配置项 | 说明 |
|-------|------|
| 📧 **邮箱配置** | 你的邮箱 + SMTP 授权码 |
| 🤖 **翻译 API** | 智谱 / DeepSeek / OpenAI 的 API Key |
| 📊 **EasyScholar** | 期刊等级查询密钥（可选） |

点击 **「💾 保存配置」**，配置自动写入本地文件，**不会上传到网络**。

### 3️⃣ 双击 `start.bat` — 一键运行 🚀

立即开始检索最新论文 → 翻译 → 查期刊等级 → 推送邮件。

> 💡 **之后每天只需双击 `start.bat` 即可**，配置只需一次。

---

### 命令行方式（可选）

如果你习惯用命令行：

```bash
npm install          # 安装依赖
npm run setup        # 启动配置向导（浏览器自动打开）
npm start            # 开始推送
```

## ⚙️ GitHub Actions 部署（可选）

如果你想定时自动运行，无需本地开机：

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
├── setup.bat                    # 一键安装 + 配置向导 ← 双击
├── start.bat                    # 一键运行 ← 双击
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

## 📝 安全说明

所有敏感信息（邮箱密码、API Key）只保存在本地的 `config.local.json` 中，该文件已加入 `.gitignore`，**不会上传到 GitHub**。你可以放心公开此仓库。

## 📄 开源协议

MIT
