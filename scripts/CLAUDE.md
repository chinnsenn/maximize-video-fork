# scripts/
> L2 | 父级: /CLAUDE.md

成员清单
build.mjs: Node.js 构建器，读取 src 元数据与片段，生成 dist/maximize-video-fork.user.js 和根目录兼容产物。
check.mjs: Node.js 质量门禁，执行构建、校验 userscript 元数据、检查 L3 协议头并运行语法检查。

法则: 构建脚本无第三方依赖，CI 与本地同一入口。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
