import type { AppRouteRecordRaw } from '@/utils/router'

export const consoleRoutes: AppRouteRecordRaw[] = [
  {
    path: '/user/login',
    name: 'ConsoleUserLogin',
    component: () => import('@views/user-console/auth/login.vue'),
    meta: { title: '用户登录', isHideTab: true, publicConsole: true }
  },
  {
    path: '/user/forgot-password',
    name: 'ConsoleUserForgotPassword',
    component: () => import('@views/user-console/auth/forgot-password.vue'),
    meta: { title: '找回密码', isHideTab: true, publicConsole: true }
  },
  {
    path: '/console',
    name: 'UserConsole',
    component: () => import('@views/user-console/layout/index.vue'),
    redirect: (to) => ({
      path: '/console/dashboard',
      query: to.query,
      hash: to.hash
    }),
    meta: { title: '用户控制台', isHideTab: true, requiresConsoleUser: true },
    children: [
      { path: '', redirect: '/console/dashboard' },
      {
        path: 'dashboard',
        name: 'UserConsoleDashboard',
        component: () => import('@views/user-console/dashboard/index.vue'),
        meta: { title: '控制台总览', isHideTab: true, requiresConsoleUser: true }
      },
      {
        path: 'buy',
        name: 'UserConsoleBuy',
        component: () => import('@views/user-console/buy/index.vue'),
        meta: { title: '购买 VPS', isHideTab: true, requiresConsoleUser: true }
      },
      {
        path: 'vps',
        name: 'UserConsoleVps',
        component: () => import('@views/user-console/vps/index.vue'),
        meta: { title: '云服务器', isHideTab: true, requiresConsoleUser: true }
      },
      {
        path: 'vps/:id',
        name: 'UserConsoleVpsDetail',
        component: () => import('@views/user-console/vps/detail.vue'),
        meta: { title: '云服务器详情', isHideTab: true, requiresConsoleUser: true }
      },
      {
        path: 'cart',
        name: 'UserConsoleCart',
        component: () => import('@views/user-console/cart/index.vue'),
        meta: { title: '购物车', isHideTab: true, requiresConsoleUser: true }
      },
      {
        path: 'orders',
        name: 'UserConsoleOrders',
        component: () => import('@views/user-console/orders/index.vue'),
        meta: { title: '订单列表', isHideTab: true, requiresConsoleUser: true }
      },
      {
        path: 'orders/:id',
        name: 'UserConsoleOrderDetail',
        component: () => import('@views/user-console/orders/detail.vue'),
        meta: { title: '订单详情', isHideTab: true, requiresConsoleUser: true }
      },
      {
        path: 'billing',
        name: 'UserConsoleBilling',
        component: () => import('@views/user-console/billing/index.vue'),
        meta: { title: '钱包与充值', isHideTab: true, requiresConsoleUser: true }
      },
      {
        path: 'api-keys',
        name: 'UserConsoleApiKeys',
        component: () => import('@views/user-console/api-keys/index.vue'),
        meta: { title: 'API Key 管理', isHideTab: true, requiresConsoleUser: true }
      },
      {
        path: 'realname',
        name: 'UserConsoleRealname',
        component: () => import('@views/user-console/realname/index.vue'),
        meta: { title: '实名认证', isHideTab: true, requiresConsoleUser: true }
      },
      {
        path: 'tickets',
        name: 'UserConsoleTickets',
        component: () => import('@views/user-console/tickets/index.vue'),
        meta: { title: '工单列表', isHideTab: true, requiresConsoleUser: true }
      },
      {
        path: 'tickets/:id',
        name: 'UserConsoleTicketDetail',
        component: () => import('@views/user-console/tickets/detail.vue'),
        meta: { title: '工单详情', isHideTab: true, requiresConsoleUser: true }
      },
      {
        path: 'profile',
        name: 'UserConsoleProfile',
        component: () => import('@views/user-console/profile/index.vue'),
        meta: { title: '个人资料', isHideTab: true, requiresConsoleUser: true }
      }
    ]
  }
]
