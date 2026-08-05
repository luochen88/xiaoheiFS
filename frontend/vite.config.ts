import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import vueDevTools from 'vite-plugin-vue-devtools'
import viteCompression from 'vite-plugin-compression'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import ElementPlus from 'unplugin-element-plus/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import tailwindcss from '@tailwindcss/vite'

const resolvePath = (p: string) => path.resolve(__dirname, p)

const BACKEND = 'http://localhost:8080'
const proxyTo = (target: string) => ({ target, changeOrigin: true })

/**
 * 配置说明
 *
 * 1. 不使用 .env 文件：仓库根 .gitignore 全局忽略 `.env` / `.env.*`（非锚定），
 *    env 文件无法随仓库分发，clean clone 会拿到空配置。因此模板所需的少量环境
 *    变量在这里通过 `define` 内联，保证任何克隆都能复现同一份构建。
 * 2. base 固定为 '/'：本应用是挂在站点根的唯一 SPA（公开站 + 控制台 + 管理后台）。
 * 3. 路由为 history 模式，后端 NoRoute 回落 index.html。
 */
export default defineConfig({
  base: '/',

  // 并行改造期间多个 git worktree 共用同一份 node_modules（软链），
  // 若沿用默认的 node_modules/.vite 会互相踩缓存，这里改成各自仓库内的目录。
  cacheDir: '.vite-cache',

  define: {
    // storage-config.ts 用它做本地存储版本号，版本变化即失效旧缓存
    __APP_VERSION__: JSON.stringify('0.1.0'),
    // 权限模式：frontend = 路由/菜单由前端 router/modules 定义
    'import.meta.env.VITE_ACCESS_MODE': JSON.stringify('frontend'),
    // 锁屏功能的本地混淆密钥（非机密，随包分发）
    'import.meta.env.VITE_LOCK_ENCRYPT_KEY': JSON.stringify('xiaoheifs-lock-key'),
    // 是否在控制台打印路由信息
    'import.meta.env.VITE_OPEN_ROUTE_INFO': JSON.stringify('false')
  },

  resolve: {
    alias: {
      '@': resolvePath('src'),
      '@views': resolvePath('src/views'),
      '@imgs': resolvePath('src/assets/images'),
      '@icons': resolvePath('src/assets/icons'),
      '@utils': resolvePath('src/utils'),
      '@plugins': resolvePath('src/plugins'),
      '@styles': resolvePath('src/assets/styles')
      // 注意：不定义 `@stores`。本项目有两个 store 目录：
      //   src/store/   —— Art Design Pro 基础设施（setting/worktab/menu/table/user）
      //   src/stores/  —— 业务 store（auth/cart/orders/...）
      // 一律用 `@/store/...` 与 `@/stores/...` 显式书写，避免歧义。
    }
  },

  plugins: [
    vue(),
    tailwindcss(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
      dts: 'src/types/import/auto-imports.d.ts',
      resolvers: [ElementPlusResolver()],
      eslintrc: { enabled: true, filepath: './.auto-import.json', globalsPropValue: true }
    }),
    Components({
      // 只自动注册 ADP 组件库与新的业务组件。
      //
      // 迁移期 src/components 根目录下还留着一批同名的 Ant Design 旧组件
      // （ConfirmAction / VpsStatusTag / OrderStatusBadge ...），如果一起扫描，
      // 旧组件会先被注册、新组件被静默忽略，页面就会拿到 antd 版本。
      // 旧页面都是显式 import 使用它们的，不需要自动注册。
      dirs: ['src/components/core', 'src/components/business'],
      dts: 'src/types/import/components.d.ts',
      resolvers: [ElementPlusResolver()]
    }),
    ElementPlus({ useSource: true }),
    viteCompression({
      verbose: false,
      disable: false,
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
      deleteOriginFile: false
    }),
    vueDevTools()
  ],

  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': proxyTo(BACKEND),
      '/admin/api': proxyTo(BACKEND),
      '/sdk': proxyTo(BACKEND),
      '/uploads': proxyTo(BACKEND)
    }
  },

  build: {
    target: 'es2015',
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true }
    },
    dynamicImportVarsOptions: {
      warnOnError: true,
      exclude: [],
      include: ['src/views/**/*.vue']
    }
  },

  optimizeDeps: {
    include: [
      'echarts/core',
      'echarts/charts',
      'echarts/components',
      'echarts/renderers',
      'xlsx',
      'xgplayer',
      'crypto-js',
      'file-saver',
      'vue-img-cutter',
      'element-plus/es',
      'element-plus/es/components/*/style/css',
      'element-plus/es/components/*/style/index'
    ]
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@styles/core/el-light.scss" as *;
          @use "@styles/core/mixin.scss" as *;
        `
      }
    },
    postcss: {
      plugins: [
        {
          postcssPlugin: 'internal:charset-removal',
          AtRule: {
            charset: (atRule) => {
              if (atRule.name === 'charset') atRule.remove()
            }
          }
        }
      ]
    }
  }
})
