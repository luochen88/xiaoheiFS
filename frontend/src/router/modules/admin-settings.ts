/**
 * 管理后台 · 系统配置 —— 负责人 W8
 *
 * 这里是**菜单即路由**：条目会驱动侧边栏，并在拿到 admin_path 后
 * 由 RouteRegistry 动态注册到 /<admin_path> 前缀下。
 * path 写成以 '/' 开头的绝对路径（不含 admin 前缀），前缀由 realm.ts 统一加。
 * meta 字段含义见 docs/frontend/adp-conventions.md 第 10 节。
 */
import type { AppRouteRecord } from '@/types/router'

export const adminSettingsRoutes: AppRouteRecord[] = [
  {
    path: '/settings',
    name: 'AdminSettings',
    component: '/index/index',
    meta: {
      title: '系统配置',
      icon: 'ri:settings-3-line',
      keepAlive: false,
      isHide: false,
      authList: [
        { title: '查看系统配置', authMark: 'settings.view' },
        { title: '查看 API Key', authMark: 'api_key.list' },
        { title: '查看插件', authMark: 'plugin.list' },
        { title: '查看支付设置', authMark: 'payment.list' },
        { title: '查看 SMTP 配置', authMark: 'smtp.view' },
        { title: '更新 SMTP 配置', authMark: 'smtp.update' },
        { title: '测试 SMTP', authMark: 'smtp.test' },
        { title: '查看邮件模板', authMark: 'email_template.list' },
        { title: '查看短信配置', authMark: 'sms.view' },
        { title: '更新短信配置', authMark: 'sms.update' },
        { title: '测试短信', authMark: 'sms.test' },
        { title: '查看短信模板', authMark: 'sms_template.list' }
      ]
    },
    children: [
      {
        path: 'site',
        name: 'AdminSettingsSite',
        component: '/admin/settings/site',
        meta: {
          title: '站点设置',
          icon: 'ri:global-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看设置', authMark: 'settings.view' },
            { title: '更新设置', authMark: 'settings.update' }
          ]
        }
      },
      {
        path: 'auth',
        name: 'AdminSettingsAuth',
        component: '/admin/settings/auth',
        meta: {
          title: '登录与注册',
          icon: 'ri:shield-keyhole-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看设置', authMark: 'settings.view' },
            { title: '更新设置', authMark: 'settings.update' }
          ]
        }
      },
      {
        path: 'captcha',
        name: 'AdminSettingsCaptcha',
        component: '/admin/settings/captcha',
        meta: {
          title: '验证码设置',
          icon: 'ri:shield-check-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看设置', authMark: 'settings.view' },
            { title: '更新设置', authMark: 'settings.update' }
          ]
        }
      },
      {
        path: 'email',
        name: 'AdminSettingsEmail',
        component: '/admin/settings/email',
        meta: {
          title: '邮件与模板',
          icon: 'ri:mail-settings-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看设置', authMark: 'settings.view' },
            { title: '更新设置', authMark: 'settings.update' },
            { title: '查看 SMTP 配置', authMark: 'smtp.view' },
            { title: '更新 SMTP 配置', authMark: 'smtp.update' },
            { title: '测试 SMTP', authMark: 'smtp.test' },
            { title: '查看邮件模板', authMark: 'email_template.list' },
            { title: '更新邮件模板', authMark: 'email_template.update' },
            { title: '删除邮件模板', authMark: 'email_template.delete' }
          ]
        }
      },
      {
        path: 'sms',
        name: 'AdminSettingsSms',
        component: '/admin/settings/sms',
        meta: {
          title: '短信设置',
          icon: 'ri:message-3-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看设置', authMark: 'settings.view' },
            { title: '更新设置', authMark: 'settings.update' },
            { title: '查看短信配置', authMark: 'sms.view' },
            { title: '更新短信配置', authMark: 'sms.update' },
            { title: '测试短信', authMark: 'sms.test' },
            { title: '查看短信模板', authMark: 'sms_template.list' },
            { title: '更新短信模板', authMark: 'sms_template.update' },
            { title: '删除短信模板', authMark: 'sms_template.delete' }
          ]
        }
      },
      {
        path: 'apikey',
        name: 'AdminSettingsApiKeys',
        component: '/admin/settings/api-keys',
        meta: {
          title: 'API Keys',
          icon: 'ri:key-2-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看 API Key', authMark: 'api_key.list' },
            { title: '创建 API Key', authMark: 'api_key.create' },
            { title: '更新 API Key', authMark: 'api_key.update' }
          ]
        }
      },
      {
        path: 'webhook',
        name: 'AdminSettingsWebhook',
        component: '/admin/settings/webhook',
        meta: {
          title: 'Webhook',
          icon: 'ri:webhook-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看机器人配置', authMark: 'robot.view' },
            { title: '更新机器人配置', authMark: 'robot.update' }
          ]
        }
      },
      {
        path: 'payments',
        name: 'AdminSettingsPayments',
        component: '/admin/settings/payments',
        meta: {
          title: '支付设置',
          icon: 'ri:bank-card-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看支付设置', authMark: 'payment.list' },
            { title: '更新支付设置', authMark: 'payment.update' }
          ]
        }
      },
      {
        path: 'fcm',
        name: 'AdminSettingsFcm',
        component: '/admin/settings/fcm',
        meta: {
          title: 'FCM 推送',
          icon: 'ri:notification-3-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看设置', authMark: 'settings.view' },
            { title: '更新设置', authMark: 'settings.update' }
          ]
        }
      },
      {
        path: 'pricing',
        name: 'AdminSettingsPricing',
        component: '/admin/settings/pricing',
        meta: {
          title: '价格与退款',
          icon: 'ri:money-cny-circle-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看设置', authMark: 'settings.view' },
            { title: '更新设置', authMark: 'settings.update' }
          ]
        }
      },
      {
        path: 'lifecycle',
        name: 'AdminSettingsLifecycle',
        component: '/admin/settings/lifecycle',
        meta: {
          title: '生命周期',
          icon: 'ri:time-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看设置', authMark: 'settings.view' },
            { title: '更新设置', authMark: 'settings.update' }
          ]
        }
      },
      {
        path: 'plugins',
        name: 'AdminSettingsPlugins',
        component: '/admin/settings/plugins',
        meta: {
          title: '插件管理',
          icon: 'ri:puzzle-2-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看插件', authMark: 'plugin.list' },
            { title: '查看插件配置', authMark: 'plugin.view' },
            { title: '创建插件', authMark: 'plugin.create' },
            { title: '更新插件', authMark: 'plugin.update' },
            { title: '删除插件', authMark: 'plugin.delete' },
            { title: '上传插件', authMark: 'plugin.upload' }
          ]
        }
      }
    ]
  },
  {
    path: '/realname',
    name: 'AdminRealname',
    component: '/index/index',
    meta: {
      title: '实名认证',
      icon: 'ri:shield-user-line',
      keepAlive: false,
      isHide: false,
      authList: [
        { title: '查看实名供应商和记录', authMark: 'realname.list' },
        { title: '查看实名配置', authMark: 'realname.view' }
      ]
    },
    children: [
      {
        path: 'providers',
        name: 'AdminRealnameProviders',
        component: '/admin/realname/providers',
        meta: {
          title: '实名供应商',
          icon: 'ri:service-line',
          keepAlive: true,
          isHide: false,
          authList: [{ title: '查看实名供应商', authMark: 'realname.list' }]
        }
      },
      {
        path: 'config',
        name: 'AdminRealnameConfig',
        component: '/admin/realname/config',
        meta: {
          title: '实名认证配置',
          icon: 'ri:settings-5-line',
          keepAlive: true,
          isHide: false,
          authList: [
            { title: '查看实名配置', authMark: 'realname.view' },
            { title: '更新实名配置', authMark: 'realname.update' }
          ]
        }
      },
      {
        path: 'records',
        name: 'AdminRealnameRecords',
        component: '/admin/realname/records',
        meta: {
          title: '实名认证记录',
          icon: 'ri:file-search-line',
          keepAlive: true,
          isHide: false,
          authList: [{ title: '查看实名记录', authMark: 'realname.list' }]
        }
      }
    ]
  }
]
