/**
 * 路由全局前置守卫
 *
 * 本应用一个 SPA 承载三个域，守卫按域分派：
 *
 *   public  —— 放行。营销站、登录注册、公开选购与购物车都在这里。
 *   console —— 校验用户 token（stores/auth），菜单来自静态控制台路由。
 *   admin   —— 校验管理员 token（stores/adminAuth），首次进入时按 admin_path
 *              动态注册管理路由，并按权限裁剪菜单。
 *
 * 另有两个跨域的前置动作：安装门禁、模拟登录（impersonation）token 接收。
 *
 * @module router/guards/beforeEach
 */
import type { Router, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { nextTick } from 'vue'
import NProgress from 'nprogress'

import { useSettingStore } from '@/store/modules/setting'
import { useMenuStore } from '@/store/modules/menu'
import { useWorktabStore } from '@/store/modules/worktab'
import { useAuthStore } from '@/stores/auth'
import { useAdminAuthStore } from '@/stores/adminAuth'
import { useInstallStore } from '@/stores/install'

import { setWorktab } from '@/utils/navigation'
import { setPageTitle } from '@/utils/router'
import { loadingService } from '@/utils/ui'
import { fetchAdminPath, getCachedAdminPath } from '@/services/adminPath'

import { RoutesAlias } from '../routesAlias'
import { resolveRealm, prefixRoutePaths, type Realm } from '../realm'
import { buildConsoleMenus } from '../menus/console'
import { asyncRoutes } from '../routes/asyncRoutes'
import { RouteRegistry, IframeRouteManager, RoutePermissionValidator } from '../core'

let routeRegistry: RouteRegistry | null = null

/** 动态路由注册中，防止快速连续导航触发并发注册 */
let adminRoutesRegistering = false
/** 注册失败标记，防止在 500 页与目标页之间死循环 */
let adminRoutesFailed = false
/** 当前 menuStore 里装的是哪个域的菜单，避免每次导航都重设 */
let currentMenuRealm: Realm | null = null

let pendingLoading = false

/** 供 afterEach 判断是否还有未关闭的全局 loading */
export function getPendingLoading(): boolean {
  return pendingLoading
}

export function resetPendingLoading(): void {
  pendingLoading = false
}

export function setupBeforeEachGuard(router: Router): void {
  routeRegistry = new RouteRegistry(router)

  router.beforeEach(async (to, from, next) => {
    try {
      await handleRouteGuard(to, from, next, router)
    } catch (error) {
      console.error('[RouteGuard] 守卫执行失败:', error)
      closeLoading()
      next({ name: 'Exception500', replace: true })
    }
  })
}

/** 重新登录 / 登出时重置动态路由状态 */
export function resetRouterState(delay = 0): void {
  setTimeout(() => {
    routeRegistry?.unregister()
    IframeRouteManager.getInstance().clear()
    const menuStore = useMenuStore()
    menuStore.removeAllDynamicRoutes()
    menuStore.setMenuList([])
    adminRoutesRegistering = false
    adminRoutesFailed = false
    currentMenuRealm = null
  }, delay)
}

function closeLoading(): void {
  if (pendingLoading) {
    nextTick(() => {
      loadingService.hideLoading()
      pendingLoading = false
    })
  }
}

async function handleRouteGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
  router: Router
): Promise<void> {
  if (useSettingStore().showNprogress) {
    NProgress.start()
  }

  // 1. 模拟登录：管理员把用户 token 塞在 hash 里带过来
  if (handleImpersonation(to, next)) return

  // 2. 安装门禁：未安装时一切导航都落到安装向导
  if (!(await handleInstallGate(to, next))) return

  // 3. 按域分派
  switch (resolveRealm(to)) {
    case 'console':
      return handleConsoleRealm(to, next)
    case 'admin':
      return handleAdminRealm(to, next, router)
    default:
      return handlePublicRealm(to, next)
  }
}

/* ── 跨域前置动作 ─────────────────────────────────────────── */

/**
 * 模拟登录：`/console#impersonate_token=xxx`
 * 取出 token 写入用户 store，并把它从 hash 里抹掉再重新导航，
 * 避免 token 留在地址栏和历史记录里。
 */
function handleImpersonation(to: RouteLocationNormalized, next: NavigationGuardNext): boolean {
  const hash = typeof to.hash === 'string' ? to.hash : ''
  if (!to.path.startsWith(RoutesAlias.Console) || !hash.includes('impersonate_token=')) {
    return false
  }

  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const token = params.get('impersonate_token') || ''
  if (token) {
    const auth = useAuthStore()
    auth.token = token
    auth.profile = null
    localStorage.setItem('user_token', token)
  }

  params.delete('impersonate_token')
  const rest = params.toString()
  next({ path: to.path, query: to.query, hash: rest ? `#${rest}` : '', replace: true })
  return true
}

/** @returns true 表示可以继续，false 表示已经处理了跳转 */
async function handleInstallGate(
  to: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<boolean> {
  const install = useInstallStore()
  if (!install.loaded) {
    await install.fetchStatus()
  }

  if (install.installed || to.path === RoutesAlias.Install) {
    return true
  }

  next({ path: RoutesAlias.Install, replace: true })
  return false
}

/* ── public ───────────────────────────────────────────────── */

function handlePublicRealm(to: RouteLocationNormalized, next: NavigationGuardNext): void {
  // 营销站没有侧边栏，进入公开域时清掉后台菜单，避免退出控制台后残留
  if (currentMenuRealm !== 'public') {
    useMenuStore().setMenuList([])
    currentMenuRealm = 'public'
  }
  setPageTitle(to)
  next()
}

/* ── console ──────────────────────────────────────────────── */

async function handleConsoleRealm(
  to: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> {
  const auth = useAuthStore()

  if (!auth.token) {
    next({ path: RoutesAlias.Login, query: { redirect: to.fullPath }, replace: true })
    return
  }

  // 有 token 但还没拉过资料（含模拟登录进来的场景）
  if (!auth.profile) {
    try {
      await auth.fetchMe()
    } catch {
      // 401 已由 http 拦截器处理登出与跳转，这里取消当前导航即可
      next(false)
      return
    }
  }

  if (currentMenuRealm !== 'console') {
    useMenuStore().setMenuList(buildConsoleMenus())
    currentMenuRealm = 'console'
  }

  setWorktab(to)
  setPageTitle(to)
  next()
}

/* ── admin ────────────────────────────────────────────────── */

async function handleAdminRealm(
  to: RouteLocationNormalized,
  next: NavigationGuardNext,
  router: Router
): Promise<void> {
  const adminAuth = useAdminAuthStore()
  const adminPath = getCachedAdminPath()
  const isAdminLoginPage = to.path === `/${adminPath}/login`

  if (isAdminLoginPage) {
    setPageTitle(to)
    next()
    return
  }

  if (!adminAuth.token) {
    next({ path: `/${adminPath}/login`, query: { redirect: to.fullPath }, replace: true })
    return
  }

  if (adminRoutesFailed) {
    // 已经失败过就不再重试，避免死循环
    if (to.matched.length > 0) {
      next()
    } else {
      next({ name: 'Exception500', replace: true })
    }
    return
  }

  if (!routeRegistry?.isRegistered()) {
    if (adminRoutesRegistering) {
      next(false)
      return
    }
    await registerAdminRoutes(to, next, router, adminPath)
    return
  }

  if (!checkAdminPermission(to, next)) return

  if (to.matched.length === 0) {
    next({ name: 'Exception404', replace: true })
    return
  }

  setWorktab(to)
  setPageTitle(to)
  next()
}

/**
 * 首次进入管理后台时注册动态路由。
 *
 * 与模板的差别：管理后台挂载点是运行时的 admin_path，所以要先确保拿到它，
 * 再把菜单路径统一加前缀后注册。
 */
async function registerAdminRoutes(
  to: RouteLocationNormalized,
  next: NavigationGuardNext,
  router: Router,
  cachedAdminPath: string
): Promise<void> {
  adminRoutesRegistering = true
  pendingLoading = true
  loadingService.showLoading()

  try {
    const adminAuth = useAdminAuthStore()
    if (!adminAuth.profile) {
      await adminAuth.fetchProfile()
    }

    const adminPath = cachedAdminPath || (await fetchAdminPath())
    const permissions: string[] = (adminAuth.profile as any)?.permissions ?? []

    const menuList = prefixRoutePaths(filterByPermission(asyncRoutes, permissions), adminPath)

    routeRegistry?.register(menuList)

    const menuStore = useMenuStore()
    menuStore.setMenuList(menuList)
    menuStore.addRemoveRouteFns(routeRegistry?.getRemoveRouteFns() || [])
    currentMenuRealm = 'admin'

    IframeRouteManager.getInstance().save()
    useWorktabStore().validateWorktabs(router)

    adminRoutesRegistering = false
    closeLoading()

    // 路由表变了，重新走一遍导航让新路由生效
    next({ path: to.path, query: to.query, hash: to.hash, replace: true })
  } catch (error) {
    console.error('[RouteGuard] 管理后台动态路由注册失败:', error)
    adminRoutesRegistering = false
    adminRoutesFailed = true
    closeLoading()
    next({ name: 'Exception500', replace: true })
  }
}

/**
 * 按权限码裁剪菜单。
 *
 * 规则与后端一致：`meta.authList[].authMark` 是页面需要的权限码，
 * 拥有 `*` 视为超级管理员，直接放行；父级的子项被裁光时父级也隐藏。
 */
function filterByPermission<T extends { meta?: any; children?: T[] }>(
  routes: T[],
  permissions: string[]
): T[] {
  if (permissions.includes('*')) return routes

  const allowed = (route: T): boolean => {
    const marks: string[] = (route.meta?.authList ?? []).map((a: any) => a.authMark)
    if (marks.length === 0) return true
    return marks.some((mark) => permissions.includes(mark))
  }

  const walk = (list: T[]): T[] =>
    list.reduce<T[]>((acc, route) => {
      const children = route.children?.length ? walk(route.children) : undefined
      // 有子菜单但全被裁掉了 → 父级也不显示
      if (route.children?.length && (!children || children.length === 0)) return acc
      if (!allowed(route)) return acc
      acc.push(children ? ({ ...route, children } as T) : route)
      return acc
    }, [])

  return walk(routes)
}

/** @returns true 表示可以继续 */
function checkAdminPermission(to: RouteLocationNormalized, next: NavigationGuardNext): boolean {
  const menuStore = useMenuStore()
  if (!menuStore.menuList.length) return true

  if (
    to.name !== 'Exception404' &&
    to.matched.length > 0 &&
    !RoutePermissionValidator.hasPermission(to.path, menuStore.menuList)
  ) {
    next({ name: 'Exception403', replace: true })
    return false
  }

  return true
}
