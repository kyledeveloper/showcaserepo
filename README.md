# 个人作品展示厅 · Showcase Site

Three.js 时间线画廊：滚轮翻页的堆叠项目卡片，配星空/时间隧道 3D 背景。
Vite + npm 安装的 `three`，多文件源码工程。

## 快速开始

```bash
npm install
npm run dev      # 本地开发 http://localhost:5173
npm run build    # 生产构建 -> dist/
npm run preview  # 预览构建产物 http://localhost:4173
```

## 架构与模块地图

```
index.html              页面骨架：canvas、进度条、右上控制区、画廊标题、
                        右侧时间线导航、hero 介绍区、卡片挂载点 #stack
src/main.js             入口：按顺序初始化 i18n → theme → gallery → scene
src/data/works.js       三个作品的数据（LifeRPG / 杯中花 Bloom Latte /
                        Options Quant Strategy Scanner）：中英双语文案、
                        时间、GitHub 链接、部署网站链接（Options scanner
                        暂无部署，不显示网站按钮）、截图 import
src/projectForm.js      「添加项目」录入面板：画廊标题旁的按钮打开页内抽屉
                        （无页面跳转），支持从 GitHub 导入（一键拉取公开
                        仓库信息）或手动填写；提交生成草稿预览并派发
                        gallery-add-project 事件（见下）
src/i18n.js             中/EN 双语：默认跟随浏览器语言；data-i18n 属性驱动
                        静态文案；语言切换派发 portfolio-language 事件
src/theme.js            深色/浅色：默认跟随系统；手动切换后不再跟随系统；
                        派发 portfolio-theme 事件；同步 <meta theme-color>
src/gallery.js          堆叠卡片画廊核心：
                        - 从 works.js 渲染卡片（预览态只显示项目名称）
                        - 滚轮 / 方向键 / PageUp-Down / Home-End / 触摸滑动 /
                          右侧时间线圆点翻页（hero → 3 张卡片）
                        - 桌面悬停 / 键盘聚焦展开详情，触屏点按展开
                        - 顶部发光进度条 + 01/03 计数器
                        - 派发 portfolio-scroll 事件（0..1）驱动 3D 相机
src/scene.js            Three.js 背景：星空粒子 + 时间隧道圆环 + 霓虹雾；
                        监听 portfolio-scroll 让相机随翻页前飞，
                        监听 portfolio-theme 重新着色；
                        prefers-reduced-motion 时只渲染静态帧，
                        WebGL 不可用时降级（html.webgl-fallback 隐藏 canvas）
src/styles/main.css     全部样式（CSS 变量驱动深浅两套主题）
src/api/client.js       后端接口占位（见下）
src/assets/             三张作品截图（构建时输出为带 hash 的独立文件）
```

### 事件总线（模块间解耦的方式）

| 事件 | 派发者 | 监听者 | payload |
|---|---|---|---|
| `portfolio-language` | i18n.js | gallery.js（重渲染卡片文案）、theme.js（同步按钮） | `'zh' \| 'en'` |
| `portfolio-theme` | theme.js | scene.js（重着色） | `'dark' \| 'light'` |
| `portfolio-scroll` | gallery.js | scene.js（相机前飞） | `0..1` |
| `gallery-add-project` | projectForm.js（表单提交） | 未来后端（见 client.js 注释） | `{ draft }`：`{ sourceMode, githubUrl, name, date, description, sourceUrl, websiteUrl, tags }` |
| `gallery-project-github-lookup` | projectForm.js（GitHub 拉取成功） | 未来后端脚本 | `{ owner, repo, url, metadata }`（GitHub API 原始返回） |

## 添加项目录入面板

画廊标题「作品画廊 / Project Gallery」旁边有一个「添加项目 / Add project」
按钮（默认可见；未来账号体系接入后可通过 `window.setGalleryViewerRole('viewer')`
隐藏）。点击后在当前页打开右侧抽屉，不发生页面跳转：

- **从 GitHub 导入**：粘贴仓库地址 → 点击「获取信息」，面板直接请求
  `https://api.github.com/repos/{owner}/{repo}`（公开接口，无需鉴权），
  把仓库名、简介、主页、topics 自动预填到表单（已手动填写的内容不会被覆盖）。
  状态行会提示等待 / 拉取中 / 成功 / 地址无效 / 仓库不存在 / 网络失败。
- **手动填写**：非 GitHub 项目可直接填写名称、时间、简介、源码链接、
  网站链接、技术标签。
- **预览草稿**：提交表单后在抽屉底部生成项目卡片预览，并派发
  `gallery-add-project` 事件携带全部数据；接入后端后监听该事件调用
  `createWork()` 即可落库（`src/api/client.js` 有接线注释）。
- 无障碍：抽屉打开时背景设为 inert、焦点锁定在抽屉内，Esc / 点击遮罩关闭，
  关闭后焦点回到触发按钮。

## 行为规格（还原自线上单文件版）

- Hero 介绍区是第一屏（用户最初喜欢的版本），滚轮向下进入卡片堆叠。
- 卡片预览态只显示项目名称；悬停/聚焦/点按才展开截图与详情。
- 右上角：语言切换（EN/中，默认浏览器语言）、主题切换（默认系统）。
- 响应式：≤760px 切单列布局；`prefers-reduced-motion` 下关闭 3D 位移与动画。

## 走向动态：以后如何接入后端

`src/api/client.js` 已定义好接口签名与注释（目前抛错占位，不发真实请求）：

- **鉴权**：`register / login / logout / currentUser` → 约定 `POST /api/auth/*`，HttpOnly session cookie。前端在 `VITE_API_BASE` 指向后端域名。
- **作品 CRUD**：`listWorks / createWork / updateWork / deleteWork` → `GET|POST|PATCH|DELETE /api/works`。`Work` 数据结构与 `src/data/works.js` 同构（含 `{zh,en}` 双语字段），gallery 只需把静态 import 换成 `await listWorks()`。
- **图片上传**：`uploadImage(file)` → `POST /api/uploads`（multipart），返回 `{ url }`；建作品时先上传截图，把返回 URL 填入 `imageUrl`。

接入步骤：

1. 实现后端（或用现成 BaaS），按上述约定暴露接口。
2. 在 `.env` 写 `VITE_API_BASE=https://your-api.example.com`。
3. 实现 `src/api/client.js` 里被注释掉的 `request(...)` 调用。
4. 在 `src/gallery.js` 里把 `import { works }` 换成异步加载：
   `const works = await listWorks().catch(() => fallbackWorks)`。
5. 注册/登录 UI 与作品上传表单作为新模块加入（建议 `src/auth/`、`src/admin/`）。

## 部署

实际部署流程（手动）：

1. 本地 `npm run build`，产物在 `dist/`，纯静态文件。
2. 把 `dist/` 的内容推送到仓库的 `gh-pages` 分支（替换该分支的全部内容）。
3. GitHub 仓库 Settings → Pages 里，Source 设为 "Deploy from a branch"，
   Branch 选 `gh-pages` / `/ (root)`。线上地址：
   `https://<user>.github.io/showcaserepo/`。

`vite.config.js` 里 `base: '/showcaserepo/'` 对应 GitHub 项目页面地址。

`.github/workflows/deploy.yml` 只存在于本地源码：它描述的是未来的
GitHub Actions 自动部署（push 到 `main` 自动 `npm ci` → `npm run build`
→ 部署到 Pages），但当前用于推送的 token 缺少 `workflow` 权限，
GitHub 会拒绝 workflow 文件的写入，所以该文件尚未推送到远端。
拿到 `workflow` 权限后再启用，并把 Pages Source 切换为 "GitHub Actions"。

本地预览构建产物：`npm run preview`（http://localhost:4173）。
