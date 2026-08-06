<template>
  <div class="auth-page">
    <LoginLeftView />

    <main class="auth-main">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="auth-form">
          <div class="admin-kicker">运营管理后台</div>
          <h1 class="auth-title">管理员登录</h1>
          <p class="auth-subtitle">面向运营与审核的管理中心，实时掌控订单与资源。</p>

          <ElForm
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
            @keyup.enter="handleSubmit"
          >
            <ElFormItem label="用户名" prop="username">
              <ElInput v-model="form.username" size="large" autocomplete="username" clearable>
                <template #prefix><ArtSvgIcon icon="ri:admin-line" /></template>
              </ElInput>
            </ElFormItem>
            <ElFormItem label="密码" prop="password">
              <ElInput
                v-model="form.password"
                type="password"
                size="large"
                :maxlength="INPUT_LIMITS.PASSWORD"
                autocomplete="current-password"
                show-password
              >
                <template #prefix><ArtSvgIcon icon="ri:lock-password-line" /></template>
              </ElInput>
            </ElFormItem>

            <div class="auth-actions">
              <RouterLink :to="buildAdminUrl('forgot-password')">忘记密码？</RouterLink>
            </div>
            <ElButton
              class="submit-button"
              type="primary"
              size="large"
              :loading="admin.loading"
              @click="handleSubmit"
              v-ripple
            >
              登录
            </ElButton>
          </ElForm>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { useAdminAuthStore } from '@/stores/adminAuth'
  import { buildAdminUrl, getCachedAdminPath } from '@/services/adminPath'
  import { INPUT_LIMITS } from '@/constants/inputLimits'

  defineOptions({ name: 'AdminLogin' })

  const admin = useAdminAuthStore()
  const router = useRouter()
  const route = useRoute()
  const formRef = ref<FormInstance>()
  const form = reactive({ username: '', password: '' })
  const rules: FormRules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
  }

  const getCurrentAdminPath = () => {
    const pathSegments = route.path.split('/').filter(Boolean)
    return pathSegments[0] || getCachedAdminPath()
  }

  const handleSubmit = async () => {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    if (form.password.length > INPUT_LIMITS.PASSWORD) {
      ElMessage.error(`密码长度不能超过 ${INPUT_LIMITS.PASSWORD} 个字符`)
      return
    }

    const adminPath = getCurrentAdminPath()
    const token = await admin.login({
      ...form,
      admin_path: adminPath
    })
    if (!token) {
      ElMessage.error('登录失败')
      return
    }

    // 登录响应可能要求绑定或验证 2FA，交由全局门禁弹窗继续处理。
    admin.setMfaGateState({
      mfaRequired: admin.mfaRequired,
      mfaBindRequired: admin.mfaBindRequired,
      mfaUnlocked: admin.mfaUnlocked,
      totpEnabled: admin.totpEnabled
    })

    const redirectPath = String(route.query.redirect || `/${adminPath}/console`)
    window.location.href = redirectPath
    await router.isReady()
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

  .admin-kicker {
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--theme-color);
    letter-spacing: 0.08em;
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
    line-height: 1.7;
    color: var(--art-gray-600);
  }

  .auth-actions {
    margin: 6px 0 20px;
    font-size: 14px;
    text-align: right;
  }

  .auth-actions a {
    color: var(--theme-color);
  }

  .submit-button {
    width: 100%;
    height: 40px;
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
