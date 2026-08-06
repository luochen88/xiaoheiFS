# xiaoheiFS Web (Vue 3 + Vite + Pinia + Element Plus / Art Design Pro)

本仓库唯一的 Web 前端。**一个 history 模式的单页应用**同时承载：

| 域 | 路由 | 鉴权 |
|---|---|---|
| 公开营销站 | `/`、`/products`、`/help`、`/docs`、`/announcements`、`/activities`、`/tutorials`、`/:category/:slug` | 无 |
| 选购与购物车 | `/buy`、`/cart` | 无（结算时才要求登录） |
| 认证与安装 | `/login`、`/register`、`/forgot-password`、`/reset-password`、`/install` | 无 |
| 用户控制台 | `/console/*` | `stores/auth`（`user_token`） |
| 管理后台 | `/<admin_path>/*`，前缀由后台设置决定，运行时注册 | `stores/adminAuth`（`admin_token`） |

后端把构建产物放在 `./static`，任何未命中文件的非 API GET 都回落到 `index.html`。

## 开始

```bash
npm i
npm run dev          # :5173
```

需要 Node `20.19+` 或 `22.12+`（Vite 7 的要求）。

| 命令 | 用途 |
|---|---|
| `npm run typecheck` | `vue-tsc --noEmit`，**必须保持 0 错误**，这是本项目唯一的自动化门禁 |
| `npm run lint` / `npm run lint:stylelint` | ESLint / Stylelint |
| `npm run build` | 产物到 `dist/`，部署时复制为 `./static` |

目前**没有前端测试框架**，CONTRIBUTING 里的 `npm test` 不适用于本目录。

## 写页面前必读

`../docs/frontend/adp-conventions.md` —— Art Design Pro 的规范提取，含 `useTable`、
`ArtTable`、`ArtSearchBar`、`ArtForm` 的精确 API、可用的 `--art-*` 变量清单、路由
`meta` 字段含义，以及会静默出错的坑。

硬性规范：

- 列表页用 `useTable` + `ArtTable` + `ArtTableHeader` + `ArtSearchBar`，不要手写分页
- 不写死颜色、不用 `!important`；只用 `--art-*` / `--el-*` 变量，亮暗两套都要正确
- 页面放 `src/views/**`，并写 `defineOptions({ name: 'XxxYyy' })`（多标签页缓存依赖它）
- Element Plus 组件、`Art*` 组件、`vue`/`vue-router`/`pinia`/`@vueuse/core` 的 API 全部
  自动导入，**不要手写 import**

## 代理

开发服务器把这些前缀代理到 `http://localhost:8080`：`/api`、`/admin/api`、`/sdk`、`/uploads`。
构建产物可用 `VITE_API_BASE` 指向绝对后端地址。

注意**没有 `.env` 文件**：仓库根的 `.gitignore` 会吞掉 `.env*`，所以模板需要的少量环境
变量直接内联在 `vite.config.ts` 的 `define` 里。

## 目录

```
src/
├── assets/styles/     ADP 样式体系（tailwind.css 里是 --art-* 变量，SCSS mixin 自动注入）
├── components/
│   ├── core/          ADP 组件库，属于模板，不要改
│   ├── business/      本项目共享业务组件（CMS 区块、状态标签、JSON Schema 表单…）
│   └── brand/         站点 logo 白标
├── config/ enums/ directives/ hooks/ locales/ plugins/   ADP 基础设施
├── router/
│   ├── core/          RouteRegistry / ComponentLoader / MenuProcessor
│   ├── guards/        三个域的守卫：安装门禁、模拟登录、鉴权、权限
│   ├── realm.ts       域解析 + 管理后台路径前缀改写
│   ├── routes/        静态路由，按区域拆分
│   └── modules/       管理后台的「菜单即路由」，运行时动态注册
├── services/          API 层：http / user / admin / types / sse / adminPath
├── store/             ADP 基础设施 store（setting / worktab / menu / table / user）
├── stores/            业务 store（auth / adminAuth / cart / orders / catalog / site…）
└── views/             页面
```

**两个 store 目录是有意为之**，引用时一律写全路径：`@/store/modules/*` 是模板基础设施，
`@/stores/*` 是业务状态。

## 需要注意的既有契约

- **HTTP 拦截器**（`services/http.ts`）：管理端 2FA 门禁、实名门禁、401 登出并带
  `redirect` 回跳、5xx 通知。错误**始终继续 reject**，调用方自己 try/catch 管局部状态。
- **SSE**（`services/sse.ts`）：手写的 `fetch` + `ReadableStream` 客户端，因为
  `EventSource` 带不了 `Authorization`；含 `Last-Event-ID` 断点续传与退避重连。
  用在订单详情与探针详情。
- **后端字段命名**：同一个后端会返回 `snake_case`、`camelCase` 和 GORM 直接序列化的
  `PascalCase`。代码里到处是 `row.id ?? row.ID`，`services/types.ts` 也声明了两套别名。
  **这是真实契约，不要「顺手规范化」掉。**
- **管理后台路径可配置**：从 `services/adminPath.ts` 拿，`router/realm.ts` 负责给路由和
  `meta.activePath` 统一加前缀。服务端不对这个路径做任何特殊处理。
- **按钮级权限**：用 `v-auth="'order.approve'"`，它读的是 `userStore.info.buttons`，
  由守卫在注册管理路由时从管理员资料同步进去。
