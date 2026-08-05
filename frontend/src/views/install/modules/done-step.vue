<template>
  <section class="done-step">
    <ElResult icon="success" title="安装完成！">
      <template #sub-title>
        <span v-if="restartRequired">
          系统已成功配置 MySQL 数据库。需要重启后端服务以加载配置文件
          <code>{{ configFile }}</code>
        </span>
        <span v-else>小黑云财务已成功安装并可以使用</span>
      </template>

      <template #extra>
        <div class="result-details">
          <ElDescriptions :column="1" border>
            <ElDescriptionsItem label="管理后台">
              访问 <code>/{{ adminPath }}</code> 进入管理控制台
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="restartRequired" label="需要重启">
              重启后端服务或设置环境变量 <code>APP_DB_TYPE=mysql</code>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="重新安装">
              删除 <code>install.lock</code> 文件可重新安装
            </ElDescriptionsItem>
          </ElDescriptions>

          <div class="result-actions">
            <ElButton @click="goHome">
              <ElIcon><HomeFilled /></ElIcon>
              返回首页
            </ElButton>
            <ElButton type="primary" @click="goAdmin" v-ripple>
              <ElIcon><Grid /></ElIcon>
              进入后台
            </ElButton>
          </div>
        </div>
      </template>
    </ElResult>
  </section>
</template>

<script setup lang="ts">
  import { Grid, HomeFilled } from '@element-plus/icons-vue'

  defineOptions({ name: 'InstallDoneStep' })

  const props = defineProps<{
    adminPath: string
    restart: boolean
    configFile: string
  }>()

  const restartRequired = computed(() => props.restart)
  const configFile = computed(() => props.configFile)
  const adminPath = computed(() => props.adminPath)

  const goHome = () => window.location.replace('/')
  const goAdmin = () => {
    const cachedPath = localStorage.getItem('admin_path_cache') || props.adminPath || 'admin'
    window.location.replace(`/${cachedPath}/login`)
  }
</script>

<style lang="scss" scoped>
  .done-step {
    padding: 4px;
  }

  .result-details {
    width: min(620px, 100%);
    margin: 0 auto;
    text-align: left;
  }

  code {
    padding: 2px 6px;
    font-size: 12px;
    color: var(--theme-color);
    overflow-wrap: anywhere;
    background: var(--art-active-color);
    border-radius: calc(var(--custom-radius) / 3 + 2px);
  }

  .result-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 24px;
  }

  @media (width <= 640px) {
    .result-actions {
      display: grid;
      grid-template-columns: 1fr;
    }
  }
</style>
