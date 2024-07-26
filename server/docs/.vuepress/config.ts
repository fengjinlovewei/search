import data from './data.json';
import { defineConfig, SidebarItem4ShortcutTuple } from 'vuepress/config';

export default defineConfig({
  title: `${data.name}-文档`,
  base: `/${data.name}/`,
  dest: data.dest,
  cache: false,
  themeConfig: {
    search: false,
    sidebarDepth: 2,
    sidebar: [
      {
        title: '页面信息', // 必要的
        path: '/', // 可选的, 标题的跳转链接，应为绝对路径且必须存在
        children: data.page.children as Array<SidebarItem4ShortcutTuple>,
      },
    ],
  },
});
