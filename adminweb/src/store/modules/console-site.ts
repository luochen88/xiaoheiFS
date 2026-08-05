import { defineStore } from 'pinia'
import { getSiteSettings } from '@/api/console-user'
import AppConfig from '@/config'

export const useConsoleSiteStore = defineStore('consoleSiteStore', {
  state: () => ({
    siteName: '',
    logoUrl: '',
    faviconUrl: '',
    settings: {} as Record<string, string>
  }),
  getters: {
    resolvedSiteName: (state) => state.siteName || AppConfig.systemInfo.name
  },
  actions: {
    async fetchSettings() {
      try {
        const response = await getSiteSettings()
        const nextSettings: Record<string, string> = {}

        ;(response.items || []).forEach((item) => {
          const key = String(item.key || '').trim()
          if (key) {
            nextSettings[key] = String(item.value || '')
          }
        })

        this.settings = nextSettings
        this.siteName = nextSettings.site_name || '用户控制台'
        this.logoUrl = nextSettings.logo_url || nextSettings.site_logo || ''
        this.faviconUrl = nextSettings.favicon_url || nextSettings.site_favicon || ''
      } catch {
        this.siteName = this.siteName || '用户控制台'
      }
    }
  }
})
