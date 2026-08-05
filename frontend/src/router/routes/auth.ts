/**
 * 认证与安装向导路由 —— 负责人 W2
 *
 * 全屏页，不套任何外壳。视觉上遵循 ADP 登录页家族（规范圣经 §13）。
 */
import type { AppRouteRecordRaw } from '@/utils/router'

export const authRoutes: AppRouteRecordRaw[] = [
  // { path: '/login', name: 'Login', component: () => import('@views/auth/login/index.vue'), meta: { title: '登录', realm: 'public', isHideTab: true } },
  // /register、/forgot-password、/reset-password、/install 同理
]
