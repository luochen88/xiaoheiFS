<template>
  <div class="post-detail-page pb-5">
    <div class="reading-progress" aria-hidden="true">
      <span :style="{ width: `${readingProgress}%` }"></span>
    </div>

    <div class="post-detail__container">
      <ElBreadcrumb separator="/" class="post-detail__breadcrumb">
        <ElBreadcrumbItem :to="{ path: '/' }">首页</ElBreadcrumbItem>
        <ElBreadcrumbItem :to="{ path: `/${postCategory}` }">{{ categoryTitle }}</ElBreadcrumbItem>
        <ElBreadcrumbItem>{{ post?.title || '文章详情' }}</ElBreadcrumbItem>
      </ElBreadcrumb>

      <ElSkeleton v-if="loading" :rows="10" animated class="post-detail__loading" />

      <template v-else-if="post">
        <div class="post-detail__layout">
          <aside v-if="showToc && headings.length" class="post-toc">
            <h2>目录</h2>
            <a
              v-for="heading in headings"
              :key="heading.id"
              :href="`#${heading.id}`"
              :class="`post-toc__level-${heading.level}`"
              @click.prevent="scrollToHeading(heading.id)"
            >
              {{ heading.text }}
            </a>
          </aside>

          <article ref="articleRef" class="post-article">
            <header class="post-article__header">
              <div class="post-article__meta">
                <ElTag effect="dark">{{ categoryTitle }}</ElTag>
                <span
                  ><ArtSvgIcon icon="ri:calendar-line" />{{ formatDate(post.published_at) }}</span
                >
                <span><ArtSvgIcon icon="ri:time-line" />{{ readTime }}</span>
                <span v-if="post.views"><ArtSvgIcon icon="ri:eye-line" />{{ post.views }}</span>
              </div>
              <h1>{{ post.title }}</h1>
              <p v-if="post.summary" class="post-article__summary">{{ post.summary }}</p>
              <div v-if="post.author" class="post-article__author">
                <span>{{ post.author.charAt(0) }}</span>
                <div
                  ><strong>{{ post.author }}</strong
                  ><small>技术作者</small></div
                >
              </div>
            </header>

            <img
              v-if="post.cover_url"
              :src="post.cover_url"
              :alt="post.title || ''"
              class="post-article__cover"
            />
            <div ref="contentRef" class="post-article__content" v-html="post.content_html"></div>

            <footer class="post-article__footer">
              <div v-if="post.tags?.length" class="post-article__tags">
                <span>标签</span>
                <RouterLink
                  v-for="tag in post.tags"
                  :key="tag"
                  :to="`/${postCategory}?tag=${encodeURIComponent(tag)}`"
                >
                  {{ tag }}
                </RouterLink>
              </div>
              <div class="post-article__share">
                <span>分享</span>
                <ElTooltip content="复制链接">
                  <ElButton circle aria-label="复制链接" @click="copyLink"
                    ><ArtSvgIcon icon="ri:link"
                  /></ElButton>
                </ElTooltip>
                <ElTooltip content="分享到微博">
                  <ElButton circle aria-label="分享到微博" @click="shareOnWeibo"
                    ><ArtSvgIcon icon="ri:share-forward-line"
                  /></ElButton>
                </ElTooltip>
              </div>
            </footer>
          </article>
        </div>

        <nav class="post-navigation" aria-label="文章导航">
          <RouterLink v-if="prevPost" :to="postPath(prevPost)" class="post-navigation__item">
            <small>上一篇</small><strong>{{ prevPost.title }}</strong
            ><ArtSvgIcon icon="ri:arrow-left-line" />
          </RouterLink>
          <span v-else></span>
          <RouterLink :to="`/${postCategory}`" class="post-navigation__back"
            ><ArtSvgIcon icon="ri:book-open-line" />返回列表</RouterLink
          >
          <RouterLink
            v-if="nextPost"
            :to="postPath(nextPost)"
            class="post-navigation__item post-navigation__item--next"
          >
            <small>下一篇</small><strong>{{ nextPost.title }}</strong
            ><ArtSvgIcon icon="ri:arrow-right-line" />
          </RouterLink>
          <span v-else></span>
        </nav>

        <section
          v-if="relatedPosts.length"
          class="related-posts"
          aria-labelledby="related-posts-title"
        >
          <h2 id="related-posts-title">相关文章</h2>
          <div>
            <RouterLink
              v-for="related in relatedPosts"
              :key="related.id || related.slug"
              :to="postPath(related)"
            >
              <img v-if="related.cover_url" :src="related.cover_url" :alt="related.title || ''" />
              <span v-else class="related-posts__icon"
                ><ArtSvgIcon icon="ri:file-text-line"
              /></span>
              <span
                ><strong>{{ related.title }}</strong
                ><small>{{ related.summary || '点击查看详情' }}</small
                ><em>{{ formatDate(related.published_at) }}</em></span
              >
            </RouterLink>
          </div>
        </section>
      </template>

      <ElEmpty v-else description="文章不存在" class="post-detail__empty">
        <ElButton type="primary" @click="router.push('/docs')">返回文档中心</ElButton>
      </ElEmpty>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { RouterLink } from 'vue-router'
  import { getCmsPostBySlug, getCmsPosts } from '@/services/user'
  import type { CMSPost } from '@/services/types'
  import { useSiteStore } from '@/stores/site'

  defineOptions({ name: 'PublicPostDetail' })

  type PublicPost = CMSPost & { author?: string; views?: number; tags?: string[] }
  type Heading = { id: string; text: string; level: number }

  const route = useRoute()
  const router = useRouter()
  const siteStore = useSiteStore()
  const post = ref<PublicPost | null>(null)
  const loading = ref(false)
  const articleRef = ref<HTMLElement>()
  const contentRef = ref<HTMLElement>()
  const readingProgress = ref(0)
  const showToc = ref(false)
  const headings = ref<Heading[]>([])
  const prevPost = ref<PublicPost | null>(null)
  const nextPost = ref<PublicPost | null>(null)
  const relatedPosts = ref<PublicPost[]>([])

  const postCategory = computed(() => String(route.params.category || 'docs'))
  const categoryTitles: Record<string, string> = {
    docs: '文档中心',
    announcements: '系统公告',
    activities: '活动动态',
    tutorials: '教程学院'
  }
  const categoryTitle = computed(() => categoryTitles[postCategory.value] || '文章')
  const readTime = computed(
    () => `${Math.max(1, Math.ceil(String(post.value?.content_html || '').length / 1000))} 分钟`
  )

  const formatDate = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const extractHeadings = () => {
    if (!contentRef.value) return
    const extracted: Heading[] = []
    contentRef.value.querySelectorAll('h1, h2, h3').forEach((element, index) => {
      const id = `heading-${index}`
      element.id = id
      extracted.push({
        id,
        text: element.textContent || '',
        level: Number(element.tagName.slice(1))
      })
    })
    headings.value = extracted
    updateTocVisibility()
  }

  const updateTocVisibility = () => {
    showToc.value = window.innerWidth > 1024 && headings.value.length > 2
  }
  const scrollToHeading = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const updateReadingProgress = () => {
    if (!articleRef.value) return
    const start = articleRef.value.offsetTop
    const range = articleRef.value.offsetHeight - window.innerHeight
    readingProgress.value =
      range <= 0 ? 100 : Math.min(100, Math.max(0, ((window.scrollY - start) / range) * 100))
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      ElMessage.success('链接已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败，请手动复制地址栏链接')
    }
  }

  const shareOnWeibo = () => {
    const url = encodeURIComponent(window.location.href)
    const title = encodeURIComponent(post.value?.title || '')
    window.open(
      `https://service.weibo.com/share/share.php?url=${url}&title=${title}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const postPath = (item: PublicPost) => `/${postCategory.value}/${item.slug || ''}`

  const fetchRelatedPosts = async () => {
    if (!post.value) return
    try {
      const response = await getCmsPosts({
        category_key: postCategory.value,
        lang: siteStore.currentLang || 'zh-CN',
        limit: 100,
        offset: 0
      })
      const records = (response.data?.items || []) as PublicPost[]
      siteStore.posts[postCategory.value] = records
      const index = records.findIndex((item) => item.id === post.value?.id)
      prevPost.value = index > 0 ? records[index - 1] : null
      nextPost.value = index >= 0 && index < records.length - 1 ? records[index + 1] : null
      relatedPosts.value = records.filter((item) => item.id !== post.value?.id).slice(0, 4)
    } catch {
      prevPost.value = null
      nextPost.value = null
      relatedPosts.value = []
    }
  }

  const loadPost = async (slug: string) => {
    if (!slug) {
      post.value = null
      return
    }
    loading.value = true
    post.value = null
    headings.value = []
    try {
      const response = await getCmsPostBySlug(slug)
      post.value = (response.data || null) as PublicPost | null
      await nextTick()
      extractHeadings()
      await fetchRelatedPosts()
    } catch {
      post.value = null
    } finally {
      loading.value = false
      nextTick(updateReadingProgress)
    }
  }

  watch(
    () => route.params.slug,
    (slug) => loadPost(String(slug || '')),
    { immediate: true }
  )

  onMounted(() => {
    window.addEventListener('scroll', updateReadingProgress, { passive: true })
    window.addEventListener('resize', updateTocVisibility, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', updateReadingProgress)
    window.removeEventListener('resize', updateTocVisibility)
  })
</script>

<style lang="scss" scoped>
  .post-detail-page {
    min-height: 100vh;
    background: var(--default-bg-color);
  }

  .reading-progress {
    position: fixed;
    top: 66px;
    right: 0;
    left: 0;
    z-index: 90;
    height: 3px;
    background: color-mix(in srgb, var(--art-gray-900) 10%, transparent);
  }

  .reading-progress span {
    display: block;
    height: 100%;
    background: var(--theme-color);
    transition: width 0.1s ease;
  }

  .post-detail__container {
    max-width: 1240px;
    padding: 36px 24px 70px;
    margin: 0 auto;
  }

  .post-detail__breadcrumb {
    margin-bottom: 28px;
  }

  .post-detail__loading,
  .post-detail__empty {
    padding: 48px;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 4px);
  }

  .post-detail__layout {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 36px;
    align-items: start;
  }

  .post-toc {
    position: sticky;
    top: 96px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: calc(100vh - 120px);
    padding: 18px;
    overflow: auto;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 3px);
  }

  .post-toc h2 {
    padding-bottom: 12px;
    margin: 0 0 8px;
    font-size: 13px;
    color: var(--art-gray-900);
    border-bottom: 1px solid var(--default-border);
  }

  .post-toc a {
    padding: 7px 9px;
    overflow: hidden;
    font-size: 13px;
    color: var(--art-gray-600);
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-radius: calc(var(--custom-radius) / 2);
  }

  .post-toc a:hover {
    color: var(--theme-color);
    background: var(--art-hover-color);
  }

  .post-toc__level-3 {
    padding-left: 20px;
  }

  .post-article {
    min-width: 0;
    padding: 40px;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 5px);
    box-shadow: 0 16px 46px color-mix(in srgb, var(--art-gray-900) 7%, transparent);
  }

  .post-article__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 18px;
    align-items: center;
  }

  .post-article__meta > span {
    display: inline-flex;
    gap: 5px;
    align-items: center;
    font-size: 13px;
    color: var(--art-gray-500);
  }

  .post-article__header h1 {
    margin: 22px 0 14px;
    font-size: 40px;
    line-height: 1.24;
    color: var(--art-gray-900);
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  .post-article__summary {
    margin: 0;
    font-size: 17px;
    line-height: 1.75;
    color: var(--art-gray-600);
  }

  .post-article__author {
    display: inline-flex;
    gap: 11px;
    align-items: center;
    padding: 10px 14px;
    margin-top: 22px;
    background: color-mix(in srgb, var(--theme-color) 7%, var(--default-box-color));
    border: 1px solid color-mix(in srgb, var(--theme-color) 18%, var(--default-border));
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .post-article__author > span {
    display: grid;
    place-items: center;
    width: 36px;
    aspect-ratio: 1;
    color: var(--el-color-white);
    background: var(--theme-color);
    border-radius: calc(var(--custom-radius) / 2 + 1px);
  }

  .post-article__author > div {
    display: flex;
    flex-direction: column;
  }

  .post-article__author strong {
    color: var(--art-gray-800);
  }

  .post-article__author small {
    color: var(--art-gray-500);
  }

  .post-article__cover {
    display: block;
    width: 100%;
    aspect-ratio: 21 / 9;
    margin: 30px 0;
    object-fit: cover;
    border-radius: calc(var(--custom-radius) / 2 + 4px);
  }

  .post-article__content {
    margin-top: 30px;
    font-size: 16px;
    line-height: 1.9;
    color: var(--art-gray-700);
    overflow-wrap: anywhere;
  }

  .post-article__content :deep(h1),
  .post-article__content :deep(h2),
  .post-article__content :deep(h3) {
    margin: 42px 0 16px;
    color: var(--art-gray-900);
    letter-spacing: 0;
    scroll-margin-top: 88px;
  }

  .post-article__content :deep(h1) {
    font-size: 30px;
  }

  .post-article__content :deep(h2) {
    padding-bottom: 9px;
    font-size: 25px;
    border-bottom: 1px solid var(--default-border);
  }

  .post-article__content :deep(h3) {
    font-size: 20px;
  }

  .post-article__content :deep(a) {
    color: var(--theme-color);
  }

  .post-article__content :deep(img) {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 28px auto;
    border-radius: calc(var(--custom-radius) / 2 + 3px);
  }

  .post-article__content :deep(pre) {
    padding: 20px;
    margin: 24px 0;
    overflow: auto;
    color: var(--art-gray-800);
    background: var(--art-gray-100);
    border: 1px solid var(--default-border);
    border-radius: calc(var(--custom-radius) / 2 + 3px);
  }

  .post-article__content :deep(code) {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  }

  .post-article__content :deep(p code),
  .post-article__content :deep(li code) {
    padding: 2px 6px;
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 8%, var(--default-box-color));
    border-radius: 4px;
  }

  .post-article__content :deep(blockquote) {
    padding: 14px 20px;
    margin: 24px 0;
    color: var(--art-gray-600);
    background: var(--art-gray-100);
    border-left: 4px solid var(--theme-color);
  }

  .post-article__content :deep(table) {
    width: 100%;
    margin: 24px 0;
    overflow: hidden;
    border-collapse: collapse;
    border: 1px solid var(--default-border);
  }

  .post-article__content :deep(th),
  .post-article__content :deep(td) {
    padding: 11px 13px;
    text-align: left;
    border: 1px solid var(--default-border);
  }

  .post-article__content :deep(th) {
    color: var(--art-gray-900);
    background: var(--art-gray-100);
  }

  .post-article__footer {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: center;
    justify-content: space-between;
    padding-top: 26px;
    margin-top: 42px;
    border-top: 1px solid var(--default-border);
  }

  .post-article__tags,
  .post-article__share {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .post-article__tags > span,
  .post-article__share > span {
    margin-right: 4px;
    font-size: 13px;
    color: var(--art-gray-500);
  }

  .post-article__tags a {
    padding: 5px 10px;
    color: var(--theme-color);
    text-decoration: none;
    background: color-mix(in srgb, var(--theme-color) 8%, var(--default-box-color));
    border-radius: 99px;
  }

  .post-navigation {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 14px;
    margin: 28px 0 0 256px;
  }

  .post-navigation a {
    min-width: 0;
    padding: 18px;
    color: inherit;
    text-decoration: none;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 3px);
  }

  .post-navigation__item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 5px 10px;
  }

  .post-navigation__item small {
    color: var(--art-gray-500);
  }

  .post-navigation__item strong {
    overflow: hidden;
    color: var(--art-gray-800);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .post-navigation__item > .art-svg-icon {
    grid-row: 1 / 3;
    grid-column: 2;
    align-self: center;
    color: var(--theme-color);
  }

  .post-navigation__item--next {
    text-align: right;
  }

  .post-navigation a.post-navigation__back {
    display: inline-flex;
    gap: 7px;
    align-items: center;
    color: var(--el-color-white);
    background: var(--theme-color);
  }

  .related-posts {
    margin: 64px 0 0 256px;
  }

  .related-posts h2 {
    margin: 0 0 22px;
    font-size: 26px;
    color: var(--art-gray-900);
  }

  .related-posts > div {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .related-posts a {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr);
    gap: 13px;
    padding: 13px;
    color: inherit;
    text-decoration: none;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 3px);
  }

  .related-posts img,
  .related-posts__icon {
    width: 92px;
    height: 68px;
    border-radius: calc(var(--custom-radius) / 2 + 1px);
  }

  .related-posts img {
    object-fit: cover;
  }

  .related-posts__icon {
    display: grid;
    place-items: center;
    font-size: 26px;
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 8%, var(--default-box-color));
  }

  .related-posts a > span:last-child {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .related-posts strong,
  .related-posts small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .related-posts strong {
    color: var(--art-gray-800);
  }

  .related-posts small,
  .related-posts em {
    font-style: normal;
    color: var(--art-gray-500);
  }

  @media (width <= 1024px) {
    .post-detail__layout {
      grid-template-columns: 1fr;
    }

    .post-toc {
      display: none;
    }

    .post-navigation,
    .related-posts {
      margin-left: 0;
    }
  }

  @media (width <= 680px) {
    .post-detail__container {
      padding: 28px 18px 54px;
    }

    .post-article {
      padding: 26px 20px;
    }

    .post-article__header h1 {
      font-size: 31px;
    }

    .post-navigation {
      grid-template-columns: 1fr;
    }

    .post-navigation > span {
      display: none;
    }

    .post-navigation__back {
      justify-content: center;
      order: -1;
    }

    .related-posts > div {
      grid-template-columns: 1fr;
    }
  }

  @media print {
    .reading-progress,
    .post-toc,
    .post-navigation,
    .related-posts,
    .post-article__footer,
    .post-detail__breadcrumb {
      display: none;
    }

    .post-article {
      padding: 0;
      border: 0;
      box-shadow: none;
    }
  }
</style>
