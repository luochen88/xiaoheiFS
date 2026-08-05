/**
 * 用户控制台 · 账户（资料/工单/实名/API） —— 负责人 W5
 *
 * 这些是 /console 下的子路由（ADP 布局外壳），path 相对 '/console'。
 */
import type { AppRouteRecordRaw } from '@/utils/router'

export const accountRoutes: AppRouteRecordRaw[] = [
  {
    path: 'profile',
    name: 'ConsoleProfile',
    component: () => import('@views/console/profile/index.vue'),
    meta: {
      title: '账户设置',
      icon: 'ri:user-settings-line',
      realm: 'console',
      keepAlive: true,
      authList: [],
      isHide: false
    }
  },
  {
    path: 'realname',
    name: 'ConsoleRealname',
    component: () => import('@views/console/realname/index.vue'),
    meta: {
      title: '实名认证',
      icon: 'ri:verified-badge-line',
      realm: 'console',
      keepAlive: false,
      authList: [],
      isHide: false
    }
  },
  {
    path: 'tickets',
    name: 'ConsoleTickets',
    component: () => import('@views/console/tickets/index.vue'),
    meta: {
      title: '我的工单',
      icon: 'ri:customer-service-2-line',
      realm: 'console',
      keepAlive: true,
      authList: [],
      isHide: false
    }
  },
  {
    path: 'tickets/:id',
    name: 'ConsoleTicketDetail',
    component: () => import('@views/console/tickets/detail.vue'),
    meta: {
      title: '工单详情',
      icon: 'ri:message-3-line',
      realm: 'console',
      keepAlive: false,
      authList: [],
      isHide: true,
      activePath: '/console/tickets'
    }
  },
  {
    path: 'api-keys',
    name: 'ConsoleApiKeys',
    component: () => import('@views/console/api-keys/index.vue'),
    meta: {
      title: 'API 密钥',
      icon: 'ri:key-2-line',
      realm: 'console',
      keepAlive: false,
      authList: [],
      isHide: false
    }
  }
]
