<template>
  <div class="debug-page art-full-height">
    <ElAlert
      type="warning"
      :closable="false"
      show-icon
      title="调试模式会记录详细请求日志，仅建议在排查问题时短期开启。"
    />

    <ElRow :gutter="16" class="summary-grid">
      <ElCol :xs="24" :lg="8">
        <ElCard v-loading="statusLoading" shadow="never">
          <template #header>
            <div class="card-header">
              <div>
                <div class="card-title">调试状态</div>
                <div class="card-subtitle">用于排查自动化请求与系统日志问题</div>
              </div>
              <ElTag :type="debugEnabled ? 'warning' : 'info'">{{
                debugEnabled ? '已开启' : '未开启'
              }}</ElTag>
            </div>
          </template>

          <template v-if="canViewStatus || canUpdateStatus">
            <div class="status-panel">
              <ElSwitch
                :model-value="debugEnabled"
                :disabled="!canUpdateStatus || debugUpdating"
                size="large"
                @change="handleToggleDebug"
              />
              <div>
                <div class="status-title">{{
                  debugEnabled ? '调试模式已启用' : '调试模式已禁用'
                }}</div>
                <p class="status-copy">开启后将记录 API 请求的详细入参与响应内容。</p>
              </div>
            </div>
          </template>

          <ElEmpty v-else description="当前账号没有查看调试状态的权限" />
        </ElCard>
      </ElCol>

      <ElCol :xs="24" :lg="16">
        <ElCard v-loading="retentionLoading" shadow="never">
          <template #header>
            <div class="card-header">
              <div>
                <div class="card-title">日志保留策略</div>
                <div class="card-subtitle">由系统任务每天自动清理过期日志</div>
              </div>
              <ElButton
                v-if="canUpdateSettings"
                type="primary"
                :loading="savingRetention"
                @click="saveRetentionSettings"
                >保存策略</ElButton
              >
            </div>
          </template>

          <template v-if="canViewSettings || canUpdateSettings">
            <div class="retention-grid">
              <div v-for="item in retentionItems" :key="item.key" class="retention-item">
                <span class="retention-label">{{ item.label }}</span>
                <ElInputNumber
                  v-model="retention[item.key]"
                  :min="1"
                  :max="3650"
                  :step="1"
                  step-strictly
                  controls-position="right"
                  :disabled="!canUpdateSettings || savingRetention"
                  class="retention-input"
                />
              </div>
            </div>
          </template>

          <ElEmpty v-else description="当前账号没有查看日志保留策略的权限" />
        </ElCard>
      </ElCol>
    </ElRow>

    <DebugLogTabs
      v-if="canViewLogs"
      v-model:active-tab="activeLogTab"
      :loading="loading"
      :audit-logs="auditLogs"
      :automation-logs="automationLogs"
      :sync-logs="syncLogs"
      :audit-pagination="auditPagination"
      :automation-pagination="automationPagination"
      :sync-pagination="syncPagination"
      @refresh="fetchLogs()"
      @page-size-change="handlePageSizeChange"
      @page-current-change="handlePageCurrentChange"
      @view-automation-detail="openDetail"
    />
    <ElCard v-else shadow="never"><ElEmpty description="当前账号没有查看调试日志的权限" /></ElCard>

    <AutomationLogDetailDialog v-model:visible="detailVisible" :record="detailRecord" />
  </div>
</template>

<script setup lang="ts">
  import type {
    AdminAuditLogRecord,
    AutomationLogRecord,
    DebugLogsResponse,
    IntegrationSyncLogRecord
  } from '@/services/admin'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useTable } from '@/hooks/core/useTable'
  import {
    fetchAdminDebugLogs,
    fetchAdminDebugStatus,
    fetchAdminSettings,
    updateAdminDebugStatus,
    updateAdminSettings
  } from '@/services/admin'
  import { ElMessage } from 'element-plus'
  import AutomationLogDetailDialog from './modules/automation-log-detail-dialog.vue'
  import DebugLogTabs from './modules/debug-log-tabs.vue'

  defineOptions({ name: 'DebugPage' })

  type LogTabKey = 'audit' | 'automation' | 'sync'
  type RetentionKey =
    'automation' | 'audit' | 'sync' | 'task_runs' | 'probe_events' | 'probe_sessions'

  type DebugTableParams = Api.Common.CommonSearchParams

  const statusLoading = ref(false)
  const retentionLoading = ref(false)
  const debugUpdating = ref(false)
  const savingRetention = ref(false)

  const debugEnabled = ref(false)
  const activeLogTab = ref<LogTabKey>('audit')
  const detailVisible = ref(false)
  const detailRecord = ref<AutomationLogRecord | null>(null)

  const auditTable = useTable({
    core: {
      apiFn: fetchAuditTable,
      apiParams: { current: 1, size: 20 },
      immediate: false,
      columnsFactory: () => []
    }
  })
  const automationTable = useTable({
    core: {
      apiFn: fetchAutomationTable,
      apiParams: { current: 1, size: 20 },
      immediate: false,
      columnsFactory: () => []
    }
  })
  const syncTable = useTable({
    core: {
      apiFn: fetchSyncTable,
      apiParams: { current: 1, size: 20 },
      immediate: false,
      columnsFactory: () => []
    }
  })

  const auditLogs = auditTable.data
  const automationLogs = automationTable.data
  const syncLogs = syncTable.data
  const auditPagination = auditTable.pagination
  const automationPagination = automationTable.pagination
  const syncPagination = syncTable.pagination
  const loading = computed(
    () => auditTable.loading.value || automationTable.loading.value || syncTable.loading.value
  )

  const retention = reactive<Record<RetentionKey, number>>({
    automation: 30,
    audit: 90,
    sync: 30,
    task_runs: 14,
    probe_events: 30,
    probe_sessions: 7
  })

  const retentionItems: Array<{ key: RetentionKey; label: string }> = [
    { key: 'automation', label: '自动化日志' },
    { key: 'audit', label: '审计日志' },
    { key: 'sync', label: '同步日志' },
    { key: 'task_runs', label: '计划任务运行日志' },
    { key: 'probe_events', label: '探针状态事件' },
    { key: 'probe_sessions', label: '探针日志会话' }
  ]

  const { hasAuth } = useAuth()
  const canViewStatus = computed(() => hasAuth('debug.view'))
  const canUpdateStatus = computed(() => hasAuth('debug.update'))
  const canViewLogs = computed(() => hasAuth('debug.list'))
  const canViewSettings = computed(() => hasAuth('settings.view'))
  const canUpdateSettings = computed(() => hasAuth('settings.update'))

  onMounted(() => {
    initializePage()
  })

  watch(activeLogTab, (tab) => {
    if (canViewLogs.value) fetchLogs(tab)
  })

  async function initializePage() {
    const tasks: Promise<unknown>[] = []
    if (canViewStatus.value || canUpdateStatus.value) tasks.push(fetchStatus())
    if (canViewSettings.value || canUpdateSettings.value) tasks.push(fetchRetentionSettings())
    if (canViewLogs.value) tasks.push(fetchLogs('audit'))
    await Promise.allSettled(tasks)
  }

  function parseDays(value: unknown, fallback: number) {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback
    return Math.min(3650, Math.trunc(parsed))
  }

  async function fetchStatus() {
    statusLoading.value = true
    try {
      debugEnabled.value = Boolean((await fetchAdminDebugStatus()).enabled)
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || '加载调试状态失败')
    } finally {
      statusLoading.value = false
    }
  }

  async function handleToggleDebug(value: boolean | string | number) {
    const checked = Boolean(value)
    const previous = debugEnabled.value
    debugEnabled.value = checked
    debugUpdating.value = true
    try {
      await updateAdminDebugStatus({ enabled: checked })
      ElMessage.success(checked ? '调试模式已启用' : '调试模式已禁用')
    } catch {
      debugEnabled.value = previous
      ElMessage.error('调试模式更新失败')
    } finally {
      debugUpdating.value = false
    }
  }

  async function fetchRetentionSettings() {
    retentionLoading.value = true
    try {
      const payload = await fetchAdminSettings()
      const values = new Map<string, string>()
      ;(payload.items || []).forEach(
        (item) => item.key && values.set(String(item.key), String(item.value || ''))
      )
      retention.automation = parseDays(values.get('automation_log_retention_days'), 30)
      retention.audit = parseDays(values.get('audit_log_retention_days'), 90)
      retention.sync = parseDays(values.get('integration_sync_log_retention_days'), 30)
      retention.task_runs = parseDays(values.get('scheduled_task_run_retention_days'), 14)
      retention.probe_events = parseDays(values.get('probe_status_event_retention_days'), 30)
      retention.probe_sessions = parseDays(values.get('probe_log_session_retention_days'), 7)
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || '加载日志保留策略失败')
    } finally {
      retentionLoading.value = false
    }
  }

  async function saveRetentionSettings() {
    savingRetention.value = true
    try {
      await updateAdminSettings({
        items: [
          {
            key: 'automation_log_retention_days',
            value: String(parseDays(retention.automation, 30))
          },
          { key: 'audit_log_retention_days', value: String(parseDays(retention.audit, 90)) },
          {
            key: 'integration_sync_log_retention_days',
            value: String(parseDays(retention.sync, 30))
          },
          {
            key: 'scheduled_task_run_retention_days',
            value: String(parseDays(retention.task_runs, 14))
          },
          {
            key: 'probe_status_event_retention_days',
            value: String(parseDays(retention.probe_events, 30))
          },
          {
            key: 'probe_log_session_retention_days',
            value: String(parseDays(retention.probe_sessions, 7))
          }
        ]
      })
      ElMessage.success('日志保留策略已保存')
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || '日志保留策略保存失败')
    } finally {
      savingRetention.value = false
    }
  }

  async function fetchDebugTable<T>(
    type: LogTabKey,
    params: DebugTableParams,
    select: (payload: DebugLogsResponse) => { items?: T[]; total?: number } | undefined
  ): Promise<Api.Common.PaginatedResponse<T>> {
    const payload = await fetchAdminDebugLogs({
      types: type,
      limit: params.size,
      offset: (params.current - 1) * params.size
    })
    const selected = select(payload)
    const records = selected?.items || []
    return {
      records,
      current: params.current,
      size: params.size,
      total: Number(selected?.total ?? records.length)
    }
  }

  function fetchAuditTable(params: DebugTableParams) {
    return fetchDebugTable<AdminAuditLogRecord>('audit', params, (payload) => payload.audit_logs)
  }

  function fetchAutomationTable(params: DebugTableParams) {
    return fetchDebugTable<AutomationLogRecord>(
      'automation',
      params,
      (payload) => payload.automation_logs
    )
  }

  function fetchSyncTable(params: DebugTableParams) {
    return fetchDebugTable<IntegrationSyncLogRecord>('sync', params, (payload) => payload.sync_logs)
  }

  function getTable(type: LogTabKey) {
    if (type === 'automation') return automationTable
    if (type === 'sync') return syncTable
    return auditTable
  }

  async function fetchLogs(type: LogTabKey = activeLogTab.value) {
    try {
      await getTable(type).getData()
    } catch {
      ElMessage.error('加载调试日志失败')
    }
  }

  function handlePageSizeChange(type: LogTabKey, size: number) {
    getTable(type).handleSizeChange(size)
  }

  function handlePageCurrentChange(type: LogTabKey, page: number) {
    getTable(type).handleCurrentChange(page)
  }

  function openDetail(record: AutomationLogRecord) {
    detailRecord.value = record
    detailVisible.value = true
  }
</script>

<style scoped lang="scss">
  .debug-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .summary-grid {
    margin: 0;
  }

  .card-header {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 16px;
    font-weight: 700;
  }

  .card-subtitle,
  .status-copy {
    margin: 4px 0 0;
    font-size: 13px;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
  }

  .status-panel {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 18px;
    align-items: center;
    min-height: 138px;
  }

  .status-title {
    font-size: 18px;
    font-weight: 700;
  }

  .retention-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .retention-item {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .retention-label {
    font-size: 13px;
    font-weight: 600;
  }

  .retention-input {
    width: 100%;
  }

  @media (width <= 1200px) {
    .retention-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (width <= 768px) {
    .card-header,
    .status-panel {
      flex-direction: column;
      grid-template-columns: 1fr;
      align-items: flex-start;
    }

    .retention-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
