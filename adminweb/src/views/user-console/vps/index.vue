<template>
  <div>
    <ConsolePageHeader
      title="云服务器"
      description="查看实例状态、到期时间，并执行常用生命周期操作。"
    >
      <template #actions>
        <ElButton :icon="Refresh" :loading="store.loading" @click="fetchData">刷新</ElButton>
        <ElButton type="primary" :icon="Plus" @click="router.push('/console/buy')"
          >购买 VPS</ElButton
        >
      </template>
    </ConsolePageHeader>

    <div class="console-grid-4 console-section">
      <div v-for="item in stats" :key="item.label" class="console-card metric-card stat-card">
        <div class="metric-icon" :style="{ background: item.color }">
          <ElIcon><component :is="item.icon" /></ElIcon>
        </div>
        <div>
          <div class="metric-label">{{ item.label }}</div>
          <div class="metric-value">{{ item.value }}</div>
        </div>
      </div>
    </div>

    <div class="console-card table-card">
      <div class="table-toolbar">
        <div>
          <div class="toolbar-title">实例列表</div>
          <div class="muted">普通用户侧资源，仅使用 /api/v1/vps 接口</div>
        </div>
        <ElSegmented v-model="statusFilter" :options="statusOptions" />
      </div>

      <ElTable
        :data="filteredItems"
        row-key="id"
        :loading="store.loading"
        empty-text="暂无云服务器"
      >
        <ElTableColumn label="实例" min-width="190">
          <template #default="{ row }">
            <div class="primary-text">{{ row.name || `VPS-${row.id}` }}</div>
            <div class="muted mono">ID: {{ row.id || '-' }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="配置" min-width="190">
          <template #default="{ row }">
            <ElTag effect="plain">{{ specText(resolveSpecRecord(row)) }}</ElTag>
            <div class="muted package-line">{{ row.package_name || row.region || '-' }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="120">
          <template #default="{ row }">
            <ConsoleStatusTag :status="row.status" kind="vps" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="到期时间" min-width="170">
          <template #default="{ row }">
            <span :class="{ danger: isExpiring(row.expire_at) }">{{
              formatDateTime(row.expire_at)
            }}</span>
            <div
              v-if="row.destroy_in_days !== undefined && row.destroy_in_days !== null"
              class="muted"
            >
              {{ row.destroy_in_days }} 天后自动删除
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="330" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="router.push(`/console/vps/${row.id}`)"
              >详情</ElButton
            >
            <ElButton link type="primary" @click="openPanel(row)">面板</ElButton>
            <ElDropdown @command="(command: string) => handleCommand(command, row)">
              <ElButton link type="primary">
                更多<ElIcon class="el-icon--right"><ArrowDown /></ElIcon>
              </ElButton>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem command="vnc">VNC</ElDropdownItem>
                  <ElDropdownItem command="start">开机</ElDropdownItem>
                  <ElDropdownItem command="shutdown">关机</ElDropdownItem>
                  <ElDropdownItem command="reboot">重启</ElDropdownItem>
                  <ElDropdownItem command="refresh">刷新状态</ElDropdownItem>
                  <ElDropdownItem divided command="renew">续费</ElDropdownItem>
                  <ElDropdownItem command="emergencyRenew">紧急续费</ElDropdownItem>
                  <ElDropdownItem command="resize">升降配</ElDropdownItem>
                  <ElDropdownItem divided command="refund">申请退款</ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <ElDialog v-model="renewOpen" title="续费 VPS" width="min(460px, calc(100vw - 32px))">
      <ElAlert
        title="续费会生成订单，请在订单详情中完成支付。"
        type="info"
        show-icon
        :closable="false"
      />
      <ElForm label-position="top" class="dialog-form">
        <ElFormItem label="续费时长">
          <ElInputNumber v-model="renewForm.months" :min="1" :max="120" class="full-width-number" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="renewOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitRenew">生成续费订单</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="resizeOpen" title="升降配 VPS" width="min(520px, calc(100vw - 32px))">
      <ElForm label-position="top" class="dialog-form">
        <ElFormItem label="目标套餐">
          <ElSelect
            v-model="resizeForm.target_package_id"
            placeholder="请选择目标套餐"
            filterable
            class="full-width"
          >
            <ElOption
              v-for="item in resizePackages"
              :key="item.id"
              :label="`${item.name || `套餐 ${item.id}`} · ${formatMoney(item.monthly_price)}/月`"
              :value="item.id || 0"
            />
          </ElSelect>
        </ElFormItem>
        <ElRow :gutter="12">
          <ElCol :span="12">
            <ElFormItem label="CPU 附加">
              <ElInputNumber
                v-model="resizeForm.spec.add_cores"
                :min="0"
                class="full-width-number"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="内存附加 GB">
              <ElInputNumber
                v-model="resizeForm.spec.add_mem_gb"
                :min="0"
                class="full-width-number"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="磁盘附加 GB">
              <ElInputNumber
                v-model="resizeForm.spec.add_disk_gb"
                :min="0"
                class="full-width-number"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="带宽附加 Mbps">
              <ElInputNumber
                v-model="resizeForm.spec.add_bw_mbps"
                :min="0"
                class="full-width-number"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
      <template #footer>
        <ElButton @click="resizeOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitResize">生成改配订单</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="refundOpen" title="申请退款" width="min(500px, calc(100vw - 32px))">
      <ElAlert title="退款申请提交后会进入审核流程。" type="warning" show-icon :closable="false" />
      <ElForm label-position="top" class="dialog-form">
        <ElFormItem label="退款原因">
          <ElInput
            v-model="refundReason"
            type="textarea"
            :rows="4"
            :maxlength="INPUT_LIMITS.REFUND_REASON"
            show-word-limit
            placeholder="请说明退款原因"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="refundOpen = false">取消</ElButton>
        <ElButton type="danger" :loading="submitting" @click="submitRefund">提交申请</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ArrowDown, Clock, Monitor, Plus, Refresh, SwitchButton } from '@element-plus/icons-vue'
  import {
    createVpsRenewOrder,
    createVpsResizeOrder,
    emergencyRenewVps,
    getVpsPanelNavigationUrl,
    getVpsVncNavigationUrl,
    rebootVps,
    requestVpsRefund,
    shutdownVps,
    startVps,
    type VpsRecord
  } from '@/api/console-user'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useConsoleCatalogStore } from '@/store/modules/console-catalog'
  import { useConsoleVpsStore } from '@/store/modules/console-vps'
  import {
    formatDateTime,
    formatMoney,
    normalizeStatus,
    parseMaybeJson,
    specText
  } from '@/utils/console-user'
  import { INPUT_LIMITS } from '@/utils/constants'
  import ConsolePageHeader from '../shared/PageHeader.vue'
  import ConsoleStatusTag from '../shared/StatusTag.vue'
  import '../shared/styles.scss'

  defineOptions({ name: 'ConsoleUserVpsList' })

  const router = useRouter()
  const store = useConsoleVpsStore()
  const catalog = useConsoleCatalogStore()
  const statusFilter = ref('all')
  const activeRecord = ref<VpsRecord | null>(null)
  const renewOpen = ref(false)
  const resizeOpen = ref(false)
  const refundOpen = ref(false)
  const submitting = ref(false)
  const refundReason = ref('')

  const renewForm = reactive({ months: 1 })
  const resizeForm = reactive({
    target_package_id: undefined as number | undefined,
    spec: {
      add_cores: 0,
      add_mem_gb: 0,
      add_disk_gb: 0,
      add_bw_mbps: 0
    }
  })

  const statusOptions = [
    { label: '全部', value: 'all' },
    { label: '运行中', value: 'running' },
    { label: '已关机', value: 'stopped' },
    { label: '开通中', value: 'provisioning' },
    { label: '已到期', value: 'expired' }
  ]

  const filteredItems = computed(() => {
    if (statusFilter.value === 'all') return store.items
    if (statusFilter.value === 'stopped') {
      return store.items.filter((item) =>
        ['stopped', 'shutdown'].includes(normalizeStatus(item.status))
      )
    }
    return store.items.filter((item) => normalizeStatus(item.status) === statusFilter.value)
  })

  const stats = computed(() => {
    const running = store.items.filter((item) => normalizeStatus(item.status) === 'running').length
    const stopped = store.items.filter((item) =>
      ['stopped', 'shutdown'].includes(normalizeStatus(item.status))
    ).length
    const provisioning = store.items.filter((item) =>
      ['pending', 'provisioning'].includes(normalizeStatus(item.status))
    ).length
    const expiring = store.items.filter((item) => isExpiring(item.expire_at)).length
    return [
      { label: '运行中', value: running, icon: SwitchButton, color: '#10b981' },
      { label: '已关机', value: stopped, icon: Monitor, color: '#64748b' },
      { label: '开通中', value: provisioning, icon: Refresh, color: '#1677ff' },
      { label: '即将到期', value: expiring, icon: Clock, color: '#f59e0b' }
    ]
  })

  const resizePackages = computed(() => {
    const current = activeRecord.value
    if (!current?.package_id) return catalog.packages
    const currentPackage = catalog.packages.find((item) => item.id === current.package_id)
    if (!currentPackage?.plan_group_id) return catalog.packages
    return catalog.packages.filter(
      (item) => String(item.plan_group_id || '') === String(currentPackage.plan_group_id)
    )
  })

  function resolveSpecRecord(row: VpsRecord) {
    return {
      ...parseMaybeJson(row.spec, {}),
      cpu: row.cpu,
      cores: row.cpu,
      memory_gb: row.memory_gb,
      disk_gb: row.disk_gb,
      bandwidth_mbps: row.bandwidth_mbps
    }
  }

  function isExpiring(value?: string) {
    if (!value) return false
    const time = new Date(value).getTime()
    if (Number.isNaN(time)) return false
    return time - Date.now() <= 7 * 24 * 3600 * 1000
  }

  function openExternalUrl(popup: Window | null, url?: string) {
    if (!url) {
      popup?.close()
      ElMessage.error('未获取到访问地址')
      return
    }
    if (popup) {
      popup.location.href = url
      return
    }
    window.location.href = url
  }

  function createNavigationPopup() {
    const popup = window.open('about:blank', '_blank')
    if (popup) {
      popup.opener = null
    }
    return popup
  }

  async function openPanel(row: VpsRecord) {
    const popup = createNavigationPopup()
    try {
      const payload = await getVpsPanelNavigationUrl(row.id as number)
      openExternalUrl(popup, payload.url)
    } catch {
      popup?.close()
    }
  }

  async function openVnc(row: VpsRecord) {
    const popup = createNavigationPopup()
    try {
      const payload = await getVpsVncNavigationUrl(row.id as number)
      openExternalUrl(popup, payload.url)
    } catch {
      popup?.close()
    }
  }

  async function submitSimpleAction(
    row: VpsRecord,
    label: string,
    fn: (id: number | string) => Promise<unknown>
  ) {
    await ElMessageBox.confirm(`确认对 ${row.name || `VPS-${row.id}`} 执行“${label}”？`, label, {
      type: 'warning'
    })
    await fn(row.id as number)
    ElMessage.success('操作已提交')
    await store.fetchVps()
  }

  function openRenew(row: VpsRecord) {
    activeRecord.value = row
    renewForm.months = 1
    renewOpen.value = true
  }

  function openResize(row: VpsRecord) {
    activeRecord.value = row
    const spec = parseMaybeJson<Record<string, number>>(row.spec, {})
    resizeForm.target_package_id = row.package_id
    resizeForm.spec.add_cores = Number(spec.add_cores || 0)
    resizeForm.spec.add_mem_gb = Number(spec.add_mem_gb || 0)
    resizeForm.spec.add_disk_gb = Number(spec.add_disk_gb || 0)
    resizeForm.spec.add_bw_mbps = Number(spec.add_bw_mbps || 0)
    resizeOpen.value = true
  }

  function openRefund(row: VpsRecord) {
    activeRecord.value = row
    refundReason.value = ''
    refundOpen.value = true
  }

  async function submitRenew() {
    if (!activeRecord.value?.id) return
    submitting.value = true
    try {
      const response: any = await createVpsRenewOrder(activeRecord.value.id, {
        months: renewForm.months
      })
      ElMessage.success('续费订单已创建')
      renewOpen.value = false
      const orderId = response?.order?.id || response?.id
      if (orderId) router.push(`/console/orders/${orderId}`)
    } finally {
      submitting.value = false
    }
  }

  async function submitResize() {
    if (!activeRecord.value?.id) return
    if (!resizeForm.target_package_id) {
      ElMessage.warning('请选择目标套餐')
      return
    }
    submitting.value = true
    try {
      const response: any = await createVpsResizeOrder(activeRecord.value.id, {
        target_package_id: resizeForm.target_package_id,
        spec: resizeForm.spec
      })
      ElMessage.success('改配订单已创建')
      resizeOpen.value = false
      const orderId = response?.order?.id || response?.id
      if (orderId) router.push(`/console/orders/${orderId}`)
    } finally {
      submitting.value = false
    }
  }

  async function submitRefund() {
    if (!activeRecord.value?.id) return
    if (!refundReason.value.trim()) {
      ElMessage.warning('请填写退款原因')
      return
    }
    submitting.value = true
    try {
      await requestVpsRefund(activeRecord.value.id, { reason: refundReason.value.trim() })
      ElMessage.success('退款申请已提交')
      refundOpen.value = false
    } finally {
      submitting.value = false
    }
  }

  async function handleCommand(command: string, row: VpsRecord) {
    if (command === 'vnc') return openVnc(row)
    if (command === 'renew') return openRenew(row)
    if (command === 'resize') return openResize(row)
    if (command === 'refund') return openRefund(row)
    if (command === 'emergencyRenew') {
      return submitSimpleAction(row, '紧急续费', emergencyRenewVps)
    }
    if (command === 'start') return submitSimpleAction(row, '开机', startVps)
    if (command === 'shutdown') return submitSimpleAction(row, '关机', shutdownVps)
    if (command === 'reboot') return submitSimpleAction(row, '重启', rebootVps)
    if (command === 'refresh') return store.refresh(row.id as number)
  }

  async function fetchData() {
    await store.fetchVps()
    if (!catalog.packages.length) {
      catalog.fetchCatalog().catch(() => undefined)
    }
  }

  onMounted(fetchData)
</script>

<style scoped lang="scss">
  .stat-card {
    cursor: default;
  }

  .primary-text {
    color: var(--art-gray-900);
    font-weight: 600;
  }

  .package-line {
    margin-top: 6px;
  }

  .danger {
    color: var(--el-color-danger);
    font-weight: 600;
  }

  .dialog-form {
    margin-top: 16px;
  }

  .full-width,
  .full-width-number {
    width: 100%;
  }
</style>
