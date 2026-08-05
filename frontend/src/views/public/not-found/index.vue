<template>
  <div class="not-found-page">
    <div class="not-found-page__visual" aria-hidden="true">
      <span>4</span>
      <div><ArtSvgIcon icon="ri:cloud-off-line" /></div>
      <span>4</span>
    </div>
    <span class="not-found-page__eyebrow">PAGE NOT FOUND</span>
    <h1>页面未找到</h1>
    <p>抱歉，您访问的页面不存在、已被移除，或地址输入有误。</p>
    <div class="not-found-page__actions">
      <ElButton type="primary" @click="router.push('/')">
        <ArtSvgIcon icon="ri:home-5-line" />
        <span>返回首页</span>
      </ElButton>
      <ElButton @click="goBack">
        <ArtSvgIcon icon="ri:arrow-left-line" />
        <span>返回上一页</span>
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'PublicNotFound' })

  const router = useRouter()
  const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push('/')
  }
</script>

<style lang="scss" scoped>
  .not-found-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 66px);
    padding: 64px 24px;
    text-align: center;
    background: var(--default-bg-color);

    &__visual {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 28px;

      > span {
        font-size: 112px;
        font-weight: 780;
        line-height: 1;
        color: var(--art-gray-900);
      }

      > div {
        display: grid;
        place-items: center;
        width: 108px;
        aspect-ratio: 1;
        margin-inline: 8px;
        font-size: 48px;
        color: var(--theme-color);
        background: color-mix(in srgb, var(--theme-color) 9%, var(--default-box-color));
        border: 1px solid color-mix(in srgb, var(--theme-color) 26%, var(--default-border));
        border-radius: 50%;
      }
    }

    &__eyebrow {
      font-size: 13px;
      font-weight: 700;
      color: var(--theme-color);
    }

    h1 {
      margin: 10px 0 12px;
      font-size: 36px;
      color: var(--art-gray-900);
      letter-spacing: 0;
    }

    p {
      max-width: 540px;
      margin: 0;
      line-height: 1.7;
      color: var(--art-gray-600);
    }

    &__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
      margin-top: 28px;
    }
  }

  @media (width <= 560px) {
    .not-found-page {
      &__visual {
        > span {
          font-size: 72px;
        }

        > div {
          width: 74px;
          font-size: 34px;
        }
      }
    }
  }
</style>
