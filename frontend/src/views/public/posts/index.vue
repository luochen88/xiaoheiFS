<template>
  <div class="posts-page pb-5">
    <section class="posts-hero">
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
      <div v-else class="posts-featured__placeholder"><ArtSvgIcon icon="ri:article-line" /></div>
      <div class="posts-featured__content">
        <span><ArtSvgIcon icon="ri:pushpin-2-line" />精选推荐</span>
        <h2>{{ featuredPost.title }}</h2>
        <p>{{ featuredPost.summary || '查看内容详情' }}</p>
        <small
          >{{ formatDate(featuredPost.published_at) }} ·
          {{ estimatedReadTime(featuredPost.content_html || featuredPost.summary || '') }}</small
        >
      </div>
    </RouterLink>

    <div class="posts-search">
      <ArtSearchBar
        v-model="searchForm"
        :items="searchItems"
        :is-expand="true"
        :show-expand="false"
        @search="handleSearch"
        @reset="handleReset"
      />
    </div>

    <ElCard class="art-table-card posts-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <div class="posts-table-title">
            <strong>{{ categoryTitle }}</strong>
            <span>共 {{ pagination.total }} 篇</span>
          </div>
        </template>
      </ArtTableHeader>

      <ArtTable
        row-key="slug"
        :loading="loading"
        :data="tableData"
        :columns="columns"
        :pagination="pagination"
        @row-click="handleRowClick"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
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
        <template #read_time="{ row }">{{
          estimatedReadTime(row.content_html || row.summary || '')
        }}</template>
        <template #operation="{ row }">
          <ElButton link type="primary" @click.stop="goToPost(row.slug)">查看详情</ElButton>
        </template>
      </ArtTable>
    </ElCard>

    <section
      v-if="resources.length"
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
  </div>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router'
  import { useTable } from '@/hooks/core/useTable'
  import { getCmsPosts } from '@/services/user'
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

  const route = useRoute()
  const router = useRouter()
  const siteStore = useSiteStore()
  const currentCategory = ref(String(route.meta.categoryKey || 'docs'))
  const searchForm = ref<{ keyword?: string; sort?: SortMode }>({ keyword: '', sort: 'latest' })

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
  ): Promise<Api.Common.PaginatedResponse<CMSPost>> => {
    const current = Number(params.current || 1)
    const size = Number(params.size || 10)
    const response = await getCmsPosts({
      category_key: params.category_key,
      lang: params.lang,
      limit: size,
      offset: (current - 1) * size
    })
    let records = [...(response.data?.items || [])]
    siteStore.posts[params.category_key] = records

    const keyword = String(params.keyword || '')
      .trim()
      .toLocaleLowerCase()
    if (keyword) {
      records = records.filter((post) =>
        `${post.title || ''} ${post.summary || ''}`.toLocaleLowerCase().includes(keyword)
      )
    }
    if (params.sort === 'title')
      records.sort((left, right) =>
        String(left.title || '').localeCompare(String(right.title || ''))
      )
    else if (params.sort === 'popular')
      records.sort((left: any, right: any) => Number(right.views || 0) - Number(left.views || 0))
    else
      records.sort(
        (left, right) =>
          new Date(right.published_at || 0).getTime() - new Date(left.published_at || 0).getTime()
      )

    return { records, total: response.data?.total || records.length, current, size }
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchPostTable,
      immediate: false,
      apiParams: {
        current: 1,
        size: 10,
        category_key: currentCategory.value,
        lang: siteStore.currentLang || 'zh-CN',
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

  const blocks = computed(() => (siteStore.blocks[currentCategory.value] || []) as any[])
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

  const featuredPost = computed(() => data.value.find((post) => post.cover_url) || null)
  const tableData = computed(() =>
    featuredPost.value && !searchForm.value.keyword && pagination.current === 1
      ? data.value.filter((post) => post !== featuredPost.value)
      : data.value
  )
  const postPath = (post: CMSPost) => `/${currentCategory.value}/${post.slug || ''}`
  const goToPost = (slug?: string) => {
    if (slug) router.push(`/${currentCategory.value}/${slug}`)
  }
  const handleRowClick = (row: CMSPost) => goToPost(row.slug)
  const switchCategory = (key: string) => router.push(`/${key}`)

  const formatDate = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-CN')
  }
  const estimatedReadTime = (text: string) =>
    `${Math.max(1, Math.ceil(String(text || '').length / 800))} 分钟`
  const isInternal = (url?: string) =>
    String(url || '')
      .trim()
      .startsWith('/')
  const resourceLinkProps = (url?: string) =>
    isInternal(url) ? { to: url || '/' } : { href: url || '#', rel: 'noopener noreferrer' }

  const handleSearch = (params: { keyword?: string; sort?: SortMode }) => {
    Object.assign(searchParams, { ...params, category_key: currentCategory.value })
    getData()
  }
  const handleReset = () => {
    searchForm.value = { keyword: '', sort: 'latest' }
    resetSearchParams()
  }

  const refreshCategoryCounts = async () => {
    const totals = await Promise.all(
      categories.value.map(async (category) => {
        try {
          const response = await getCmsPosts({
            category_key: category.key,
            lang: siteStore.currentLang || 'zh-CN',
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
      Object.assign(searchParams, {
        category_key: currentCategory.value,
        lang: siteStore.currentLang || 'zh-CN'
      })
      await siteStore.fetchBlocks(currentCategory.value)
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
