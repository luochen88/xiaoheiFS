<template>
  <div class="gauge-chart">
    <ArtRingChart
      :data="chartData"
      :colors="chartColors"
      :center-text="centerText"
      :show-tooltip="false"
      height="180px"
    />
    <span v-if="title" class="gauge-title">{{ title }}</span>
  </div>
</template>

<script setup lang="ts">
  import { getCssVar } from '@/utils/ui'
  import { useSettingStore } from '@/store/modules/setting'

  defineOptions({ name: 'LegacyGaugeChartAdapter' })

  const props = withDefaults(
    defineProps<{ value: number; title?: string; color?: string; max?: number | string }>(),
    { title: '', color: '', max: 100 }
  )

  const { isDark } = storeToRefs(useSettingStore())
  const maximum = computed(() => Math.max(0, Number(props.max) || 100))
  const normalizedValue = computed(() =>
    Math.min(maximum.value, Math.max(0, Number(props.value) || 0))
  )
  const percentage = computed(() =>
    maximum.value > 0 ? (normalizedValue.value / maximum.value) * 100 : 0
  )
  const centerText = computed(() => `${percentage.value.toFixed(1)}%`)
  const progressColor = computed(() => {
    if (props.color) return props.color
    if (percentage.value < 50) return getCssVar('--el-color-success')
    if (percentage.value < 80) return getCssVar('--el-color-warning')
    return getCssVar('--el-color-danger')
  })
  const chartColors = computed(() => {
    void isDark.value
    return [progressColor.value, getCssVar('--art-gray-300')]
  })
  const chartData = computed(() => [
    { name: '已用', value: normalizedValue.value },
    { name: '可用', value: Math.max(0, maximum.value - normalizedValue.value) }
  ])
</script>

<style lang="scss" scoped>
  .gauge-chart {
    position: relative;
  }

  .gauge-title {
    position: absolute;
    right: 0;
    bottom: 14px;
    left: 0;
    font-size: 12px;
    color: var(--art-gray-600);
    text-align: center;
  }
</style>
