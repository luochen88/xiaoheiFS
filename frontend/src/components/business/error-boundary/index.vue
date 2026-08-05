<template>
  <slot v-if="!hasError" />

  <div v-else class="error-boundary">
    <ElCard class="error-card" shadow="never">
      <div class="title">页面渲染失败</div>
      <div class="description">通常是接口返回异常或前端运行时错误导致。可先刷新重试。</div>
      <pre v-if="message" class="message">{{ message }}</pre>
      <div class="actions">
        <ElButton type="primary" @click="reload">刷新页面</ElButton>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ErrorBoundary' })

  const hasError = ref(false)
  const message = ref('')
  const reload = () => window.location.reload()

  onErrorCaptured((error) => {
    const errorWithMessage = error as { message?: unknown } | null | undefined
    const errorMessage = String(errorWithMessage?.message || error || '')

    // 页面逻辑会自行处理预期的请求错误，不能让它们触发整页兜底。
    if (errorMessage.includes('Request failed with status code')) {
      return false
    }

    hasError.value = true
    message.value = errorMessage
    return false
  })
</script>

<style lang="scss" scoped>
  .error-boundary {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;
    background: var(--default-bg-color);
  }

  .error-card {
    width: 100%;
    max-width: 720px;
    border-color: var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
    box-shadow: var(--el-box-shadow-light);
  }

  .title {
    margin-bottom: 6px;
    color: var(--art-gray-900);
    font-size: 18px;
    font-weight: 700;
  }

  .description {
    margin-bottom: 12px;
    color: var(--art-gray-600);
  }

  .message {
    max-height: 240px;
    margin: 0 0 12px;
    padding: 12px;
    overflow: auto;
    color: var(--art-gray-800);
    font-size: 12px;
    white-space: pre-wrap;
    background: var(--art-gray-100);
    border: 1px solid var(--default-border);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }
</style>
