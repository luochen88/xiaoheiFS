<template>
  <ElCard shadow="never">
    <template #header>
      <div class="card-header">
        <div>
          <div class="card-title">调试日志</div>
          <div class="card-subtitle">按模块查看审计、自动化与同步日志</div>
        </div>
        <ElButton :loading="loading" @click="emit('refresh')">刷新日志</ElButton>
      </div>
    </template>

    <ElTabs v-model="tabModel">
      <ElTabPane label="审计日志" name="audit">
        <ArtTableHeader
          v-model:columns="auditColumnChecks"
          :show-search-bar="false"
          :loading="loading"
          @refresh="emit('refresh')"
        />
        <ArtTable
          :loading="loading"
          :data="auditLogs"
          :columns="auditColumns"
          :pagination="auditPagination"
          row-key="id"
          @pagination:size-change="emit('page-size-change', 'audit', $event)"
          @pagination:current-change="emit('page-current-change', 'audit', $event)"
        >
          <template #detail="{ row }">
            <span class="text-ellipsis" :title="formatDetail(row.detail)">{{
              formatDetail(row.detail)
            }}</span>
          </template>
          <template #created_at="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </ArtTable>
      </ElTabPane>

      <ElTabPane label="自动化日志" name="automation">
        <ArtTableHeader
          v-model:columns="automationColumnChecks"
          :show-search-bar="false"
          :loading="loading"
          @refresh="emit('refresh')"
        />
        <ArtTable
          :loading="loading"
          :data="automationLogs"
          :columns="automationColumns"
          :pagination="automationPagination"
          row-key="id"
          @pagination:size-change="emit('page-size-change', 'automation', $event)"
          @pagination:current-change="emit('page-current-change', 'automation', $event)"
        >
          <template #protocol="{ row }"
            ><ElTag>{{ getProtocol(row) }}</ElTag></template
          >
          <template #connection="{ row }">
            <span class="text-ellipsis" :title="getConnection(row)">{{ getConnection(row) }}</span>
          </template>
          <template #success="{ row }">
            <ElTag :type="row.success ? 'success' : 'danger'">{{
              row.success ? '成功' : '失败'
            }}</ElTag>
          </template>
          <template #created_at="{ row }">{{ formatDateTime(row.created_at) }}</template>
          <template #operation="{ row }">
            <ElButton link type="primary" @click="emit('view-automation-detail', row)"
              >查看</ElButton
            >
          </template>
        </ArtTable>
      </ElTabPane>

      <ElTabPane label="同步日志" name="sync">
        <ArtTableHeader
          v-model:columns="syncColumnChecks"
          :show-search-bar="false"
          :loading="loading"
          @refresh="emit('refresh')"
        />
        <ArtTable
          :loading="loading"
          :data="syncLogs"
          :columns="syncColumns"
          :pagination="syncPagination"
          row-key="id"
          @pagination:size-change="emit('page-size-change', 'sync', $event)"
          @pagination:current-change="emit('page-current-change', 'sync', $event)"
        >
          <template #status="{ row }">
            <ElTag :type="getSyncStatusTagType(row.status)">{{ row.status || '-' }}</ElTag>
          </template>
          <template #created_at="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </ArtTable>
      </ElTabPane>
    </ElTabs>
  </ElCard>
</template>

<script setup lang="ts">
  import type {
    AdminAuditLogRecord,
    AutomationLogRecord,
    IntegrationSyncLogRecord
  } from '@/services/admin'
  import { useTableColumns } from '@/hooks/core/useTableColumns'

  defineOptions({ name: 'DebugLogTabs' })

  type LogTabKey = 'audit' | 'automation' | 'sync'

  interface PaginationState {
    current: number
    size: number
    total: number
  }

  interface Props {
    loading?: boolean
    activeTab: LogTabKey
    auditLogs: AdminAuditLogRecord[]
    automationLogs: AutomationLogRecord[]
    syncLogs: IntegrationSyncLogRecord[]
    auditPagination: PaginationState
    automationPagination: PaginationState
    syncPagination: PaginationState
  }

  interface Emits {
    (e: 'update:activeTab', value: LogTabKey): void
    (e: 'refresh'): void
    (e: 'page-size-change', type: LogTabKey, size: number): void
    (e: 'page-current-change', type: LogTabKey, page: number): void
    (e: 'view-automation-detail', record: AutomationLogRecord): void
  }

  const props = withDefaults(defineProps<Props>(), { loading: false })
  const emit = defineEmits<Emits>()

  const { columnChecks: auditColumnChecks, columns: auditColumns } =
    useTableColumns<AdminAuditLogRecord>(() => [
      { prop: 'id', label: 'ID', width: 80 },
      { prop: 'admin_id', label: '管理员 ID', width: 110 },
      { prop: 'action', label: '操作', minWidth: 180, showOverflowTooltip: true },
      { prop: 'target_type', label: '目标类型', width: 120 },
      { prop: 'target_id', label: '目标 ID', width: 120 },
      { prop: 'detail', label: '详情', minWidth: 260, useSlot: true },
      { prop: 'created_at', label: '时间', minWidth: 180, useSlot: true }
    ])

  const { columnChecks: automationColumnChecks, columns: automationColumns } =
    useTableColumns<AutomationLogRecord>(() => [
      { prop: 'id', label: 'ID', width: 80 },
      { prop: 'action', label: 'API', minWidth: 190, showOverflowTooltip: true },
      { prop: 'protocol', label: '协议', width: 90, useSlot: true },
      { prop: 'connection', label: '连接', minWidth: 220, useSlot: true },
      { prop: 'order_id', label: '订单 ID', width: 110 },
      { prop: 'success', label: '结果', width: 90, useSlot: true },
      { prop: 'message', label: '消息', minWidth: 240, showOverflowTooltip: true },
      { prop: 'created_at', label: '时间', minWidth: 180, useSlot: true },
      { prop: 'operation', label: '详情', width: 100, fixed: 'right', useSlot: true }
    ])

  const { columnChecks: syncColumnChecks, columns: syncColumns } =
    useTableColumns<IntegrationSyncLogRecord>(() => [
      { prop: 'id', label: 'ID', width: 80 },
      { prop: 'target', label: '目标', minWidth: 180, showOverflowTooltip: true },
      { prop: 'mode', label: '模式', width: 110 },
      { prop: 'status', label: '状态', width: 110, useSlot: true },
      { prop: 'message', label: '消息', minWidth: 280, showOverflowTooltip: true },
      { prop: 'created_at', label: '时间', minWidth: 180, useSlot: true }
    ])

  const tabModel = computed({
    get: () => props.activeTab,
    set: (value) => emit('update:activeTab', value)
  })

  function formatDateTime(value?: string) {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
  }

  function formatDetail(detail: Record<string, unknown> | string | undefined) {
    if (!detail) return '-'
    if (typeof detail === 'string') return detail
    try {
      return JSON.stringify(detail)
    } catch {
      return String(detail)
    }
  }

  function parsePayload(payload: unknown): Record<string, unknown> {
    if (!payload) return {}
    if (typeof payload === 'string') {
      try {
        return JSON.parse(payload) as Record<string, unknown>
      } catch {
        return { body: payload }
      }
    }
    return typeof payload === 'object' ? (payload as Record<string, unknown>) : { body: payload }
  }

  function findHeaderValue(headers: unknown, targetKey: string) {
    if (!headers || typeof headers !== 'object') return ''
    const matched = Object.entries(headers as Record<string, unknown>).find(
      ([key]) => key.toLowerCase() === targetKey.toLowerCase()
    )
    return matched?.[1] == null ? '' : String(matched[1])
  }

  function getProtocol(record: AutomationLogRecord) {
    const request = parsePayload(record.request_json)
    const method = String(request.method || '')
      .trim()
      .toUpperCase()
    if (method) return method
    const transport = findHeaderValue(request.headers, 'x-transport').trim()
    return transport ? transport.toUpperCase() : 'UNKNOWN'
  }

  function getConnection(record: AutomationLogRecord) {
    const request = parsePayload(record.request_json)
    const pluginId = findHeaderValue(request.headers, 'x-plugin-id').trim()
    const instanceId = findHeaderValue(request.headers, 'x-plugin-instance-id').trim()
    if (pluginId || instanceId) return `${pluginId || '-'} / ${instanceId || '-'}`
    const urlText = String(request.url || '').trim()
    if (!urlText) return '-'
    try {
      return new URL(urlText).host || urlText
    } catch {
      return urlText
    }
  }

  function getSyncStatusTagType(status?: string) {
    if (status === 'success') return 'success' as const
    if (status === 'failed' || status === 'error') return 'danger' as const
    return 'info' as const
  }
</script>

<style scoped lang="scss">
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

  .card-subtitle {
    margin-top: 4px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .tab-toolbar {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .filter-input {
    width: 280px;
    max-width: 100%;
  }

  .text-ellipsis {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pagination-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 14px;
  }

  @media (width <= 768px) {
    .card-header,
    .tab-toolbar {
      flex-direction: column;
      align-items: flex-start;
    }

    .pagination-wrap {
      justify-content: flex-start;
      overflow-x: auto;
    }
  }
</style>
