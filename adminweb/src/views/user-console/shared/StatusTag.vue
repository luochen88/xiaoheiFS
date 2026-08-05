<template>
  <ElTag :type="type" effect="light">
    {{ label }}
  </ElTag>
</template>

<script setup lang="ts">
  import {
    orderStatusLabel,
    statusTagType,
    ticketStatusLabel,
    vpsStatusLabel
  } from '@/utils/console-user'

  defineOptions({ name: 'ConsoleStatusTag' })

  const props = withDefaults(
    defineProps<{
      status?: unknown
      kind?: 'order' | 'vps' | 'ticket' | 'raw'
    }>(),
    {
      kind: 'raw'
    }
  )

  const label = computed(() => {
    if (props.kind === 'order') return orderStatusLabel(props.status)
    if (props.kind === 'vps') return vpsStatusLabel(props.status)
    if (props.kind === 'ticket') return ticketStatusLabel(props.status)
    return String(props.status || '-')
  })

  const type = computed(() => statusTagType(props.status))
</script>
