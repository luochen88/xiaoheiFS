<template>
  <ArtStatusTag :status="status" :text-map="textMap" />
</template>

<script setup lang="ts">
  import ArtStatusTag from '../art-status-tag/index.vue'

  defineOptions({ name: 'OrderStatusBadge' })

  withDefaults(
    defineProps<{
      status?: string
    }>(),
    {
      status: ''
    }
  )

  const textMap = {
    draft: '草稿',
    pending_payment: '待支付',
    pending_review: '待审核',
    approved: '已通过',
    provisioning: '开通中',
    active: '已完成',
    rejected: '已驳回',
    canceled: '已取消',
    failed: '失败'
  }
</script>
