<template>
  <div class="art-full-height">
    <ElCard v-loading="loading" class="art-table-card">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">内容分类</div>
            <div class="page-subtitle"> 管理文章分类的标识、语言版本、排序和显示状态。 </div>
          </div>

          <div class="page-actions">
            <ElButton v-if="canView" :disabled="loading" @click="fetchData()">刷新</ElButton>
            <ElButton v-if="canCreate" type="primary" @click="openCreate">新建分类</ElButton>
          </div>
        </div>
      </template>

      <ElEmpty v-if="!canView" description="你没有查看内容分类的权限。" />

      <template v-else>
        <ArtTableHeader
          v-model:columns="columnChecks"
          :showSearchBar="false"
          :loading="loading"
          @refresh="fetchData"
        />

        <ArtTable row-key="id" :loading="loading" :data="tableData" :columns="columns">
          <template #visible="{ row }">
            <ElSwitch
              :model-value="row.visible"
              :disabled="!canUpdate || row.switching"
              :loading="row.switching"
              @change="handleToggleVisible(row, $event)"
            />
          </template>

          <template #operation="{ row }">
            <div class="table-actions">
              <ElButton v-if="canUpdate" link type="primary" @click="openEdit(row)">编辑</ElButton>
              <ElButton v-if="canDelete" link type="danger" @click="handleDelete(row)">
                删除
              </ElButton>
            </div>
          </template>
        </ArtTable>
      </template>
    </ElCard>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新建分类' : '编辑分类'"
      width="520px"
      destroy-on-close
      align-center
    >
      <ElForm ref="formRef" :model="dialogForm" :rules="rules" label-position="top">
        <ElFormItem label="分类标识" prop="key">
          <ElInput
            v-model.trim="dialogForm.key"
            :disabled="dialogMode === 'edit'"
            placeholder="docs"
          />
        </ElFormItem>

        <ElFormItem label="显示名称" prop="name">
          <ElInput v-model.trim="dialogForm.name" placeholder="文档中心" />
        </ElFormItem>

        <ElRow :gutter="12">
          <ElCol :span="12">
            <ElFormItem label="语言" prop="lang">
              <ElSelect v-model="dialogForm.lang" placeholder="请选择语言">
                <ElOption
                  v-for="item in languageOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <ElCol :span="12">
            <ElFormItem label="排序值" prop="sort_order">
              <ElInputNumber v-model="dialogForm.sort_order" :min="0" style="width: 100%" />
            </ElFormItem>
          </ElCol>
        </ElRow>

        <ElFormItem label="是否显示">
          <ElSwitch v-model="dialogForm.visible" />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton type="primary" :loading="dialogSubmitting" @click="handleSubmit">
            保存
          </ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type { CMSCategoryRecord } from '@/services/admin'
  import {
    createCMSCategory,
    deleteCMSCategory,
    fetchCMSCategories,
    updateCMSCategory
  } from '@/services/admin'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useTable } from '@/hooks/core/useTable'
  import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

  defineOptions({ name: 'CmsCategoriesPage' })

  interface CategoryRow {
    id: number | null
    key: string
    name: string
    lang: string
    sort_order: number
    visible: boolean
    created_at: string
    updated_at: string
    switching?: boolean
  }

  type CategoryTableParams = Api.Common.CommonSearchParams

  interface CategoryDialogForm {
    id: number | null
    key: string
    name: string
    lang: string
    sort_order: number
    visible: boolean
  }

  const languageOptions = [
    { label: '简体中文', value: 'zh-CN' },
    { label: '英文', value: 'en-US' }
  ]

  const { hasAuth } = useAuth()

  const initialized = ref(false)
  const dialogVisible = ref(false)
  const dialogSubmitting = ref(false)
  const dialogMode = ref<'create' | 'edit'>('create')

  const dialogForm = reactive<CategoryDialogForm>(createDefaultDialogForm())
  const formRef = ref<FormInstance>()

  const {
    columnChecks,
    columns,
    data: tableData,
    loading,
    fetchData
  } = useTable({
    core: {
      apiFn: fetchCategoryTable,
      apiParams: { current: 1, size: 1000 },
      immediate: false,
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        { prop: 'key', label: '分类标识', minWidth: 160, showOverflowTooltip: true },
        { prop: 'name', label: '显示名称', minWidth: 180, showOverflowTooltip: true },
        { prop: 'lang', label: '语言', width: 140 },
        { prop: 'sort_order', label: '排序', width: 90 },
        { prop: 'visible', label: '显示', width: 110, useSlot: true },
        {
          prop: 'updated_at',
          label: '更新时间',
          minWidth: 180,
          formatter: (row: CategoryRow) => formatDateTime(row.updated_at)
        },
        { prop: 'operation', label: '操作', width: 150, fixed: 'right', useSlot: true }
      ]
    }
  })

  const canView = computed(() => hasAuth('cms_category.list'))
  const canCreate = computed(() => hasAuth('cms_category.create'))
  const canUpdate = computed(() => hasAuth('cms_category.update'))
  const canDelete = computed(() => hasAuth('cms_category.delete'))

  const rules = computed<FormRules>(() => ({
    key: [{ required: true, message: '请输入分类标识', trigger: 'blur' }],
    name: [{ required: true, message: '请输入显示名称', trigger: 'blur' }]
  }))

  watch(
    canView,
    (value) => {
      if (value && !initialized.value) {
        initialized.value = true
        fetchData()
      }
    },
    { immediate: true }
  )

  function createDefaultDialogForm(): CategoryDialogForm {
    return {
      id: null,
      key: '',
      name: '',
      lang: 'zh-CN',
      sort_order: 0,
      visible: true
    }
  }

  function resetDialogForm() {
    Object.assign(dialogForm, createDefaultDialogForm())
  }

  function normalizeNullableNumber(value: unknown): number | null {
    if (value === '' || value === null || value === undefined) {
      return null
    }

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  function normalizeRow(item?: CMSCategoryRecord): CategoryRow {
    return {
      id: normalizeNullableNumber(item?.id),
      key: String(item?.key || ''),
      name: String(item?.name || ''),
      lang: String(item?.lang || 'zh-CN'),
      sort_order: Number(item?.sort_order || 0),
      visible: Boolean(item?.visible),
      created_at: String(item?.created_at || ''),
      updated_at: String(item?.updated_at || ''),
      switching: false
    }
  }

  function formatDateTime(value?: string | null) {
    if (!value) {
      return '-'
    }

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
  }

  async function fetchCategoryTable(
    params: CategoryTableParams
  ): Promise<Api.Common.PaginatedResponse<CategoryRow>> {
    if (!canView.value) {
      return { records: [], current: params.current, size: params.size, total: 0 }
    }

    const payload = await fetchCMSCategories()
    const records = (payload.items || []).map((item) => normalizeRow(item))

    return {
      records,
      current: params.current,
      size: params.size,
      total: records.length
    }
  }

  function openCreate() {
    dialogMode.value = 'create'
    resetDialogForm()
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  function openEdit(row: CategoryRow) {
    dialogMode.value = 'edit'
    Object.assign(dialogForm, {
      id: row.id,
      key: row.key,
      name: row.name,
      lang: row.lang || 'zh-CN',
      sort_order: row.sort_order,
      visible: row.visible
    })
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  async function handleSubmit() {
    if (!formRef.value) {
      return
    }

    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) {
      return
    }

    dialogSubmitting.value = true

    try {
      const payload = {
        key: String(dialogForm.key || '').trim(),
        name: String(dialogForm.name || '').trim(),
        lang: String(dialogForm.lang || 'zh-CN').trim() || 'zh-CN',
        sort_order: Number(dialogForm.sort_order || 0),
        visible: Boolean(dialogForm.visible)
      }

      if (dialogMode.value === 'create') {
        await createCMSCategory(payload)
        ElMessage.success('分类创建成功')
      } else if (dialogForm.id) {
        await updateCMSCategory(dialogForm.id, payload)
        ElMessage.success('分类更新成功')
      }

      dialogVisible.value = false
      await fetchData()
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || '操作失败')
    } finally {
      dialogSubmitting.value = false
    }
  }

  async function handleToggleVisible(row: CategoryRow, checked: string | number | boolean) {
    if (!row.id) {
      return
    }

    row.switching = true

    try {
      await updateCMSCategory(row.id, { visible: Boolean(checked) })
      row.visible = Boolean(checked)
      ElMessage.success('显示状态已更新')
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || '更新显示状态失败')
    } finally {
      row.switching = false
    }
  }

  async function handleDelete(row: CategoryRow) {
    if (!row.id) {
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除分类“${row.name || row.key}”吗？该操作不可恢复。`,
        '删除分类',
        {
          type: 'warning'
        }
      )

      await deleteCMSCategory(row.id)
      ElMessage.success('分类删除成功')
      await fetchData()
    } catch (error: any) {
      if (error === 'cancel' || error === 'close') {
        return
      }

      ElMessage.error(error?.response?.data?.error || '删除分类失败')
    }
  }
</script>

<style scoped lang="scss">
  .page-header {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .page-subtitle {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }

  .page-actions,
  .toolbar,
  .table-actions,
  .dialog-footer {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .toolbar {
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .toolbar-select {
    width: 180px;
  }

  .toolbar-search {
    width: min(360px, 100%);
  }

  .table-actions {
    justify-content: flex-end;
  }

  .dialog-footer {
    justify-content: flex-end;
  }

  @media (width <= 768px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .page-actions {
      flex-wrap: wrap;
      width: 100%;
    }

    .toolbar-select,
    .toolbar-search {
      width: 100%;
    }
  }
</style>
