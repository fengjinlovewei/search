import { defineConfig } from 'vite';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import path from 'path';
import vue from '@vitejs/plugin-vue';
import { createHtmlPlugin } from 'vite-plugin-html';

const debug = process.env.NODE_ENV !== 'production';

const injectScript = debug
  ? ''
  : `
<script type="">
  var DATA = {},TAB = [];
  try {
     DATA = <%-data%>;TAB = <%-tab%>;
  } catch (e) {}
</script>
`;

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  build: {
    outDir: '../server/views',
    emptyOutDir: true,
  },
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    createHtmlPlugin({
      minify: false,
      // entry: 'src/main.ts',
      // template: '../server/static/index.html',
      inject: {
        data: {
          injectScript,
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
