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
