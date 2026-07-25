/**
 * [INPUT]: 依赖 浏览器 window/document 环境
 * [OUTPUT]: 对外提供 gv 运行时状态容器
 * [POS]: src 的全局状态核心，被按钮、事件、全屏控制共同读写
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const gv = {
  isFull: false,
  isIframe: false,
  autoCheckCount: 0,
}
