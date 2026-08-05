<template>
  <template v-if="isObject">
    <ElCard class="object-card" shadow="never">
      <template #header>
        <div class="object-title">
          <span>{{ title }}</span>
          <span v-if="description" class="object-description">{{ description }}</span>
        </div>
      </template>

      <div class="object-grid">
        <component
          :is="recursiveField"
          v-for="key in orderedKeys"
          :key="key"
          :schema="schema.properties[key]"
          :path="[...path, key]"
          :model="model"
          :required="requiredKeys.includes(key)"
          :ui="ui?.[key]"
        />
      </div>
    </ElCard>
  </template>

  <ElFormItem v-else :required="required" class="field-item">
    <template #label>
      <span class="field-label">{{ title }}</span>
    </template>

    <div class="field-control">
      <ElSelect
        v-if="hasEnum"
        :model-value="value"
        :placeholder="placeholder"
        clearable
        @update:model-value="setValue"
      >
        <ElOption
          v-for="(option, index) in schema.enum"
          :key="String(option)"
          :label="enumLabel(index, option)"
          :value="option"
        />
      </ElSelect>

      <ElSwitch
        v-else-if="isBoolean"
        :model-value="Boolean(value)"
        @update:model-value="setValue"
      />

      <ElInputNumber
        v-else-if="isNumber"
        :model-value="value"
        :placeholder="placeholder"
        class="full-width"
        @update:model-value="setValue"
      />

      <ElInput
        v-else
        :model-value="value"
        :type="isSecret ? 'password' : 'text'"
        :placeholder="placeholder"
        autocomplete="off"
        @update:model-value="setValue"
      />

      <div v-if="description" class="field-description">{{ description }}</div>
    </div>
  </ElFormItem>
</template>

<script setup lang="ts">
  defineOptions({ name: 'JsonSchemaField' })

  const props = defineProps<{
    schema: any
    path: string[]
    model: Record<string, any>
    required?: boolean
    ui?: any
  }>()

  const recursiveField = getCurrentInstance()?.type
  const title = computed(() =>
    String(props.schema?.title || props.path[props.path.length - 1] || '')
  )
  const description = computed(() => String(props.schema?.description || ''))

  const requiredKeys = computed(() =>
    Array.isArray(props.schema?.required) ? props.schema.required.map(String) : []
  )

  const orderedKeys = computed(() => {
    const keys = Object.keys(props.schema?.properties || {})
    const uiOrder: any[] = props.ui?.['ui:order'] || props.schema?.['ui:order'] || []
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

  const isObject = computed(
    () => String(props.schema?.type || '') === 'object' && Boolean(props.schema?.properties)
  )
  const hasEnum = computed(() => Array.isArray(props.schema?.enum) && props.schema.enum.length > 0)
  const isBoolean = computed(() => String(props.schema?.type || '') === 'boolean')
  const isNumber = computed(() => ['number', 'integer'].includes(String(props.schema?.type || '')))
  const isSecret = computed(() => {
    const format = String(props.schema?.format || '')
      .trim()
      .toLowerCase()
    return format === 'password' || props.schema?.['x-secret'] === true
  })

  const placeholder = computed(() => {
    if (isSecret.value) return '留空表示不修改'
    return String(props.schema?.placeholder || props.schema?.description || '')
  })

  const getPathValue = (root: any, path: string[]) => {
    let current = root
    for (const key of path) {
      if (current == null || typeof current !== 'object') return undefined
      current = current[key]
    }
    return current
  }

  const setPathValue = (root: any, path: string[], nextValue: any) => {
    if (!root || typeof root !== 'object') return

    let current = root
    for (let index = 0; index < path.length - 1; index += 1) {
      const key = path[index]
      if (current[key] == null || typeof current[key] !== 'object') current[key] = {}
      current = current[key]
    }
    current[path[path.length - 1]] = nextValue
  }

  const value = computed(() => getPathValue(props.model, props.path))

  const setValue = (nextValue: any) => {
    let normalizedValue = nextValue
    if (isSecret.value && (normalizedValue === undefined || normalizedValue === null)) {
      normalizedValue = ''
    }
    setPathValue(props.model, props.path, normalizedValue)
  }

  const enumLabel = (index: number, option: any) => {
    const names = Array.isArray(props.schema?.enumNames) ? props.schema.enumNames : []
    const optionTitle = names[index]
    if (optionTitle != null && String(optionTitle).trim() !== '') return String(optionTitle)
    return String(option)
  }
</script>

<style lang="scss" scoped>
  .object-card {
    background: var(--default-box-color);
    border-color: var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .object-title {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .object-description,
  .field-description {
    font-size: 12px;
    font-weight: 400;
    color: var(--art-gray-600);
  }

  .object-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }

  .field-item {
    margin-bottom: 12px;
  }

  .field-label {
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .field-control,
  .full-width {
    width: 100%;
  }

  .field-description {
    margin-top: 4px;
    line-height: 1.5;
  }
</style>
