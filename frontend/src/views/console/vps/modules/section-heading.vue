<template>
  <div class="section-heading">
    <h2>{{ title }}</h2>
    <p v-if="subtitle">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'VpsSectionHeading' })

  withDefaults(defineProps<{ title: string; subtitle?: string }>(), {
    subtitle: ''
  })
</script>

<style scoped lang="scss">
  h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  p {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--art-gray-600);
  }
</style>
