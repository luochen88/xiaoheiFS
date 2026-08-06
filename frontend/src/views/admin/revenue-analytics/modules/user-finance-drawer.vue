<template>
  <ElDrawer
    v-model="drawerVisible"
    :title="`用户财务详情 #${userId || '-'}`"
    size="760px"
    destroy-on-close
  >
    <div v-loading="loading" class="drawer-panel">
      <div class="drawer-toolbar">
        <div class="user-meta">
          <ElAvatar :size="40" :src="userAvatar">
            {{ String(userId || '').slice(-2) }}
          </ElAvatar>
          <div class="user-meta-text">
            <strong>{{ userLabel || '-' }}</strong>
            <span>{{ profile?.email || '-' }}</span>
          </div>
        </div>

        <ElButton type="primary" @click="emit('apply-user-filter')">按此用户筛选主视图</ElButton>
      </div>

      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="总收入贡献">
          ¥{{ formatCents(summary.total_revenue_cents) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="订单数">{{ summary.order_count }}</ElDescriptionsItem>
        <ElDescriptionsItem label="净收入订单">
          {{ summary.positive_order_count }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="退款 / 负数订单">
          {{ summary.negative_order_count }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="客单价">
          ¥{{ formatCents(summary.avg_order_cents) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="最近支付时间">
          {{ summary.last_paid_at || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ArtTable row-key="payment_id" :data="rows" :columns="tableColumns" :show-pagination="false">
        <template #order_no="{ row }">
          <ElButton link type="primary" @click="copyOrderNo(row.order_no)">
            {{ row.order_no || '-' }}
          </ElButton>
        </template>
        <template #amount="{ row }">
          <span :class="amountClass(Number(row.amount_cents || 0))">
            {{ amountPrefix(Number(row.amount_cents || 0)) }}¥{{
              formatCents(Math.abs(Number(row.amount_cents || 0)))
            }}
          </span>
        </template>
        <template #status="{ row }">
          <ElTag :type="statusMeta(row.status).type" effect="light">
            {{ statusMeta(row.status).text }}
          </ElTag>
        </template>
        <template #paid_at="{ row }">
          {{ formatDateTime(row.paid_at) }}
        </template>
      </ArtTable>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
  import type { RevenueAnalyticsDetailRecord, User } from '@/services/types'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'UserFinanceDrawer' })

  interface UserFinanceSummary {
    total_revenue_cents: number
    order_count: number
    positive_order_count: number
    negative_order_count: number
    avg_order_cents: number
    last_paid_at: string
  }

  const tableColumns = [
    { prop: 'payment_id', label: '支付 ID', width: 110 },
    { prop: 'order_no', label: '订单号', minWidth: 220, showOverflowTooltip: true },
    { prop: 'amount', label: '金额', width: 140, useSlot: true },
    { prop: 'status', label: '状态', width: 120, useSlot: true },
    { prop: 'paid_at', label: '支付时间', minWidth: 180, useSlot: true }
  ]

  interface Props {
    visible: boolean
    loading?: boolean
    userId?: number
    userLabel?: string
    userAvatar?: string
    profile?: User | null
    summary: UserFinanceSummary
    rows: RevenueAnalyticsDetailRecord[]
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'apply-user-filter'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    userId: undefined,
    userLabel: '',
    userAvatar: '',
    profile: null
  })
  const emit = defineEmits<Emits>()

  const drawerVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  function formatCents(value?: number | null) {
    return (Number(value || 0) / 100).toFixed(2)
  }

  async function copyOrderNo(orderNo?: string | null) {
    const value = String(orderNo || '').trim()
    if (!value) {
      return
    }

    await navigator.clipboard.writeText(value)
    ElMessage.success('订单号已复制')
  }

  function formatDateTime(value?: string | null) {
    if (!value) {
      return '-'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return String(value)
    }

    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date)
  }

  function amountClass(value: number) {
    if (value > 0) {
      return 'amount-up'
    }

    if (value < 0) {
      return 'amount-down'
    }

    return 'amount-neutral'
  }

  function amountPrefix(value: number) {
    if (value > 0) {
      return '+'
    }

    if (value < 0) {
      return '-'
    }

    return ''
  }

  function statusMeta(status?: string | null) {
    const value = String(status || '').toLowerCase()

    if (value === 'approved' || value === 'active') {
      return { type: 'success' as const, text: '已完成' }
    }

    if (value === 'pending_payment') {
      return { type: 'info' as const, text: '待支付' }
    }

    if (value === 'pending_review') {
      return { type: 'warning' as const, text: '待审核' }
    }

    if (value === 'failed' || value === 'rejected') {
      return { type: 'danger' as const, text: '失败' }
    }

    if (value === 'canceled') {
      return { type: 'info' as const, text: '已取消' }
    }

    return { type: 'info' as const, text: value || '-' }
  }
</script>

<style scoped lang="scss">
  .drawer-panel {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .drawer-toolbar {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
  }

  .user-meta {
    display: flex;
    gap: 12px;
    align-items: center;
    min-width: 0;
  }

  .user-meta-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .user-meta-text strong {
    font-size: 16px;
    color: var(--el-text-color-primary);
  }

  .user-meta-text span {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .amount-up {
    font-weight: 700;
    color: var(--el-color-success);
  }

  .amount-down {
    font-weight: 700;
    color: var(--el-color-danger);
  }

  .amount-neutral {
    font-weight: 700;
    color: var(--el-text-color-secondary);
  }

  @media (width <= 768px) {
    .drawer-toolbar {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
