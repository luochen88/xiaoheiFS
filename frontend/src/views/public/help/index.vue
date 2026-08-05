<template>
  <div class="help-page">
    <template v-for="block in resolvedBlocks" :key="block.type">
      <HelpHeroBlock
        v-if="block.type === 'help_hero'"
        v-model:search-query="searchQuery"
        :content="block.content"
      />
      <HelpActionsBlock
        v-else-if="block.type === 'help_actions'"
        :content="block.content"
        :is-authenticated="isAuthenticated"
      />
      <HelpFaqBlock
        v-else-if="block.type === 'help_faq'"
        :content="block.content"
        :search-query="searchQuery"
        @clear-search="searchQuery = ''"
      />
      <HelpContactBlock v-else-if="block.type === 'help_contact'" :content="block.content" />
    </template>
  </div>
</template>

<script setup lang="ts">
  import HelpActionsBlock from '@/components/business/cms-blocks/help/HelpActionsBlock.vue'
  import HelpContactBlock from '@/components/business/cms-blocks/help/HelpContactBlock.vue'
  import HelpFaqBlock from '@/components/business/cms-blocks/help/HelpFaqBlock.vue'
  import HelpHeroBlock from '@/components/business/cms-blocks/help/HelpHeroBlock.vue'
  import { useAuthStore } from '@/stores/auth'
  import { useSiteStore } from '@/stores/site'

  defineOptions({ name: 'PublicHelp' })

  type CmsBlock = {
    type: string
    sort_order?: number
    visible?: boolean
    content?: Record<string, unknown>
    content_json?: string
  }

  const authStore = useAuthStore()
  const siteStore = useSiteStore()
  const searchQuery = ref('')
  const isAuthenticated = computed(() => Boolean(authStore.token))

  const defaultBlocks: CmsBlock[] = [
    { type: 'help_hero', sort_order: 1, visible: true, content: {} },
    { type: 'help_actions', sort_order: 2, visible: true, content: {} },
    { type: 'help_faq', sort_order: 3, visible: true, content: {} },
    { type: 'help_contact', sort_order: 4, visible: true, content: {} }
  ]

  const parseContentJson = (raw?: string): Record<string, unknown> => {
    if (!raw) return {}
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }

  const resolvedBlocks = computed(() => {
    const items = ((siteStore.blocks.help || []) as CmsBlock[])
      .filter((block) => block && block.visible !== false)
      .slice()
      .sort((left, right) => (left.sort_order || 0) - (right.sort_order || 0))

    const presentTypes = new Set(items.map((block) => block.type))
    const merged = items.concat(defaultBlocks.filter((block) => !presentTypes.has(block.type)))

    return merged.map((block) => ({
      ...block,
      content: block.content ?? parseContentJson(block.content_json)
    }))
  })

  onMounted(() => {
    siteStore.fetchBlocks('help')
  })
</script>

<style lang="scss" scoped>
  .help-page {
    min-height: 100vh;
    overflow: hidden;
    background: var(--default-bg-color);
  }
</style>
