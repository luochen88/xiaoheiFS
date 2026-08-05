<template>
  <div ref="chartRef" class="legacy-line-chart" :style="{ height: normalizedHeight }" />
</template>

<script setup lang="ts">
  import type { EChartsOption } from '@/plugins/echarts'
  import { useChartComponent, useChartOps } from '@/hooks/core/useChart'

  defineOptions({ name: 'LegacyLineChartAdapter' })

  interface LegacyLineData {
    labels?: Array<string | number>
    values?: number[]
  }

  const props = withDefaults(
    defineProps<{
      data?: LegacyLineData
      color?: string
      height?: string | number
      yAxisValueFormatter?: (value: number) => string
      tooltipValueFormatter?: (value: number) => string
      smooth?: boolean
    }>(),
    {
      data: () => ({ labels: [], values: [] }),
      color: '',
      height: 260,
      yAxisValueFormatter: undefined,
      tooltipValueFormatter: undefined,
      smooth: true
    }
  )

  const labels = computed(() => (props.data.labels || []).map(String))
  const values = computed(() => (props.data.values || []).map((value) => Number(value || 0)))
  const normalizedHeight = computed(() =>
    typeof props.height === 'number' ? `${props.height}px` : props.height
  )

  const formatNumber = (value: unknown) => {
    const number = Number(value || 0)
    return Number.isFinite(number)
      ? number.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
      : '0'
  }
  const formatYAxisValue = (value: number) =>
    props.yAxisValueFormatter?.(value) ?? formatNumber(value)
  const formatTooltipValue = (value: number) =>
    props.tooltipValueFormatter?.(value) ?? formatNumber(value)

  const {
    chartRef,
    getAnimationConfig,
    getAxisLabelStyle,
    getAxisLineStyle,
    getAxisTickStyle,
    getSplitLineStyle,
    getTooltipStyle
  } = useChartComponent({
    props: {},
    checkEmpty: () => !values.value.length,
    watchSources: [
      () => props.data,
      () => props.color,
      () => props.smooth,
      () => props.yAxisValueFormatter,
      () => props.tooltipValueFormatter
    ],
    generateOptions: (): EChartsOption => {
      const pointCount = labels.value.length
      const color = props.color || useChartOps().colors[0]
      const tooltip = getTooltipStyle('axis') as Record<string, any>
      tooltip.formatter = (params: AnyRecord[] = []) => {
        const first = params[0]
        if (!first) return ''
        const title = first.axisValueLabel || first.axisValue || ''
        const line = `${first.marker || ''} ${first.seriesName || '数值'}: ${formatTooltipValue(Number(first.value || 0))}`
        return `${title}<br/>${line}`
      }

      return {
        tooltip,
        grid: { left: 46, right: 26, top: 20, bottom: pointCount > 18 ? 56 : 36 },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: labels.value,
          axisPointer: { show: true, snap: true },
          axisTick: getAxisTickStyle(),
          axisLine: getAxisLineStyle(),
          axisLabel: {
            ...getAxisLabelStyle(),
            hideOverlap: true,
            interval: pointCount > 20 ? 'auto' : 0
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: { ...getAxisLabelStyle(), formatter: formatYAxisValue },
          axisLine: getAxisLineStyle(),
          splitLine: getSplitLineStyle(),
          axisPointer: {
            show: true,
            label: { show: true, formatter: ({ value }: AnyRecord) => formatYAxisValue(value) }
          }
        },
        dataZoom:
          pointCount > 18
            ? [
                {
                  type: 'inside',
                  zoomOnMouseWheel: true,
                  moveOnMouseMove: true,
                  moveOnMouseWheel: true
                }
              ]
            : [],
        series: [
          {
            name: '数值',
            type: 'line',
            data: values.value,
            smooth: props.smooth,
            showSymbol: pointCount <= 32,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { color, width: 2 },
            itemStyle: { color },
            areaStyle: { color, opacity: 0.12 },
            emphasis: { focus: 'series' },
            ...getAnimationConfig()
          }
        ]
      }
    }
  })

  type AnyRecord = Record<string, any>
</script>

<style lang="scss" scoped>
  .legacy-line-chart {
    width: 100%;
  }
</style>
