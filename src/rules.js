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
