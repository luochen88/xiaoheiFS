import { AppRouteRecord } from '@/types/router'

export const systemsRoutes: AppRouteRecord = {
  path: '/systems',
  name: 'Systems',
  component: '/systems/index',
  meta: {
    title: '系统镜像',
    icon: 'ri:hard-drive-3-line',
    keepAlive: true,
    roles: ['R_SUPER', 'R_ADMIN'],
    authList: [
      { title: '系统镜像', authMark: 'system_image.list' },
      { title: '线路', authMark: 'line.list' }
    ]
  }
}
