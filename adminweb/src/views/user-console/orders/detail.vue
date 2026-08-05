<template>
  <div>
    <ConsolePageHeader title="订单详情" :description="order?.order_no || `订单 ${route.params.id}`">
      <template #actions>
        <ElButton @click="router.push('/console/orders')">返回列表</ElButton>
        <ElButton :icon="Refresh" @click="refresh">刷新</ElButton>
        <ElButton v-if="canPay" type="primary" @click="paymentOpen = true">立即支付</ElButton>
      </template>
    </ConsolePageHeader>

    <div class="console-card order-hero console-section">
      <div>
        <div class="muted">订单号</div>
        <div class="hero-value">{{ order?.order_no || '-' }}</div>
      </div>
      <div>
        <div class="muted">状态</div>
        <ConsoleStatusTag :status="order?.status" kind="order" />
      </div>
      <div>
        <div class="muted">金额</div>
        <div class="hero-value price">{{
          formatMoney(order?.total_amount, order?.currency || 'CNY')
        }}</div>
      </div>
      <div>
        <div class="muted">创建时间</div>
        <div class="hero-value small">{{ formatDateTime(order?.created_at) }}</div>
      </div>
    </div>

    <ElRow :gutter="16">
      <ElCol :xs="24" :lg="16">
        <div class="console-card table-card console-section">
          <div class="table-toolbar">
            <div class="toolbar-title">订单明细</div>
            <ElTag>{{ store.orderItems.length }} 件商品</ElTag>
          </div>
          <ElTable :data="itemRows" row-key="id" empty-text="暂无明细">
            <ElTableColumn prop="id" label="ID" width="90" />
            <ElTableColumn label="规格" min-width="240">
              <template #default="{ row }">
                <div class="primary-text">{{ row.specLabel }}</div>
                <div v-if="row.addonLabel" class="muted">{{ row.addonLabel }}</div>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="qty" label="数量" width="90" />
            <ElTableColumn label="金额" width="130">
              <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
            </ElTableColumn>
            <ElTableColumn label="状态" width="130">
              <template #default="{ row }">
                <ElTag :type="statusTagType(row.status)">{{ row.status || '-' }}</ElTag>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>

        <div class="console-card table-card">
          <div class="toolbar-title">付款记录</div>
          <ElTable :data="store.orderPayments" row-key="id" empty-text="暂无付款记录">
            <ElTableColumn prop="method" label="方式" width="120" />
            <ElTableColumn label="金额" width="130">
              <template #default="{ row }">{{
                formatMoney(row.amount, row.currency || 'CNY')
              }}</template>
            </ElTableColumn>
            <ElTableColumn prop="trade_no" label="交易号" min-width="180" />
            <ElTableColumn label="状态" width="120">
              <template #default="{ row }">
                <ElTag :type="statusTagType(row.status)">{{ row.status || '-' }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="时间" min-width="180">
              <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
            </ElTableColumn>
          </ElTable>
        </div>
      </ElCol>

      <ElCol :xs="24" :lg="8">
        <div class="console-card side-card">
          <div class="toolbar-title">操作</div>
          <ElButton v-if="canPay" type="primary" @click="paymentOpen = true">立即支付</ElButton>
          <ElButton @click="refresh">刷新订单</ElButton>
          <ElPopconfirm v-if="canCancel" title="确认取消该订单？" @confirm="cancelCurrent">
            <template #reference>
              <ElButton type="danger" plain>取消订单</ElButton>
            </template>
          </ElPopconfirm>
        </div>

        <div class="console-card side-card">
          <div class="toolbar-title">进度事件</div>
          <ElTimeline v-if="events.length">
            <ElTimelineItem v-for="(event, index) in events" :key="index">
              {{ eventText(event) }}
            </ElTimelineItem>
          </ElTimeline>
          <ElEmpty v-else description="暂无事件" />
        </div>
      </ElCol>
    </ElRow>

    <ElDialog v-model="paymentOpen" title="发起支付" width="min(520px, calc(100vw - 32px))">
      <ElForm label-position="top">
        <ElFormItem label="付款方式">
          <ElSelect v-model="payment.method" placeholder="请选择付款方式" class="full-width">
            <ElOption
              v-for="provider in providers"
              :key="provider.key"
              :label="provider.name || provider.key"
              :value="provider.key || ''"
            />
          </ElSelect>
        </ElFormItem>
        <template v-if="payment.method === 'approval'">
          <ElFormItem label="付款金额">
            <ElInputNumber
              v-model="payment.amount"
              :min="0"
              :precision="2"
              class="full-width-number"
            />
          </ElFormItem>
          <ElFormItem label="交易号">
            <ElInput v-model="payment.trade_no" :maxlength="INPUT_LIMITS.PAYMENT_TRADE_NO" />
          </ElFormItem>
          <ElFormItem label="截图 URL">
            <ElInput v-model="payment.screenshot_url" :maxlength="INPUT_LIMITS.URL" />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput
              v-model="payment.note"
              type="textarea"
              :rows="3"
              :maxlength="INPUT_LIMITS.PAYMENT_NOTE"
            />
          </ElFormItem>
        </template>
      </ElForm>
      <template #footer>
        <ElButton @click="paymentOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="paying" @click="submitPayment">提交支付</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { Refresh } from '@element-plus/icons-vue'
  import {
    cancelOrder,
    createOrderPayment,
    listPaymentProviders,
    type PaymentProvider
  } from '@/api/console-user'
  import { useConsoleOrdersStore } from '@/store/modules/console-orders'
  import {
    formatDateTime,
    formatMoney,
    parseMaybeJson,
    specText,
    statusTagType
  } from '@/utils/console-user'
  import { INPUT_LIMITS } from '@/utils/constants'
  import ConsolePageHeader from '../shared/PageHeader.vue'
  import ConsoleStatusTag from '../shared/StatusTag.vue'
  import '../shared/styles.scss'

  defineOptions({ name: 'ConsoleUserOrderDetail' })

  const route = useRoute()
  const router = useRouter()
  const store = useConsoleOrdersStore()
  const paymentOpen = ref(false)
  const paying = ref(false)
  const providers = ref<PaymentProvider[]>([])
  const payment = reactive({
    method: '',
    amount: 0,
    trade_no: '',
    screenshot_url: '',
    note: ''
  })

  const order = computed(() => store.currentOrder)
  const events = computed(() => store.orderEvents || [])
  const canPay = computed(() => order.value?.status === 'pending_payment')
  const canCancel = computed(() =>
    ['pending_payment', 'pending_review'].includes(String(order.value?.status || ''))
  )

  const itemRows = computed(() =>
    store.orderItems.map((item) => {
      const spec = parseMaybeJson<Record<string, any>>(item.spec, {})
      const addon = [
        spec.add_cores ? `CPU +${spec.add_cores}核` : '',
        spec.add_mem_gb ? `内存 +${spec.add_mem_gb}GB` : '',
        spec.add_disk_gb ? `磁盘 +${spec.add_disk_gb}GB` : '',
        spec.add_bw_mbps ? `带宽 +${spec.add_bw_mbps}Mbps` : '',
        spec.duration_months ? `${spec.duration_months} 个月` : ''
      ]
        .filter(Boolean)
        .join(' / ')
      return {
        ...item,
        specLabel: specText(spec),
        addonLabel: addon
      }
    })
  )

  function eventText(event: Record<string, any>) {
    return event.message || event.msg || event.content || event.event || JSON.stringify(event)
  }

  function handlePaymentResult(result: any) {
    const extra = result?.extra || {}
    const url = result?.pay_url || extra.pay_url || extra.code_url || ''
    const formHtml = extra.form_html || ''
    const urlscheme = extra.urlscheme || ''

    if (formHtml) {
      const opened = window.open('', '_blank')
      if (opened) {
        opened.document.open()
        opened.document.write(formHtml)
        opened.document.close()
      }
      return
    }
    if (urlscheme) {
      window.location.href = urlscheme
      return
    }
    if (url) {
      window.open(url, '_blank')
    }
  }

  async function fetchProviders() {
    const response = await listPaymentProviders({ scene: 'order' })
    providers.value = (response.items || []).filter((item) => item.enabled !== false)
    if (!providers.value.find((item) => item.key === 'approval')) {
      providers.value.unshift({ key: 'approval', name: '人工审核' })
    }
    if (!payment.method && providers.value.length) payment.method = providers.value[0].key || ''
  }

  async function refresh() {
    await store.fetchOrderDetail(String(route.params.id))
  }

  async function cancelCurrent() {
    await cancelOrder(String(route.params.id))
    ElMessage.success('订单已取消')
    await refresh()
  }

  async function submitPayment() {
    if (!payment.method) {
      ElMessage.warning('请选择付款方式')
      return
    }
    paying.value = true
    try {
      const payload =
        payment.method === 'approval'
          ? { ...payment, amount: Number(payment.amount || order.value?.total_amount || 0) }
          : { method: payment.method, extra: {} }
      const response = await createOrderPayment(String(route.params.id), payload)
      handlePaymentResult(response)
      ElMessage.success('支付请求已提交')
      paymentOpen.value = false
      await refresh()
    } finally {
      paying.value = false
    }
  }

  onMounted(async () => {
    await Promise.all([refresh(), fetchProviders()])
    payment.amount = Number(order.value?.total_amount || 0)
  })
</script>

<style scoped lang="scss">
  .order-hero {
    display: grid;
    grid-template-columns: 1.4fr 0.8fr 0.8fr 1.1fr;
    gap: 16px;
    padding: 18px;
  }

  .hero-value {
    margin-top: 6px;
    color: var(--art-gray-900);
    font-size: 18px;
    font-weight: 700;

    &.price {
      color: var(--el-color-danger);
    }

    &.small {
      font-size: 15px;
    }
  }

  .primary-text {
    color: var(--art-gray-900);
    font-weight: 600;
  }

  .side-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 18px;
    margin-bottom: 16px;
  }

  .full-width,
  .full-width-number {
    width: 100%;
  }

  @media (max-width: 900px) {
    .order-hero {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 640px) {
    .order-hero {
      grid-template-columns: 1fr;
    }
  }
</style>
