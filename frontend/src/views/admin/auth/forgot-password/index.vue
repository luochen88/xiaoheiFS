<template>
  <div class="auth-page">
    <LoginLeftView />

    <main class="auth-main">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="auth-form">
          <h1 class="auth-title">找回密码</h1>
          <p class="auth-subtitle">输入您的邮箱地址，我们将发送重置密码的链接</p>

          <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
            <ElFormItem label="邮箱" prop="email">
              <ElInput
                v-model="form.email"
                type="email"
                placeholder="请输入邮箱"
                size="large"
                clearable
              >
                <template #prefix><ArtSvgIcon icon="ri:mail-line" /></template>
              </ElInput>
            </ElFormItem>
            <ElButton
              class="submit-button"
              type="primary"
              size="large"
              :loading="loading"
              @click="handleSubmit"
            >
              发送重置邮件
            </ElButton>
          </ElForm>

          <div class="auth-footer">
            <RouterLink class="text-theme" :to="buildAdminUrl('login')">返回登录</RouterLink>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { forgotPassword } from '@/services/user'
  import { buildAdminUrl } from '@/services/adminPath'

  defineOptions({ name: 'AdminForgotPassword' })

  const router = useRouter()
  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const form = reactive({ email: '' })
  const rules: FormRules = {
    email: [
      { required: true, message: '请输入有效的邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入有效的邮箱', trigger: 'blur' }
    ]
  }

  const handleSubmit = async () => {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    loading.value = true
    try {
      await forgotPassword(form.email)
      ElMessage.success('重置邮件已发送，请查收邮箱')
      await router.push(buildAdminUrl('login'))
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || '发送失败，请检查邮箱是否正确')
    } finally {
      loading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .auth-page {
    display: flex;
    width: 100%;
    height: 100vh;
    min-height: 100vh;
    background: var(--default-box-color);
  }

  .auth-main {
    position: relative;
    flex: 1;
    min-width: 0;
  }

  .auth-right-wrap {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: min(440px, 100%);
    min-height: 620px;
    padding: 72px 28px 32px;
    margin: auto;
  }

  .auth-form {
    width: 100%;
  }

  .auth-title {
    margin: 0;
    font-size: 36px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .auth-subtitle {
    margin: 10px 0 24px;
    font-size: 14px;
    color: var(--art-gray-600);
  }

  .submit-button {
    width: 100%;
  }

  .auth-footer {
    margin-top: 22px;
    font-size: 14px;
    text-align: center;
  }

  .text-theme {
    color: var(--theme-color);
  }

  @media (width <= 640px) {
    .auth-right-wrap {
      position: relative;
      min-height: 100vh;
      padding-inline: 24px;
    }

    .auth-title {
      font-size: 30px;
    }
  }
</style>
