<template>
  <div class="realname-page pb-5" v-loading="loading">
    <div class="page-heading">
      <div>
        <h2>实名认证</h2>
        <p>提交真实身份信息并查看认证进度</p>
      </div>
      <ElSpace wrap>
        <ElButton :loading="loading" v-ripple @click="fetchStatus">
          <ArtSvgIcon icon="ri:refresh-line" class="button-icon" />
          刷新状态
        </ElButton>
        <ElButton
          v-if="isEnabled && !isVerified"
          type="primary"
          :loading="submitting"
          v-ripple
          @click="openVerifyDialog"
        >
          <ArtSvgIcon icon="ri:id-card-line" class="button-icon" />
          {{ verification ? '重新认证' : '立即认证' }}
        </ElButton>
      </ElSpace>
    </div>

    <ElAlert
      v-if="!isEnabled && !loading"
      title="实名认证功能未启用"
      description="当前系统未启用实名认证功能，如有疑问请联系管理员。"
      type="info"
      show-icon
      :closable="false"
      class="status-alert"
    />

    <template v-else>
      <ElCard class="art-card-xs status-card">
        <div class="status-summary">
          <div class="status-icon" :class="`status-icon-${status}`">
            <ArtSvgIcon :icon="statusIcon" />
          </div>
          <div class="status-copy">
            <div class="status-title-row">
              <h3>{{ statusTitle }}</h3>
              <ElTag :type="statusTagType" effect="light">{{ statusLabel }}</ElTag>
            </div>
            <p>{{ statusDescription }}</p>
          </div>
        </div>
      </ElCard>

      <div class="content-grid">
        <ElCard class="art-card-xs">
          <template #header>
            <div class="card-heading">
              <ArtSvgIcon icon="ri:file-user-line" />
              <span>认证信息</span>
            </div>
          </template>

          <ElDescriptions v-if="verification" :column="1" border>
            <ElDescriptionsItem label="真实姓名">
              {{ maskName(getVerificationName(verification)) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="证件号码">
              {{ maskIdNumber(getVerificationIdNumber(verification)) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="提交时间">
              {{ formatDate(getVerificationCreatedAt(verification)) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="getVerificationVerifiedAt(verification)" label="审核时间">
              {{ formatDate(getVerificationVerifiedAt(verification)) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem
              v-if="
                getVerificationStatus(verification) === 'failed' &&
                getVerificationReason(verification)
              "
              label="拒绝原因"
            >
              <span class="error-text">{{ getVerificationReason(verification) }}</span>
            </ElDescriptionsItem>
          </ElDescriptions>
          <ElEmpty v-else description="尚未提交认证信息" :image-size="96" />
        </ElCard>

        <ElCard v-if="!isVerified" class="art-card-xs">
          <template #header>
            <div class="card-heading">
              <ArtSvgIcon icon="ri:list-check-3" />
              <span>认证流程</span>
            </div>
          </template>
          <ElSteps direction="vertical" :active="currentStep" finish-status="success">
            <ElStep title="填写信息" description="输入真实姓名和身份证号码" />
            <ElStep title="提交验证" description="认证服务校验提交的信息" />
            <ElStep title="等待结果" description="按服务商提示完成人脸认证或等待审核" />
            <ElStep title="认证完成" description="账户解锁受实名保护的功能" />
          </ElSteps>
        </ElCard>

        <ElCard class="art-card-xs notice-card">
          <template #header>
            <div class="card-heading">
              <ArtSvgIcon icon="ri:shield-check-line" />
              <span>信息安全</span>
            </div>
          </template>
          <div class="notice-list">
            <div>
              <ArtSvgIcon icon="ri:lock-2-line" />
              <span>身份信息仅用于认证，不会在控制台完整展示。</span>
            </div>
            <div>
              <ArtSvgIcon icon="ri:customer-service-2-line" />
              <span>认证异常或长时间未更新时，请联系技术支持。</span>
            </div>
          </div>
        </ElCard>
      </div>
    </template>

    <ElDialog
      v-model="verifyDialogVisible"
      title="提交实名认证"
      width="min(460px, 92vw)"
      align-center
      destroy-on-close
      @closed="resetForm"
    >
      <ElAlert
        title="请确保信息真实有效"
        description="虚假或错误信息可能导致认证失败。"
        type="warning"
        show-icon
        :closable="false"
        class="dialog-alert"
      />
      <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
        <ElFormItem label="真实姓名" prop="real_name">
          <ElInput
            v-model.trim="form.real_name"
            placeholder="请输入真实姓名"
            :maxlength="20"
            show-word-limit
          />
        </ElFormItem>
        <ElFormItem label="身份证号码" prop="id_number">
          <ElInput
            v-model.trim="form.id_number"
            placeholder="请输入 18 位身份证号码"
            :maxlength="18"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="verifyDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitVerification"
          >提交认证</ElButton
        >
      </template>
    </ElDialog>

    <ElDialog
      v-model="faceDialogVisible"
      title="手机扫码完成人脸认证"
      width="min(440px, 92vw)"
      align-center
      :close-on-click-modal="false"
      @closed="closeFaceDialog"
    >
      <ElAlert
        title="请使用手机扫码"
        description="在手机浏览器或微信中打开页面，并按认证服务商提示完成操作。"
        type="info"
        show-icon
        :closable="false"
        class="dialog-alert"
      />
      <div class="face-qr-wrap">
        <QrcodeVue
          v-if="faceRedirectUrl"
          :value="faceRedirectUrl"
          :size="220"
          level="M"
          render-as="svg"
        />
        <ElEmpty v-else description="二维码生成失败" :image-size="96" />
      </div>
      <template #footer>
        <ElButton :disabled="!faceRedirectUrl" @click="copyFaceUrl">复制链接</ElButton>
        <ElButton :disabled="!faceRedirectUrl" @click="openFaceUrl">在当前设备打开</ElButton>
        <ElButton type="primary" :loading="refreshingFaceStatus" @click="refreshFaceStatus">
          我已完成，刷新状态
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules, TagProps } from 'element-plus'
  import QrcodeVue from 'qrcode.vue'
  import { getRealNameStatus, submitRealNameVerification } from '@/services/user'
  import type { RealNameStatusResponse, RealNameVerification } from '@/services/types'

  defineOptions({ name: 'ConsoleRealname' })

  type TagType = TagProps['type']

  interface VerificationRecord extends RealNameVerification {
    RealName?: string
    IDNumber?: string
    Status?: string
    Reason?: string
    RedirectURL?: string
    CreatedAt?: string
    VerifiedAt?: string
  }

  interface RealnamePayload extends RealNameStatusResponse {
    Enabled?: boolean
    Verified?: boolean
    Verification?: VerificationRecord
    verification?: VerificationRecord
  }

  const loading = ref(false)
  const submitting = ref(false)
  const refreshingFaceStatus = ref(false)
  const verifyDialogVisible = ref(false)
  const faceDialogVisible = ref(false)
  const faceRedirectUrl = ref('')
  const realname = ref<RealnamePayload>({})
  const formRef = ref<FormInstance>()
  let facePollingTimer: ReturnType<typeof setInterval> | undefined

  const form = reactive({ real_name: '', id_number: '' })
  const rules: FormRules<typeof form> = {
    real_name: [
      { required: true, message: '请输入真实姓名', trigger: 'blur' },
      { min: 2, max: 20, message: '姓名长度应为 2-20 个字符', trigger: 'blur' }
    ],
    id_number: [
      { required: true, message: '请输入身份证号码', trigger: 'blur' },
      {
        pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
        message: '请输入正确的身份证号码',
        trigger: 'blur'
      }
    ]
  }

  const isEnabled = computed(() => realname.value.enabled ?? realname.value.Enabled ?? false)
  const isVerified = computed(() => realname.value.verified ?? realname.value.Verified ?? false)
  const verification = computed<VerificationRecord | undefined>(
    () => realname.value.verification ?? realname.value.Verification
  )

  const getVerificationName = (record: VerificationRecord): string =>
    record.real_name ?? record.RealName ?? ''
  const getVerificationIdNumber = (record: VerificationRecord): string =>
    record.id_number ?? record.IDNumber ?? ''
  const getVerificationStatus = (record: VerificationRecord): string =>
    record.status ?? record.Status ?? ''
  const getVerificationReason = (record: VerificationRecord): string =>
    record.reason ?? record.Reason ?? ''
  const getVerificationCreatedAt = (record: VerificationRecord): string =>
    record.created_at ?? record.CreatedAt ?? ''
  const getVerificationVerifiedAt = (record: VerificationRecord): string =>
    record.verified_at ?? record.VerifiedAt ?? ''

  const status = computed(() => {
    if (!isEnabled.value) return 'disabled'
    if (isVerified.value) return 'verified'
    return getVerificationStatus(verification.value ?? {}) || 'unknown'
  })

  const statusTitle = computed(() => {
    if (!isEnabled.value) return '功能未启用'
    if (isVerified.value) return '认证已通过'
    if (status.value === 'failed') return '认证未通过'
    if (status.value === 'pending') return '认证审核中'
    return '尚未认证'
  })

  const statusDescription = computed(() => {
    if (!isEnabled.value) return '当前系统未启用实名认证功能。'
    if (isVerified.value) return '您已完成实名认证，可以使用受实名保护的功能。'
    if (status.value === 'failed') {
      return getVerificationReason(verification.value ?? {}) || '请检查信息后重新提交认证。'
    }
    if (status.value === 'pending') return '认证服务正在处理您的信息，请耐心等待。'
    return '完成实名认证后可继续访问受实名保护的功能。'
  })

  const statusLabel = computed(() => {
    if (isVerified.value) return '已认证'
    if (status.value === 'pending') return '审核中'
    if (status.value === 'failed') return '未通过'
    if (status.value === 'disabled') return '未启用'
    return '未认证'
  })

  const statusTagType = computed<TagType>(() => {
    if (isVerified.value) return 'success'
    if (status.value === 'pending') return 'warning'
    if (status.value === 'failed') return 'danger'
    return 'info'
  })

  const statusIcon = computed(() => {
    if (isVerified.value) return 'ri:verified-badge-line'
    if (status.value === 'pending') return 'ri:time-line'
    if (status.value === 'failed') return 'ri:close-circle-line'
    return 'ri:user-follow-line'
  })

  const currentStep = computed(() => {
    if (isVerified.value) return 4
    if (status.value === 'pending') return 3
    return verification.value ? 2 : 1
  })

  const maskName = (name: string): string => {
    if (!name) return '-'
    if (name.length <= 2) return `${name.charAt(0)}*`
    return `${name.charAt(0)}${'*'.repeat(name.length - 2)}${name.charAt(name.length - 1)}`
  }

  const maskIdNumber = (idNumber: string): string => {
    if (!idNumber || idNumber.length < 8) return idNumber || '-'
    return `${idNumber.slice(0, 4)}********${idNumber.slice(-4)}`
  }

  const formatDate = (value: string): string => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('zh-CN')
  }

  const unwrapPayload = (value: unknown): RealnamePayload => {
    if (!value || typeof value !== 'object') return {}
    const payload = value as Record<string, unknown>
    if (payload.data && typeof payload.data === 'object') return payload.data as RealnamePayload
    return payload as RealnamePayload
  }

  const fetchStatus = async (): Promise<void> => {
    loading.value = true
    try {
      const response = await getRealNameStatus()
      realname.value = unwrapPayload(response.data)
    } finally {
      loading.value = false
    }
  }

  const openVerifyDialog = (): void => {
    verifyDialogVisible.value = true
  }

  const resetForm = (): void => {
    Object.assign(form, { real_name: '', id_number: '' })
    formRef.value?.resetFields()
  }

  const isMobileUserAgent = (): boolean =>
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone|Mobile/i.test(
      navigator.userAgent || ''
    )

  const stopFacePolling = (): void => {
    if (!facePollingTimer) return
    clearInterval(facePollingTimer)
    facePollingTimer = undefined
  }

  const startFacePolling = (): void => {
    stopFacePolling()
    facePollingTimer = setInterval(() => {
      void pollFaceStatus()
    }, 3000)
  }

  const openFaceDialog = (url: string): void => {
    faceRedirectUrl.value = url
    faceDialogVisible.value = true
    startFacePolling()
  }

  const closeFaceDialog = (): void => {
    stopFacePolling()
    faceRedirectUrl.value = ''
  }

  const submitVerification = async (): Promise<void> => {
    if (!formRef.value) return
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    try {
      const response = await submitRealNameVerification({
        real_name: form.real_name,
        id_number: form.id_number
      })
      const payload = unwrapPayload(response.data) as VerificationRecord
      const redirectUrl = payload.redirect_url ?? payload.RedirectURL ?? ''
      verifyDialogVisible.value = false
      resetForm()

      if (redirectUrl) {
        if (isMobileUserAgent()) {
          ElMessage.success('正在跳转到人脸认证页面')
          window.location.href = redirectUrl
          return
        }
        openFaceDialog(redirectUrl)
        ElMessage.info('请使用手机扫码完成人脸认证')
        await fetchStatus()
        return
      }

      ElMessage.success('认证信息已提交')
      await fetchStatus()
    } finally {
      submitting.value = false
    }
  }

  const pollFaceStatus = async (): Promise<void> => {
    const response = await getRealNameStatus()
    realname.value = unwrapPayload(response.data)
    if (isVerified.value) {
      faceDialogVisible.value = false
      stopFacePolling()
      ElMessage.success('实名认证已完成')
      return
    }
    if (status.value === 'failed') {
      faceDialogVisible.value = false
      stopFacePolling()
      ElMessage.error(getVerificationReason(verification.value ?? {}) || '实名认证失败')
    }
  }

  const refreshFaceStatus = async (): Promise<void> => {
    refreshingFaceStatus.value = true
    try {
      await pollFaceStatus()
      if (!isVerified.value && status.value !== 'failed') {
        ElMessage.info('状态尚未更新，请稍后再试')
      }
    } finally {
      refreshingFaceStatus.value = false
    }
  }

  const copyFaceUrl = async (): Promise<void> => {
    if (!faceRedirectUrl.value) return
    try {
      await navigator.clipboard.writeText(faceRedirectUrl.value)
      ElMessage.success('认证链接已复制')
    } catch {
      ElMessage.error('复制失败，请手动复制')
    }
  }

  const openFaceUrl = (): void => {
    if (!faceRedirectUrl.value) return
    window.open(faceRedirectUrl.value, '_blank', 'noopener,noreferrer')
  }

  onMounted(() => {
    void fetchStatus()
  })

  onBeforeUnmount(() => {
    stopFacePolling()
  })
</script>

<style lang="scss" scoped>
  .page-heading {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 22px;
      color: var(--art-gray-900);
      letter-spacing: 0;
    }

    p {
      margin: 6px 0 0;
      font-size: 13px;
      color: var(--art-gray-600);
    }
  }

  .button-icon {
    margin-right: 6px;
  }

  .status-alert,
  .status-card {
    margin-bottom: 16px;
  }

  .status-summary {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .status-icon {
    display: grid;
    flex: none;
    place-items: center;
    width: 52px;
    height: 52px;
    font-size: 26px;
    color: var(--art-gray-700);
    background: var(--art-active-color);
    border-radius: calc(var(--custom-radius) / 2 + 4px);
  }

  .status-icon-verified {
    color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }

  .status-icon-pending {
    color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
  }

  .status-icon-failed {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }

  .status-copy {
    min-width: 0;

    p {
      margin: 6px 0 0;
      line-height: 1.6;
      color: var(--art-gray-600);
    }
  }

  .status-title-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 18px;
      color: var(--art-gray-900);
      letter-spacing: 0;
    }
  }

  .content-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .notice-card {
    grid-column: 1 / -1;
  }

  .card-heading {
    display: flex;
    gap: 8px;
    align-items: center;
    font-weight: 600;
    color: var(--art-gray-900);

    > :first-child {
      color: var(--theme-color);
    }
  }

  .error-text {
    color: var(--el-color-danger);
  }

  .notice-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;

    div {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      padding: 12px;
      line-height: 1.6;
      color: var(--art-gray-700);
      background: var(--default-bg-color);
      border: 1px solid var(--default-border);
      border-radius: calc(var(--custom-radius) / 2 + 2px);
    }

    svg {
      flex: none;
      margin-top: 3px;
      color: var(--theme-color);
    }
  }

  .dialog-alert {
    margin-bottom: 18px;
  }

  .face-qr-wrap {
    display: grid;
    place-items: center;
    min-height: 248px;
    padding: 14px;
    background: var(--el-color-white);
    border: 1px solid var(--default-border);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  @media (width <= 768px) {
    .page-heading {
      flex-direction: column;
    }

    .content-grid,
    .notice-list {
      grid-template-columns: 1fr;
    }

    .notice-card {
      grid-column: auto;
    }

    .status-summary {
      align-items: flex-start;
    }
  }
</style>
