# W1 公开营销站迁移完成报告

## 变更范围

- 页面：`home`、`products`、`help`、`posts/index`、`posts/detail`、`maintenance`、`not-found`。
- 外壳：公开站桌面/移动导航、移动抽屉、主题切换、购物车数量、登录态入口、CMS 页脚、站点名称和 logo 白标。
- CMS 组件：迁到 `frontend/src/components/business/cms-blocks/**`，包含 Home、Products、Help 与 Footer 共 14 个 block。
- 路由：只修改 `frontend/src/router/routes/public/marketing.ts`；四个文章列表继续复用同一页面，以 `meta.categoryKey/title/subtitle` 区分。
- 品牌组件：`DefaultLogoMark.vue`、`SiteLogoMedia.vue` 改为主题变量驱动。
- 死代码：删除 `frontend/src/components/cms/preview/**` 的 10 个预览组件。

## 功能点对照

| 页面/模块 | 原交互与数据流 | 迁移后位置 |
|---|---|---|
| Home | CMS 排序、可见性、`content_json`、默认区块；打字标题、统计、特性卡片倾斜、产品场景、CTA | `views/public/home/index.vue` 与 `cms-blocks/home/**` |
| Products | CMS 区块合并；场景选择、规格计算、方案推荐、价格卡、对比表、CTA | `views/public/products/index.vue` 与 `cms-blocks/products/**` |
| Help | CMS 区块；FAQ 搜索/分类/折叠；文档、工单、公告、邮件和登录态分流 | `views/public/help/index.vue` 与 `cms-blocks/help/**` |
| PostsList | 四分类复用；CMS hero/resources；置顶文章；搜索、排序、刷新、列显隐、分页 | `views/public/posts/index.vue`，由 `useTable + ArtTable + ArtTableHeader + ArtSearchBar` 实现 |
| PostDetail | slug 加载与缓存、面包屑、封面/正文、阅读进度、目录、复制/微博分享、标签、上下篇、相关推荐、空态 | `views/public/posts/detail.vue` |
| Maintenance | CMS/prop 维护文案和返回首页 | `views/public/maintenance/index.vue` |
| NotFound | 返回上一页与首页 | `views/public/not-found/index.vue` |
| PublicLayout | `site.headerNavItems` 多语言导航；内外链；移动抽屉；主题；登录态；购物车；白标；CMS footer | `views/public/layout/index.vue` 与 `cms-blocks/FooterBlock.vue` |

## 规范自检

- 目标文件 Ant Design 标签/依赖扫描：0 个匹配。
- 目标文件十六进制、`rgb/rgba` 硬编码颜色扫描：0 个匹配。
- 目标文件 `!important` 扫描：0 个匹配。
- `npx eslint`（全部 W1 目标文件）：通过。
- `npx stylelint --ignore-path /dev/null`（全部 W1 Vue 目标文件）：通过。
- `git diff --check`：通过。
- `npx vue-tsc --noEmit`：全仓未通过，但输出中没有 W1 新目标路径；错误来自既有共享组件、管理端、旧页面、路由类型和测试依赖。
- `npm run lint`：全仓未通过，共 41,713 条既有错误，主要是本次范围外文件的 Prettier/ESLint 基线问题；W1 目标已由上述定向 ESLint 验证。
- `npm run build -- --config /tmp/w1-vite.config.ts`：通过，4,940 个模块构建完成。临时配置只把 Vite 缓存写入 `/tmp`，避免共享 `frontend/node_modules` 只读导致 `.vite-temp` 写入失败。
- 开发服务器/截图：沙箱禁止监听端口，Vite 报 `listen EPERM 0.0.0.0:5173`，因此无法完成浏览器亮暗主题截图。已通过双主题变量审查、无固定颜色扫描和生产构建验证；页面不再强制暗色。

## 首页面审核记录

按要求先完成 Help 并写报告。指定路径 `/opt/xiaoheiFS/.adp-work/out/w1-firstpage.md` 不在沙箱可写根，写入被拒绝；同内容保存在工作区根 `w1-firstpage.md`。

## 遗留与共享改动

- `NEEDS.md` 记录了 `App.vue` 维护页入口切换，以及 W7 管理端 CMS Blocks 切换到新 business 目录后删除旧 `components/cms/blocks/**`。
- `frontend/node_modules` 是用户预置软链，保持未跟踪，未安装或修改依赖。
- 无法提交：Git worktree 元数据位于只读的 `/opt/xiaoheiFS/.git/worktrees/w1`，`git commit` 创建 `index.lock` 时返回只读文件系统。代码和报告均已保留在工作区。
