import type { App } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { staticRoutes } from './routes/staticRoutes'
import { configureNProgress } from '@/utils/router'
import { setupBeforeEachGuard } from './guards/beforeEach'
import { setupAfterEachGuard } from './guards/afterEach'

/**
 * 路由实例
 *
 * 用 history 模式（不是模板默认的 hash 模式）：本应用是站点唯一 SPA，
 * 后端 NoRoute 回落 index.html 即可，URL 里不该出现 `#`。
 * 改成 hash 会连带影响后端的 SPA 静态服务逻辑与其契约测试。
 */
export const router = createRouter({
  history: createWebHistory(),
  routes: staticRoutes
})

export function initRouter(app: App<Element>): void {
  configureNProgress()
  setupBeforeEachGuard(router)
  setupAfterEachGuard(router)
  setupChunkErrorHandler(router)
  app.use(router)
}

/**
 * 懒加载 chunk 失效自愈。
 *
 * 发版后旧页面持有的 chunk 文件名已不存在，路由跳转会抛
 * "Failed to fetch dynamically imported module"。这里提示用户刷新，
 * 并用标志位去重，避免连续跳转弹出一叠对话框。
 */
function setupChunkErrorHandler(r: typeof router): void {
  let prompted = false

  r.onError((err) => {
    const msg = String((err as Error)?.message || err || '')
    const isChunkError =
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('Loading chunk') ||
      msg.includes('ChunkLoadError')

    if (!isChunkError) {
      console.error('[Router] 导航失败:', err)
      return
    }

    if (prompted) return
    prompted = true

    ElMessageBox.confirm('可能是资源更新或缓存导致。是否刷新页面后重试？', '页面资源加载失败', {
      confirmButtonText: '刷新',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => window.location.reload())
      .catch(() => {
        prompted = false
      })
  })
}

/** 主页路径，留空表示用菜单第一个有效路径 */
export const HOME_PAGE_PATH = ''

export default router
