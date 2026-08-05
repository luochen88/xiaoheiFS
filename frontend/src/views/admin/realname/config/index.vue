<template>
  <SettingsPage
    title="实名认证配置"
    subtitle="配置实名开关、默认服务商和受实名约束的关键操作"
    :loading="loading"
    :saving="saving"
    :can-view="canView"
    :can-update="canUpdate"
    @refresh="fetchData"
    @save="save"
  >
    <div class="realname-config-page">
      <ArtForm
        v-model="form"
        :items="formItems"
        :disabled="loading || saving || !canUpdate"
        :show-reset="false"
        :show-submit="false"
        :span="24"
        label-position="top"
      />
    </div>
  </SettingsPage>
</template>

<script setup lang="ts">
  import { getRealNameConfig, listRealNameProviders, updateRealNameConfig } from '@/services/admin'
  import type { RealNameProvider } from '@/services/types'
  import SettingsPage from '../../settings/_shared/settings-page.vue'
  import { useAdminPermissions } from '../../settings/_shared/settings'

  defineOptions({ name: 'AdminRealnameConfig' })

  const form = reactive({ enabled: false, provider: '', block_actions: [] as string[] })
  const providers = ref<RealNameProvider[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const { hasPermission } = useAdminPermissions()
  const canView = hasPermission('realname.view')
  const canUpdate = hasPermission('realname.update')

  const formItems = computed(() => [
    { key: 'enabled', label: '启用实名认证', type: 'switch' },
    {
      key: 'provider',
      label: '认证服务商',
      type: 'select',
      props: {
        clearable: true,
        filterable: true,
        placeholder: '请选择认证服务商',
        options: providers.value.map((provider) => ({
          label: providerLabel(provider),
          value: String(provider.key ?? '')
        }))
      }
    },
    {
      key: 'block_actions',
      label: '完成实名后才允许的操作',
      type: 'checkboxgroup',
      props: {
        options: [
          { label: '购买 VPS', value: 'purchase_vps' },
          { label: '续费 VPS', value: 'renew_vps' },
          { label: '升级或扩容 VPS', value: 'resize_vps' }
        ]
      }
    }
  ])

  onMounted(fetchData)

  function providerLabel(provider: RealNameProvider): string {
    const key = String(provider.key ?? '')
    const name = String(provider.name ?? '')
    return key && name ? `${name} (${key})` : name || key || '-'
  }

  async function fetchData(): Promise<void> {
    if (!canView.value) return
    loading.value = true
    try {
      const [configResponse, providerResponse] = await Promise.all([
        getRealNameConfig(),
        listRealNameProviders()
      ])
      const config = configResponse.data
      form.enabled = Boolean(config?.enabled)
      form.provider = String(config?.provider ?? '')
      form.block_actions = Array.isArray(config?.block_actions) ? [...config.block_actions] : []
      providers.value = providerResponse.data?.items ?? []
    } finally {
      loading.value = false
    }
  }

  async function save(): Promise<void> {
    saving.value = true
    try {
      await updateRealNameConfig({
        enabled: form.enabled,
        provider: form.provider.trim(),
        block_actions: form.block_actions
      })
      ElMessage.success('实名认证配置已保存')
    } finally {
      saving.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .realname-config-page {
    min-width: 0;
  }
</style>
