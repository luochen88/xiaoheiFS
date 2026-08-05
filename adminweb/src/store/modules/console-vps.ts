import { defineStore } from 'pinia'
import { getVpsDetail, listVps, refreshVps, type VpsRecord } from '@/api/console-user'

export const useConsoleVpsStore = defineStore('consoleVpsStore', {
  state: () => ({
    items: [] as VpsRecord[],
    loading: false,
    current: null as VpsRecord | null
  }),
  actions: {
    async fetchVps() {
      this.loading = true
      try {
        const response = await listVps()
        this.items = response.items || []
      } finally {
        this.loading = false
      }
    },
    async fetchDetail(id: number | string) {
      const response = await getVpsDetail(id)
      this.current = response || null
    },
    async refresh(id: number | string) {
      await refreshVps(id)
      await this.fetchDetail(id)
      await this.fetchVps()
    }
  }
})
