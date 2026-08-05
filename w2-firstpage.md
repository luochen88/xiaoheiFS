# W2 第一页面审核记录：用户登录

页面：`frontend/src/views/auth/login/index.vue`

## 处理说明

- **`useTable`**：该页面是全屏认证表单，不是列表页，没有表格、筛选或分页，因此不适用 `useTable`。页面按 ADP 认证家族使用 `LoginLeftView`、`AuthTopBar` 和 Element Plus 表单。
- **颜色**：页面新增样式没有硬编码颜色，文字、背景、边框、状态和验证码控件均使用 `--art-*`、`--el-*`、`--theme-color` 或 `--default-*` 变量。没有 `!important`，没有 Ant Design 组件或图标导入。
- **暗色模式验证**：按协调裁决的新口径检查页面零硬编码颜色，前景、背景和边框成对使用语义变量，且没有通过 `:deep()` 覆盖 Element Plus 内部颜色。

## 已保留交互

- 登录模式切换（账号/手机号）与对应字段校验。
- 登录设置加载，图片验证码刷新和 GeeTest 初始化/重试。
- 密码、账号、手机号长度限制与原错误提示。
- 登录提交、用户信息加载、失败提示、成功提示和 `redirect` 回跳。
- 忘记密码、注册入口。

## 局部检查

```text
rg '<a-|ant-design-vue|@ant-design/icons-vue|#[0-9a-fA-F]{3,8}\\b|rgba?\\(|!important' frontend/src/views/auth/login/index.vue
# no matches

npx vue-tsc --noEmit --pretty false 2>&1 | rg 'src/views/auth|src/router/routes/auth'
# no matches; repository-wide typecheck still reports pre-existing P0/other-slice errors
```
