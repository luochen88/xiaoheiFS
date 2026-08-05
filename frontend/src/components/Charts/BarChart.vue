<template>
  <ArtBarChart :data="values" :x-axis-data="labels" height="260px" />
</template>

<script setup lang="ts">
  defineOptions({ name: 'LegacyBarChartAdapter' })

  interface LegacyBarData {
    labels?: Array<string | number>
    values?: number[]
  }

  const props = withDefaults(defineProps<{ data?: LegacyBarData }>(), {
    data: () => ({ labels: [], values: [] })
  })

  const labels = computed(() => (props.data.labels || []).map(String))
  const values = computed(() => (props.data.values || []).map((value) => Number(value || 0)))
</script>
