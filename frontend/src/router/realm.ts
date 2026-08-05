/**
 * 域（realm）解析
 *
 * 本应用一个 SPA 承载三个域，鉴权体系与菜单来源各自独立：
 *
 * | realm   | 路径              | token                       | 菜单来源                     |
 * |---------|-------------------|-----------------------------|------------------------------|
 * | public  | /、/products …    | 无（登录前购物车也在这里）  | 无侧边栏                     |
 * | console | /console/*        | stores/auth（user_token）   | consoleMenus（静态）         |
 * | admin   | /<admin_path>/*   | stores/adminAuth            | asyncRoutes（按权限裁剪）    |
 *
 * @module router/realm
 */
import type { RouteLocationNormalized } from 'vue-router'
import { getCachedAdminPath } from '@/services/adminPath'

export type Realm = 'public' | 'console' | 'admin'

/** 控制台路径前缀 */
export const CONSOLE_PREFIX = '/console'

/**
 * 判断目标路由属于哪个域。
 *
 * 优先看 meta.realm（静态路由显式声明），其次看路径前缀。
 * 管理后台路径是运行时决定的，所以要拿当前缓存的 admin_path 比对。
 */
export function resolveRealm(to: RouteLocationNormalized): Realm {
  const declared = to.meta?.realm as Realm | undefined
  if (declared) return declared

  const path = to.path
  if (path === CONSOLE_PREFIX || path.startsWith(`${CONSOLE_PREFIX}/`)) {
    return 'console'
  }

  const adminPath = getCachedAdminPath()
  if (adminPath && (path === `/${adminPath}` || path.startsWith(`/${adminPath}/`))) {
    return 'admin'
  }

  return 'public'
}

/**
 * 给一组菜单路由的 path 统一加上管理后台前缀。
 *
 * ADP 的 RouteTransformer 要求一级菜单的 path 是绝对路径，而管理后台挂载点
 * 直到运行时拿到 admin_path 才确定，因此在注册前做一次前缀改写。
 */
export function prefixRoutePaths<T extends { path?: string; children?: T[] }>(
  routes: T[],
  prefix: string
): T[] {
  const clean = `/${prefix.replace(/^\/+|\/+$/g, '')}`

  const walk = (list: T[]): T[] =>
    list.map((route) => {
      const next = { ...route } as T
      if (typeof route.path === 'string' && route.path.startsWith('/')) {
        next.path = `${clean}${route.path}`
      }
      if (route.children?.length) {
        next.children = walk(route.children)
      }
      return next
    })

  return walk(routes)
}
