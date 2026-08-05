<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :show-expand="false"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  interface OrderSearchForm {
    keyword?: string
    status?: string
    user_id?: string
    order_no?: string
  }

  const props = defineProps<{ modelValue: OrderSearchForm }>()
  const emit = defineEmits<{
    (event: 'update:modelValue', value: OrderSearchForm): void
    (event: 'search', value: OrderSearchForm): void
    (event: 'reset'): void
  }>()

  defineOptions({ name: 'OrderSearch' })

  const searchBarRef = ref()
  const formData = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const formItems = [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: { clearable: true, placeholder: '按订单 ID 搜索' }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        clearable: true,
        placeholder: '请选择状态',
        options: [
          { label: '待支付', value: 'pending_payment' },
          { label: '待审核', value: 'pending_review' },
          { label: '已通过', value: 'approved' },
          { label: '开通中', value: 'provisioning' },
          { label: '已完成', value: 'active' },
          { label: '失败', value: 'failed' },
          { label: '已驳回', value: 'rejected' }
        ]
      }
    },
    {
      label: '用户 ID',
      key: 'user_id',
      type: 'input',
      props: { clearable: true, placeholder: '请输入用户 ID' }
    },
    {
      label: '订单号',
      key: 'order_no',
      type: 'input',
      props: { clearable: true, placeholder: '请输入订单号' }
    }
  ]

  function handleReset() {
    emit('reset')
  }

  async function handleSearch(params: Record<string, unknown>) {
    await searchBarRef.value?.validate?.()
    emit('search', params as OrderSearchForm)
  }
</script>
