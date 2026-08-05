import { createApp } from 'vue'
import App from './App.vue'

import { initStore } from './store'
import { initRouter } from './router'
import { setupGlobDirectives } from './directives'
import { setupErrorHandle } from './utils/sys/error-handle'
import { initializeTheme } from './hooks/core/useTheme'
import language from './locales'

/* ── 迁移期临时依赖（TODO: 全部页面改造完成后删除，见方案 §9.1）────────
   还未迁移的老页面仍在用 Ant Design Vue。样式加载顺序很重要：
   antd 复位样式与旧主题变量先加载，Art Design Pro 的样式最后加载并覆盖它们。 */
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import './styles/theme.css'
import './styles/admin.css'
/* ──────────────────────────────────────────────────────────────────── */

import '@styles/core/tailwind.css'
import '@styles/index.scss'
import '@utils/sys/console'

// iOS 上阻止双击缩放需要非 passive 监听
document.addEventListener('touchstart', function () {}, { passive: false })

const app = createApp(App)

initStore(app)
initRouter(app)
setupGlobDirectives(app)
setupErrorHandle(app)

app.use(language)
app.use(Antd) // TODO: 迁移完成后删除

// 主题必须在 store 就绪之后初始化（它要读 settingStore 里持久化的偏好）
initializeTheme()

app.mount('#app')
