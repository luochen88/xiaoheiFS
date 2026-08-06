<template>
  <ElPopconfirm :title="title" @confirm="emit('confirm')">
    <template #reference>
      <slot />
    </template>
  </ElPopconfirm>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ConfirmAction' })

  withDefaults(
    defineProps<{
      title?: string
    }>(),
    {
      title: '确认操作?'
    }
  )

  const emit = defineEmits<{
    (event: 'confirm'): void
  }>()
</script>
