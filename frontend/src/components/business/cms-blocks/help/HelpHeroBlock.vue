<template>
  <section class="help-hero" aria-labelledby="help-hero-title">
    <div class="help-hero__inner">
      <div class="help-hero__copy">
        <div class="help-hero__badge">
          <ArtSvgIcon icon="ri:lightbulb-flash-line" />
          <span>{{ resolved.badge }}</span>
        </div>

        <h1 id="help-hero-title" class="help-hero__title">
          {{ resolved.title_main }}
          <span>{{ resolved.title_gradient }}</span>
        </h1>
        <p class="help-hero__subtitle">{{ resolved.subtitle }}</p>

        <ElInput
          v-model="queryModel"
          class="help-hero__search"
          size="large"
          clearable
          :placeholder="resolved.search_placeholder"
          aria-label="搜索帮助内容"
        >
          <template #prefix>
            <ArtSvgIcon icon="ri:search-line" />
          </template>
        </ElInput>
      </div>

      <div class="help-hero__visual" aria-hidden="true">
        <div class="help-hero__visual-mark">
          <ArtSvgIcon icon="ri:customer-service-2-line" />
        </div>
        <div class="help-hero__signal help-hero__signal--one">
          <ArtSvgIcon icon="ri:question-answer-line" />
        </div>
        <div class="help-hero__signal help-hero__signal--two">
          <ArtSvgIcon icon="ri:book-open-line" />
        </div>
        <div class="help-hero__signal help-hero__signal--three">
          <ArtSvgIcon icon="ri:shield-check-line" />
        </div>
      </div>
    </div>

    <dl class="help-hero__stats">
      <div v-for="stat in resolved.quick_stats" :key="`${stat.value}-${stat.label}`">
        <dt>{{ stat.value }}</dt>
        <dd>{{ stat.label }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup lang="ts">
  type StatItem = { value: string; label: string }

  const props = defineProps<{
    content?: Record<string, unknown>
    searchQuery: string
  }>()

  const emit = defineEmits<{
    (event: 'update:searchQuery', value: string): void
  }>()

  const queryModel = computed({
    get: () => props.searchQuery,
    set: (value: string) => emit('update:searchQuery', value)
  })

  const resolved = computed(() => {
    const content = props.content || {}
    const stats: StatItem[] = Array.isArray(content.quick_stats)
      ? content.quick_stats.map((item: any) => ({
          value: String(item?.value ?? ''),
          label: String(item?.label ?? '')
        }))
      : []

    const fallbackStats: StatItem[] = [
      { value: '100+', label: '常见问题' },
      { value: '24/7', label: '在线支持' },
      { value: '<5m', label: '平均响应' },
      { value: '99.9%', label: '满意度' }
    ]

    return {
      badge: String(content.badge ?? '帮助中心'),
      title_main: String(content.title_main ?? '我们能为您'),
      title_gradient: String(content.title_gradient ?? '做些什么？'),
      subtitle: String(content.subtitle ?? '快速找到您需要的答案，或联系我们的专业团队获取支持'),
      search_placeholder: String(content.search_placeholder ?? '搜索问题、关键词...'),
      quick_stats: stats.length > 0 ? stats : fallbackStats
    }
  })
</script>

<style lang="scss" scoped>
  .help-hero {
    position: relative;
    max-width: 1200px;
    padding: 76px 24px 28px;
    margin: 0 auto;

    &::before {
      position: absolute;
      inset: 24px 5% auto;
      height: 360px;
      pointer-events: none;
      content: '';
      background: radial-gradient(
        circle at center,
        color-mix(in srgb, var(--theme-color) 16%, transparent),
        transparent 68%
      );
    }

    &__inner {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
      gap: 64px;
      align-items: center;
    }

    &__copy {
      max-width: 720px;
    }

    &__badge {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      padding: 7px 12px;
      margin-bottom: 20px;
      font-size: 14px;
      color: var(--theme-color);
      background: color-mix(in srgb, var(--theme-color) 10%, var(--default-box-color));
      border: 1px solid color-mix(in srgb, var(--theme-color) 28%, var(--default-border));
      border-radius: calc(var(--custom-radius) / 2 + 4px);
    }

    &__title {
      max-width: 680px;
      margin: 0;
      font-size: 52px;
      font-weight: 750;
      line-height: 1.14;
      color: var(--art-gray-900);
      letter-spacing: 0;

      span {
        display: block;
        color: var(--theme-color);
      }
    }

    &__subtitle {
      max-width: 620px;
      margin: 20px 0 28px;
      font-size: 17px;
      line-height: 1.75;
      color: var(--art-gray-600);
    }

    &__search {
      width: min(100%, 590px);
    }

    &__visual {
      position: relative;
      justify-self: end;
      width: min(100%, 360px);
      aspect-ratio: 1;
      border: 1px solid var(--art-card-border);
      border-radius: 50%;
      box-shadow: 0 24px 64px color-mix(in srgb, var(--art-gray-900) 10%, transparent);
    }

    &__visual::before,
    &__visual::after {
      position: absolute;
      content: '';
      border: 1px dashed color-mix(in srgb, var(--theme-color) 32%, var(--default-border));
      border-radius: 50%;
    }

    &__visual::before {
      inset: 12%;
    }

    &__visual::after {
      inset: 28%;
    }

    &__visual-mark {
      position: absolute;
      top: 50%;
      left: 50%;
      display: grid;
      place-items: center;
      width: 104px;
      aspect-ratio: 1;
      font-size: 44px;
      color: var(--el-color-white);
      background: var(--theme-color);
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }

    &__signal {
      position: absolute;
      display: grid;
      place-items: center;
      width: 48px;
      aspect-ratio: 1;
      font-size: 22px;
      color: var(--theme-color);
      background: var(--default-box-color);
      border: 1px solid var(--default-border);
      border-radius: calc(var(--custom-radius) / 2 + 6px);
      box-shadow: 0 12px 32px color-mix(in srgb, var(--art-gray-900) 9%, transparent);
    }

    &__signal--one {
      top: 8%;
      left: 18%;
    }

    &__signal--two {
      top: 31%;
      right: 2%;
    }

    &__signal--three {
      bottom: 8%;
      left: 24%;
    }

    &__stats {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      max-width: 760px;
      padding: 0;
      margin: 52px 0 0;

      div {
        padding: 0 20px;
        border-left: 1px solid var(--default-border);
      }

      div:first-child {
        padding-left: 0;
        border-left: 0;
      }

      dt {
        font-size: 24px;
        font-weight: 700;
        color: var(--art-gray-900);
      }

      dd {
        margin: 3px 0 0;
        font-size: 13px;
        color: var(--art-gray-600);
      }
    }
  }

  @media (width <= 900px) {
    .help-hero {
      &__inner {
        grid-template-columns: 1fr;
      }

      &__visual {
        display: none;
      }
    }
  }

  @media (width <= 640px) {
    .help-hero {
      padding: 48px 18px 20px;

      &__title {
        font-size: 36px;
      }

      &__stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 24px 0;
        margin-top: 36px;

        div:nth-child(3) {
          padding-left: 0;
          border-left: 0;
        }
      }
    }
  }
</style>
