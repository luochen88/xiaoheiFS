import { defineStore } from 'pinia'
import {
  CONSOLE_USER_TOKEN_KEY,
  getMe,
  setConsoleUnauthorizedHandler,
  updateMe,
  userLogin,
  type ConsoleUserProfile
} from '@/api/console-user'
import { useConsoleCartStore } from './console-cart'
import { useConsoleCatalogStore } from './console-catalog'
import { useConsoleDashboardStore } from './console-dashboard'
import { useConsoleOrdersStore } from './console-orders'
import { useConsoleSiteStore } from './console-site'
import { useConsoleVpsStore } from './console-vps'

interface ConsoleUserState {
  token: string
  profile: ConsoleUserProfile | null
  loading: boolean
}

function readInitialToken(): string {
  if (typeof localStorage === 'undefined') {
    return ''
  }
  return localStorage.getItem(CONSOLE_USER_TOKEN_KEY) || ''
}

export const useConsoleUserStore = defineStore('consoleUserStore', {
  state: (): ConsoleUserState => ({
    token: readInitialToken(),
    profile: null,
    loading: false
  }),
  getters: {
    isLogin: (state) => Boolean(state.token),
    displayName: (state) => state.profile?.username || state.profile?.email || '用户',
    avatarUrl: (state) => {
      if (state.profile?.avatar_url) {
        return state.profile.avatar_url
      }
      if (state.profile?.avatar) {
        return state.profile.avatar
      }
      if (state.profile?.qq) {
        return `https://q1.qlogo.cn/g?b=qq&nk=${state.profile.qq}&s=100`
      }
      return ''
    }
  },
  actions: {
    setToken(token: string) {
      const tokenChanged = this.token !== token
      this.token = token
      if (tokenChanged) {
        this.profile = null
        this.clearConsoleState()
      }
      if (token) {
        localStorage.setItem(CONSOLE_USER_TOKEN_KEY, token)
      } else {
        localStorage.removeItem(CONSOLE_USER_TOKEN_KEY)
      }
    },
    clearConsoleState() {
      useConsoleCartStore().$reset()
      useConsoleCatalogStore().$reset()
      useConsoleDashboardStore().$reset()
      useConsoleOrdersStore().$reset()
      useConsoleSiteStore().$reset()
      useConsoleVpsStore().$reset()
    },
    async login(payload: Record<string, unknown>) {
      this.loading = true
      try {
        const response = await userLogin(payload)
        const token = response.access_token || ''
        this.setToken(token)
        this.profile = response.user || null
        return token
      } finally {
        this.loading = false
      }
    },
    async fetchMe() {
      if (!this.token) {
        this.profile = null
        return null
      }
      try {
        const response = await getMe()
        this.profile = response || null
        return this.profile
      } catch (error) {
        this.logout()
        throw error
      }
    },
    async updateProfile(payload: Record<string, unknown>) {
      const response = await updateMe(payload)
      this.profile = response || null
      return this.profile
    },
    logout() {
      this.setToken('')
      this.profile = null
      this.clearConsoleState()
    }
  }
})

setConsoleUnauthorizedHandler(() => {
  useConsoleUserStore().logout()
})
