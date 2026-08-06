import axios, { type AxiosRequestHeaders } from 'axios'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useAdminAuthStore } from '@/stores/adminAuth'
import { useAppStore } from '@/stores/app'
import { navigateReplace } from '@/services/navigate'

const apiBase = import.meta.env.VITE_API_BASE || ''

/**
 * 管理后台路径是后台可配置的，不能写死成 "/admin"。
 *
 * 这里直接读 services/adminPath.ts 落在 localStorage 的缓存，而不是 import 它的
 * getCachedAdminPath —— adminPath.ts 依赖本模块的 http 实例，静态引入会成环。
 */
function currentAdminPath(): string {
  try {
    return (
      (localStorage.getItem('admin_path_cache') || 'admin').trim().replace(/^\/+|\/+$/g, '') ||
      'admin'
    )
  } catch {
    return 'admin'
  }
}

function isOnAdminPath(): boolean {
  const p = window.location.pathname
  const prefix = `/${currentAdminPath()}`
  return p === prefix || p.startsWith(`${prefix}/`)
}

export const http = axios.create({
  baseURL: apiBase,
  timeout: 20000
})

let realnameModalOpen = false

const isAuthLoginRequest = (url: string): boolean => {
  if (!url) return false
  return url.includes('/api/v1/auth/login') || url.includes('/admin/api/v1/auth/login')
}

http.interceptors.request.use((config) => {
  const user = useAuthStore()
  const admin = useAdminAuthStore()
  const app = useAppStore()
  if (config.url?.startsWith('/api') && user.token) {
    config.headers = config.headers || ({} as AxiosRequestHeaders)
    config.headers.Authorization = `Bearer ${user.token}`
  }
  if (config.url?.startsWith('/admin/api') && admin.token) {
    config.headers = config.headers || ({} as AxiosRequestHeaders)
    config.headers.Authorization = `Bearer ${admin.token}`
  }
  if (config.headers && 'X-Use-Api-Key' in config.headers) {
    if (app.adminApiKey) {
      config.headers['X-API-Key'] = app.adminApiKey
    }
    delete config.headers['X-Use-Api-Key']
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    const errCode = error?.response?.data?.code
    const msg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      'Request failed'
    const url = error?.config?.url || ''
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (
      status === 403 &&
      url.startsWith('/admin/') &&
      (errCode === 'admin_2fa_required' || errCode === 'admin_2fa_bind_required')
    ) {
      const admin = useAdminAuthStore()
      admin.setMfaGateState({
        mfaRequired: errCode === 'admin_2fa_required',
        mfaBindRequired: errCode === 'admin_2fa_bind_required',
        mfaUnlocked: false
      })
      return Promise.reject(error)
    }
    if (status === 401) {
      if (isAuthLoginRequest(url)) {
        return Promise.reject(error)
      }
      if (url.startsWith('/admin/')) {
        const admin = useAdminAuthStore()
        admin.logout()
        // 401 之后必须把动态路由、菜单和按钮权限一起拆掉，否则下一个登录的
        // 管理员会继承上一个人的菜单（守卫看到已注册就会跳过重新注册）。
        void import('@/router/session').then(({ clearSession }) =>
          clearSession('admin', { keepStores: true })
        )
        if (isOnAdminPath()) {
          navigateReplace(`/${currentAdminPath()}/login?redirect=${encodeURIComponent(current)}`)
        }
      } else {
        const user = useAuthStore()
        user.logout()
        if (!isOnAdminPath()) {
          navigateReplace(`/login?redirect=${encodeURIComponent(current)}`)
        }
      }
      ElMessage.error('鉴权失败，请重新登录')
    } else if (
      status === 403 &&
      url.startsWith('/api') &&
      msg.toLowerCase().includes('real name required')
    ) {
      if (!realnameModalOpen) {
        realnameModalOpen = true
        ElMessageBox.confirm('该操作需要完成实名认证，是否前往认证页面？', '需要实名认证', {
          confirmButtonText: '去认证',
          cancelButtonText: '稍后再说',
          type: 'warning'
        })
          .then(() => {
            navigateReplace('/console/realname')
          })
          .catch(() => {})
          .finally(() => {
            realnameModalOpen = false
          })
      }
    } else if (status >= 500) {
      ElNotification.error({ title: '服务端错误', message: msg })
    } else {
      ElMessage.error(msg)
    }
    return Promise.reject(error)
  }
)

export const withApiKey = (headers: Record<string, string> = {}) => ({
  headers: {
    ...headers,
    'X-Use-Api-Key': '1'
  }
})
