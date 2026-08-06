/**
 * 认证与安装向导路由 —— 负责人 W2
 *
 * 全屏页，不套任何外壳。视觉上遵循 ADP 登录页家族（规范圣经 §13）。
 */
import type { AppRouteRecordRaw } from '@/utils/router'
import type { RouteLocationNormalized } from 'vue-router'
import { checkAdminPath } from '@/services/adminPath'

const validateAdminPathRoute = async (to: RouteLocationNormalized) => {
  const result = await checkAdminPath(String(to.params.adminPath || ''))
  return result.isAdmin ? true : { name: 'Exception404', replace: true }
}

export const authRoutes: AppRouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@views/auth/login/index.vue'),
    meta: { title: '登录', realm: 'public', isHideTab: true, isFullPage: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@views/auth/register/index.vue'),
    meta: { title: '注册', realm: 'public', isHideTab: true, isFullPage: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@views/auth/forgot-password/index.vue'),
    meta: { title: '找回密码', realm: 'public', isHideTab: true, isFullPage: true }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@views/auth/reset-password/index.vue'),
    meta: { title: '重置密码', realm: 'public', isHideTab: true, isFullPage: true }
  },
  {
    path: '/:adminPath/login',
    name: 'AdminLogin',
    component: () => import('@views/admin/auth/login/index.vue'),
    beforeEnter: validateAdminPathRoute,
    meta: { title: '管理员登录', realm: 'public', isHideTab: true, isFullPage: true }
  },
  {
    path: '/:adminPath/forgot-password',
    name: 'AdminForgotPassword',
    component: () => import('@views/admin/auth/forgot-password/index.vue'),
    beforeEnter: validateAdminPathRoute,
    meta: { title: '找回管理密码', realm: 'public', isHideTab: true, isFullPage: true }
  },
  {
    path: '/:adminPath/reset-password',
    name: 'AdminResetPassword',
    component: () => import('@views/admin/auth/reset-password/index.vue'),
    beforeEnter: validateAdminPathRoute,
    meta: { title: '重置管理密码', realm: 'public', isHideTab: true, isFullPage: true }
  },
  {
    path: '/:adminPath',
    name: 'AdminRealmRoot',
    component: () => import('@views/exception/404/index.vue'),
    meta: { title: '管理后台', realm: 'admin', isHideTab: true, isFullPage: true }
  },
  {
    path: '/:adminPath/:pathMatch(.*)*',
    name: 'AdminRealmCatchAll',
    component: () => import('@views/exception/404/index.vue'),
    meta: { title: '管理后台', realm: 'admin', isHideTab: true, isFullPage: true }
  },
  {
    path: '/install',
    name: 'Install',
    component: () => import('@views/install/index.vue'),
    meta: { title: '安装向导', realm: 'public', isHideTab: true, isFullPage: true }
  }
]
