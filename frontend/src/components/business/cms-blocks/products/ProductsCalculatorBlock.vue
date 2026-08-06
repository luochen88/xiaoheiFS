<template>
  <section class="products-calculator" aria-labelledby="products-calculator-title">
    <div class="products-calculator__inner">
      <h2 id="products-calculator-title">{{ content.title || '智能推荐' }}</h2>
      <p>{{ content.desc || '选择您的使用场景，我们将为您推荐最佳配置' }}</p>
      <div class="products-calculator__options" role="group" aria-label="使用场景">
        <ElButton
          v-for="(scenario, index) in scenarios"
          :key="`${scenario.name}-${index}`"
          class="products-calculator__option"
          :type="selectedScenario === index ? 'primary' : 'default'"
          :plain="selectedScenario !== index"
          @click="onSelect?.(index)"
        >
          <span class="products-calculator__emoji">{{ scenario.icon }}</span>
          <span>{{ scenario.name }}</span>
        </ElButton>
      </div>
      <div v-if="selectedScenario !== null" class="products-calculator__recommendation">
        <small>推荐配置</small>
        <strong>{{ scenarios[selectedScenario]?.recommended }}</strong>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  type Scenario = { icon?: string; name?: string; recommended?: string; plan?: number }
  defineProps<{
    content: { title?: string; desc?: string }
    scenarios: Scenario[]
    selectedScenario: number | null
    onSelect?: (index: number) => void
  }>()
</script>

<style lang="scss" scoped>
  .products-calculator {
    padding: 28px 24px 70px;
  }

  .products-calculator__inner {
    max-width: 920px;
    padding: 40px;
    margin: 0 auto;
    text-align: center;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) / 2 + 6px);
    box-shadow: 0 16px 42px color-mix(in srgb, var(--art-gray-900) 7%, transparent);
  }

  .products-calculator h2 {
    margin: 0 0 8px;
    font-size: 30px;
    color: var(--art-gray-900);
  }

  .products-calculator p {
    margin: 0;
    color: var(--art-gray-600);
  }

  .products-calculator__options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    margin-top: 28px;
  }

  .products-calculator__option + .products-calculator__option {
    margin-left: 0;
  }

  .products-calculator__emoji {
    margin-right: 5px;
  }

  .products-calculator__recommendation {
    display: inline-flex;
    gap: 10px;
    align-items: center;
    padding: 12px 16px;
    margin-top: 24px;
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 9%, var(--default-box-color));
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .products-calculator__recommendation small {
    color: var(--art-gray-600);
  }

  @media (width <= 640px) {
    .products-calculator {
      padding: 16px 18px 54px;
    }

    .products-calculator__inner {
      padding: 28px 18px;
    }
  }
</style>
