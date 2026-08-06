<template>
  <div class="maintenance-page">
    <div class="maintenance-page__visual" aria-hidden="true">
      <div><ArtSvgIcon icon="ri:tools-line" /></div>
      <span></span><span></span><span></span>
    </div>
    <div class="maintenance-page__content">
      <h1>系统维护中</h1>
      <p>{{ displayMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useSiteStore } from '@/stores/site'

  defineOptions({ name: 'PublicMaintenance' })

  const props = defineProps<{ message?: string }>()
  const siteStore = useSiteStore()
  const displayMessage = computed(
    () => props.message || siteStore.maintenanceMessage || '系统正在进行维护，请稍后再试'
  )
</script>

<style lang="scss" scoped>
  .maintenance-page {
    display: grid;
    grid-template-columns: minmax(280px, 0.8fr) minmax(0, 1.2fr);
    gap: 64px;
    align-items: center;
    max-width: 980px;
    min-height: calc(100vh - 66px);
    padding: 64px 24px;
    margin: 0 auto;
    background: var(--default-bg-color);

    &__visual {
      position: relative;
      display: grid;
      place-items: center;
      justify-self: center;
      width: min(100%, 340px);
      aspect-ratio: 1;
      background: color-mix(in srgb, var(--theme-color) 7%, var(--default-box-color));
      border: 1px solid color-mix(in srgb, var(--theme-color) 24%, var(--default-border));
      border-radius: 50%;

      > div {
        display: grid;
        place-items: center;
        width: 112px;
        aspect-ratio: 1;
        font-size: 50px;
        color: var(--el-color-white);
        background: var(--theme-color);
        border-radius: calc(var(--custom-radius) / 2 + 8px);
        animation: maintenance-float 2.4s ease-in-out infinite;
      }

      > span {
        position: absolute;
        width: 14px;
        aspect-ratio: 1;
        background: var(--art-success);
        border-radius: 50%;
        animation: maintenance-pulse 1.5s ease-in-out infinite;

        &:nth-of-type(1) {
          top: 17%;
          left: 18%;
        }

        &:nth-of-type(2) {
          right: 12%;
          bottom: 28%;
          animation-delay: 0.25s;
        }

        &:nth-of-type(3) {
          bottom: 11%;
          left: 30%;
          animation-delay: 0.5s;
        }
      }
    }

    &__eyebrow {
      font-size: 13px;
      font-weight: 700;
      color: var(--theme-color);
    }

    h1 {
      margin: 12px 0 16px;
      font-size: 46px;
      color: var(--art-gray-900);
      letter-spacing: 0;
    }

    p {
      max-width: 560px;
      margin: 0;
      font-size: 17px;
      line-height: 1.75;
      color: var(--art-gray-600);
    }

    &__status {
      display: inline-flex;
      gap: 9px;
      align-items: center;
      padding: 10px 14px;
      margin-top: 28px;
      color: var(--art-gray-700);
      background: var(--default-box-color);
      border: 1px solid var(--default-border);
      border-radius: calc(var(--custom-radius) / 2 + 2px);

      i {
        width: 8px;
        height: 8px;
        background: var(--art-warning);
        border-radius: 50%;
      }
    }
  }

  @keyframes maintenance-float {
    50% {
      transform: translateY(-9px);
    }
  }

  @keyframes maintenance-pulse {
    50% {
      opacity: 0.35;
      transform: scale(0.75);
    }
  }

  @media (width <= 720px) {
    .maintenance-page {
      grid-template-columns: 1fr;
      gap: 38px;
      text-align: center;

      &__visual {
        width: 250px;
      }

      &__content {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      h1 {
        font-size: 36px;
      }
    }
  }
</style>
