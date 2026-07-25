/**
 * [INPUT]: 依赖 scripts/build.mjs 生成产物、Node.js 语法检查器与 src 文档头部
 * [OUTPUT]: 对外提供 userscript 元数据、GEB L3 协议与 JavaScript 语法校验
 * [POS]: scripts 的质量门禁，被本地 npm run check 与 GitHub Actions 调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import childProcess from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const distFile = path.join(root, "dist", "maximize-video-fork.user.js")
const outputsFile = path.join(root, "outputs", "maximize-video-fork.user.js")
const sourceDir = path.join(root, "src")
const sourceFiles = fs
  .readdirSync(sourceDir)
  .filter((file) => file.endsWith(".js"))
  .sort()

const fail = (message) => {
  console.error(message)
  process.exit(1)
}

childProcess.execFileSync(process.execPath, [path.join(root, "scripts", "build.mjs")], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
})

const userscript = fs.readFileSync(distFile, "utf8")
const committedUserscript = fs.readFileSync(outputsFile, "utf8")
if (userscript.includes("runtime.runtime")) fail("Invalid nested runtime reference: runtime.runtime")
if (userscript !== committedUserscript) fail("Generated dist and committed outputs userscripts differ")

for (const required of [
  "// ==UserScript==",
  "// @author              冻猫",
  "// @homepageURL         https://github.com/chinnsenn/maximize-video-fork",
  "// @supportURL          https://github.com/chinnsenn/maximize-video-fork/issues",
  "// @downloadURL         https://raw.githubusercontent.com/chinnsenn/maximize-video-fork/greasyfork/maximize-video-fork.user.js",
  "// @updateURL           https://raw.githubusercontent.com/chinnsenn/maximize-video-fork/greasyfork/maximize-video-fork.user.js",
  "// @match               *://*/*",
  "// ==/UserScript==",
]) {
  if (!userscript.includes(required)) fail(`Missing userscript metadata: ${required}`)
}

for (const file of sourceFiles) {
  const fullPath = path.join(sourceDir, file)
  const content = fs.readFileSync(fullPath, "utf8")
  if (!content.includes("[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md")) {
    fail(`Missing GEB L3 protocol header: src/${file}`)
  }
}

childProcess.execFileSync(process.execPath, ["--check", distFile], {
  cwd: root,
  stdio: "inherit",
})

childProcess.execFileSync("git", ["diff", "--exit-code", "--", "outputs/maximize-video-fork.user.js"], {
  cwd: root,
  stdio: "inherit",
})

console.log("Check passed")
