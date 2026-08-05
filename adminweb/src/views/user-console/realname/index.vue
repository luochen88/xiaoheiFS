<template>
  <div>
    <ConsolePageHeader title="实名认证" description="查看认证状态并提交实名信息。">
      <template #actions>
        <ElButton :icon="Refresh" :loading="loading" @click="fetchStatus">刷新</ElButton>
      </template>
    </ConsolePageHeader>

    <div class="console-card realname-card">
      <div class="status-head">
        <div class="status-icon" :class="statusClass">
          <ElIcon><Finished /></ElIcon>
        </div>
        <div>
          <div class="status-title">{{ statusTitle }}</div>
          <div class="muted">{{ statusDescription }}</div>
        </div>
      </div>

      <ElDescriptions :column="2" border class="status-desc">
        <ElDescriptionsItem label="实名开关">{{
          status.enabled ? '已启用' : '未启用'
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="认证渠道">{{ status.provider || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="认证状态">
          <ElTag :type="statusTagType(verificationStatus)">{{ statusTitle }}</ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="认证时间">
          {{ formatDateTime(status.verification?.verified_at) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="失败原因" :span="2">
          {{ status.verification?.reason || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <div class="actions">
        <ElButton
          v-if="status.enabled && !status.verified"
          type="primary"
          @click="verifyOpen = true"
        >
          提交实名认证
        </ElButton>
      </div>
    </div>

    <ElDialog v-model="verifyOpen" title="提交实名认证" width="min(480px, calc(100vw - 32px))">
      <ElForm label-position="top">
        <ElFormItem label="真实姓名">
          <ElInput v-model.trim="form.real_name" maxlength="64" />
        </ElFormItem>
        <ElFormItem label="身份证号">
          <ElInput v-model.trim="form.id_number" maxlength="32" />
        </ElFormItem>
        <ElFormItem label="手机号">
          <ElInput v-model.trim="form.phone" maxlength="32" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="verifyOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submit">提交</ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="faceOpen"
      title="继续实名认证"
      width="min(420px, calc(100vw - 32px))"
      @closed="stopFacePolling"
    >
      <div class="face-dialog">
        <QrcodeVue v-if="faceRedirectUrl" :value="faceRedirectUrl" :size="220" level="M" />
        <div class="muted">请使用手机扫码或打开认证链接，完成后系统会自动刷新状态。</div>
        <div class="face-actions">
          <ElButton @click="copyFaceUrl">复制链接</ElButton>
          <ElButton @click="openFaceUrl">打开链接</ElButton>
          <ElButton type="primary" :loading="loading" @click="refreshFaceStatus">刷新状态</ElButton>
        </div>
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { Finished, Refresh } from '@element-plus/icons-vue'
  import QrcodeVue from 'qrcode.vue'
  import {
    getRealNameStatus,
    submitRealNameVerification,
    type RealNameStatusResponse
  } from '@/api/console-user'
  import { formatDateTime, normalizeStatus, statusTagType } from '@/utils/console-user'
  import ConsolePageHeader from '../shared/PageHeader.vue'
  import '../shared/styles.scss'

  defineOptions({ name: 'ConsoleUserRealname' })

  const loading = ref(false)
  const submitting = ref(false)
  const verifyOpen = ref(false)
  const faceOpen = ref(false)
  const faceRedirectUrl = ref('')
  const status = ref<RealNameStatusResponse>({})
  const form = reactive({ real_name: '', id_number: '', phone: '' })
  let facePollingTimer: number | null = null

  const verificationStatus = computed(() =>
    status.value.verified
      ? 'verified'
      : status.value.verification?.status || (status.value.enabled ? 'unverified' : 'disabled')
  )

  const statusTitle = computed(() => {
    const value = normalizeStatus(verificationStatus.value)
    const labels: Record<string, string> = {
      verified: '已认证',
      pending: '审核中',
      pending_review: '审核中',
      rejected: '未通过',
      failed: '未通过',
      disabled: '未启用',
      unverified: '未认证'
    }
    return labels[value] || '未认证'
  })

  const statusDescription = computed(() => {
    if (!status.value.enabled) return '当前站点未启用实名认证。'
    if (status.value.verified) return '实名认证已通过，可正常使用需要实名的功能。'
    if (normalizeStatus(status.value.verification?.status).includes('pending')) {
      return '认证资料已提交，等待审核。'
    }
    return '部分功能可能要求先完成实名认证。'
  })

  const statusClass = computed(() => ({
    success: status.value.verified,
    warning: status.value.enabled && !status.value.verified
  }))

  async function fetchStatus() {
    loading.value = true
    try {
      status.value = await getRealNameStatus()
    } finally {
      loading.value = false
    }
  }

  async function submit() {
    if (!form.real_name || !form.id_number) {
      ElMessage.warning('请填写真实姓名和身份证号')
      return
    }
    submitting.value = true
    try {
      const response = await submitRealNameVerification({
        real_name: form.real_name,
        id_number: form.id_number,
        phone: form.phone || undefined
      })
      ElMessage.success('实名认证资料已提交')
      verifyOpen.value = false
      if (response.redirect_url) {
        handleFaceRedirect(response.redirect_url)
        return
      }
      await fetchStatus()
    } finally {
      submitting.value = false
    }
  }

  function isMobileUA() {
    if (typeof navigator === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone|Mobile/i.test(
      navigator.userAgent || ''
    )
  }

  function handleFaceRedirect(url: string) {
    const target = String(url || '').trim()
    if (!target) {
      return
    }
    if (isMobileUA()) {
      window.location.href = target
      return
    }
    faceRedirectUrl.value = target
    faceOpen.value = true
    startFacePolling()
  }

  function stopFacePolling() {
    if (facePollingTimer) {
      window.clearInterval(facePollingTimer)
      facePollingTimer = null
    }
  }

  function startFacePolling() {
    stopFacePolling()
    facePollingTimer = window.setInterval(async () => {
      await fetchStatus()
      const value = normalizeStatus(status.value.verification?.status)
      if (status.value.verified || value === 'verified') {
        stopFacePolling()
        faceOpen.value = false
        ElMessage.success('实名认证已完成')
      } else if (value === 'failed' || value === 'rejected') {
        stopFacePolling()
        faceOpen.value = false
        ElMessage.error(status.value.verification?.reason || '实名认证失败')
      }
    }, 3000)
  }

  async function copyFaceUrl() {
    if (!faceRedirectUrl.value) return
    try {
      await navigator.clipboard.writeText(faceRedirectUrl.value)
      ElMessage.success('链接已复制')
    } catch {
      ElMessage.error('复制失败')
    }
  }

  function openFaceUrl() {
    if (!faceRedirectUrl.value) return
    window.open(faceRedirectUrl.value, '_blank', 'noopener')
  }

  async function refreshFaceStatus() {
    await fetchStatus()
    const value = normalizeStatus(status.value.verification?.status)
    if (status.value.verified || value === 'verified') {
      stopFacePolling()
      faceOpen.value = false
      ElMessage.success('实名认证已完成')
      return
    }
    if (value === 'failed' || value === 'rejected') {
      stopFacePolling()
      faceOpen.value = false
      ElMessage.error(status.value.verification?.reason || '实名认证失败')
      return
    }
    ElMessage.info('状态仍在审核中，请稍后再试')
  }

  onMounted(fetchStatus)

  onBeforeUnmount(stopFacePolling)
</script>

<style scoped lang="scss">
  .realname-card {
    padding: 22px;
  }

  .status-head {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }

  .status-icon {
    display: flex;
    width: 56px;
    height: 56px;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: var(--el-fill-color-light);
    color: var(--art-gray-500);
    font-size: 26px;

    &.success {
      background: var(--el-color-success-light-9);
      color: var(--el-color-success);
    }

    &.warning {
      background: var(--el-color-warning-light-9);
      color: var(--el-color-warning);
    }
  }

  .status-title {
    color: var(--art-gray-900);
    font-size: 22px;
    font-weight: 700;
  }

  .status-desc {
    margin-top: 12px;
  }

  .actions {
    margin-top: 18px;
  }

  .face-dialog {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .face-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
</style>
