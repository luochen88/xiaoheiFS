<!--
  公开营销站外壳 —— 负责人 W1

  这是站点根 '/' 的布局，与后台外壳（ArtSidebarMenu + ArtHeaderBar）不同：
  营销站没有侧边栏和多标签页，但**必须**沿用同一套设计令牌（--art-*），
  确保和控制台/管理后台是同一个视觉体系。

  W1 在此基础上补齐：站点导航的移动端抽屉、页脚（FooterBlock）、
  以及未登录购物车角标的实时数量。样式规范见 docs/frontend/adp-conventions.md 第 9 节。
-->
<template>
  <div class="public-layout">
    <header class="public-header">
      <div class="public-header__inner">
        <RouterLink to="/" class="public-header__brand">
          <ArtLogo />
          <span class="public-header__title">{{ siteName }}</span>
        </RouterLink>

        <nav class="public-header__nav">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="public-header__link"
          >
            {{ item.title }}
          </RouterLink>
        </nav>

        <div class="public-header__actions">
          <ElButton link :icon="isDark ? Sunny : Moon" @click="toggleTheme" />

          <ElBadge :value="cartCount" :hidden="cartCount === 0" :max="99">
            <ElButton link :icon="ShoppingCart" @click="router.push('/cart')" />
          </ElBadge>

          <template v-if="isLoggedIn">
            <ElButton type="primary" @click="router.push('/console')">控制台</ElButton>
          </template>
          <template v-else>
            <ElButton link @click="router.push('/login')">登录</ElButton>
            <ElButton type="primary" @click="router.push('/register')">注册</ElButton>
          </template>
        </div>
      </div>
    </header>

    <main class="public-main">
      <RouterView v-slot="{ Component }">
        <Transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <footer class="public-footer">
      <!-- TODO(W1): 换成 CMS 驱动的 FooterBlock -->
      <span>© {{ new Date().getFullYear() }} {{ siteName }}</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
  import { Moon, ShoppingCart, Sunny } from '@element-plus/icons-vue'
  import { useSettingStore } from '@/store/modules/setting'
  import { useTheme } from '@/hooks/core/useTheme'
  import { SystemThemeEnum } from '@/enums/appEnum'
  import { useSiteStore } from '@/stores/site'
  import { useCartStore } from '@/stores/cart'
  import { useAuthStore } from '@/stores/auth'

  defineOptions({ name: 'PublicLayout' })

  const router = useRouter()
  const settingStore = useSettingStore()
  const { setSystemTheme } = useTheme()

  const site = useSiteStore()
  const cart = useCartStore()
  const auth = useAuthStore()

  const isDark = computed(() => settingStore.isDark)
  const siteName = computed(() => site.siteName || '小黑云')
  const navItems = computed(() => site.headerNavItems ?? [])
  const cartCount = computed(() => cart.items?.length ?? 0)
  const isLoggedIn = computed(() => Boolean(auth.token))

  const toggleTheme = () => {
    setSystemTheme(isDark.value ? SystemThemeEnum.LIGHT : SystemThemeEnum.DARK)
  }

  onMounted(() => {
    site.fetchSettings?.()
  })
</script>

<style lang="scss" scoped>
  .public-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--art-main-bg-color);
  }

  .public-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--art-bg-color);
    border-bottom: 1px solid var(--art-card-border);

    &__inner {
      display: flex;
      gap: 24px;
      align-items: center;
      max-width: 1200px;
      height: 64px;
      margin: 0 auto;
      padding: 0 24px;
    }

    &__brand {
      display: flex;
      gap: 10px;
      align-items: center;
      color: var(--art-text-gray-900);
      text-decoration: none;
    }

    &__title {
      font-size: 18px;
      font-weight: 600;
    }

    &__nav {
      display: flex;
      flex: 1;
      gap: 20px;
      align-items: center;
    }

    &__link {
      color: var(--art-text-gray-600);
      text-decoration: none;
      transition: color 0.2s;

      &:hover,
      &.router-link-active {
        color: var(--el-color-primary);
      }
    }

    &__actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
  }

  .public-main {
    flex: 1;
  }

  .public-footer {
    padding: 24px;
    color: var(--art-text-gray-500);
    text-align: center;
    border-top: 1px solid var(--art-card-border);
  }

  @media (max-width: 768px) {
    .public-header__nav {
      display: none;
    }
  }
</style>
