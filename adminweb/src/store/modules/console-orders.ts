import { defineStore } from 'pinia'
import {
  getOrderDetail,
  listOrders,
  refreshOrder,
  type OrderItemRecord,
  type OrderPaymentRecord,
  type OrderRecord
} from '@/api/console-user'

export const useConsoleOrdersStore = defineStore('consoleOrdersStore', {
  state: () => ({
    items: [] as OrderRecord[],
    loading: false,
    total: 0,
    currentOrder: null as OrderRecord | null,
    orderItems: [] as OrderItemRecord[],
    orderPayments: [] as OrderPaymentRecord[],
    orderEvents: [] as Record<string, any>[]
  }),
  actions: {
    async fetchOrders(params?: Record<string, unknown>) {
      this.loading = true
      try {
        const response = await listOrders(params)
        this.items = response.items || []
        this.total = response.total || this.items.length
      } finally {
        this.loading = false
      }
    },
    async fetchOrderDetail(id: number | string) {
      const response = await getOrderDetail(id)
      this.currentOrder = response.order || null
      this.orderItems = response.items || []
      this.orderPayments = response.payments || []
      this.orderEvents = response.events || []
    },
    async refreshOrder(id: number | string) {
      await refreshOrder(id)
      await this.fetchOrderDetail(id)
    }
  }
})
