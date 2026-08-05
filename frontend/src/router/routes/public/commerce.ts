/**
 * 公开选购与购物车路由 —— 负责人 W4
 *
 * 注意：按方案 §7，选购页与购物车对未登录用户开放，
 * 只有结算下单时才要求登录，因此它们挂在 public 域而不是 console 域。
 */
import type { AppRouteRecordRaw } from '@/utils/router'

export const commerceRoutes: AppRouteRecordRaw[] = [
  // { path: 'buy',  name: 'PublicBuy',  component: () => import('@views/public/buy/index.vue'),  meta: { title: '选购', realm: 'public' } },
  // { path: 'cart', name: 'PublicCart', component: () => import('@views/public/cart/index.vue'), meta: { title: '购物车', realm: 'public' } },
]
