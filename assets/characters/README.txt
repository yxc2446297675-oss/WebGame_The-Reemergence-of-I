【角色多表情差分立绘管理说明】

本工程已全面升级为【角色独立文件夹】立绘管理架构：

assets/characters/
├── kaze/          # 卡泽立绘目录
├── shaokexin/     # 邵可欣立绘目录
└── mode/          # 莫德立绘目录

各个角色文件夹内可放置以下命名的图片（PNG / JPG / WebP）：
- clam.png     # 【核心】平静（无任何表情指示时的默认照片，亦兼容 calm.png）
- happy.png    # 开心 / 微笑
- sad.png      # 悲伤 / 沮丧
- normal.png   # 正常状态
- angry.png    # 生气 / 质问
- doubt.png    # 疑惑 / 警惕
- shock.png    # 震惊 / 错愕
- dead.jpg     # 遇害 / 死亡立绘（亦兼容 dead.png，在黎明公布遇害者全屏黑屏特写与对话框中展示）

【提示】：
1. 当对话文本没有指定任何表情时，系统一律默认使用 clam.png。
2. 遇害死亡立绘同时支持 dead.jpg 与 dead.png，系统自动优先加载。
3. 若某张表情图片暂未放入，系统会自动无感知尝试 calm/normal/保底图片，最后优雅降级为带情绪徽章的高清矢量立绘，绝不白屏或破图！
