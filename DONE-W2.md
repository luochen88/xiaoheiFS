# DONE-W2：认证与安装向导

## 改动文件

- 用户认证：
  - `frontend/src/views/auth/login/index.vue`
  - `frontend/src/views/auth/register/index.vue`
  - `frontend/src/views/auth/forgot-password/index.vue`
  - `frontend/src/views/auth/reset-password/index.vue`
- 管理端认证：
  - `frontend/src/views/admin/auth/login/index.vue`
  - `frontend/src/views/admin/auth/forgot-password/index.vue`
  - `frontend/src/views/admin/auth/reset-password/index.vue`
- 安装向导：
  - `frontend/src/views/install/index.vue`
  - `frontend/src/views/install/modules/db-step.vue`
  - `frontend/src/views/install/modules/site-step.vue`
  - `frontend/src/views/install/modules/admin-step.vue`
  - `frontend/src/views/install/modules/done-step.vue`
- 路由与交付记录：
  - `frontend/src/router/routes/auth.ts`
  - `NEEDS.md`
  - `w2-firstpage.md`（沙箱禁止写工作区外，见遗留问题）

上述页面均声明了与路由匹配的 `defineOptions({ name })`。这些页面没有列表、表格或分页，因此 `useTable` / `ArtTable` / `ArtTableHeader` / `ArtSearchBar` 不适用。

## 功能点对照

| 页面 | 原交互 | 当前实现 |
|---|---|---|
| 用户登录 | 账号/手机号切换、密码、输入限制 | `ElSegmented` + `ElForm`，继续使用 `INPUT_LIMITS` 与原校验/提示 |
| 用户登录 | 拉取 auth 设置、按设置启用验证码 | `loadSettings()` 调用 `getAuthSettings()`，图片验证码与 GeeTest 分支均保留 |
| 用户登录 | 图片验证码刷新、GeeTest 初始化/重试 | `refreshCaptcha()` / `initGeeTest()` / `verifyGeeTest()` |
| 用户登录 | 登录、加载资料、错误提示、redirect 回跳 | `auth.login()` → `auth.fetchMe()` → `router.replace(redirect || '/console')`，失败链由 `catch` 提示并按需刷新验证码 |
| 用户登录 | ADP 认证外观 | `LoginLeftView` + `AuthTopBar`；未新增原页面没有的认证门禁 |
| 用户注册 | 注册开关、动态必填字段 | auth 设置驱动 `ElAlert`、字段显隐和规则 |
| 用户注册 | 邮箱/短信注册通道 | `verifyChannels` + `ElSegmented`，邮箱/手机号字段跟随切换 |
| 用户注册 | 图片/GeeTest 验证码 | 保留图片刷新与 GeeTest 完整结果提交 |
| 用户注册 | 获取验证码、60 秒倒计时 | `requestRegisterCode()` + 原 `60s` 文案和定时器卸载清理 |
| 用户注册 | 字段限制、提交、登录跳转 | 继续使用 `INPUT_LIMITS`，提交 `userRegister()`，成功回 `/login` |
| 用户注册 | 服务条款勾选 | `ElCheckbox` + 原校验文案“请同意隐私协议” |
| 用户找回密码 | 账号 → 验证 → 新密码三步 | `ElSteps` + 三组 `ElForm`，步骤顺序不变 |
| 用户找回密码 | 邮箱/短信渠道、手机号补全 | 继续使用 options API 返回的渠道、脱敏号码与完整手机号校验 |
| 用户找回密码 | 发码、验码、reset ticket、确认密码 | 原四个服务调用和所有错误提示保留 |
| 用户重置占位页 | 引导进入找回流程 | `ElResult` 引导到 `/forgot-password` |
| 管理员登录 | 运行时管理路径 | 路由 `beforeEnter` 调用 `checkAdminPath()`；请求提交当前 URL 的 `admin_path` |
| 管理员登录 | ADP 认证外观 | `LoginLeftView` + `AuthTopBar`；未新增原页面没有的认证门禁 |
| 管理员登录 | 登录后强制刷新 | 保留 `window.location.href = redirect` 行为 |
| 管理员登录 | 2FA 绑定/验证门禁 | 登录 store 读取响应后显式调用 `admin.setMfaGateState()` 同步门禁状态 |
| 管理员找回密码 | 邮箱发重置链接、返回登录 | `forgotPassword()` + `buildAdminUrl('login')` |
| 管理员重置密码 | token、两次密码校验、提交 | 查询参数 token、`resetPassword()` 与原提示文案均保留 |
| 安装入口 | 已安装时 404、未安装四步向导 | `install.fetchStatus()` 只在未加载时调用；已安装显示 `ArtException` |
| 安装入口 | 四步步骤条 | `ElSteps`：数据库 → 站点 → 管理员 → 完成 |
| 数据库步骤 | SQLite/MySQL 切换与字段联动 | `ElSegmented` + `ArtForm`，字段变化调用 `wiz.touchDB()` |
| 数据库步骤 | DSN 生成/复制、连接测试、下一步门禁 | 保留 `wiz.mysqlDSN`、剪贴板、`checkInstallDB()` 和 `dbChecked` 门禁 |
| 站点步骤 | 站点名/URL、持久化、前后导航 | `ArtForm` 校验站点名，watch 同步并 `wiz.persist()` |
| 管理员步骤 | 账号/密码/确认密码 | `ArtForm` + 原必填和密码一致性文案 |
| 管理员步骤 | 管理路径随机生成、格式/保留字校验 | Web Crypto + 原随机回退、完整保留字集合和原提示 |
| 管理员步骤 | 安装提交、缓存管理路径、刷新安装状态 | `runInstall()`、`install.fetchStatus()`、`admin_path_cache` 均保留 |
| 完成步骤 | 重启/配置文件提示、首页/后台跳转 | `ElResult` + `ElDescriptions`，文案和跳转逻辑保留 |
| 管理 realm 路由 | 登录后注册动态路由 | `/:adminPath` 占位根/通配路由先标记 admin realm，守卫注册后由具体路由接管 |

## 自检结果

```text
# W2 范围 Ant Design 残留
rg '<a-|ant-design-vue|@ant-design/icons-vue' \
  frontend/src/views/auth frontend/src/views/admin/auth frontend/src/views/install
# 无输出

# W2 范围硬编码颜色
rg -i '#[0-9a-f]{3,8}\b|rgba?\(' \
  frontend/src/views/auth frontend/src/views/admin/auth frontend/src/views/install
# 无输出

# W2 范围禁止样式
rg '!important|:deep\(' \
  frontend/src/views/auth frontend/src/views/admin/auth frontend/src/views/install
# 无输出

npx eslint src/views/auth/*/index.vue src/views/admin/auth/*/index.vue \
  src/views/install/index.vue src/views/install/modules/*.vue src/router/routes/auth.ts
# exit 0

npx stylelint src/views/auth/*/index.vue src/views/admin/auth/*/index.vue \
  src/views/install/index.vue src/views/install/modules/*.vue
# exit 0

npx vue-tsc --noEmit --pretty false 2>&1 | rg \
  'src/views/auth|src/views/admin/auth|src/views/install|src/router/routes/auth'
# 无 W2 命中

npm run build
# exit 0，4895 modules transformed，built in 49.15s
```

本轮返修门禁现状：

- 用户指定的宽范围 `vue-tsc` 过滤命令仍输出审核报告已列出的 5 个旧分叉错误：`components/business/comment-widget` 1 个、禁改的 `router/guards/beforeEach.ts` 1 个、W1 的 `views/public/layout` 3 个；W2 自有路径无命中。
- W2 定向 ESLint 与 Stylelint 均为 exit 0。
- 标准 `npm run build` 为 exit 0；只有既有的 Rollup 注释、动态导入和 chunk 大小警告。
- 暗色模式按协调裁决检查零硬编码颜色、语义化前景/背景/边框配对以及无 `:deep()` 颜色覆盖。

## 遗留问题

- `NEEDS.md`：协调者已裁决原页面不存在邮箱/短信验证码登录，本切片没有相关待协调项。
- `/opt/xiaoheiFS/.adp-work/out/w2-firstpage.md`：协调者已复制完成；后续记录按裁决保留在工作区根。
- 宽范围类型过滤的 5 个旧分叉错误不属于 W2 文件集，且其中含 §5.4 禁改文件；本轮未越权修改。
- Git 提交：`git commit` 无法创建只读 `/opt/xiaoheiFS/.git/worktrees/w2/index.lock`，因此本工作区无法完成提交。代码按认证、安装两个逻辑单元准备完毕，但没有生成 commit。
