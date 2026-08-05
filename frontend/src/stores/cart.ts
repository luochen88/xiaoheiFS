import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { addCartItem, clearCart, deleteCartItem, listCart, updateCartItem } from '@/services/user'
import type { CartItem, CartItemRequest, CartSpec } from '@/services/types'
import { useAuthStore } from '@/stores/auth'

export interface CartStoreItem {
  id: number | string
  package_id: number
  system_id?: number
  spec: CartSpec
  qty: number
  amount: number
  source: 'guest' | 'server'
}

export interface AddCartPayload extends CartItemRequest {
  amount?: number
}

type CompatibleCartItem = CartItem & Record<string, unknown>

const parseSpec = (spec: unknown): CartSpec => {
  if (!spec) return {}
  if (typeof spec === 'string') {
    try {
      return JSON.parse(spec) as CartSpec
    } catch {
      return {}
    }
  }
  return spec as CartSpec
}

const sortValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortValue)
  if (!value || typeof value !== 'object') return value
  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = sortValue((value as Record<string, unknown>)[key])
      return result
    }, {})
}

const specKey = (packageId: number, spec: CartSpec) =>
  `${packageId}:${JSON.stringify(sortValue(spec))}`

const normalizeServerItem = (row: CompatibleCartItem): CartStoreItem => {
  const spec = parseSpec(row.spec ?? row.Spec ?? row.spec_json ?? row.SpecJSON)
  const qty = Math.max(1, Number(row.qty ?? row.Qty ?? 1))
  const amount = Number(row.amount ?? row.Amount ?? 0)
  return {
    id: (row.id ?? row.ID ?? '') as number | string,
    package_id: Number(row.package_id ?? row.PackageID ?? 0),
    system_id: Number(row.system_id ?? row.SystemID ?? 0) || undefined,
    spec,
    qty,
    amount,
    source: 'server'
  }
}

const createGuestId = () => `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const toServerPayload = (item: CartStoreItem): CartItemRequest => ({
  package_id: item.package_id,
  system_id: item.system_id,
  spec: item.spec,
  qty: item.qty
})

export const useCartStore = defineStore(
  'cart',
  () => {
    const auth = useAuthStore()
    const guestItems = ref<CartStoreItem[]>([])
    const serverItems = ref<CartStoreItem[]>([])
    const loading = ref(false)
    const merging = ref(false)
    let mergePromise: Promise<{ failed: number }> | null = null

    const isGuest = computed(() => !auth.token)
    const items = computed(() =>
      isGuest.value ? guestItems.value : [...serverItems.value, ...guestItems.value]
    )
    const itemCount = computed(() =>
      items.value.reduce((total, item) => total + Math.max(1, Number(item.qty || 1)), 0)
    )

    const loadServerCart = async () => {
      const response = await listCart()
      serverItems.value = (response.data?.items ?? []).map((row) =>
        normalizeServerItem(row as CompatibleCartItem)
      )
      return serverItems.value
    }

    const coalesceGuestItems = () => {
      const merged = new Map<string, CartStoreItem>()
      guestItems.value.forEach((item) => {
        const key = specKey(item.package_id, item.spec)
        const current = merged.get(key)
        if (current) {
          current.qty += item.qty
          current.amount += item.amount
          return
        }
        merged.set(key, { ...item, spec: { ...item.spec }, source: 'guest' })
      })
      guestItems.value = Array.from(merged.values())
    }

    const mergeGuestCart = async (): Promise<{ failed: number }> => {
      if (!auth.token || guestItems.value.length === 0) return { failed: 0 }
      if (mergePromise) return mergePromise

      mergePromise = (async () => {
        merging.value = true
        coalesceGuestItems()
        const pending = [...guestItems.value]
        const failed: CartStoreItem[] = []

        try {
          const remoteItems = await loadServerCart()

          for (const guestItem of pending) {
            try {
              const matchingRemote = remoteItems.find(
                (item) =>
                  specKey(item.package_id, item.spec) ===
                  specKey(guestItem.package_id, guestItem.spec)
              )
              const createdResponse = await addCartItem(toServerPayload(guestItem))
              const created = normalizeServerItem(createdResponse.data as CompatibleCartItem)

              if (matchingRemote?.id && created.id) {
                await deleteCartItem(created.id)
                await updateCartItem(matchingRemote.id, {
                  spec: matchingRemote.spec,
                  qty: matchingRemote.qty + guestItem.qty
                })
                matchingRemote.qty += guestItem.qty
              } else {
                remoteItems.push(created)
              }
            } catch {
              failed.push(guestItem)
            }
          }

          guestItems.value = failed
          await loadServerCart()
          if (failed.length > 0) {
            ElMessage.warning(`${failed.length} 个购物车项目合并失败，已保留在本地`)
          }
          return { failed: failed.length }
        } finally {
          merging.value = false
          mergePromise = null
        }
      })()

      return mergePromise
    }

    const fetchCart = async () => {
      loading.value = true
      try {
        if (isGuest.value) {
          coalesceGuestItems()
          return
        }
        if (guestItems.value.length > 0) {
          await mergeGuestCart()
        } else {
          await loadServerCart()
        }
      } finally {
        loading.value = false
      }
    }

    const addItem = async (payload: AddCartPayload) => {
      const spec = parseSpec(payload.spec)
      const qty = Math.max(1, Number(payload.qty ?? 1))
      const packageId = Number(payload.package_id ?? 0)

      if (!packageId) throw new Error('package_id is required')

      if (!isGuest.value) {
        await addCartItem({ ...payload, spec, qty })
        await loadServerCart()
        return
      }

      const key = specKey(packageId, spec)
      const current = guestItems.value.find((item) => specKey(item.package_id, item.spec) === key)
      if (current) {
        current.qty += qty
        current.amount += Number(payload.amount ?? 0) * qty
        return
      }

      guestItems.value.push({
        id: createGuestId(),
        package_id: packageId,
        system_id: payload.system_id,
        spec,
        qty,
        amount: Number(payload.amount ?? 0) * qty,
        source: 'guest'
      })
    }

    const updateItem = async (id: number | string, payload: Partial<AddCartPayload>) => {
      const target = items.value.find((item) => String(item.id) === String(id))
      if (!target) return
      const qty = Math.max(1, Number(payload.qty ?? target.qty))
      const spec = parseSpec(payload.spec ?? target.spec)

      if (target.source === 'guest' || isGuest.value) {
        const unitAmount = target.amount / Math.max(1, target.qty)
        target.qty = qty
        target.spec = spec
        target.amount = unitAmount * qty
        return
      }

      await updateCartItem(id, { spec, qty })
      await loadServerCart()
    }

    const removeItem = async (id: number | string) => {
      const target = items.value.find((item) => String(item.id) === String(id))
      if (!target) return
      if (target.source === 'guest' || isGuest.value) {
        guestItems.value = guestItems.value.filter((item) => String(item.id) !== String(id))
        return
      }
      await deleteCartItem(id)
      await loadServerCart()
    }

    const clearAll = async () => {
      if (isGuest.value) {
        guestItems.value = []
        return
      }
      await clearCart()
      serverItems.value = []
      guestItems.value = []
    }

    const clear = () => {
      guestItems.value = []
      serverItems.value = []
    }

    watch(
      () => auth.token,
      (token) => {
        if (!token) {
          serverItems.value = []
          return
        }
        void mergeGuestCart()
      }
    )

    return {
      guestItems,
      serverItems,
      items,
      loading,
      merging,
      isGuest,
      itemCount,
      fetchCart,
      addItem,
      updateItem,
      removeItem,
      clearAll,
      clear,
      mergeGuestCart
    }
  },
  {
    persist: {
      key: 'guest-cart',
      storage: localStorage,
      pick: ['guestItems']
    }
  }
)
