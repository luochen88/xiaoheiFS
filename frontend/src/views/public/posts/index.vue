<template>
  <div class="posts-page pb-5">
    <template v-for="block in resolvedBlocks" :key="block.type">
      <section v-if="block.type === 'hero'" class="posts-hero">
        <div>
          <ElBreadcrumb separator="/">
            <ElBreadcrumbItem :to="{ path: '/' }">首页</ElBreadcrumbItem>
            <ElBreadcrumbItem>{{ categoryTitle }}</ElBreadcrumbItem>
          </ElBreadcrumb>
          <h1>{{ heroTitle }}</h1>
          <p>{{ heroSubtitle }}</p>
        </div>
        <div class="posts-hero__visual" aria-hidden="true">
          <ArtSvgIcon :icon="categoryIcon" />
          <span>{{ pagination.total }}</span>
          <small>篇公开内容</small>
        </div>
      </section>

      <template v-else-if="block.type === 'posts'">
        <nav class="posts-categories" aria-label="内容分类">
          <ElButton
            v-for="category in categories"
            :key="category.key"
            class="posts-categories__item"
            :type="currentCategory === category.key ? 'primary' : 'default'"
            :plain="currentCategory !== category.key"
            @click="switchCategory(category.key)"
          >
            <ArtSvgIcon :icon="category.icon" />
            <span>{{ category.name }}</span>
            <ElTag size="small" effect="plain" round>{{ category.count }}</ElTag>
          </ElButton>
        </nav>

        <RouterLink
          v-if="featuredPost && !searchForm.keyword"
          :to="postPath(featuredPost)"
          class="posts-featured"
        >
          <img
            v-if="featuredPost.cover_url"
            :src="featuredPost.cover_url"
            :alt="featuredPost.title || ''"
          />
          <div v-else class="posts-featured__placeholder"
            ><ArtSvgIcon icon="ri:article-line"
          /></div>
          <div class="posts-featured__content">
            <span><ArtSvgIcon icon="ri:pushpin-2-line" />精选推荐</span>
            <h2>{{ featuredPost.title }}</h2>
            <p>{{ featuredPost.summary || '查看内容详情' }}</p>
            <small
              >{{ formatDate(featuredPost.published_at) }} ·
              {{ estimatedReadTime(featuredPost.summary || '') }}</small
            >
          </div>
        </RouterLink>

        <div class="posts-search">
          <ArtSearchBar
            v-model="searchForm"
            :items="searchItems"
            :is-expand="true"
            :show-expand="false"
            :show-reset="false"
            :show-search="false"
          />
        </div>

        <ElCard class="art-table-card posts-table-card">
          <ArtTableHeader v-model:columns="columnChecks" :loading="loading" layout="">
            <template #left>
              <div class="posts-table-title">
                <strong>{{ categoryTitle }}</strong>
                <span>共 {{ postPool.length }} 篇</span>
              </div>
            </template>
          </ArtTableHeader>

          <ArtTable
            v-if="loading || desktopPosts.length"
            class="posts-desktop-table"
            row-key="slug"
            :loading="loading"
            :data="desktopPosts"
            :columns="columns"
            @row-click="handleRowClick"
          >
            <template #title="{ row }">
              <div class="posts-title-cell">
                <img v-if="row.cover_url" :src="row.cover_url" :alt="row.title || ''" />
                <span v-else><ArtSvgIcon icon="ri:file-text-line" /></span>
                <div
                  ><strong>{{ row.title || '未命名文章' }}</strong
                  ><small>{{ row.summary || '暂无摘要' }}</small></div
                >
              </div>
            </template>
            <template #published_at="{ row }">{{ formatDate(row.published_at) }}</template>
            <template #read_time="{ row }">{{ estimatedReadTime(row.summary || '') }}</template>
            <template #operation="{ row }">
              <ElButton link type="primary" @click.stop="goToPost(row.slug)">查看详情</ElButton>
            </template>
          </ArtTable>

          <ElButton
            v-if="!loading && hasMore"
            class="posts-desktop-more"
            :loading="loadingMore"
            @click="loadMore"
          >
            加载更多
          </ElButton>

          <div v-if="!loading && mobilePosts.length" class="posts-mobile-list">
            <article
              v-for="row in mobilePosts"
              :key="row.slug"
              class="posts-mobile-card"
              @click="goToPost(row.slug)"
            >
              <img v-if="row.cover_url" :src="row.cover_url" :alt="row.title || ''" />
              <span v-else class="posts-mobile-card__placeholder"
                ><ArtSvgIcon icon="ri:file-text-line"
              /></span>
              <div>
                <strong>{{ row.title || '未命名文章' }}</strong>
                <p>{{ row.summary || '暂无摘要' }}</p>
                <small
                  >{{ formatDate(row.published_at) }} ·
                  {{ estimatedReadTime(row.summary || '') }}</small
                >
              </div>
              <ArtSvgIcon icon="ri:arrow-right-s-line" />
            </article>
          </div>
          <ElButton
            v-if="!loading && allPosts.length > 0 && hasMore"
            class="posts-mobile-more"
            :loading="loadingMore"
            @click="loadMore"
          >
            加载更多
          </ElButton>

          <ElEmpty v-if="!loading && !desktopPosts.length" description="暂无相关内容">
            <p class="posts-empty-hint">
              {{ searchForm.keyword ? '尝试更换搜索关键词' : '敬请期待更多精彩内容' }}
            </p>
            <ElButton v-if="searchForm.keyword" type="primary" @click="handleReset"
              >清除搜索</ElButton
            >
          </ElEmpty>
        </ElCard>
      </template>

      <section
        v-else-if="block.type === 'resources' && resources.length"
        class="posts-resources"
        aria-labelledby="posts-resources-title"
      >
        <h2 id="posts-resources-title">{{ resourcesTitle }}</h2>
        <div>
          <component
            :is="isInternal(resource.url) ? RouterLink : 'a'"
            v-for="resource in resources"
            :key="resource.title"
            v-bind="resourceLinkProps(resource.url)"
            class="posts-resources__item"
          >
            <ArtSvgIcon :icon="resource.icon" />
            <span
              ><strong>{{ resource.title }}</strong
              ><small>{{ resource.description }}</small></span
            >
            <ArtSvgIcon icon="ri:arrow-right-up-line" />
          </component>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router'
  import { useTable } from '@/hooks/core/useTable'
  import { getCmsBlocks, getCmsPosts } from '@/services/user'
  import type { CMSPost } from '@/services/types'
  import { useSiteStore } from '@/stores/site'

  defineOptions({ name: 'PublicPosts' })

  type SortMode = 'latest' | 'popular' | 'title'
  type PostQuery = Api.Common.CommonSearchParams & {
    category_key: string
    lang: string
    keyword?: string
    sort?: SortMode
  }
  type ListedPost = CMSPost & { views?: number }

  const route = useRoute()
  const router = useRouter()
  const siteStore = useSiteStore()
  const currentCategory = ref(String(route.meta.categoryKey || 'docs'))
  const searchForm = ref<{ keyword?: string; sort?: SortMode }>({ keyword: '', sort: 'latest' })
  const allPosts = ref<ListedPost[]>([])
  const serverTotal = ref(0)
  const loadingMore = ref(false)

  const categories = ref([
    { key: 'docs', name: '文档', icon: 'ri:book-open-line', count: 0 },
    { key: 'announcements', name: '公告', icon: 'ri:notification-3-line', count: 0 },
    { key: 'activities', name: '活动', icon: 'ri:calendar-event-line', count: 0 },
    { key: 'tutorials', name: '教程', icon: 'ri:graduation-cap-line', count: 0 }
  ])

  const categoryTitles: Record<string, string> = {
    docs: '文档中心',
    announcements: '产品公告',
    activities: '活动中心',
    tutorials: '教程学院'
  }
  const categoryIcons: Record<string, string> = {
    docs: 'ri:book-open-line',
    announcements: 'ri:notification-3-line',
    activities: 'ri:calendar-event-line',
    tutorials: 'ri:graduation-cap-line'
  }

  const categoryTitle = computed(() => categoryTitles[currentCategory.value] || '文章')
  const categoryIcon = computed(() => categoryIcons[currentCategory.value] || 'ri:article-line')
  const searchItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: { placeholder: `搜索${categoryTitle.value}...`, clearable: true }
    },
    {
      label: '排序',
      key: 'sort',
      type: 'select',
      props: {
        options: [
          { label: '最新发布', value: 'latest' },
          { label: '最受欢迎', value: 'popular' },
          { label: '标题 A-Z', value: 'title' }
        ]
      }
    }
  ])

  const fetchPostTable = async (
    params: PostQuery
  ): Promise<Api.Common.PaginatedResponse<ListedPost>> => {
    const current = Number(params.current || 1)
    const size = Number(params.size || 20)
    const response = await getCmsPosts({
      category_key: params.category_key,
      lang: params.lang,
      limit: 20,
      offset: 0
    })
    const sourceRecords = [...(response.data?.items || [])] as ListedPost[]
    allPosts.value = sourceRecords
    siteStore.posts[params.category_key] = sourceRecords
    serverTotal.value = response.data?.total || sourceRecords.length
    return { records: sourceRecords, total: serverTotal.value, current, size }
  }

  const { columns, columnChecks, loading, pagination, getData } = useTable({
    core: {
      apiFn: fetchPostTable,
      immediate: false,
      apiParams: {
        current: 1,
        size: 20,
        category_key: currentCategory.value,
        lang: 'zh-CN',
        ...searchForm.value
      },
      columnsFactory: () => [
        { prop: 'title', label: '文章', minWidth: 360, useSlot: true },
        { prop: 'published_at', label: '发布时间', width: 130, useSlot: true },
        { prop: 'read_time', label: '阅读时长', width: 110, useSlot: true },
        { prop: 'operation', label: '操作', width: 100, fixed: 'right', useSlot: true }
      ]
    }
  })

  type CmsPageBlock = {
    type?: string
    sort_order?: number
    visible?: boolean
    content?: any
    content_json?: string
  }
  const resolvedBlocks = computed(() => {
    const defaults: CmsPageBlock[] = [
      { type: 'hero', sort_order: 1, visible: true, content: {} },
      { type: 'posts', sort_order: 2, visible: true, content: {} },
      { type: 'resources', sort_order: 3, visible: true, content: {} }
    ]
    const raw = (siteStore.blocks[currentCategory.value] || []) as CmsPageBlock[]
    const known = new Map(defaults.map((block) => [block.type, { ...block }]))
    raw.forEach((block) => {
      if (!block.type || !known.has(block.type)) return
      const parsed =
        block.content && typeof block.content === 'object'
          ? block.content
          : (() => {
              try {
                return block.content_json ? JSON.parse(block.content_json) : {}
              } catch {
                return {}
              }
            })()
      const base = known.get(block.type) as CmsPageBlock
      known.set(block.type, {
        ...base,
        ...block,
        content: { ...(base.content || {}), ...parsed }
      })
    })
    return [...known.values()]
      .filter((block) => block.visible !== false)
      .sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
  })
  const blocks = computed(() => resolvedBlocks.value)
  const blockContent = (type: string) => {
    const block = blocks.value.find((item) => item?.type === type)
    if (!block) return {}
    if (block.content && typeof block.content === 'object') return block.content
    try {
      return block.content_json ? JSON.parse(block.content_json) : {}
    } catch {
      return {}
    }
  }
  const heroTitle = computed(
    () => blockContent('hero').title || String(route.meta.title || categoryTitle.value)
  )
  const heroSubtitle = computed(
    () => blockContent('hero').subtitle || String(route.meta.subtitle || '')
  )
  const resourcesTitle = computed(() => blockContent('resources').title || '相关资源')
  const resources = computed(() => {
    const fallback = [
      {
        icon: 'ri:code-box-line',
        title: 'API 文档',
        description: '完整的 API 参考手册和示例代码',
        url: '#'
      },
      { icon: 'ri:video-line', title: '视频教程', description: '手把手教您使用各项功能', url: '#' },
      {
        icon: 'ri:braces-line',
        title: '代码示例',
        description: '常用场景的代码片段和最佳实践',
        url: '#'
      },
      {
        icon: 'ri:question-answer-line',
        title: '社区支持',
        description: '加入讨论，获取帮助与经验分享',
        url: '#'
      }
    ]
    const items = blockContent('resources').items
    return Array.isArray(items) && items.length
      ? items.map((item: any, index: number) => ({
          icon: item.icon_key ? `ri:${item.icon_key}-line` : fallback[index % fallback.length].icon,
          title: item.title || fallback[index % fallback.length].title,
          description: item.description || fallback[index % fallback.length].description,
          url: item.url || '#'
        }))
      : fallback
  })

  const featuredPost = computed(() => allPosts.value.find((post) => post.cover_url) || null)
  const postPool = computed(() => {
    let records = [...allPosts.value]
    const keyword = String(searchForm.value.keyword || '')
      .trim()
      .toLocaleLowerCase()
    if (keyword) {
      records = records.filter((post) =>
        `${post.title || ''} ${post.summary || ''}`.toLocaleLowerCase().includes(keyword)
      )
    } else if (featuredPost.value) {
      records = records.filter((post) => post !== featuredPost.value)
    }
    if (searchForm.value.sort === 'title') {
      records.sort((left, right) =>
        String(left.title || '').localeCompare(String(right.title || ''))
      )
    } else if (searchForm.value.sort === 'popular') {
      records.sort((left, right) => Number(right.views || 0) - Number(left.views || 0))
    } else {
      records.sort(
        (left, right) =>
          new Date(right.published_at || 0).getTime() - new Date(left.published_at || 0).getTime()
      )
    }
    return records
  })
  const desktopPosts = computed(() => postPool.value)
  const mobilePostPool = computed(() => postPool.value)
  const mobilePosts = computed(() => mobilePostPool.value)
  const hasMore = computed(() => allPosts.value.length < serverTotal.value)
  const postPath = (post: CMSPost) => `/${currentCategory.value}/${post.slug || ''}`
  const goToPost = (slug?: string) => {
    if (slug) router.push(`/${currentCategory.value}/${slug}`)
  }
  const handleRowClick = (row: CMSPost) => goToPost(row.slug)
  const switchCategory = (key: string) => router.push(`/${key}`)

  const formatDate = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000)
    if (days <= 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days} 天前`
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  const estimatedReadTime = (text: string) =>
    `${Math.max(1, Math.ceil(String(text || '').length / 800))} 分钟`
  const isInternal = (url?: string) =>
    String(url || '')
      .trim()
      .startsWith('/')
  const resourceLinkProps = (url?: string) =>
    isInternal(url) ? { to: url || '/' } : { href: url || '#', rel: 'noopener noreferrer' }

  const handleReset = () => {
    searchForm.value = { keyword: '', sort: 'latest' }
  }

  const loadMore = async () => {
    if (loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    try {
      const response = await getCmsPosts({
        category_key: currentCategory.value,
        lang: 'zh-CN',
        limit: 20,
        offset: allPosts.value.length
      })
      const nextPosts = (response.data?.items || []) as ListedPost[]
      allPosts.value = allPosts.value.concat(nextPosts)
      serverTotal.value = response.data?.total || allPosts.value.length
      siteStore.posts[currentCategory.value] = allPosts.value
    } catch {
      // Keep the already loaded posts available when the next page fails.
    } finally {
      loadingMore.value = false
    }
  }

  const refreshCategoryCounts = async () => {
    const totals = await Promise.all(
      categories.value.map(async (category) => {
        try {
          const response = await getCmsPosts({
            category_key: category.key,
            lang: 'zh-CN',
            limit: 1,
            offset: 0
          })
          return [category.key, response.data?.total || 0] as const
        } catch {
          return [category.key, 0] as const
        }
      })
    )
    const countMap = new Map(totals)
    categories.value = categories.value.map((category) => ({
      ...category,
      count: countMap.get(category.key) || 0
    }))
  }

  watch(
    () => route.meta.categoryKey,
    async (key) => {
      currentCategory.value = String(key || 'docs')
      allPosts.value = []
      serverTotal.value = 0
      try {
        const response = await getCmsBlocks({ page: currentCategory.value, lang: 'zh-CN' })
        siteStore.blocks[currentCategory.value] = response.data?.items || []
      } catch {
        siteStore.blocks[currentCategory.value] = []
      }
      await getData()
      refreshCategoryCounts()
    },
    { immediate: true }
  )
</script>

<style lang="scss" scoped>
  .posts-page {
    min-height: 100vh;
    padding-inline: 24px;
    background: var(--default-bg-color);
  }

  .posts-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 180px;
    gap: 48px;
    align-items: center;
    max-width: 1180px;
    padding: 64px 0 36px;
    margin: 0 auto;
  }

  .posts-hero h1 {
    margin: 20px 0 10px;
    font-size: 42px;
    color: var(--art-gray-900);
  }

  .posts-hero p {
    max-width: 700px;
    margin: 0;
    font-size: 16px;
    line-height: 1.7;
    color: var(--art-gray-600);
  }

  .posts-hero__visual {
    display: grid;
    place-items: center;
    min-height: 150px;
    padding: 18px;
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 9%, var(--default-box-color));
    border: 1px solid color-mix(in srgb, var(--theme-color) 25%, var(--default-border));
    border-radius: calc(var(--custom-radius) / 2 + 5px);
  }

  .posts-hero__visual > .art-svg-icon {
    font-size: 32px;
  }

  .posts-hero__visual span {
    font-size: 28px;
    font-weight: 720;
    color: var(--art-gray-900);
  }

  .posts-hero__visual small {
    color: var(--art-gray-600);
  }

  .posts-categories {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    max-width: 1180px;
    margin: 0 auto 18px;
  }

  .posts-categories__item + .posts-categories__item {
    margin-left: 0;
  }

  .posts-featured {
    display: grid;
    grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.2fr);
    max-width: 1180px;
    min-height: 240px;
    margin: 0 auto 18px;
    overflow: hidden;
    color: inherit;
    text-decoration: none;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 5px);
    box-shadow: 0 14px 38px color-mix(in srgb, var(--art-gray-900) 7%, transparent);
  }

  .posts-featured > img,
  .posts-featured__placeholder {
    width: 100%;
    height: 100%;
    min-height: 240px;
    object-fit: cover;
  }

  .posts-featured__placeholder {
    display: grid;
    place-items: center;
    font-size: 48px;
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 9%, var(--default-box-color));
  }

  .posts-featured__content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 30px;
  }

  .posts-featured__content > span {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    font-size: 13px;
    color: var(--theme-color);
  }

  .posts-featured h2 {
    margin: 12px 0 8px;
    font-size: 25px;
    color: var(--art-gray-900);
  }

  .posts-featured p {
    margin: 0;
    line-height: 1.7;
    color: var(--art-gray-600);
  }

  .posts-featured small {
    margin-top: 16px;
    color: var(--art-gray-500);
  }

  .posts-search {
    max-width: 1180px;
    margin-inline: auto;
  }

  .posts-table-card {
    max-width: 1180px;
    min-height: 610px;
    margin: 12px auto 0;
  }

  .posts-table-title {
    display: flex;
    gap: 10px;
    align-items: baseline;
  }

  .posts-table-title strong {
    color: var(--art-gray-900);
  }

  .posts-table-title span {
    font-size: 12px;
    color: var(--art-gray-500);
  }

  .posts-title-cell {
    display: flex;
    gap: 12px;
    align-items: center;
    cursor: pointer;
  }

  .posts-title-cell > img,
  .posts-title-cell > span {
    flex: 0 0 auto;
    width: 56px;
    height: 42px;
    border-radius: calc(var(--custom-radius) / 2 + 1px);
  }

  .posts-title-cell > img {
    object-fit: cover;
  }

  .posts-title-cell > span {
    display: grid;
    place-items: center;
    font-size: 20px;
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 9%, var(--default-box-color));
  }

  .posts-title-cell > div {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .posts-title-cell strong {
    overflow: hidden;
    color: var(--art-gray-800);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .posts-title-cell small {
    overflow: hidden;
    color: var(--art-gray-500);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .posts-mobile-list {
    display: none;
  }

  .posts-mobile-card {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 14px 0;
    border-bottom: 1px solid var(--default-border);
    cursor: pointer;
  }

  .posts-mobile-card > img,
  .posts-mobile-card__placeholder {
    width: 72px;
    height: 56px;
    object-fit: cover;
    border-radius: calc(var(--custom-radius) / 2 + 1px);
  }

  .posts-mobile-card__placeholder {
    display: grid;
    place-items: center;
    font-size: 22px;
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 9%, var(--default-box-color));
  }

  .posts-mobile-card > div {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .posts-mobile-card strong,
  .posts-mobile-card p,
  .posts-mobile-card small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .posts-mobile-card strong {
    color: var(--art-gray-800);
  }

  .posts-mobile-card p,
  .posts-mobile-card small {
    margin: 0;
    color: var(--art-gray-500);
  }

  .posts-mobile-card > .art-svg-icon {
    color: var(--art-gray-500);
  }

  .posts-mobile-more {
    display: none;
    width: 100%;
    margin-top: 14px;
  }

  .posts-desktop-more {
    display: block;
    min-width: 140px;
    margin: 18px auto 0;
  }

  .posts-empty-hint {
    margin: 0 0 12px;
    color: var(--art-gray-500);
  }

  .posts-resources {
    max-width: 1180px;
    padding: 70px 0 54px;
    margin: 0 auto;
  }

  .posts-resources h2 {
    margin: 0 0 24px;
    font-size: 28px;
    color: var(--art-gray-900);
  }

  .posts-resources > div {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .posts-resources__item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 18px;
    color: var(--theme-color);
    text-decoration: none;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 3px);
  }

  .posts-resources__item > span {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .posts-resources__item strong {
    color: var(--art-gray-800);
  }

  .posts-resources__item small {
    line-height: 1.4;
    color: var(--art-gray-500);
  }

  @media (width <= 800px) {
    .posts-hero {
      grid-template-columns: 1fr;
    }

    .posts-hero__visual {
      display: none;
    }

    .posts-featured {
      grid-template-columns: 1fr;
    }

    .posts-resources > div {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (width <= 767px) {
    .posts-desktop-table,
    .posts-desktop-more {
      display: none;
    }

    .posts-mobile-list {
      display: block;
    }

    .posts-mobile-more {
      display: block;
    }
  }

  @media (width <= 560px) {
    .posts-page {
      padding-inline: 18px;
    }

    .posts-hero {
      padding-top: 44px;
    }

    .posts-hero h1 {
      font-size: 34px;
    }

    .posts-resources > div {
      grid-template-columns: 1fr;
    }
  }
</style>
