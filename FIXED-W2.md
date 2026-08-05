| 审核条目 | 处理 | 文件:行 | 说明 |
|---|---|---|---|
| blocker 1 用户登录新增强制 `ArtDragVerify` 门禁 | 已修 | `frontend/src/views/auth/login/index.vue:87` | 验证码表单项后已直接进入原有操作区；拖拽控件、提交拦截、状态和样式均已删除。账号/手机号密码登录及配置驱动图形/GeeTest 验证保持不变。按 `RESOLUTIONS.md` §6.4 同步删除 `frontend/src/views/admin/auth/login/index.vue:39` 的相同新增门禁。 |
| major 1 `auth.fetchMe()` 失败产生未处理 rejection | 已修 | `frontend/src/views/auth/login/index.vue:346` | 登录、资料拉取和跳转已纳入 `try/catch`，失败时显示后端错误并按需刷新验证码。token 恢复策略与原页一致：401 由全局 HTTP 拦截器登出并清理 token，瞬时 profile/导航失败保留已签发 token 供重试。 |
| minor 1 第一页自查未写到 `.adp-work/out/` | 已处理 | `w2-firstpage.md:1` | `RESOLUTIONS.md` §2 明确协调者已复制该文件，且要求后续不要再尝试写工作区外路径；本次仅更新工作区根副本，使内容与返修结果一致。 |
| 自动化检查：宽范围 `vue-tsc` 过滤必须无输出 | 不修（非 W2） | `frontend/src/router/guards/beforeEach.ts:356` | 仍输出审核报告已确认的 5 个旧分叉错误：共享 `comment-widget` 1 个、§5.4 禁改守卫 1 个、W1 `views/public/layout` 3 个。W2 自有的 auth/admin/install views 与 `router/routes/auth.ts` 无类型命中；为遵守切片边界未越权修改。 |
