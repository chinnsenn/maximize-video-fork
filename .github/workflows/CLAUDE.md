# .github/workflows/
> L2 | 父级: /.github/CLAUDE.md

成员清单
build.yml: CI 编译工作流，在 push、pull_request 与手动触发时构建并上传 userscript artifact。
publish-greasyfork.yml: 发布工作流，在 tag 或手动触发时构建产物并强制更新 greasyfork 同步分支。

法则: build 验证源码，publish 只发布构建产物，Greasy Fork webhook 消费 greasyfork 分支 raw 文件。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
