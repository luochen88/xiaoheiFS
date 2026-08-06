<template>
  <div class="auth-page">
    <LoginLeftView />

    <main class="auth-main">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="auth-form">
          <h1 class="auth-title">重置密码</h1>
          <p class="auth-subtitle">请输入您的新密码</p>

          <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
            <ElFormItem label="新密码" prop="new_password">
              <ElInput
                v-model="form.new_password"
                type="password"
                placeholder="请输入新密码"
                size="large"
                :maxlength="INPUT_LIMITS.PASSWORD"
                autocomplete="new-password"
                show-password
              />
            </ElFormItem>
            <ElFormItem label="确认密码" prop="confirm_password">
              <ElInput
                v-model="form.confirm_password"
                type="password"
                placeholder="请再次输入新密码"
                size="large"
                :maxlength="INPUT_LIMITS.PASSWORD"
                autocomplete="new-password"
                show-password
              />
            </ElFormItem>
            <ElButton
              class="submit-button"
              type="primary"
              size="large"
              :loading="loading"
              @click="handleSubmit"
            >
              重置密码
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
  import { resetPassword } from '@/services/user'
  import { buildAdminUrl } from '@/services/adminPath'
  import { INPUT_LIMITS } from '@/constants/inputLimits'

  defineOptions({ name: 'AdminResetPassword' })

  const router = useRouter()
  const route = useRoute()
  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const token = ref('')
  const form = reactive({ new_password: '', confirm_password: '' })
  const rules: FormRules = {
    new_password: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, max: INPUT_LIMITS.PASSWORD, message: '密码至少6位', trigger: 'blur' }
    ],
    confirm_password: [
      { required: true, message: '请确认新密码', trigger: 'blur' },
      {
        validator: () =>
          form.confirm_password === form.new_password
            ? Promise.resolve()
            : Promise.reject('两次输入的密码不一致'),
        trigger: 'blur'
      }
    ]
  }

  const handleSubmit = async () => {
    if (!token.value) {
      ElMessage.error('无效的重置令牌')
      return
    }
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    loading.value = true
    try {
      await resetPassword(token.value, form.new_password)
      ElMessage.success('密码已重置，请使用新密码登录')
      await router.push(buildAdminUrl('login'))
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || '重置失败，令牌可能已过期')
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    token.value = String(route.query.token || '')
    if (!token.value) ElMessage.error('缺少重置令牌')
  })
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
