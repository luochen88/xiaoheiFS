<template>
  <ElForm label-position="top" class="schema-form">
    <ElAlert
      v-if="!isObjectRoot"
      class="schema-warning"
      type="warning"
      show-icon
      :closable="false"
      title="该插件未提供可渲染的 JSON Schema（仅支持 object/properties）"
    />

    <template v-else>
      <JsonSchemaField
        v-for="key in orderedKeys"
        :key="key"
        :schema="schema.properties[key]"
        :path="[key]"
        :model="localModel"
        :required="requiredKeys.includes(key)"
        :ui="uiSchema?.[key]"
      />
    </template>
  </ElForm>
</template>

<script setup lang="ts">
  import JsonSchemaField from './field.vue'

  defineOptions({ name: 'JsonSchemaForm' })

  const props = defineProps<{
    schema: any
    uiSchema?: any
    modelValue: Record<string, any>
  }>()

  const emit = defineEmits<{
    (event: 'update:modelValue', value: Record<string, any>): void
  }>()

  const localModel = reactive<Record<string, any>>({})
  let syncingFromParent = false
  let lastSnapshot = '{}'

  const safeParse = (value: any) => {
    try {
      return JSON.parse(JSON.stringify(value || {}))
    } catch {
      return {}
    }
  }

  const snapshotOf = (value: any) => {
    try {
      return JSON.stringify(value || {})
    } catch {
      return '{}'
    }
  }

  watch(
    () => props.modelValue,
    (value) => {
      const next = safeParse(value)
      const nextSnapshot = snapshotOf(next)
      if (nextSnapshot === lastSnapshot) return

      syncingFromParent = true
      Object.keys(localModel).forEach((key) => delete localModel[key])
      Object.assign(localModel, next)
      lastSnapshot = nextSnapshot
      syncingFromParent = false
    },
    { immediate: true, deep: true }
  )

  watch(
    localModel,
    () => {
      if (syncingFromParent) return

      const next = safeParse(localModel)
      const nextSnapshot = snapshotOf(next)
      if (nextSnapshot === lastSnapshot) return

      lastSnapshot = nextSnapshot
      emit('update:modelValue', next)
    },
    { deep: true }
  )

  const isObjectRoot = computed(
    () => String(props.schema?.type || '') === 'object' && Boolean(props.schema?.properties)
  )

  const requiredKeys = computed(() =>
    Array.isArray(props.schema?.required) ? props.schema.required.map(String) : []
  )

  const orderedKeys = computed(() => {
    const keys = Object.keys(props.schema?.properties || {})
    const uiOrder: any[] = props.uiSchema?.['ui:order'] || props.schema?.['ui:order'] || []
    if (!Array.isArray(uiOrder) || uiOrder.length === 0) return keys

    const ordered: string[] = []
    for (const item of uiOrder) {
      if (item === '*') {
        for (const key of keys) {
          if (!ordered.includes(key)) ordered.push(key)
        }
        continue
      }

      const key = String(item)
      if (keys.includes(key) && !ordered.includes(key)) ordered.push(key)
    }

    for (const key of keys) {
      if (!ordered.includes(key)) ordered.push(key)
    }
    return ordered
  })
</script>

<style lang="scss" scoped>
  .schema-warning {
    margin-bottom: 12px;
  }
</style>
