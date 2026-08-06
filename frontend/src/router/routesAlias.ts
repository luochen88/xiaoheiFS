/**
 * 路由别名
 *
 * 本应用是挂在站点根的单一 SPA，同时承载三个域（realm）：
 *   - public  公开营销站（含登录前购物车）
 *   - console 用户控制台 /console/*
 *   - admin   管理后台 /<admin_path>/*  （admin_path 由后端设置决定，运行时注册）
 */
export enum RoutesAlias {
  /** Art Design Pro 后台布局外壳（控制台与管理后台共用） */
  Layout = '/index/index',
  /** 公开营销站外壳 */
  PublicLayout = '/public/layout/index',

  /** 站点首页 */
  Home = '/',
  /** 终端用户登录 */
  Login = '/login',
  Register = '/register',
  ForgotPassword = '/forgot-password',
  ResetPassword = '/reset-password',

  /** 安装向导 */
  Install = '/install',

  /** 用户控制台首页 */
  Console = '/console',

  Exception403 = '/403',
  Exception404 = '/404',
  Exception500 = '/500'
}
