<template>
  <div class="http-headers-table">
    <ElTable :data="dataSource" size="small" row-key="key" empty-text="暂无数据">
      <ElTableColumn prop="key" label="Key" width="35%">
        <template #default="{ row }">
          <code class="header-key">{{ row.key }}</code>
        </template>
      </ElTableColumn>

      <ElTableColumn prop="value" label="Value" min-width="240">
        <template #default="{ row }">
          <code class="header-value">{{ row.value }}</code>
        </template>
      </ElTableColumn>

      <ElTableColumn label="" width="60" align="center">
        <template #default="{ row }">
          <ElButton
            v-if="copyable"
            class="copy-button"
            type="primary"
            link
            title="复制"
            aria-label="复制请求头值"
            @click="copyValue(row.value)"
          >
            <ArtSvgIcon icon="ri:file-copy-line" />
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'HttpHeadersTable' })

  interface Props {
    headers: Record<string, string> | null
    copyable?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    copyable: true
  })

  const dataSource = computed(() => {
    if (!props.headers) return []
    return Object.entries(props.headers).map(([key, value]) => ({
      key,
      value: String(value)
    }))
  })

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      ElMessage.success('已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败')
    }
  }
</script>

<style lang="scss" scoped>
  .http-headers-table {
    overflow: hidden;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .header-key,
  .header-value {
    display: inline-block;
    font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', Menlo, monospace;
    font-size: 12px;
    line-height: 1.6;
    word-break: break-all;
  }

  .header-key {
    color: var(--el-color-primary);
    font-weight: 600;
  }

  .header-value {
    color: var(--art-gray-700);
  }

  .copy-button {
    width: 28px;
    height: 28px;
    padding: 0;
  }
</style>
