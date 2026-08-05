<template>
  <div class="tickets-page art-full-height">
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="8"
      :show-expand="false"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" v-ripple @click="showCreateDialog">
              <ArtSvgIcon icon="ri:add-line" class="button-icon" />
              新建工单
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :row-key="getTicketRowKey"
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        empty-text="暂无工单"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <template #subject="{ row }">
          <div class="subject-cell">
            <ArtSvgIcon icon="ri:customer-service-2-line" class="subject-icon" />
            <div class="subject-content">
              <ElTag size="small" type="info" effect="plain">#{{ getTicketId(row) }}</ElTag>
              <span class="subject-text">{{ getTicketSubject(row) }}</span>
            </div>
          </div>
        </template>

        <template #status="{ row }">
          <ElTag :type="getStatusConfig(getTicketStatus(row)).type" effect="light">
            {{ getStatusConfig(getTicketStatus(row)).label }}
          </ElTag>
        </template>

        <template #lastMessage="{ row }">
          <div class="secondary-cell">
            <ArtSvgIcon icon="ri:message-3-line" />
            <span>{{ getLastMessage(row) }}</span>
          </div>
        </template>

        <template #resources="{ row }">
          <div class="secondary-cell">
            <ArtSvgIcon icon="ri:server-line" />
            <span>{{ getResourceCount(row) }}</span>
          </div>
        </template>

        <template #createdAt="{ row }">
          <div class="secondary-cell">
            <ArtSvgIcon icon="ri:calendar-line" />
            <span>{{ formatDate(getCreatedAt(row)) }}</span>
          </div>
        </template>

        <template #operation="{ row }">
          <ElTooltip content="查看工单" placement="top">
            <ArtButtonTable type="view" @click="openTicket(row)" />
          </ElTooltip>
        </template>
      </ArtTable>
    </ElCard>

    <ElDialog
      v-model="createDialogVisible"
      title="新建工单"
      width="min(540px, 92vw)"
      align-center
      destroy-on-close
      @closed="resetCreateForm"
    >
      <ElForm ref="createFormRef" :model="createForm" :rules="createRules" label-position="top">
        <ElFormItem label="标题" prop="subject">
          <ElInput
            v-model.trim="createForm.subject"
            placeholder="简要描述您的问题"
            :maxlength="INPUT_LIMITS.TICKET_SUBJECT"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="描述" prop="content">
          <ElInput
            v-model="createForm.content"
            type="textarea"
            placeholder="详细描述您的问题"
            :rows="5"
            :maxlength="INPUT_LIMITS.TICKET_CONTENT"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="关联资源" prop="resources">
          <ElSelect
            v-model="createForm.resources"
            class="resource-select"
            multiple
            filterable
            clearable
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择相关 VPS 实例"
            :loading="vpsLoading"
            :filter-method="filterVpsOptions"
            @visible-change="handleResourceSelectVisible"
          >
            <ElOption
              v-for="option in filteredVpsOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            >
              <div class="vps-option">
                <div class="vps-option-header">
                  <span class="vps-option-name">{{ option.label }}</span>
                  <ElTag size="small" type="info" effect="plain">{{ option.region }}</ElTag>
                </div>
                <div class="vps-option-specs">
                  <span>{{ option.cpu }} 核</span>
                  <span>{{ option.memory }} GB</span>
                  <span>{{ option.disk }} GB</span>
                  <span>{{ option.bandwidth }} Mbps</span>
                </div>
              </div>
            </ElOption>
          </ElSelect>
          <div v-if="vpsLoadError" class="resource-load-error" role="alert">
            <span>{{ vpsLoadError }}</span>
            <ElButton link type="primary" :loading="vpsLoading" @click="loadVpsOptions">
              重新加载
            </ElButton>
          </div>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="createDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="creating" @click="handleCreate">创建工单</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules, TagProps } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import { createTicket, listTickets, listVps } from '@/services/user'
  import type { Ticket, VPSInstance } from '@/services/types'
  import { INPUT_LIMITS } from '@/constants/inputLimits'

  defineOptions({ name: 'ConsoleTickets' })

  type TagType = TagProps['type']

  interface TicketTableRecord extends Ticket {
    ID?: number
    Subject?: string
    Status?: string
    ResourceCount?: number
    LastMessage?: string
    CreatedAt?: string
    last_message?: string
  }

  interface TicketListPayload {
    items?: TicketTableRecord[]
    Items?: TicketTableRecord[]
    total?: number
    Total?: number
  }

  interface VpsTableRecord extends VPSInstance {
    ID?: number
    Name?: string
    Region?: string
    CPU?: number
    MemoryGB?: number
    DiskGB?: number
    BandwidthMB?: number
  }

  interface TicketSearchParams {
    current: number
    size: number
    status?: string
  }

  interface VpsOption {
    label: string
    value: number
    region: string
    cpu: number
    memory: number
    disk: number
    bandwidth: number
  }

  interface RequestError {
    response?: {
      data?: {
        error?: unknown
        message?: unknown
      }
    }
    message?: unknown
  }

  const router = useRouter()
  const createFormRef = ref<FormInstance>()
  const createDialogVisible = ref(false)
  const creating = ref(false)
  const vpsLoading = ref(false)
  const vpsLoadError = ref('')
  const vpsList = ref<VpsTableRecord[]>([])
  const vpsQuery = ref('')

  const searchForm = ref<Record<string, unknown>>({ status: 'all' })
  const searchItems = computed(() => [
    {
      key: 'status',
      label: '工单状态',
      type: 'select',
      props: {
        clearable: false,
        options: [
          { label: '全部', value: 'all' },
          { label: '待处理', value: 'open' },
          { label: '等待回复', value: 'waiting_user' },
          { label: '处理中', value: 'waiting_admin' },
          { label: '已关闭', value: 'closed' }
        ]
      }
    }
  ])

  const createForm = reactive({
    subject: '',
    content: '',
    resources: [] as number[]
  })

  const createRules: FormRules<typeof createForm> = {
    subject: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
    content: [{ required: true, message: '请输入问题描述', trigger: 'blur' }]
  }

  const STATUS_CONFIG: Record<string, { label: string; type: TagType }> = {
    open: { label: '待处理', type: 'primary' },
    waiting_user: { label: '等待回复', type: 'warning' },
    waiting_admin: { label: '处理中', type: 'warning' },
    closed: { label: '已关闭', type: 'info' }
  }

  const fetchTicketPage = async (
    params: TicketSearchParams
  ): Promise<Api.Common.PaginatedResponse<TicketTableRecord>> => {
    const requestParams: Record<string, unknown> = {
      limit: params.size,
      offset: (params.current - 1) * params.size
    }
    if (params.status && params.status !== 'all') {
      requestParams.status = params.status
    }

    const response = await listTickets(requestParams)
    const payload = response.data as TicketListPayload | undefined
    return {
      records: payload?.items ?? payload?.Items ?? [],
      current: params.current,
      size: params.size,
      total: payload?.total ?? payload?.Total ?? 0
    }
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    resetSearchParams,
    refreshData,
    refreshCreate,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: fetchTicketPage,
      apiParams: { current: 1, size: 10, status: 'all' },
      columnsFactory: () => [
        { prop: 'subject', label: '工单', minWidth: 260, useSlot: true },
        { prop: 'status', label: '状态', width: 120, useSlot: true },
        {
          prop: 'lastMessage',
          label: '最后回复',
          minWidth: 220,
          showOverflowTooltip: true,
          useSlot: true
        },
        { prop: 'resources', label: '关联资源', width: 110, useSlot: true },
        { prop: 'createdAt', label: '创建时间', width: 180, useSlot: true },
        { prop: 'operation', label: '操作', width: 88, fixed: 'right', useSlot: true }
      ]
    }
  })

  const vpsOptions = computed<VpsOption[]>(() =>
    vpsList.value.flatMap((item) => {
      const id = item.id ?? item.ID
      if (typeof id !== 'number') return []
      return [
        {
          label: item.name ?? item.Name ?? `VPS-${id}`,
          value: id,
          region: item.region ?? item.Region ?? '-',
          cpu: item.cpu ?? item.CPU ?? 0,
          memory: item.memory_gb ?? item.MemoryGB ?? 0,
          disk: item.disk_gb ?? item.DiskGB ?? 0,
          bandwidth: item.bandwidth_mbps ?? item.BandwidthMB ?? 0
        }
      ]
    })
  )

  const filteredVpsOptions = computed(() => {
    const query = vpsQuery.value.trim().toLocaleLowerCase()
    if (!query) return vpsOptions.value
    return vpsOptions.value.filter(
      (option) =>
        option.label.toLocaleLowerCase().includes(query) ||
        option.region.toLocaleLowerCase().includes(query)
    )
  })

  const getTicketId = (ticket: TicketTableRecord): number | string => ticket.id ?? ticket.ID ?? '-'

  const getTicketRowKey = (ticket: Record<string, unknown>): string =>
    String(ticket.id ?? ticket.ID ?? '')

  const getTicketSubject = (ticket: TicketTableRecord): string =>
    ticket.subject ?? ticket.Subject ?? '-'

  const getTicketStatus = (ticket: TicketTableRecord): string =>
    ticket.status ?? ticket.Status ?? ''

  const getLastMessage = (ticket: TicketTableRecord): string =>
    ticket.last_message ?? ticket.LastMessage ?? '-'

  const getResourceCount = (ticket: TicketTableRecord): number =>
    ticket.resource_count ?? ticket.ResourceCount ?? 0

  const getCreatedAt = (ticket: TicketTableRecord): string =>
    ticket.created_at ?? ticket.CreatedAt ?? ''

  const getStatusConfig = (status: string): { label: string; type: TagType } =>
    STATUS_CONFIG[status] ?? { label: status || '未知', type: 'info' }

  const formatDate = (date: string): string => {
    if (!date) return '-'
    const value = new Date(date)
    if (Number.isNaN(value.getTime())) return date
    return value.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRequestErrorMessage = (error: unknown, fallback: string): string => {
    if (!error || typeof error !== 'object') return fallback
    const requestError = error as RequestError
    const message = requestError.response?.data?.error ?? requestError.response?.data?.message
    if (typeof message === 'string' && message.trim()) return message
    return typeof requestError.message === 'string' && requestError.message.trim()
      ? requestError.message
      : fallback
  }

  const handleSearch = (params: Record<string, unknown>): void => {
    Object.assign(searchParams, { status: params.status || 'all' })
    void getData()
  }

  const handleReset = (): void => {
    searchForm.value = { status: 'all' }
    void resetSearchParams()
  }

  const loadVpsOptions = async (): Promise<void> => {
    vpsLoading.value = true
    vpsLoadError.value = ''
    try {
      const response = await listVps()
      const payload = response.data as
        { items?: VpsTableRecord[]; Items?: VpsTableRecord[] } | undefined
      vpsList.value = payload?.items ?? payload?.Items ?? []
    } catch (error) {
      vpsLoadError.value = getRequestErrorMessage(error, 'VPS 列表加载失败')
      ElMessage.error(vpsLoadError.value)
    } finally {
      vpsLoading.value = false
    }
  }

  const filterVpsOptions = (query: string): void => {
    vpsQuery.value = query
  }

  const handleResourceSelectVisible = (visible: boolean): void => {
    if (!visible) vpsQuery.value = ''
  }

  const showCreateDialog = (): void => {
    createDialogVisible.value = true
  }

  const resetCreateForm = (): void => {
    Object.assign(createForm, { subject: '', content: '', resources: [] })
    vpsQuery.value = ''
    createFormRef.value?.resetFields()
  }

  const handleCreate = async (): Promise<void> => {
    if (!createFormRef.value) return
    const valid = await createFormRef.value.validate().catch(() => false)
    if (!valid) return

    if (createForm.subject.length > INPUT_LIMITS.TICKET_SUBJECT) {
      ElMessage.error(`工单标题长度不能超过 ${INPUT_LIMITS.TICKET_SUBJECT} 个字符`)
      return
    }
    if (createForm.content.length > INPUT_LIMITS.TICKET_CONTENT) {
      ElMessage.error(`工单内容长度不能超过 ${INPUT_LIMITS.TICKET_CONTENT} 个字符`)
      return
    }

    creating.value = true
    try {
      const nameMap = new Map(vpsOptions.value.map((option) => [option.value, option.label]))
      const payload: Record<string, unknown> = {
        subject: createForm.subject,
        content: createForm.content
      }
      if (createForm.resources.length > 0) {
        payload.resources = createForm.resources.map((id) => ({
          resource_type: 'vps',
          resource_id: id,
          resource_name: nameMap.get(id) || `VPS-${id}`
        }))
      }

      const response = await createTicket(payload)
      const responseData = response.data as
        | {
            ticket?: TicketTableRecord
            Ticket?: TicketTableRecord
          }
        | undefined
      const createdTicket = responseData?.ticket ?? responseData?.Ticket
      const ticketId = createdTicket?.id ?? createdTicket?.ID
      ElMessage.success('工单创建成功')
      createDialogVisible.value = false
      await refreshCreate()
      if (ticketId != null) {
        await router.push(`/console/tickets/${ticketId}`)
      }
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, '创建失败'))
    } finally {
      creating.value = false
    }
  }

  const openTicket = (ticket: TicketTableRecord): void => {
    const id = getTicketId(ticket)
    if (id === '-') return
    void router.push(`/console/tickets/${id}`)
  }

  onMounted(() => {
    void loadVpsOptions()
  })
</script>

<style lang="scss" scoped>
  .button-icon {
    margin-right: 6px;
  }

  .subject-cell {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  .subject-icon {
    flex: none;
    font-size: 18px;
    color: var(--theme-color);
  }

  .subject-content {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  .subject-text {
    overflow: hidden;
    font-weight: 500;
    color: var(--art-gray-900);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .secondary-cell {
    display: flex;
    gap: 7px;
    align-items: center;
    min-width: 0;
    color: var(--art-gray-700);

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .resource-select {
    width: 100%;
  }

  .resource-load-error {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 12px;
    color: var(--art-danger);

    span {
      flex: 1;
    }
  }

  .vps-option {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 5px 0;
  }

  .vps-option-header {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  }

  .vps-option-name {
    overflow: hidden;
    font-weight: 500;
    color: var(--art-gray-900);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vps-option-specs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 12px;
    color: var(--art-gray-600);
  }

  @media (width <= 640px) {
    .subject-content {
      flex-direction: column;
      gap: 4px;
      align-items: flex-start;
    }
  }
</style>
