# 前端全站 Art Design Pro 改造方案

> 状态：待执行
> 制定日期：2026-08-05
> 唯一风格标准：[`docs/frontend/adp-conventions.md`](./adp-conventions.md)（下称**规范圣经**）
> 执行方式：8 个 codex worker 并行改造 + 2 个 codex reviewer 审核 + Claude 负责地基/协调/合并

---

## 0. 决策记录

| # | 决策 | 内容 |
|---|---|---|
| D1 | **保留 `frontend/`，废弃 `adminweb/`** | `frontend/` 成为全站唯一 SPA。`adminweb/` 在迁移完成后整目录删除。 |
| D2 | **模板版本** | Art Design Pro **v3.0.2**（GitHub `Daymychen/art-design-pro`，2026-03-15 发布）。已下载到 `.adp-template/`（gitignore）。旧的 `adminweb/art-design-pro/` v3.0.1 快照**立即删除**。 |
| D3 | **UI 库切换** | Ant Design Vue → **Element Plus**（ADP 自带）。ECharts 5 → 6。图标 `@ant-design/icons-vue` → Iconify + `@element-plus/icons-vue`。 |
| D4 | **改造范围 = 全部前端** | 公开营销站 + 登录注册 + 购物车 + 用户控制台 + 管理后台 + 安装向导，一个不留。 |
| D5 | **功能不变**，唯一例外见 §7 | 购物车公开化：未登录可浏览选购，结算时才要求登录。 |
| D6 | **包管理器保持 npm** | CI / Docker / `script/build-*.sh` 全部依赖 `frontend/package-lock.json` + `npm ci`。保持 npm 意味着**发布流水线零改动**——这是 D1 的最大红利。 |
| D7 | **路由保持 history 模式** | 与现状一致，后端 `NoRoute` 回落 `index.html` 即可。**不采用** ADP 默认的 hash 模式（那会要求后端拼 `#/` 重定向）。 |

### D1 的代价（已知并接受）

`adminweb/` 中已有约 **9 万行**代码，其中 21 个管理页已符合 ADP 规范（`ArtTable`/`ArtSearchBar`/`ArtTableHeader`）。删除意味着这部分要在 `frontend/` 重做。

**缓解措施（强制）**：迁移期间 `adminweb/` **暂不删除**，作为**移植素材**保留。改造 `frontend/src/pages/admin/*` 时，worker 必须先看 `adminweb/src/views/` 下的对应页面——那里已经是 Element Plus + Art 组件的成品，直接搬运比从 Ant Design 版本重新推导快 3-5 倍。对照表见 §5.5。全部页面验收通过后，由 Claude 在收尾阶段一次性删除 `adminweb/`。

---

## 1. 现状

### 1.1 `frontend/`（保留，改造对象）

- Vue 3.4 + Vite 5 + TS + Pinia 2 + **Ant Design Vue 4.2.1** + ECharts 5
- **168 个文件 / 约 65,800 行**
- 无预处理器，纯 CSS：`src/styles/{theme.css(775行), console-dark.css(389), admin.css(78)}`
- `theme.css` 里有约 90 个自定义 CSS 变量 + 玻璃拟态/渐变/动画工具类，**全部要换成 `--art-*` 体系**
- 三个各自为政的 `<a-config-provider>`：`UserLayout`（亮/暗切换）、`PublicLayout`（强制暗色）、`AdminLayout`（强制亮色）→ 统一为 ADP 单一主题系统
- 441 处 `:deep()` 穿透改 antd 内部样式、72 处 `!important`、457 处内联 `style=`——**这些是本次改造要清掉的技术债**
- `i18n` 是假的：`$t = () => ""`，35 处调用靠 `$t("x") || "中文"` 兜底
- **无 lint、无 test、无 typecheck**（`package.json` 只有 `dev`/`build`/`preview`）
- 死代码：`components/cms/preview/*`（10 个全未引用）、`StatCards.vue`、`EditorToolbar.vue`、`admin/settings/PaymentPlugins.vue`
- 未使用却在 `package.json` 里的依赖：`ckeditor5`、`@ckeditor/ckeditor5-vue`、`tinymce`、`@tinymce/tinymce-vue`、`quill`、`@vueup/vue-quill`（连同 `vite.config.ts` 里给它们预留的 3 个 manualChunks 和 `public/langs/zh_CN.js`）→ **全部删除**

### 1.2 管理端的特殊结构（重点）

管理后台**不在路由表里**。因为 admin 路径可由用户配置（默认 `admin`），现状是：

```
/:pathMatch(.*)*  →  pages/public/DynamicRoute.vue
                     ↓ POST /api/v1/check-admin-path 校验首段
                     ↓ components/DynamicAdminWrapper.vue
                     ↓ 硬编码 routeMap：38 个子路径 → defineAsyncComponent
```

改造后**必须**换成 ADP 的动态路由注册（`RouteRegistry.register` + `router.addRoute`），即：运行时拿到 admin_path 后把管理路由挂到该前缀下。这是本次改造中**架构层面最大的收益**——硬编码的 38 项 routeMap 消失。

### 1.3 `adminweb/`（迁移素材，最终删除）

ADP v3.0.1 已落地，415 文件 / 90,257 行。其中 234 个文件与模板逐字节相同。可直接复用的成品见 §5.5。

### 1.4 后端服务方式（`backend/internal/adapter/http/router.go`）

当前：`./static`（frontend 构建产物）+ `./static-admin`（adminweb 构建产物），按 `/install`、`/console`、`/<admin_path>` 分流，并对 `static-admin` 发 307 重定向到 `#/` 哈希地址。

**改造后简化为单目录**：全部走 `./static`，`NoRoute` 回落 `index.html`。需要改：
- `router.go`：`resolveSPATarget` / `spaIndexFallbackHandler` / `buildAdminSPARedirectTarget` / `buildUserConsoleSPARedirectTarget` 全部删除或大幅简化
- `backend/internal/testutilhttp/spa_static_test.go`：**契约测试，必须同步更新**（当前断言了精确的 `Location` 和 `Cache-Control`）
- 保留：`/uploads`、`/api/`、`/admin/api/` 前缀排除；`index.html` → `no-store`；`assets/*-<hash>.*` → `immutable`；路径穿越防护；安装门禁 `installGateMiddleware`

> ⚠️ 这部分由 **Claude 在收尾阶段亲自做**，worker 不得改 `backend/`。

---

## 2. 目标架构

```
frontend/                        ← 唯一 SPA，npm，history 路由
├── src/
│   ├── assets/styles/           ← [模板] ADP 样式体系（tailwind.css 变量 + SCSS mixin）
│   ├── components/
│   │   ├── core/                ← [模板] 全部 Art* 组件，不改
│   │   └── business/            ← [业务] CMS 区块、图表包装等本项目组件
│   ├── config/  enums/  directives/  hooks/      ← [模板]
│   ├── router/
│   │   ├── core/                ← [模板] RouteRegistry / ComponentLoader / MenuProcessor
│   │   ├── guards/              ← [模板+业务] 双 realm 鉴权、安装门禁、动态 admin_path
│   │   └── modules/             ← [业务] 路由模块（菜单来源）
│   ├── store/modules/           ← [模板 setting/worktab/menu/table] + [业务 15 个现有 store]
│   ├── services/                ← [业务] 保留：http/user/admin/types/sse/adminPath
│   └── views/                   ← [业务] 全部页面（从 pages/ 迁移改名）
└── .adp-template/  → 仓库根 .adp-template/（gitignore，参考用）
```

### 2.1 三个外壳（Shell）

| Shell | 覆盖路由 | 说明 |
|---|---|---|
| **PublicShell** | `/`, `/products`, `/help`, `/docs`, `/announcements`, `/activities`, `/tutorials`, `/:category/:slug`, `/cart`, `/buy` | 营销站外壳（顶部导航 + Footer，无侧边栏）。**不是** ADP 的后台布局，但**必须**只用 `--art-*` 变量 + Element Plus 组件，与后台同一套色板/圆角/阴影/字体/暗色。 |
| **ConsoleShell** | `/console/*` | 直接复用 ADP 布局 `views/index/index.vue`（侧边栏 + 顶栏 + 多标签页 + 面包屑）。菜单来自 `router/modules/console/*`。 |
| **AdminShell** | `/<admin_path>/*`（运行时注册） | 同样复用 ADP 布局，菜单来自 `router/modules/admin/*`，按 `meta.authList[].authMark` 做权限裁剪。 |
| （无外壳） | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/install`, 403/404/500 | 全屏页，用 ADP 登录页视觉家族（见规范圣经 §13）。 |

### 2.2 双 realm 菜单机制（Phase 0 交付，worker 直接用）

ADP 的 `menuStore.menuList` 是单一菜单源。本项目有两套菜单（用户控制台 / 管理后台），机制如下：

```ts
// router/core/MenuProcessor.ts 扩展
type Realm = 'console' | 'admin'
function resolveRealm(path: string): Realm | null
// 守卫里：进入 /console/* → setMenuList(consoleMenus)
//          进入 /<admin_path>/* → setMenuList(filterByAuth(adminMenus, permissions))
```

两套 realm 各自持有独立 token（沿用现有 `stores/auth.ts` 与 `stores/adminAuth.ts`），互不干扰。

---

## 3. 功能不变量（验收基线）

改造**不得**丢失以下能力。每个 worker 在自己负责的页面上逐条核对：

1. **管理端动态路径**：admin 路径由后端 `admin_path` 设置决定，前端经 `POST /api/v1/check-admin-path` 校验并缓存（`services/adminPath.ts`）。
2. **管理端 2FA 门禁**：HTTP 拦截器捕获 `403 + admin_2fa_required|admin_2fa_bind_required` → 置 `adminAuth.setMfaGateState` → 外壳弹出不可关闭的绑定/验证弹窗。
3. **实名门禁**：`403 + /api + "real name required"` → 单例确认框引导去 `/console/realname`。
4. **401 处理**：登出对应 realm + 跳登录页并带 `redirect`；登录接口自身豁免。
5. **模拟登录（impersonation）**：`/console#impersonate_token=xxx` → 写入用户 token → 清理 hash。
6. **安装门禁**：未安装时导航跳 `/install`；`installStore.fetchStatus()` 只拉一次。
7. **维护模式**：`site.maintenanceMode` 时全站替换为维护页。
8. **SSE**：订单详情 `/api/v1/orders/{id}/events`、探针详情。手写 fetch+ReadableStream 客户端（`services/sse.ts`，因为 `EventSource` 带不了 Authorization），含 `Last-Event-ID` 断点续传与退避重连。
9. **CMS 驱动的公开站**：首页/产品页/帮助页由后端区块（block）数据渲染；导航项来自 `site_nav_items` 设置并按语言过滤。
10. **站点白标**：`siteName` / `logoUrl` / `faviconUrl` 动态注入（含 `document.title` 与 favicon）。
11. **懒加载 chunk 失效自愈**：`router.onError` 捕获 `Failed to fetch dynamically imported module` → 提示刷新（去重）。
12. **字段命名兼容**：后端返回混用 `snake_case` / `camelCase` / Go 的 `PascalCase`，现有代码用 `row.id ?? row.ID` 兜底，**迁移时不要"顺手规范化"**。
13. **权限裁剪**：管理端菜单/按钮按权限码显示，超管 `*` 短路。
14. **输入限制**：`src/constants/inputLimits.ts` 集中的 maxlength 继续生效。

---

## 4. 阶段划分

| 阶段 | 负责人 | 内容 | 出口条件 | 状态 |
|---|---|---|---|---|
| **P0 地基** | Claude（串行） | §5.1 | `npm run build` + `npm run typecheck` 绿 | ✅ 完成 |
| **P1 并行改造** | W1–W8（codex） | §5.2 | 各自 DoD 全绿 | 🔄 进行中 |
| **P2 审核** | R1/R2（codex） | §6 | 无 blocker | 🔄 进行中 |
| **P3 合并** | Claude | §8 | 全量 build 绿 | ⏳ 待开始 |
| **P4 收尾** | Claude | §9 | 删 adminweb/antd、后端单目录、CI/文档/宪法 | 🔄 部分完成 |

### P0 实际结果（与计划的偏差）

- **类型检查门禁**：基线原有 **160 个** `vue-tsc` 报错，会让 DoD 的类型门禁失效。已修到 **0**：
  待删目录（`src/pages`、`src/layouts`、旧组件）移出 `tsconfig` 检查范围；补回漏拷的
  `src/env.d.ts`；`AppRouteRecord` 递归类型被 Vue `UnwrapRef` 改形的问题用 `as Ref<...>` 解决；
  `ArtTable` 改用 `TableInstance`；`ArtForm`/`ArtSearchBar` 的对象 `default` 改成工厂函数；
  按不变量 #12 把后端真实返回的 PascalCase 别名补进 `services/types.ts`。
- **组件自动注册**：`unplugin-vue-components` 默认会同时扫到旧的 Ant Design 组件并**优先注册**，
  导致新组件被静默忽略。已限定只扫 `components/{core,business}`。
- **样板页**：未单独产出。规范圣经 §1 已含模板样板的逐字骨架，worker 直接照抄；
  改为用「第一页自查 + reviewer 优先审第一页」来兜底系统性问题。
- **环境变量**：不使用 `.env`（仓库根 `.gitignore` 全局吞掉 `.env*`），改由 `vite define` 内联。

### P4 已完成的部分

- ✅ **后端单目录化**：`router.go` 421 → 252 行，删掉 `static-admin` 分流与全部 `#/` 重定向；
  契约测试先改后实现（宪法第 V 条），5 个 SPA 测试全过，并新增了真正的路径穿越测试。
- ✅ **宪法修订** 1.0.0 → 1.1.0：前端 UI 库 Ant Design Vue → Element Plus (Art Design Pro)，
  含 Sync Impact Report。
- ✅ **文档**：README、AGENTS.md、CONTRIBUTING.md、`frontend/CLAUDE.md`、
  `docs/admin-path-validation.md` 全部对齐新架构。
- ✅ **Docker**：`node:20-*` 是浮动 tag，可能低于 Vite 7 要求的 20.19，已固定到 22（与 CI 一致）。
- ⏳ 待做：删 `adminweb/`、删 antd 依赖与 `src/pages`/`src/layouts`/旧组件、清理死代码。

**P1 未开始前 worker 不得启动**——地基不稳会导致 8 份返工。

---

## 5. 工作分解

### 5.1 P0 地基（Claude，串行，不可并行）

| 步骤 | 内容 |
|---|---|
| 0.1 | 提交当前 WIP（backend 改动 + adminweb `user-console` 7000 行未跟踪代码），确保可回溯；`.gocache/` 加入 `.gitignore` |
| 0.2 | 删除 `adminweb/art-design-pro/`；v3.0.2 模板落到 `.adp-template/` 并写入 `.gitignore` |
| 0.3 | `frontend/package.json`：加 ADP 依赖（element-plus、@element-plus/icons-vue、@iconify/vue、tailwindcss v4 + @tailwindcss/vite、sass、unplugin-auto-import、unplugin-vue-components、unplugin-element-plus、@vueuse/core、pinia-plugin-persistedstate、echarts 6、mitt、nprogress、ohash、vue-i18n、vue-draggable-plus、xlsx、file-saver、crypto-js、highlight.js、qrcode.vue、@wangeditor/*）；**antd 暂留**；删 ckeditor/tinymce/quill 六个依赖 |
| 0.4 | `vite.config.ts`：ADP 插件链 + 别名（`@views/@imgs/@icons/@utils/@stores/@styles`）+ SCSS `additionalData` 自动注入 + `optimizeDeps` + 保留现有 dev proxy（`/api`、`/admin/api`、`/sdk`、`/uploads` → :8080）+ 删除 3 个无用 manualChunks |
| 0.5 | 拷入模板基础设施：`assets/styles/**`、`components/core/**`、`hooks/**`、`config/**`、`enums/**`、`directives/**`、`utils/{table,navigation,storage,ui,form,sys}/**`、`store/modules/{setting,worktab,menu,table}`、`types/**`、`router/core/**`、`views/{index,exception,result}/**` |
| 0.6 | `main.ts` 改造：`initializeTheme()`、指令注册、i18n、持久化插件；**移除假 `$t`** 并接真 `vue-i18n`（保留中文兜底文案） |
| 0.7 | 路由重构：history 模式 + 三个 Shell + 双 realm 菜单机制 + 动态 admin_path 注册（替换 `DynamicRoute.vue` / `DynamicAdminWrapper.vue`）+ 守卫迁移（§3 的 1/5/6/7/11） |
| 0.8 | `services/http.ts`：antd `message`/`Modal`/`notification` → `ElMessage`/`ElMessageBox`/`ElNotification`（**这是全局共享文件，只此一次改动**） |
| 0.9 | 质量门禁：从模板搬 `eslint.config.mjs`、`.prettierrc`、`.stylelintrc.cjs`；`package.json` 加 `typecheck`(`vue-tsc --noEmit`)、`lint`、`fix`、`lint:stylelint` |
| 0.10 | **两个样板页**（worker 的抄写模板）：`views/console/orders/index.vue`（列表页：`useTable` + `ArtTable` + `ArtSearchBar` + `ArtTableHeader`）与 `views/public/help/index.vue`（公开页：ADP 令牌 + 自定义营销排版）。二者必须双主题正确。 |
| 0.11 | 建 8 个 git worktree + 软链共享 `node_modules`（省 4GB） |

### 5.2 P1 切片（8 个 worker，文件集互不相交）

> 目录约定：`src/pages/**` → `src/views/**`（ADP 的 `ComponentLoader` 用 `import.meta.glob('../../views/**/*.vue')`，路径必须是 `views`）。

| Worker | 主题 | 页面 / 文件 | 规模 |
|---|---|---|---|
| **W1** | 公开营销站 | `public/{Home,Products,Help,PostsList,PostDetail,NotFound,Maintenance}` + `components/cms/blocks/**`（home 4 + products 5 + help 4 + Footer）+ `SiteLogoMedia`/`DefaultLogoMark`。**删除** `components/cms/preview/**`(10 个死文件) | ~8,600 行 |
| **W2** | 认证 + 安装 | `auth/{Login,Register,ForgotPassword,ResetPassword}` + `admin/{Login,ForgotPassword,ResetPassword}` + `public/install/{InstallWizard,DbStep,SiteStep,AdminStep,DoneStep}` | ~3,900 行 |
| **W3** | 控制台·资源 | `console/{Dashboard,VpsList,VpsDetail}` + `components/Charts/**` → ADP 图表（`useChart`/`useChartOps` 主题感知配色） | ~6,900 行 |
| **W4** | 控制台·交易 **+ 购物车公开化(§7)** | `console/{BuyVps,Cart,Orders,OrderDetail,Billing}` + `PriceCalculator` + `stores/cart.ts` 改造 | ~5,100 行 |
| **W5** | 控制台·账户 | `console/{Profile,ApiKeys,Realname,Tickets,TicketDetail}` | ~4,200 行 |
| **W6** | 管理·交易与资源 | `admin/{Dashboard,RevenueAnalytics,Orders,WalletOrders,Vps,Probes,ProbeDetail}` | ~6,000 行 |
| **W7** | 管理·用户与内容 | `admin/{Users,UserTiers,Coupons,Admins,PermissionGroups,Profile,Catalog,Systems,Tickets,TicketDetail,Audit,Debug,Automation,ScheduledTasks}` + `admin/cms/**`(5) | ~11,000 行 |
| **W8** | 管理·配置 | `admin/settings/**`(13) + `admin/realname/**`(3) + `JsonSchemaForm`/`JsonSchemaField` + `RichTextEditor/**` → `ArtWangEditor` | ~9,000 行 |

**通用组件的归属**（避免撞车）：`ProTable`/`FilterBar`/`StatusTag`/`VpsStatusTag`/`OrderStatusBadge`/`ConfirmAction`/`InlineEdit`/`ErrorBoundary` 由 **Claude 在 P0 处理**——`ProTable` 与 `FilterBar` 直接被 `ArtTable` + `ArtTableHeader` + `ArtSearchBar` 取代并删除，其余改造为 Element Plus 版本放进 `components/business/`。**worker 不得改这些文件**。

### 5.3 每页 DoD（Definition of Done）

一个页面算完成，必须**全部**满足：

1. 该文件中 `grep -c "<a-\|ant-design-vue\|@ant-design/icons-vue"` **等于 0**
2. 列表页使用 `useTable` + `ArtTable` + `ArtTableHeader`（`v-model:columns`）+ `ArtSearchBar`；**不得**手写 fetch/分页
3. 页面根元素 `class="xxx-page art-full-height"`（全高页），或按规范圣经 §1d 的非全高写法
4. **零硬编码颜色**：不出现 `#rrggbb` / `rgb(` / `rgba(`（阴影与遮罩用 mixin），全部走 `--art-*` 或 `--el-*` 变量
5. 亮色 + 暗色**双主题目视检查**通过（截图或明确说明已验证）
6. 无 `!important`，无穿透 Element Plus 内部结构的 `:deep()`（除非规范圣经明确允许）
7. **功能等价**：对照原 Ant Design 版本逐条列出交互点（按钮/筛选/分页/弹窗/校验/空态/加载/错误提示），并声明已覆盖
8. `npx vue-tsc --noEmit` 通过；`npm run lint` 与 `npm run lint:stylelint` 无 error
9. 路由已在 `router/modules/**` 注册，`meta` 完整（`title/icon/keepAlive/authList/isHide`），菜单显示正确
10. 组件 `defineOptions({ name: 'XxxYyy' })` 已声明（多标签页 keep-alive 缓存依赖它）

### 5.4 共享文件协议（**违反 = 直接打回**）

以下文件**任何 worker 都不得修改**，它们是冲突高发区：

```
frontend/package.json          frontend/package-lock.json
frontend/vite.config.ts        frontend/tsconfig.json
frontend/src/main.ts           frontend/src/App.vue
frontend/src/router/index.ts   frontend/src/router/core/**   frontend/src/router/guards/**
frontend/src/services/http.ts  frontend/src/services/navigate.ts
frontend/src/assets/styles/**  frontend/src/components/core/**
frontend/src/store/modules/{setting,worktab,menu,table}.ts
backend/**                     docker/**   script/**   .github/**
```

需要改动其中任何一个时：**不要改**，在自己 worktree 根目录追加一行到 `NEEDS.md`：

```
[W3] src/services/user.ts 需要新增 getVpsMetrics(id, range) —— 原因：监控标签页原来内联了 axios 调用
```

Claude 每轮合并时统一处理 `NEEDS.md`。

**可以改**的：自己切片内的 `src/views/**`、自己新建的 `src/components/business/**`、自己切片专属的 `src/router/modules/<自己的模块>.ts`。

`src/services/{user,admin}.ts`（API 封装）与 `src/services/types.ts` 属于**追加型共享**：只允许**追加**新函数/新类型，不得修改或删除已有导出；若两人追加冲突，Claude 合并时手工解决。

### 5.5 adminweb 成品对照表（W6/W7/W8 必查）

改造管理端页面前，**先看这里有没有现成的**。`adminweb/src/views/` 下的代码已是 Element Plus + Art 组件，可直接搬运（注意改 import 路径、改 API 调用为 `frontend/src/services/admin.ts` 的封装）。

| frontend 页面 | adminweb 对应成品 | 是否已符合 ADP 规范 |
|---|---|---|
| `admin/Orders.vue` | `views/order/review/` | ✅ 完全符合（含 `order-search.vue`） |
| `admin/Vps.vue` | `views/vps/`（+`modules/vps-search.vue`） | ✅ |
| `admin/WalletOrders.vue` | `views/wallet/orders/` | ✅ |
| `admin/Tickets.vue` `TicketDetail.vue` | `views/ticket/{list,detail}` | ✅ |
| `admin/Audit.vue` | `views/audit/` | ✅ |
| `admin/ScheduledTasks.vue` | `views/ops/scheduled-tasks/` | ✅ |
| `admin/Probes.vue` `ProbeDetail.vue` | `views/probe/{list,detail}` | ✅ |
| `admin/realname/**` | `views/realname/{config,providers,records}` | ✅ |
| `admin/cms/**` | `views/cms/{blocks,categories,nav-items,posts,uploads}` | ✅ |
| `admin/Systems.vue` | `views/systems/` | ✅ |
| `admin/Users.vue` | `views/system/user/` | ✅（模板同名页深度改造版，1039 行 diff） |
| `admin/Admins.vue` | `views/system/admin/` | ✅ |
| `admin/PermissionGroups.vue` | `views/system/permission-group/` | ✅ |
| `admin/UserTiers.vue` | `views/system/user-tiers/` | ✅ |
| `admin/Profile.vue` | `views/system/profile/` | ✅ |
| `admin/Dashboard.vue` | `views/dashboard/overview/` | ⚠️ 未用 Art 组件，需重写 |
| `admin/RevenueAnalytics.vue` | `views/dashboard/revenue-analytics/` | ⚠️ 未用 Art 组件，需重写 |
| `admin/Catalog.vue` | `views/catalog/` | ⚠️ 半符合（有 `art-full-height` 但表格是裸 `ElTable`），需补齐 |
| `admin/Coupons.vue` | `views/marketing/coupons/` | ❌ 0 个 Art 组件，重写 |
| `admin/Automation.vue` | `views/automation/` | ❌ 重写 |
| `admin/Debug.vue` | `views/debug/` | ❌ 重写 |
| `admin/settings/**` | `views/settings/**`（13 个同名页） | ⚠️ 596 个裸 `<El*>`，仅 `api-keys` 用了 ArtTable；结构可抄，表格/搜索需按规范补齐 |
| `console/**` | `views/user-console/**`（7000 行） | ❌ 自成一套 mini 设计系统，**只抄业务逻辑，不抄样式与外壳** |
| `public/install/**` | `views/install/` | ❌ 0 个 Art 组件，重写 |

**注意**：`adminweb` 的 API 层是 `src/api/admin.ts`(2574 行) 与 `src/api/console-user.ts`(1108 行)，与 `frontend/src/services/{admin,user}.ts` 函数签名不同。搬运页面时 **API 调用必须换回 frontend 的封装**，不要连 API 层一起搬。

---

## 6. 审核（2 个 reviewer）

| Reviewer | 覆盖 | 检查项 |
|---|---|---|
| **R1** | W1–W5（用户侧） | DoD 全 10 条 + §3 功能不变量 1/3/4/5/6/7/8/9/10/11 |
| **R2** | W6–W8（管理侧） | DoD 全 10 条 + §3 功能不变量 1/2/4/8/12/13 |

审核方式：`codex exec review`（或 `codex exec` 读 diff）。产出 `REVIEW-Wn.md`，每条问题标 `blocker` / `major` / `minor`，含 `文件:行号` 与修复建议。**只有 blocker 为 0 才允许合并**。

自动化前置检查（reviewer 先跑，不通过直接打回，不浪费模型 token）：

```bash
# 1. 残留 antd
grep -rn "<a-\|ant-design-vue\|@ant-design/icons-vue" src/views/<切片>/ && echo FAIL
# 2. 硬编码颜色
grep -rniE "#[0-9a-f]{3,8}\b|rgba?\(" src/views/<切片>/ | grep -v "art-\|el-" && echo FAIL
# 3. !important
grep -rn "!important" src/views/<切片>/ && echo FAIL
# 4. 手写分页（应该用 useTable）
grep -rln "currentPage\s*=\|pageSize\s*=" src/views/<切片>/ | xargs grep -L "useTable" && echo WARN
# 5. 类型与静态检查
npx vue-tsc --noEmit && npm run lint
```

---

## 7. 唯一的功能变更：购物车公开化（W4）

**需求**：未登录用户可以浏览商品、配置规格、加入购物车、查看购物车；**点击结算/下单时**才要求登录，登录后回到结算流程且购物车内容不丢。

**实现要点**：

1. **路由**：`/buy`、`/cart` 从 `meta.requiresUser: true` 移除，挂到 **PublicShell** 下。
2. **游客购物车**：`stores/cart.ts` 增加游客模式——未登录时购物车存 `localStorage`（`pinia-plugin-persistedstate`），数据结构与服务端购物车项对齐（`packageId`/`spec`/`qty`/`cycle`）。
3. **合并策略**：登录成功后（`auth.login` 与模拟登录都要覆盖）调用一次 `mergeGuestCart()`：把本地项逐条 POST 到服务端购物车，成功后清空本地。**合并规则**：同 `packageId + spec` 相加数量；失败项保留在本地并提示，不静默丢弃。
4. **结算拦截**：结算按钮 → 未登录则 `router.push({name:'login', query:{redirect:'/cart'}})`；登录成功回跳后自动触发合并并停在购物车。
5. **价格计算**：`PriceCalculator` 与套餐/周期价格接口若需鉴权，改为公开只读接口；**若后端不支持，写进 `NEEDS.md`，不要自己改后端**。
6. **购物车角标**：`PublicShell` 顶栏也要显示购物车数量（现状只有 `UserLayout` 有）。
7. **验收**：无痕窗口 → 浏览商品 → 加购 3 件 → 刷新页面（仍在）→ 点结算 → 跳登录 → 登录 → 回到购物车且 3 件都在且与服务端一致。

---

## 8. 合并流程（Claude）

1. worker 在自己的 worktree 分支 `adp/w<N>-<主题>` 上提交，Conventional Commits（`feat(frontend): ...` / `refactor(frontend): ...`）
2. reviewer 产出 `REVIEW-W<N>.md`；blocker 全清后
3. Claude 按 **W1 → W2 → W5 → W3 → W4 → W6 → W7 → W8** 顺序合入 `feat/adp-frontend`（先合小的、依赖少的，尽早暴露地基问题）
4. 每合入一个：`npm run typecheck && npm run lint && npm run build` 必须绿，不绿就地修
5. 统一处理各 worktree 的 `NEEDS.md`

---

## 9. P4 收尾（Claude）

| # | 动作 |
|---|---|
| 9.1 | 全站 `grep -rn "ant-design-vue\|<a-" frontend/src` 归零后，从 `package.json` 删除 `ant-design-vue` + `@ant-design/icons-vue`，删 `vendor-antd` chunk |
| 9.2 | 删除 `frontend/src/styles/{theme.css,console-dark.css,admin.css}` 与全部旧布局 `src/layouts/**` |
| 9.3 | **删除 `adminweb/` 整个目录** |
| 9.4 | 后端单目录化：`router.go` 去掉 `static-admin` 分流与哈希重定向；同步改 `spa_static_test.go`；`go test ./...` 绿 |
| 9.5 | `docker/Dockerfile*`、`script/build-*.{sh,bat}`、`.github/workflows/*` 复核（因保留 npm + `frontend/`，预期**零改动**，但要确认 node 版本 ≥ 20.19） |
| 9.6 | 文档：更新 `README.md`（技术栈 Ant Design Vue → Element Plus / Art Design Pro，去掉"不打包 adminweb"的说明）、`AGENTS.md`（手工区块内补充前端规范与 adminweb 移除）、`frontend/CLAUDE.md`、`docs/admin-path-validation.md`（引用的文件路径已变） |
| 9.7 | **宪法修订**：`constitution.md` 的 Technology Standards → Frontend 表把 `UI Library: Ant Design Vue` 改为 `Element Plus (Art Design Pro)`。按其修订程序执行：书面理由 + 影响面 + 版本号递增（MINOR）+ 更新 last amended date + Sync Impact Report |
| 9.8 | 清理死代码：`components/cms/preview/**`、`StatCards.vue`、`EditorToolbar.vue`、`PaymentPlugins.vue`、`public/langs/zh_CN.js`、`stores/__tests__/revenueAnalytics.spec.ts`（vitest 未安装，跑不了——要么装 vitest 让它能跑，要么删） |

---

## 10. 风险登记

| 风险 | 影响 | 应对 |
|---|---|---|
| 地基（P0）设计错误 | 8 份返工 | P0 必须先跑通 2 个样板页并自审；worker 一律照抄样板 |
| `services/user.ts`/`admin.ts` 并发追加冲突 | 合并痛苦 | 只允许追加、禁止修改既有导出；冲突由 Claude 手工解 |
| 暗色模式漏改 | 全站观感割裂 | DoD 第 4、5 条；reviewer 跑硬编码颜色 grep |
| ECharts 5→6 破坏性变更 | 图表白屏 | W3 先迁一个图表验证，再推广；ADP 已封装 `useChart` |
| 动态 admin_path + 动态路由注册出错 | 管理后台 404 | P0 单独验证：改 admin_path 设置后能正常进后台；保留 `check-admin-path` 校验与缓存 |
| 后端单目录化改坏 SPA 路由 | 线上白屏 | `spa_static_test.go` 是契约测试，先改测试再改实现（TDD，宪法第 V 条） |
| adminweb 提前删除导致素材丢失 | 返工 | **P4 之前不许删**；已提交入库可随时找回 |
| `frontend/dist`、`static-admin/` 是脏的旧产物 | 部署错版本 | 收尾时清理并重建 |

---

## 11. 命令速查

```bash
# 开发
cd frontend && npm run dev            # :5173，代理 → :8080

# 质量门禁（每个 worker 提交前必跑）
npx vue-tsc --noEmit
npm run lint
npm run lint:stylelint
npm run build

# 后端
cd backend && go test ./...

# 参考模板（只读）
.adp-template/src/views/system/user/index.vue      # 列表页黄金样板
.adp-template/src/views/examples/                  # 各组件用法 demo
```
