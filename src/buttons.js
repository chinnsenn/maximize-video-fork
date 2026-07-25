/**
 * [INPUT]: 依赖 runtime.gv、runtime.tool、runtime.rules、runtime.handle 与 runtime.init
 * [OUTPUT]: 对外提供 setButton 按钮创建后的展示、定位与自动探测逻辑
 * [POS]: src 的按钮控制层，连接播放器检测与用户操作入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const setButton = runtime.register("setButton", {
  init() {
    if (!document.getElementById("playerControlBtn")) {
      runtime.init()
    }
    if (runtime.gv.isIframe && runtime.tool.isHalfFullClient(runtime.gv.player)) {
      window.parent.postMessage("iframeVideo", "*")
      return
    }
    this.show()
  },
  show() {
    if (runtime.gv.isFull || !runtime.gv.player || !runtime.gv.player.isConnected) {
      this.hide()
      return
    }
    runtime.gv.player.removeEventListener("mouseleave", runtime.handle.leavePlayer, false)
    runtime.gv.player.addEventListener("mouseleave", runtime.handle.leavePlayer, false)

    if (!runtime.gv.isFull) {
      document.removeEventListener("scroll", runtime.handle.scrollFix, false)
      document.addEventListener("scroll", runtime.handle.scrollFix, false)
    }
    if (!this.locate()) {
      this.hide()
      return
    }
    runtime.tool.setButtonVisible(runtime.gv.controlBtn, true)
    runtime.tool.setButtonVisible(
      runtime.gv.picinpicBtn,
      document.pictureInPictureEnabled && runtime.gv.player.nodeName != "OBJECT" && runtime.gv.player.nodeName != "EMBED"
    )
  },
  locate() {
    const playerRect = runtime.tool.getRect(runtime.gv.player)
    if (playerRect.width <= 0 || playerRect.height <= 0) return false
    const client = runtime.tool.getClient()
    const controlWidth = runtime.gv.controlBtn.offsetWidth || 64
    const pipWidth = runtime.gv.picinpicBtn.offsetWidth || 53
    const gap = 4
    const right = runtime.tool.clamp(playerRect.right, controlWidth + pipWidth + gap, client.width)
    const top = runtime.tool.clamp(playerRect.screenY, 0, Math.max(0, client.height - 20))
    runtime.gv.controlBtn.style.opacity = "0.5"
    runtime.gv.controlBtn.innerHTML = runtime.gv.btnText.max
    runtime.gv.controlBtn.style.top = top + "px"
    // 网页全屏按钮位置，Maximize button
    runtime.gv.controlBtn.style.left = right - controlWidth + "px"
    runtime.gv.picinpicBtn.style.opacity = "0.5"
    runtime.gv.picinpicBtn.innerHTML = runtime.gv.btnText.pip
    runtime.gv.picinpicBtn.style.top = runtime.gv.controlBtn.style.top
    // 画中画按钮位置，PicInPic button
    runtime.gv.picinpicBtn.style.left = right - controlWidth - pipWidth - gap + "px"
    return true
  },
  hide() {
    runtime.tool.setButtonVisible(runtime.gv.controlBtn, false)
    runtime.tool.setButtonVisible(runtime.gv.picinpicBtn, false)
    runtime.gv.controlBtn.style.opacity = ""
    runtime.gv.picinpicBtn.style.opacity = ""
  },
  detect() {
    for (const rule in runtime.rules.html5Rules) {
      if (!runtime.tool.matchRule(document.location.hostname, rule)) continue
      for (const selector of runtime.rules.html5Rules[rule]) {
        const player = document.querySelector(selector)
        if (!player) continue
        runtime.gv.player = player
        this.show()
        return
      }
    }
    const videos = [...document.querySelectorAll("video")]
      .filter((video) => video.offsetWidth > 399 && video.offsetHeight > 220)
      .sort((a, b) => b.offsetWidth * b.offsetHeight - a.offsetWidth * a.offsetHeight)
    if (!videos.length) return
    runtime.gv.player = runtime.handle.autoCheck(videos[0]) || videos[0]
    runtime.gv.autoCheckCount = 1
    this.show()
  },
})
