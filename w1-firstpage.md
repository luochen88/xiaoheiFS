# W1 首页面迁移报告：Help

## 页面

- 新页面：`frontend/src/views/public/help/index.vue`
- 新组件：`frontend/src/components/business/cms-blocks/help/HelpHeroBlock.vue`、`HelpActionsBlock.vue`、`HelpFaqBlock.vue`、`HelpContactBlock.vue`
- 路由：`frontend/src/router/routes/public/marketing.ts` 已加入 `PublicHelp`（`/help`）

## 功能对照

原页面的 CMS 区块排序、按 `visible` 过滤、缺失区块默认补齐、`content_json` 解析和 `/api/v1/cms/blocks?page=help` 数据流均保留，改为复用 `useSiteStore().fetchBlocks('help')` 缓存。

- `help_hero`：CMS 标题/副标题/徽标/统计/搜索提示保留；搜索框继续驱动 FAQ 搜索。
- `help_actions`：文档、工单、公告、邮件及自定义链接保留；工单按登录态在 `/console/tickets` 与 `/login` 间分流，内部链接使用 `RouterLink`，外链保留 `href`。
- `help_faq`：分类切换、问题/答案关键词过滤、手风琴展开收起、无结果态和清空搜索均保留。
- `help_contact`：渠道列表、CTA 文案及内部/外部链接均保留。

## 规范核对

- 列表页是否使用 `useTable`：本页不是列表页，不涉及分页；FAQ 是 CMS 内容筛选，未引入手写列表分页。
- 颜色是否全部走 CSS 变量：是。页面和四个 block 未出现十六进制、`rgb/rgba` 或 `!important`；表面、边框、渐变、阴影均使用 `--art-*`、`--el-*` 或基于其 `color-mix` 派生。
- 暗色模式验证：静态扫描确认没有固定颜色；逐项检查页面画布（`--default-bg-color`）、内容面（`--default-box-color`）、文字灰阶（`--art-gray-*`）、边框（`--default-border`/`--art-card-border`）和主题色（`--theme-color`）均为 ADP 主题变量，暗色覆盖会自动生效。Element Plus 控件未穿透内部结构。

## 自检结果

- `npx eslint`（Help 页面及 4 个 Help blocks）：通过。
- `npx stylelint --ignore-path /dev/null`（Help 页面及 4 个 Help blocks）：通过。
- `grep`（Ant Design / 硬编码颜色 / `!important`）：通过，目标目录无匹配。
- `git diff --check`：通过。
- `npm run build -- --config /tmp/w1-vite.config.ts`：通过；临时配置仅把 Vite 缓存目录移到 `/tmp`，用于绕过共享 `node_modules` 只读限制，不改变应用构建配置。
- `npx vue-tsc --noEmit`：未通过，现有工作树存在与本页面无关的既有错误（例如 `RichTextEditor`、管理端页面、旧 `src/pages/public/Help.vue`、共享路由类型和缺失 mock/vitest）。新迁移文件未出现在错误清单中。

## 路径说明

要求的 `/opt/xiaoheiFS/.adp-work/out/w1-firstpage.md` 不在当前沙箱可写根，写入被拒绝；报告暂存于工作区根 `w1-firstpage.md`。

## 后续状态

首屏审核记录完成后已按要求继续迁移其余页面；最终状态见工作区根 `DONE-W1.md`。
