<template>
  <div class="cms-nav-items-page art-full-height">
    <div class="page-header">
      <div>
        <div class="page-title">导航配置</div>
        <div class="page-subtitle"> 管理保存在 `site_nav_items` 设置中的前台头部导航。 </div>
      </div>

      <div class="page-actions">
        <ElButton :disabled="loading || saving" @click="handleResetToDefault">恢复默认</ElButton>
        <ElButton :loading="loading" @click="fetchData()">刷新</ElButton>
        <ElButton v-if="canUpdate" type="primary" :loading="saving" @click="handleSave">
          保存
        </ElButton>
      </div>
    </div>

    <ElEmpty v-if="!canView" description="你没有管理导航项的权限。" />

    <template v-else>
      <ElRow :gutter="16">
        <ElCol :xs="24" :lg="9">
          <ElCard class="page-card" shadow="never">
            <template #header>
              <div class="card-title">
                <span>预览</span>
                <ElTag type="primary" effect="light">{{ previewLangLabel }}</ElTag>
              </div>
            </template>

            <div class="preview-shell">
              <div class="preview-brand">
                <div class="preview-logo">+</div>
                <div class="preview-name">站点</div>
              </div>

              <div class="preview-links">
                <div class="preview-link is-fixed">首页</div>

                <div
                  v-for="item in previewItems"
                  :key="item.id"
                  class="preview-link"
                  :class="{ disabled: item.enabled === false }"
                  :title="item.url"
                >
                  <span class="label">{{ item.label || '未命名' }}</span>
                  <span class="hint">{{
                    item.target === '_blank' ? '新标签页' : '当前标签页'
                  }}</span>
                </div>

                <div v-if="!previewItems.length" class="preview-empty">
                  当前语言下还没有导航项。
                </div>
              </div>
            </div>

            <ElDivider />

            <ElForm label-position="top">
              <ElFormItem label="预览语言">
                <ElSelect v-model="previewLang" placeholder="请选择语言">
                  <ElOption
                    v-for="item in languageOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>

              <ElFormItem label="说明">
                <div class="help-text">
                  <div>`Home` 会固定显示在前台布局中，这里维护的是额外导航链接。</div>
                  <div>`lang` 会按精确语言值匹配，留空表示所有语言通用。</div>
                </div>
              </ElFormItem>
            </ElForm>
          </ElCard>

          <ElCard class="page-card json-card" shadow="never">
            <template #header>
              <div class="card-title">
                <span>高级 JSON</span>
              </div>
            </template>

            <ElInput
              v-model="rawJson"
              type="textarea"
              :rows="12"
              placeholder='[{"label":"产品中心","url":"/products","target":"_self","lang":"zh-CN"}]'
            />

            <div class="json-actions">
              <ElButton :disabled="saving || loading" @click="handleApplyRawJson">
                应用 JSON 到表格
              </ElButton>
              <ElButton :disabled="saving || loading" @click="syncRawJson">生成 JSON</ElButton>
            </div>
          </ElCard>
        </ElCol>

        <ElCol :xs="24" :lg="15">
          <ElCard class="page-card" shadow="never">
            <template #header>
              <div class="card-title">
                <span>导航项列表</span>
                <ElSpace wrap>
                  <ElButton type="primary" plain :disabled="!canUpdate" @click="handleAddItem">
                    添加导航项
                  </ElButton>
                  <ElButton :disabled="!canUpdate" @click="syncRawJson">生成 JSON</ElButton>
                </ElSpace>
              </div>
            </template>

            <ArtTableHeader
              v-model:columns="columnChecks"
              :show-search-bar="false"
              :loading="loading"
              @refresh="fetchData"
            />

            <ArtTable :data="items" :columns="columns" row-key="id" class="nav-table">
              <template #sort="{ row }">
                <template v-if="findItemIndex(row.id) >= 0">
                  <ElSpace wrap>
                    <ElButton
                      size="small"
                      :disabled="findItemIndex(row.id) === 0 || !canUpdate"
                      @click="moveUp(findItemIndex(row.id))"
                    >
                      上移
                    </ElButton>
                    <ElButton
                      size="small"
                      :disabled="findItemIndex(row.id) === items.length - 1 || !canUpdate"
                      @click="moveDown(findItemIndex(row.id))"
                    >
                      下移
                    </ElButton>
                  </ElSpace>
                </template>
              </template>

              <template #label="{ row }">
                <ElInput v-model="row.label" :disabled="!canUpdate" placeholder="产品中心" />
              </template>

              <template #url="{ row }">
                <ElInput
                  v-model="row.url"
                  :disabled="!canUpdate"
                  placeholder="/products 或 https://..."
                />
              </template>

              <template #target="{ row }">
                <ElSelect v-model="row.target" :disabled="!canUpdate">
                  <ElOption label="当前标签页" value="_self" />
                  <ElOption label="新标签页" value="_blank" />
                </ElSelect>
              </template>

              <template #lang="{ row }">
                <ElSelect v-model="row.lang" clearable :disabled="!canUpdate" placeholder="全部">
                  <ElOption
                    v-for="item in languageOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </template>

              <template #enabled="{ row }">
                <ElSwitch v-model="row.enabled" :disabled="!canUpdate" />
              </template>

              <template #operation="{ row }">
                <div class="table-actions">
                  <ElButton
                    link
                    type="primary"
                    :disabled="!canUpdate"
                    @click="handleDuplicate(row as NavItem)"
                  >
                    复制
                  </ElButton>
                  <ElButton link type="danger" :disabled="!canUpdate" @click="handleRemove(row.id)">
                    删除
                  </ElButton>
                </div>
              </template>
            </ArtTable>

            <div class="table-foot">
              <div class="foot-text">
                保存后，前台会通过 `/api/v1/site/settings` 读取并渲染这些导航项。
              </div>

              <div class="page-actions">
                <ElButton :disabled="!canUpdate" @click="handleAddItem">添加导航项</ElButton>
                <ElButton
                  type="primary"
                  :loading="saving"
                  :disabled="!canUpdate"
                  @click="handleSave"
                >
                  保存
                </ElButton>
              </div>
            </div>
          </ElCard>
        </ElCol>
      </ElRow>
    </template>
  </div>
</template>

<script setup lang="ts">
  import type { SettingItemRecord } from '@/services/admin'
  import { fetchAdminSettings, updateAdminSettings } from '@/services/admin'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useTable } from '@/hooks/core/useTable'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'CmsNavItemsPage' })

  type NavItemTarget = '_self' | '_blank'

  interface NavItem {
    id: string
    label: string
    url: string
    target: NavItemTarget
    lang?: string
    enabled: boolean
  }

  const SETTING_KEY = 'site_nav_items'
  const SITE_LANGUAGES = ['zh-CN', 'en-US']

  const { hasAuth } = useAuth()

  const saving = ref(false)
  const items = ref<NavItem[]>([])
  const rawJson = ref('')
  const previewLang = ref(SITE_LANGUAGES[0] || 'zh-CN')

  const languageOptions = [
    { label: '简体中文', value: 'zh-CN' },
    { label: '英文', value: 'en-US' }
  ]

  const { columnChecks, columns, loading, fetchData } = useTable({
    core: {
      apiFn: fetchNavTable,
      apiParams: { current: 1, size: 100 },
      immediate: false,
      columnsFactory: () => [
        { prop: 'sort', label: '排序', width: 150, useSlot: true },
        { prop: 'label', label: '名称', minWidth: 180, useSlot: true },
        { prop: 'url', label: 'URL', minWidth: 240, useSlot: true },
        { prop: 'target', label: '打开方式', width: 130, useSlot: true },
        { prop: 'lang', label: '语言', width: 150, useSlot: true },
        { prop: 'enabled', label: '启用', width: 100, useSlot: true },
        { prop: 'operation', label: '操作', width: 170, fixed: 'right', useSlot: true }
      ]
    }
  })

  const previewLangLabel = computed(() => {
    return (
      languageOptions.find((item) => item.value === previewLang.value)?.label || previewLang.value
    )
  })

  const canView = computed(() => hasAuth('settings.view'))
  const canUpdate = computed(() => hasAuth('settings.update'))

  const previewItems = computed(() => {
    return items.value.filter(
      (item) => item.enabled !== false && (!item.lang || item.lang === previewLang.value)
    )
  })

  const defaultItems = computed<NavItem[]>(() => [
    createNavItem({
      label: '产品',
      url: '/products',
      target: '_self',
      lang: 'zh-CN',
      enabled: true
    }),
    createNavItem({
      label: '活动',
      url: '/activities',
      target: '_self',
      lang: 'zh-CN',
      enabled: true
    }),
    createNavItem({
      label: '文档',
      url: '/docs',
      target: '_self',
      lang: 'zh-CN',
      enabled: true
    }),
    createNavItem({
      label: '帮助',
      url: '/help',
      target: '_self',
      lang: 'zh-CN',
      enabled: true
    }),
    createNavItem({
      label: 'Products',
      url: '/products',
      target: '_self',
      lang: 'en-US',
      enabled: true
    }),
    createNavItem({
      label: 'Activities',
      url: '/activities',
      target: '_self',
      lang: 'en-US',
      enabled: true
    }),
    createNavItem({
      label: 'Docs',
      url: '/docs',
      target: '_self',
      lang: 'en-US',
      enabled: true
    }),
    createNavItem({
      label: 'Help',
      url: '/help',
      target: '_self',
      lang: 'en-US',
      enabled: true
    })
  ])

  onMounted(() => {
    if (canView.value) {
      fetchData()
    }
  })

  function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }

    return `nav_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  }

  function createNavItem(partial?: Partial<NavItem>): NavItem {
    return {
      id: String(partial?.id || generateId()),
      label: String(partial?.label || ''),
      url: String(partial?.url || ''),
      target: partial?.target === '_blank' ? '_blank' : '_self',
      lang: partial?.lang ? String(partial.lang) : undefined,
      enabled: partial?.enabled === false ? false : true
    }
  }

  function sanitizeItems(input: unknown) {
    const list = Array.isArray(input) ? input : []

    return list
      .map((item) => {
        const record = item as Record<string, unknown>
        return createNavItem({
          id: String(record.id || generateId()),
          label: String(record.label || '').trim(),
          url: String(record.url || '').trim(),
          target: String(record.target || '_self') === '_blank' ? '_blank' : '_self',
          lang: record.lang ? String(record.lang).trim() : undefined,
          enabled: record.enabled === false ? false : true
        })
      })
      .filter((item) => item.label || item.url)
  }

  function syncRawJson() {
    rawJson.value = JSON.stringify(
      items.value.map((item) => ({
        id: item.id,
        label: String(item.label || '').trim(),
        url: String(item.url || '').trim(),
        target: item.target,
        lang: item.lang || undefined,
        enabled: item.enabled !== false
      })),
      null,
      2
    )
  }

  function handleApplyRawJson() {
    try {
      const parsed = JSON.parse(rawJson.value || '[]')
      items.value = sanitizeItems(parsed)
      ElMessage.success('JSON 已应用到表格')
    } catch {
      ElMessage.error('JSON 解析失败')
    }
  }

  async function fetchNavTable(
    params: Api.Common.CommonSearchParams
  ): Promise<Api.Common.PaginatedResponse<NavItem>> {
    if (!canView.value) {
      return { records: [], current: params.current, size: params.size, total: 0 }
    }

    const payload = await fetchAdminSettings()
    applySettings(payload.items || [])
    return {
      records: items.value,
      current: params.current,
      size: params.size,
      total: items.value.length
    }
  }

  function findItemIndex(id: string) {
    return items.value.findIndex((item) => item.id === id)
  }

  function applySettings(settings: SettingItemRecord[]) {
    const found = settings.find((item) => item?.key === SETTING_KEY)

    if (!found?.value) {
      items.value = sanitizeItems(defaultItems.value)
      syncRawJson()
      return
    }

    try {
      const parsed = JSON.parse(String(found.value))
      items.value = sanitizeItems(parsed)
      syncRawJson()
    } catch {
      items.value = []
      rawJson.value = String(found.value || '')
      ElMessage.error('site_nav_items 不是合法 JSON，已加载原始内容供你修复')
    }
  }

  function handleAddItem() {
    items.value.push(
      createNavItem({
        lang: previewLang.value,
        enabled: true
      })
    )
  }

  function handleDuplicate(source: NavItem) {
    items.value.push(
      createNavItem({
        ...source,
        id: generateId()
      })
    )
    syncRawJson()
  }

  function handleRemove(id: string) {
    items.value = items.value.filter((item) => item.id !== id)
    syncRawJson()
  }

  function moveUp(index: number) {
    if (index <= 0) {
      return
    }

    const next = [...items.value]
    const [item] = next.splice(index, 1)
    next.splice(index - 1, 0, item)
    items.value = next
    syncRawJson()
  }

  function moveDown(index: number) {
    if (index >= items.value.length - 1) {
      return
    }

    const next = [...items.value]
    const [item] = next.splice(index, 1)
    next.splice(index + 1, 0, item)
    items.value = next
    syncRawJson()
  }

  async function handleResetToDefault() {
    try {
      await ElMessageBox.confirm(
        '确定要将当前导航恢复为默认模板吗？未保存的修改会丢失。',
        '恢复默认',
        {
          type: 'warning'
        }
      )
    } catch {
      return
    }

    items.value = sanitizeItems(defaultItems.value)
    syncRawJson()
    ElMessage.success('默认导航已恢复')
  }

  function buildSavePayload() {
    return sanitizeItems(items.value).map((item) => ({
      id: item.id,
      label: String(item.label || '').trim(),
      url: String(item.url || '').trim(),
      target: item.target,
      lang: item.lang || undefined,
      enabled: item.enabled !== false
    }))
  }

  async function handleSave() {
    saving.value = true

    try {
      const next = buildSavePayload()
      await updateAdminSettings({
        key: SETTING_KEY,
        value: JSON.stringify(next)
      })

      items.value = sanitizeItems(next)
      syncRawJson()
      ElMessage.success('导航项保存成功')
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || '保存失败')
    } finally {
      saving.value = false
    }
  }
</script>

<style scoped lang="scss">
  .cms-nav-items-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .page-header,
  .page-actions,
  .card-title,
  .table-actions,
  .json-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .page-header,
  .card-title,
  .table-foot {
    justify-content: space-between;
  }

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .page-subtitle,
  .help-text,
  .foot-text {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
  }

  .page-card {
    border-radius: 8px;
  }

  .preview-shell {
    overflow: hidden;
    background: var(--el-fill-color-darker);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
  }

  .preview-brand {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 12px 14px;
    border-bottom: 1px solid var(--el-border-color);
  }

  .preview-logo {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    font-weight: 800;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-5);
    border-radius: 8px;
  }

  .preview-name {
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .preview-links {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 14px;
  }

  .preview-link {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    padding: 8px 10px;
    font-size: 12px;
    color: var(--el-text-color-primary);
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 999px;
  }

  .preview-link.is-fixed {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
  }

  .preview-link.disabled {
    filter: grayscale(0.3);
    opacity: 0.45;
  }

  .hint,
  .preview-empty {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }

  .json-actions {
    justify-content: space-between;
    margin-top: 12px;
  }

  .table-actions {
    justify-content: flex-end;
  }

  .table-foot {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-top: 16px;
  }

  @media (width <= 900px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .page-actions,
    .json-actions,
    .table-foot {
      flex-wrap: wrap;
      width: 100%;
    }
  }
</style>
