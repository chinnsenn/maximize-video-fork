/**
 * [INPUT]: 依赖 runtime.gv、runtime.tool、runtime.handle、runtime.setButton 与页面 DOM 树
 * [OUTPUT]: 对外提供 maximize 网页全屏与恢复控制器
 * [POS]: src 的核心状态转换器，负责播放器父链标记、全屏类名与恢复
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const maximize = runtime.register("maximize", {
  playerControl() {
    if (!runtime.gv.player) {
      return
    }
    this.checkParent()
    if (!runtime.gv.isFull) {
      if (runtime.gv.isIframe) {
        window.parent.postMessage("parentFull", "*")
      }
      if (runtime.gv.player.nodeName == "IFRAME") {
        runtime.gv.player.contentWindow.postMessage("innerFull", "*")
      }
      this.fullWin()
      if (runtime.gv.autoCheckCount > 0 && !runtime.tool.isHalfFullClient(runtime.gv.playerChilds[0])) {
        if (runtime.gv.autoCheckCount > 10) {
          for (let v of runtime.gv.playerChilds) {
            v.classList.add("videoToothbrush")
          }
          return
        }
        const tempPlayer = runtime.handle.autoCheck(runtime.gv.playerChilds[0])
        runtime.gv.autoCheckCount++
        runtime.maximize.playerControl()
        runtime.gv.player = tempPlayer
        runtime.maximize.playerControl()
      } else {
        runtime.gv.autoCheckCount = 0
      }
    } else {
      if (runtime.gv.isIframe) {
        window.parent.postMessage("parentSmall", "*")
      }
      if (runtime.gv.player.nodeName == "IFRAME") {
        runtime.gv.player.contentWindow.postMessage("innerSmall", "*")
      }
      this.smallWin()
    }
  },
  checkParent() {
    if (runtime.gv.isFull) {
      return
    }
    runtime.gv.playerParents = []
    let full = runtime.gv.player
    while ((full = full.parentNode)) {
      if (full.nodeName == "BODY") {
        break
      }
      if (full.getAttribute) {
        runtime.gv.playerParents.push(full)
      }
    }
  },
  fullWin() {
    if (!runtime.gv.isFull) {
      document.removeEventListener("mouseover", runtime.handle.getPlayer, false)
      runtime.gv.backHtmlId = document.body.parentNode.id
      runtime.gv.backBodyId = document.body.id
      if (document.location.hostname == "www.youtube.com" && !document.querySelector("#player-theater-container #movie_player")) {
        document.querySelector("#movie_player .ytp-size-button").click()
        runtime.gv.ytbStageChange = true
      }
      runtime.gv.leftBtn.style.display = "block"
      runtime.gv.rightBtn.style.display = "block"
      runtime.setButton.hide()
      this.addClass()
    }
    runtime.gv.isFull = true
  },
  addClass() {
    document.documentElement.classList.add("htmlToothbrush")
    document.body.classList.add("bodyToothbrush")
    for (let v of runtime.gv.playerParents) {
      v.classList.add("parentToothbrush")
      //父元素position:fixed会造成层级错乱
      if (getComputedStyle(v).position == "fixed") {
        v.classList.add("absoluteToothbrush")
      }
    }
    runtime.gv.player.classList.add("playerToothbrush")
    if (runtime.gv.player.nodeName == "VIDEO") {
      runtime.gv.backControls = runtime.gv.player.controls
      runtime.gv.player.controls = true
    }
    window.dispatchEvent(new Event("resize"))
  },
  smallWin() {
    document.documentElement.classList.remove("htmlToothbrush")
    document.body.classList.remove("bodyToothbrush")
    for (let v of runtime.gv.playerParents) {
      v.classList.remove("parentToothbrush")
      v.classList.remove("absoluteToothbrush")
    }
    runtime.gv.player.classList.remove("playerToothbrush")
    if (document.location.hostname == "www.youtube.com" && runtime.gv.ytbStageChange && document.querySelector("#player-theater-container #movie_player")) {
      document.querySelector("#movie_player .ytp-size-button").click()
      runtime.gv.ytbStageChange = false
    }
    if (runtime.gv.player.nodeName == "VIDEO") {
      runtime.gv.player.controls = runtime.gv.backControls
    }
    runtime.gv.leftBtn.style.display = ""
    runtime.gv.rightBtn.style.display = ""
    runtime.setButton.hide()
    document.addEventListener("mouseover", runtime.handle.getPlayer, false)
    window.dispatchEvent(new Event("resize"))
    runtime.gv.isFull = false
  },
})
