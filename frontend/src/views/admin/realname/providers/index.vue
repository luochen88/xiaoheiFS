<template>
  <div class="realname-providers-page art-full-height">
    <ArtSearchBar
      v-show="showSearchBar"
      v-model="searchForm"
      :items="searchItems"
      :show-expand="false"
      @search="handleSearch"
      @reset="resetSearchParams"
    />

    <ElCard class="art-table-card" :style="{ marginTop: showSearchBar ? '12px' : '0' }">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:show-search-bar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      />

      <ArtTable
        row-key="key"
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <template #operation="{ row }">
          <ElButton link type="primary" @click="openDetail(row)">查看详情</ElButton>
        </template>
      </ArtTable>
    </ElCard>

    <ElDialog v-model="detailVisible" title="供应商详情" width="520px" destroy-on-close>
      <ElDescriptions :column="1" border>
        <ElDescriptionsItem label="服务商 Key">{{ current?.key || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="名称">{{ current?.name || '-' }}</ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { listRealNameProviders } from '@/services/admin'
  import type { RealNameProvider } from '@/services/types'
  import { useTable } from '@/hooks/core/useTable'

  defineOptions({ name: 'AdminRealnameProviders' })

  interface SearchForm {
    keyword?: string
  }

  interface TableParams extends SearchForm {
    current: number
    size: number
  }

  interface ProviderRow {
    key: string
    name: string
  }

  const showSearchBar = ref(true)
  const searchForm = ref<SearchForm>({ keyword: '' })
  const detailVisible = ref(false)
  const current = ref<ProviderRow>()
  const searchItems = computed(() => [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      props: { clearable: true, placeholder: '名称或服务商 Key' }
    }
  ])

  const fetchProviders = async (params: TableParams) => {
    const response = await listRealNameProviders()
    const keyword = String(params.keyword ?? '')
      .trim()
      .toLowerCase()
    let rows = (response.data?.items ?? []).map(normalizeProvider)
    if (keyword) {
      rows = rows.filter((row) => `${row.name} ${row.key}`.toLowerCase().includes(keyword))
    }
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
    refreshData
  } = useTable({
    core: {
      apiFn: fetchProviders,
      apiParams: { current: 1, size: 20, ...searchForm.value },
      columnsFactory: () => [
        { prop: 'key', label: '服务商 Key', minWidth: 260, showOverflowTooltip: true },
        { prop: 'name', label: '名称', minWidth: 180, showOverflowTooltip: true },
        { prop: 'operation', label: '操作', width: 120, fixed: 'right', useSlot: true }
      ]
    }
  })

  function normalizeProvider(provider: RealNameProvider): ProviderRow {
    const record = provider as RealNameProvider & { Key?: string; Name?: string }
    return {
      key: String(record.key ?? record.Key ?? ''),
      name: String(record.name ?? record.Name ?? '')
    }
  }

  function handleSearch(params: SearchForm): void {
    Object.assign(searchParams, params)
    getData()
  }

  function openDetail(row: ProviderRow): void {
    current.value = row
    detailVisible.value = true
  }
</script>

<style lang="scss" scoped>
  .realname-providers-page {
    min-width: 0;
  }
</style>
