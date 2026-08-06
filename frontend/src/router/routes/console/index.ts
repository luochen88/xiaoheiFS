import type { AppRouteRecordRaw } from '@/utils/router'
import { resourceRoutes } from './resource'
import { tradeRoutes } from './trade'
import { accountRoutes } from './account'

/** /console 的全部子路由 */
export const consoleChildren: AppRouteRecordRaw[] = [
  ...resourceRoutes,
  ...tradeRoutes,
  ...accountRoutes
]
