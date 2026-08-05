export function normalizeWallet(data: any) {
  if (!data) {
    return { balance: 0, currency: 'CNY' }
  }

  const wallet = data.wallet || data
  return {
    balance: Number(wallet.balance || 0),
    currency: wallet.currency || 'CNY',
    updated_at: wallet.updated_at
  }
}

export function parseMaybeJson<T = Record<string, any>>(value: unknown, fallback: T): T {
  if (!value) {
    return fallback
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return value as T
}

export function formatMoney(value: unknown, currency = 'CNY'): string {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) {
    return '-'
  }

  const symbol = currency === 'CNY' ? '¥' : `${currency} `
  return `${symbol}${amount.toFixed(2)}`
}

export function formatDateTime(value: unknown): string {
  if (!value) {
    return '-'
  }

  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleString('zh-CN', { hour12: false })
}

export function formatDate(value: unknown): string {
  if (!value) {
    return '-'
  }

  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleDateString('zh-CN')
}

export function normalizeStatus(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
}

export function orderStatusLabel(status: unknown): string {
  const value = normalizeStatus(status)
  const labels: Record<string, string> = {
    pending_payment: '待支付',
    pending_review: '待审核',
    provisioning: '开通中',
    active: '已完成',
    paid: '已支付',
    cancelled: '已取消',
    canceled: '已取消',
    rejected: '已拒绝',
    failed: '失败'
  }
  return labels[value] || value || '-'
}

export function vpsStatusLabel(status: unknown): string {
  const value = normalizeStatus(status)
  const labels: Record<string, string> = {
    running: '运行中',
    stopped: '已关机',
    shutdown: '已关机',
    provisioning: '开通中',
    pending: '等待中',
    failed: '异常',
    expired: '已到期'
  }
  return labels[value] || value || '-'
}

export function ticketStatusLabel(status: unknown): string {
  const value = normalizeStatus(status)
  const labels: Record<string, string> = {
    open: '待处理',
    waiting_user: '等待回复',
    waiting_admin: '处理中',
    closed: '已关闭'
  }
  return labels[value] || value || '-'
}

export function walletOrderTypeLabel(type: unknown): string {
  const value = normalizeStatus(type)
  const labels: Record<string, string> = {
    recharge: '充值',
    withdraw: '提现',
    refund: '退款'
  }
  return labels[value] || value || '其他'
}

export function statusTagType(
  status: unknown
): 'primary' | 'success' | 'info' | 'warning' | 'danger' {
  const value = normalizeStatus(status)
  if (['active', 'running', 'paid', 'approved', 'verified', 'closed'].includes(value)) {
    return 'success'
  }
  if (
    ['pending_payment', 'pending_review', 'pending', 'provisioning', 'waiting_admin'].includes(
      value
    )
  ) {
    return 'warning'
  }
  if (['failed', 'rejected', 'expired', 'cancelled', 'canceled'].includes(value)) {
    return 'danger'
  }
  if (['stopped', 'shutdown', 'disabled'].includes(value)) {
    return 'info'
  }
  return 'primary'
}

export function specText(record: Record<string, any>): string {
  const cpu = record.cpu ?? record.cores ?? record.CPU ?? record.Cores ?? '-'
  const memory = record.memory_gb ?? record.memory ?? record.MemoryGB ?? '-'
  const disk = record.disk_gb ?? record.disk ?? record.DiskGB ?? '-'
  const bandwidth = record.bandwidth_mbps ?? record.bandwidth ?? record.BandwidthMB ?? '-'
  return `${cpu}核 / ${memory}GB / ${disk}GB / ${bandwidth}Mbps`
}
