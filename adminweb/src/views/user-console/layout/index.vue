<template>
  <div class="console-shell">
    <aside class="console-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="brand" @click="router.push('/console')">
        <div class="brand-logo">
          <img v-if="site.logoUrl" :src="site.logoUrl" alt="logo" />
          <ArtLogo v-else :size="28" />
        </div>
        <div v-if="!sidebarCollapsed" class="brand-text">
          <div class="brand-name">{{ site.resolvedSiteName }}</div>
          <div class="brand-subtitle">用户控制台</div>
        </div>
      </div>

      <ElScrollbar class="menu-scroll">
        <ElMenu
          :default-active="activeMenu"
          :collapse="sidebarCollapsed"
          :router="true"
          class="console-menu"
        >
          <template v-for="group in menuGroups" :key="group.title">
            <div v-if="!sidebarCollapsed && group.title" class="menu-group-title">
              {{ group.title }}
            </div>
            <ElMenuItem v-for="item in group.items" :key="item.path" :index="item.path">
              <ElIcon><component :is="item.icon" /></ElIcon>
              <template #title>
                <span>{{ item.label }}</span>
                <ElBadge
                  v-if="item.path === '/console/cart' && cart.count"
                  :value="cart.count"
                  class="menu-badge"
                />
              </template>
            </ElMenuItem>
          </template>
        </ElMenu>
      </ElScrollbar>
    </aside>

    <div class="console-main">
      <header class="console-header">
        <div class="header-left">
          <ElButton circle :icon="sidebarCollapsed ? Expand : Fold" @click="toggleSidebar" />
          <div>
            <div class="page-title">{{ currentTitle }}</div>
            <ElBreadcrumb separator="/" class="page-breadcrumb">
              <ElBreadcrumbItem>控制台</ElBreadcrumbItem>
              <ElBreadcrumbItem>{{ currentTitle }}</ElBreadcrumbItem>
            </ElBreadcrumb>
          </div>
        </div>

        <div class="header-right">
          <ElTooltip content="购物车" placement="bottom">
            <ElBadge :value="cart.count" :hidden="cart.count === 0">
              <ElButton circle :icon="ShoppingCart" @click="router.push('/console/cart')" />
            </ElBadge>
          </ElTooltip>
          <ElDropdown trigger="click" @command="handleUserCommand">
            <button class="user-button">
              <ElAvatar :size="32" :src="user.avatarUrl">
                {{ user.displayName.slice(0, 1) }}
              </ElAvatar>
              <span class="user-name">{{ user.displayName }}</span>
              <ElIcon><ArrowDown /></ElIcon>
            </button>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem command="profile" :icon="User">个人资料</ElDropdownItem>
                <ElDropdownItem command="logout" :icon="SwitchButton">退出登录</ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </div>
      </header>

      <main class="console-content">
        <RouterView v-slot="{ Component }">
          <Transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>

    <div class="mobile-tabbar">
      <button
        v-for="item in mobileTabs"
        :key="item.path"
        :class="{ active: activeMenu === item.path }"
        @click="router.push(item.path)"
      >
        <ElIcon><component :is="item.icon" /></ElIcon>
        <span>{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    ArrowDown,
    CreditCard,
    Document,
    Expand,
    Fold,
    House,
    Key,
    List,
    Monitor,
    Service,
    Setting,
    ShoppingCart,
    SwitchButton,
    Tickets,
    User,
    Wallet
  } from '@element-plus/icons-vue'
  import { useConsoleCartStore } from '@/store/modules/console-cart'
  import { useConsoleSiteStore } from '@/store/modules/console-site'
  import { useConsoleUserStore } from '@/store/modules/console-user'

  defineOptions({ name: 'ConsoleUserLayout' })

  const route = useRoute()
  const router = useRouter()
  const user = useConsoleUserStore()
  const cart = useConsoleCartStore()
  const site = useConsoleSiteStore()
  const sidebarCollapsed = ref(false)

  const menuGroups = [
    {
      title: '',
      items: [{ path: '/console/dashboard', label: '总览', icon: House }]
    },
    {
      title: '云服务',
      items: [
        { path: '/console/vps', label: '云服务器', icon: Monitor },
        { path: '/console/buy', label: '购买 VPS', icon: CreditCard }
      ]
    },
    {
      title: '订单与财务',
      items: [
        { path: '/console/cart', label: '购物车', icon: ShoppingCart },
        { path: '/console/orders', label: '订单', icon: Document },
        { path: '/console/billing', label: '钱包', icon: Wallet },
        { path: '/console/api-keys', label: 'API Key', icon: Key }
      ]
    },
    {
      title: '支持与账户',
      items: [
        { path: '/console/realname', label: '实名认证', icon: Tickets },
        { path: '/console/tickets', label: '工单', icon: Service },
        { path: '/console/profile', label: '个人资料', icon: Setting }
      ]
    }
  ]

  const flatMenus = menuGroups.flatMap((group) => group.items)
  const mobileTabs = [
    { path: '/console/dashboard', label: '总览', icon: House },
    { path: '/console/vps', label: '云服务器', icon: Monitor },
    { path: '/console/cart', label: '购物车', icon: ShoppingCart },
    { path: '/console/orders', label: '订单', icon: List },
    { path: '/console/profile', label: '我的', icon: User }
  ]

  const activeMenu = computed(() => {
    if (route.path.startsWith('/console/vps')) return '/console/vps'
    if (route.path.startsWith('/console/orders')) return '/console/orders'
    if (route.path.startsWith('/console/tickets')) return '/console/tickets'
    if (route.path.startsWith('/console/billing')) return '/console/billing'
    if (route.path.startsWith('/console/api-keys')) return '/console/api-keys'
    if (route.path.startsWith('/console/realname')) return '/console/realname'
    if (route.path.startsWith('/console/cart')) return '/console/cart'
    if (route.path.startsWith('/console/profile')) return '/console/profile'
    if (route.path.startsWith('/console/buy')) return '/console/buy'
    return '/console/dashboard'
  })

  const currentTitle = computed(() => {
    return flatMenus.find((item) => item.path === activeMenu.value)?.label || '控制台'
  })

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const handleUserCommand = (command: string) => {
    if (command === 'profile') {
      router.push('/console/profile')
      return
    }

    if (command === 'logout') {
      user.logout()
      cart.clear()
      router.replace('/user/login')
    }
  }

  onMounted(() => {
    if (user.token && !user.profile) {
      user.fetchMe()
    }
    cart.fetchCart().catch(() => undefined)
    site.fetchSettings()
  })
</script>

<style scoped lang="scss">
  .console-shell {
    min-height: 100vh;
    background: var(--default-bg-color);
  }

  .console-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 20;
    display: flex;
    width: 240px;
    flex-direction: column;
    border-right: 1px solid var(--art-card-border);
    background: var(--default-box-color);
    transition: width 0.2s ease;

    &.collapsed {
      width: 72px;
    }
  }

  .brand {
    display: flex;
    height: 68px;
    align-items: center;
    gap: 12px;
    padding: 0 18px;
    cursor: pointer;
    border-bottom: 1px solid var(--art-card-border);
  }

  .brand-logo {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      max-width: 34px;
      max-height: 34px;
      border-radius: 8px;
    }
  }

  .brand-text {
    min-width: 0;
  }

  .brand-name {
    color: var(--art-gray-900);
    font-size: 15px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .brand-subtitle {
    margin-top: 2px;
    color: var(--art-gray-500);
    font-size: 12px;
  }

  .menu-scroll {
    flex: 1;
  }

  .console-menu {
    border-right: 0;
    padding: 12px 8px;
  }

  .menu-group-title {
    padding: 14px 14px 7px;
    color: var(--art-gray-500);
    font-size: 12px;
    font-weight: 600;
  }

  .menu-badge {
    margin-left: 8px;
  }

  .console-main {
    min-height: 100vh;
    padding-left: 240px;
    transition: padding-left 0.2s ease;
  }

  .console-sidebar.collapsed + .console-main {
    padding-left: 72px;
  }

  .console-header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    height: 68px;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 1px solid var(--art-card-border);
    background: color-mix(in srgb, var(--default-box-color) 88%, transparent);
    padding: 0 24px;
    backdrop-filter: blur(12px);
  }

  .header-left,
  .header-right {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .page-title {
    color: var(--art-gray-900);
    font-size: 17px;
    font-weight: 700;
    line-height: 1.3;
  }

  .page-breadcrumb {
    margin-top: 2px;
    font-size: 12px;
  }

  .user-button {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--art-gray-800);
    cursor: pointer;
    padding: 6px 8px;

    &:hover {
      background: var(--art-hover-color);
    }
  }

  .user-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 600;
  }

  .console-content {
    max-width: 1440px;
    margin: 0 auto;
    padding: 24px;
  }

  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition:
      opacity 0.18s ease,
      transform 0.18s ease;
  }

  .fade-slide-enter-from,
  .fade-slide-leave-to {
    opacity: 0;
    transform: translateY(8px);
  }

  .mobile-tabbar {
    display: none;
  }

  @media (max-width: 900px) {
    .console-sidebar {
      display: none;
    }

    .console-main,
    .console-sidebar.collapsed + .console-main {
      padding-left: 0;
    }

    .console-header {
      height: 60px;
      padding: 0 14px;
    }

    .header-left > .el-button,
    .page-breadcrumb,
    .user-name {
      display: none;
    }

    .console-content {
      padding: 14px 14px 78px;
    }

    .mobile-tabbar {
      position: fixed;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 30;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      border-top: 1px solid var(--art-card-border);
      background: var(--default-box-color);
      padding: 5px 4px 7px;

      button {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        border: 0;
        background: transparent;
        color: var(--art-gray-500);
        font-size: 11px;
        padding: 4px 0;

        .el-icon {
          font-size: 18px;
        }

        &.active {
          color: var(--el-color-primary);
          font-weight: 600;
        }
      }
    }
  }
</style>
