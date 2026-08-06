<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    :isExpand="true"
    :showExpand="false"
    @reset="handleReset"
    @search="handleSearch"
  >
    <template #advanced>
      <ElPopover trigger="click" placement="bottom-start">
        <template #reference>
          <ElButton>高级筛选</ElButton>
        </template>
        <span>无高级筛选项</span>
      </ElPopover>
    </template>
  </ArtSearchBar>
</template>

<script setup lang="ts">
  interface UserSearchForm {
    keyword: string
    status?: string
    range?: string[]
  }

  interface Props {
    modelValue: UserSearchForm
  }

  interface Emits {
    (e: 'update:modelValue', value: UserSearchForm): void
    (e: 'search', params: UserSearchForm): void
    (e: 'reset'): void
  }

  defineOptions({ name: 'UserSearch' })

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const rules = {}
  const statusOptions = ref([
    { label: 'active', value: 'active' },
    { label: 'blocked', value: 'blocked' }
  ])

  const formData = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: {
        clearable: true,
        placeholder: '按用户名或邮箱搜索'
      }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        clearable: true,
        placeholder: '请选择状态',
        options: statusOptions.value
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
    },
    {
      label: '',
      key: 'advanced',
      type: 'input'
    }
  ])

  function handleReset() {
    emit('reset')
  }

  async function handleSearch(params: Record<string, any>) {
    await searchBarRef.value.validate()
    emit('search', params as UserSearchForm)
  }
</script>
