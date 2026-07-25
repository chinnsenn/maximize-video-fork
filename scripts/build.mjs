/**
 * [INPUT]: 依赖 src/userscript.meta.js 与 src/*.js 片段文件
 * [OUTPUT]: 对外提供 dist、outputs 与根目录兼容 userscript 产物
 * [POS]: scripts 的构建入口，把分片源码恢复成 Greasy Fork 可发布的单文件 userscript
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const outputName = "maximize-video-fork.user.js"
const sourceFiles = [
  "state.js",
  "rules.js",
  "runtime.js",
  "i18n.js",
  "tool.js",
  "anti-blur-pause.js",
  "buttons.js",
  "handlers.js",
  "maximize.js",
  "init.js",
]

const read = (file) => fs.readFileSync(path.join(root, file), "utf8").trimEnd()

const withVersionOverride = (meta) => {
  const version = process.env.USERSCRIPT_VERSION?.trim()
  if (!version) return meta
  return meta.replace(/^\/\/ @version\s+.*/m, `// @version             ${version}`)
}

const meta = withVersionOverride(read("src/userscript.meta.js"))
const body = sourceFiles.map((file) => read(path.join("src", file))).join("\n\n")
const userscript = `${meta}

;(() => {
"use strict"

${body}
})()
`

const distDir = path.join(root, "dist")
const outputsDir = path.join(root, "outputs")
fs.mkdirSync(distDir, { recursive: true })
fs.mkdirSync(outputsDir, { recursive: true })
fs.writeFileSync(path.join(distDir, outputName), userscript)
fs.writeFileSync(path.join(outputsDir, outputName), userscript)
fs.writeFileSync(path.join(root, "maximize-video-fork.js"), userscript)

console.log(`Built ${path.join("outputs", outputName)} (${userscript.length} bytes)`)
