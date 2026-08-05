<template>
  <div class="products-page">
    <template v-for="type in productsBlockOrder" :key="type">
      <ProductsHeroBlock v-if="type === 'hero'" :content="heroContent" />
      <ProductsCalculatorBlock
        v-else-if="type === 'calculator'"
        :content="calculatorContent"
        :scenarios="scenarios"
        :selected-scenario="selectedScenario"
        :on-select="selectScenario"
      />
      <ProductsPricingBlock
        v-else-if="type === 'pricing'"
        :products="products"
        :selected-plan="selectedPlan"
        :on-select="selectPlan"
      />
      <ProductsComparisonBlock
        v-else-if="type === 'comparison'"
        :content="comparisonContent"
        :products="products"
        :rows="comparisonRows"
      />
      <ProductsCtaBlock v-else-if="type === 'cta'" :content="ctaContent" />
    </template>
  </div>
</template>

<script setup lang="ts">
  import ProductsCalculatorBlock from '@/components/business/cms-blocks/products/ProductsCalculatorBlock.vue'
  import ProductsComparisonBlock from '@/components/business/cms-blocks/products/ProductsComparisonBlock.vue'
  import ProductsCtaBlock from '@/components/business/cms-blocks/products/ProductsCtaBlock.vue'
  import ProductsHeroBlock from '@/components/business/cms-blocks/products/ProductsHeroBlock.vue'
  import ProductsPricingBlock from '@/components/business/cms-blocks/products/ProductsPricingBlock.vue'
  import { useSiteStore } from '@/stores/site'

  defineOptions({ name: 'PublicProducts' })

  type CmsBlock = {
    type?: string
    sort_order?: number
    visible?: boolean
    content_json?: string
    content?: any
  }
  type Product = {
    icon?: string
    name?: string
    description?: string
    price?: string
    recommended?: boolean
    cta?: string
    resources?: Array<{ label?: string; value?: string; percent?: number }>
    features?: string[]
  }

  const siteStore = useSiteStore()
  const selectedScenario = ref<number | null>(null)
  const selectedPlan = ref(2)
  const productsBlockOrder = ref(['hero', 'calculator', 'pricing', 'comparison', 'cta'])

  const scenarios = ref([
    { icon: '📝', name: '个人博客', recommended: '基础型 - 1核1G', plan: 0 },
    { icon: '🛒', name: '小型电商', recommended: '标准型 - 2核4G', plan: 1 },
    { icon: '🎮', name: '游戏服务器', recommended: '高性能型 - 4核8G', plan: 2 },
    { icon: '🏢', name: '企业应用', recommended: '企业型 - 8核16G', plan: 3 }
  ])

  const products = ref<Product[]>([
    {
      icon: 'ri:cloud-line',
      name: '基础型',
      description: '适合个人博客、小型网站',
      price: '29',
      recommended: false,
      cta: '立即选购',
      resources: [
        { label: 'CPU', value: '1 核', percent: 25 },
        { label: '内存', value: '1 GB', percent: 12.5 },
        { label: '存储', value: '20 GB', percent: 20 },
        { label: '带宽', value: '1 Mbps', percent: 10 }
      ],
      features: [
        '默认 1核1G 配置',
        '20GB SSD 高速云盘',
        '1Mbps 带宽',
        'Linux 操作系统',
        '免费备案服务',
        '99.99% 可用性',
        '7天无理由退款',
        '24/7 工单支持'
      ]
    },
    {
      icon: 'ri:rocket-2-line',
      name: '标准型',
      description: '适合中小企业、Web 应用',
      price: '59',
      recommended: false,
      cta: '立即选购',
      resources: [
        { label: 'CPU', value: '2 核', percent: 50 },
        { label: '内存', value: '4 GB', percent: 50 },
        { label: '存储', value: '40 GB', percent: 40 },
        { label: '带宽', value: '3 Mbps', percent: 30 }
      ],
      features: [
        '默认 2核4G 配置',
        '40GB SSD 高速云盘',
        '3Mbps 带宽',
        'Linux/Windows 系统',
        '免费自动备份',
        '负载均衡支持',
        'DDoS 防护',
        '优先技术支持'
      ]
    },
    {
      icon: 'ri:flashlight-line',
      name: '高性能型',
      description: '适合计算密集型应用',
      price: '129',
      recommended: true,
      cta: '立即选购',
      resources: [
        { label: 'CPU', value: '4 核', percent: 100 },
        { label: '内存', value: '8 GB', percent: 100 },
        { label: '存储', value: '80 GB', percent: 80 },
        { label: '带宽', value: '5 Mbps', percent: 50 }
      ],
      features: [
        '默认 4核8G 配置',
        '80GB SSD 高速云盘',
        '5Mbps 带宽',
        '任意操作系统',
        '每日自动备份',
        '弹性伸缩支持',
        '高级 DDoS 防护',
        '专属客服支持',
        'SLA 保障'
      ]
    },
    {
      icon: 'ri:building-2-line',
      name: '企业型',
      description: '适合大型企业、关键业务',
      price: '299',
      recommended: false,
      cta: '联系销售',
      resources: [
        { label: 'CPU', value: '8 核', percent: 100 },
        { label: '内存', value: '16 GB', percent: 100 },
        { label: '存储', value: '160 GB', percent: 100 },
        { label: '带宽', value: '10 Mbps', percent: 100 }
      ],
      features: [
        '默认 8核16G 配置',
        '160GB SSD 企业级云盘',
        '10Mbps 独享带宽',
        '任意操作系统',
        '实时异地备份',
        '私有网络部署',
        '企业级安全方案',
        '专属客户经理',
        '定制化服务',
        '99.995% SLA'
      ]
    }
  ])

  const comparisonRows = ref([
    { feature: 'CPU', values: ['1 核', '2 核', '4 核', '8 核'] },
    { feature: '内存', values: ['1 GB', '4 GB', '8 GB', '16 GB'] },
    { feature: '存储', values: ['20 GB SSD', '40 GB SSD', '80 GB SSD', '160 GB SSD'] },
    { feature: '带宽', values: ['1 Mbps', '3 Mbps', '5 Mbps', '10 Mbps'] },
    { feature: '操作系统', values: ['Linux', 'Linux/Windows', '任意系统', '任意系统'] },
    { feature: '流量限制', values: ['不限', '不限', '不限', '不限'] },
    { feature: '备份数量', values: ['手动', '每天1次', '每天1次', '实时备份'] },
    { feature: 'DDoS防护', values: ['基础', '基础', '高级', '企业级'] },
    { feature: '技术支持', values: ['工单', '工单', '优先', '专属经理'] },
    { feature: 'SLA保障', values: ['99.99%', '99.99%', '99.99%', '99.995%'] }
  ])

  const heroContent = ref({
    badge: '',
    title: '',
    subtitle: '',
    features: ['秒级部署', '弹性扩容', '99.99% SLA', '24/7 支持']
  })
  const calculatorContent = ref({ title: '', desc: '' })
  const comparisonContent = ref({ title: '' })
  const ctaContent = ref({
    title: '',
    desc: '',
    contact_text: '',
    contact_link: '/console/tickets',
    email: 'sales@example.com'
  })

  const defaultBlocks: Record<string, any> = {
    hero: { sort_order: 1, visible: true, content: { ...heroContent.value } },
    calculator: {
      sort_order: 2,
      visible: true,
      content: { ...calculatorContent.value, scenarios: scenarios.value }
    },
    pricing: { sort_order: 3, visible: true, content: { products: products.value } },
    comparison: {
      sort_order: 4,
      visible: true,
      content: { ...comparisonContent.value, rows: comparisonRows.value }
    },
    cta: { sort_order: 5, visible: true, content: { ...ctaContent.value } }
  }

  const parseContent = (block?: CmsBlock) => {
    if (block?.content && typeof block.content === 'object') return block.content
    if (!block?.content_json) return {}
    try {
      return JSON.parse(block.content_json)
    } catch {
      return {}
    }
  }

  const applyBlocks = (blocks: CmsBlock[]) => {
    const merged: Record<string, any> = {}
    Object.entries(defaultBlocks).forEach(([type, block]) => {
      merged[type] = { ...block, content: { ...block.content } }
    })
    blocks.forEach((block) => {
      if (!block?.type || !merged[block.type]) return
      merged[block.type] = {
        ...merged[block.type],
        sort_order: block.sort_order ?? merged[block.type].sort_order,
        visible: block.visible ?? merged[block.type].visible,
        content: { ...merged[block.type].content, ...parseContent(block) }
      }
    })

    productsBlockOrder.value = Object.entries(merged)
      .filter(([, block]) => block.visible !== false)
      .sort((left, right) => left[1].sort_order - right[1].sort_order)
      .map(([type]) => type)

    const hero = merged.hero.content
    heroContent.value = {
      badge: hero.badge || '',
      title: hero.title || '',
      subtitle: hero.subtitle || '',
      features:
        Array.isArray(hero.features) && hero.features.length
          ? hero.features
          : defaultBlocks.hero.content.features
    }
    const calculator = merged.calculator.content
    calculatorContent.value = { title: calculator.title || '', desc: calculator.desc || '' }
    if (Array.isArray(calculator.scenarios) && calculator.scenarios.length)
      scenarios.value = calculator.scenarios
    const pricing = merged.pricing.content
    if (Array.isArray(pricing.products) && pricing.products.length) {
      products.value = pricing.products.map((item: any) => ({
        ...item,
        icon: item.icon || 'ri:cloud-line',
        resources: Array.isArray(item.resources) ? item.resources : [],
        features: Array.isArray(item.features) ? item.features : []
      }))
    }
    const comparison = merged.comparison.content
    comparisonContent.value = { title: comparison.title || '' }
    if (Array.isArray(comparison.rows) && comparison.rows.length)
      comparisonRows.value = comparison.rows
    const cta = merged.cta.content
    ctaContent.value = {
      title: cta.title || '',
      desc: cta.desc || '',
      contact_text: cta.contact_text || '',
      contact_link: cta.contact_link || '/console/tickets',
      email: cta.email || 'sales@example.com'
    }
  }

  const selectScenario = (index: number) => {
    selectedScenario.value = index
    selectedPlan.value = scenarios.value[index]?.plan ?? 0
  }
  const selectPlan = (index: number) => {
    selectedPlan.value = index
  }

  onMounted(async () => {
    await siteStore.fetchBlocks('products')
    applyBlocks((siteStore.blocks.products || []) as CmsBlock[])
  })
</script>

<style lang="scss" scoped>
  .products-page {
    min-height: 100vh;
    overflow: hidden;
    background: var(--default-bg-color);
  }
</style>
