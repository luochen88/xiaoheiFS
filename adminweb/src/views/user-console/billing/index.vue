<template>
  <div>
    <ConsolePageHeader title="钱包" description="管理余额、充值、提现和资金流水。">
      <template #actions>
        <ElButton type="primary" :icon="Money" @click="rechargeOpen = true">充值</ElButton>
        <ElButton :icon="Wallet" @click="withdrawOpen = true">提现</ElButton>
        <ElButton :icon="Refresh" :loading="loading" @click="fetchAll">刷新</ElButton>
      </template>
    </ConsolePageHeader>

    <div class="console-card balance-card console-section">
      <div>
        <div class="muted">当前余额</div>
        <div class="balance">{{ formatMoney(wallet.balance, wallet.currency) }}</div>
        <div class="muted">更新时间：{{ formatDateTime(wallet.updated_at) }}</div>
      </div>
      <div class="balance-stats">
        <div
          ><span>充值订单</span
          ><strong>{{ orders.filter((item) => item.type === 'recharge').length }}</strong></div
        >
        <div
          ><span>提现订单</span
          ><strong>{{ orders.filter((item) => item.type === 'withdraw').length }}</strong></div
        >
        <div
          ><span>流水记录</span><strong>{{ transactions.length }}</strong></div
        >
      </div>
    </div>

    <ElTabs v-model="activeTab">
      <ElTabPane label="钱包订单" name="orders">
        <div class="console-card table-card">
          <ElTable :data="orders" :loading="loading" row-key="id" empty-text="暂无钱包订单">
            <ElTableColumn label="类型" width="110">
              <template #default="{ row }">{{ walletOrderTypeLabel(row.type) }}</template>
            </ElTableColumn>
            <ElTableColumn label="金额" width="140">
              <template #default="{ row }">{{
                formatMoney(row.amount, row.currency || wallet.currency)
              }}</template>
            </ElTableColumn>
            <ElTableColumn label="状态" width="130">
              <template #default="{ row }">
                <ElTag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="note" label="备注" min-width="180" show-overflow-tooltip />
            <ElTableColumn label="时间" min-width="180">
              <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="160" align="right">
              <template #default="{ row }">
                <ElButton v-if="canContinuePay(row)" link type="primary" @click="continuePay(row)">
                  继续支付
                </ElButton>
                <ElButton v-if="canCancel(row)" link type="danger" @click="cancelOrder(row)"
                  >取消</ElButton
                >
                <span v-if="!canContinuePay(row) && !canCancel(row)">-</span>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </ElTabPane>
      <ElTabPane label="资金流水" name="transactions">
        <div class="console-card table-card">
          <ElTable :data="transactions" :loading="loading" row-key="id" empty-text="暂无资金流水">
            <ElTableColumn label="类型" width="120">
              <template #default="{ row }">{{ walletOrderTypeLabel(row.type) }}</template>
            </ElTableColumn>
            <ElTableColumn label="金额" width="150">
              <template #default="{ row }">{{ formatMoney(row.amount, wallet.currency) }}</template>
            </ElTableColumn>
            <ElTableColumn prop="note" label="备注" min-width="220" show-overflow-tooltip />
            <ElTableColumn label="时间" min-width="180">
              <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
            </ElTableColumn>
          </ElTable>
        </div>
      </ElTabPane>
    </ElTabs>

    <ElDialog v-model="rechargeOpen" title="账户充值" width="min(460px, calc(100vw - 32px))">
      <ElForm label-position="top">
        <ElFormItem label="支付方式">
          <ElSelect v-model="recharge.method" class="full-width">
            <ElOption
              v-for="provider in walletProviders"
              :key="provider.key"
              :label="provider.name || provider.key"
              :value="provider.key || ''"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="充值金额">
          <ElInputNumber
            v-model="recharge.amount"
            :min="0.01"
            :precision="2"
            class="full-width-number"
          />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="recharge.note" type="textarea" :rows="3" maxlength="200" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="rechargeOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitRecharge">提交</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="withdrawOpen" title="申请提现" width="min(460px, calc(100vw - 32px))">
      <ElAlert title="提现申请将进入人工审核流程。" type="warning" show-icon :closable="false" />
      <ElForm label-position="top" class="dialog-form">
        <ElFormItem label="提现金额">
          <ElInputNumber
            v-model="withdraw.amount"
            :min="0.01"
            :max="wallet.balance"
            :precision="2"
            class="full-width-number"
          />
        </ElFormItem>
        <ElFormItem label="收款方式">
          <ElInput
            v-model="withdraw.note"
            type="textarea"
            :rows="3"
            placeholder="微信、支付宝或银行卡信息"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="withdrawOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitWithdraw">提交</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { Money, Refresh, Wallet } from '@element-plus/icons-vue'
  import {
    cancelWalletOrder,
    createWalletRecharge,
    createWalletWithdraw,
    getWallet,
    listPaymentProviders,
    listWalletOrders,
    listWalletTransactions,
    payWalletOrder,
    type PaymentProvider,
    type WalletOrder,
    type WalletTransaction
  } from '@/api/console-user'
  import {
    formatDateTime,
    formatMoney,
    normalizeStatus,
    normalizeWallet,
    statusTagType,
    walletOrderTypeLabel
  } from '@/utils/console-user'
  import ConsolePageHeader from '../shared/PageHeader.vue'
  import '../shared/styles.scss'

  defineOptions({ name: 'ConsoleUserBilling' })

  const loading = ref(false)
  const submitting = ref(false)
  const activeTab = ref('orders')
  const rechargeOpen = ref(false)
  const withdrawOpen = ref(false)
  const wallet = ref<{ balance: number; currency: string; updated_at?: string }>({
    balance: 0,
    currency: 'CNY',
    updated_at: ''
  })
  const orders = ref<WalletOrder[]>([])
  const transactions = ref<WalletTransaction[]>([])
  const walletProviders = ref<PaymentProvider[]>([])
  const recharge = reactive({ method: 'approval', amount: 100, note: '' })
  const withdraw = reactive({ amount: 0, note: '' })

  function statusLabel(status?: string) {
    const value = normalizeStatus(status)
    const labels: Record<string, string> = {
      pending: '待处理',
      pending_review: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
      cancelled: '已取消',
      canceled: '已取消',
      paid: '已支付'
    }
    return labels[value] || value || '-'
  }

  function canContinuePay(row: WalletOrder) {
    const method = String(row.meta?.payment_method || '')
    return (
      row.type === 'recharge' &&
      normalizeStatus(row.status) === 'pending_review' &&
      Boolean(method && method !== 'approval')
    )
  }

  function canCancel(row: WalletOrder) {
    return (
      ['recharge', 'refund'].includes(String(row.type || '')) &&
      normalizeStatus(row.status) === 'pending_review'
    )
  }

  function openPayment(result: any) {
    const url = result?.payment?.pay_url || result?.payment?.payURL || result?.pay_url || ''
    if (url) window.open(url, '_blank')
  }

  async function fetchProviders() {
    const response = await listPaymentProviders({ scene: 'wallet' })
    const list = (response.items || []).filter(
      (item) => item.enabled !== false && item.key !== 'balance'
    )
    if (!list.find((item) => item.key === 'approval'))
      list.unshift({ key: 'approval', name: '人工审核' })
    walletProviders.value = list
    if (!walletProviders.value.find((item) => item.key === recharge.method)) {
      recharge.method = walletProviders.value[0]?.key || 'approval'
    }
  }

  async function fetchAll() {
    loading.value = true
    try {
      const [walletPayload, ordersPayload, transactionsPayload] = await Promise.all([
        getWallet(),
        listWalletOrders({ limit: 100, offset: 0 }),
        listWalletTransactions({ limit: 100, offset: 0 })
      ])
      wallet.value = normalizeWallet(walletPayload)
      orders.value = ordersPayload.items || []
      transactions.value = transactionsPayload.items || []
      await fetchProviders().catch(() => undefined)
    } finally {
      loading.value = false
    }
  }

  async function submitRecharge() {
    if (!recharge.amount || recharge.amount <= 0) {
      ElMessage.warning('请输入有效充值金额')
      return
    }
    submitting.value = true
    try {
      const response = await createWalletRecharge({
        amount: recharge.amount,
        note: recharge.note,
        method: recharge.method,
        meta: {}
      })
      openPayment(response.payment)
      ElMessage.success('充值订单已创建')
      rechargeOpen.value = false
      await fetchAll()
    } finally {
      submitting.value = false
    }
  }

  async function submitWithdraw() {
    if (!withdraw.amount || withdraw.amount <= 0) {
      ElMessage.warning('请输入有效提现金额')
      return
    }
    if (!withdraw.note.trim()) {
      ElMessage.warning('请填写收款方式')
      return
    }
    submitting.value = true
    try {
      await createWalletWithdraw({
        amount: withdraw.amount,
        note: withdraw.note,
        meta: { channel: 'manual' }
      })
      ElMessage.success('提现申请已提交')
      withdrawOpen.value = false
      await fetchAll()
    } finally {
      submitting.value = false
    }
  }

  async function continuePay(row: WalletOrder) {
    const method = String(row.meta?.payment_method || '')
    const response = await payWalletOrder(row.id as number, { method })
    openPayment(response)
    ElMessage.success('已拉起支付')
  }

  async function cancelOrder(row: WalletOrder) {
    await cancelWalletOrder(row.id as number, { reason: 'user_cancel' })
    ElMessage.success('已取消')
    await fetchAll()
  }

  onMounted(fetchAll)
</script>

<style scoped lang="scss">
  .balance-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 22px;
  }

  .balance {
    margin: 8px 0;
    color: var(--el-color-danger);
    font-size: 34px;
    font-weight: 800;
  }

  .balance-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(90px, 1fr));
    gap: 10px;

    div {
      padding: 14px;
      border-radius: 8px;
      background: var(--el-fill-color-extra-light);
      text-align: center;
    }

    span {
      display: block;
      color: var(--art-gray-500);
      font-size: 13px;
    }

    strong {
      display: block;
      margin-top: 6px;
      color: var(--art-gray-900);
      font-size: 20px;
    }
  }

  .full-width,
  .full-width-number {
    width: 100%;
  }

  .dialog-form {
    margin-top: 16px;
  }

  @media (max-width: 760px) {
    .balance-card {
      align-items: stretch;
      flex-direction: column;
    }

    .balance-stats {
      grid-template-columns: 1fr;
    }
  }
</style>
