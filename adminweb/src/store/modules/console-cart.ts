import { defineStore } from 'pinia'
import {
  addCartItem,
  clearCart,
  deleteCartItem,
  listCart,
  updateCartItem,
  type CartItem,
  type CartItemRequest,
  type CartSpec
} from '@/api/console-user'

export interface NormalizedCartItem {
  id?: number
  package_id?: number
  system_id?: number
  spec: CartSpec
  qty?: number
  amount?: number
  created_at?: string
}

function parseSpec(spec: CartItem['spec']): CartSpec {
  if (!spec) {
    return {}
  }
  if (typeof spec === 'string') {
    try {
      return JSON.parse(spec) as CartSpec
    } catch {
      return {}
    }
  }
  return spec
}

function normalizeCartItem(row: CartItem): NormalizedCartItem {
  const raw = row as Record<string, any>
  return {
    id: raw.id ?? raw.ID,
    package_id: raw.package_id ?? raw.PackageID,
    system_id: raw.system_id ?? raw.SystemID,
    spec: parseSpec(raw.spec ?? raw.Spec ?? raw.spec_json ?? raw.SpecJSON),
    qty: raw.qty ?? raw.Qty,
    amount: raw.amount ?? raw.Amount,
    created_at: raw.created_at ?? raw.CreatedAt
  }
}

export const useConsoleCartStore = defineStore('consoleCartStore', {
  state: () => ({
    items: [] as NormalizedCartItem[],
    loading: false
  }),
  getters: {
    count: (state) => state.items.length,
    totalAmount: (state) => state.items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  },
  actions: {
    async fetchCart() {
      this.loading = true
      try {
        const response = await listCart()
        this.items = (response.items || []).map(normalizeCartItem)
      } finally {
        this.loading = false
      }
    },
    async addItem(payload: CartItemRequest) {
      await addCartItem(payload)
      await this.fetchCart()
    },
    async updateItem(id: number | string, payload: CartItemRequest) {
      await updateCartItem(id, payload)
      await this.fetchCart()
    },
    async removeItem(id: number | string) {
      await deleteCartItem(id)
      await this.fetchCart()
    },
    async clearAll() {
      await clearCart()
      this.items = []
    },
    clear() {
      this.items = []
    }
  }
})
