<template>
  <div class="home-page">
    <template v-for="type in homeBlockOrder" :key="type">
      <HomeHeroBlock
        v-if="type === 'hero'"
        :hero-content="heroContent"
        :typewriter-text="typewriterText"
        :stats="stats"
        :animated-stats="animatedStats"
        :hero-cards="heroCards"
        :handle-tilt="handleTilt"
        :reset-tilt="resetTilt"
      />
      <HomeFeaturesBlock
        v-else-if="type === 'features'"
        :content="featuresContent"
        :features="features"
        :handle-feature-glow="handleFeatureGlow"
        :reset-feature-glow="resetFeatureGlow"
      />
      <HomeProductsBlock
        v-else-if="type === 'products'"
        :content="productsContent"
        :products="products"
      />
      <HomeCtaBlock v-else-if="type === 'cta'" :content="ctaContent" :features="ctaFeatures" />
    </template>
  </div>
</template>

<script setup lang="ts">
  import HomeCtaBlock from '@/components/business/cms-blocks/home/HomeCtaBlock.vue'
  import HomeFeaturesBlock from '@/components/business/cms-blocks/home/HomeFeaturesBlock.vue'
  import HomeHeroBlock from '@/components/business/cms-blocks/home/HomeHeroBlock.vue'
  import HomeProductsBlock from '@/components/business/cms-blocks/home/HomeProductsBlock.vue'
  import { useSiteStore } from '@/stores/site'

  defineOptions({ name: 'PublicHome' })

  type CmsBlock = {
    type?: string
    sort_order?: number
    visible?: boolean
    content_json?: string
    content?: any
  }
  type Stat = { value: number | string; suffix?: string; label?: string }

  const siteStore = useSiteStore()
  const heroContent = reactive({
    badge: '',
    title1: '',
    subtitle: '',
    primary_button_text: '',
    primary_button_link: '/register',
    secondary_button_text: '',
    secondary_button_link: '/products'
  })
  const featuresContent = reactive({ badge: '', title: '', desc: '' })
  const productsContent = reactive({ badge: '', title: '' })
  const ctaContent = reactive({ title: '', desc: '', button_text: '', button_link: '/register' })

  const heroCards = ref([
    { title: '极速部署', desc: '60秒开机' },
    { title: '全球网络', desc: '覆盖150+国家' },
    { title: '多层防护', desc: 'DDoS 防御' }
  ])
  const stats = ref<Stat[]>([
    { value: 99.99, suffix: '%', label: '可用性' },
    { value: 50, suffix: '+', label: '全球节点' },
    { value: 100, suffix: 'K+', label: '企业用户' }
  ])
  const animatedStats = ref(stats.value.map(() => '0'))
  const features = ref([
    {
      icon: 'ri:flashlight-line',
      title: '极致性能',
      description: '采用最新一代 CPU 和 NVMe SSD，提供卓越计算性能和 I/O 吞吐量'
    },
    {
      icon: 'ri:shield-check-line',
      title: '安全可靠',
      description: '多层安全防护体系，DDoS 防护、WAF、SSL 证书全方位保障'
    },
    {
      icon: 'ri:global-line',
      title: '全球覆盖',
      description: '50+ 数据中心遍布全球，BGP 多线接入，智能调度最优线路'
    },
    {
      icon: 'ri:server-line',
      title: '弹性伸缩',
      description: '秒级扩容缩容，按需付费，资源利用率最大化'
    },
    {
      icon: 'ri:database-2-line',
      title: '数据保护',
      description: '多重备份机制，快照回滚，异地容灾，数据安全无忧'
    },
    {
      icon: 'ri:settings-3-line',
      title: '简单易用',
      description: '可视化控制台，一键部署应用，API 丰富的自动化运维'
    }
  ])
  const products = ref([
    {
      icon: 'ri:cloud-line',
      tag: '入门首选',
      title: '云服务器',
      description: '适合个人开发者、小型项目',
      price: '29'
    },
    {
      icon: 'ri:box-3-line',
      tag: '企业推荐',
      title: '弹性计算',
      description: '适合中型企业、Web 应用',
      price: '99'
    },
    {
      icon: 'ri:code-box-line',
      tag: '性能旗舰',
      title: 'GPU 实例',
      description: '适合 AI 训练、渲染任务',
      price: '399'
    }
  ])
  const ctaFeatures = ref(['无需绑定信用卡', '随时取消', '24/7 技术支持'])
  const homeBlockOrder = ref(['hero', 'features', 'products', 'cta'])

  const typewriterWords = ref(['云端智能', '无限可能', '卓越性能', '安全可靠'])
  const typewriterText = ref('')
  let typewriterIndex = 0
  let typewriterPosition = 0
  let deleting = false
  let typewriterTimer: number | undefined
  let statAnimationFrame: number | undefined

  const parseContent = (block?: CmsBlock) => {
    if (block?.content && typeof block.content === 'object') return block.content
    if (!block?.content_json) return {}
    try {
      return JSON.parse(block.content_json)
    } catch {
      return {}
    }
  }

  const defaultBlocks: Record<string, any> = {
    hero: {
      sort_order: 1,
      visible: true,
      content: {
        typewriter_words: typewriterWords.value,
        cards: heroCards.value,
        stats: stats.value
      }
    },
    features: { sort_order: 2, visible: true, content: { items: features.value } },
    products: { sort_order: 3, visible: true, content: { items: products.value } },
    cta: { sort_order: 4, visible: true, content: { features: ctaFeatures.value } }
  }

  const applyBlocks = (blocks: CmsBlock[]) => {
    const merged: Record<string, any> = {}
    Object.entries(defaultBlocks).forEach(([type, block]) => {
      merged[type] = { ...block, content: { ...block.content } }
    })

    blocks.forEach((block) => {
      if (!block?.type || !merged[block.type]) return
      const content = parseContent(block)
      merged[block.type] = {
        ...merged[block.type],
        sort_order: block.sort_order ?? merged[block.type].sort_order,
        visible: block.visible ?? merged[block.type].visible,
        content: { ...merged[block.type].content, ...content }
      }
    })

    homeBlockOrder.value = Object.entries(merged)
      .filter(([, block]) => block.visible !== false)
      .sort((left, right) => left[1].sort_order - right[1].sort_order)
      .map(([type]) => type)

    const hero = merged.hero.content
    Object.assign(heroContent, {
      badge: hero.badge || '',
      title1: hero.title1 || '',
      subtitle: hero.subtitle || '',
      primary_button_text: hero.primary_button_text || '',
      primary_button_link: hero.primary_button_link || '/register',
      secondary_button_text: hero.secondary_button_text || '',
      secondary_button_link: hero.secondary_button_link || '/products'
    })
    if (Array.isArray(hero.typewriter_words) && hero.typewriter_words.length)
      typewriterWords.value = hero.typewriter_words
    if (Array.isArray(hero.cards) && hero.cards.length) heroCards.value = hero.cards
    if (Array.isArray(hero.stats) && hero.stats.length) {
      stats.value = hero.stats
      animatedStats.value = hero.stats.map(() => '0')
    }

    Object.assign(featuresContent, {
      badge: merged.features.content.badge || '',
      title: merged.features.content.title || '',
      desc: merged.features.content.desc || ''
    })
    if (Array.isArray(merged.features.content.items) && merged.features.content.items.length)
      features.value = merged.features.content.items.map((item: any) => ({
        icon: item.icon || 'ri:flashlight-line',
        title: item.title || '',
        description: item.description || ''
      }))

    Object.assign(productsContent, {
      badge: merged.products.content.badge || '',
      title: merged.products.content.title || ''
    })
    if (Array.isArray(merged.products.content.items) && merged.products.content.items.length)
      products.value = merged.products.content.items.map((item: any) => ({
        icon: item.icon || 'ri:cloud-line',
        tag: item.tag || '',
        title: item.title || '',
        description: item.description || '',
        price: item.price || ''
      }))

    Object.assign(ctaContent, {
      title: merged.cta.content.title || '',
      desc: merged.cta.content.desc || '',
      button_text: merged.cta.content.button_text || '',
      button_link: merged.cta.content.button_link || '/register'
    })
    if (Array.isArray(merged.cta.content.features) && merged.cta.content.features.length)
      ctaFeatures.value = merged.cta.content.features
  }

  const type = () => {
    const word = String(typewriterWords.value[typewriterIndex] || '')
    typewriterText.value = deleting
      ? word.slice(0, Math.max(0, typewriterPosition - 1))
      : word.slice(0, typewriterPosition + 1)
    typewriterPosition += deleting ? -1 : 1
    if (!deleting && typewriterPosition >= word.length) {
      deleting = true
      typewriterTimer = window.setTimeout(type, 1800)
      return
    }
    if (deleting && typewriterPosition <= 0) {
      deleting = false
      typewriterIndex = (typewriterIndex + 1) % Math.max(1, typewriterWords.value.length)
      typewriterTimer = window.setTimeout(type, 450)
      return
    }
    typewriterTimer = window.setTimeout(type, deleting ? 45 : 90)
  }

  const animateStats = () => {
    const start = performance.now()
    const frame = (now: number) => {
      const progress = Math.min((now - start) / 1800, 1)
      const eased = 1 - (1 - progress) ** 4
      animatedStats.value = stats.value.map((stat) => {
        const value = Number(stat.value || 0) * eased
        return Number(stat.value) % 1 ? value.toFixed(2) : String(Math.floor(value))
      })
      if (progress < 1) statAnimationFrame = requestAnimationFrame(frame)
    }
    statAnimationFrame = requestAnimationFrame(frame)
  }

  const handleTilt = (event: MouseEvent) => {
    const card = event.currentTarget as HTMLElement | null
    if (!card) return
    const rect = card.getBoundingClientRect()
    card.style.transform = `perspective(800px) rotateX(${(event.clientY - rect.top - rect.height / 2) / 12}deg) rotateY(${(rect.width / 2 - (event.clientX - rect.left)) / 12}deg)`
  }

  const resetTilt = (cardName: string) => {
    const card = document.querySelector(
      `.home-hero__float--${cardName.slice(-1)}`
    ) as HTMLElement | null
    if (card) card.style.transform = ''
  }

  const handleFeatureGlow = () => undefined
  const resetFeatureGlow = () => undefined

  onMounted(async () => {
    await siteStore.fetchBlocks('home')
    applyBlocks((siteStore.blocks.home || []) as CmsBlock[])
    type()
    animateStats()
  })

  onUnmounted(() => {
    if (typewriterTimer) window.clearTimeout(typewriterTimer)
    if (statAnimationFrame) cancelAnimationFrame(statAnimationFrame)
  })
</script>

<style lang="scss" scoped>
  .home-page {
    min-height: 100vh;
    overflow: hidden;
    background: var(--default-bg-color);
  }
</style>
