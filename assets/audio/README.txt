================================================================================
【音效配置指南】
================================================================================

本文件夹用于存放游戏内的自定义音效文件（支持 MP3 / WAV / OGG 格式）。
游戏已全面适配您放置的文件，包含中文文件名原生支持与纯代码 Web Audio 合成兜底！

1. 当前已适配的音频槽位（位于 js/config.js 的 AudioConfig）：
   - 遇害死亡展示音效：
     文件路径：assets/audio/death.mp3
     触发时机：黑夜行动结束后2秒纯黑屏死寂悬念期结束，死者立绘渐渐浮现的瞬间播放。

   - 物资获取专属音效：
     文件路径：assets/audio/物资获取.wav
     触发时机：在探索过程中踏入存有战备餐/能量棒等给养物资的舱室时瞬时播放。

   - 广播发出警报音效：
     文件路径：assets/audio/警告.wav
     触发时机：黎明系统广播发布乘员生命中断死讯、或魔镜扫描侦测到伪人高熵信号等警报广播时播放。

   - 移动探索位移音效：
     文件路径：assets/audio/移动.wav
     触发时机：在探索过程中点击方向向相邻舱室发起行进移动时播放。

2. 如何自定义或更换文件：
   - 将任意音频文件放置在此文件夹下；
   - 打开 js/config.js 修改对应的 Url 与音量即可：
     export const AudioConfig = {
         deathSoundUrl: "assets/audio/death.mp3",
         deathSoundVolume: 0.85,

         foodSoundUrl: "assets/audio/物资获取.wav",
         foodSoundVolume: 0.80,

         alarmSoundUrl: "assets/audio/警告.wav",
         alarmSoundVolume: 0.85,

         moveSoundUrl: "assets/audio/移动.wav",
         moveSoundVolume: 0.65,

         useFallbackSynthesizer: true
     };

3. 即放即用：
   - 配置保存后，双击运行根目录下的【更新配置.bat】完成打包；
   - 双击【双击启动游戏.bat】即可在浏览器中畅享完整全沉浸科幻音效！
================================================================================
