/**
 * 用户控制台 · 资源（总览/云服务器） —— 负责人 W3
 *
 * 这些是 /console 下的子路由（ADP 布局外壳），path 相对 '/console'。
 */
import type { AppRouteRecordRaw } from '@/utils/router'

export const resourceRoutes: AppRouteRecordRaw[] = [
  {
    path: '',
    name: 'ConsoleHomeRedirect',
    redirect: '/console/dashboard',
    meta: {
      title: '用户控制台',
      icon: 'ri:dashboard-line',
      keepAlive: false,
      authList: [],
      isHide: true
    }
  },
  {
    path: 'dashboard',
    name: 'ConsoleDashboard',
    component: () => import('@views/console/dashboard/index.vue'),
    meta: {
      title: '控制台总览',
      icon: 'ri:dashboard-line',
      keepAlive: true,
      authList: [],
      isHide: false
    }
  },
  {
    path: 'vps',
    name: 'ConsoleVps',
    component: () => import('@views/console/vps/index.vue'),
    meta: {
      title: '云服务器',
      icon: 'ri:server-line',
      keepAlive: true,
      authList: [],
      isHide: false
    }
  },
  {
    path: 'vps/:id',
    name: 'ConsoleVpsDetail',
    component: () => import('@views/console/vps/detail.vue'),
    meta: {
      title: '云服务器详情',
      icon: 'ri:server-line',
      keepAlive: false,
      authList: [],
      isHide: true,
      activePath: '/console/vps'
    }
  }
]
