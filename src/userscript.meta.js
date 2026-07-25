// ==UserScript==
// @name                Maximize Video Fixed
// @name:zh-CN          视频网页全屏（修复版）
// @namespace           https://github.com/chinnsenn/maximize-video-fork
// @description         Maximize all video players. Support picture-in-picture. Maintained fork of Maximize Video by 冻猫.
// @description:zh-CN   让所有视频网页全屏，开启画中画功能。基于冻猫原版 Maximize Video 的维护分支。
// @author              冻猫
// @homepageURL         https://github.com/chinnsenn/maximize-video-fork
// @supportURL          https://github.com/chinnsenn/maximize-video-fork/issues
// @downloadURL         https://raw.githubusercontent.com/chinnsenn/maximize-video-fork/greasyfork/maximize-video-fork.user.js
// @updateURL           https://raw.githubusercontent.com/chinnsenn/maximize-video-fork/greasyfork/maximize-video-fork.user.js
// @match               *://*/*
// @exclude             *www.w3school.com.cn*
// @version             1.0.4
// @run-at              document-start
// ==/UserScript==

/**
 * [INPUT]: 依赖 Greasy Fork/Tampermonkey userscript 元数据规范
 * [OUTPUT]: 对外提供 Maximize Video Fixed 的发布元数据、维护主页与更新链接
 * [POS]: src 的元数据契约，被 scripts/build.mjs 置于最终 userscript 文件头部
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
