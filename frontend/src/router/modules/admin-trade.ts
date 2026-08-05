/**
 * 管理后台 · 交易与资源 —— 负责人 W6
 *
 * 这里是**菜单即路由**：条目会驱动侧边栏，并在拿到 admin_path 后
 * 由 RouteRegistry 动态注册到 /<admin_path> 前缀下。
 * path 写成以 '/' 开头的绝对路径（不含 admin 前缀），前缀由 realm.ts 统一加。
 * meta 字段含义见 docs/frontend/adp-conventions.md 第 10 节。
 */
import type { AppRouteRecord } from '@/types/router'

export const adminTradeRoutes: AppRouteRecord[] = []
