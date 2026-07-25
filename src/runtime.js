/**
 * [INPUT]: 依赖 gv 运行时状态、播放器规则表与后续模块注册
 * [OUTPUT]: 对外提供 runtime 显式运行时注册表
 * [POS]: src 的依赖中枢，让工具、按钮、事件、全屏控制器通过明确名字协作
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const runtime = {
  gv,
  rules: {
    html5Rules,
    generalPlayerRules,
  },
  register(name, service) {
    this[name] = service
    return service
  },
}
