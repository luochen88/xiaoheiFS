<template>
  <div class="sms-settings-page pb-5">
    <ElCard v-loading="configLoading" class="art-card-xs config-card">
      <template #header>
        <div class="page-header">
          <div>
            <h2 class="page-title">短信设置</h2>
            <p class="page-subtitle">短信插件选择、默认模板、预览与测试发送</p>
          </div>
          <ElSpace wrap>
            <ElButton :disabled="configLoading || configSaving" @click="loadConfig">
              <ArtSvgIcon icon="ri:refresh-line" />
              刷新配置
            </ElButton>
            <ElButton v-if="canUpdate" type="primary" :loading="configSaving" @click="saveConfig">
              <ArtSvgIcon icon="ri:save-line" />
              保存配置
            </ElButton>
          </ElSpace>
        </div>
      </template>

      <ArtForm
        v-model="configForm"
        :items="configItems"
        :disabled="configLoading || configSaving || !canUpdate"
        :show-reset="false"
        :show-submit="false"
        :span="8"
        :gutter="20"
        label-position="top"
      >
        <template #quick_test>
          <div class="inline-action">
            <ElInput v-model="quickTestPhone" placeholder="13800138000，支持逗号分隔" />
            <ElButton type="primary" :disabled="!canUpdate" @click="quickTest">
              <ArtSvgIcon icon="ri:send-plane-line" />
              发送测试
            </ElButton>
          </div>
        </template>
      </ArtForm>
    </ElCard>

    <ArtSearchBar
      v-show="showSearchBar"
      v-model="searchForm"
      :items="searchItems"
      :show-expand="false"
      @search="handleSearch"
      @reset="resetSearchParams"
    />

    <ElCard class="templates-card">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:show-search-bar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      >
        <template #left>
          <ElButton v-if="canUpdate" type="primary" @click="openTemplate()">
            <ArtSvgIcon icon="ri:add-line" />
            新增模板
          </ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        row-key="id"
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <template #enabled="{ row }">
          <ElTag :type="row.enabled ? 'success' : 'info'">
            {{ row.enabled ? '启用' : '停用' }}
          </ElTag>
        </template>
        <template #operation="{ row }">
          <ElSpace>
            <ElButton link type="primary" @click="openTemplate(row)">编辑</ElButton>
            <ElButton v-if="canUpdate" link type="danger" @click="removeTemplate(row)">
              删除
            </ElButton>
          </ElSpace>
        </template>
      </ArtTable>
    </ElCard>

    <ElDialog v-model="templateVisible" title="短信模板" width="min(860px, 92vw)" destroy-on-close>
      <ArtForm
        ref="templateFormRef"
        v-model="templateForm"
        :items="templateItems"
        :rules="templateRules"
        :show-reset="false"
        :show-submit="false"
        :span="12"
        label-position="top"
      >
        <template #preview_test>
          <div class="test-stack">
            <div class="inline-action">
              <ElInput v-model="previewPhone" placeholder="预览手机号" />
              <ElInput v-model="previewCode" placeholder="预览验证码" />
              <ElButton @click="previewTemplate">生成预览</ElButton>
            </div>
            <pre v-if="previewContent" class="preview-block">{{ previewContent }}</pre>
          </div>
        </template>
        <template #send_test>
          <div class="inline-action">
            <ElInput v-model="templateTestPhone" placeholder="测试手机号，支持逗号分隔" />
            <ElButton type="primary" @click="testTemplate">发送测试</ElButton>
          </div>
        </template>
      </ArtForm>

      <template #footer>
        <ElButton @click="templateVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="templateSaving" @click="saveTemplate">保存模板</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type { FormRules } from 'element-plus'
  import {
    deleteSmsTemplate,
    getSmsConfig,
    listAdminPlugins,
    listSmsTemplates,
    previewSmsConfig,
    testSmsConfig,
    updateSmsConfig,
    updateSmsTemplate,
    upsertSmsTemplate
  } from '@/services/admin'
  import type { PluginListItem, SMSTemplate } from '@/services/types'
  import { useTable } from '@/hooks/core/useTable'
  import { useAdminPermissions } from '../_shared/settings'

  defineOptions({ name: 'AdminSettingsSms' })

  interface SearchForm {
    keyword?: string
    enabled?: boolean
  }

  interface TableParams extends SearchForm {
    current: number
    size: number
  }

  interface SmsTemplateRow {
    id: number | null
    name: string
    content: string
    enabled: boolean
  }

  interface TemplateForm extends Record<string, unknown> {
    id: number | null
    name: string
    content: string
    enabled: boolean
  }

  interface ArtFormExpose {
    validate: () => Promise<boolean> | undefined
  }

  const configForm = reactive({
    enabled: true,
    binding: '',
    plugin_id: '',
    instance_id: 'default',
    default_template_id: '',
    provider_template_id: ''
  })
  const plugins = ref<PluginListItem[]>([])
  const templateOptions = ref<SmsTemplateRow[]>([])
  const configLoading = ref(false)
  const configSaving = ref(false)
  const quickTestPhone = ref('')
  const showSearchBar = ref(true)
  const searchForm = ref<SearchForm>({ keyword: '', enabled: undefined })
  const templateVisible = ref(false)
  const templateSaving = ref(false)
  const templateFormRef = ref<ArtFormExpose>()
  const templateForm = reactive<TemplateForm>(createTemplateForm())
  const previewPhone = ref('13800138000')
  const previewCode = ref('123456')
  const previewContent = ref('')
  const templateTestPhone = ref('')
  const { hasPermission } = useAdminPermissions()
  const canUpdate = hasPermission('settings.update', 'sms.update', 'sms_template.update')

  const smsPluginOptions = computed(() =>
    plugins.value
      .filter((plugin) => plugin.category === 'sms' && plugin.enabled && plugin.loaded)
      .map((plugin) => {
        const pluginId = String(plugin.plugin_id ?? '')
        const instanceId = String(plugin.instance_id ?? 'default')
        return {
          label: `${String(plugin.name ?? pluginId)} (${pluginId}/${instanceId})`,
          value: `${pluginId}::${instanceId}`
        }
      })
  )

  const configItems = computed(() => [
    { key: 'enabled', label: '启用短信模块', type: 'switch' },
    {
      key: 'binding',
      label: '短信插件实例',
      type: 'select',
      props: {
        clearable: true,
        placeholder: '请选择短信插件实例',
        options: smsPluginOptions.value,
        onChange: bindingChanged
      }
    },
    {
      key: 'provider_template_id',
      label: '供应商模板 ID（可选）',
      type: 'input',
      props: { placeholder: '如阿里云 TemplateCode' }
    },
    {
      key: 'default_template_id',
      label: '默认内容模板',
      type: 'select',
      props: {
        clearable: true,
        options: templateOptions.value
          .filter((template) => template.id !== null)
          .map((template) => ({ label: template.name, value: String(template.id) }))
      }
    },
    { key: 'quick_test', label: '快速测试手机号', span: 16 }
  ])
  const searchItems = computed(() => [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      props: { clearable: true, placeholder: '名称或内容' }
    },
    {
      key: 'enabled',
      label: '状态',
      type: 'select',
      props: {
        clearable: true,
        options: [
          { label: '启用', value: true },
          { label: '停用', value: false }
        ]
      }
    }
  ])
  const templateItems = computed(() => [
    { key: 'name', label: '名称', type: 'input', span: 16, props: { maxlength: 120 } },
    { key: 'enabled', label: '启用', type: 'switch', span: 8 },
    {
      key: 'content',
      label: '内容模板',
      type: 'input',
      span: 24,
      props: {
        type: 'textarea',
        rows: 6,
        placeholder: '例如：您的验证码是 {{code}}，请勿泄露。'
      }
    },
    { key: 'preview_test', label: '模板预览', span: 24 },
    { key: 'send_test', label: '测试发送', span: 24 }
  ])
  const templateRules: FormRules<TemplateForm> = {
    name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
    content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }]
  }

  const fetchTemplates = async (params: TableParams) => {
    const response = await listSmsTemplates()
    const keyword = String(params.keyword ?? '')
      .trim()
      .toLowerCase()
    let rows = (response.data?.items ?? []).map(normalizeTemplate)
    templateOptions.value = rows
    if (keyword) {
      rows = rows.filter((row) => `${row.name} ${row.content}`.toLowerCase().includes(keyword))
    }
    if (typeof params.enabled === 'boolean')
      rows = rows.filter((row) => row.enabled === params.enabled)
    const start = (params.current - 1) * params.size
    return { records: rows.slice(start, start + params.size), total: rows.length }
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
    handleSizeChange,
    handleCurrentChange,
    refreshData,
    refreshCreate,
    refreshUpdate,
    refreshRemove
  } = useTable({
    core: {
      apiFn: fetchTemplates,
      apiParams: { current: 1, size: 20, ...searchForm.value },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        { prop: 'name', label: '名称', minWidth: 180, showOverflowTooltip: true },
        { prop: 'content', label: '内容', minWidth: 360, showOverflowTooltip: true },
        { prop: 'enabled', label: '状态', width: 100, useSlot: true },
        { prop: 'operation', label: '操作', width: 140, fixed: 'right', useSlot: true }
      ]
    }
  })

  onMounted(loadConfig)

  function createTemplateForm(): TemplateForm {
    return { id: null, name: '', content: '', enabled: true }
  }

  function normalizeTemplate(record: SMSTemplate & Record<string, unknown>): SmsTemplateRow {
    const id = record.id ?? record.ID
    return {
      id: id == null ? null : Number(id),
      name: String(record.name ?? record.Name ?? ''),
      content: String(record.content ?? record.Content ?? ''),
      enabled: Boolean(record.enabled ?? record.Enabled ?? true)
    }
  }

  function bindingChanged(value?: string): void {
    const [pluginId = '', instanceId = 'default'] = String(value ?? '').split('::')
    configForm.plugin_id = pluginId
    configForm.instance_id = pluginId ? instanceId : ''
  }

  function handleSearch(params: SearchForm): void {
    Object.assign(searchParams, params)
    getData()
  }

  async function loadConfig(): Promise<void> {
    configLoading.value = true
    try {
      const [configResponse, pluginResponse] = await Promise.all([
        getSmsConfig(),
        listAdminPlugins()
      ])
      const config = configResponse.data
      configForm.enabled = config?.enabled !== false
      configForm.plugin_id = String(config?.plugin_id ?? '')
      configForm.instance_id = String(config?.instance_id ?? 'default')
      configForm.binding = configForm.plugin_id
        ? `${configForm.plugin_id}::${configForm.instance_id}`
        : ''
      configForm.default_template_id = String(config?.default_template_id ?? '')
      configForm.provider_template_id = String(config?.provider_template_id ?? '')
      plugins.value = pluginResponse.data?.items ?? []
    } finally {
      configLoading.value = false
    }
  }

  async function saveConfig(): Promise<void> {
    configSaving.value = true
    try {
      await updateSmsConfig({
        enabled: configForm.enabled,
        plugin_id: configForm.plugin_id,
        instance_id: configForm.instance_id || 'default',
        default_template_id: configForm.default_template_id,
        provider_template_id: configForm.provider_template_id
      })
      ElMessage.success('短信配置已保存')
    } finally {
      configSaving.value = false
    }
  }

  function openTemplate(row?: SmsTemplateRow): void {
    Object.assign(templateForm, row ?? createTemplateForm())
    previewContent.value = ''
    templateTestPhone.value = ''
    templateVisible.value = true
  }

  async function saveTemplate(): Promise<void> {
    const valid = await templateFormRef.value?.validate()?.catch(() => false)
    if (!valid) return
    templateSaving.value = true
    try {
      const payload = {
        name: templateForm.name.trim(),
        content: templateForm.content,
        enabled: templateForm.enabled
      }
      if (templateForm.id !== null) await updateSmsTemplate(templateForm.id, payload)
      else await upsertSmsTemplate(payload)
      templateVisible.value = false
      ElMessage.success('短信模板已保存')
      if (templateForm.id !== null) await refreshUpdate()
      else await refreshCreate()
    } finally {
      templateSaving.value = false
    }
  }

  async function removeTemplate(row: SmsTemplateRow): Promise<void> {
    if (row.id === null) return
    await ElMessageBox.confirm('确认删除该短信模板吗？', '删除模板', { type: 'warning' })
    await deleteSmsTemplate(row.id)
    ElMessage.success('短信模板已删除')
    await refreshRemove()
  }

  async function previewTemplate(): Promise<void> {
    if (!templateForm.content.trim()) {
      ElMessage.error('请输入模板内容')
      return
    }
    const response = await previewSmsConfig({
      content: templateForm.content,
      variables: { code: previewCode.value, phone: previewPhone.value }
    })
    previewContent.value = String(response.data?.content ?? '')
  }

  async function testTemplate(): Promise<void> {
    const phone = templateTestPhone.value.trim()
    if (!phone) {
      ElMessage.error('请输入测试手机号')
      return
    }
    const payload: Record<string, unknown> = {
      phone,
      plugin_id: configForm.plugin_id,
      instance_id: configForm.instance_id || 'default',
      provider_template_id: configForm.provider_template_id,
      variables: {
        code: previewCode.value || '123456',
        phone: previewPhone.value || phone.split(',')[0]
      }
    }
    if (templateForm.id !== null) payload.template_id = templateForm.id
    else payload.content = templateForm.content
    await testSmsConfig(payload)
    ElMessage.success('测试短信已发送')
  }

  async function quickTest(): Promise<void> {
    const phone = quickTestPhone.value.trim()
    if (!phone) {
      ElMessage.error('请输入测试手机号')
      return
    }
    const selectedId = Number(configForm.default_template_id) || 0
    const fallbackId = Number(templateOptions.value.find((item) => item.enabled)?.id) || 0
    const templateId = selectedId || fallbackId
    if (!templateId) {
      ElMessage.error('请先选择默认模板或新增并启用一个模板')
      return
    }
    await testSmsConfig({
      phone,
      template_id: templateId,
      plugin_id: configForm.plugin_id,
      instance_id: configForm.instance_id || 'default',
      provider_template_id: configForm.provider_template_id
    })
    ElMessage.success('测试短信已发送')
  }
</script>

<style lang="scss" scoped>
  .config-card {
    margin-bottom: 16px;
  }

  .page-header,
  .inline-action {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .page-header {
    justify-content: space-between;
  }

  .page-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .page-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--art-gray-600);
  }

  .templates-card {
    min-height: 480px;
    margin-top: 12px;
  }

  .inline-action :is(.el-input) {
    flex: 1;
  }

  .test-stack {
    width: 100%;
  }

  .preview-block {
    padding: 12px;
    margin: 12px 0 0;
    color: var(--art-gray-800);
    white-space: pre-wrap;
    background: var(--default-bg-color);
    border: 1px solid var(--default-border);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  @media (width <= 640px) {
    .page-header,
    .inline-action {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
