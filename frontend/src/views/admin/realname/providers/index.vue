<template>
  <div class="realname-providers-page art-full-height">
    <ElCard class="art-table-card">
      <ArtTableHeader :loading="loading" @refresh="refreshData" />

      <ArtTable row-key="key" :loading="loading" :data="data" :columns="columns">
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

  interface ProviderRow {
    key: string
    name: string
  }

  const detailVisible = ref(false)
  const current = ref<ProviderRow>()

  const fetchProviders = async () => {
    const response = await listRealNameProviders()
    const rows = (response.data?.items ?? []).map(normalizeProvider)
    return { records: rows, total: rows.length }
  }

  const { columns, data, loading, refreshData } = useTable({
    core: {
      apiFn: fetchProviders,
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
