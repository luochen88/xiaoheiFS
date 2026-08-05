<template>
  <div>
    <ConsolePageHeader
      title="云服务器详情"
      :description="current?.name || `VPS-${route.params.id}`"
    >
      <template #actions>
        <ElButton @click="router.push('/console/vps')">返回列表</ElButton>
        <ElButton :icon="Refresh" :loading="loading" @click="fetchDetail">刷新</ElButton>
      </template>
    </ConsolePageHeader>

    <ElSkeleton v-if="loading && !current" :rows="8" animated />
    <template v-else>
      <div class="detail-grid console-section">
        <div class="console-card hero-card">
          <div class="hero-head">
            <div>
              <div class="hero-title">{{ current?.name || `VPS-${current?.id}` }}</div>
              <div class="muted mono">ID: {{ current?.id || '-' }}</div>
            </div>
            <ConsoleStatusTag :status="current?.status" kind="vps" />
          </div>
          <div class="hero-spec">{{ specText(specRecord) }}</div>
          <div class="hero-meta">
            <span>{{ current?.region || '未知地区' }}</span>
            <span>{{ current?.package_name || '未命名套餐' }}</span>
            <span>到期：{{ formatDateTime(current?.expire_at) }}</span>
          </div>
        </div>

        <div class="console-card action-card">
          <ElButton type="primary" :icon="Link" @click="openPanel">控制面板</ElButton>
          <ElButton :icon="Monitor" @click="openVnc">VNC</ElButton>
          <ElButton :icon="SwitchButton" @click="submitAction('开机', startVps)">开机</ElButton>
          <ElButton :icon="TurnOff" @click="submitAction('关机', shutdownVps)">关机</ElButton>
          <ElButton :icon="RefreshRight" @click="submitAction('重启', rebootVps)">重启</ElButton>
        </div>
      </div>

      <ElTabs v-model="activeTab" class="detail-tabs">
        <ElTabPane label="概览" name="overview">
          <ElRow :gutter="16">
            <ElCol :xs="24" :lg="14">
              <div class="console-card table-card">
                <div class="toolbar-title">资源信息</div>
                <ElDescriptions :column="2" border class="desc-table">
                  <ElDescriptionsItem label="实例名称">{{
                    current?.name || '-'
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="状态">
                    <ConsoleStatusTag :status="current?.status" kind="vps" />
                  </ElDescriptionsItem>
                  <ElDescriptionsItem label="CPU"
                    >{{ specRecord.cpu || specRecord.cores || '-' }} 核</ElDescriptionsItem
                  >
                  <ElDescriptionsItem label="内存"
                    >{{ specRecord.memory_gb || '-' }} GB</ElDescriptionsItem
                  >
                  <ElDescriptionsItem label="磁盘"
                    >{{ specRecord.disk_gb || '-' }} GB</ElDescriptionsItem
                  >
                  <ElDescriptionsItem label="带宽"
                    >{{ specRecord.bandwidth_mbps || '-' }} Mbps</ElDescriptionsItem
                  >
                  <ElDescriptionsItem label="月费">{{
                    formatMoney(current?.monthly_price)
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="创建时间">{{
                    formatDateTime(current?.created_at)
                  }}</ElDescriptionsItem>
                </ElDescriptions>
              </div>
            </ElCol>
            <ElCol :xs="24" :lg="10">
              <div class="console-card table-card">
                <div class="toolbar-title">监控快照</div>
                <div class="monitor-grid">
                  <div
                    ><span>CPU</span><strong>{{ monitor.cpu ?? '-' }}%</strong></div
                  >
                  <div
                    ><span>内存</span><strong>{{ monitor.memory ?? '-' }}%</strong></div
                  >
                  <div
                    ><span>磁盘</span><strong>{{ monitor.storage ?? '-' }}%</strong></div
                  >
                  <div
                    ><span>入站</span><strong>{{ formatBytes(monitor.bytes_in) }}</strong></div
                  >
                  <div
                    ><span>出站</span><strong>{{ formatBytes(monitor.bytes_out) }}</strong></div
                  >
                </div>
              </div>
            </ElCol>
          </ElRow>

          <div class="console-card table-card access-card">
            <div class="table-toolbar">
              <div>
                <div class="toolbar-title">访问信息</div>
                <div class="muted">后端返回的 access_info</div>
              </div>
            </div>
            <ElDescriptions v-if="Object.keys(accessInfo).length" :column="2" border>
              <ElDescriptionsItem
                v-for="(value, key) in accessInfo"
                :key="key"
                :label="String(key)"
              >
                <ElText class="mono" truncated>{{ value }}</ElText>
              </ElDescriptionsItem>
            </ElDescriptions>
            <ElEmpty v-else description="暂无访问信息" />
          </div>
        </ElTabPane>

        <ElTabPane label="安全与端口" name="network">
          <ElRow :gutter="16">
            <ElCol :xs="24" :lg="12">
              <div class="console-card table-card">
                <div class="table-toolbar">
                  <div class="toolbar-title">防火墙规则</div>
                  <ElButton type="primary" :icon="Plus" @click="firewallOpen = true">添加</ElButton>
                </div>
                <ElTable :data="firewallRows" empty-text="暂无规则">
                  <ElTableColumn prop="protocol" label="协议" width="100" />
                  <ElTableColumn prop="port" label="端口" width="120" />
                  <ElTableColumn prop="remark" label="备注" />
                  <ElTableColumn label="操作" width="90" align="right">
                    <template #default="{ row }">
                      <ElButton link type="danger" @click="removeFirewall(row)">删除</ElButton>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </div>
            </ElCol>
            <ElCol :xs="24" :lg="12">
              <div class="console-card table-card">
                <div class="table-toolbar">
                  <div class="toolbar-title">端口映射</div>
                  <ElButton type="primary" :icon="Plus" @click="portOpen = true">添加</ElButton>
                </div>
                <ElTable :data="portRows" empty-text="暂无端口映射">
                  <ElTableColumn prop="name" label="名称" />
                  <ElTableColumn prop="internal_port" label="内网端口" width="110" />
                  <ElTableColumn prop="external_port" label="外网端口" width="110" />
                  <ElTableColumn label="操作" width="90" align="right">
                    <template #default="{ row }">
                      <ElButton link type="danger" @click="removePort(row)">删除</ElButton>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </div>
            </ElCol>
          </ElRow>
        </ElTabPane>

        <ElTabPane label="快照与备份" name="backup">
          <ElRow :gutter="16">
            <ElCol :xs="24" :lg="12">
              <div class="console-card table-card">
                <div class="table-toolbar">
                  <div class="toolbar-title">快照</div>
                  <ElButton type="primary" :icon="Plus" @click="createSnapshot">创建快照</ElButton>
                </div>
                <ElTable :data="snapshotRows" empty-text="暂无快照">
                  <ElTableColumn prop="name" label="名称" />
                  <ElTableColumn prop="created_at" label="创建时间" min-width="160">
                    <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
                  </ElTableColumn>
                  <ElTableColumn label="操作" width="150" align="right">
                    <template #default="{ row }">
                      <ElButton link type="primary" @click="restoreSnapshot(row)">恢复</ElButton>
                      <ElButton link type="danger" @click="removeSnapshot(row)">删除</ElButton>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </div>
            </ElCol>
            <ElCol :xs="24" :lg="12">
              <div class="console-card table-card">
                <div class="table-toolbar">
                  <div class="toolbar-title">备份</div>
                  <ElButton type="primary" :icon="Plus" @click="createBackup">创建备份</ElButton>
                </div>
                <ElTable :data="backupRows" empty-text="暂无备份">
                  <ElTableColumn prop="name" label="名称" />
                  <ElTableColumn prop="created_at" label="创建时间" min-width="160">
                    <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
                  </ElTableColumn>
                  <ElTableColumn label="操作" width="150" align="right">
                    <template #default="{ row }">
                      <ElButton link type="primary" @click="restoreBackup(row)">恢复</ElButton>
                      <ElButton link type="danger" @click="removeBackup(row)">删除</ElButton>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </div>
            </ElCol>
          </ElRow>
        </ElTabPane>

        <ElTabPane label="维护操作" name="ops">
          <div class="console-card table-card ops-card">
            <ElButton :icon="Key" @click="passwordOpen = true">重置系统密码</ElButton>
            <ElButton :icon="RefreshRight" @click="reinstallOpen = true">重装系统</ElButton>
            <ElButton :icon="Calendar" @click="renewOpen = true">续费</ElButton>
            <ElButton :icon="EditPen" @click="resizeOpen = true">升降配</ElButton>
            <ElButton type="danger" :icon="Warning" @click="refundOpen = true">申请退款</ElButton>
          </div>
        </ElTabPane>
      </ElTabs>
    </template>

    <ElDialog v-model="passwordOpen" title="重置系统密码" width="min(460px, calc(100vw - 32px))">
      <ElForm label-position="top">
        <ElFormItem label="新密码">
          <ElInput v-model="passwordForm.password" type="password" show-password />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="passwordOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitResetPassword">提交</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="reinstallOpen" title="重装系统" width="min(460px, calc(100vw - 32px))">
      <ElAlert
        title="重装系统可能清空实例数据，请确认已备份。"
        type="warning"
        show-icon
        :closable="false"
      />
      <ElForm label-position="top" class="dialog-form">
        <ElFormItem label="系统镜像 ID">
          <ElInput v-model="reinstallForm.template_id" placeholder="请输入镜像 ID" />
        </ElFormItem>
        <ElFormItem label="系统密码">
          <ElInput v-model="reinstallForm.password" type="password" show-password />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="reinstallOpen = false">取消</ElButton>
        <ElButton type="danger" :loading="submitting" @click="submitReinstall">确认重装</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="renewOpen" title="续费 VPS" width="min(420px, calc(100vw - 32px))">
      <ElForm label-position="top">
        <ElFormItem label="续费月数">
          <ElInputNumber v-model="renewForm.months" :min="1" :max="120" class="full-width-number" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="renewOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitRenew">生成订单</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="resizeOpen" title="升降配 VPS" width="min(500px, calc(100vw - 32px))">
      <ElForm label-position="top">
        <ElFormItem label="目标套餐 ID">
          <ElInput v-model="resizeForm.target_package_id" placeholder="请输入目标套餐 ID" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="resizeOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitResize">生成订单</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="refundOpen" title="申请退款" width="min(500px, calc(100vw - 32px))">
      <ElForm label-position="top">
        <ElFormItem label="退款原因">
          <ElInput
            v-model="refundReason"
            type="textarea"
            :rows="4"
            show-word-limit
            maxlength="1000"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="refundOpen = false">取消</ElButton>
        <ElButton type="danger" :loading="submitting" @click="submitRefund">提交</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="firewallOpen" title="添加防火墙规则" width="min(460px, calc(100vw - 32px))">
      <ElForm label-position="top">
        <ElFormItem label="协议">
          <ElSelect v-model="firewallForm.protocol">
            <ElOption label="TCP" value="tcp" />
            <ElOption label="UDP" value="udp" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="端口">
          <ElInput v-model="firewallForm.port" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="firewallForm.remark" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="firewallOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitFirewall">添加</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="portOpen" title="添加端口映射" width="min(460px, calc(100vw - 32px))">
      <ElForm label-position="top">
        <ElFormItem label="名称">
          <ElInput v-model="portForm.name" />
        </ElFormItem>
        <ElFormItem label="协议">
          <ElSelect v-model="portForm.protocol">
            <ElOption label="TCP" value="tcp" />
            <ElOption label="UDP" value="udp" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="内网端口">
          <ElInputNumber
            v-model="portForm.internal_port"
            :min="1"
            :max="65535"
            class="full-width-number"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="portOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitPort">添加</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import {
    Calendar,
    EditPen,
    Key,
    Link,
    Monitor,
    Plus,
    Refresh,
    RefreshRight,
    SwitchButton,
    TurnOff,
    Warning
  } from '@element-plus/icons-vue'
  import {
    addVpsFirewallRule,
    addVpsPortMapping,
    createVpsBackup,
    createVpsRenewOrder,
    createVpsResizeOrder,
    createVpsSnapshot,
    deleteVpsBackup,
    deleteVpsFirewallRule,
    deleteVpsPortMapping,
    deleteVpsSnapshot,
    getVpsBackups,
    getVpsFirewallRules,
    getVpsMonitor,
    getVpsPanelNavigationUrl,
    getVpsPortMappings,
    getVpsSnapshots,
    getVpsVncNavigationUrl,
    rebootVps,
    requestVpsRefund,
    resetVpsOS,
    resetVpsOsPassword,
    restoreVpsBackup,
    restoreVpsSnapshot,
    shutdownVps,
    startVps,
    type MonitorResponse
  } from '@/api/console-user'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useConsoleVpsStore } from '@/store/modules/console-vps'
  import { formatDateTime, formatMoney, parseMaybeJson, specText } from '@/utils/console-user'
  import ConsolePageHeader from '../shared/PageHeader.vue'
  import ConsoleStatusTag from '../shared/StatusTag.vue'
  import '../shared/styles.scss'

  defineOptions({ name: 'ConsoleUserVpsDetail' })

  const route = useRoute()
  const router = useRouter()
  const store = useConsoleVpsStore()
  const loading = ref(false)
  const submitting = ref(false)
  const activeTab = ref('overview')
  const monitor = ref<MonitorResponse>({})
  const snapshotRows = ref<any[]>([])
  const backupRows = ref<any[]>([])
  const firewallRows = ref<any[]>([])
  const portRows = ref<any[]>([])

  const passwordOpen = ref(false)
  const reinstallOpen = ref(false)
  const renewOpen = ref(false)
  const resizeOpen = ref(false)
  const refundOpen = ref(false)
  const firewallOpen = ref(false)
  const portOpen = ref(false)
  const refundReason = ref('')

  const current = computed(() => store.current)
  const specRecord = computed(() => ({
    ...parseMaybeJson(current.value?.spec, {}),
    cpu: current.value?.cpu,
    cores: current.value?.cpu,
    memory_gb: current.value?.memory_gb,
    disk_gb: current.value?.disk_gb,
    bandwidth_mbps: current.value?.bandwidth_mbps
  }))
  const accessInfo = computed(() =>
    parseMaybeJson<Record<string, unknown>>(current.value?.access_info, {})
  )

  const passwordForm = reactive({ password: '' })
  const reinstallForm = reactive({ template_id: '', password: '' })
  const renewForm = reactive({ months: 1 })
  const resizeForm = reactive({ target_package_id: '' })
  const firewallForm = reactive({ protocol: 'tcp', port: '', remark: '' })
  const portForm = reactive({ name: '', protocol: 'tcp', internal_port: 22 })

  const id = computed(() => String(route.params.id || ''))

  function normalizeItems(payload: any) {
    if (Array.isArray(payload)) return payload
    return payload?.items || payload?.data?.items || payload?.data || []
  }

  function formatBytes(value?: number) {
    const bytes = Number(value || 0)
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
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

  async function openPanel() {
    const popup = createNavigationPopup()
    try {
      const payload = await getVpsPanelNavigationUrl(id.value)
      openExternalUrl(popup, payload.url)
    } catch {
      popup?.close()
    }
  }

  async function openVnc() {
    const popup = createNavigationPopup()
    try {
      const payload = await getVpsVncNavigationUrl(id.value)
      openExternalUrl(popup, payload.url)
    } catch {
      popup?.close()
    }
  }

  async function submitAction(label: string, fn: (id: string) => Promise<unknown>) {
    await ElMessageBox.confirm(`确认执行“${label}”？`, label, { type: 'warning' })
    await fn(id.value)
    ElMessage.success('操作已提交')
    await fetchDetail()
  }

  async function fetchRelated() {
    const [monitorPayload, snapshots, backups, firewall, ports] = await Promise.allSettled([
      getVpsMonitor(id.value),
      getVpsSnapshots(id.value),
      getVpsBackups(id.value),
      getVpsFirewallRules(id.value),
      getVpsPortMappings(id.value)
    ])
    if (monitorPayload.status === 'fulfilled') monitor.value = monitorPayload.value || {}
    if (snapshots.status === 'fulfilled') snapshotRows.value = normalizeItems(snapshots.value)
    if (backups.status === 'fulfilled') backupRows.value = normalizeItems(backups.value)
    if (firewall.status === 'fulfilled') firewallRows.value = normalizeItems(firewall.value)
    if (ports.status === 'fulfilled') portRows.value = normalizeItems(ports.value)
  }

  async function fetchDetail() {
    loading.value = true
    try {
      await store.fetchDetail(id.value)
      await fetchRelated()
    } finally {
      loading.value = false
    }
  }

  async function withSubmit(fn: () => Promise<void>) {
    submitting.value = true
    try {
      await fn()
    } finally {
      submitting.value = false
    }
  }

  async function submitResetPassword() {
    if (!passwordForm.password) {
      ElMessage.warning('请输入新密码')
      return
    }
    await withSubmit(async () => {
      await resetVpsOsPassword(id.value, { password: passwordForm.password })
      ElMessage.success('重置任务已提交')
      passwordOpen.value = false
      passwordForm.password = ''
    })
  }

  async function submitReinstall() {
    if (!reinstallForm.template_id || !reinstallForm.password) {
      ElMessage.warning('请填写镜像 ID 和系统密码')
      return
    }
    await withSubmit(async () => {
      await resetVpsOS(id.value, {
        template_id: reinstallForm.template_id,
        password: reinstallForm.password
      })
      ElMessage.success('重装任务已提交')
      reinstallOpen.value = false
    })
  }

  async function submitRenew() {
    await withSubmit(async () => {
      const response: any = await createVpsRenewOrder(id.value, { months: renewForm.months })
      ElMessage.success('续费订单已创建')
      renewOpen.value = false
      const orderId = response?.order?.id || response?.id
      if (orderId) router.push(`/console/orders/${orderId}`)
    })
  }

  async function submitResize() {
    if (!resizeForm.target_package_id) {
      ElMessage.warning('请输入目标套餐 ID')
      return
    }
    await withSubmit(async () => {
      const response: any = await createVpsResizeOrder(id.value, {
        target_package_id: Number(resizeForm.target_package_id)
      })
      ElMessage.success('改配订单已创建')
      resizeOpen.value = false
      const orderId = response?.order?.id || response?.id
      if (orderId) router.push(`/console/orders/${orderId}`)
    })
  }

  async function submitRefund() {
    if (!refundReason.value.trim()) {
      ElMessage.warning('请填写退款原因')
      return
    }
    await withSubmit(async () => {
      await requestVpsRefund(id.value, { reason: refundReason.value.trim() })
      ElMessage.success('退款申请已提交')
      refundOpen.value = false
    })
  }

  async function submitFirewall() {
    await withSubmit(async () => {
      await addVpsFirewallRule(id.value, { ...firewallForm })
      ElMessage.success('规则已添加')
      firewallOpen.value = false
      const payload = await getVpsFirewallRules(id.value)
      firewallRows.value = normalizeItems(payload)
    })
  }

  async function submitPort() {
    await withSubmit(async () => {
      await addVpsPortMapping(id.value, { ...portForm })
      ElMessage.success('端口映射已添加')
      portOpen.value = false
      const payload = await getVpsPortMappings(id.value)
      portRows.value = normalizeItems(payload)
    })
  }

  async function removeFirewall(row: any) {
    await deleteVpsFirewallRule(id.value, row.id)
    ElMessage.success('规则已删除')
    firewallRows.value = normalizeItems(await getVpsFirewallRules(id.value))
  }

  async function removePort(row: any) {
    await deleteVpsPortMapping(id.value, row.id)
    ElMessage.success('映射已删除')
    portRows.value = normalizeItems(await getVpsPortMappings(id.value))
  }

  async function createSnapshot() {
    await createVpsSnapshot(id.value)
    ElMessage.success('快照任务已提交')
    snapshotRows.value = normalizeItems(await getVpsSnapshots(id.value))
  }

  async function restoreSnapshot(row: any) {
    await restoreVpsSnapshot(id.value, row.id)
    ElMessage.success('恢复任务已提交')
  }

  async function removeSnapshot(row: any) {
    await deleteVpsSnapshot(id.value, row.id)
    ElMessage.success('快照已删除')
    snapshotRows.value = normalizeItems(await getVpsSnapshots(id.value))
  }

  async function createBackup() {
    await createVpsBackup(id.value)
    ElMessage.success('备份任务已提交')
    backupRows.value = normalizeItems(await getVpsBackups(id.value))
  }

  async function restoreBackup(row: any) {
    await restoreVpsBackup(id.value, row.id)
    ElMessage.success('恢复任务已提交')
  }

  async function removeBackup(row: any) {
    await deleteVpsBackup(id.value, row.id)
    ElMessage.success('备份已删除')
    backupRows.value = normalizeItems(await getVpsBackups(id.value))
  }

  onMounted(fetchDetail)
</script>

<style scoped lang="scss">
  .detail-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 16px;
  }

  .hero-card,
  .action-card {
    padding: 18px;
  }

  .hero-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .hero-title {
    color: var(--art-gray-900);
    font-size: 22px;
    font-weight: 700;
  }

  .hero-spec {
    margin-top: 18px;
    color: var(--art-gray-900);
    font-size: 28px;
    font-weight: 700;
  }

  .hero-meta {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 12px;
    color: var(--art-gray-500);
  }

  .action-card {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    align-content: start;
  }

  .detail-tabs {
    margin-top: 8px;
  }

  .desc-table {
    margin-top: 14px;
  }

  .monitor-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-top: 14px;

    div {
      padding: 14px;
      border-radius: 8px;
      background: var(--el-fill-color-extra-light);
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

  .access-card,
  .ops-card {
    margin-top: 16px;
  }

  .ops-card {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .dialog-form {
    margin-top: 16px;
  }

  .full-width-number {
    width: 100%;
  }

  @media (max-width: 960px) {
    .detail-grid {
      grid-template-columns: 1fr;
    }

    .action-card {
      grid-template-columns: 1fr;
    }
  }
</style>
