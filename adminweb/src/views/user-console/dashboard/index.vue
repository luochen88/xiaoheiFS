<template>
  <div>
    <ConsolePageHeader title="控制台总览" description="查看云服务器、订单、钱包和账户状态。">
      <template #actions>
        <ElButton :icon="Refresh" :loading="loading" @click="refresh">刷新</ElButton>
        <ElButton type="primary" :icon="ShoppingCart" @click="router.push('/console/buy')">
          购买 VPS
        </ElButton>
      </template>
    </ConsolePageHeader>

    <div class="console-grid-4 console-section">
      <div
        v-for="item in mainMetrics"
        :key="item.label"
        class="console-card metric-card"
        @click="router.push(item.path)"
      >
        <div class="metric-icon" :style="{ background: item.color }">
          <ElIcon><component :is="item.icon" /></ElIcon>
        </div>
        <div>
          <div class="metric-label">{{ item.label }}</div>
          <div class="metric-value">{{ item.value }}</div>
        </div>
      </div>
    </div>

    <div class="console-grid-4 console-section">
      <div
        v-for="item in quickMetrics"
        :key="item.label"
        class="console-card compact-metric"
        @click="router.push(item.path)"
      >
        <div class="compact-label">{{ item.label }}</div>
        <div class="compact-value">{{ item.value }}</div>
        <ElIcon class="compact-icon"><component :is="item.icon" /></ElIcon>
      </div>
    </div>

    <div class="dashboard-grid console-section">
      <div class="console-card table-card">
        <div class="table-toolbar">
          <div>
            <div class="toolbar-title">近 30 天消费</div>
            <div class="muted">按订单创建日期统计</div>
          </div>
        </div>
        <div v-if="spendTrend.length" class="trend-list">
          <div v-for="item in spendTrend" :key="item.date" class="trend-row">
            <span>{{ item.date }}</span>
            <div class="trend-bar">
              <i :style="{ width: item.percent + '%' }" />
            </div>
            <strong>{{ formatMoney(item.value, currency) }}</strong>
          </div>
        </div>
        <ElEmpty v-else description="暂无消费数据" />
      </div>

      <div class="console-card table-card">
        <div class="table-toolbar">
          <div>
            <div class="toolbar-title">订单分布</div>
            <div class="muted">当前订单状态概览</div>
          </div>
        </div>
        <div v-if="orderStatus.length" class="status-list">
          <div v-for="item in orderStatus" :key="item.name" class="status-row">
            <ConsoleStatusTag :status="item.name" kind="order" />
            <span>{{ item.value }} 单</span>
          </div>
        </div>
        <ElEmpty v-else description="暂无订单数据" />
      </div>
    </div>

    <div class="console-card table-card">
      <div class="table-toolbar">
        <div>
          <div class="toolbar-title">即将到期</div>
          <div class="muted">优先处理 7 天内到期的实例</div>
        </div>
        <ElButton text type="primary" @click="router.push('/console/vps')">查看全部</ElButton>
      </div>
      <ElTable :data="expiringList" row-key="id" empty-text="暂无即将到期实例">
        <ElTableColumn label="实例" min-width="180">
          <template #default="{ row }">
            <div class="primary-text">{{ row.name || `VPS-${row.id}` }}</div>
            <div class="muted mono">ID: {{ row.id || '-' }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="120">
          <template #default="{ row }">
            <ConsoleStatusTag :status="row.status" kind="vps" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="到期时间" min-width="180">
          <template #default="{ row }">{{ formatDateTime(row.expire_at) }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="120" align="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="router.push(`/console/vps/${row.id}`)"
              >详情</ElButton
            >
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    Clock,
    CreditCard,
    Document,
    Finished,
    Monitor,
    Refresh,
    ShoppingCart,
    Wallet
  } from '@element-plus/icons-vue'
  import { useConsoleCartStore } from '@/store/modules/console-cart'
  import { useConsoleDashboardStore } from '@/store/modules/console-dashboard'
  import { formatDateTime, formatMoney } from '@/utils/console-user'
  import ConsolePageHeader from '../shared/PageHeader.vue'
  import ConsoleStatusTag from '../shared/StatusTag.vue'
  import '../shared/styles.scss'

  defineOptions({ name: 'ConsoleUserDashboard' })

  const router = useRouter()
  const dashboard = useConsoleDashboardStore()
  const cart = useConsoleCartStore()
  const loading = ref(false)

  const currency = computed(() => dashboard.metrics.currency || 'CNY')
  const spendTrend = computed(() => {
    const trend = dashboard.charts.spendTrend || { labels: [], values: [] }
    const max = Math.max(...(trend.values || []).map((value: number) => Number(value || 0)), 1)
    return (trend.labels || []).map((date: string, index: number) => {
      const value = Number(trend.values[index] || 0)
      return {
        date,
        value,
        percent: Math.max(6, Math.round((value / max) * 100))
      }
    })
  })
  const orderStatus = computed(() => dashboard.charts.orderStatus || [])
  const expiringList = computed(() => dashboard.charts.expiringList || [])

  const mainMetrics = computed(() => [
    {
      label: '账户余额',
      value: formatMoney(dashboard.metrics.balance, currency.value),
      path: '/console/billing',
      icon: Wallet,
      color: '#1677ff'
    },
    {
      label: '云服务器',
      value: `${dashboard.metrics.vps_total || 0} 台`,
      path: '/console/vps',
      icon: Monitor,
      color: '#10b981'
    },
    {
      label: '全部订单',
      value: `${dashboard.metrics.orders_total || 0} 单`,
      path: '/console/orders',
      icon: Document,
      color: '#7c3aed'
    },
    {
      label: '近 30 天消费',
      value: formatMoney(dashboard.metrics.spend_30d, currency.value),
      path: '/console/orders',
      icon: CreditCard,
      color: '#f59e0b'
    }
  ])

  const realnameLabel = computed(() => {
    const labels: Record<string, string> = {
      verified: '已认证',
      pending: '审核中',
      failed: '未通过',
      rejected: '未通过',
      disabled: '未启用',
      unverified: '未认证'
    }
    return labels[String(dashboard.metrics.realname_status || '')] || '未认证'
  })

  const quickMetrics = computed(() => [
    {
      label: '实名认证',
      value: realnameLabel.value,
      path: '/console/realname',
      icon: Finished
    },
    {
      label: '即将到期',
      value: `${dashboard.metrics.expiring || 0} 台`,
      path: '/console/vps',
      icon: Clock
    },
    {
      label: '购物车',
      value: `${cart.count} 件`,
      path: '/console/cart',
      icon: ShoppingCart
    },
    {
      label: '待处理订单',
      value: `${dashboard.metrics.pending_orders || 0} 单`,
      path: '/console/orders',
      icon: Document
    }
  ])

  async function refresh() {
    loading.value = true
    try {
      await Promise.all([dashboard.fetchUserDashboard(), cart.fetchCart().catch(() => undefined)])
      dashboard.metrics.cart_items = cart.count
    } finally {
      loading.value = false
    }
  }

  onMounted(refresh)
</script>

<style scoped lang="scss">
  .compact-metric {
    position: relative;
    min-height: 86px;
    padding: 16px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.16s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      transform: translateY(-2px);
    }
  }

  .compact-label {
    color: var(--art-gray-500);
    font-size: 13px;
  }

  .compact-value {
    margin-top: 8px;
    color: var(--art-gray-900);
    font-size: 20px;
    font-weight: 700;
  }

  .compact-icon {
    position: absolute;
    right: 16px;
    bottom: 14px;
    color: var(--art-gray-300);
    font-size: 28px;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.6fr);
    gap: 14px;
  }

  .trend-list,
  .status-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .trend-row {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr) 110px;
    align-items: center;
    gap: 12px;
    color: var(--art-gray-600);
    font-size: 13px;
  }

  .trend-bar {
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--el-fill-color-light);

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--el-color-primary);
    }
  }

  .status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .primary-text {
    color: var(--art-gray-900);
    font-weight: 600;
  }

  @media (max-width: 900px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .trend-row {
      grid-template-columns: 80px minmax(0, 1fr);

      strong {
        grid-column: 2;
      }
    }
  }
</style>
