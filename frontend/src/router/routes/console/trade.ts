/**
 * 用户控制台 · 交易（订单/钱包） —— 负责人 W4
 *
 * 这些是 /console 下的子路由（ADP 布局外壳），path 相对 '/console'。
 */
import type { AppRouteRecordRaw } from '@/utils/router'

export const tradeRoutes: AppRouteRecordRaw[] = [
  {
    path: 'orders',
    name: 'ConsoleOrders',
    component: () => import('@views/console/orders/index.vue'),
    meta: {
      title: '我的订单',
      icon: 'ri:file-list-3-line',
      keepAlive: true,
      realm: 'console',
      requiresConsoleUser: true,
      authList: [],
      isHide: false
    }
  },
  {
    path: 'orders/:id',
    name: 'ConsoleOrderDetail',
    component: () => import('@views/console/orders/detail.vue'),
    meta: {
      title: '订单详情',
      icon: 'ri:file-search-line',
      keepAlive: false,
      realm: 'console',
      requiresConsoleUser: true,
      authList: [],
      isHide: true,
      activePath: '/console/orders'
    }
  },
  {
    path: 'billing',
    name: 'ConsoleBilling',
    component: () => import('@views/console/billing/index.vue'),
    meta: {
      title: '钱包',
      icon: 'ri:wallet-3-line',
      keepAlive: true,
      realm: 'console',
      requiresConsoleUser: true,
      authList: [],
      isHide: false
    }
  }
]
