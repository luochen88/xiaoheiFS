import type { AppRouteRecord } from '@/types/router'
import { adminTradeRoutes } from './admin-trade'
import { adminContentRoutes } from './admin-content'
import { adminSettingsRoutes } from './admin-settings'

/**
 * 管理后台动态路由（菜单）总表。
 * 每个切片一个文件，worker 只改自己那份，避免并行改造时互相冲突。
 */
export const routeModules: AppRouteRecord[] = [
  ...adminTradeRoutes,
  ...adminContentRoutes,
  ...adminSettingsRoutes
]
