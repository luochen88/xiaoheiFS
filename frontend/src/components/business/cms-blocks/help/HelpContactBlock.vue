<template>
  <section class="help-contact" aria-labelledby="help-contact-title">
    <div class="help-contact__inner">
      <div>
        <span class="help-contact__eyebrow">SUPPORT</span>
        <h2 id="help-contact-title">{{ resolved.title }}</h2>
        <p class="help-contact__description">{{ resolved.description }}</p>

        <div class="help-contact__channels">
          <div
            v-for="channel in resolved.channels"
            :key="channel.key"
            class="help-contact__channel"
          >
            <span><ArtSvgIcon :icon="channel.icon" /></span>
            <div>
              <strong>{{ channel.title }}</strong>
              <small>{{ channel.subtitle }}</small>
            </div>
          </div>
        </div>
      </div>

      <div class="help-contact__cta">
        <ArtSvgIcon icon="ri:rocket-2-line" class="help-contact__cta-icon" />
        <h3>{{ resolved.cta_title }}</h3>
        <p>{{ resolved.cta_desc }}</p>
        <component
          :is="isInternalLink(resolved.cta_url) ? RouterLink : 'a'"
          v-bind="ctaLinkProps"
          class="help-contact__cta-link"
        >
          <span>{{ resolved.cta_button_text }}</span>
          <ArtSvgIcon icon="ri:arrow-right-up-line" />
        </component>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router'

  const props = defineProps<{
    content?: Record<string, unknown>
  }>()

  const iconByKey: Record<string, string> = {
    chat: 'ri:message-3-line',
    mail: 'ri:mail-line',
    tickets: 'ri:customer-service-2-line'
  }

  const resolved = computed(() => {
    const content = props.content || {}
    const channels = Array.isArray(content.channels) ? content.channels : []
    const fallbackChannels = [
      { key: 'chat', title: '在线客服', subtitle: '工作日 9:00 - 18:00' },
      { key: 'mail', title: '邮件支持', subtitle: '24 小时内回复' },
      { key: 'tickets', title: '工单系统', subtitle: '技术问题优先处理' }
    ]

    return {
      title: String(content.title ?? '还有问题？'),
      description: String(content.description ?? '我们的专业支持团队随时准备为您提供帮助'),
      channels: (channels.length ? channels : fallbackChannels).map((item: any) => {
        const key = String(item?.key ?? 'tickets')
        return {
          key,
          title: String(item?.title ?? ''),
          subtitle: String(item?.subtitle ?? ''),
          icon: iconByKey[key] || 'ri:customer-service-2-line'
        }
      }),
      cta_title: String(content.cta_title ?? '立即开始使用'),
      cta_desc: String(content.cta_desc ?? '注册账号，享受专业的云服务'),
      cta_button_text: String(content.cta_button_text ?? '免费注册'),
      cta_url: String(content.cta_url ?? '/register')
    }
  })

  const isInternalLink = (url: string) =>
    String(url || '')
      .trim()
      .startsWith('/')
  const ctaLinkProps = computed(() =>
    isInternalLink(resolved.value.cta_url)
      ? { to: resolved.value.cta_url }
      : { href: resolved.value.cta_url, rel: 'noopener noreferrer' }
  )
</script>

<style lang="scss" scoped>
  .help-contact {
    max-width: 1200px;
    padding: 80px 24px 96px;
    margin: 0 auto;

    &__inner {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
      gap: 72px;
      align-items: center;
    }

    &__eyebrow {
      font-size: 13px;
      font-weight: 700;
      color: var(--theme-color);
    }

    h2 {
      margin: 8px 0 12px;
      font-size: 34px;
      color: var(--art-gray-900);
      letter-spacing: 0;
    }

    &__description {
      margin: 0 0 28px;
      line-height: 1.7;
      color: var(--art-gray-600);
    }

    &__channels {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    &__channel {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      min-width: 0;
      padding: 14px;
      background: var(--default-box-color);
      border: 1px solid var(--default-border);
      border-radius: calc(var(--custom-radius) / 2 + 2px);

      > span {
        flex: 0 0 auto;
        font-size: 20px;
        color: var(--theme-color);
      }

      div {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      strong {
        font-size: 14px;
        color: var(--art-gray-800);
      }

      small {
        line-height: 1.4;
        color: var(--art-gray-600);
        overflow-wrap: anywhere;
      }
    }

    &__cta {
      position: relative;
      padding: 42px;
      overflow: hidden;
      text-align: left;
      background: linear-gradient(
        145deg,
        color-mix(in srgb, var(--theme-color) 12%, var(--default-box-color)),
        var(--default-box-color)
      );
      border: 1px solid color-mix(in srgb, var(--theme-color) 32%, var(--default-border));
      border-radius: calc(var(--custom-radius) / 2 + 6px);

      &::after {
        position: absolute;
        right: -36px;
        bottom: -48px;
        width: 150px;
        aspect-ratio: 1;
        content: '';
        border: 28px solid color-mix(in srgb, var(--theme-color) 10%, transparent);
        border-radius: 50%;
      }

      h3 {
        position: relative;
        z-index: 1;
        margin: 16px 0 8px;
        font-size: 24px;
        color: var(--art-gray-900);
      }

      p {
        position: relative;
        z-index: 1;
        margin: 0 0 24px;
        color: var(--art-gray-600);
      }
    }

    &__cta-icon {
      font-size: 32px;
      color: var(--theme-color);
    }

    &__cta-link {
      position: relative;
      z-index: 1;
      display: inline-flex;
      gap: 8px;
      align-items: center;
      padding: 11px 18px;
      color: var(--el-color-white);
      text-decoration: none;
      background: var(--theme-color);
      border-radius: calc(var(--custom-radius) / 2 + 2px);
    }
  }

  @media (width <= 900px) {
    .help-contact {
      &__inner {
        grid-template-columns: 1fr;
        gap: 40px;
      }
    }
  }

  @media (width <= 640px) {
    .help-contact {
      padding: 60px 18px 72px;

      &__channels {
        grid-template-columns: 1fr;
      }

      &__cta {
        padding: 30px 24px;
      }
    }
  }
</style>
