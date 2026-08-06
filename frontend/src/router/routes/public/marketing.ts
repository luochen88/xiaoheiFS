/**
 * 公开营销站路由 —— 负责人 W1
 *
 * 这些页面是 PublicLayout 的子路由，路径相对于 '/'。
 * 迁移一个页面就往这里加一项，不要改动别的路由文件。
 */
import type { AppRouteRecordRaw } from '@/utils/router'

export const marketingRoutes: AppRouteRecordRaw[] = [
  {
    path: '',
    name: 'PublicHome',
    component: () => import('@views/public/home/index.vue'),
    meta: { title: '首页', realm: 'public' }
  },
  {
    path: 'products',
    name: 'PublicProducts',
    component: () => import('@views/public/products/index.vue'),
    meta: { title: '产品服务', realm: 'public' }
  },
  {
    path: 'help',
    name: 'PublicHelp',
    component: () => import('@views/public/help/index.vue'),
    meta: { title: '帮助中心', realm: 'public' }
  },
  {
    path: 'docs',
    name: 'PublicDocs',
    component: () => import('@views/public/posts/index.vue'),
    meta: {
      title: '文档中心',
      subtitle: '产品文档、配置指南与最佳实践',
      categoryKey: 'docs',
      realm: 'public'
    }
  },
  {
    path: 'announcements',
    name: 'PublicAnnouncements',
    component: () => import('@views/public/posts/index.vue'),
    meta: {
      title: '产品公告',
      subtitle: '服务更新、维护通知与产品动态',
      categoryKey: 'announcements',
      realm: 'public'
    }
  },
  {
    path: 'activities',
    name: 'PublicActivities',
    component: () => import('@views/public/posts/index.vue'),
    meta: {
      title: '活动中心',
      subtitle: '优惠活动与社区动态',
      categoryKey: 'activities',
      realm: 'public'
    }
  },
  {
    path: 'tutorials',
    name: 'PublicTutorials',
    component: () => import('@views/public/posts/index.vue'),
    meta: {
      title: '教程学院',
      subtitle: '从入门到进阶的实用教程',
      categoryKey: 'tutorials',
      realm: 'public'
    }
  },
  {
    path: ':category(docs|announcements|activities|tutorials)/:slug',
    name: 'PublicPostDetail',
    component: () => import('@views/public/posts/detail.vue'),
    meta: { title: '文章详情', realm: 'public' }
  },
  {
    path: 'maintenance',
    name: 'PublicMaintenance',
    component: () => import('@views/public/maintenance/index.vue'),
    meta: { title: '系统维护', realm: 'public' }
  },
  {
    path: ':pathMatch(.*)*',
    name: 'PublicNotFound',
    component: () => import('@views/public/not-found/index.vue'),
    meta: { title: '页面不存在', realm: 'public' }
  }
]
