<template>
  <section class="products-hero" aria-labelledby="products-hero-title">
    <span class="products-hero__badge"><i></i>{{ content.badge || '灵活配置，按需选择' }}</span>
    <h1 id="products-hero-title">{{ content.title || '选择最适合您的云服务方案' }}</h1>
    <p>{{
      content.subtitle ||
      '从入门到企业级，我们提供全面的云服务器解决方案。所有套餐均包含 99.99% SLA 保障。'
    }}</p>
    <ul>
      <li v-for="feature in content.features || []" :key="feature"
        ><ArtSvgIcon icon="ri:checkbox-circle-line" />{{ feature }}</li
      >
    </ul>
  </section>
</template>

<script setup lang="ts">
  defineProps<{
    content: { badge?: string; title?: string; subtitle?: string; features?: string[] }
  }>()
</script>

<style lang="scss" scoped>
  .products-hero {
    max-width: 960px;
    padding: 88px 24px 56px;
    margin: 0 auto;
    text-align: center;
  }

  .products-hero__badge {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    padding: 7px 13px;
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 10%, var(--default-box-color));
    border: 1px solid color-mix(in srgb, var(--theme-color) 28%, var(--default-border));
    border-radius: calc(var(--custom-radius) / 2 + 4px);
  }

  .products-hero__badge i {
    width: 7px;
    height: 7px;
    background: var(--art-success);
    border-radius: 50%;
  }

  .products-hero h1 {
    margin: 24px 0 16px;
    font-size: 50px;
    line-height: 1.12;
    color: var(--art-gray-900);
  }

  .products-hero p {
    max-width: 680px;
    margin: 0 auto;
    font-size: 17px;
    line-height: 1.75;
    color: var(--art-gray-600);
  }

  .products-hero ul {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
    padding: 0;
    margin: 30px 0 0;
    color: var(--art-gray-600);
    list-style: none;
  }

  .products-hero li {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }

  .products-hero li .art-svg-icon {
    color: var(--art-success);
  }

  @media (width <= 640px) {
    .products-hero {
      padding: 58px 18px 36px;
    }

    .products-hero h1 {
      font-size: 38px;
    }
  }
</style>
