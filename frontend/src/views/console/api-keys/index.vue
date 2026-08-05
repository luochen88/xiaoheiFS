<template>
  <div class="api-keys-page art-full-height">
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
            <ElButton type="primary" v-ripple @click="openCreateDialog">
              <ArtSvgIcon icon="ri:key-2-line" class="button-icon" />
              创建密钥
            </ElButton>
            <ElButton v-ripple @click="snippetVisible = true">
              <ArtSvgIcon icon="ri:code-s-slash-line" class="button-icon" />
              签名示例
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :row-key="getKeyRowKey"
        :loading="loading"
        :data="data"
        :columns="columns"
        :show-table-header="true"
        empty-text="暂无 API 密钥"
      >
        <template #name="{ row }">
          <div class="name-cell">
            <span class="name-text">{{ getKeyName(row) }}</span>
            <span class="name-subtitle">{{ getKeyAkid(row) || '-' }}</span>
          </div>
        </template>

        <template #akid="{ row }">
          <div class="copy-cell">
            <code>{{ getKeyAkid(row) || '-' }}</code>
            <ElTooltip content="复制 AKID" placement="top">
              <ArtIconButton icon="ri:file-copy-line" @click="copyText(getKeyAkid(row), 'AKID')" />
            </ElTooltip>
          </div>
        </template>

        <template #status="{ row }">
          <ElTag :type="isKeyActive(row) ? 'success' : 'info'" effect="light">
            {{ isKeyActive(row) ? '已启用' : '已停用' }}
          </ElTag>
        </template>

        <template #lastUsedAt="{ row }">
          <span class="muted-text">{{ formatTime(getLastUsedAt(row)) }}</span>
        </template>

        <template #operation="{ row }">
          <div class="operation-cell">
            <ElTooltip :content="isKeyActive(row) ? '停用密钥' : '启用密钥'" placement="top">
              <ArtButtonTable
                type="edit"
                :icon="isKeyActive(row) ? 'ri:stop-circle-line' : 'ri:play-circle-line'"
                @click="toggleStatus(row)"
              />
            </ElTooltip>
            <ElTooltip content="删除密钥" placement="top">
              <ArtButtonTable type="delete" @click="removeKey(row)" />
            </ElTooltip>
          </div>
        </template>
      </ArtTable>
    </ElCard>

    <ElDialog
      v-model="createDialogVisible"
      title="创建 API 密钥"
      width="min(480px, 92vw)"
      align-center
      destroy-on-close
      @closed="resetCreateForm"
    >
      <ElAlert
        title="Key 只会在创建成功后展示一次，请立即妥善保存。"
        type="warning"
        show-icon
        :closable="false"
        class="dialog-alert"
      />
      <ElForm ref="createFormRef" :model="createForm" :rules="createRules" label-position="top">
        <ElFormItem label="密钥名称" prop="name">
          <ElInput
            v-model.trim="createForm.name"
            placeholder="例如：生产环境-订单服务"
            :maxlength="64"
            show-word-limit
            @keyup.enter="createKey"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="createDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="creating" @click="createKey">创建密钥</ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="secretDialogVisible"
      title="请保存新密钥"
      width="min(560px, 92vw)"
      align-center
      :close-on-click-modal="false"
      destroy-on-close
      @closed="clearCreatedSecret"
    >
      <ElAlert
        title="窗口关闭后将无法再次查看 Key"
        description="请立即复制并保存到安全位置。AKID 可以稍后在列表中查看。"
        type="warning"
        show-icon
        :closable="false"
        class="dialog-alert"
      />
      <div class="secret-fields">
        <div class="secret-field">
          <span class="field-label">AKID</span>
          <div class="field-row">
            <ElInput :model-value="createdSecret.akid" readonly />
            <ElButton @click="copyText(createdSecret.akid, 'AKID')">
              <ArtSvgIcon icon="ri:file-copy-line" />
            </ElButton>
          </div>
        </div>
        <div class="secret-field secret-field-key">
          <span class="field-label">Key</span>
          <div class="field-row">
            <ElInput :model-value="createdSecret.key" readonly />
            <ElButton type="primary" @click="copyText(createdSecret.key, 'Key')">
              <ArtSvgIcon icon="ri:file-copy-line" />
            </ElButton>
          </div>
        </div>
      </div>
      <template #footer>
        <ElButton @click="secretDialogVisible = false">我已保存，关闭</ElButton>
        <ElButton type="primary" @click="copyText(createdSecret.key, 'Key')">复制 Key</ElButton>
      </template>
    </ElDialog>

    <ElDrawer v-model="snippetVisible" title="签名鉴权示例" size="min(680px, 92vw)">
      <ElAlert title="请求头" type="info" :closable="false" class="snippet-alert">
        <div class="header-list">
          <code>X-AKID</code>
          <code>X-Timestamp</code>
          <code>X-Nonce</code>
          <code>X-Signature</code>
          <ElTag type="success" size="small">时间窗 ±300 秒</ElTag>
        </div>
      </ElAlert>
      <pre class="code-block">{{ signSnippet }}</pre>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import {
    createUserApiKey,
    deleteUserApiKey,
    listUserApiKeys,
    updateUserApiKeyStatus
  } from '@/services/user'
  import type { UserAPIKey } from '@/services/types'

  defineOptions({ name: 'ConsoleApiKeys' })

  interface ApiKeyRecord extends UserAPIKey {
    ID?: number
    Name?: string
    AKID?: string
    Status?: string
    LastUsedAt?: string
    CreatedAt?: string
  }

  interface ApiKeySearchParams {
    current: number
    size: number
    name?: string
    status?: string
  }

  interface ApiKeyListPayload {
    items?: ApiKeyRecord[]
    Items?: ApiKeyRecord[]
  }

  const createFormRef = ref<FormInstance>()
  const createDialogVisible = ref(false)
  const secretDialogVisible = ref(false)
  const snippetVisible = ref(false)
  const creating = ref(false)

  const searchForm = ref<Record<string, unknown>>({ name: '', status: 'all' })
  const searchItems = computed(() => [
    {
      key: 'name',
      label: '密钥名称',
      type: 'input',
      props: { placeholder: '搜索名称或 AKID', clearable: true }
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      props: {
        clearable: false,
        options: [
          { label: '全部', value: 'all' },
          { label: '已启用', value: 'active' },
          { label: '已停用', value: 'disabled' }
        ]
      }
    }
  ])

  const createForm = reactive({ name: '' })
  const createdSecret = reactive({ akid: '', key: '' })
  const createRules: FormRules<typeof createForm> = {
    name: [
      { required: true, message: '请输入密钥名称', trigger: 'blur' },
      { max: 64, message: '密钥名称不能超过 64 个字符', trigger: 'blur' }
    ]
  }

  const getKeyId = (record: ApiKeyRecord): number | string => record.id ?? record.ID ?? '-'
  const getKeyRowKey = (record: Record<string, unknown>): string =>
    String(record.id ?? record.ID ?? '')
  const getKeyName = (record: ApiKeyRecord): string => record.name ?? record.Name ?? '-'
  const getKeyAkid = (record: ApiKeyRecord): string => record.akid ?? record.AKID ?? ''
  const getKeyStatus = (record: ApiKeyRecord): string => record.status ?? record.Status ?? ''
  const getLastUsedAt = (record: ApiKeyRecord): string =>
    record.last_used_at ?? record.LastUsedAt ?? ''
  const isKeyActive = (record: ApiKeyRecord): boolean => getKeyStatus(record) === 'active'

  const fetchApiKeys = async (params: ApiKeySearchParams) => {
    const response = await listUserApiKeys({ limit: 100, offset: 0 })
    const payload = response.data as ApiKeyListPayload | undefined
    const records = payload?.items ?? payload?.Items ?? []
    const keyword = String(params.name ?? '')
      .trim()
      .toLocaleLowerCase()
    const status = String(params.status ?? 'all')

    const filtered = records.filter((record) => {
      const keywordMatched =
        !keyword ||
        getKeyName(record).toLocaleLowerCase().includes(keyword) ||
        getKeyAkid(record).toLocaleLowerCase().includes(keyword)
      const statusMatched = status === 'all' || getKeyStatus(record) === status
      return keywordMatched && statusMatched
    })

    return { records: filtered, current: 1, size: filtered.length || 1, total: filtered.length }
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    getData,
    searchParams,
    resetSearchParams,
    refreshData,
    refreshCreate,
    refreshUpdate,
    refreshRemove
  } = useTable({
    core: {
      apiFn: fetchApiKeys,
      apiParams: { current: 1, size: 100, name: '', status: 'all' },
      columnsFactory: () => [
        { type: 'index', label: '序号', width: 72 },
        { prop: 'name', label: '名称', minWidth: 190, useSlot: true },
        { prop: 'akid', label: 'AKID', minWidth: 260, useSlot: true },
        { prop: 'status', label: '状态', width: 110, useSlot: true },
        { prop: 'lastUsedAt', label: '最近使用', width: 180, useSlot: true },
        { prop: 'operation', label: '操作', width: 110, fixed: 'right', useSlot: true }
      ]
    }
  })

  const signSnippet = `import crypto from "crypto";

const method = "POST";
const path = "/api/v1/open/orders/instant/create";
const query = "";
const ts = new Date().toISOString();
const nonce = crypto.randomUUID().replace(/-/g, "");
const body = JSON.stringify({
  items: [{ package_id: 1, system_id: 1, qty: 1 }]
});

const bodyHash = crypto.createHash("sha256").update(body).digest("hex");
const canonical = [method.toUpperCase(), path, query, ts, nonce, bodyHash].join("\\n");
const signature = crypto.createHmac("sha256", process.env.OPEN_KEY)
  .update(canonical)
  .digest("hex");`

  const formatTime = (value: string): string => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSearch = (params: Record<string, unknown>): void => {
    Object.assign(searchParams, {
      name: params.name ?? '',
      status: params.status ?? 'all'
    })
    void getData()
  }

  const handleReset = (): void => {
    searchForm.value = { name: '', status: 'all' }
    void resetSearchParams()
  }

  const openCreateDialog = (): void => {
    createDialogVisible.value = true
  }

  const resetCreateForm = (): void => {
    createForm.name = ''
    createFormRef.value?.resetFields()
  }

  const createKey = async (): Promise<void> => {
    if (!createFormRef.value) return
    const valid = await createFormRef.value.validate().catch(() => false)
    if (!valid) return

    creating.value = true
    try {
      const response = await createUserApiKey({ name: createForm.name.trim(), scopes: [] })
      const payload = response.data as
        | {
            item?: ApiKeyRecord
            Item?: ApiKeyRecord
            key?: string
            Key?: string
            secret?: string
            Secret?: string
          }
        | undefined
      const item = payload?.item ?? payload?.Item
      createdSecret.akid = item ? getKeyAkid(item) : ''
      createdSecret.key = payload?.key ?? payload?.Key ?? payload?.secret ?? payload?.Secret ?? ''
      createDialogVisible.value = false
      secretDialogVisible.value = true
      ElMessage.success('API 密钥创建成功')
      await refreshCreate()
    } finally {
      creating.value = false
    }
  }

  const clearCreatedSecret = (): void => {
    createdSecret.akid = ''
    createdSecret.key = ''
  }

  const toggleStatus = async (record: ApiKeyRecord): Promise<void> => {
    const id = getKeyId(record)
    if (id === '-') return
    const nextStatus = isKeyActive(record) ? 'disabled' : 'active'
    await updateUserApiKeyStatus(id, { status: nextStatus })
    ElMessage.success(nextStatus === 'active' ? '密钥已启用' : '密钥已停用')
    await refreshUpdate()
  }

  const removeKey = async (record: ApiKeyRecord): Promise<void> => {
    const id = getKeyId(record)
    if (id === '-') return
    const confirmed = await ElMessageBox.confirm(
      '删除后无法恢复，确认删除该密钥吗？',
      '删除 API 密钥',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).catch(() => false)
    if (!confirmed) return
    await deleteUserApiKey(id)
    ElMessage.success('密钥已删除')
    await refreshRemove()
  }

  const copyText = async (text: string, label: string): Promise<void> => {
    if (!text) {
      ElMessage.warning(`暂无可复制的 ${label}`)
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      ElMessage.success(`${label} 已复制`)
    } catch {
      ElMessage.error('复制失败，请手动选择文本复制')
    }
  }
</script>

<style lang="scss" scoped>
  .button-icon {
    margin-right: 6px;
  }

  .name-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .name-text {
    overflow: hidden;
    font-weight: 600;
    color: var(--art-gray-900);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .name-subtitle,
  .muted-text {
    font-size: 12px;
    color: var(--art-gray-600);
  }

  .name-subtitle {
    overflow: hidden;
    font-family: monospace;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .copy-cell {
    display: flex;
    gap: 6px;
    align-items: center;
    min-width: 0;

    code {
      overflow: hidden;
      color: var(--theme-color);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .operation-cell {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .dialog-alert,
  .snippet-alert {
    margin-bottom: 18px;
  }

  .secret-fields {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .secret-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .secret-field-key {
    padding-left: 12px;
    border-left: 3px solid var(--el-color-warning);
  }

  .field-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--art-gray-700);
  }

  .field-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
  }

  .header-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    code {
      padding: 3px 7px;
      color: var(--theme-color);
      background: var(--art-active-color);
      border: 1px solid var(--default-border);
      border-radius: calc(var(--custom-radius) / 3 + 2px);
    }
  }

  .code-block {
    max-width: 100%;
    padding: 18px;
    overflow: auto;
    font-family: monospace;
    font-size: 13px;
    line-height: 1.65;
    color: var(--art-gray-800);
    white-space: pre;
    background: var(--default-bg-color);
    border: 1px solid var(--default-border);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  @media (width <= 640px) {
    .field-row {
      grid-template-columns: 1fr;
    }
  }
</style>
