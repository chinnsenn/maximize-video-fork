// ==UserScript==
// @name                Maximize Video Fixed
// @name:zh-CN          视频网页全屏（修复版）
// @namespace           https://github.com/chinnsenn/maximize-video-fork
// @description         Maximize all video players. Support picture-in-picture. Forked from Maximize Video by 冻猫.
// @description:zh-CN   让所有视频网页全屏，开启画中画功能。基于冻猫原版 Maximize Video 修改。
// @author              冻猫
// @homepageURL         https://greasyfork.org/zh-CN/scripts/4870-maximize-video
// @supportURL          https://greasyfork.org/zh-CN/scripts/4870-maximize-video/feedback
// @match               *://*/*
// @exclude             *www.w3school.com.cn*
// @version             1.0.0
// @run-at              document-start
// ==/UserScript==

/**
 * [INPUT]: 依赖 Greasy Fork/Tampermonkey userscript 元数据规范
 * [OUTPUT]: 对外提供 Maximize Video Fixed 的发布元数据、原作者署名与原版链接
 * [POS]: src 的元数据契约，被 scripts/build.mjs 置于最终 userscript 文件头部
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

;(() => {
"use strict"

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

/**
 * [INPUT]: 依赖 站点 hostname 与 CSS selector 约定
 * [OUTPUT]: 对外提供 html5Rules 与 generalPlayerRules 播放器识别规则
 * [POS]: src 的规则表，被 handlers 与 buttons 检测流程消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

//Html5规则[播放器最外层],适用于无法自动识别的自适应大小HTML5播放器
const html5Rules = {
  "www.acfun.cn": [".player-container .player"],
  "*bilibili.com": ["#bilibiliPlayer", "#bilibili-player", ".bpx-player-container"],
  "www.douyu.com": ["#js-player-video-case"],
  "www.huya.com": ["#videoContainer"],
  "www.twitch.tv": [".player"],
  "www.youtube.com": ["#movie_player"],
  "www.yy.com": ["#player"],
  "*weibo.com": ['[aria-label="Video Player"]', ".html5-video-live .html5-video"],
  "v.huya.com": ["#video_embed_flash>div"],
}

//通用html5播放器
const generalPlayerRules = [".dplayer", ".video-js", ".jwplayer", "[data-player]"]

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

/**
 * [INPUT]: 依赖 window.top/window.self 与 navigator.language
 * [OUTPUT]: 对外提供 runtime.gv.isIframe 与 runtime.gv.btnText 本地化文案
 * [POS]: src 的环境初始化层，为入口启动前准备跨 iframe 状态与按钮文案
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

if (window.top !== window.self) {
  runtime.gv.isIframe = true
}

if (navigator.language.toLocaleLowerCase() == "zh-cn") {
  runtime.gv.btnText = {
    max: "网页全屏",
    pip: "画中画",
    tip: "Iframe内视频，请用鼠标点击视频后重试",
  }
} else {
  runtime.gv.btnText = {
    max: "Maximize",
    pip: "PicInPic",
    tip: "Iframe video. Please click on the video and try again",
  }
}

/**
 * [INPUT]: 依赖 DOM、CSSOM 与 runtime.maximize 运行时服务
 * [OUTPUT]: 对外提供 tool DOM/几何/样式/日志工具集
 * [POS]: src 的底层工具层，被所有交互模块复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const tool = runtime.register("tool", {
  print(log) {
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1 < 10 ? "0" : "") + (now.getMonth() + 1)
    const day = (now.getDate() < 10 ? "0" : "") + now.getDate()
    const hour = (now.getHours() < 10 ? "0" : "") + now.getHours()
    const minute = (now.getMinutes() < 10 ? "0" : "") + now.getMinutes()
    const second = (now.getSeconds() < 10 ? "0" : "") + now.getSeconds()
    const timenow = "[" + year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second + "]"
    console.log(timenow + "[Maximize Video] > " + log)
  },
  getRect(element) {
    const rect = element.getBoundingClientRect()
    const scroll = tool.getScroll()
    return {
      pageX: rect.left + scroll.left,
      pageY: rect.top + scroll.top,
      screenX: rect.left,
      screenY: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    }
  },
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
  },
  isHalfFullClient(element) {
    const client = tool.getClient()
    const rect = tool.getRect(element)
    if (
      (Math.abs(client.width - element.offsetWidth) < 21 && rect.screenX < 20) ||
      (Math.abs(client.height - element.offsetHeight) < 21 && rect.screenY < 10)
    ) {
      if (
        Math.abs(element.offsetWidth / 2 + rect.screenX - client.width / 2) < 21 &&
        Math.abs(element.offsetHeight / 2 + rect.screenY - client.height / 2) < 21
      ) {
        return true
      } else {
        return false
      }
    } else {
      return false
    }
  },
  isAllFullClient(element) {
    const client = tool.getClient()
    const rect = tool.getRect(element)
    if (
      Math.abs(client.width - element.offsetWidth) < 21 &&
      rect.screenX < 20 &&
      Math.abs(client.height - element.offsetHeight) < 21 &&
      rect.screenY < 10
    ) {
      return true
    } else {
      return false
    }
  },
  getScroll() {
    return {
      left: document.documentElement.scrollLeft || document.body.scrollLeft,
      top: document.documentElement.scrollTop || document.body.scrollTop,
    }
  },
  getClient() {
    return {
      width: document.compatMode == "CSS1Compat" ? document.documentElement.clientWidth : document.body.clientWidth,
      height: document.compatMode == "CSS1Compat" ? document.documentElement.clientHeight : document.body.clientHeight,
    }
  },
  addStyle(css) {
    const style = document.createElement("style")
    style.type = "text/css"
    const node = document.createTextNode(css)
    style.appendChild(node)
    document.head.appendChild(style)
    return style
  },
  matchRule(str, rule) {
    return new RegExp("^" + rule.split("*").join(".*") + "$").test(str)
  },
  setButtonVisible(button, visible) {
    button.style.setProperty("display", visible ? "block" : "none", "important")
    button.style.setProperty("visibility", visible ? "visible" : "hidden", "important")
  },
  styleFloatingButton(button, width) {
    const styles = {
      position: "fixed",
      width: width + "px",
      height: "20px",
      "line-height": "20px",
      margin: "0",
      padding: "0",
      border: "0",
      "border-radius": "0",
      "text-align": "center",
      font: '12px "微软雅黑", sans-serif',
      color: "#fff",
      "background-color": "#27a9d8",
      cursor: "pointer",
      "text-shadow": "none",
      "box-sizing": "border-box",
      transition: "opacity 0.2s ease, background-color 0.2s ease",
    }
    for (const property in styles) button.style.setProperty(property, styles[property], "important")
    button.style.setProperty("z-index", "2147483647", "important")
  },
  createButton(id, hidden = false) {
    const btn = document.createElement("div")
    btn.id = id
    if (id == "playerControlBtn") this.styleFloatingButton(btn, 64)
    if (hidden) this.setButtonVisible(btn, false)
    btn.onclick = () => {
      runtime.maximize.playerControl()
    }
    document.body.appendChild(btn)
    return btn
  },
  async addTip(str) {
    if (!document.getElementById("catTip")) {
      const tip = document.createElement("tbdiv")
      tip.id = "catTip"
      tip.innerHTML = str
      ;(tip.style.cssText =
        'transition: all 0.8s ease-out;background: none repeat scroll 0 0 #27a9d8;color: #FFFFFF;font: 1.1em "微软雅黑";margin-left: -250px;overflow: hidden;padding: 10px;position: fixed;text-align: center;bottom: 100px;z-index: 300;'),
        document.body.appendChild(tip)
      tip.style.right = -tip.offsetWidth - 5 + "px"
      await new Promise((resolve) => {
        tip.style.display = "block"
        setTimeout(() => {
          tip.style.right = "25px"
          resolve("OK")
        }, 300)
      })
      await new Promise((resolve) => {
        setTimeout(() => {
          tip.style.right = -tip.offsetWidth - 5 + "px"
          resolve("OK")
        }, 3500)
      })
      await new Promise((resolve) => {
        setTimeout(() => {
          document.body.removeChild(tip)
          resolve("OK")
        }, 1000)
      })
    }
  },
})

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

/**
 * [INPUT]: 依赖 runtime.gv、runtime.tool、runtime.handle、runtime.setButton、runtime.antiBlurPause 与页面 body
 * [OUTPUT]: 对外提供 init 启动函数与 DOMContentLoaded 引导逻辑
 * [POS]: src 的应用入口，装配按钮、样式、事件监听与延迟探测
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const init = runtime.register("init", () => {
  runtime.antiBlurPause.init()
  document.documentElement.classList.remove("htmlToothbrush")
  document.body.classList.remove("bodyToothbrush")
  document.querySelectorAll(".parentToothbrush, .absoluteToothbrush, .playerToothbrush, .videoToothbrush").forEach((element) => {
    element.classList.remove("parentToothbrush", "absoluteToothbrush", "playerToothbrush", "videoToothbrush")
  })
  ;["picinpicBtn", "playerControlBtn", "leftFullStackButton", "rightFullStackButton"].forEach((id) => {
    document.getElementById(id)?.remove()
  })
  runtime.gv.picinpicBtn = document.createElement("div")
  runtime.gv.picinpicBtn.id = "picinpicBtn"
  runtime.gv.picinpicBtn.textContent = runtime.gv.btnText.pip
  runtime.tool.styleFloatingButton(runtime.gv.picinpicBtn, 53)
  runtime.tool.setButtonVisible(runtime.gv.picinpicBtn, false)
  runtime.gv.picinpicBtn.onclick = () => {
    runtime.handle.pictureInPicture()
  }
  document.body.appendChild(runtime.gv.picinpicBtn)
  runtime.gv.controlBtn = runtime.tool.createButton("playerControlBtn", true)
  runtime.gv.controlBtn.textContent = runtime.gv.btnText.max
  runtime.gv.leftBtn = runtime.tool.createButton("leftFullStackButton")
  runtime.gv.rightBtn = runtime.tool.createButton("rightFullStackButton")

  if (!document.getElementById("maximizeVideoStyle")) {
    const style = runtime.tool.addStyle(
      [
        ".htmlToothbrush .bodyToothbrush .parentToothbrush .bilibili-player-video {margin:0 !important;}",
        ".htmlToothbrush, .bodyToothbrush {overflow:hidden !important;zoom:100% !important;}",
        ".htmlToothbrush .bodyToothbrush .parentToothbrush {overflow:visible !important;z-index:2147483646 !important;transform:none !important;filter:none !important;isolation:auto !important;-webkit-transform-style:flat !important;transition:none !important;contain:none !important;}",
        ".htmlToothbrush .bodyToothbrush .absoluteToothbrush {position:absolute !important;}",
        ".htmlToothbrush .bodyToothbrush > *:not(.parentToothbrush):not(.playerToothbrush):not(#playerControlBtn):not(#picinpicBtn):not(#leftFullStackButton):not(#rightFullStackButton) {visibility:hidden !important;}",
        ".htmlToothbrush .bodyToothbrush .parentToothbrush > *:not(.parentToothbrush):not(.playerToothbrush) {visibility:hidden !important;}",
        ".htmlToothbrush .bodyToothbrush .playerToothbrush {visibility:visible !important;position:fixed !important;top:0px !important;left:0px !important;width:100vw !important;height:100vh !important;max-width:none !important;max-height:none !important;min-width:0 !important;min-height:0 !important;margin:0 !important;padding:0 !important;z-index:2147483647 !important;border:none !important;background-color:#000 !important;transform:none !important;filter:none !important;contain:none !important;}",
        ".htmlToothbrush .bodyToothbrush .parentToothbrush video {object-fit:contain !important;}",
        ".htmlToothbrush .bodyToothbrush .parentToothbrush .videoToothbrush {width:100vw !important;height:100vh !important;}",
        '#playerControlBtn {text-shadow: none;visibility:hidden;opacity:0;display:none;transition: all 0.5s ease;cursor: pointer;font: 12px "微软雅黑";margin:0;width:64px;height:20px;line-height:20px;border:none;text-align: center;position: fixed;z-index:2147483647;background-color: #27A9D8;color: #FFF;} #playerControlBtn:hover {visibility:visible;opacity:1;background-color:#2774D8;}',
        '#picinpicBtn {text-shadow: none;visibility:hidden;opacity:0;display:none;transition: all 0.5s ease;cursor: pointer;font: 12px "微软雅黑";margin:0;width:53px;height:20px;line-height:20px;border:none;text-align: center;position: fixed;z-index:2147483647;background-color: #27A9D8;color: #FFF;} #picinpicBtn:hover {visibility:visible;opacity:1;background-color:#2774D8;}',
        "#leftFullStackButton{display:none;position:fixed;width:1px;height:100vh;top:0;left:0;z-index:2147483647;background:#000;}",
        "#rightFullStackButton{display:none;position:fixed;width:1px;height:100vh;top:0;right:0;z-index:2147483647;background:#000;}",
      ].join("\n")
    )
    style.id = "maximizeVideoStyle"
  }
  document.addEventListener("mouseover", runtime.handle.getPlayer, false)
  document.addEventListener("keydown", runtime.handle.hotKey, false)
  window.addEventListener("message", runtime.handle.receiveMessage, false)
  window.addEventListener("resize", runtime.handle.resizeFix, false)
  ;[400, 1200, 3000].forEach((delay) => setTimeout(() => runtime.setButton.detect(), delay))
  runtime.tool.print("Ready")
})

runtime.antiBlurPause.init()
if (document.body) {
  init()
} else {
  document.addEventListener("DOMContentLoaded", init, { once: true })
}
})()
