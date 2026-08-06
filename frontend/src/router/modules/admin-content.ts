/**
 * 管理后台 · 用户与内容 —— 负责人 W7
 *
 * 这里是**菜单即路由**：条目会驱动侧边栏，并在拿到 admin_path 后
 * 由 RouteRegistry 动态注册到 /<admin_path> 前缀下。
 * path 写成以 '/' 开头的绝对路径（不含 admin 前缀），前缀由 realm.ts 统一加。
 * meta 字段含义见 docs/frontend/adp-conventions.md 第 10 节。
 */
import type { AppRouteRecord } from '@/types/router'

export const adminContentRoutes: AppRouteRecord[] = [
  {
    path: '/system',
    name: 'AdminSystem',
    component: '/index/index',
    meta: { title: '用户与权限', icon: 'ri:user-settings-line' },
    children: [
      {
        path: 'user',
        name: 'User',
        component: '/admin/system/user',
        meta: {
          title: '用户管理',
          icon: 'ri:user-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看用户列表', authMark: 'user.list' },
            { title: '查看用户详情', authMark: 'user.view' }
          ]
        }
      },
      {
        path: 'user-tiers',
        name: 'SystemUserTiersPage',
        component: '/admin/system/user-tiers',
        meta: {
          title: '用户等级',
          icon: 'ri:vip-crown-line',
          keepAlive: true,
          isHide: false,
          authList: [{ title: '查看用户等级', authMark: 'user.list' }]
        }
      },
      {
        path: 'admins',
        name: 'SystemAdminPage',
        component: '/admin/system/admin',
        meta: {
          title: '管理员管理',
          icon: 'ri:admin-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看管理员列表', authMark: 'admin.list' },
            { title: '查看管理员详情', authMark: 'admin.view' }
          ]
        }
      },
      {
        path: 'permission-groups',
        name: 'SystemPermissionGroupPage',
        component: '/admin/system/permission-group',
        meta: {
          title: '权限组管理',
          icon: 'ri:shield-user-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看权限组列表', authMark: 'permission_group.list' },
            { title: '查看权限组详情', authMark: 'permission_group.view' }
          ]
        }
      },
      {
        path: 'profile',
        name: 'UserCenter',
        component: '/admin/system/profile',
        meta: {
          title: '个人资料',
          icon: 'ri:profile-line',
          keepAlive: true,
          isHide: true,
          authList: []
        }
      }
    ]
  },
  {
    path: '/tickets',
    name: 'AdminTickets',
    component: '/index/index',
    meta: { title: '工单管理', icon: 'ri:customer-service-2-line' },
    children: [
      {
        path: 'list',
        name: 'TicketList',
        component: '/admin/ticket',
        meta: {
          title: '工单列表',
          icon: 'ri:list-check-3',
          keepAlive: true,
          isHide: false,
          authList: [{ title: '查看工单', authMark: 'tickets.list' }]
        }
      },
      {
        path: ':id',
        name: 'TicketDetail',
        component: '/admin/ticket/detail',
        meta: {
          title: '工单详情',
          icon: 'ri:file-list-3-line',
          keepAlive: false,
          isHide: true,
          activePath: '/tickets/list',
          authList: [{ title: '查看详情', authMark: 'tickets.view' }]
        }
      }
    ]
  },
  {
    path: '/audit',
    name: 'AuditLogs',
    component: '/admin/audit',
    meta: {
      title: '审计日志',
      icon: 'ri:shield-keyhole-line',
      keepAlive: true,
      isHide: false,
      authList: [{ title: '查看审计日志', authMark: 'audit_log.view' }]
    }
  },
  {
    path: '/systems',
    name: 'SystemsPage',
    component: '/admin/systems',
    meta: {
      title: '系统镜像',
      icon: 'ri:hard-drive-3-line',
      keepAlive: true,
      isHide: false,
      authList: [{ title: '查看系统镜像', authMark: 'system_image.list' }]
    }
  },
  {
    path: '/scheduled-tasks',
    name: 'ScheduledTasksPage',
    component: '/admin/ops/scheduled-tasks',
    meta: {
      title: '计划任务',
      icon: 'ri:time-line',
      keepAlive: true,
      isHide: false,
      authList: [{ title: '查看任务', authMark: 'scheduled_tasks.list' }]
    }
  },
  {
    path: '/catalog',
    name: 'CatalogPage',
    component: '/admin/catalog',
    meta: {
      title: '售卖配置',
      icon: 'ri:store-3-line',
      keepAlive: true,
      isHide: false,
      authList: [
        { title: '商品类型', authMark: 'goods_type.list' },
        { title: '地区', authMark: 'region.list' },
        { title: '线路', authMark: 'plan_group.list' },
        { title: '套餐', authMark: 'package.list' },
        { title: '镜像', authMark: 'system_image.list' }
      ]
    }
  },
  {
    path: '/marketing',
    name: 'AdminMarketing',
    component: '/index/index',
    meta: { title: '营销中心', icon: 'ri:coupon-3-line' },
    children: [
      {
        path: 'coupons',
        name: 'MarketingCoupons',
        component: '/admin/marketing/coupons',
        meta: {
          title: '优惠券',
          icon: 'ri:coupon-2-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看优惠组', authMark: 'coupon_group.list' },
            { title: '查看优惠券', authMark: 'coupon.list' }
          ]
        }
      }
    ]
  },
  {
    path: '/automation',
    name: 'AutomationPage',
    component: '/admin/automation',
    meta: {
      title: '自动化对接',
      icon: 'ri:links-line',
      keepAlive: true,
      isHide: false,
      authList: [{ title: '查看自动化', authMark: 'automation.view' }]
    }
  },
  {
    path: '/debug',
    name: 'DebugPage',
    component: '/admin/debug',
    meta: {
      title: '调试中心',
      icon: 'ri:bug-line',
      keepAlive: true,
      isHide: false,
      authList: [{ title: '查看调试', authMark: 'debug.view' }]
    }
  },
  {
    path: '/cms',
    name: 'AdminCms',
    component: '/index/index',
    meta: { title: '内容管理', icon: 'ri:article-line' },
    children: [
      {
        path: 'categories',
        name: 'CmsCategoriesPage',
        component: '/admin/cms/categories',
        meta: {
          title: '分类管理',
          icon: 'ri:folder-line',
          keepAlive: true,
          isHide: false,
          authList: [{ title: '查看分类', authMark: 'cms_category.list' }]
        }
      },
      {
        path: 'posts',
        name: 'CmsPostsPage',
        component: '/admin/cms/posts',
        meta: {
          title: '文章管理',
          icon: 'ri:file-text-line',
          keepAlive: true,
          isHide: false,
          authList: [{ title: '查看文章', authMark: 'cms_post.list' }]
        }
      },
      {
        path: 'blocks',
        name: 'CmsBlocksPage',
        component: '/admin/cms/blocks',
        meta: {
          title: '区块管理',
          icon: 'ri:layout-grid-line',
          keepAlive: true,
          isHide: false,
          authList: [{ title: '查看区块', authMark: 'cms_block.list' }]
        }
      },
      {
        path: 'nav-items',
        name: 'CmsNavItemsPage',
        component: '/admin/cms/nav-items',
        meta: {
          title: '导航配置',
          icon: 'ri:navigation-line',
          keepAlive: true,
          isHide: false,
          authList: [{ title: '查看导航', authMark: 'settings.view' }]
        }
      },
      {
        path: 'uploads',
        name: 'CmsUploadsPage',
        component: '/admin/cms/uploads',
        meta: {
          title: '素材上传',
          icon: 'ri:upload-cloud-2-line',
          keepAlive: true,
          isHide: false,
          authList: [{ title: '查看素材', authMark: 'upload.list' }]
        }
      }
    ]
  }
]
