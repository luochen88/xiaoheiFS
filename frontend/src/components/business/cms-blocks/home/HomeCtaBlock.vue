<template>
  <section class="home-cta" aria-labelledby="home-cta-title">
    <div class="home-cta__inner">
      <ArtSvgIcon icon="ri:cloud-windy-line" class="home-cta__icon" />
      <h2 id="home-cta-title">{{ content.title || '准备好开启您的云端之旅了吗？' }}</h2>
      <p>{{ content.desc || '立即注册，新用户享受免费试用额度，体验企业级云服务' }}</p>
      <RouterLink :to="content.button_link || '/register'" class="home-cta__button">
        <span>{{ content.button_text || '免费开始使用' }}</span>
        <ArtSvgIcon icon="ri:arrow-right-line" />
      </RouterLink>
      <ul>
        <li v-for="feature in features" :key="feature"
          ><ArtSvgIcon icon="ri:checkbox-circle-line" />{{ feature }}</li
        >
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router'
  defineProps<{
    content: { title?: string; desc?: string; button_text?: string; button_link?: string }
    features: string[]
  }>()
</script>

<style lang="scss" scoped>
  .home-cta {
    padding: 96px 24px;
    background: color-mix(in srgb, var(--theme-color) 9%, var(--default-bg-color));
    border-top: 1px solid color-mix(in srgb, var(--theme-color) 20%, var(--default-border));
  }

  .home-cta__inner {
    max-width: 760px;
    margin: 0 auto;
    text-align: center;
  }

  .home-cta__icon {
    font-size: 40px;
    color: var(--theme-color);
  }

  .home-cta h2 {
    margin: 18px 0 12px;
    font-size: 36px;
    color: var(--art-gray-900);
  }

  .home-cta p {
    margin: 0;
    line-height: 1.7;
    color: var(--art-gray-600);
  }

  .home-cta__button {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    padding: 13px 22px;
    margin-top: 28px;
    color: var(--el-color-white);
    text-decoration: none;
    background: var(--theme-color);
    border-radius: calc(var(--custom-radius) / 2 + 3px);
  }

  .home-cta ul {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    justify-content: center;
    padding: 0;
    margin: 28px 0 0;
    color: var(--art-gray-600);
    list-style: none;
  }

  .home-cta li {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }

  .home-cta li .art-svg-icon {
    color: var(--art-success);
  }

  @media (width <= 600px) {
    .home-cta {
      padding: 68px 18px;
    }

    .home-cta h2 {
      font-size: 28px;
    }
  }
</style>
