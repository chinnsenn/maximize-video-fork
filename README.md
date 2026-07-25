# Maximize Video Fixed

基于 Greasy Fork 原脚本 [Maximize Video / 视频网页全屏](https://greasyfork.org/zh-CN/scripts/4870-maximize-video) 的维护分支。原作者署名保留为 `冻猫`，源码拆分在 `src/`，发布产物由构建脚本生成。

## 构建

```bash
npm install
npm run check
```

产物位置：

- `dist/maximize-video-fork.user.js`
- `maximize-video-fork.js`

发布时可以覆盖版本号：

```bash
USERSCRIPT_VERSION=1.0.1 npm run build
```

## Greasy Fork 发布

Greasy Fork 官方更新 API 是只读；自动更新推荐使用 webhook 同步。GitHub Actions 会把构建产物推送到 `greasyfork` 分支，开发者账号里把脚本同步 URL 指向：

```text
https://raw.githubusercontent.com/<owner>/<repo>/greasyfork/maximize-video-fork.user.js
```

然后在 Greasy Fork 的 webhook 信息页按提示把 GitHub repository webhook 配好，push 或发布 tag 后 Greasy Fork 会拉取这个 raw 文件。
