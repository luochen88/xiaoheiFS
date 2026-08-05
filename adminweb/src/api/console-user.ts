import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

export interface UserApiList<T> {
  items?: T[]
  total?: number
}

export type AnyRecord = Record<string, any>

export interface ConsoleUserProfile {
  id?: number
  username?: string
  email?: string
  email_masked?: string
  email_bound?: boolean
  qq?: string
  phone?: string
  phone_masked?: string
  phone_bound?: boolean
  totp_enabled?: boolean
  avatar?: string
  avatar_url?: string
  bio?: string
  intro?: string
  role?: string
  status?: string
  balance?: number
  created_at?: string
  updated_at?: string
}

export interface ConsoleSecurityContacts {
  email_bound?: boolean
  phone_bound?: boolean
  email_masked?: string
  phone_masked?: string
  totp_enabled?: boolean
  security_level?: Record<string, unknown>
}

export interface TwoFASetupResponse {
  secret?: string
  otpauth_url?: string
}

export interface SecurityTicketResponse {
  security_ticket?: string
  expires_in?: number
}

export interface ConsoleAuthResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  user?: ConsoleUserProfile
}

export interface NavigationURLResponse {
  url?: string
}

export type PasswordResetChannel = 'email' | 'sms'

export interface AuthSettings {
  login_captcha_enabled?: boolean
  captcha_provider?: 'image' | 'geetest'
  auth_geetest_captcha_id?: string
  auth_password_reset_enabled?: boolean
  auth_password_reset_channels?: PasswordResetChannel[]
  auth_password_reset_verify_ttl_sec?: number
  password_min_len?: number
  password_require_upper?: boolean
  password_require_lower?: boolean
  password_require_number?: boolean
  password_require_symbol?: boolean
}

export interface CaptchaResponse {
  captcha_provider?: 'image' | 'geetest'
  captcha_id?: string
  image_base64?: string
  api_server?: string
}

export interface PasswordResetOptionsResponse {
  user_id?: number
  account?: string
  channels?: PasswordResetChannel[]
  masked_email?: string
  masked_phone?: string
  has_email?: boolean
  has_phone?: boolean
  sms_requires_phone_full?: boolean
}

export interface PasswordResetSendCodeRequest {
  account: string
  channel: PasswordResetChannel
  phone_full?: string
}

export interface PasswordResetVerifyCodeRequest {
  account: string
  channel: PasswordResetChannel
  code: string
}

export interface PasswordResetVerifyCodeResponse {
  reset_ticket?: string
  expires_in?: number
}

export interface PasswordResetConfirmRequest {
  reset_ticket: string
  new_password: string
}

export interface PasswordResetConfirmResponse extends ConsoleAuthResponse {
  ok?: boolean
}

export interface CatalogGoodsType {
  id?: number
  code?: string
  name?: string
  active?: boolean
  sort_order?: number
}

export interface CatalogRegion {
  id?: number
  goods_type_id?: number
  code?: string
  name?: string
  active?: boolean
  visible?: boolean
}

export interface CatalogPlanGroup {
  id?: number
  goods_type_id?: number
  region_id?: number
  line_id?: number
  name?: string
  unit_core?: number
  unit_mem?: number
  unit_disk?: number
  unit_bw?: number
  add_core_min?: number
  add_core_max?: number
  add_core_step?: number
  add_mem_min?: number
  add_mem_max?: number
  add_mem_step?: number
  add_disk_min?: number
  add_disk_max?: number
  add_disk_step?: number
  add_bw_min?: number
  add_bw_max?: number
  add_bw_step?: number
  active?: boolean
  visible?: boolean
  capacity_remaining?: number
}

export interface CatalogPackage {
  id?: number
  goods_type_id?: number
  plan_group_id?: number
  name?: string
  cores?: number
  memory_gb?: number
  disk_gb?: number
  bandwidth_mbps?: number
  cpu_model?: string
  monthly_price?: number
  port_num?: number
  active?: boolean
  visible?: boolean
  capacity_remaining?: number
}

export interface CatalogSystemImage {
  id?: number
  line_id?: number
  plan_group_id?: number
  image_id?: number
  name?: string
  type?: string
  enabled?: boolean
}

export interface BillingCycle {
  id?: number
  name?: string
  months?: number
  multiplier?: number
  min_qty?: number
  max_qty?: number
  active?: boolean
  sort_order?: number
}

export interface CatalogResponse {
  goods_types?: CatalogGoodsType[]
  regions?: CatalogRegion[]
  lines?: CatalogPlanGroup[]
  plan_groups?: CatalogPlanGroup[]
  packages?: CatalogPackage[]
  system_images?: CatalogSystemImage[]
  billing_cycles?: BillingCycle[]
}

export interface CartSpec {
  add_cores?: number
  add_mem_gb?: number
  add_disk_gb?: number
  add_bw_mbps?: number
  billing_cycle_id?: number
  cycle_qty?: number
  duration_months?: number
}

export interface CartItem {
  id?: number
  package_id?: number
  system_id?: number
  spec?: CartSpec | string
  qty?: number
  amount?: number
  created_at?: string
}

export interface CartItemRequest {
  package_id?: number
  system_id?: number
  spec?: CartSpec
  qty?: number
}

export interface OrderRecord {
  id?: number
  order_no?: string
  status?: string
  total_amount?: number
  currency?: string
  coupon_code?: string
  coupon_discount?: number
  pending_reason?: string
  rejected_reason?: string
  created_at?: string
  updated_at?: string
}

export interface OrderItemRecord {
  id?: number
  order_id?: number
  package_id?: number
  system_id?: number
  spec?: AnyRecord | string
  qty?: number
  amount?: number
  status?: string
  action?: string
  duration_months?: number
  created_at?: string
}

export interface OrderPaymentRecord {
  id?: number
  order_id?: number
  method?: string
  amount?: number
  currency?: string
  trade_no?: string
  note?: string
  screenshot_url?: string
  status?: string
  created_at?: string
}

export interface OrderDetailResponse {
  order?: OrderRecord
  items?: OrderItemRecord[]
  payments?: OrderPaymentRecord[]
  events?: AnyRecord[]
}

export interface OrderCreateRequest {
  coupon_code?: string
  items?: CartItemRequest[]
}

export interface OrderCreateResponse {
  order?: OrderRecord
  items?: OrderItemRecord[]
}

export interface VpsRecord {
  id?: number
  name?: string
  region?: string
  region_id?: number
  line_id?: number
  package_id?: number
  package_name?: string
  cpu?: number
  memory_gb?: number
  disk_gb?: number
  bandwidth_mbps?: number
  port_num?: number
  monthly_price?: number
  spec?: AnyRecord | string
  system_id?: number
  status?: string
  automation_state?: number
  admin_status?: string
  expire_at?: string
  destroy_at?: string | null
  destroy_in_days?: number | null
  panel_url_cache?: string
  access_info?: AnyRecord | string
  capabilities?: AnyRecord
  created_at?: string
  updated_at?: string
}

export interface MonitorResponse {
  cpu?: number
  memory?: number
  bytes_in?: number
  bytes_out?: number
  storage?: number
}

export interface WalletInfo {
  balance?: number
  currency?: string
  updated_at?: string
}

export interface WalletOrder {
  id?: number
  type?: string
  amount?: number
  currency?: string
  status?: string
  note?: string
  meta?: AnyRecord
  created_at?: string
  updated_at?: string
}

export interface WalletTransaction {
  id?: number
  type?: string
  amount?: number
  note?: string
  created_at?: string
}

export interface PaymentProvider {
  key?: string
  name?: string
  enabled?: boolean
  order_enabled?: boolean
  wallet_enabled?: boolean
}

export interface PaymentCreateResult {
  status?: string
  pay_url?: string
  trade_no?: string
  extra?: AnyRecord
  paid?: boolean
}

export interface UserApiKey {
  id?: number
  name?: string
  akid?: string
  status?: string
  scopes_json?: string
  last_used_at?: string
  created_at?: string
}

export interface RealNameVerification {
  id?: number
  real_name?: string
  id_number?: string
  status?: string
  provider?: string
  reason?: string
  redirect_url?: string
  created_at?: string
  verified_at?: string
}

export interface RealNameStatusResponse {
  enabled?: boolean
  provider?: string
  block_actions?: string[]
  verified?: boolean
  verification?: RealNameVerification
}

export interface TicketRecord {
  id?: number
  subject?: string
  status?: string
  resource_count?: number
  last_reply_role?: string
  created_at?: string
  updated_at?: string
}

export interface TicketMessage {
  id?: number
  ticket_id?: number
  sender_id?: number
  sender_role?: string
  sender_name?: string
  sender_avatar?: string
  sender_qq?: string
  content?: string
  created_at?: string
}

export interface TicketResource {
  id?: number
  ticket_id?: number
  resource_type?: string
  resource_id?: number
  resource_name?: string
  created_at?: string
}

export interface TicketDetailResponse {
  ticket?: TicketRecord
  messages?: TicketMessage[]
  resources?: TicketResource[]
}

export interface UserDashboard {
  orders?: number
  vps?: number
  expiring?: number
  pending_review?: number
  spend_30d?: number
}

export interface CouponPreviewResponse {
  coupon_code?: string
  original_total?: number
  discount?: number
  final_total?: number
}

interface WrappedResponse<T> {
  code: number
  msg?: string
  message?: string
  data: T
}

interface UserRequestConfig extends AxiosRequestConfig {
  showErrorMessage?: boolean
}

export const CONSOLE_USER_TOKEN_KEY = 'console_user_token'

const { VITE_API_URL, VITE_WITH_CREDENTIALS } = import.meta.env
const USER_UNAUTHORIZED_STATUS = 401
const USER_FORBIDDEN_STATUS = 403
let isRedirectingToUserLogin = false
let isRealNamePromptOpen = false
let unauthorizedHandler: (() => void) | null = null

export function setConsoleUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

const userAxios = axios.create({
  baseURL: VITE_API_URL,
  timeout: 20000,
  withCredentials: VITE_WITH_CREDENTIALS === 'true'
})

function isWrappedResponse<T>(data: unknown): data is WrappedResponse<T> {
  return Boolean(
    data &&
      typeof data === 'object' &&
      'code' in (data as Record<string, unknown>) &&
      typeof (data as Record<string, unknown>).code === 'number'
  )
}

function currentHashFullPath(): string {
  const hash = window.location.hash || ''
  return hash.startsWith('#') ? hash.slice(1) || '/' : '/'
}

function redirectToUserLogin() {
  const current = currentHashFullPath()
  if (!current.startsWith('/console')) {
    return
  }

  if (isRedirectingToUserLogin) {
    return
  }

  isRedirectingToUserLogin = true
  window.location.hash = `/user/login?redirect=${encodeURIComponent(current)}`
  window.setTimeout(() => {
    isRedirectingToUserLogin = false
  }, 1000)
}

function isUserApiRequest(url: unknown): boolean {
  const value = String(url || '')
  return value === '/api/v1' || value.startsWith('/api/v1/')
}

export function getConsoleUserToken(): string {
  if (typeof localStorage === 'undefined') {
    return ''
  }
  return localStorage.getItem(CONSOLE_USER_TOKEN_KEY) || ''
}

function isLoginRequest(url: unknown): boolean {
  return String(url || '').includes('/auth/login')
}

function handleUnauthorized() {
  if (unauthorizedHandler) {
    unauthorizedHandler()
  } else {
    localStorage.removeItem(CONSOLE_USER_TOKEN_KEY)
  }
  redirectToUserLogin()
}

function isRealNameRequired(status: number, url: unknown, message: string, code?: string): boolean {
  if (status !== USER_FORBIDDEN_STATUS || !isUserApiRequest(url)) {
    return false
  }
  const normalizedMessage = String(message || '').toLowerCase()
  const normalizedCode = String(code || '').toLowerCase()
  return (
    normalizedMessage.includes('real name required') ||
    normalizedCode.includes('real_name_required') ||
    normalizedCode.includes('realname_required')
  )
}

function isRealNameRequiredError(error: any, fallbackUrl?: unknown): boolean {
  const status = Number(error?.response?.status || 0)
  const url = error?.config?.url || fallbackUrl
  const data = error?.response?.data || {}
  return isRealNameRequired(status, url, getErrorMessage(error), data?.code)
}

function promptRealNameRequired() {
  if (isRealNamePromptOpen) {
    return
  }
  isRealNamePromptOpen = true
  ElMessageBox.confirm('该操作需要完成实名认证，是否前往认证页面？', '需要实名认证', {
    type: 'warning',
    confirmButtonText: '去认证',
    cancelButtonText: '稍后再说'
  })
    .then(() => {
      window.location.hash = '/console/realname'
    })
    .catch(() => undefined)
    .finally(() => {
      isRealNamePromptOpen = false
    })
}

function getErrorMessage(error: any): string {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.response?.data?.msg ||
    error?.message ||
    '请求失败'
  )
}

userAxios.interceptors.request.use((request) => {
  const url = String(request.url || '')
  const token = getConsoleUserToken()

  if (token && isUserApiRequest(url)) {
    request.headers.set('Authorization', token.startsWith('Bearer ') ? token : `Bearer ${token}`)
  }

  if (
    request.data &&
    !(request.data instanceof FormData) &&
    typeof request.data !== 'string' &&
    !request.headers['Content-Type']
  ) {
    request.headers.set('Content-Type', 'application/json')
  }

  return request
})

userAxios.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (isRealNameRequiredError(error)) {
      promptRealNameRequired()
    }

    if (
      error?.response?.status === USER_UNAUTHORIZED_STATUS &&
      !isLoginRequest(error?.config?.url)
    ) {
      handleUnauthorized()
    }

    return Promise.reject(error)
  }
)

async function request<T>(config: UserRequestConfig): Promise<T> {
  let realNameRequiredHandled = false
  try {
    const response = await userAxios.request<WrappedResponse<T> | T>(config)
    if (isWrappedResponse<T>(response.data)) {
      if (response.data.code >= 200 && response.data.code < 300) {
        return response.data.data
      }
      const realNameRequired = isRealNameRequired(
        response.data.code,
        config.url,
        response.data.msg || response.data.message || '',
        String((response.data as AnyRecord).code || '')
      )
      if (realNameRequired) {
        realNameRequiredHandled = true
        promptRealNameRequired()
      }
      if (response.data.code === USER_UNAUTHORIZED_STATUS && !isLoginRequest(config.url)) {
        handleUnauthorized()
      }
      throw new Error(response.data.msg || response.data.message || '请求失败')
    }
    return response.data as T
  } catch (error: any) {
    if (
      config.showErrorMessage !== false &&
      !realNameRequiredHandled &&
      !isRealNameRequiredError(error, config.url)
    ) {
      ElMessage.error(getErrorMessage(error))
    }
    throw error
  }
}

export const userRequest = {
  get<T>(url: string, params?: AnyRecord, config?: UserRequestConfig) {
    return request<T>({ ...config, url, method: 'GET', params })
  },
  post<T>(url: string, data?: unknown, config?: UserRequestConfig) {
    return request<T>({ ...config, url, method: 'POST', data })
  },
  patch<T>(url: string, data?: unknown, config?: UserRequestConfig) {
    return request<T>({ ...config, url, method: 'PATCH', data })
  },
  put<T>(url: string, data?: unknown, config?: UserRequestConfig) {
    return request<T>({ ...config, url, method: 'PUT', data })
  },
  del<T>(url: string, params?: AnyRecord, config?: UserRequestConfig) {
    return request<T>({ ...config, url, method: 'DELETE', params })
  }
}

export function getAuthSettings() {
  return userRequest.get<AuthSettings>('/api/v1/auth/settings', undefined, {
    showErrorMessage: false
  })
}

export function getCaptcha() {
  return userRequest.get<CaptchaResponse>('/api/v1/captcha', undefined, { showErrorMessage: false })
}

export function userLogin(data: AnyRecord) {
  return userRequest.post<ConsoleAuthResponse>('/api/v1/auth/login', data, {
    showErrorMessage: false
  })
}

export function getUserPasswordResetOptions(account: string) {
  return userRequest.post<PasswordResetOptionsResponse>(
    '/api/v1/auth/password-reset/options',
    { account },
    { showErrorMessage: false }
  )
}

export function sendUserPasswordResetCode(data: PasswordResetSendCodeRequest) {
  return userRequest.post<{ ok?: boolean }>('/api/v1/auth/password-reset/send-code', data, {
    showErrorMessage: false
  })
}

export function verifyUserPasswordResetCode(data: PasswordResetVerifyCodeRequest) {
  return userRequest.post<PasswordResetVerifyCodeResponse>(
    '/api/v1/auth/password-reset/verify-code',
    data,
    { showErrorMessage: false }
  )
}

export function confirmUserPasswordReset(data: PasswordResetConfirmRequest) {
  return userRequest.post<PasswordResetConfirmResponse>(
    '/api/v1/auth/password-reset/confirm',
    data,
    { showErrorMessage: false }
  )
}

export function getMe() {
  return userRequest.get<ConsoleUserProfile>('/api/v1/me')
}

export function updateMe(data: AnyRecord) {
  return userRequest.patch<ConsoleUserProfile>('/api/v1/me', data)
}

export function changeMyPassword(data: AnyRecord) {
  return userRequest.post('/api/v1/me/password/change', data)
}

export function getMySecurityContacts() {
  return userRequest.get<ConsoleSecurityContacts>('/api/v1/me/security/contacts')
}

export function getTwoFAStatus() {
  return userRequest.get<{ enabled?: boolean; totp_enabled?: boolean }>(
    '/api/v1/me/security/2fa/status'
  )
}

export function setupTwoFA(data: { password?: string; current_code?: string }) {
  return userRequest.post<TwoFASetupResponse>('/api/v1/me/security/2fa/setup', data)
}

export function confirmTwoFA(data: { code: string }) {
  return userRequest.post('/api/v1/me/security/2fa/confirm', data)
}

export function verifyMyEmailBind2FA(data: { totp_code: string }) {
  return userRequest.post<SecurityTicketResponse>('/api/v1/me/security/email/verify-2fa', data)
}

export function sendMyEmailBindCode(data: {
  value: string
  current_password?: string
  security_ticket?: string
}) {
  return userRequest.post('/api/v1/me/security/email/send-code', data)
}

export function confirmMyEmailBind(data: {
  value: string
  code: string
  security_ticket?: string
}) {
  return userRequest.post('/api/v1/me/security/email/confirm', data)
}

export function verifyMyPhoneBind2FA(data: { totp_code: string }) {
  return userRequest.post<SecurityTicketResponse>('/api/v1/me/security/phone/verify-2fa', data)
}

export function sendMyPhoneBindCode(data: {
  value: string
  current_password?: string
  security_ticket?: string
}) {
  return userRequest.post('/api/v1/me/security/phone/send-code', data)
}

export function confirmMyPhoneBind(data: {
  value: string
  code: string
  security_ticket?: string
}) {
  return userRequest.post('/api/v1/me/security/phone/confirm', data)
}

export function getDashboard() {
  return userRequest.get<UserDashboard>('/api/v1/dashboard')
}

export function getCatalog() {
  return userRequest.get<CatalogResponse>('/api/v1/catalog')
}

export function listSystemImages(params?: { line_id?: number; plan_group_id?: number }) {
  return userRequest.get<UserApiList<CatalogSystemImage>>('/api/v1/system-images', params)
}

export function listCart() {
  return userRequest.get<UserApiList<CartItem>>('/api/v1/cart')
}

export function addCartItem(data: CartItemRequest) {
  return userRequest.post('/api/v1/cart', data)
}

export function updateCartItem(id: number | string, data: CartItemRequest) {
  return userRequest.patch(`/api/v1/cart/${id}`, data)
}

export function deleteCartItem(id: number | string) {
  return userRequest.del(`/api/v1/cart/${id}`)
}

export function clearCart() {
  return userRequest.del('/api/v1/cart')
}

export function listOrders(params?: AnyRecord) {
  return userRequest.get<UserApiList<OrderRecord>>('/api/v1/orders', params)
}

export function createOrder(data: OrderCreateRequest, idempotencyKey?: string) {
  return userRequest.post<OrderCreateResponse>('/api/v1/orders/items', data, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined
  })
}

export function createOrderFromCart(data?: { coupon_code?: string }, idempotencyKey?: string) {
  return userRequest.post<OrderCreateResponse>('/api/v1/orders', data || null, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined
  })
}

export function previewCoupon(data: { coupon_code: string; items?: CartItemRequest[] }) {
  return userRequest.post<CouponPreviewResponse>('/api/v1/coupons/preview', data)
}

export function getOrderDetail(id: number | string) {
  return userRequest.get<OrderDetailResponse>(`/api/v1/orders/${id}`)
}

export function refreshOrder(id: number | string) {
  return userRequest.post(`/api/v1/orders/${id}/refresh`)
}

export function cancelOrder(id: number | string) {
  return userRequest.post(`/api/v1/orders/${id}/cancel`)
}

export function createOrderPayment(id: number | string, data: AnyRecord) {
  return userRequest.post<PaymentCreateResult>(`/api/v1/orders/${id}/pay`, data)
}

export function listPaymentProviders(params?: { scene?: 'order' | 'wallet' }) {
  return userRequest.get<UserApiList<PaymentProvider>>('/api/v1/payments/providers', params)
}

export function listVps() {
  return userRequest.get<UserApiList<VpsRecord>>('/api/v1/vps')
}

export function getVpsDetail(id: number | string) {
  return userRequest.get<VpsRecord>(`/api/v1/vps/${id}`)
}

export function refreshVps(id: number | string) {
  return userRequest.post(`/api/v1/vps/${id}/refresh`)
}

export function getVpsPanel(id: number | string) {
  return userRequest.get<AnyRecord>(`/api/v1/vps/${id}/panel`)
}

export function getVpsPanelNavigationUrl(id: number | string) {
  return userRequest.get<NavigationURLResponse>(`/api/v1/vps/${id}/panel-url`)
}

export function getVpsVnc(id: number | string) {
  return userRequest.get<AnyRecord>(`/api/v1/vps/${id}/vnc`)
}

export function getVpsVncNavigationUrl(id: number | string) {
  return userRequest.get<NavigationURLResponse>(`/api/v1/vps/${id}/vnc-url`)
}

export function getVpsMonitor(id: number | string) {
  return userRequest.get<MonitorResponse>(`/api/v1/vps/${id}/monitor`, undefined, {
    showErrorMessage: false
  })
}

export function startVps(id: number | string) {
  return userRequest.post(`/api/v1/vps/${id}/start`)
}

export function shutdownVps(id: number | string) {
  return userRequest.post(`/api/v1/vps/${id}/shutdown`)
}

export function rebootVps(id: number | string) {
  return userRequest.post(`/api/v1/vps/${id}/reboot`)
}

export function resetVpsOsPassword(id: number | string, data: { password: string }) {
  return userRequest.post(`/api/v1/vps/${id}/reset-os-password`, data)
}

export function resetVpsOS(
  id: number | string,
  data: { template_id: number | string; password: string }
) {
  return userRequest.post(`/api/v1/vps/${id}/reset-os`, { host_id: id, ...data })
}

export function getVpsSnapshots(id: number | string) {
  return userRequest.get<AnyRecord>(`/api/v1/vps/${id}/snapshots`)
}

export function createVpsSnapshot(id: number | string) {
  return userRequest.post(`/api/v1/vps/${id}/snapshots`)
}

export function deleteVpsSnapshot(id: number | string, snapshotId: number | string) {
  return userRequest.del(`/api/v1/vps/${id}/snapshots/${snapshotId}`)
}

export function restoreVpsSnapshot(id: number | string, snapshotId: number | string) {
  return userRequest.post(`/api/v1/vps/${id}/snapshots/${snapshotId}/restore`)
}

export function getVpsBackups(id: number | string) {
  return userRequest.get<AnyRecord>(`/api/v1/vps/${id}/backups`)
}

export function createVpsBackup(id: number | string) {
  return userRequest.post(`/api/v1/vps/${id}/backups`)
}

export function deleteVpsBackup(id: number | string, backupId: number | string) {
  return userRequest.del(`/api/v1/vps/${id}/backups/${backupId}`)
}

export function restoreVpsBackup(id: number | string, backupId: number | string) {
  return userRequest.post(`/api/v1/vps/${id}/backups/${backupId}/restore`)
}

export function getVpsFirewallRules(id: number | string) {
  return userRequest.get<AnyRecord>(`/api/v1/vps/${id}/firewall`)
}

export function addVpsFirewallRule(id: number | string, data: AnyRecord) {
  return userRequest.post(`/api/v1/vps/${id}/firewall`, data)
}

export function deleteVpsFirewallRule(id: number | string, ruleId: number | string) {
  return userRequest.del(`/api/v1/vps/${id}/firewall/${ruleId}`)
}

export function getVpsPortMappings(id: number | string) {
  return userRequest.get<AnyRecord>(`/api/v1/vps/${id}/ports`)
}

export function addVpsPortMapping(id: number | string, data: AnyRecord) {
  return userRequest.post(`/api/v1/vps/${id}/ports`, data)
}

export function getVpsPortCandidates(id: number | string, params?: { keywords?: string }) {
  return userRequest.get<AnyRecord>(`/api/v1/vps/${id}/ports/candidates`, params, {
    showErrorMessage: false
  })
}

export function deleteVpsPortMapping(id: number | string, mappingId: number | string) {
  return userRequest.del(`/api/v1/vps/${id}/ports/${mappingId}`)
}

export function createVpsRenewOrder(id: number | string, data: AnyRecord) {
  return userRequest.post(`/api/v1/vps/${id}/renew`, data)
}

export function emergencyRenewVps(id: number | string) {
  return userRequest.post(`/api/v1/vps/${id}/emergency-renew`)
}

export function createVpsResizeOrder(id: number | string, data: AnyRecord) {
  return userRequest.post(`/api/v1/vps/${id}/resize`, data)
}

export function quoteVpsResizeOrder(id: number | string, data: AnyRecord) {
  return userRequest.post<AnyRecord>(`/api/v1/vps/${id}/resize/quote`, data, {
    showErrorMessage: false
  })
}

export function requestVpsRefund(id: number | string, data: { reason?: string }) {
  return userRequest.post(`/api/v1/vps/${id}/refund`, data)
}

export function getWallet() {
  return userRequest.get<WalletInfo | { wallet?: WalletInfo }>('/api/v1/wallet')
}

export function createWalletRecharge(data: AnyRecord) {
  return userRequest.post<{ order?: WalletOrder; payment?: AnyRecord }>(
    '/api/v1/wallet/recharge',
    data
  )
}

export function payWalletOrder(id: number | string, data?: AnyRecord) {
  return userRequest.post<{ payment?: AnyRecord }>(`/api/v1/wallet/orders/${id}/pay`, data || {})
}

export function cancelWalletOrder(id: number | string, data?: AnyRecord) {
  return userRequest.post(`/api/v1/wallet/orders/${id}/cancel`, data || {})
}

export function createWalletWithdraw(data: AnyRecord) {
  return userRequest.post<{ order?: WalletOrder }>('/api/v1/wallet/withdraw', data)
}

export function listWalletOrders(params?: AnyRecord) {
  return userRequest.get<UserApiList<WalletOrder>>('/api/v1/wallet/orders', params)
}

export function listWalletTransactions(params?: AnyRecord) {
  return userRequest.get<UserApiList<WalletTransaction>>('/api/v1/wallet/transactions', params)
}

export function listUserApiKeys(params?: AnyRecord) {
  return userRequest.get<UserApiList<UserApiKey>>('/api/v1/open/me/api-keys', params)
}

export function createUserApiKey(data: { name: string; scopes?: string[] }) {
  return userRequest.post<{ item?: UserApiKey; key?: string; secret?: string }>(
    '/api/v1/open/me/api-keys',
    data
  )
}

export function updateUserApiKeyStatus(
  id: number | string,
  data: { status: 'active' | 'disabled' }
) {
  return userRequest.patch(`/api/v1/open/me/api-keys/${id}`, data)
}

export function deleteUserApiKey(id: number | string) {
  return userRequest.del(`/api/v1/open/me/api-keys/${id}`)
}

export function getRealNameStatus() {
  return userRequest.get<RealNameStatusResponse>('/api/v1/realname/status')
}

export function submitRealNameVerification(data: {
  real_name: string
  id_number: string
  phone?: string
}) {
  return userRequest.post<RealNameVerification>('/api/v1/realname/verify', data)
}

export function listTickets(params?: AnyRecord) {
  return userRequest.get<UserApiList<TicketRecord>>('/api/v1/tickets', params)
}

export function createTicket(data: AnyRecord) {
  return userRequest.post<TicketDetailResponse>('/api/v1/tickets', data)
}

export function getTicketDetail(id: number | string) {
  return userRequest.get<TicketDetailResponse>(`/api/v1/tickets/${id}`)
}

export function addTicketMessage(id: number | string, data: AnyRecord) {
  return userRequest.post(`/api/v1/tickets/${id}/messages`, data)
}

export function closeTicket(id: number | string) {
  return userRequest.post(`/api/v1/tickets/${id}/close`)
}

export function getSiteSettings() {
  return userRequest.get<{ items?: Array<{ key?: string; value?: string }> }>(
    '/api/v1/site/settings',
    undefined,
    { showErrorMessage: false }
  )
}
