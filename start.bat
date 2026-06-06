@echo off
chcp 65001 >nul
title Papfast 论文推送

:: ==========================================================
:: Papfast 一键启动
:: ==========================================================

cd /d "%~dp0"

:: 检查 config.local.json 是否存在
if not exist "config\config.local.json" (
    echo.
    echo ╔═══════════════════════════════════════════╗
    echo ║  ⚠️  未检测到配置文件                     ║
    echo ║                                         ║
    echo ║  请先运行 setup.bat 完成配置              ║
    echo ║                                         ║
    echo ║  💡 双击 setup.bat 一键配置               ║
    echo ╚═══════════════════════════════════════════╝
    echo.
    pause
    exit /b 1
)

echo.
echo ╔═══════════════════════════════════════════╗
echo ║     🔬 Papfast 论文推送                   ║
echo ╠═══════════════════════════════════════════╣
echo ║  正在检索最新文献...                       ║
echo ╚═══════════════════════════════════════════╝
echo.

node src/index.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ 运行出错，请检查 config/config.local.json 配置是否正确
    pause
    exit /b 1
)

echo.
echo ✅ 推送完成！
pause
