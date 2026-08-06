<template>
  <div class="settings-page pb-5">
    <ElCard v-loading="loading" class="art-card-xs">
      <template #header>
        <div class="settings-header">
          <div>
            <h2 class="settings-title">{{ title }}</h2>
            <p v-if="subtitle" class="settings-subtitle">{{ subtitle }}</p>
          </div>

          <ElSpace wrap>
            <slot name="actions" />
            <ElButton
              v-if="showRefresh && canView"
              :disabled="loading || saving"
              @click="$emit('refresh')"
            >
              <ArtSvgIcon icon="ri:refresh-line" />
              刷新
            </ElButton>
            <ElButton
              v-if="showSave && canUpdate"
              type="primary"
              :loading="saving"
              :disabled="loading"
              @click="$emit('save')"
            >
              <ArtSvgIcon icon="ri:save-line" />
              {{ saveText }}
            </ElButton>
          </ElSpace>
        </div>
      </template>

      <ElEmpty v-if="!canView" description="当前账号没有查看此配置的权限" />
      <slot v-else />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  withDefaults(
    defineProps<{
      title: string
      subtitle?: string
      loading?: boolean
      saving?: boolean
      canView?: boolean
      canUpdate?: boolean
      showRefresh?: boolean
      showSave?: boolean
      saveText?: string
    }>(),
    {
      subtitle: '',
      loading: false,
      saving: false,
      canView: true,
      canUpdate: true,
      showRefresh: true,
      showSave: true,
      saveText: '保存更改'
    }
  )

  defineEmits<{
    (event: 'refresh'): void
    (event: 'save'): void
  }>()

  defineOptions({ name: 'AdminSettingsPage' })
</script>

<style lang="scss" scoped>
  .settings-page {
    min-width: 0;
  }

  .settings-header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .settings-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--art-gray-900);
  }

  .settings-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--art-gray-600);
  }

  @media (width <= 640px) {
    .settings-header {
      flex-direction: column;
    }
  }
</style>
