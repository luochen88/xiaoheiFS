<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="560px"
    destroy-on-close
    align-center
  >
    <ElForm :model="localForm" label-width="110px">
      <ElFormItem label="启用状态" prop="enabled">
        <ElSwitch v-model="localForm.enabled" />
      </ElFormItem>

      <ElFormItem label="执行策略">
        <ElSelect v-model="localForm.strategy" placeholder="请选择执行策略">
          <ElOption label="间隔执行" value="interval" />
          <ElOption label="每日执行" value="daily" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem v-if="localForm.strategy === 'interval'" label="执行间隔（秒）">
        <ElInputNumber v-model="localForm.interval_sec" :min="1" :step="10" style="width: 100%" />
      </ElFormItem>

      <ElFormItem v-else label="执行时间">
        <ElTimePicker
          v-model="localForm.daily_at"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="请选择每日执行时间"
          style="width: 100%"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">保存配置</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { ScheduledTaskRecord, ScheduledTaskStrategy } from '@/services/admin'

  defineOptions({ name: 'TaskConfigDialog' })

  interface TaskConfigFormValue {
    enabled: boolean
    strategy: ScheduledTaskStrategy
    interval_sec: number
    daily_at: string
  }

  interface Props {
    visible: boolean
    task?: ScheduledTaskRecord | null
    submitting?: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', value: TaskConfigFormValue): void
  }

  const props = withDefaults(defineProps<Props>(), {
    task: null,
    submitting: false
  })

  const emit = defineEmits<Emits>()
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogTitle = computed(() => {
    const name = String(props.task?.name || '')
    return name ? `配置 ${name}` : '配置'
  })

  const localForm = reactive<TaskConfigFormValue>(createDefaultForm())

  watch(
    () => [props.visible, props.task] as const,
    ([visible]) => {
      if (!visible) {
        return
      }

      applyTask(props.task)
    },
    { immediate: true, deep: true }
  )

  function createDefaultForm(): TaskConfigFormValue {
    return {
      enabled: false,
      strategy: 'interval',
      interval_sec: 3600,
      daily_at: '00:00'
    }
  }

  function applyTask(task?: ScheduledTaskRecord | null) {
    Object.assign(localForm, createDefaultForm(), {
      enabled: Boolean(task?.enabled),
      strategy: task?.strategy === 'daily' ? 'daily' : 'interval',
      interval_sec: Number(task?.interval_sec || 3600),
      daily_at: String(task?.daily_at || '00:00')
    })
  }

  function handleSubmit() {
    emit('submit', {
      enabled: localForm.enabled,
      strategy: localForm.strategy,
      interval_sec: Number(localForm.interval_sec || 0),
      daily_at: String(localForm.daily_at || '')
    })
  }
</script>

<style scoped lang="scss">
  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>
