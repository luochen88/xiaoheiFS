import { defineStore } from 'pinia'
import { userLogin, getMe, updateMe } from '@/services/user'

const STORAGE_KEY = 'user_token'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(STORAGE_KEY) || '',
    loading: false,
    profile: null
  }),
  actions: {
    async login(payload) {
      this.loading = true
      try {
        const res = await userLogin(payload)
        const token = res.data?.access_token || ''
        this.profile = res.data?.user || null
        this.token = token
        if (token) {
          localStorage.setItem(STORAGE_KEY, token)
          // 把登录前攒下的游客购物车并入服务端购物车。
          //
          // cart store 自己 watch 了 token，但只有在它已经被实例化时才会触发；
          // 直接打开 /login 时公开站外壳没挂载过，watcher 不存在。游客购物车是
          // 持久化的，所以这里显式实例化并合并一次，避免要等用户走到购物车页才生效。
          //
          // 故意不覆盖模拟登录（impersonation）：那是管理员以用户身份进入，
          // 把管理员匿名浏览时攒的购物车并进真实用户的账号是错的。
          void (await import('@/stores/cart')).useCartStore().mergeGuestCart()
        }
        return token
      } catch {
        return ''
      } finally {
        this.loading = false
      }
    },
    async fetchMe() {
      const res = await getMe()
      this.profile = res.data || null
    },
    async updateProfile(payload) {
      const res = await updateMe(payload)
      this.profile = res.data || null
    },
    logout() {
      this.token = ''
      this.profile = null
      localStorage.removeItem(STORAGE_KEY)
    }
  }
})
