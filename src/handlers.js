/**
 * [INPUT]: 依赖 runtime.gv、runtime.tool、runtime.setButton、runtime.maximize 与播放器规则
 * [OUTPUT]: 对外提供 handle 鼠标、键盘、iframe 消息与画中画处理器
 * [POS]: src 的事件调度层，把浏览器事件转换成全屏/画中画命令
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const handle = runtime.register("handle", {
  getPlayer(e) {
    if (runtime.gv.isFull) {
      return
    }
    runtime.gv.mouseoverEl = e.target
    const hostname = document.location.hostname
    let players = []
    for (let i in runtime.rules.html5Rules) {
      if (runtime.tool.matchRule(hostname, i)) {
        for (let html5Rule of runtime.rules.html5Rules[i]) {
          if (document.querySelectorAll(html5Rule).length > 0) {
            for (let player of document.querySelectorAll(html5Rule)) {
              players.push(player)
            }
          }
        }
        break
      }
    }
    if (players.length == 0) {
      for (let generalPlayerRule of runtime.rules.generalPlayerRules) {
        if (document.querySelectorAll(generalPlayerRule).length > 0) {
          for (let player of document.querySelectorAll(generalPlayerRule)) {
            players.push(player)
          }
        }
      }
    }
    if (players.length == 0 && e.target.nodeName != "VIDEO" && document.querySelectorAll("video").length > 0) {
      const videos = document.querySelectorAll("video")
      for (let v of videos) {
        const vRect = v.getBoundingClientRect()
        if (
          e.clientX >= vRect.x - 2 &&
          e.clientX <= vRect.x + vRect.width + 2 &&
          e.clientY >= vRect.y - 2 &&
          e.clientY <= vRect.y + vRect.height + 2 &&
          v.offsetWidth > 399 &&
          v.offsetHeight > 220
        ) {
          players = []
          players[0] = runtime.handle.autoCheck(v)
          runtime.gv.autoCheckCount = 1
          break
        }
      }
    }
    if (players.length > 0) {
      const path = e.path || e.composedPath()
      for (let v of players) {
        if (path.indexOf(v) > -1) {
          runtime.gv.player = v
          runtime.setButton.init()
          return
        }
      }
    }
    switch (e.target.nodeName) {
      case "VIDEO":
      case "OBJECT":
      case "EMBED":
        if (e.target.offsetWidth > 399 && e.target.offsetHeight > 220) {
          runtime.gv.player = e.target
          runtime.setButton.init()
        }
        break
      default:
        runtime.handle.leavePlayer()
    }
  },
  autoCheck(v) {
    let tempPlayer,
      el = v
    runtime.gv.playerChilds = []
    runtime.gv.playerChilds.push(v)
    while ((el = el.parentNode)) {
      if (Math.abs(v.offsetWidth - el.offsetWidth) < 15 && Math.abs(v.offsetHeight - el.offsetHeight) < 15) {
        tempPlayer = el
        runtime.gv.playerChilds.push(el)
      } else {
        break
      }
    }
    return tempPlayer
  },
  leavePlayer() {
    if (runtime.gv.controlBtn.style.visibility == "visible") {
      runtime.gv.controlBtn.style.opacity = "0.35"
      runtime.gv.picinpicBtn.style.opacity = "0.35"
    }
  },
  scrollFix(e) {
    clearTimeout(runtime.gv.scrollFixTimer)
    runtime.gv.scrollFixTimer = setTimeout(() => {
      runtime.setButton.locate()
    }, 20)
  },
  resizeFix() {
    if (!runtime.gv.isFull && runtime.gv.player?.isConnected) runtime.setButton.show()
  },
  hotKey(e) {
    //默认退出键为ESC。需要修改为其他快捷键的请搜索"keycode"，修改为按键对应的数字。
    if (e.keyCode == 27) {
      runtime.maximize.playerControl()
    }
    //默认画中画快捷键为F2。
    if (e.keyCode == 113) {
      runtime.handle.pictureInPicture()
    }
  },
  async receiveMessage(e) {
    switch (e.data) {
      case "iframePicInPic":
        runtime.tool.print("messege:iframePicInPic")
        if (!document.pictureInPictureElement) {
          await document
            .querySelector("video")
            .requestPictureInPicture()
            .catch((error) => {
              runtime.tool.addTip(runtime.gv.btnText.tip)
            })
        } else {
          await document.exitPictureInPicture()
        }
        break
      case "iframeVideo":
        runtime.tool.print("messege:iframeVideo")
        if (!runtime.gv.isFull) {
          runtime.gv.player = runtime.gv.mouseoverEl
          runtime.setButton.init()
        }
        break
      case "parentFull":
        runtime.tool.print("messege:parentFull")
        runtime.gv.player = runtime.gv.mouseoverEl
        if (runtime.gv.isIframe) {
          window.parent.postMessage("parentFull", "*")
        }
        runtime.maximize.checkParent()
        runtime.maximize.fullWin()
        if (getComputedStyle(runtime.gv.player).left != "0px") {
          runtime.tool.addStyle(".htmlToothbrush .bodyToothbrush .playerToothbrush {left:0px !important;width:100vw !important;}")
        }
        runtime.gv.isFull = true
        break
      case "parentSmall":
        runtime.tool.print("messege:parentSmall")
        if (runtime.gv.isIframe) {
          window.parent.postMessage("parentSmall", "*")
        }
        runtime.maximize.smallWin()
        break
      case "innerFull":
        runtime.tool.print("messege:innerFull")
        if (runtime.gv.player.nodeName == "IFRAME") {
          runtime.gv.player.contentWindow.postMessage("innerFull", "*")
        }
        runtime.maximize.checkParent()
        runtime.maximize.fullWin()
        break
      case "innerSmall":
        runtime.tool.print("messege:innerSmall")
        if (runtime.gv.player.nodeName == "IFRAME") {
          runtime.gv.player.contentWindow.postMessage("innerSmall", "*")
        }
        runtime.maximize.smallWin()
        break
    }
  },
  pictureInPicture() {
    if (!document.pictureInPictureElement) {
      if (runtime.gv.player) {
        if (runtime.gv.player.nodeName == "IFRAME") {
          runtime.gv.player.contentWindow.postMessage("iframePicInPic", "*")
        } else {
          runtime.gv.player.parentNode.querySelector("video").requestPictureInPicture()
        }
      } else {
        document.querySelector("video").requestPictureInPicture()
      }
    } else {
      document.exitPictureInPicture()
    }
  },
})
