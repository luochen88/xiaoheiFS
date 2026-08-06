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
    range?: string[]
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
  const texts: Record<string, string> = {
    'systemImage.search.keyword': '关键词',
    'systemImage.search.keywordPlaceholder': '按名称或镜像 ID 搜索',
    'systemImage.search.status': '状态',
    'systemImage.search.statusPlaceholder': '请选择状态',
    'systemImage.status.enabled': '启用',
    'systemImage.status.disabled': '停用'
  }
  const t = (key: string) => texts[key] || key

  const formData = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const formItems = computed(() => [
    {
      label: t('systemImage.search.keyword'),
      key: 'keyword',
      type: 'input',
      props: {
        clearable: true,
        placeholder: t('systemImage.search.keywordPlaceholder')
      }
    },
    {
      label: t('systemImage.search.status'),
      key: 'status',
      type: 'select',
      props: {
        clearable: true,
        placeholder: t('systemImage.search.statusPlaceholder'),
        options: [
          { label: t('systemImage.status.enabled'), value: 'enabled' },
          { label: t('systemImage.status.disabled'), value: 'disabled' }
        ]
      }
    },
    {
      label: '日期范围',
      key: 'range',
      type: 'daterange',
      props: {
        type: 'daterange',
        clearable: true,
        rangeSeparator: '至',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        valueFormat: 'YYYY-MM-DD'
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
