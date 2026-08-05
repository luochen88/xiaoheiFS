<template>
  <ElCard class="price-card art-card-xs" shadow="never">
    <template #header>
      <div class="card-title">价格计算</div>
    </template>

    <ElDescriptions :column="1" border size="small">
      <ElDescriptionsItem label="基础价">
        <strong class="price-value">{{ format(basePrice) }}</strong>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="附加项">
        <strong class="price-value">{{ format(addonPrice) }}</strong>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="周期倍率">
        <strong class="price-value">{{ cycleMultiplier }}x</strong>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="购买数量">
        <strong class="price-value">{{ qty }}</strong>
      </ElDescriptionsItem>
      <ElDescriptionsItem>
        <template #label>
          <span class="total-label">合计</span>
        </template>
        <strong class="price-value total-value">{{ format(total) }}</strong>
      </ElDescriptionsItem>
    </ElDescriptions>
  </ElCard>
</template>

<script setup lang="ts">
  defineOptions({ name: 'PriceCalculator' })

  const props = withDefaults(
    defineProps<{
      basePrice?: number
      addonPrice?: number
      cycleMultiplier?: number
      qty?: number
      currency?: string
    }>(),
    {
      basePrice: 0,
      addonPrice: 0,
      cycleMultiplier: 1,
      qty: 1,
      currency: '¥'
    }
  )

  const total = computed(
    () => (props.basePrice + props.addonPrice) * props.cycleMultiplier * props.qty
  )

  const format = (value: number) => `${props.currency} ${Number(value || 0).toFixed(2)}`
</script>

<style lang="scss" scoped>
  .price-card {
    border-style: dashed;
  }

  .card-title,
  .total-label {
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .price-value {
    display: block;
    font-weight: 600;
    color: var(--art-gray-900);
    text-align: right;
  }

  .total-label,
  .total-value {
    font-size: 16px;
  }

  .total-value {
    color: var(--theme-color);
  }
</style>
