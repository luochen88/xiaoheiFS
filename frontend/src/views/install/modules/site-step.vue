<template>
  <section class="install-step">
    <header class="step-header">
      <div>
        <h2>站点信息</h2>
        <p>配置网站基本名称和访问地址</p>
      </div>
      <ElTag effect="plain">2 / 4</ElTag>
    </header>

    <div class="form-section">
      <ArtForm
        ref="formRef"
        v-model="form"
        :items="formItems"
        :rules="rules"
        :span="24"
        label-position="top"
        :show-reset="false"
        :show-submit="false"
      />
    </div>

    <ElAlert
      type="info"
      title="提示"
      description="站点名称将显示在浏览器标签页和邮件通知中"
      :closable="false"
      show-icon
      class="step-info"
    />

    <footer class="step-actions">
      <ElButton @click="emit('back')">
        <ElIcon><ArrowLeft /></ElIcon>
        上一步
      </ElButton>
      <ElButton type="primary" @click="next" v-ripple>
        下一步
        <ElIcon><ArrowRight /></ElIcon>
      </ElButton>
    </footer>
  </section>
</template>

<script setup lang="ts">
  import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
  import type { FormItem } from '@/components/core/forms/art-form/index.vue'
  import type { FormRules } from 'element-plus'
  import { useInstallWizardStore } from '@/stores/installWizard'

  defineOptions({ name: 'InstallSiteStep' })

  const emit = defineEmits<{ next: []; back: [] }>()
  const wiz = useInstallWizardStore()
  const formRef = ref<{ validate: () => Promise<boolean> }>()
  const form = reactive<Record<string, any>>({
    siteName: wiz.siteName,
    siteUrl: wiz.siteUrl
  })

  const formItems: FormItem[] = [
    {
      key: 'siteName',
      label: '站点名称',
      type: 'input',
      span: 24,
      props: { placeholder: '例如：小黑云', clearable: true }
    },
    {
      key: 'siteUrl',
      label: '站点 URL（可选）',
      type: 'input',
      span: 24,
      props: { placeholder: '例如：https://example.com', clearable: true }
    }
  ]

  const rules: FormRules = {
    siteName: [{ required: true, message: '请输入站点名称', trigger: 'blur' }]
  }

  watch(
    form,
    (value) => {
      wiz.siteName = String(value.siteName || '')
      wiz.siteUrl = String(value.siteUrl || '')
      wiz.persist()
    },
    { deep: true }
  )

  const next = async () => {
    const valid = await formRef.value?.validate().catch(() => false)
    if (valid) emit('next')
  }
</script>

<style lang="scss" scoped>
  .install-step {
    padding: 4px;
  }

  .step-header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .step-header h2 {
    margin: 0 0 6px;
    font-size: 22px;
    font-weight: 700;
    color: var(--art-gray-900);
  }

  .step-header p {
    margin: 0;
    font-size: 14px;
    color: var(--art-gray-600);
  }

  .form-section {
    overflow: hidden;
    background: var(--default-bg-color);
    border: 1px solid var(--default-border);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .step-info {
    margin-top: 16px;
  }

  .step-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding-top: 24px;
  }

  @media (width <= 640px) {
    .step-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
