# 修改日志 (CHANGELOG)

## 2025-06-03 — Bug 修复：每天推送相同文章

### 问题根因
GitHub Actions 工作流 `.github/workflows/daily.yml` 条件语句
`if: ${{ vars.PAPFAST_PERSIST_STATE == 'true' }}` 导致去重记录 `sent-papers.json`
无法提交回仓库，每次运行都只有示例记录，所有论文都视为"新"论文，从而每天推送相同文章。

---

## 修复记录 - File-by-File


### 修复 1: `.github/workflows/daily.yml` — 移除持久化条件

**文件**: `.github/workflows/daily.yml`
**行号**: 原第 40 行
**修改**: 删除了 `if: ${{ vars.PAPFAST_PERSIST_STATE == 'true' }}` 条件

**问题**: 该条件依赖 GitHub 仓库变量 `PAPFAST_PERSIST_STATE`，若用户未设置，
`sent-papers.json` 去重记录不会提交回仓库，每次运行都只有示例记录 → 所有论文被重复推送。

**修复**: 删除该条件，持久化步骤始终执行。从下次运行开始，`sent-papers.json`
会自动提交回仓库，实现真正的跨运行去重。


### 修复 2: `src/sent-papers.js` — 新增 isSampleRecord() 跳过示例数据

**文件**: `src/sent-papers.js`
**新增函数**: `isSampleRecord(record)`
**修改位置**: `loadSentPapers()` 循环中

**问题**: `data/sent-papers.json` 包含一条示例记录（pmid:42228021），
若该文件未被提交覆盖，示例记录会一直留在去重池中，但更严重的是如果
文件结构变化，示例记录可能干扰去重逻辑。

**修复**:
1. 新增 `isSampleRecord()` 函数，检测 module/key 含"示例"关键词
   或匹配已知示例 PMID 集合
2. 在 `loadSentPapers()` 的循环中调用 `isSampleRecord()` 跳过示例记录


### 修复 3: `src/index.js` — 新增模块级运行时去重池 (moduleRuntimePool)

**文件**: `src/index.js`
**修改**:
1. `deduplicatePapers()` 函数增加第三个参数 `runtimePool`（可选 Set）
2. 在 `processModule()` 内创建 `const moduleRuntimePool = new Set()`
3. 3 处 `deduplicatePapers()` 调用全部传入 `moduleRuntimePool`

**问题**: 当一个模块有多个关键词（如不同关键词搜索策略），同一篇论文可能被
多个关键词搜到。原来每轮关键词调用 `deduplicatePapers` 只在自己的 Set 内去重，
跨关键词的重复论文会被多次抓取、翻译、分析，浪费 API 额度。

**修复**: 运行时去重池 `moduleRuntimePool` 在 `processModule()` 内创建，
同一模块内所有关键词共享。第一篇关键词搜到的论文会被记录在 pool 中，
后续关键词搜到同一论文时直接跳过。


### 修复 4: `.github/workflows/lung_am.yml` — 使用 GITHUB_REF_NAME 替代硬编码分支

**文件**: `.github/workflows/lung_am.yml`
**行号**: 最后一行 `git pull --rebase origin main`
**修改**: `main` → `"${GITHUB_REF_NAME}"`

**问题**: 硬编码 `main` 分支名，若仓库默认分支改名或用户使用其他分支时，
`git pull --rebase` 会失败。

**修复**: 使用 GitHub Actions 内置变量 `GITHUB_REF_NAME`，自动适配当前分支。
（`daily.yml` 已经使用此变量，`lung_am.yml` 是 Python 版本遗漏的同类问题）


### 修复 5: `README.md` — 新增去重机制文档

**文件**: `README.md`
**修改**: 在"项目结构"前新增 "去重机制" 章节

**内容**:
- 双层去重机制说明（持久化去重 + 运行时去重池）
- 去重标识优先级表（PMID > DOI > 标题前缀）
- 记录保留策略（默认 60 天）

