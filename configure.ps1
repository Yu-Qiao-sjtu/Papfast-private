# ============================================================
# Papfast 初始化配置向导
# ============================================================
# 使用方法：右键 → "以 PowerShell 运行"
# 或：在终端执行 powershell -ExecutionPolicy Bypass .\configure.ps1
# ============================================================

Write-Host "
" -NoNewline
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        Papfast 论文订阅 · 配置向导           ║" -ForegroundColor Cyan
Write-Host "║                                             ║" -ForegroundColor Cyan
Write-Host "║  本向导会引导你填写配置信息，                  ║" -ForegroundColor Cyan
Write-Host "║  并保存到 config/config.local.json           ║" -ForegroundColor Cyan
Write-Host "║  该文件不会上传到 GitHub，请放心填写          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "
"

# ---- 获取项目根目录 ----
$rootDir = $PSScriptRoot
if (-not $rootDir) {
    $rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$configDir = Join-Path $rootDir "config"
$configFile = Join-Path $configDir "config.local.json"

# ---- 检查是否已有配置 ----
if (Test-Path $configFile) {
    Write-Host "⚠️  检测到已有配置文件：" -ForegroundColor Yellow
    Write-Host "   $configFile" -ForegroundColor Gray
    $reconfig = Read-Host "是否重新配置？(y/n，默认 n)"
    if ($reconfig -ne "y" -and $reconfig -ne "Y") {
        Write-Host "
✅ 保留现有配置，退出向导。" -ForegroundColor Green
        exit 0
    }
}

# ---- 检查 Node.js ----
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodePath) {
    Write-Host "❌ 未检测到 Node.js！请先安装：https://nodejs.org" -ForegroundColor Red
    Write-Host "   安装后重新运行本向导。
" -ForegroundColor Gray
    exit 1
}
$nodeVersion = & node --version
Write-Host "✅ Node.js 已检测: $nodeVersion" -ForegroundColor Green

# ---- 检查依赖 ----
if (-not (Test-Path (Join-Path $rootDir "node_modules"))) {
    Write-Host "📦 正在安装项目依赖..." -ForegroundColor Yellow
    Push-Location $rootDir
    npm install
    Pop-Location
    Write-Host "✅ 依赖安装完成
" -ForegroundColor Green
}

# ============================================================
# 配置输入
# ============================================================
Write-Host "┌──────────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host "│  第一步：邮箱配置                             │" -ForegroundColor Magenta
Write-Host "│  用于发送论文摘要邮件的 SMTP 信息              │" -ForegroundColor Magenta
Write-Host "└──────────────────────────────────────────────┘
" -ForegroundColor Magenta

$smtpHost = Read-Host "SMTP 服务器地址 (默认 smtp.163.com)"
if ([string]::IsNullOrWhiteSpace($smtpHost)) { $smtpHost = "smtp.163.com" }

$smtpPort = Read-Host "SMTP 端口 (默认 465)"
if ([string]::IsNullOrWhiteSpace($smtpPort)) { $smtpPort = "465" }

$smtpUser = Read-Host "📧 发件邮箱地址 (如: yourname@163.com)"
while ([string]::IsNullOrWhiteSpace($smtpUser)) {
    Write-Host "   ❌ 邮箱地址不能为空" -ForegroundColor Red
    $smtpUser = Read-Host "📧 发件邮箱地址"
}

$securePass = Read-Host -AsSecureString "🔑 邮箱授权码/SMTP密码 (输入时不可见)"
$smtpPass = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
)
while ([string]::IsNullOrWhiteSpace($smtpPass)) {
    Write-Host "   ❌ 授权码不能为空" -ForegroundColor Red
    $securePass = Read-Host -AsSecureString "🔑 邮箱授权码/SMTP密码"
    $smtpPass = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
    )
}

Write-Host "
┌──────────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host "│  第二步：AI 翻译/分析 API 配置                │" -ForegroundColor Magenta
Write-Host "│  用于翻译论文标题/摘要并进行深度分析            │" -ForegroundColor Magenta
Write-Host "└──────────────────────────────────────────────┘
" -ForegroundColor Magenta

Write-Host "  支持的提供商:" -ForegroundColor Gray
Write-Host "   1) DeepSeek (api.deepseek.com)" -ForegroundColor Gray
Write-Host "   2) OpenAI (api.openai.com)" -ForegroundColor Gray
Write-Host "   3) 阿里通义千问 (dashscope.aliyuncs.com)" -ForegroundColor Gray
Write-Host "   4) 智谱 (open.bigmodel.cn)" -ForegroundColor Gray
$providerChoice = Read-Host "  请选择 (1-4，默认 1)"

$providers = @{
    "1" = @{ provider="deepseek"; baseUrl="https://api.deepseek.com" }
    "2" = @{ provider="openai"; baseUrl="https://api.openai.com" }
    "3" = @{ provider="dashscope"; baseUrl="https://dashscope.aliyuncs.com" }
    "4" = @{ provider="zhipu"; baseUrl="https://open.bigmodel.cn" }
}
if ([string]::IsNullOrWhiteSpace($providerChoice) -or -not $providers.ContainsKey($providerChoice)) {
    $providerChoice = "1"
}
$selectedProvider = $providers[$providerChoice]

$secureApiKey = Read-Host -AsSecureString "🔑 API Key (输入时不可见)"
$apiKey = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureApiKey)
)
while ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "   ❌ API Key 不能为空" -ForegroundColor Red
    $secureApiKey = Read-Host -AsSecureString "🔑 API Key"
    $apiKey = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureApiKey)
    )
}

# 模型选择
Write-Host "
  模型选择:" -ForegroundColor Gray
if ($providerChoice -eq "1") {
    Write-Host "   1) deepseek-chat (快速，默认)" -ForegroundColor Gray
    Write-Host "   2) deepseek-reasoner (更强大)" -ForegroundColor Gray
} elseif ($providerChoice -eq "2") {
    Write-Host "   1) gpt-4o-mini (快速，默认)" -ForegroundColor Gray
    Write-Host "   2) gpt-4o (更强大)" -ForegroundColor Gray
} elseif ($providerChoice -eq "3") {
    Write-Host "   1) qwen-turbo (快速，默认)" -ForegroundColor Gray
    Write-Host "   2) qwen-plus (更强大)" -ForegroundColor Gray
} elseif ($providerChoice -eq "4") {
    Write-Host "   1) glm-4-flash (快速，默认)" -ForegroundColor Gray
    Write-Host "   2) glm-4-plus (更强大)" -ForegroundColor Gray
}
$modelChoice = Read-Host "  请选择 (默认 1)"

$models = @{
    "1" = @{ "1"="deepseek-chat"; "2"="gpt-4o-mini"; "3"="qwen-turbo"; "4"="glm-4-flash" }
    "2" = @{ "1"="deepseek-reasoner"; "2"="gpt-4o"; "3"="qwen-plus"; "4"="glm-4-plus" }
}
if ([string]::IsNullOrWhiteSpace($modelChoice) -or -not $models.ContainsKey($modelChoice)) {
    $modelChoice = "1"
}
$modelName = $models[$modelChoice][$providerChoice]

Write-Host "
┌──────────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host "│  第三步：期刊影响因子 API (可选)               │" -ForegroundColor Magenta
Write-Host "│  用于在邮件中显示期刊等级信息                  │" -ForegroundColor Magenta
Write-Host "│  不需要可跳过，不影响核心功能                  │" -ForegroundColor Magenta
Write-Host "└──────────────────────────────────────────────┘
" -ForegroundColor Magenta

$easyScholarKey = Read-Host "EasyScholar API Key (留空跳过)"

Write-Host "
┌──────────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host "│  第四步：论文检索模块配置                     │" -ForegroundColor Magenta
Write-Host "│  可在此修改默认模块，或后续手动编辑配置文件     │" -ForegroundColor Magenta
Write-Host "└──────────────────────────────────────────────┘
" -ForegroundColor Magenta

$modifyModules = Read-Host "是否修改默认的检索关键词和收件人？(y/n，默认 n)"
$userModules = @()

if ($modifyModules -eq "y" -or $modifyModules -eq "Y") {
    $userModules = @()
    $addMore = $true
    while ($addMore) {
        $modName = Read-Host "  模块名称 (如: 我的研究领域)"
        $modKeyword = Read-Host "  检索关键词 (PubMed 格式)"
        $modRecipient = Read-Host "  收件邮箱"
        $modMax = Read-Host "  每次最大结果数 (默认 15)"
        if ([string]::IsNullOrWhiteSpace($modMax)) { $modMax = "15" }
        
        $userModules += @{
            name = $modName
            keywords = @($modKeyword)
            recipients = @($modRecipient)
            maxResults = [int]$modMax
            daysBack = 7
            fallbackFromYear = 2020
            fallbackMaxResults = 10
            enabled = $true
        }
        
        $continueInput = Read-Host "  添加更多模块？(y/n，默认 n)"
        if ($continueInput -ne "y" -and $continueInput -ne "Y") { $addMore = $false }
    }
}

# ============================================================
# 构建配置 JSON
# ============================================================
$configObj = @{
    email = @{
        smtp = @{
            host = $smtpHost
            port = [int]$smtpPort
            secure = ($smtpPort -eq "465")
            user = $smtpUser
            pass = $smtpPass
        }
        from = $smtpUser
    }
    llm = @{
        enabled = $true
        provider = $selectedProvider.provider
        baseUrl = $selectedProvider.baseUrl
        apiKey = $apiKey
        model = $modelName
    }
    modules = if ($userModules.Count -gt 0) { $userModules } else { @(
        @{
            name = "示例模块 A"
            keywords = @("(""alveolar macrophag*""[Title]) AND (""Nature""[Journal] OR ""Science""[Journal] OR ""Cell""[Journal])")
            recipients = @($smtpUser)
            maxResults = 15
            daysBack = 7
            fallbackFromYear = 2020
            fallbackMaxResults = 10
            enabled = $true
        }
    )}
    easyScholarKey = if ([string]::IsNullOrWhiteSpace($easyScholarKey)) { "" } else { $easyScholarKey }
}

# ============================================================
# 保存配置
# ============================================================
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

$json = $configObj | ConvertTo-Json -Depth 10
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($configFile, $json, $utf8)

Write-Host "
✅ 配置文件已保存到:" -ForegroundColor Green
Write-Host "   $configFile" -ForegroundColor White
Write-Host "📋 配置文件摘要:" -ForegroundColor Cyan
Write-Host "   SMTP:       $smtpUser @ $smtpHost"
Write-Host "   LLM:        $($selectedProvider.provider) / $modelName"
if (-not [string]::IsNullOrWhiteSpace($easyScholarKey)) {
    Write-Host "   期刊等级:  EasyScholar 已配置"
}
Write-Host "
"

# ============================================================
# 后续操作
# ============================================================
Write-Host "┌──────────────────────────────────────────────┐" -ForegroundColor Cyan
Write-Host "│  下一步操作                                    │" -ForegroundColor Cyan
Write-Host "└──────────────────────────────────────────────┘
" -ForegroundColor Cyan

$runTest = Read-Host "是否立即测试运行？(y/n，默认 n)"
if ($runTest -eq "y" -or $runTest -eq "Y") {
    Write-Host "
🚀 正在运行 Papfast 测试..." -ForegroundColor Yellow
    Push-Location $rootDir
    node src/index.js
    Pop-Location
    Write-Host "
✅ 测试完成！" -ForegroundColor Green
}

$setupSchedule = Read-Host "是否设置 Windows 计划任务（每日自动运行）？(y/n，默认 n)"
if ($setupSchedule -eq "y" -or $setupSchedule -eq "Y") {
    Write-Host "
⏰ 正在设置每日计划任务..." -ForegroundColor Yellow
    & (Join-Path $rootDir "setup-schedule.ps1")
}

Write-Host "
🎉 Papfast 配置完成！" -ForegroundColor Green
Write-Host "   如需修改配置，重新运行本向导即可。" -ForegroundColor Gray
Write-Host "   或直接编辑: $configFile" -ForegroundColor Gray
