@echo off
chcp 65001 >nul
title Papfast 配置向导

:: ==========================================================
:: Papfast 配置向导 — 一键安装 + 配置
:: 支持路径含空格、无 Node.js 提示、管理员权限处理
:: ==========================================================

setlocal enabledelayedexpansion

:: 切换到脚本所在目录（防路径空格）
cd /d "%~dp0"

:: ── 打印欢迎信息 ──
echo.
echo ╔═══════════════════════════════════════════╗
echo ║        🔬 Papfast 配置向导                ║
echo ╠═══════════════════════════════════════════╣
echo ║  一键安装依赖 + 浏览器配置                ║
echo ╚═══════════════════════════════════════════╝
echo.

:: ── 检查 Node.js ──
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js，正在尝试自动安装...
    echo.
    echo ⚠️  请稍候，自动下载 Node.js 安装包...
    echo.
    echo 如果下载失败，请手动访问 https://nodejs.org 安装后重新运行本脚本。
    echo.
    
    :: 自动检测系统架构并下载 Node.js
    if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
        set "NODE_URL=https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi"
    ) else (
        set "NODE_URL=https://nodejs.org/dist/v22.14.0/node-v22.14.0-x86.msi"
    )
    
    echo 正在从 nodejs.org 下载 Node.js...
    :: 使用 PowerShell 下载
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%TEMP%\node-install.msi'}"
    
    if exist "%TEMP%\node-install.msi" (
        echo ✅ 下载完成，正在安装（请在弹出的窗口中点击"下一步"完成安装）...
        start /wait msiexec /i "%TEMP%\node-install.msi" /qn
        del "%TEMP%\node-install.msi"
        echo ✅ Node.js 安装完成！请关闭此窗口后重新运行 setup.bat
    ) else (
        echo ❌ 下载失败，请手动访问 https://nodejs.org 安装 Node.js
    )
    echo.
    pause
    exit /b 1
)

:: 检查 Node.js 版本
for /f "tokens=1,2,3 delims=v." %%a in ('node -v') do set NODE_VER_MAJOR=%%b
if defined NODE_VER_MAJOR (
    if !NODE_VER_MAJOR! LSS 18 (
        echo ⚠️  Node.js 版本过低 (!NODE_VER_MAJOR!)，建议 ^>= 18
        echo 请从 https://nodejs.org 下载最新版
        pause
        exit /b 1
    )
)

echo ✅ Node.js 版本: 
node -v
echo.

:: ── 安装 npm 依赖 ──
echo 📦 正在安装依赖...
echo.
call npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败，请检查网络连接后重试
    pause
    exit /b 1
)
echo ✅ 依赖安装完成！
echo.

:: ── 启动配置向导 ──
echo 🚀 正在启动配置向导...
echo.
echo 📌 浏览器将自动打开 http://127.0.0.1:3456
echo.
echo   请填写你的 API 密钥和邮箱信息
echo   点击"保存配置"后关闭此窗口即可
echo.
echo ╔═══════════════════════════════════════════╗
echo ║  ⏳ 按任意键手动打开浏览器...              ║
echo ║  或等待 3 秒自动打开                       ║
echo ╚═══════════════════════════════════════════╝
echo.

:: 启动配置服务器（后台运行）
start /B /MIN "" node setup-server.cjs

:: 等待服务器启动
timeout /t 2 /nobreak >nul

:: 自动打开浏览器
start http://127.0.0.1:3456

:: 等待用户按任意键关闭
echo ✅ 配置页面已打开！配置完成后关闭此窗口即可。
echo.
echo 💡 配置保存后，双击 start.bat 即可运行论文推送。
echo.
pause

:: 关闭后台的 node 进程
taskkill /f /im node.exe >nul 2>nul

exit /b 0
