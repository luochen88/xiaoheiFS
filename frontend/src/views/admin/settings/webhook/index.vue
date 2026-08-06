<template>
  <div class="webhook-page art-full-height">
    <ElCard class="art-table-card">
      <ElAlert
        class="webhook-help"
        type="info"
        :closable="false"
        show-icon
        title="事件说明"
        description="events 为空代表全事件。你可以留空或填写特定事件。"
      />
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="reload">
        <template #left>
          <ElSpace wrap>
            <ElButton v-if="canUpdate" type="primary" @click="addWebhook">
              <ArtSvgIcon icon="ri:add-line" />
              新增 Webhook
            </ElButton>
            <ElButton v-if="canUpdate" @click="sendTest">
              <ArtSvgIcon icon="ri:send-plane-line" />
              发送测试
            </ElButton>
            <ElButton v-if="canUpdate" :loading="saving" @click="save">
              <ArtSvgIcon icon="ri:save-line" />
              保存
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable row-key="key" :loading="loading" :data="data" :columns="columns">
        <template #name="{ row }">
          <ElInput v-model="row.name" :disabled="!canUpdate" placeholder="Webhook 名称" />
        </template>
        <template #url="{ row }">
          <ElInput v-model="row.url" :disabled="!canUpdate" placeholder="https://..." />
        </template>
        <template #secret="{ row }">
          <ElInput
            v-model="row.secret"
            :disabled="!canUpdate"
            type="password"
            show-password
            placeholder="签名密钥（可选）"
          />
        </template>
        <template #events="{ row }">
          <ElSelect
            v-model="row.events"
            :disabled="!canUpdate"
            multiple
            filterable
            allow-create
            default-first-option
            collapse-tags
            placeholder="空表示全事件"
          >
            <ElOption
              v-for="option in eventOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </template>
        <template #enabled="{ row }">
          <ElSwitch v-model="row.enabled" :disabled="!canUpdate" />
        </template>
        <template #operation="{ row }">
          <ElTooltip v-if="canUpdate" content="移除">
            <ElButton circle plain type="danger" aria-label="移除" @click="removeWebhook(row.key)">
              <ArtSvgIcon icon="ri:delete-bin-line" />
            </ElButton>
          </ElTooltip>
        </template>
      </ArtTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { getRobotConfig, testRobotWebhook, updateRobotConfig } from '@/services/admin'
  import type { RobotWebhook } from '@/services/types'
  import { useTable } from '@/hooks/core/useTable'
  import { useAdminPermissions } from '../_shared/settings'

  defineOptions({ name: 'AdminSettingsWebhook' })

  interface WebhookRow {
    key: string
    name: string
    url: string
    secret: string
    enabled: boolean
    events: string[]
  }

  const saving = ref(false)
  const rows = ref<WebhookRow[]>([])
  const loaded = ref(false)
  const { hasPermission } = useAdminPermissions()
  const canUpdate = hasPermission('robot.update')

  const eventOptions = [
    { label: '订单：待支付', value: 'order.pending_payment' },
    { label: '订单：待审核', value: 'order.pending_review' },
    { label: '订单：已通过', value: 'order.approved' },
    { label: '订单：已驳回', value: 'order.rejected' },
    { label: '订单：已取消', value: 'order.canceled' },
    { label: '订单：开通中', value: 'order.provisioning' },
    { label: '订单：已完成', value: 'order.completed' },
    { label: '订单项：开通成功', value: 'order.item.active' },
    { label: '订单项：开通失败', value: 'order.item.failed' },
    { label: '支付：创建', value: 'payment.created' },
    { label: '支付：已确认', value: 'payment.confirmed' },
    { label: '支付：已通过', value: 'payment.approved' },
    { label: '测试', value: 'webhook.test' }
  ]
  const fetchWebhookRows = async () => {
    if (!loaded.value) {
      const response = await getRobotConfig()
      rows.value = (response.data?.webhooks ?? []).map(normalizeRow)
      loaded.value = true
    }
    return { records: rows.value, total: rows.value.length }
  }

  const { columns, columnChecks, data, loading, getData, refreshData } = useTable({
    core: {
      apiFn: fetchWebhookRows,
      columnsFactory: () => [
        { prop: 'name', label: '名称', minWidth: 160, useSlot: true },
        { prop: 'url', label: 'Webhook URL', minWidth: 260, useSlot: true },
        { prop: 'secret', label: '签名密钥', minWidth: 180, useSlot: true },
        { prop: 'events', label: '事件', minWidth: 220, useSlot: true },
        { prop: 'enabled', label: '启用', width: 90, useSlot: true },
        { prop: 'operation', label: '操作', width: 90, fixed: 'right', useSlot: true }
      ]
    }
  })

  function createKey(): string {
    return crypto.randomUUID()
  }

  function normalizeRow(item: RobotWebhook): WebhookRow {
    return {
      key: createKey(),
      name: String(item.name ?? 'Webhook'),
      url: String(item.url ?? ''),
      secret: String(item.secret ?? ''),
      enabled: item.enabled !== false,
      events: Array.isArray(item.events) ? [...item.events] : []
    }
  }

  function addWebhook(): void {
    rows.value.push({
      key: createKey(),
      name: `Webhook ${rows.value.length + 1}`,
      url: '',
      secret: '',
      enabled: true,
      events: []
    })
    getData()
  }

  function removeWebhook(key: string): void {
    rows.value = rows.value.filter((row) => row.key !== key)
    getData()
  }

  async function reload(): Promise<void> {
    loaded.value = false
    await refreshData()
  }

  async function save(): Promise<void> {
    saving.value = true
    try {
      await updateRobotConfig({
        webhooks: rows.value.map((row) => ({
          name: row.name.trim() || 'Webhook',
          url: row.url.trim(),
          secret: row.secret,
          enabled: row.enabled,
          events: row.events.filter(Boolean)
        }))
      })
      ElMessage.success('Webhook 配置已保存')
    } finally {
      saving.value = false
    }
  }

  async function sendTest(): Promise<void> {
    await testRobotWebhook({
      event: 'webhook.test',
      data: { text: '测试 Webhook', sender: 'console', timestamp: Math.floor(Date.now() / 1000) }
    })
    ElMessage.success('测试请求已发送')
  }
</script>

<style lang="scss" scoped>
  .webhook-page {
    min-width: 0;
  }

  .webhook-help {
    margin: 12px 12px 0;
  }
</style>
