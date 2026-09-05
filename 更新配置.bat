@echo off
chcp 65001 > nul
echo ====================================================
echo 正在同步编译游戏配置到 app.bundle.js...
echo ====================================================
node build.js
if %errorlevel% equ 0 (
    echo.
    echo [成功] 配置已成功编译！请刷新网页或重新双击打开游戏即可生效！
) else (
    echo.
    echo [错误] 编译未完成，请确认是否安装了 Node.js。
)
pause
