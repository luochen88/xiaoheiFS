<template>
  <div>
    <ConsolePageHeader title="工单" description="提交问题、关联资源并查看处理状态。">
      <template #actions>
        <ElButton type="primary" :icon="Plus" @click="createOpen = true">新建工单</ElButton>
        <ElButton :icon="Refresh" :loading="loading" @click="fetchTickets">刷新</ElButton>
      </template>
    </ConsolePageHeader>

    <div class="console-card table-card">
      <ElTable :data="items" row-key="id" :loading="loading" empty-text="暂无工单">
        <ElTableColumn label="标题" min-width="220">
          <template #default="{ row }">
            <div class="primary-text">{{ row.subject || '-' }}</div>
            <div class="muted mono">ID: {{ row.id }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="130">
          <template #default="{ row }">
            <ConsoleStatusTag :status="row.status" kind="ticket" />
          </template>
        </ElTableColumn>
        <ElTableColumn prop="resource_count" label="关联资源" width="110" />
        <ElTableColumn prop="last_reply_role" label="最后回复" width="120" />
        <ElTableColumn label="更新时间" min-width="180">
          <template #default="{ row }">{{
            formatDateTime(row.updated_at || row.created_at)
          }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="120" fixed="right" align="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="router.push(`/console/tickets/${row.id}`)"
              >详情</ElButton
            >
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <ElDialog v-model="createOpen" title="新建工单" width="min(560px, calc(100vw - 32px))">
      <ElForm label-position="top">
        <ElFormItem label="标题">
          <ElInput v-model.trim="form.subject" :maxlength="INPUT_LIMITS.TICKET_SUBJECT" />
        </ElFormItem>
        <ElFormItem label="关联资源">
          <ElSelect v-model="form.resources" multiple filterable class="full-width">
            <ElOption
              v-for="item in vpsList"
              :key="item.id"
              :label="item.name || `VPS-${item.id}`"
              :value="item.id || 0"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="问题描述">
          <ElInput
            v-model="form.content"
            type="textarea"
            :rows="6"
            :maxlength="INPUT_LIMITS.TICKET_CONTENT"
            show-word-limit
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="createOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitTicket">提交</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { Plus, Refresh } from '@element-plus/icons-vue'
  import {
    createTicket,
    listTickets,
    listVps,
    type TicketRecord,
    type VpsRecord
  } from '@/api/console-user'
  import { formatDateTime } from '@/utils/console-user'
  import { INPUT_LIMITS } from '@/utils/constants'
  import ConsolePageHeader from '../shared/PageHeader.vue'
  import ConsoleStatusTag from '../shared/StatusTag.vue'
  import '../shared/styles.scss'

  defineOptions({ name: 'ConsoleUserTickets' })

  const router = useRouter()
  const loading = ref(false)
  const submitting = ref(false)
  const createOpen = ref(false)
  const items = ref<TicketRecord[]>([])
  const vpsList = ref<VpsRecord[]>([])
  const form = reactive({
    subject: '',
    content: '',
    resources: [] as number[]
  })

  async function fetchTickets() {
    loading.value = true
    try {
      const response = await listTickets({ limit: 100, offset: 0 })
      items.value = response.items || []
    } finally {
      loading.value = false
    }
  }

  async function fetchVps() {
    const response = await listVps()
    vpsList.value = response.items || []
  }

  async function submitTicket() {
    if (!form.subject.trim() || !form.content.trim()) {
      ElMessage.warning('请填写标题和问题描述')
      return
    }
    submitting.value = true
    try {
      const nameMap = new Map(vpsList.value.map((item) => [item.id, item.name || `VPS-${item.id}`]))
      const response = await createTicket({
        subject: form.subject.trim(),
        content: form.content.trim(),
        resources: form.resources.map((id) => ({
          resource_type: 'vps',
          resource_id: id,
          resource_name: nameMap.get(id) || `VPS-${id}`
        }))
      })
      ElMessage.success('工单已创建')
      createOpen.value = false
      form.subject = ''
      form.content = ''
      form.resources = []
      const ticketId = response.ticket?.id
      if (ticketId) router.push(`/console/tickets/${ticketId}`)
      else await fetchTickets()
    } finally {
      submitting.value = false
    }
  }

  onMounted(() => {
    fetchTickets()
    fetchVps().catch(() => undefined)
  })
</script>

<style scoped lang="scss">
  .primary-text {
    color: var(--art-gray-900);
    font-weight: 600;
  }

  .full-width {
    width: 100%;
  }
</style>
