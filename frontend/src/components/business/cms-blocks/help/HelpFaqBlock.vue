<template>
  <section class="help-faq" aria-labelledby="help-faq-title">
    <header class="help-faq__header">
      <span>FAQ</span>
      <h2 id="help-faq-title">{{ resolved.title }}</h2>
      <p>{{ resolved.subtitle }}</p>
    </header>

    <div class="help-faq__categories" role="group" aria-label="问题分类">
      <ElButton
        v-for="category in resolved.categories"
        :key="category.key"
        class="help-faq__category"
        :type="activeCategory === category.key ? 'primary' : 'default'"
        :plain="activeCategory !== category.key"
        @click="activeCategory = category.key"
      >
        <ArtSvgIcon :icon="category.icon" />
        <span>{{ category.label }}</span>
      </ElButton>
    </div>

    <ElCollapse v-if="filteredFaqs.length" v-model="openFaq" class="help-faq__list" accordion>
      <ElCollapseItem
        v-for="(faq, index) in filteredFaqs"
        :key="faqKey(faq, index)"
        :name="faqKey(faq, index)"
      >
        <template #title>
          <span class="help-faq__question-mark">Q</span>
          <span class="help-faq__question">{{ faq.question }}</span>
        </template>
        <div class="help-faq__answer">
          <span>A</span>
          <p>{{ faq.answer }}</p>
        </div>
      </ElCollapseItem>
    </ElCollapse>

    <ElEmpty v-else description="未找到相关问题" class="help-faq__empty">
      <ElButton type="primary" @click="emit('clear-search')">
        <ArtSvgIcon icon="ri:eraser-line" />
        <span>清除搜索</span>
      </ElButton>
    </ElEmpty>
  </section>
</template>

<script setup lang="ts">
  type Faq = { category: string; question: string; answer: string }
  type Category = { key: string; label: string; icon: string }

  const props = defineProps<{
    content?: Record<string, unknown>
    searchQuery: string
  }>()

  const emit = defineEmits<{
    (event: 'clear-search'): void
  }>()

  const activeCategory = ref('all')
  const openFaq = ref('')

  const fallbackCategories: Category[] = [
    { key: 'all', label: '全部', icon: 'ri:file-list-3-line' },
    { key: 'account', label: '账号相关', icon: 'ri:user-3-line' },
    { key: 'payment', label: '支付问题', icon: 'ri:bank-card-line' },
    { key: 'vps', label: 'VPS使用', icon: 'ri:server-line' },
    { key: 'billing', label: '账单退款', icon: 'ri:bill-line' }
  ]

  const fallbackFaqs: Faq[] = [
    {
      category: 'account',
      question: '如何注册账号？',
      answer:
        '点击页面右上角的"注册"按钮，填写用户名、邮箱和密码即可完成注册。注册后需要验证邮箱才能使用全部功能。'
    },
    {
      category: 'account',
      question: '忘记密码怎么办？',
      answer: '点击登录页面的"忘记密码"链接，输入您的注册邮箱，我们会发送密码重置链接到您的邮箱。'
    },
    {
      category: 'account',
      question: '如何修改个人资料？',
      answer:
        '登录后进入控制台，点击右上角的用户头像，选择"个人资料"，即可修改您的基本信息、联系方式等。'
    },
    {
      category: 'account',
      question: '如何开启二次验证？',
      answer:
        '在控制台的"安全设置"中，可以开启两步验证功能，支持验证器应用（如Google Authenticator）提高账户安全性。'
    },
    {
      category: 'payment',
      question: '支持哪些支付方式？',
      answer:
        '我们支持支付宝、微信支付、银行卡等多种支付方式。企业用户还可以申请对公转账和发票服务。'
    },
    {
      category: 'payment',
      question: '支付失败怎么办？',
      answer:
        '如果支付失败，请先检查账户余额是否充足。如问题仍未解决，请联系客服并提供订单号，我们会协助您处理。'
    },
    {
      category: 'payment',
      question: '可以申请发票吗？',
      answer:
        '可以。企业用户可以在控制台的"发票管理"中申请开具增值税专用发票或普通发票。个人用户可申请电子发票。'
    },
    {
      category: 'payment',
      question: '充值有优惠吗？',
      answer: '我们不定期会推出充值优惠活动，请关注我们的公告页面或订阅邮件通知获取最新优惠信息。'
    },
    {
      category: 'vps',
      question: 'VPS多久可以开通？',
      answer: '订单支付成功后，系统会自动开通VPS，通常在1-5分钟内完成。开通成功后您会收到邮件通知。'
    },
    {
      category: 'vps',
      question: '如何远程连接VPS？',
      answer:
        'Windows系统使用远程桌面连接，Linux系统使用SSH工具。控制台会显示您的IP地址和初始密码，请在首次登录后及时修改密码。'
    },
    {
      category: 'vps',
      question: 'VPS可以升级配置吗？',
      answer:
        '可以。在控制台的VPS管理页面，选择"升级配置"，选择更高配置的套餐并支付差价即可。升级过程不会影响您的数据。'
    },
    {
      category: 'vps',
      question: '如何重装系统？',
      answer:
        '在控制台选择您要重装的VPS，点击"重装系统"，选择所需的系统镜像并确认。重装会清空系统盘数据，请提前备份。'
    },
    {
      category: 'vps',
      question: 'VPS可以做什么？',
      answer:
        '您可以使用VPS搭建网站、运行应用程序、部署游戏服务器、搭建开发测试环境等。但请遵守我们的服务条款，禁止用于非法用途。'
    },
    {
      category: 'vps',
      question: '带宽是如何计算的？',
      answer:
        '我们提供的带宽是指峰值带宽，您可以随时使用达到该峰值。流量方面，不同套餐有不同配额，超出后可购买额外流量包。'
    },
    {
      category: 'billing',
      question: '如何查看我的账单？',
      answer:
        '登录控制台后，进入"账单管理"可以查看所有历史订单、消费记录和账单详情。支持按时间范围筛选和导出账单。'
    },
    {
      category: 'billing',
      question: '支持自动续费吗？',
      answer:
        '支持。您可以在VPS管理页面开启"自动续费"功能，系统会在到期前自动从余额扣款续费。请确保账户余额充足。'
    },
    {
      category: 'billing',
      question: '退款政策是什么？',
      answer:
        '我们提供7天无理由退款服务。新用户在首次购买后的7天内，如对服务不满意，可以申请全额退款（已使用流量按标准扣除费用）。'
    },
    {
      category: 'billing',
      question: 'VPS到期会怎样？',
      answer:
        'VPS到期后会被停用，数据保留15天。期间您可以续费恢复服务。超过15天未续费，服务器将被回收，数据将无法恢复。'
    }
  ]

  const iconByKey: Record<string, string> = {
    all: 'ri:file-list-3-line',
    account: 'ri:user-3-line',
    payment: 'ri:bank-card-line',
    vps: 'ri:server-line',
    billing: 'ri:bill-line'
  }

  const resolved = computed(() => {
    const content = props.content || {}
    const rawCategories = Array.isArray(content.categories) ? content.categories : []
    const rawFaqs = Array.isArray(content.faqs) ? content.faqs : []

    const categories: Category[] = rawCategories.length
      ? rawCategories.map((item: any) => {
          const key = String(item?.key ?? '')
          return {
            key,
            label: String(item?.label ?? ''),
            icon: iconByKey[key] || 'ri:question-line'
          }
        })
      : fallbackCategories

    const faqs: Faq[] = rawFaqs.length
      ? rawFaqs.map((item: any) => ({
          category: String(item?.category ?? 'all'),
          question: String(item?.question ?? ''),
          answer: String(item?.answer ?? '')
        }))
      : fallbackFaqs

    return {
      title: String(content.title ?? '常见问题'),
      subtitle: String(content.subtitle ?? '快速找到您关心的问题答案'),
      categories,
      faqs
    }
  })

  const filteredFaqs = computed(() => {
    let result = resolved.value.faqs
    if (activeCategory.value !== 'all') {
      result = result.filter((faq) => faq.category === activeCategory.value)
    }

    const query = props.searchQuery.trim().toLocaleLowerCase()
    return query
      ? result.filter(
          (faq) =>
            faq.question.toLocaleLowerCase().includes(query) ||
            faq.answer.toLocaleLowerCase().includes(query)
        )
      : result
  })

  const faqKey = (faq: Faq, index: number) => `${faq.category}-${faq.question}-${index}`
</script>

<style lang="scss" scoped>
  .help-faq {
    padding: 72px 24px 80px;
    background: color-mix(in srgb, var(--default-bg-color) 62%, var(--default-box-color));
    border-block: 1px solid var(--default-border);

    &__header {
      max-width: 720px;
      margin: 0 auto 32px;
      text-align: center;

      > span {
        font-size: 13px;
        font-weight: 700;
        color: var(--theme-color);
      }

      h2 {
        margin: 8px 0 10px;
        font-size: 34px;
        font-weight: 700;
        color: var(--art-gray-900);
        letter-spacing: 0;
      }

      p {
        margin: 0;
        color: var(--art-gray-600);
      }
    }

    &__categories {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      max-width: 920px;
      margin: 0 auto 28px;
    }

    &__category + &__category {
      margin-left: 0;
    }

    &__list {
      max-width: 900px;
      padding: 4px 24px;
      margin: 0 auto;
      background: var(--default-box-color);
      border: 1px solid var(--art-card-border);
      border-radius: calc(var(--custom-radius) / 2 + 4px);
      box-shadow: 0 16px 42px color-mix(in srgb, var(--art-gray-900) 7%, transparent);
    }

    &__question-mark {
      display: grid;
      place-items: center;
      width: 30px;
      aspect-ratio: 1;
      margin-right: 12px;
      color: var(--theme-color);
      background: color-mix(in srgb, var(--theme-color) 10%, var(--default-box-color));
      border-radius: calc(var(--custom-radius) / 2 + 1px);
    }

    &__question {
      min-width: 0;
      padding-right: 12px;
      font-weight: 600;
      color: var(--art-gray-800);
      overflow-wrap: anywhere;
    }

    &__answer {
      display: flex;
      gap: 12px;
      padding: 4px 42px 12px;

      > span {
        font-weight: 700;
        color: var(--art-success);
      }

      p {
        margin: 0;
        line-height: 1.75;
        color: var(--art-gray-600);
      }
    }

    &__empty {
      max-width: 900px;
      margin: 0 auto;
      background: var(--default-box-color);
      border: 1px solid var(--art-card-border);
      border-radius: calc(var(--custom-radius) / 2 + 4px);
    }
  }

  @media (width <= 640px) {
    .help-faq {
      padding: 56px 18px 64px;

      &__header h2 {
        font-size: 28px;
      }

      &__list {
        padding-inline: 16px;
      }

      &__answer {
        padding-inline: 0 28px;
      }
    }
  }
</style>
