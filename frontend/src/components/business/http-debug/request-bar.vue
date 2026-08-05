<template>
  <div class="http-request-bar">
    <span class="method-badge" :class="`method-${method.toLowerCase()}`">
      {{ method }}
    </span>

    <div class="request-url">{{ url || '-' }}</div>

    <div v-if="status !== undefined" class="status-info">
      <ElTag size="small" :type="getStatusType(status)">{{ status }}</ElTag>
      <span v-if="duration !== undefined && duration !== null" class="duration">
        {{ duration }}ms
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'HttpRequestBar' })

  interface Props {
    method: string
    url?: string
    status?: number
    duration?: number
  }

  withDefaults(defineProps<Props>(), {
    method: 'GET',
    url: ''
  })

  type TagType = 'success' | 'warning' | 'danger' | 'info' | 'primary'

  const getStatusType = (statusCode: number): TagType => {
    if (statusCode >= 200 && statusCode < 300) return 'success'
    if (statusCode >= 300 && statusCode < 400) return 'primary'
    if (statusCode >= 400 && statusCode < 500) return 'warning'
    if (statusCode >= 500) return 'danger'
    return 'info'
  }
</script>

<style lang="scss" scoped>
  .http-request-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .method-badge {
    flex-shrink: 0;
    min-width: 52px;
    padding: 5px 10px;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0;
    border-radius: var(--el-border-radius-base);
  }

  .method-get {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  .method-post {
    color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }

  .method-put {
    color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
  }

  .method-delete {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }

  .method-patch {
    color: var(--el-color-info);
    background: var(--el-color-info-light-9);
  }

  .method-head,
  .method-options,
  .method-default {
    color: var(--art-gray-700);
    background: var(--art-active-color);
  }

  .request-url {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: var(--art-gray-900);
    font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', Menlo, monospace;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .status-info {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 8px;
  }

  .duration {
    color: var(--art-gray-600);
    font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', Menlo, monospace;
    font-size: 12px;
  }

  @media (max-width: 640px) {
    .http-request-bar {
      flex-wrap: wrap;
    }

    .request-url {
      order: 3;
      width: 100%;
      white-space: normal;
      word-break: break-all;
    }
  }
</style>
