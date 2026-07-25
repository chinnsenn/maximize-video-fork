# src/
> L2 | 父级: /CLAUDE.md

成员清单
userscript.meta.js: Userscript 元数据头，保留原作者冻猫署名与原版 Greasy Fork 链接。
state.js: gv 全局运行时状态，保存全屏、iframe、按钮、播放器父链等共享状态。
rules.js: 站点与通用播放器 selector 规则，为鼠标探测和自动探测提供候选播放器。
i18n.js: iframe 判定与中英文按钮文案初始化，入口执行前写入 gv。
runtime.js: 显式运行时注册表，集中暴露状态、规则和各服务，削弱模块间隐式循环引用。
tool.js: DOM 几何、样式注入、按钮创建、日志与规则匹配工具集。
anti-blur-pause.js: 反失焦暂停补丁，区分页面隐藏导致的自动暂停与用户手动暂停。
buttons.js: 全屏与画中画按钮控制器，负责显示、隐藏、定位和延迟探测。
handlers.js: 鼠标、键盘、iframe message、画中画事件处理器。
maximize.js: 核心全屏状态机，负责父链标记、样式类切换、YouTube 剧场模式恢复。
init.js: 应用入口，装配样式、按钮、事件监听与 DOMContentLoaded 启动。

法则: 成员完整，一行一文件，按 build.mjs 的 sourceFiles 顺序表达运行依赖；跨模块协作经 runtime 命名注册。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
