<template>
  <div>
    <ConsolePageHeader title="工单详情" :description="ticket?.subject || `工单 ${route.params.id}`">
      <template #actions>
        <ElButton @click="router.push('/console/tickets')">返回列表</ElButton>
        <ElButton :icon="Refresh" :loading="loading" @click="fetchDetail">刷新</ElButton>
        <ElButton v-if="ticket?.status !== 'closed'" type="danger" plain @click="closeCurrent"
          >关闭工单</ElButton
        >
      </template>
    </ConsolePageHeader>

    <ElRow :gutter="16">
      <ElCol :xs="24" :lg="16">
        <div class="console-card messages-card">
          <div class="table-toolbar">
            <div>
              <div class="toolbar-title">{{ ticket?.subject || '-' }}</div>
              <div class="muted">创建时间：{{ formatDateTime(ticket?.created_at) }}</div>
            </div>
            <ConsoleStatusTag :status="ticket?.status" kind="ticket" />
          </div>

          <div class="messages">
            <div
              v-for="item in messages"
              :key="item.id"
              class="message-item"
              :class="{ mine: item.sender_role === 'user' }"
            >
              <ElAvatar :src="item.sender_avatar" :size="36">
                {{ (item.sender_name || item.sender_role || '?').slice(0, 1) }}
              </ElAvatar>
              <div class="message-body">
                <div class="message-meta">
                  <span>{{ item.sender_name || roleLabel(item.sender_role) }}</span>
                  <small>{{ formatDateTime(item.created_at) }}</small>
                </div>
                <div class="message-content">{{ item.content }}</div>
              </div>
            </div>
            <ElEmpty v-if="!messages.length" description="暂无消息" />
          </div>

          <div v-if="ticket?.status !== 'closed'" class="reply-box">
            <ElInput
              v-model="replyContent"
              type="textarea"
              :rows="4"
              :maxlength="INPUT_LIMITS.TICKET_CONTENT"
              show-word-limit
              placeholder="输入回复内容"
            />
            <div class="reply-actions">
              <ElButton type="primary" :loading="submitting" @click="reply">发送回复</ElButton>
            </div>
          </div>
        </div>
      </ElCol>

      <ElCol :xs="24" :lg="8">
        <div class="console-card side-card">
          <div class="toolbar-title">关联资源</div>
          <div v-if="resources.length" class="resource-list">
            <div v-for="item in resources" :key="item.id || item.resource_id">
              <span>{{ item.resource_name || `${item.resource_type}-${item.resource_id}` }}</span>
              <ElButton
                v-if="item.resource_type === 'vps'"
                link
                type="primary"
                @click="router.push(`/console/vps/${item.resource_id}`)"
              >
                查看
              </ElButton>
            </div>
          </div>
          <ElEmpty v-else description="未关联资源" />
        </div>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import { Refresh } from '@element-plus/icons-vue'
  import {
    addTicketMessage,
    closeTicket,
    getTicketDetail,
    type TicketMessage,
    type TicketRecord,
    type TicketResource
  } from '@/api/console-user'
  import { formatDateTime } from '@/utils/console-user'
  import { INPUT_LIMITS } from '@/utils/constants'
  import ConsolePageHeader from '../shared/PageHeader.vue'
  import ConsoleStatusTag from '../shared/StatusTag.vue'
  import '../shared/styles.scss'

  defineOptions({ name: 'ConsoleUserTicketDetail' })

  const route = useRoute()
  const router = useRouter()
  const loading = ref(false)
  const submitting = ref(false)
  const ticket = ref<TicketRecord | null>(null)
  const messages = ref<TicketMessage[]>([])
  const resources = ref<TicketResource[]>([])
  const replyContent = ref('')

  function roleLabel(role?: string) {
    if (role === 'admin') return '客服'
    if (role === 'user') return '我'
    return role || '系统'
  }

  async function fetchDetail() {
    loading.value = true
    try {
      const response = await getTicketDetail(String(route.params.id))
      ticket.value = response.ticket || null
      messages.value = response.messages || []
      resources.value = response.resources || []
    } finally {
      loading.value = false
    }
  }

  async function reply() {
    if (!replyContent.value.trim()) {
      ElMessage.warning('请输入回复内容')
      return
    }
    submitting.value = true
    try {
      await addTicketMessage(String(route.params.id), { content: replyContent.value.trim() })
      ElMessage.success('回复已发送')
      replyContent.value = ''
      await fetchDetail()
    } finally {
      submitting.value = false
    }
  }

  async function closeCurrent() {
    await closeTicket(String(route.params.id))
    ElMessage.success('工单已关闭')
    await fetchDetail()
  }

  onMounted(fetchDetail)
</script>

<style scoped lang="scss">
  .messages-card,
  .side-card {
    padding: 18px;
  }

  .messages {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 12px 0 18px;
  }

  .message-item {
    display: flex;
    gap: 12px;

    &.mine {
      flex-direction: row-reverse;

      .message-body {
        align-items: flex-end;
      }

      .message-content {
        background: var(--el-color-primary-light-9);
      }
    }
  }

  .message-body {
    display: flex;
    max-width: 76%;
    flex-direction: column;
    gap: 6px;
  }

  .message-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--art-gray-600);
    font-size: 13px;

    small {
      color: var(--art-gray-400);
    }
  }

  .message-content {
    padding: 12px 14px;
    white-space: pre-wrap;
    border-radius: 8px;
    background: var(--el-fill-color-extra-light);
    color: var(--art-gray-800);
    line-height: 1.65;
  }

  .reply-box {
    padding-top: 16px;
    border-top: 1px solid var(--art-card-border);
  }

  .reply-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }

  .resource-list {
    display: flex;
    flex-direction: column;
    gap: 10px;

    div {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px;
      border-radius: 8px;
      background: var(--el-fill-color-extra-light);
    }
  }

  @media (max-width: 640px) {
    .message-body {
      max-width: 86%;
    }
  }
</style>
