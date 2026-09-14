const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, 'js');
const outputFile = path.join(jsDir, 'app.bundle.js');

// 按照依赖顺序排序文件
const files = [
    'config.js',
    'audio.js',
    'characters.js',
    'spaceshipMasterMap.js',
    'generatedLevels.js',
    'levels.js',
    'level1Tutorial.js',
    'dialogueUI.js',
    'diaryUI.js',
    'memoryArchive.js',
    'saveSystem.js',
    'talentTree.js',
    'mapRenderer.js',
    'unlockEvaluator.js',
    'exploration.js',
    'kazeConfession.js',
    'level15Interrogation.js',
    'menuSkyShader.js',
    'gameEngine.js'
];

let bundleContent = `/**
 * DOPPELGANGER 完整打包脚本 (开箱即用，支持 file:// 本地双击直接畅玩)
 * 自动生成于 ${new Date().toISOString()}
 */
(function() {
    'use strict';
\n`;

files.forEach(fileName => {
    const filePath = path.join(jsDir, fileName);
    let code = fs.readFileSync(filePath, 'utf8');

    // 移除 import 语句
    code = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
    // 侧效 import（无 from）
    code = code.replace(/import\s+['"][^'"]+['"];?/g, '');

    // 将 export const / export class / export function 转换为普通的声明
    code = code.replace(/export\s+(const|let|var|class|function)/g, '$1');
    code = code.replace(/export\s+default\s+/g, '');
    // 具名再导出：export { A, B as C }; → 删除（符号已在作用域内）
    code = code.replace(/export\s*\{[^}]*\}\s*;?/g, '');
    // export * from '...'
    code = code.replace(/export\s+\*\s+from\s+['"][^'"]+['"];?/g, '');
    // 兜底：残留的 export 关键字
    code = code.replace(/^\s*export\s+/gm, '');

    bundleContent += `    // =========================================================================\n`;
    bundleContent += `    // 模块: ${fileName}\n`;
    bundleContent += `    // =========================================================================\n`;
    bundleContent += code + '\n\n';
});

// 添加自动初始化入口
bundleContent += `    // =========================================================================\n`;
bundleContent += `    // 游戏自启动引导入口\n`;
bundleContent += `    // 挂载全局对象以便于调试和扩展
    window.CharacterRegistry = CharacterRegistry;
    window.LevelRegistry = LevelRegistry;
    window.WorldviewConfig = WorldviewConfig;
    window.StaminaConfig = StaminaConfig;
    window.EveningTriggerConfig = EveningTriggerConfig;
    window.AudioConfig = AudioConfig;
    window.Sound = Sound;
    window.UnlockEvaluator = UnlockEvaluator;
    window.DiaryUI = DiaryUI;
    window.MASTER_ROOM_DEFS = MASTER_ROOM_DEFS;
    window.MASTER_CONNECTIONS = MASTER_CONNECTIONS;
    window.getNpcRoomDefs = getNpcRoomDefs;
    window.buildSpaceshipLevelMap = buildSpaceshipLevelMap;

    function bootstrap() {
        if (window.gameApp) return;
        try {
            console.log("[DOPPELGANGER] 启动游戏主引擎...");
            window.gameApp = new GameEngine();
        } catch (err) {
            console.error("[DOPPELGANGER] 引擎启动失败", err);
            try {
                if (window.__BootLoader && window.__BootLoader.takeOver) window.__BootLoader.takeOver();
                var status = document.getElementById("loading-status-text");
                var pct = document.getElementById("loading-percent-text");
                var bar = document.getElementById("loading-progress-bar");
                if (status) status.textContent = "引擎启动失败，请刷新重试";
                if (pct) pct.textContent = "!";
                if (bar) bar.style.width = "100%";
            } catch (e2) { /* ignore */ }
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootstrap);
    } else {
        bootstrap();
    }
})();\n`;

fs.writeFileSync(outputFile, bundleContent, 'utf8');
console.log(`[OK] app.bundle.js 生成成功，大小: ${(bundleContent.length / 1024).toFixed(2)} KB`);

// 自动更新 index.html 中的防强缓存版本戳
const indexPath = path.join(__dirname, 'index.html');
if (fs.existsSync(indexPath)) {
    let indexHtml = fs.readFileSync(indexPath, 'utf8');
    const timestamp = Date.now();
    // 仅改写 href/src 属性，避免误伤注释或内联脚本里的同名字符串
    indexHtml = indexHtml.replace(
        /href="((?:\.\/)?style\.css)(?:\?v=[^"]*)?"/g,
        `href="$1?v=${timestamp}"`
    );
    indexHtml = indexHtml.replace(
        /src="((?:\.\/)?js\/app\.bundle\.js)(?:\?v=[^"]*)?"/g,
        `src="$1?v=${timestamp}"`
    );
    fs.writeFileSync(indexPath, indexHtml, 'utf8');
    console.log(`[OK] index.html 资源防缓存戳已自动刷新为: ?v=${timestamp}`);
}

