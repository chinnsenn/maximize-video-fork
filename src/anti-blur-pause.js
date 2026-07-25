/**
 * [INPUT]: 依赖 document/window 生命周期事件、用户暂停意图事件与 HTMLVideoElement 播放能力
 * [OUTPUT]: 对外提供 antiBlurPause 反失焦暂停控制器
 * [POS]: src 的播放稳定性补丁，入口初始化时最先启用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const antiBlurPause = runtime.register("antiBlurPause", {
  ready: false,
  lastFocusLossAt: 0,
  lastPauseIntentAt: 0,
  focusLossWindowMs: 2000,
  pauseIntentWindowMs: 1200,
  init() {
    if (this.ready) return
    this.ready = true
    this.keepVisible()
    this.trackPauseIntent()
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
  trackPauseIntent() {
    const mark = (event) => {
      if (!this.isPauseIntent(event)) return
      this.lastPauseIntentAt = Date.now()
    }
    for (const event of ["pointerdown", "mousedown", "touchstart", "click", "keydown"]) {
      document.addEventListener(event, mark, true)
    }
  },
  isPauseIntent(event) {
    if (!this.hasPlayingVideo()) return false
    if (event.type == "keydown") return this.isMediaKey(event) && !this.isEditableTarget(event.target)
    return this.isMediaControl(event)
  },
  isMediaKey(event) {
    return [" ", "Spacebar", "k", "K", "MediaPlayPause", "MediaPause"].includes(event.key)
  },
  hasPlayingVideo() {
    return [...document.getElementsByTagName("video")].some((video) => !video.paused && !video.ended)
  },
  isEditableTarget(target) {
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable
  },
  isMediaControl(event) {
    const path = typeof event.composedPath == "function" ? event.composedPath() : [event.target]
    return path.some((node) => this.isVideoNode(node) || this.looksLikeMediaControl(node))
  },
  isVideoNode(node) {
    return node?.nodeName == "VIDEO"
  },
  looksLikeMediaControl(node) {
    if (!(node instanceof Element)) return false
    const text = `${node.id} ${node.className} ${node.getAttribute("aria-label") || ""} ${node.getAttribute("title") || ""}`
    return /video|player|control|play|pause/i.test(text)
  },
  hasRecentPauseIntent() {
    return Date.now() - this.lastPauseIntentAt <= this.pauseIntentWindowMs
  },
  resumePausedVideos() {
    document.addEventListener(
      "pause",
      (event) => {
        const video = event.target
        if (video?.nodeName != "VIDEO") return
        if (Date.now() - this.lastFocusLossAt > this.focusLossWindowMs) return
        if (video.ended || video.seeking) return
        if (this.hasRecentPauseIntent()) return
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
