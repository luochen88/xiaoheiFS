<template>
  <div>
    <ConsolePageHeader title="订单列表" description="查看购买、续费、改配、退款等订单。">
      <template #actions>
        <ElButton :icon="Refresh" :loading="store.loading" @click="fetchOrders">刷新</ElButton>
      </template>
    </ConsolePageHeader>

    <div class="console-card table-card">
      <div class="table-toolbar">
        <div>
          <div class="toolbar-title">全部订单</div>
          <div class="muted">共 {{ store.total }} 单</div>
        </div>
        <div class="filters">
          <ElSelect v-model="filters.status" placeholder="状态" clearable>
            <ElOption label="待支付" value="pending_payment" />
            <ElOption label="待审核" value="pending_review" />
            <ElOption label="开通中" value="provisioning" />
            <ElOption label="已完成" value="active" />
            <ElOption label="已取消" value="cancelled" />
          </ElSelect>
          <ElButton type="primary" @click="fetchOrders">查询</ElButton>
        </div>
      </div>

      <ElTable :data="store.items" row-key="id" :loading="store.loading" empty-text="暂无订单">
        <ElTableColumn label="订单" min-width="220">
          <template #default="{ row }">
            <div class="primary-text">{{ row.order_no || `#${row.id}` }}</div>
            <div class="muted mono">ID: {{ row.id || '-' }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="130">
          <template #default="{ row }">
            <ConsoleStatusTag :status="row.status" kind="order" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="金额" width="140">
          <template #default="{ row }">{{
            formatMoney(row.total_amount, row.currency || 'CNY')
          }}</template>
        </ElTableColumn>
        <ElTableColumn label="优惠" width="120">
          <template #default="{ row }">
            <span v-if="row.coupon_discount"
              >-{{ formatMoney(row.coupon_discount, row.currency || 'CNY') }}</span
            >
            <span v-else>-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="创建时间" min-width="180">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="150" fixed="right" align="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="router.push(`/console/orders/${row.id}`)"
              >详情</ElButton
            >
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Refresh } from '@element-plus/icons-vue'
  import { useConsoleOrdersStore } from '@/store/modules/console-orders'
  import { formatDateTime, formatMoney } from '@/utils/console-user'
  import ConsolePageHeader from '../shared/PageHeader.vue'
  import ConsoleStatusTag from '../shared/StatusTag.vue'
  import '../shared/styles.scss'

  defineOptions({ name: 'ConsoleUserOrders' })

  const router = useRouter()
  const store = useConsoleOrdersStore()
  const filters = reactive({ status: '' })

  function fetchOrders() {
    const params: Record<string, unknown> = { limit: 100, offset: 0 }
    if (filters.status) params.status = filters.status
    return store.fetchOrders(params)
  }

  onMounted(fetchOrders)
</script>

<style scoped lang="scss">
  .primary-text {
    color: var(--art-gray-900);
    font-weight: 600;
  }

  .filters {
    display: flex;
    gap: 10px;

    .el-select {
      width: 160px;
    }
  }

  @media (max-width: 640px) {
    .filters {
      width: 100%;

      .el-select,
      .el-button {
        flex: 1;
      }
    }
  }
</style>
