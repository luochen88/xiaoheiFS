<template>
  <section class="products-pricing" aria-label="套餐价格">
    <div class="products-pricing__grid">
      <article
        v-for="(product, index) in products"
        :key="`${product.name}-${index}`"
        :class="[
          'products-pricing__card',
          { 'is-recommended': product.recommended, 'is-selected': selectedPlan === index }
        ]"
        @mouseenter="onHover?.(index)"
        @click="onSelect?.(index)"
      >
        <span v-if="product.recommended" class="products-pricing__recommended">推荐</span>
        <div class="products-pricing__icon"
          ><ArtSvgIcon :icon="product.icon || 'ri:cloud-line'"
        /></div>
        <h3>{{ product.name }}</h3>
        <p>{{ product.description }}</p>
        <div class="products-pricing__price"
          ><small>￥</small><strong>{{ product.price }}</strong
          ><span>/月</span></div
        >

        <div class="products-pricing__resources">
          <div v-for="resource in product.resources || []" :key="resource.label">
            <span
              ><b>{{ resource.label }}</b
              >{{ resource.value }}</span
            >
            <i><em :style="{ width: `${resource.percent || 0}%` }"></em></i>
          </div>
        </div>

        <ul>
          <li v-for="feature in product.features || []" :key="feature"
            ><ArtSvgIcon icon="ri:check-line" />{{ feature }}</li
          >
        </ul>
        <RouterLink
          :to="product.cta === '立即选购' ? { name: 'PublicBuy' } : { path: '/console' }"
          class="products-pricing__action"
          ><span>{{ product.cta || '立即选购' }}</span
          ><ArtSvgIcon icon="ri:arrow-right-line"
        /></RouterLink>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router'
  type Product = {
    icon?: string
    name?: string
    description?: string
    price?: string
    recommended?: boolean
    cta?: string
    resources?: Array<{ label?: string; value?: string; percent?: number }>
    features?: string[]
  }
  defineProps<{
    products: Product[]
    selectedPlan: number
    onSelect?: (index: number) => void
    onHover?: (index: number) => void
  }>()
</script>

<style lang="scss" scoped>
  .products-pricing {
    max-width: 1240px;
    padding: 0 24px 88px;
    margin: 0 auto;
  }

  .products-pricing__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    align-items: start;
  }

  .products-pricing__card {
    position: relative;
    padding: 25px 20px 20px;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 4px);
    box-shadow: 0 12px 30px color-mix(in srgb, var(--art-gray-900) 6%, transparent);
    transition:
      transform 0.2s ease,
      border-color 0.2s ease;
  }

  .products-pricing__card:hover,
  .products-pricing__card.is-selected {
    border-color: color-mix(in srgb, var(--theme-color) 52%, var(--default-border));
    transform: translateY(-4px);
  }

  .products-pricing__card.is-recommended {
    border-color: var(--theme-color);
  }

  .products-pricing__recommended {
    position: absolute;
    top: 0;
    right: 20px;
    padding: 4px 10px;
    color: var(--el-color-white);
    background: var(--theme-color);
    border-radius: 0 0 calc(var(--custom-radius) / 2 + 2px) calc(var(--custom-radius) / 2 + 2px);
  }

  .products-pricing__icon {
    display: grid;
    place-items: center;
    width: 48px;
    aspect-ratio: 1;
    font-size: 24px;
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 10%, var(--default-box-color));
    border-radius: calc(var(--custom-radius) / 2 + 3px);
  }

  .products-pricing h3 {
    margin: 20px 0 6px;
    font-size: 20px;
    color: var(--art-gray-900);
  }

  .products-pricing p {
    min-height: 40px;
    margin: 0;
    line-height: 1.5;
    color: var(--art-gray-600);
  }

  .products-pricing__price {
    display: flex;
    gap: 3px;
    align-items: baseline;
    margin: 18px 0;
    color: var(--theme-color);
  }

  .products-pricing__price strong {
    font-size: 38px;
    line-height: 1;
  }

  .products-pricing__price small,
  .products-pricing__price span {
    color: var(--art-gray-600);
  }

  .products-pricing__resources {
    display: grid;
    gap: 10px;
    padding: 16px 0;
    border-block: 1px solid var(--default-border);
  }

  .products-pricing__resources span {
    display: flex;
    justify-content: space-between;
    color: var(--art-gray-600);
  }

  .products-pricing__resources b {
    font-weight: 500;
    color: var(--art-gray-800);
  }

  .products-pricing__resources i {
    display: block;
    height: 5px;
    margin-top: 5px;
    overflow: hidden;
    background: var(--art-gray-200);
    border-radius: 99px;
  }

  .products-pricing__resources em {
    display: block;
    height: 100%;
    background: var(--theme-color);
    border-radius: inherit;
  }

  .products-pricing ul {
    display: grid;
    gap: 9px;
    padding: 18px 0;
    margin: 0;
    list-style: none;
  }

  .products-pricing li {
    display: flex;
    gap: 7px;
    align-items: flex-start;
    line-height: 1.4;
    color: var(--art-gray-600);
  }

  .products-pricing li .art-svg-icon {
    flex: 0 0 auto;
    color: var(--art-success);
  }

  .products-pricing__action {
    display: flex;
    gap: 7px;
    align-items: center;
    justify-content: center;
    padding: 11px 14px;
    color: var(--theme-color);
    text-decoration: none;
    border: 1px solid color-mix(in srgb, var(--theme-color) 42%, var(--default-border));
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .is-recommended .products-pricing__action {
    color: var(--el-color-white);
    background: var(--theme-color);
  }

  @media (width <= 1050px) {
    .products-pricing__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (width <= 600px) {
    .products-pricing {
      padding-inline: 18px;
    }

    .products-pricing__grid {
      grid-template-columns: 1fr;
    }
  }
</style>
