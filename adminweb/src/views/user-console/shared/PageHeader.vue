<template>
  <div class="console-page-header">
    <div>
      <h1>{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="page-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ConsolePageHeader' })

  defineProps<{
    title: string
    description?: string
  }>()
</script>

<style scoped lang="scss">
  .console-page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;

    h1 {
      margin: 0;
      color: var(--art-gray-900);
      font-size: 24px;
      font-weight: 700;
      line-height: 1.25;
    }

    p {
      margin: 7px 0 0;
      color: var(--art-gray-500);
      font-size: 13px;
    }
  }

  .page-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  @media (max-width: 640px) {
    .console-page-header {
      flex-direction: column;

      h1 {
        font-size: 20px;
      }
    }

    .page-actions {
      width: 100%;

      :deep(.el-button) {
        flex: 1;
      }
    }
  }
</style>
