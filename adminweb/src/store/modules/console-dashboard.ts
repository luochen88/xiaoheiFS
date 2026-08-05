import { defineStore } from 'pinia'
import { getDashboard, getRealNameStatus, getWallet, listOrders, listVps } from '@/api/console-user'
import { normalizeWallet } from '@/utils/console-user'

function toDateKey(value: unknown): string {
  const date = new Date(String(value || ''))
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

function withinDays(value: unknown, days: number): boolean {
  const date = new Date(String(value || ''))
  if (Number.isNaN(date.getTime())) {
    return false
  }
  const diff = date.getTime() - Date.now()
  return diff <= days * 24 * 3600 * 1000 && diff >= 0
}

export const useConsoleDashboardStore = defineStore('consoleDashboardStore', {
  state: () => ({
    loading: false,
    metrics: {} as Record<string, any>,
    charts: {} as Record<string, any>,
    wallet: null as Record<string, any> | null,
    realname: null as Record<string, any> | null
  }),
  actions: {
    async fetchUserDashboard() {
      this.loading = true
      try {
        const [dashboard, ordersPayload, vpsPayload, walletPayload, realname] = await Promise.all([
          getDashboard(),
          listOrders({ limit: 200, offset: 0 }),
          listVps(),
          getWallet(),
          getRealNameStatus()
        ])

        const orders = ordersPayload.items || []
        const vpsList = vpsPayload.items || []
        const wallet = normalizeWallet(walletPayload)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000

        const recentOrders = orders.filter((order) => {
          const row = order as Record<string, any>
          const createdAt = new Date(row.created_at ?? row.CreatedAt).getTime()
          return !Number.isNaN(createdAt) && createdAt >= thirtyDaysAgo
        })

        const spend30 = recentOrders.reduce((sum, order) => {
          const row = order as Record<string, any>
          return sum + Number(row.total_amount ?? row.TotalAmount ?? 0)
        }, 0)

        const realnameStatus = realname.verified
          ? 'verified'
          : realname.verification?.status || (realname.enabled ? 'unverified' : 'disabled')

        this.metrics = {
          vps_total: dashboard.vps || vpsList.length,
          expiring:
            dashboard.expiring ||
            vpsList.filter((vps) => withinDays((vps as Record<string, any>).expire_at, 7)).length,
          orders_total: dashboard.orders || orders.length,
          pending_orders:
            dashboard.pending_review ||
            orders.filter((order) => (order as Record<string, any>).status === 'pending_review')
              .length,
          spend_30d: dashboard.spend_30d || spend30,
          balance: wallet.balance ?? 0,
          currency: wallet.currency || 'CNY',
          realname_status: realnameStatus,
          cart_items: 0
        }

        this.wallet = wallet
        this.realname = realname

        const trendMap = new Map<string, number>()
        recentOrders.forEach((order) => {
          const row = order as Record<string, any>
          const key = toDateKey(row.created_at ?? row.CreatedAt)
          if (!key) return
          trendMap.set(
            key,
            (trendMap.get(key) || 0) + Number(row.total_amount ?? row.TotalAmount ?? 0)
          )
        })

        const statusMap = new Map<string, number>()
        orders.forEach((order) => {
          const key = String((order as Record<string, any>).status || 'unknown')
          statusMap.set(key, (statusMap.get(key) || 0) + 1)
        })

        const labels = Array.from(trendMap.keys()).sort()
        this.charts = {
          spendTrend: {
            labels,
            values: labels.map((key) => trendMap.get(key) || 0)
          },
          orderStatus: Array.from(statusMap.entries()).map(([name, value]) => ({ name, value })),
          expiringList: vpsList.filter((vps) => (vps as Record<string, any>).expire_at).slice(0, 5)
        }
      } finally {
        this.loading = false
      }
    }
  }
})
