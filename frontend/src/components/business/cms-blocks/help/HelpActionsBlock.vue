<template>
  <section class="help-actions" aria-label="快捷帮助入口">
    <div class="help-actions__grid">
      <component
        :is="isInternalLink(resolveUrl(card)) ? RouterLink : 'a'"
        v-for="card in resolvedCards"
        :key="card.key"
        v-bind="linkProps(card)"
        class="help-actions__card"
      >
        <span class="help-actions__icon">
          <ArtSvgIcon :icon="card.icon" />
        </span>
        <span class="help-actions__content">
          <strong>{{ card.title }}</strong>
          <small>{{ card.description }}</small>
        </span>
        <ArtSvgIcon icon="ri:arrow-right-line" class="help-actions__arrow" />
      </component>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router'

  type CardInput = {
    key: string
    title: string
    description: string
    url: string
    guest_url?: string
  }

  type ResolvedCard = CardInput & { icon: string }

  type RawCard = Partial<Record<keyof CardInput, unknown>>

  const props = defineProps<{
    content?: Record<string, unknown>
    isAuthenticated: boolean
  }>()

  const defaults: CardInput[] = [
    { key: 'docs', title: '文档中心', description: '详细的产品文档和使用指南', url: '/docs' },
    {
      key: 'tickets',
      title: '提交工单',
      description: '获取一对一的技术支持',
      url: '/console/tickets',
      guest_url: '/login'
    },
    {
      key: 'announcements',
      title: '最新公告',
      description: '系统更新与重要通知',
      url: '/announcements'
    },
    {
      key: 'contact',
      title: '邮件支持',
      description: 'support@example.com',
      url: 'mailto:support@example.com'
    }
  ]

  const iconByKey: Record<string, string> = {
    docs: 'ri:book-open-line',
    tickets: 'ri:customer-service-2-line',
    announcements: 'ri:notification-3-line',
    contact: 'ri:mail-send-line'
  }

  const defaultsByKey = new Map(defaults.map((card) => [card.key, card]))

  const resolvedCards = computed<ResolvedCard[]>(() => {
    const rawCards = Array.isArray(props.content?.cards) ? props.content.cards : []
    const cards = rawCards.length > 0 ? rawCards : defaults

    return (cards as RawCard[]).map((item) => {
      const key = String(item?.key ?? '')
      const fallback = defaultsByKey.get(key)

      if (fallback) {
        return {
          key,
          title: String(item?.title ?? '') || fallback.title,
          description: String(item?.description ?? '') || fallback.description,
          url: String(item?.url ?? '') || fallback.url,
          guest_url: item?.guest_url == null ? fallback.guest_url : String(item.guest_url),
          icon: iconByKey[key]
        }
      }

      return {
        key: key || 'custom',
        title: String(item?.title ?? '') || '链接',
        description: String(item?.description ?? ''),
        url: String(item?.url ?? '#'),
        guest_url: item?.guest_url ? String(item.guest_url) : undefined,
        icon: 'ri:links-line'
      }
    })
  })

  const resolveUrl = (card: ResolvedCard) => {
    if (card.key === 'tickets' && !props.isAuthenticated) {
      return card.guest_url || '/login'
    }
    return card.url
  }

  const isInternalLink = (url: string) =>
    String(url || '')
      .trim()
      .startsWith('/')

  const linkProps = (card: ResolvedCard) => {
    const url = resolveUrl(card)
    return isInternalLink(url) ? { to: url } : { href: url, rel: 'noopener noreferrer' }
  }
</script>

<style lang="scss" scoped>
  .help-actions {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    padding: 44px 24px 64px;
    margin: 0 auto;

    &__grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
    }

    &__card {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 14px;
      align-items: center;
      min-height: 116px;
      padding: 20px;
      color: inherit;
      text-decoration: none;
      background: var(--default-box-color);
      border: 1px solid var(--art-card-border);
      border-radius: calc(var(--custom-radius) / 2 + 4px);
      box-shadow: 0 10px 30px color-mix(in srgb, var(--art-gray-900) 6%, transparent);
      transition:
        transform 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease;

      &:hover {
        border-color: color-mix(in srgb, var(--theme-color) 55%, var(--default-border));
        box-shadow: 0 16px 36px color-mix(in srgb, var(--theme-color) 12%, transparent);
        transform: translateY(-4px);
      }
    }

    &__icon {
      display: grid;
      place-items: center;
      width: 42px;
      aspect-ratio: 1;
      font-size: 21px;
      color: var(--theme-color);
      background: color-mix(in srgb, var(--theme-color) 10%, var(--default-box-color));
      border-radius: calc(var(--custom-radius) / 2 + 2px);
    }

    &__content {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;

      strong {
        font-size: 16px;
        font-weight: 650;
        color: var(--art-gray-900);
      }

      small {
        font-size: 13px;
        line-height: 1.5;
        color: var(--art-gray-600);
        overflow-wrap: anywhere;
      }
    }

    &__arrow {
      color: var(--art-gray-500);
      transition: transform 0.2s ease;
    }

    &__card:hover &__arrow {
      color: var(--theme-color);
      transform: translateX(3px);
    }
  }

  @media (width <= 1024px) {
    .help-actions__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (width <= 600px) {
    .help-actions {
      padding: 32px 18px 48px;

      &__grid {
        grid-template-columns: 1fr;
      }
    }
  }
</style>
