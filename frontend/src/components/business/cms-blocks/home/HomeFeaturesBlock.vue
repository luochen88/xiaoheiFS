<template>
  <section class="home-features" aria-labelledby="home-features-title">
    <header class="home-section-heading">
      <span>{{ content.badge || '核心优势' }}</span>
      <h2 id="home-features-title">{{ content.title || '为什么选择我们的云服务' }}</h2>
      <p>{{ content.desc || '我们提供企业级基础设施，助力您的业务快速增长' }}</p>
    </header>
    <div class="home-features__grid">
      <article
        v-for="(feature, index) in features"
        :key="`${feature.title}-${index}`"
        class="home-features__item"
        @mousemove="(event) => handleFeatureGlow?.(event, index)"
        @mouseleave="() => resetFeatureGlow?.(index)"
      >
        <span class="home-features__icon"
          ><ArtSvgIcon :icon="feature.icon || 'ri:flashlight-line'"
        /></span>
        <h3>{{ feature.title }}</h3>
        <p>{{ feature.description }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
  type Feature = { icon?: string; title?: string; description?: string }
  defineProps<{
    content: { badge?: string; title?: string; desc?: string }
    features: Feature[]
    handleFeatureGlow?: (event: MouseEvent, index: number) => void
    resetFeatureGlow?: (index: number) => void
    registerFeatureBg?: (el: HTMLElement | null, index: number) => void
  }>()
</script>

<style lang="scss" scoped>
  .home-features {
    max-width: 1200px;
    padding: 86px 24px;
    margin: 0 auto;
  }

  .home-section-heading {
    max-width: 720px;
    margin: 0 auto 42px;
    text-align: center;

    > span {
      font-size: 13px;
      font-weight: 700;
      color: var(--theme-color);
    }

    h2 {
      margin: 9px 0 12px;
      font-size: 36px;
      color: var(--art-gray-900);
    }

    p {
      margin: 0;
      color: var(--art-gray-600);
    }
  }

  .home-features__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .home-features__item {
    min-height: 210px;
    padding: 26px;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 4px);
    box-shadow: 0 12px 30px color-mix(in srgb, var(--art-gray-900) 5%, transparent);
    transition:
      border-color 0.2s ease,
      transform 0.2s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--theme-color) 48%, var(--default-border));
      transform: translateY(-4px);
    }

    h3 {
      margin: 18px 0 8px;
      font-size: 18px;
      color: var(--art-gray-900);
    }

    p {
      margin: 0;
      line-height: 1.7;
      color: var(--art-gray-600);
    }
  }

  .home-features__icon {
    display: grid;
    place-items: center;
    width: 46px;
    aspect-ratio: 1;
    font-size: 22px;
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 10%, var(--default-box-color));
    border-radius: calc(var(--custom-radius) / 2 + 3px);
  }

  @media (width <= 800px) {
    .home-features__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (width <= 560px) {
    .home-features {
      padding: 64px 18px;
    }

    .home-section-heading h2 {
      font-size: 28px;
    }

    .home-features__grid {
      grid-template-columns: 1fr;
    }
  }
</style>
