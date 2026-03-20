<!-- 登录页面 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">{{ $t('login.title') }}</h3>
          <p class="sub-title">{{ $t('login.subTitle') }}</p>
          <ElForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            :key="formKey"
            @keyup.enter="handleSubmit"
            style="margin-top: 25px"
          >
            <ElFormItem prop="username">
              <ElInput
                v-model.trim="formData.username"
                class="custom-height"
                :placeholder="$t('login.placeholder.username')"
              />
            </ElFormItem>
            <ElFormItem prop="password">
              <ElInput
                v-model.trim="formData.password"
                class="custom-height"
                :placeholder="$t('login.placeholder.password')"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>

            <div class="relative pb-5 mt-6">
              <div
                class="relative z-[2] overflow-hidden select-none rounded-lg border border-transparent tad-300"
                :class="{ '!border-[#FF4E4F]': !isPassing && isClickPass }"
              >
                <ArtDragVerify
                  ref="dragVerify"
                  v-model:value="isPassing"
                  :text="$t('login.sliderText')"
                  textColor="var(--art-gray-700)"
                  :successText="$t('login.sliderSuccessText')"
                  progressBarBg="var(--main-color)"
                  :background="isDark ? '#26272F' : '#F1F1F4'"
                  handlerBg="var(--default-box-color)"
                />
              </div>
              <p
                class="absolute top-0 z-[1] px-px mt-2 text-xs text-[#f56c6c] tad-300"
                :class="{ 'translate-y-10': !isPassing && isClickPass }"
              >
                {{ $t('login.placeholder.slider') }}
              </p>
            </div>

            <div class="flex-cb mt-2 text-sm">
              <ElCheckbox v-model="formData.rememberPassword">{{
                $t('login.rememberPwd')
              }}</ElCheckbox>
              <RouterLink class="text-theme" :to="{ name: 'ForgetPassword' }">{{
                $t('login.forgetPwd')
              }}</RouterLink>
            </div>

            <div style="margin-top: 30px">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
                v-ripple
              >
                {{ $t('login.btnText') }}
              </ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>

    <ElDialog
      :model-value="mfaDialogVisible"
      width="520px"
      align-center
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      class="admin-mfa-dialog"
    >
      <template #header>
        <div class="mfa-header">
          <div class="mfa-title">{{ mfaDialogTitle }}</div>
          <div class="mfa-subtitle">{{ mfaDialogSubtitle }}</div>
        </div>
      </template>

      <ElAlert
        class="mfa-alert"
        :title="mfaDialogAlert"
        :type="mfaState.bindRequired ? 'warning' : 'info'"
        :closable="false"
        show-icon
      />

      <ElForm label-position="top" class="mfa-form">
        <ElFormItem v-if="mfaState.bindRequired" label="登录密码">
          <ElInput
            v-model.trim="mfaForm.password"
            type="password"
            show-password
            placeholder="用于生成 2FA 绑定信息，如未要求可留空"
          />
        </ElFormItem>

        <ElFormItem v-if="mfaState.bindRequired" label="生成绑定信息">
          <ElButton class="w-full" :loading="mfaLoading.setup" @click="handleSetupTwoFactor">
            生成 2FA 绑定信息
          </ElButton>
        </ElFormItem>

        <div v-if="mfaOtpAuthUrl && mfaSecret" class="mfa-setup-panel">
          <div class="mfa-qr-card">
            <QrcodeVue :value="mfaOtpAuthUrl" :size="168" level="M" render-as="svg" />
          </div>

          <div class="mfa-secret-card">
            <div class="mfa-secret-label">手动密钥</div>
            <div class="mfa-secret-value">{{ mfaSecret }}</div>
            <div class="mfa-secret-tip">
              请使用 Google 或 Microsoft Authenticator 扫码，然后输入 6 位验证码。
            </div>
          </div>
        </div>

        <ElFormItem label="2FA 验证码">
          <ElInput
            v-model.trim="mfaForm.totpCode"
            maxlength="6"
            inputmode="numeric"
            placeholder="请输入 6 位验证码"
            @input="handleTotpInput"
          />
        </ElFormItem>
      </ElForm>

      <div class="mfa-helper">验证码每 30 秒更新，请使用最新口令。</div>

      <template #footer>
        <div class="mfa-footer">
          <ElButton @click="resetPendingLogin">重新登录</ElButton>
          <ElButton type="primary" :loading="mfaLoading.confirm" @click="handleConfirmOrUnlock">
            {{ mfaState.bindRequired ? '完成绑定并登录' : '验证并登录' }}
          </ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/store/modules/user'
  import { useSiteStore } from '@/store/modules/site'
  import { useI18n } from 'vue-i18n'
  import { HttpError } from '@/utils/http/error'
  import { fetchLogin } from '@/api/auth'
  import {
    confirmAdminTwoFactor,
    type AdminLoginResponse,
    setupAdminTwoFactor,
    unlockAdminTwoFactor
  } from '@/api/admin'
  import { ElMessage, ElNotification, type FormInstance, type FormRules } from 'element-plus'
  import { useSettingStore } from '@/store/modules/setting'
  import {
    buildAdminHashUrl,
    ensureCurrentAdminPath,
    resolveLoginAdminPath
  } from '@/utils/adminPath'
  import QrcodeVue from 'qrcode.vue'

  defineOptions({ name: 'Login' })

  const settingStore = useSettingStore()
  const siteStore = useSiteStore()
  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()
  const { isDark } = storeToRefs(settingStore)
  const { t, locale } = useI18n()

  const formKey = ref(0)
  const dragVerify = ref<{ reset?: () => void } | null>(null)
  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const isPassing = ref(false)
  const isClickPass = ref(false)
  const pendingRedirect = ref('/')
  const mfaSecret = ref('')
  const mfaOtpAuthUrl = ref('')
  const mfaForm = reactive({
    password: '',
    totpCode: ''
  })
  const mfaLoading = reactive({
    setup: false,
    confirm: false
  })
  const mfaState = reactive({
    required: false,
    bindRequired: false,
    unlocked: true,
    totpEnabled: false
  })

  const systemName = computed(() => siteStore.resolvedSiteName)
  const mfaDialogVisible = computed(
    () => (mfaState.required || mfaState.bindRequired) && !mfaState.unlocked
  )
  const mfaDialogTitle = computed(() =>
    mfaState.bindRequired ? '管理员 2FA 绑定' : '管理员 2FA 验证'
  )
  const mfaDialogSubtitle = computed(() =>
    mfaState.bindRequired
      ? '首次登录需要先完成 2FA 绑定，然后才能进入后台。'
      : '请输入当前动态验证码，完成后台登录。'
  )
  const mfaDialogAlert = computed(() =>
    mfaState.bindRequired
      ? '需要先绑定 2FA 才能继续使用后台功能。'
      : '请输入 2FA 验证码以完成后台登录。'
  )

  const formData = reactive({
    username: '',
    password: '',
    rememberPassword: true
  })

  const rules = computed<FormRules>(() => ({
    username: [{ required: true, message: t('login.placeholder.username'), trigger: 'blur' }],
    password: [{ required: true, message: t('login.placeholder.password'), trigger: 'blur' }]
  }))

  watch(locale, () => {
    formKey.value++
  })

  onMounted(async () => {
    if (userStore.accessToken && !userStore.isLogin) {
      userStore.setToken('', '')
    }

    await tryRestoreHiddenAdminEntry()
  })

  const handleSubmit = async () => {
    if (!formRef.value) {
      return
    }

    try {
      const valid = await formRef.value.validate()
      if (!valid) {
        return
      }

      if (!isPassing.value) {
        isClickPass.value = true
        return
      }

      loading.value = true

      const adminPath = await resolveLoginAdminPath()
      const loginResponse = await fetchLogin({
        username: formData.username,
        password: formData.password,
        admin_path: adminPath
      })
      const { access_token, refresh_token } = loginResponse

      if (!access_token) {
        throw new Error('Login failed - no token received')
      }

      const redirect = route.query.redirect as string
      applyMfaGateState(loginResponse, redirect || '/')

      if (mfaDialogVisible.value) {
        userStore.setToken(access_token, refresh_token)
        userStore.setLoginStatus(false)
        return
      }

      userStore.setToken(access_token, refresh_token)
      userStore.setLoginStatus(true)
      showLoginSuccessNotice()
      router.push(redirect || '/')
    } catch (error) {
      if (error instanceof HttpError && error.code === 403) {
        await tryRestoreHiddenAdminEntry(true)
      } else {
        console.error('[Login] Unexpected error:', error)
      }
    } finally {
      loading.value = false
      resetDragVerify()
    }
  }

  function applyMfaGateState(loginResponse: AdminLoginResponse, redirect: string) {
    pendingRedirect.value = redirect || '/'
    mfaState.required = Boolean(loginResponse.mfa_required)
    mfaState.bindRequired = Boolean(loginResponse.mfa_bind_required)
    mfaState.unlocked = Boolean(loginResponse.mfa_unlocked)
    mfaState.totpEnabled = Boolean(loginResponse.totp_enabled)

    if (!mfaDialogVisible.value) {
      resetMfaForm()
    }
  }

  function resetMfaForm() {
    mfaForm.password = ''
    mfaForm.totpCode = ''
    mfaSecret.value = ''
    mfaOtpAuthUrl.value = ''
  }

  function clearMfaGateState() {
    mfaState.required = false
    mfaState.bindRequired = false
    mfaState.unlocked = true
    mfaState.totpEnabled = false
    pendingRedirect.value = '/'
    resetMfaForm()
  }

  async function handleSetupTwoFactor() {
    if (!mfaState.bindRequired || mfaLoading.setup) {
      return
    }

    mfaLoading.setup = true

    try {
      const password = String(mfaForm.password || '').trim()
      const response = await setupAdminTwoFactor({
        password: password || undefined
      })

      mfaSecret.value = String(response.secret || '')
      mfaOtpAuthUrl.value = String(response.otpauth_url || '')

      if (!mfaSecret.value || !mfaOtpAuthUrl.value) {
        ElMessage.error('生成 2FA 绑定信息失败')
        resetMfaForm()
        return
      }

      ElMessage.success('已生成 2FA 绑定信息')
    } catch (error) {
      if (!(error instanceof HttpError)) {
        console.error('[Login][2FA Setup] Unexpected error:', error)
      }
    } finally {
      mfaLoading.setup = false
    }
  }

  async function handleConfirmOrUnlock() {
    if (mfaLoading.confirm) {
      return
    }

    const code = String(mfaForm.totpCode || '')
      .replace(/\D/g, '')
      .slice(0, 6)

    if (!/^\d{6}$/.test(code)) {
      ElMessage.warning('请输入 6 位 2FA 验证码')
      return
    }

    mfaLoading.confirm = true

    try {
      if (mfaState.bindRequired) {
        if (!mfaSecret.value) {
          ElMessage.warning('请先生成绑定信息')
          return
        }

        await confirmAdminTwoFactor({ code })
      }

      const response = await unlockAdminTwoFactor({ totp_code: code })

      if (!response.access_token) {
        throw new Error('2FA unlock failed - no token received')
      }

      userStore.setToken(response.access_token, response.refresh_token || '')
      userStore.setLoginStatus(true)

      clearMfaGateState()
      resetDragVerify()
      showLoginSuccessNotice()
      await router.push(pendingRedirect.value || '/')
    } catch (error) {
      if (!(error instanceof HttpError)) {
        console.error('[Login][2FA Confirm] Unexpected error:', error)
      }
    } finally {
      mfaLoading.confirm = false
    }
  }

  function handleTotpInput() {
    mfaForm.totpCode = String(mfaForm.totpCode || '')
      .replace(/\D/g, '')
      .slice(0, 6)
  }

  function resetPendingLogin() {
    clearMfaGateState()
    userStore.setLoginStatus(false)
    userStore.setToken('', '')
    resetDragVerify()
  }

  const resetDragVerify = () => {
    dragVerify.value?.reset?.()
  }

  const showLoginSuccessNotice = () => {
    setTimeout(() => {
      ElNotification({
        title: t('login.success.title'),
        type: 'success',
        duration: 2500,
        zIndex: 10000,
        message: `${t('login.success.message')}, ${systemName.value}!`
      })
    }, 1000)
  }

  async function tryRestoreHiddenAdminEntry(showError: boolean = false) {
    const adminPathState = await ensureCurrentAdminPath()

    if (
      adminPathState.status !== 'invalid' ||
      !adminPathState.cachedPath ||
      adminPathState.cachedPath === adminPathState.currentPath
    ) {
      if (showError) {
        ElMessage.error(
          '\u5f53\u524d\u8bbf\u95ee\u5730\u5740\u4e0d\u662f\u6709\u6548\u7684\u7ba1\u7406\u5165\u53e3\uff0c\u8bf7\u68c0\u67e5\u9690\u85cf\u8def\u5f84'
        )
      }
      return
    }

    const targetUrl = buildAdminHashUrl(adminPathState.cachedPath, route.fullPath || '/auth/login')
    const message = `\u5f53\u524d\u5165\u53e3 /${adminPathState.currentPath} \u65e0\u6548\uff0c\u6b63\u5728\u5207\u6362\u5230 /${adminPathState.cachedPath}`

    if (showError) {
      ElMessage.error(message)
    } else {
      ElMessage.warning(message)
    }

    window.setTimeout(() => {
      window.location.replace(targetUrl)
    }, 500)
  }
</script>

<style scoped>
  @import './style.css';
</style>

<style lang="scss" scoped>
  :deep(.el-select__wrapper) {
    height: 40px !important;
  }
</style>
