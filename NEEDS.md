[W1] frontend/src/App.vue 需要把 `@/pages/public/Maintenance.vue` 替换为 `@views/public/maintenance/index.vue` —— 原因：维护模式入口属于共享文件，W1 已完成新页面但按 §5.4 不得修改 App.vue。
[W1] frontend/src/pages/admin/cms/Blocks.vue（或其 ADP 迁移目标）需要把 CMS block import 切换到 `@/components/business/cms-blocks/**`，切换后删除旧 `frontend/src/components/cms/blocks/**` —— 原因：新 CMS blocks 已完成迁移，旧管理页仍引用源目录，W1 不得修改 W7 的页面。
[W1] frontend/src/components/business/comment-widget/index.vue 需要处理缺失的 `@/mock/temp/commentDetail` 导入 —— 原因：指定 `vue-tsc` 过滤门禁仍输出 TS2307；审核确认该错误可在 W1 分叉点复现，该共享业务组件不属于 W1。
[W1] frontend/src/router/guards/beforeEach.ts 需要修正第 356 行传给路由注册逻辑的 `AppRouteRecord` 参数类型 —— 原因：指定 `vue-tsc` 过滤门禁仍输出 TS2345；该文件属于 §5.4 禁改清单。
