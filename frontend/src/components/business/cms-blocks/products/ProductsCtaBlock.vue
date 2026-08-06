<template>
  <section class="products-cta" aria-labelledby="products-cta-title">
    <div class="products-cta__inner">
      <ArtSvgIcon icon="ri:customer-service-2-line" />
      <h2 id="products-cta-title">{{ content.title || '需要定制方案？' }}</h2>
      <p>{{ content.desc || '联系我们的销售团队，为您量身定制企业级云解决方案' }}</p>
      <div class="products-cta__actions">
        <component
          :is="isInternal(content.contact_link) ? RouterLink : 'a'"
          v-bind="linkProps"
          class="products-cta__primary"
        >
          {{ content.contact_text || '联系销售' }}
        </component>
        <a :href="`mailto:${content.email || 'sales@example.com'}`" class="products-cta__secondary">
          <ArtSvgIcon icon="ri:mail-line" />{{ content.email || 'sales@example.com' }}
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router'
  const props = defineProps<{
    content: {
      title?: string
      desc?: string
      contact_text?: string
      contact_link?: string
      email?: string
    }
  }>()
  const isInternal = (url?: string) =>
    String(url || '')
      .trim()
      .startsWith('/')
  const linkProps = computed(() =>
    isInternal(props.content.contact_link)
      ? { to: props.content.contact_link || '/console/tickets' }
      : { href: props.content.contact_link || '#' }
  )
</script>

<style lang="scss" scoped>
  .products-cta {
    padding: 86px 24px 100px;
    background: color-mix(in srgb, var(--theme-color) 8%, var(--default-bg-color));
    border-top: 1px solid color-mix(in srgb, var(--theme-color) 20%, var(--default-border));
  }

  .products-cta__inner {
    max-width: 700px;
    margin: 0 auto;
    text-align: center;
  }

  .products-cta__inner > .art-svg-icon {
    font-size: 36px;
    color: var(--theme-color);
  }

  .products-cta h2 {
    margin: 16px 0 10px;
    font-size: 32px;
    color: var(--art-gray-900);
  }

  .products-cta p {
    margin: 0;
    line-height: 1.7;
    color: var(--art-gray-600);
  }

  .products-cta__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    margin-top: 26px;
  }

  .products-cta__actions a {
    display: inline-flex;
    gap: 7px;
    align-items: center;
    padding: 11px 18px;
    text-decoration: none;
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .products-cta__primary {
    color: var(--el-color-white);
    background: var(--theme-color);
  }

  .products-cta__secondary {
    color: var(--art-gray-800);
    background: var(--default-box-color);
    border: 1px solid var(--default-border);
  }

  @media (width <= 600px) {
    .products-cta {
      padding: 68px 18px 78px;
    }

    .products-cta h2 {
      font-size: 28px;
    }
  }
</style>
