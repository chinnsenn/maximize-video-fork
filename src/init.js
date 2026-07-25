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
