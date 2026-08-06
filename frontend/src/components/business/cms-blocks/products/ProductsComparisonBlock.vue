<template>
  <section class="products-comparison" aria-labelledby="products-comparison-title">
    <div class="products-comparison__inner">
      <h2 id="products-comparison-title">{{ content.title || '详细配置对比' }}</h2>
      <div class="products-comparison__table" role="table">
        <div class="products-comparison__row products-comparison__row--head" role="row">
          <span>配置项</span
          ><span v-for="product in products" :key="product.name">{{ product.name }}</span>
        </div>
        <div v-for="row in rows" :key="row.feature" class="products-comparison__row" role="row">
          <b>{{ row.feature }}</b
          ><span v-for="(product, index) in products" :key="product.name">{{
            row.values?.[index] || '-'
          }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  defineProps<{
    content: { title?: string }
    products: Array<{ name?: string }>
    rows: Array<{ feature?: string; values?: string[] }>
  }>()
</script>

<style lang="scss" scoped>
  .products-comparison {
    padding: 0 24px 88px;
  }

  .products-comparison__inner {
    max-width: 1120px;
    margin: 0 auto;
  }

  .products-comparison h2 {
    margin: 0 0 28px;
    font-size: 30px;
    color: var(--art-gray-900);
    text-align: center;
  }

  .products-comparison__table {
    overflow: auto;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 4px);
  }

  .products-comparison__row {
    display: grid;
    grid-template-columns: 1.2fr repeat(4, minmax(120px, 1fr));
    min-width: 650px;
    border-top: 1px solid var(--default-border);
  }

  .products-comparison__row:first-child {
    border-top: 0;
  }

  .products-comparison__row > * {
    padding: 14px 16px;
    color: var(--art-gray-600);
  }

  .products-comparison__row > b,
  .products-comparison__row--head > * {
    font-weight: 650;
    color: var(--art-gray-800);
  }

  .products-comparison__row--head {
    background: color-mix(in srgb, var(--theme-color) 8%, var(--default-box-color));
  }

  @media (width <= 640px) {
    .products-comparison {
      padding-inline: 18px;
    }
  }
</style>
