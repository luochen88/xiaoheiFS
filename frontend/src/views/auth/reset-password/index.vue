<template>
  <div class="auth-page">
    <LoginLeftView />

    <main class="auth-main">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="auth-form">
          <ElResult
            icon="info"
            title="重置密码"
            sub-title="请通过“找回密码”流程完成身份验证后再重置密码。"
          >
            <template #extra>
              <ElButton type="primary" @click="goForgot" v-ripple>前往找回密码</ElButton>
            </template>
          </ElResult>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ResetPassword' })

  const router = useRouter()
  const goForgot = () => router.replace('/forgot-password')
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
    width: min(520px, 100%);
    padding: 72px 24px 32px;
    margin: auto;
  }

  .auth-form {
    width: 100%;
  }

  @media (width <= 640px) {
    .auth-right-wrap {
      position: relative;
      min-height: 100vh;
    }
  }
</style>
