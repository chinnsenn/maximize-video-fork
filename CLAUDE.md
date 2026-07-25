# maximize-video-fork - userscript build system
JavaScript userscript + Node.js build scripts + GitHub Actions

<directory>
src/ - 分片 userscript 源码，按运行顺序拼装 (10子文件: state/rules/i18n/runtime/tool/anti-blur/buttons/handlers/maximize/init)
</directory>

<directory>
scripts/ - Node.js 构建与校验入口 (2子文件: build.mjs/check.mjs)
</directory>

<directory>
.github/workflows/ - GitHub Actions 编译与 Greasy Fork 发布分支流水线 (2子文件: build.yml/publish-greasyfork.yml)
</directory>

<config>
package.json - npm 脚本与 Node 20+ 本地运行约束，CI 使用 Node 24
</config>

<config>
README.md - 本地构建与 Greasy Fork webhook 发布说明
</config>

<config>
maximize-video-fork.js - 构建生成的根目录兼容 userscript 产物
</config>

法则: 源码在 src，产物由 scripts/build.mjs 生成，Greasy Fork 只消费 dist 单文件。
