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
