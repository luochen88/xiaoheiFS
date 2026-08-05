<template>
  <div class="ring-progress">
    <ArtRingChart
      :data="chartData"
      :colors="chartColors"
      :center-text="centerText"
      :show-tooltip="false"
      height="160px"
    />
    <span v-if="subtitle" class="ring-subtitle">{{ subtitle }}</span>
  </div>
</template>

<script setup lang="ts">
  import { getCssVar } from '@/utils/ui'
  import { useSettingStore } from '@/store/modules/setting'

  defineOptions({ name: 'LegacyRingProgressAdapter' })

  const props = withDefaults(defineProps<{ value: number; title?: string; subtitle?: string }>(), {
    title: '',
    subtitle: ''
  })

  const { isDark } = storeToRefs(useSettingStore())
  const percentage = computed(() => Math.min(100, Math.max(0, Number(props.value) || 0)))
  const centerText = computed(() => props.title || `${percentage.value.toFixed(1)}%`)
  const progressColor = computed(() => {
    if (percentage.value < 60) return getCssVar('--el-color-success')
    if (percentage.value < 85) return getCssVar('--el-color-warning')
    return getCssVar('--el-color-danger')
  })
  const chartColors = computed(() => {
    void isDark.value
    return [progressColor.value, getCssVar('--art-gray-300')]
  })
  const chartData = computed(() => [
    { name: '已用', value: percentage.value },
    { name: '剩余', value: 100 - percentage.value }
  ])
</script>

<style lang="scss" scoped>
  .ring-progress {
    position: relative;
  }

  .ring-subtitle {
    position: absolute;
    right: 12%;
    bottom: 24px;
    left: 12%;
    overflow: hidden;
    font-size: 12px;
    color: var(--art-gray-600);
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
