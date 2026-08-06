import type { AppRouteRecordRaw } from '@/utils/router'
import { publicChildren } from './public'
import { authRoutes } from './auth'
import { consoleChildren } from './console'

/**
 * 静态路由（构建期就确定的路由）
 *
 * 三个域的挂载点：
 *   - public  '/' 下的营销站（含公开选购与购物车）
 *   - 认证/安装 全屏页，无外壳
 *   - console '/console' 下的用户控制台，复用 ADP 后台布局
 *   - admin   不在这里，它的挂载点由 admin_path 决定，运行时在守卫里注册
 *
 * 注意：各域的子路由拆在独立文件里，由不同 worker 维护，
 * 本文件是聚合点，改造期间**不要**直接往这里加页面。
 */
export const staticRoutes: AppRouteRecordRaw[] = [
  // ── 公开营销站 ──────────────────────────────────────────────
  {
    path: '/',
    name: 'PublicRoot',
    component: () => import('@views/public/layout/index.vue'),
    meta: { title: '首页', realm: 'public' },
    children: publicChildren
  },

  // ── 认证与安装（全屏，无外壳）────────────────────────────────
  ...authRoutes,

  // ── 用户控制台 ──────────────────────────────────────────────
  {
    path: '/console',
    name: 'ConsoleRoot',
    component: () => import('@views/index/index.vue'),
    meta: { title: '用户控制台', realm: 'console', requiresConsoleUser: true },
    children: consoleChildren
  },

  // ── 异常页 ──────────────────────────────────────────────────
  {
    path: '/403',
    name: 'Exception403',
    component: () => import('@views/exception/403/index.vue'),
    meta: { title: '无访问权限', realm: 'public', isHideTab: true }
  },
  {
    path: '/500',
    name: 'Exception500',
    component: () => import('@views/exception/500/index.vue'),
    meta: { title: '服务异常', realm: 'public', isHideTab: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'Exception404',
    component: () => import('@views/exception/404/index.vue'),
    meta: { title: '页面不存在', realm: 'public', isHideTab: true }
  }
]
