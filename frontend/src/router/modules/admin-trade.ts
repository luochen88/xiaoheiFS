/**
 * 管理后台 · 交易与资源 —— 负责人 W6
 *
 * 这里是**菜单即路由**：条目会驱动侧边栏，并在拿到 admin_path 后
 * 由 RouteRegistry 动态注册到 /<admin_path> 前缀下。
 * path 写成以 '/' 开头的绝对路径（不含 admin 前缀），前缀由 realm.ts 统一加。
 * meta 字段含义见 docs/frontend/adp-conventions.md 第 10 节。
 */
import type { AppRouteRecord } from '@/types/router'

export const adminTradeRoutes: AppRouteRecord[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: '/index/index',
    meta: {
      title: '运营看板',
      icon: 'ri:pie-chart-line',
      roles: ['R_SUPER', 'R_ADMIN']
    },
    children: [
      {
        path: 'console',
        name: 'DashboardOverviewPage',
        component: '/admin/dashboard',
        meta: {
          title: '运营总览',
          fixedTab: true,
          roles: ['R_SUPER', 'R_ADMIN'],
          authList: [
            { title: '查看总览', authMark: 'dashboard.overview' },
            { title: '收入趋势', authMark: 'dashboard.revenue' },
            { title: '资源状态', authMark: 'dashboard.vps_status' },
            { title: '服务器状态', authMark: 'server.status' }
          ]
        }
      },
      {
        path: 'revenue-analytics',
        name: 'RevenueAnalyticsPage',
        component: '/admin/revenue-analytics',
        meta: {
          title: '营收分析',
          keepAlive: true,
          roles: ['R_SUPER', 'R_ADMIN'],
          authList: [
            { title: '收入总览', authMark: 'dashboard.revenue_analytics_overview' },
            { title: '收入趋势', authMark: 'dashboard.revenue_analytics_trend' },
            { title: '收入排行', authMark: 'dashboard.revenue_analytics_top' },
            { title: '收入明细', authMark: 'dashboard.revenue_analytics_details' },
            { title: '营收看板', authMark: 'dashboard.revenue' }
          ]
        }
      }
    ]
  },
  {
    path: '/order',
    name: 'Order',
    component: '/index/index',
    meta: {
      title: '订单管理',
      icon: 'ri:file-list-3-line',
      roles: ['R_SUPER', 'R_ADMIN']
    },
    children: [
      {
        path: 'review',
        name: 'OrderReview',
        component: '/admin/order/review',
        meta: {
          title: '订单审核',
          icon: 'ri:file-list-3-line',
          keepAlive: true,
          roles: ['R_SUPER', 'R_ADMIN'],
          authList: [
            { title: '查看列表', authMark: 'order.list' },
            { title: '查看详情', authMark: 'order.view' },
            { title: '批准订单', authMark: 'order.approve' },
            { title: '驳回订单', authMark: 'order.reject' },
            { title: '删除订单', authMark: 'order.delete' }
          ]
        }
      }
    ]
  },
  {
    path: '/wallet',
    name: 'Wallet',
    component: '/index/index',
    meta: {
      title: '钱包管理',
      icon: 'ri:wallet-3-line',
      roles: ['R_SUPER', 'R_ADMIN']
    },
    children: [
      {
        path: 'orders',
        name: 'WalletOrders',
        component: '/admin/wallet/orders',
        meta: {
          title: '钱包订单',
          icon: 'ri:wallet-3-line',
          keepAlive: true,
          roles: ['R_SUPER', 'R_ADMIN'],
          authList: [
            { title: '查看', authMark: 'wallet_order.list' },
            { title: '通过', authMark: 'wallet_order.approve' },
            { title: '驳回', authMark: 'wallet_order.reject' }
          ]
        }
      }
    ]
  },
  {
    path: '/vps',
    name: 'VpsPage',
    component: '/admin/vps',
    meta: {
      title: 'VPS 管理',
      icon: 'ri:server-line',
      keepAlive: true,
      roles: ['R_SUPER', 'R_ADMIN'],
      authList: [
        { title: '列表', authMark: 'vps.list' },
        { title: '详情', authMark: 'vps.view' },
        { title: '创建', authMark: 'vps.create' },
        { title: '更新', authMark: 'vps.update' },
        { title: '删除', authMark: 'vps.delete' },
        { title: '锁定', authMark: 'vps.lock' },
        { title: '解锁', authMark: 'vps.unlock' },
        { title: '改配', authMark: 'vps.resize' },
        { title: '管理状态', authMark: 'vps.admin_status' },
        { title: '到期时间', authMark: 'vps.update_expire' },
        { title: '刷新', authMark: 'vps.refresh' },
        { title: '紧急续费', authMark: 'vps.emergency_renew' }
      ]
    }
  },
  {
    path: '/probes',
    name: 'Probes',
    component: '/index/index',
    meta: {
      title: '探针监控',
      icon: 'ri:radar-line',
      roles: ['R_SUPER', 'R_ADMIN']
    },
    children: [
      {
        path: 'list',
        name: 'ProbeList',
        component: '/admin/probe/list',
        meta: {
          title: '探针列表',
          icon: 'ri:radar-line',
          keepAlive: true,
          roles: ['R_SUPER', 'R_ADMIN'],
          authList: [
            { title: '列表', authMark: 'probe.list' },
            { title: '详情', authMark: 'probe.view' },
            { title: '创建', authMark: 'probe.create' },
            { title: '更新', authMark: 'probe.update' },
            { title: '删除', authMark: 'probe.delete' }
          ]
        }
      },
      {
        path: ':id',
        name: 'ProbeDetail',
        component: '/admin/probe/detail',
        meta: {
          title: '探针详情',
          icon: 'ri:radar-line',
          isHide: true,
          activePath: '/probes/list',
          roles: ['R_SUPER', 'R_ADMIN'],
          authList: [
            { title: '详情', authMark: 'probe.view' },
            { title: '更新', authMark: 'probe.update' }
          ]
        }
      }
    ]
  }
]
