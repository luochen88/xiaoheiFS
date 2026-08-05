<template>
  <div ref="chartRef" class="legacy-pie-chart" />
</template>

<script setup lang="ts">
  import type { EChartsOption } from '@/plugins/echarts'
  import { useChartComponent, useChartOps } from '@/hooks/core/useChart'
  import type { PieDataItem } from '@/types/component/chart'

  defineOptions({ name: 'LegacyPieChartAdapter' })

  const props = withDefaults(defineProps<{ data?: PieDataItem[] }>(), {
    data: () => []
  })
  const emit = defineEmits<{ (event: 'slice-click', value: PieDataItem | null): void }>()

  const { chartRef, getChartInstance, getAnimationConfig, getTooltipStyle } = useChartComponent({
    props: { height: '260px' },
    checkEmpty: () => !props.data.length || props.data.every((item) => Number(item.value) === 0),
    watchSources: [() => props.data],
    generateOptions: (): EChartsOption => ({
      tooltip: getTooltipStyle('item'),
      color: useChartOps().colors,
      series: [
        {
          type: 'pie',
          radius: ['42%', '72%'],
          data: props.data,
          label: { formatter: '{b}: {d}%' },
          ...getAnimationConfig()
        }
      ]
    })
  })

  const bindClick = () => {
    const chart = getChartInstance()
    if (!chart) return
    chart.off('click')
    chart.on('click', (params) => emit('slice-click', (params.data as PieDataItem) || null))
  }

  onMounted(() => nextTick(bindClick))
  watch(
    () => props.data,
    () => nextTick(bindClick),
    { deep: true }
  )
</script>

<style lang="scss" scoped>
  .legacy-pie-chart {
    width: 100%;
    height: 260px;
  }
</style>
