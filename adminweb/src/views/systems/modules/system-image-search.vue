<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    :showExpand="false"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  interface SystemImageSearchForm {
    keyword: string
    status?: string
  }

  interface Props {
    modelValue: SystemImageSearchForm
  }

  interface Emits {
    (e: 'update:modelValue', value: SystemImageSearchForm): void
    (e: 'search', params: SystemImageSearchForm): void
    (e: 'reset'): void
  }

  defineOptions({ name: 'SystemImageSearch' })

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const rules = {}

  const formData = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const formItems = computed(() => [
    {
      label: 'Keyword',
      key: 'keyword',
      type: 'input',
      props: {
        clearable: true,
        placeholder: 'Search by image id or name'
      }
    },
    {
      label: 'Status',
      key: 'status',
      type: 'select',
      props: {
        clearable: true,
        placeholder: 'Select status',
        options: [
          { label: 'Enabled', value: 'enabled' },
          { label: 'Disabled', value: 'disabled' }
        ]
      }
    }
  ])

  function handleReset() {
    emit('reset')
  }

  async function handleSearch(params: Record<string, any>) {
    await searchBarRef.value.validate()
    emit('search', params as SystemImageSearchForm)
  }
</script>
