<template>
  <div class="email-settings-page pb-5">
    <ElCard v-loading="configLoading" class="art-card-xs config-card">
      <template #header>
        <div class="page-header">
          <div>
            <h2 class="page-title">邮件与模板</h2>
            <p class="page-subtitle">SMTP 配置、发送测试与邮件模板管理</p>
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
        :span="12"
        :gutter="20"
        label-position="top"
      >
        <template #smtp_test>
          <div class="inline-action">
            <ElInput v-model="smtpTestTo" placeholder="接收人邮箱" />
            <ElButton type="primary" :disabled="!canUpdate" @click="sendSmtpTest">
              <ArtSvgIcon icon="ri:send-plane-line" />
              测试发送
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

    <ElDialog v-model="templateVisible" title="邮件模板" width="min(1000px, 92vw)" destroy-on-close>
      <div class="dialog-toolbar">
        <ElSpace wrap>
          <ElSelect v-model="defaultTemplateKey" clearable placeholder="选择默认模板">
            <ElOption
              v-for="item in defaultTemplates"
              :key="item.key"
              :label="item.label"
              :value="item.key"
            />
          </ElSelect>
          <ElButton @click="applyDefaultTemplate">填充默认</ElButton>
        </ElSpace>
        <ElSpace>
          <ElButton @click="openPreview">
            <ArtSvgIcon icon="ri:eye-line" />
            预览
          </ElButton>
          <ElTooltip content="模板变量说明">
            <ElButton circle aria-label="模板变量说明" @click="showHelp">
              <ArtSvgIcon icon="ri:question-line" />
            </ElButton>
          </ElTooltip>
        </ElSpace>
      </div>

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
        <template #body>
          <EmailTemplateEditor v-model="templateForm.body" height="400px" />
        </template>
        <template #template_test>
          <div class="inline-action">
            <ElInput v-model="templateTestTo" placeholder="test@example.com" />
            <ElButton type="primary" @click="sendTemplateTest">发送测试</ElButton>
          </div>
        </template>
      </ArtForm>

      <template #footer>
        <ElButton @click="templateVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="templateSaving" @click="saveTemplate">保存模板</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="previewVisible" title="模板预览" width="min(760px, 92vw)">
      <ElDescriptions :column="1" border>
        <ElDescriptionsItem label="主题">{{ previewSubject }}</ElDescriptionsItem>
        <ElDescriptionsItem label="正文">
          <div v-if="previewIsHtml" class="preview-body" v-html="previewBody" />
          <pre v-else class="preview-text">{{ previewBody }}</pre>
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type { FormRules } from 'element-plus'
  import EmailTemplateEditor from '@/components/business/email-template-editor/index.vue'
  import {
    deleteEmailTemplate,
    getSmtpConfig,
    listEmailTemplates,
    testSmtpConfig,
    updateEmailTemplate,
    updateSmtpConfig,
    upsertEmailTemplate
  } from '@/services/admin'
  import { useTable } from '@/hooks/core/useTable'
  import {
    booleanSetting,
    fetchSettingMap,
    saveSettingItems,
    settingBoolean,
    settingInteger,
    settingString,
    stringSetting,
    useAdminPermissions
  } from '../_shared/settings'

  defineOptions({ name: 'AdminSettingsEmail' })

  interface SearchForm {
    keyword?: string
    enabled?: boolean
  }

  interface TableParams extends SearchForm {
    current: number
    size: number
  }

  interface EmailTemplateRow {
    id: number | null
    name: string
    subject: string
    body: string
    enabled: boolean
  }

  interface TemplateForm extends Record<string, unknown> {
    id: number | null
    name: string
    subject: string
    body: string
    enabled: boolean
  }

  interface ArtFormExpose {
    validate: () => Promise<boolean> | undefined
  }

  const configForm = reactive({
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_pass: '',
    smtp_from: '',
    smtp_enabled: false,
    email_enabled: false,
    email_expire_enabled: false,
    expire_reminder_days: 7
  })
  const configLoading = ref(false)
  const configSaving = ref(false)
  const smtpTestTo = ref('')
  const showSearchBar = ref(true)
  const searchForm = ref<SearchForm>({ keyword: '', enabled: undefined })
  const templateVisible = ref(false)
  const templateSaving = ref(false)
  const templateFormRef = ref<ArtFormExpose>()
  const templateForm = reactive<TemplateForm>(createTemplateForm())
  const defaultTemplateKey = ref<string>()
  const templateTestTo = ref('')
  const previewVisible = ref(false)
  const previewSubject = ref('')
  const previewBody = ref('')
  const previewIsHtml = ref(false)
  const { hasPermission } = useAdminPermissions()
  const canUpdate = hasPermission('settings.update', 'smtp.update', 'email_template.update')

  const mockData = {
    user: { id: 1001, username: 'demo_user', email: 'demo@example.com', qq: '123456' },
    order: { no: 'ORD-20240501-0001' },
    vps: { name: 'vps-001', expire_at: '2026-12-31' },
    message: 'This is a mock message.',
    now: ''
  }

  const defaultTemplates = [
    {
      key: 'provision_success',
      label: '开通成功 (provision_success)',
      subject: 'VPS Provisioned: Order {{.order.no}}',
      body: '<h2>Hi {{.user.username}}</h2><p>Your VPS for order <strong>{{.order.no}}</strong> is now active.</p>'
    },
    {
      key: 'expire_reminder',
      label: '到期提醒 (expire_reminder)',
      subject: 'VPS Expiration Reminder: {{.vps.name}}',
      body: '<h2>Hi {{.user.username}}</h2><p>Your VPS <strong>{{.vps.name}}</strong> will expire on {{.vps.expire_at}}.</p>'
    },
    {
      key: 'order_approved',
      label: '订单通过 (order_approved)',
      subject: 'Order Approved: {{.order.no}}',
      body: '<h2>Order Approved</h2><p>Hi {{.user.username}}, order {{.order.no}} has been approved.</p><p>{{.message}}</p>'
    },
    {
      key: 'order_rejected',
      label: '订单驳回 (order_rejected)',
      subject: 'Order Rejected: {{.order.no}}',
      body: '<h2>Order Rejected</h2><p>Hi {{.user.username}}, order {{.order.no}} has been rejected.</p><p>{{.message}}</p>'
    }
  ]

  const configItems = computed(() => [
    { key: 'smtp_host', label: 'SMTP Host', type: 'input' },
    { key: 'smtp_port', label: 'SMTP Port', type: 'input' },
    { key: 'smtp_user', label: 'SMTP User', type: 'input' },
    {
      key: 'smtp_pass',
      label: 'SMTP Password',
      type: 'input',
      props: { type: 'password', showPassword: true }
    },
    { key: 'smtp_from', label: 'SMTP From', type: 'input', span: 24 },
    { key: 'smtp_enabled', label: '启用 SMTP', type: 'switch' },
    { key: 'email_enabled', label: '启用邮件', type: 'switch' },
    { key: 'email_expire_enabled', label: '发送到期提醒邮件', type: 'switch' },
    {
      key: 'expire_reminder_days',
      label: '到期提醒天数',
      type: 'number',
      props: { min: 1, class: 'full-width' }
    },
    { key: 'smtp_test', label: 'SMTP 测试', span: 24 }
  ])
  const searchItems = computed(() => [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      props: { clearable: true, placeholder: '名称或主题' }
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
    { key: 'subject', label: '主题', type: 'input', span: 24, props: { maxlength: 300 } },
    { key: 'body', label: '内容', span: 24 },
    { key: 'template_test', label: '模板测试', span: 24 }
  ])
  const templateRules: FormRules<TemplateForm> = {
    name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
    subject: [{ required: true, message: '请输入邮件主题', trigger: 'blur' }],
    body: [{ required: true, message: '请输入模板内容', trigger: 'change' }]
  }

  const fetchTemplates = async (params: TableParams) => {
    const response = await listEmailTemplates()
    const keyword = String(params.keyword ?? '')
      .trim()
      .toLowerCase()
    let rows = (response.data?.items ?? []).map(normalizeTemplate)
    if (keyword) {
      rows = rows.filter((row) => `${row.name} ${row.subject}`.toLowerCase().includes(keyword))
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
        { prop: 'subject', label: '主题', minWidth: 260, showOverflowTooltip: true },
        { prop: 'enabled', label: '状态', width: 100, useSlot: true },
        { prop: 'operation', label: '操作', width: 140, fixed: 'right', useSlot: true }
      ]
    }
  })

  onMounted(loadConfig)

  function createTemplateForm(): TemplateForm {
    return { id: null, name: '', subject: '', body: '', enabled: true }
  }

  function normalizeTemplate(record: Record<string, unknown>): EmailTemplateRow {
    const id = record.id ?? record.ID
    return {
      id: id == null ? null : Number(id),
      name: String(record.name ?? record.Name ?? ''),
      subject: String(record.subject ?? record.Subject ?? ''),
      body: String(record.body ?? record.Body ?? record.content ?? record.Content ?? ''),
      enabled: Boolean(record.enabled ?? record.Enabled ?? true)
    }
  }

  function handleSearch(params: SearchForm): void {
    Object.assign(searchParams, params)
    getData()
  }

  async function loadConfig(): Promise<void> {
    configLoading.value = true
    try {
      const [map, smtpResponse] = await Promise.all([fetchSettingMap(), getSmtpConfig()])
      const smtp = smtpResponse.data
      configForm.smtp_host = String(smtp?.host ?? settingString(map, 'smtp_host'))
      configForm.smtp_port = String(smtp?.port ?? settingString(map, 'smtp_port'))
      configForm.smtp_user = String(smtp?.user ?? settingString(map, 'smtp_user'))
      configForm.smtp_pass = String(smtp?.pass ?? settingString(map, 'smtp_pass'))
      configForm.smtp_from = String(smtp?.from ?? settingString(map, 'smtp_from'))
      configForm.smtp_enabled = smtp?.enabled ?? settingBoolean(map, 'smtp_enabled')
      configForm.email_enabled = settingBoolean(map, 'email_enabled')
      configForm.email_expire_enabled = settingBoolean(map, 'email_expire_enabled')
      configForm.expire_reminder_days = settingInteger(map, 'expire_reminder_days', 7)
    } finally {
      configLoading.value = false
    }
  }

  async function saveConfig(): Promise<void> {
    configSaving.value = true
    try {
      await updateSmtpConfig({
        host: configForm.smtp_host,
        port: configForm.smtp_port,
        user: configForm.smtp_user,
        pass: configForm.smtp_pass,
        from: configForm.smtp_from,
        enabled: configForm.smtp_enabled
      })
      await saveSettingItems([
        booleanSetting('email_enabled', configForm.email_enabled),
        booleanSetting('email_expire_enabled', configForm.email_expire_enabled),
        stringSetting('expire_reminder_days', configForm.expire_reminder_days)
      ])
      ElMessage.success('邮件配置已保存')
    } finally {
      configSaving.value = false
    }
  }

  function variables(): Record<string, unknown> {
    return { ...mockData, now: new Date().toISOString() }
  }

  function resolvePath(root: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((value, key) => {
      if (!value || typeof value !== 'object') return undefined
      return (value as Record<string, unknown>)[key]
    }, root)
  }

  function renderMock(value: string): string {
    const data = variables()
    return value.replace(/{{\s*\.([a-zA-Z0-9_.]+)\s*}}/g, (_match, path: string) =>
      String(resolvePath(data, path) ?? '')
    )
  }

  function isHtml(value: string): boolean {
    return /<\/?[a-z][\s\S]*>/i.test(value)
  }

  async function sendSmtpTest(): Promise<void> {
    if (!smtpTestTo.value.trim()) {
      ElMessage.error('请输入接收人邮箱')
      return
    }
    const templateResponse = await listEmailTemplates()
    const enabledTemplate = (templateResponse.data?.items ?? [])
      .map(normalizeTemplate)
      .find((item) => item.enabled)
    await testSmtpConfig(
      enabledTemplate
        ? {
            to: smtpTestTo.value.trim(),
            template_name: enabledTemplate.name,
            variables: variables()
          }
        : {
            to: smtpTestTo.value.trim(),
            subject: 'SMTP Test',
            body: '如果您收到此邮件，则说明邮箱成功配置。',
            variables: variables(),
            html: false
          }
    )
    ElMessage.success('测试邮件已发送')
  }

  function openTemplate(row?: EmailTemplateRow): void {
    Object.assign(templateForm, row ?? createTemplateForm())
    defaultTemplateKey.value = undefined
    templateTestTo.value = ''
    templateVisible.value = true
  }

  function applyDefaultTemplate(): void {
    const template = defaultTemplates.find((item) => item.key === defaultTemplateKey.value)
    if (!template) {
      ElMessage.warning('请选择默认模板')
      return
    }
    templateForm.name ||= template.key
    templateForm.subject = template.subject
    templateForm.body = template.body
  }

  function openPreview(): void {
    previewSubject.value = renderMock(templateForm.subject) || '(无主题)'
    previewBody.value = renderMock(templateForm.body) || '(无内容)'
    previewIsHtml.value = isHtml(previewBody.value)
    previewVisible.value = true
  }

  function showHelp(): void {
    ElMessageBox.alert(
      '在编辑器工具栏的“插入变量”菜单中选择占位符。发送预览和测试邮件时会使用模拟数据替换这些变量。',
      '模板变量',
      { confirmButtonText: '知道了' }
    )
  }

  async function sendTemplateTest(): Promise<void> {
    if (!templateTestTo.value.trim()) {
      ElMessage.error('请输入测试收件人')
      return
    }
    if (!templateForm.body) {
      ElMessage.error('模板内容不能为空')
      return
    }
    await testSmtpConfig({
      to: templateTestTo.value.trim(),
      subject: templateForm.subject,
      body: templateForm.body,
      variables: variables(),
      html: isHtml(templateForm.body)
    })
    ElMessage.success('测试邮件已发送')
  }

  async function saveTemplate(): Promise<void> {
    const valid = await templateFormRef.value?.validate()?.catch(() => false)
    if (!valid) return
    templateSaving.value = true
    try {
      const payload = {
        name: templateForm.name.trim(),
        subject: templateForm.subject,
        body: templateForm.body,
        enabled: templateForm.enabled
      }
      if (templateForm.id !== null) await updateEmailTemplate(templateForm.id, payload)
      else await upsertEmailTemplate(payload)
      templateVisible.value = false
      ElMessage.success('邮件模板已保存')
      if (templateForm.id !== null) await refreshUpdate()
      else await refreshCreate()
    } finally {
      templateSaving.value = false
    }
  }

  async function removeTemplate(row: EmailTemplateRow): Promise<void> {
    if (row.id === null) return
    await ElMessageBox.confirm('确认删除该邮件模板吗？', '删除模板', { type: 'warning' })
    await deleteEmailTemplate(row.id)
    ElMessage.success('邮件模板已删除')
    await refreshRemove()
  }
</script>

<style lang="scss" scoped>
  .config-card {
    margin-bottom: 16px;
  }

  .page-header,
  .dialog-toolbar,
  .inline-action {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .page-header,
  .dialog-toolbar {
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

  .dialog-toolbar {
    margin-bottom: 12px;
  }

  .inline-action :is(.el-input) {
    flex: 1;
  }

  .preview-body,
  .preview-text {
    max-height: 480px;
    margin: 0;
    overflow: auto;
    color: var(--art-gray-800);
    white-space: pre-wrap;
  }

  .full-width {
    width: 100%;
  }

  @media (width <= 640px) {
    .page-header,
    .dialog-toolbar,
    .inline-action {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
