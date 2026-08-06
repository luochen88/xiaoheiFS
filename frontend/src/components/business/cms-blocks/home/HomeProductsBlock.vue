<template>
  <section class="home-products" aria-labelledby="home-products-title">
    <header class="home-section-heading">
      <span>{{ content.badge || '产品系列' }}</span>
      <h2 id="home-products-title">{{ content.title || '满足各种规模需求' }}</h2>
    </header>
    <div class="home-products__grid">
      <article
        v-for="(product, index) in products"
        :key="`${product.title}-${index}`"
        class="home-products__item"
      >
        <div class="home-products__visual"
          ><ArtSvgIcon :icon="product.icon || 'ri:cloud-line'"
        /></div>
        <span>{{ product.tag || '灵活配置' }}</span>
        <h3>{{ product.title }}</h3>
        <p>{{ product.description }}</p>
        <div v-if="product.price" class="home-products__price">￥{{ product.price }}/月起</div>
        <RouterLink to="/products">查看详情 <ArtSvgIcon icon="ri:arrow-right-line" /></RouterLink>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router'
  defineProps<{
    content: { badge?: string; title?: string }
    products: Array<{
      icon?: string
      tag?: string
      title?: string
      description?: string
      price?: string
    }>
  }>()
</script>

<style lang="scss" scoped>
  .home-products {
    padding: 86px 24px;
    background: color-mix(in srgb, var(--default-bg-color) 70%, var(--default-box-color));
    border-block: 1px solid var(--default-border);
  }

  .home-section-heading {
    max-width: 720px;
    margin: 0 auto 42px;
    text-align: center;
  }

  .home-section-heading > span {
    font-size: 13px;
    font-weight: 700;
    color: var(--theme-color);
  }

  .home-section-heading h2 {
    margin: 9px 0 0;
    font-size: 36px;
    color: var(--art-gray-900);
  }

  .home-products__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .home-products__item {
    padding: 26px;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 4px);
    box-shadow: 0 12px 30px color-mix(in srgb, var(--art-gray-900) 5%, transparent);

    > span {
      display: inline-block;
      margin-top: 22px;
      font-size: 12px;
      color: var(--theme-color);
    }

    h3 {
      margin: 8px 0;
      font-size: 20px;
      color: var(--art-gray-900);
    }

    p {
      min-height: 48px;
      margin: 0;
      line-height: 1.7;
      color: var(--art-gray-600);
    }

    .home-products__price {
      margin-top: 14px;
      font-size: 18px;
      font-weight: 700;
      color: var(--theme-color);
    }

    a {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      margin-top: 20px;
      color: var(--theme-color);
      text-decoration: none;
    }
  }

  .home-products__visual {
    display: grid;
    place-items: center;
    width: 58px;
    aspect-ratio: 1;
    font-size: 28px;
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 10%, var(--default-box-color));
    border-radius: calc(var(--custom-radius) / 2 + 4px);
  }

  @media (width <= 700px) {
    .home-products {
      padding: 64px 18px;
    }

    .home-section-heading h2 {
      font-size: 28px;
    }

    .home-products__grid {
      grid-template-columns: 1fr;
    }
  }
</style>
