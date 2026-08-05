<template>
  <div>
    <ConsolePageHeader title="API Key 管理" description="为开放接口创建、禁用或删除访问密钥。">
      <template #actions>
        <ElButton type="primary" :icon="Plus" @click="createOpen = true">创建 API Key</ElButton>
        <ElButton :icon="Refresh" :loading="loading" @click="fetchKeys">刷新</ElButton>
      </template>
    </ConsolePageHeader>

    <div class="console-card table-card">
      <ElTable :data="items" row-key="id" :loading="loading" empty-text="暂无 API Key">
        <ElTableColumn label="名称" min-width="180">
          <template #default="{ row }">
            <div class="primary-text">{{ row.name || '-' }}</div>
            <div class="muted mono">{{ row.akid || '-' }}</div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="120">
          <template #default="{ row }">
            <ElTag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="scopes_json" label="权限范围" min-width="220" show-overflow-tooltip />
        <ElTableColumn label="最后使用" min-width="170">
          <template #default="{ row }">{{ formatDateTime(row.last_used_at) }}</template>
        </ElTableColumn>
        <ElTableColumn label="创建时间" min-width="170">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="210" fixed="right" align="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="toggleStatus(row)">
              {{ normalizeStatus(row.status) === 'active' ? '禁用' : '启用' }}
            </ElButton>
            <ElPopconfirm title="确认删除该 API Key？" @confirm="removeKey(row)">
              <template #reference>
                <ElButton link type="danger">删除</ElButton>
              </template>
            </ElPopconfirm>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <ElDialog v-model="createOpen" title="创建 API Key" width="min(460px, calc(100vw - 32px))">
      <ElForm label-position="top">
        <ElFormItem label="名称">
          <ElInput v-model.trim="form.name" maxlength="64" placeholder="例如：自动化脚本" />
        </ElFormItem>
        <ElFormItem label="权限范围">
          <ElSelect
            v-model="form.scopes"
            multiple
            filterable
            allow-create
            default-first-option
            class="full-width"
          >
            <ElOption label="read" value="read" />
            <ElOption label="write" value="write" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="createOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="createKey">创建</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="secretOpen" title="密钥已创建" width="min(560px, calc(100vw - 32px))">
      <ElAlert title="Secret 仅展示一次，请妥善保存。" type="warning" show-icon :closable="false" />
      <div class="secret-box">
        <div
          ><span>Key</span
          ><ElText class="mono" copyable>{{ createdSecret.key || '-' }}</ElText></div
        >
        <div
          ><span>Secret</span
          ><ElText class="mono" copyable>{{ createdSecret.secret || '-' }}</ElText></div
        >
      </div>
      <template #footer>
        <ElButton type="primary" @click="secretOpen = false">我已保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { Plus, Refresh } from '@element-plus/icons-vue'
  import {
    createUserApiKey,
    deleteUserApiKey,
    listUserApiKeys,
    updateUserApiKeyStatus,
    type UserApiKey
  } from '@/api/console-user'
  import { formatDateTime, normalizeStatus, statusTagType } from '@/utils/console-user'
  import ConsolePageHeader from '../shared/PageHeader.vue'
  import '../shared/styles.scss'

  defineOptions({ name: 'ConsoleUserApiKeys' })

  const loading = ref(false)
  const submitting = ref(false)
  const createOpen = ref(false)
  const secretOpen = ref(false)
  const items = ref<UserApiKey[]>([])
  const form = reactive({ name: '', scopes: ['read'] })
  const createdSecret = reactive({ key: '', secret: '' })

  function statusLabel(status?: string) {
    const value = normalizeStatus(status)
    if (value === 'active') return '启用'
    if (value === 'disabled') return '禁用'
    return value || '-'
  }

  async function fetchKeys() {
    loading.value = true
    try {
      const response = await listUserApiKeys({ limit: 100, offset: 0 })
      items.value = response.items || []
    } finally {
      loading.value = false
    }
  }

  async function createKey() {
    if (!form.name.trim()) {
      ElMessage.warning('请输入名称')
      return
    }
    submitting.value = true
    try {
      const response = await createUserApiKey({ name: form.name.trim(), scopes: form.scopes })
      createdSecret.key = response.key || response.item?.akid || ''
      createdSecret.secret = response.secret || ''
      ElMessage.success('API Key 已创建')
      createOpen.value = false
      secretOpen.value = true
      form.name = ''
      form.scopes = ['read']
      await fetchKeys()
    } finally {
      submitting.value = false
    }
  }

  async function toggleStatus(row: UserApiKey) {
    const next = normalizeStatus(row.status) === 'active' ? 'disabled' : 'active'
    await updateUserApiKeyStatus(row.id as number, { status: next })
    ElMessage.success('状态已更新')
    await fetchKeys()
  }

  async function removeKey(row: UserApiKey) {
    await deleteUserApiKey(row.id as number)
    ElMessage.success('API Key 已删除')
    await fetchKeys()
  }

  onMounted(fetchKeys)
</script>

<style scoped lang="scss">
  .primary-text {
    color: var(--art-gray-900);
    font-weight: 600;
  }

  .full-width {
    width: 100%;
  }

  .secret-box {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-top: 16px;

    div {
      display: grid;
      grid-template-columns: 80px minmax(0, 1fr);
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      background: var(--el-fill-color-extra-light);
    }
  }
</style>
