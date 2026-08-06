import type { AppRouteRecordRaw } from '@/utils/router'
import { marketingRoutes } from './marketing'
import { commerceRoutes } from './commerce'

/** PublicLayout 的全部子路由 */
export const publicChildren: AppRouteRecordRaw[] = [...marketingRoutes, ...commerceRoutes]
