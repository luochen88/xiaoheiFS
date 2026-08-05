<template>
  <section class="home-hero" aria-labelledby="home-hero-title">
    <div class="home-hero__grid">
      <div class="home-hero__copy">
        <span class="home-hero__badge"><i></i>{{ heroContent.badge || '下一代云计算平台' }}</span>
        <h1 id="home-hero-title">
          <span>{{ heroContent.title1 || '构建未来' }}</span>
          <span class="home-hero__typewriter"
            >{{ typewriterText || '\u00a0' }}<b aria-hidden="true">|</b></span
          >
        </h1>
        <p>{{
          heroContent.subtitle ||
          '企业级云服务器，全球节点覆盖，99.99% SLA 保障。秒级部署，弹性扩展，为您的业务保驾护航。'
        }}</p>
        <div class="home-hero__actions">
          <RouterLink
            :to="heroContent.primary_button_link || '/register'"
            class="home-hero__primary"
          >
            <span>{{ heroContent.primary_button_text || '立即开始' }}</span>
            <ArtSvgIcon icon="ri:arrow-right-line" />
          </RouterLink>
          <RouterLink
            :to="heroContent.secondary_button_link || '/products'"
            class="home-hero__secondary"
          >
            {{ heroContent.secondary_button_text || '浏览产品' }}
          </RouterLink>
        </div>
        <dl class="home-hero__stats">
          <div v-for="(stat, index) in stats" :key="`${stat.label}-${index}`">
            <dt>{{ animatedStats[index] || stat.value || 0 }}{{ stat.suffix }}</dt>
            <dd>{{ stat.label }}</dd>
          </div>
        </dl>
      </div>

      <div class="home-hero__scene" aria-hidden="true">
        <div class="home-hero__ring home-hero__ring--outer"></div>
        <div class="home-hero__ring home-hero__ring--inner"></div>
        <div class="home-hero__server">
          <div v-for="unit in 4" :key="unit" class="home-hero__server-unit">
            <span></span><span></span><span></span>
            <small>SERVER {{ unit }}</small>
          </div>
        </div>
        <div
          v-for="(card, index) in heroCards.slice(0, 3)"
          :key="`${card.title}-${index}`"
          :class="`home-hero__float home-hero__float--${index + 1}`"
          @mousemove="(event) => handleTilt?.(event, `card${index + 1}`)"
          @mouseleave="() => resetTilt?.(`card${index + 1}`)"
        >
          <ArtSvgIcon :icon="['ri:flashlight-line', 'ri:global-line', 'ri:layers-line'][index]" />
          <span
            ><b>{{ card.title || ['极速部署', '全球网络', '多层防护'][index] }}</b
            ><small>{{
              card.desc || ['60秒开机', '覆盖150+国家', 'DDoS 防御'][index]
            }}</small></span
          >
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router'

  interface HeroContent {
    badge?: string
    title1?: string
    subtitle?: string
    primary_button_text?: string
    primary_button_link?: string
    secondary_button_text?: string
    secondary_button_link?: string
  }

  type Stat = { value: number | string; suffix?: string; label?: string }
  type HeroCard = { title?: string; desc?: string }

  defineProps<{
    heroContent: HeroContent
    typewriterText: string
    stats: Stat[]
    animatedStats: string[]
    heroCards: HeroCard[]
    handleTilt?: (event: MouseEvent, cardName: string) => void
    resetTilt?: (cardName: string) => void
  }>()
</script>

<style lang="scss" scoped>
  .home-hero {
    position: relative;
    max-width: 1280px;
    min-height: 660px;
    padding: 86px 24px 72px;
    margin: 0 auto;

    &__grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(360px, 0.9fr);
      gap: 72px;
      align-items: center;
    }

    &__copy {
      position: relative;
      z-index: 1;
    }

    &__badge {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      padding: 8px 14px;
      color: var(--theme-color);
      background: color-mix(in srgb, var(--theme-color) 10%, var(--default-box-color));
      border: 1px solid color-mix(in srgb, var(--theme-color) 28%, var(--default-border));
      border-radius: calc(var(--custom-radius) / 2 + 4px);

      i {
        width: 7px;
        height: 7px;
        background: var(--art-success);
        border-radius: 50%;
      }
    }

    h1 {
      max-width: 700px;
      margin: 26px 0 20px;
      font-size: 62px;
      font-weight: 760;
      line-height: 1.08;
      color: var(--art-gray-900);
      letter-spacing: 0;
    }

    &__typewriter {
      display: block;
      min-height: 1.08em;
      color: var(--theme-color);

      b {
        font-weight: 400;
        color: var(--art-gray-500);
        animation: home-blink 1s step-end infinite;
      }
    }

    p {
      max-width: 620px;
      margin: 0;
      font-size: 18px;
      line-height: 1.75;
      color: var(--art-gray-600);
    }

    &__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 32px;

      a {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        min-height: 44px;
        padding: 0 20px;
        text-decoration: none;
        border-radius: calc(var(--custom-radius) / 2 + 2px);
      }
    }

    &__primary {
      color: var(--el-color-white);
      background: var(--theme-color);
    }

    &__secondary {
      color: var(--art-gray-800);
      background: var(--default-box-color);
      border: 1px solid var(--default-border);
    }

    &__stats {
      display: flex;
      flex-wrap: wrap;
      gap: 28px;
      padding: 0;
      margin: 54px 0 0;

      div {
        min-width: 110px;
      }

      dt {
        font-size: 26px;
        font-weight: 720;
        color: var(--art-gray-900);
      }

      dd {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--art-gray-600);
      }
    }

    &__scene {
      position: relative;
      justify-self: end;
      width: min(100%, 510px);
      aspect-ratio: 1;
    }

    &__ring {
      position: absolute;
      inset: 12%;
      border: 1px dashed color-mix(in srgb, var(--theme-color) 34%, var(--default-border));
      border-radius: 50%;
      transform: rotate(-22deg);

      &--inner {
        inset: 26%;
        border-style: solid;
        opacity: 0.55;
        transform: rotate(18deg);
      }
    }

    &__server {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 210px;
      padding: 16px;
      background: var(--default-box-color);
      border: 1px solid color-mix(in srgb, var(--theme-color) 26%, var(--default-border));
      border-radius: calc(var(--custom-radius) / 2 + 5px);
      box-shadow: 0 24px 64px color-mix(in srgb, var(--art-gray-900) 14%, transparent);
      transform: translate(-50%, -50%) rotate(-8deg);
    }

    &__server-unit {
      display: grid;
      grid-template-columns: 8px 8px 8px 1fr;
      gap: 5px;
      align-items: center;
      padding: 10px 8px;
      margin: 5px 0;
      background: color-mix(in srgb, var(--theme-color) 6%, var(--default-box-color));
      border: 1px solid var(--default-border);
      border-radius: 4px;

      span {
        width: 5px;
        height: 5px;
        background: var(--art-success);
        border-radius: 50%;

        &:nth-child(2) {
          background: var(--theme-color);
        }

        &:nth-child(3) {
          background: var(--art-warning);
        }
      }

      small {
        font-size: 8px;
        color: var(--art-gray-600);
      }
    }

    &__float {
      position: absolute;
      display: flex;
      gap: 10px;
      align-items: center;
      min-width: 144px;
      padding: 12px 14px;
      color: var(--art-gray-800);
      background: var(--default-box-color);
      border: 1px solid var(--default-border);
      border-radius: calc(var(--custom-radius) / 2 + 2px);
      box-shadow: 0 16px 32px color-mix(in srgb, var(--art-gray-900) 10%, transparent);
      transition: transform 0.18s ease;

      > .art-svg-icon {
        color: var(--theme-color);
      }

      span {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      b {
        font-size: 13px;
      }

      small {
        color: var(--art-gray-600);
      }

      &--1 {
        top: 12%;
        left: 0;
      }

      &--2 {
        top: 42%;
        right: 0;
      }

      &--3 {
        bottom: 12%;
        left: 6%;
      }
    }
  }

  @keyframes home-blink {
    50% {
      opacity: 0;
    }
  }

  @media (width <= 900px) {
    .home-hero {
      min-height: 0;

      &__grid {
        grid-template-columns: 1fr;
      }

      &__scene {
        display: none;
      }
    }
  }

  @media (width <= 640px) {
    .home-hero {
      padding: 56px 18px 54px;

      h1 {
        font-size: 42px;
      }

      p {
        font-size: 16px;
      }

      &__stats {
        gap: 18px;
        margin-top: 38px;
      }
    }
  }
</style>
