/**
 * 用户控制台侧边栏菜单
 *
 * 控制台的路由是静态的（构建期确定），所以菜单不需要动态注册，
 * 直接由路由表推导，避免"路由加了页面、菜单忘了加"这类漂移。
 *
 * 想让某个控制台页面不出现在侧边栏，在它的 meta 里写 `isHide: true`。
 *
 * @module router/menus/console
 */
import type { AppRouteRecord } from '@/types/router'
import type { AppRouteRecordRaw } from '@/utils/router'
import { consoleChildren } from '../routes/console'
import { CONSOLE_PREFIX } from '../realm'

/** 把 '/console' 下的相对子路由拼成绝对路径 */
function absolutePath(childPath: string): string {
  if (!childPath) return CONSOLE_PREFIX
  if (childPath.startsWith('/')) return childPath
  return `${CONSOLE_PREFIX}/${childPath}`
}

/**
 * 带参数的路由（如 vps/:id、orders/:id）是详情页，不进菜单。
 */
function isDetailRoute(path: string): boolean {
  return path.includes(':')
}

function toMenuRecord(route: AppRouteRecordRaw): AppRouteRecord {
  return {
    path: absolutePath(String(route.path ?? '')),
    name: String(route.name ?? ''),
    meta: (route.meta ?? { title: '' }) as AppRouteRecord['meta']
  }
}

/** 控制台菜单（供 ArtSidebarMenu 渲染） */
export function buildConsoleMenus(): AppRouteRecord[] {
  return consoleChildren
    .filter((route) => {
      const path = String(route.path ?? '')
      return !isDetailRoute(path) && !route.meta?.isHide
    })
    .map(toMenuRecord)
}
