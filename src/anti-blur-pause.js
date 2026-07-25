/**
 * [INPUT]: 依赖 document/window 生命周期事件与 HTMLVideoElement 播放能力
 * [OUTPUT]: 对外提供 antiBlurPause 反失焦暂停控制器
 * [POS]: src 的播放稳定性补丁，入口初始化时最先启用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const antiBlurPause = runtime.register("antiBlurPause", {
  ready: false,
  lastFocusLossAt: 0,
  init() {
    if (this.ready) return
    this.ready = true
    this.keepVisible()
    this.blockFocusEvents()
    this.resumePausedVideos()
  },
  keepVisible() {
    const define = (obj, key, value) => {
      try {
        Object.defineProperty(obj, key, {
          configurable: true,
          get: () => value,
        })
      } catch (_) {}
    }
    define(Document.prototype, "hidden", false)
    define(Document.prototype, "webkitHidden", false)
    define(Document.prototype, "visibilityState", "visible")
    try {
      document.hasFocus = () => true
    } catch (_) {}
  },
  blockFocusEvents() {
    const stop = (event) => {
      this.lastFocusLossAt = Date.now()
      event.stopImmediatePropagation()
    }
    const events = ["visibilitychange", "webkitvisibilitychange", "blur", "pagehide", "freeze"]
    for (const event of events) {
      document.addEventListener(event, stop, true)
      window.addEventListener(event, stop, true)
    }
  },
  resumePausedVideos() {
    document.addEventListener(
      "pause",
      (event) => {
        const video = event.target
        if (video?.nodeName != "VIDEO") return
        if (Date.now() - this.lastFocusLossAt > 2000) return
        if (video.ended || video.seeking) return
        setTimeout(() => {
          if (video.paused && !video.ended) {
            video.play().catch(() => {})
          }
        }, 80)
      },
      true
    )
  },
})
