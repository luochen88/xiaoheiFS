import { AppRouteRecord } from '@/types/router'
import { automationRoutes } from './automation'
import { auditRoutes } from './audit'
import { catalogRoutes } from './catalog'
import { cmsRoutes } from './cms-routes'
import { dashboardRoutes } from './dashboard'
import { debugRoutes } from './debug'
import { marketingRoutes } from './marketing'
import { opsRoutes } from './ops'
import { orderRoutes } from './order'
import { probeRoutes } from './probe'
import { realnameRoutes } from './realname'
import { settingsRoutes } from './settings'
import { systemsRoutes } from './systems'
import { systemRoutes } from './system'
import { ticketRoutes } from './ticket'
import { vpsRoutes } from './vps'
import { walletRoutes } from './wallet'
import { resultRoutes } from './result'
import { exceptionRoutes } from './exception'

/**
 * 导出所有模块化路由
 */
export const routeModules: AppRouteRecord[] = [
  automationRoutes,
  auditRoutes,
  catalogRoutes,
  cmsRoutes,
  dashboardRoutes,
  debugRoutes,
  marketingRoutes,
  opsRoutes,
  orderRoutes,
  probeRoutes,
  realnameRoutes,
  settingsRoutes,
  systemsRoutes,
  systemRoutes,
  ticketRoutes,
  vpsRoutes,
  walletRoutes,
  resultRoutes,
  exceptionRoutes
]
