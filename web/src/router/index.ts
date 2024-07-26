import { createRouter, createWebHistory } from 'vue-router';
import { Tab } from '@/common';
import Home from '@/components/Home.vue';
import Info from '@/components/Info.vue';
import Util from '@/components/Util.vue';
import All from '@/components/All.vue';

const components = [Home, Info, Util, All];

Tab.forEach((item) => {
  item.component = components[item.index];
});

export const routes = Tab;

export default createRouter({
  history: createWebHistory(),
  routes: [
    ...routes,
    {
      path: '/:pathMatch(.*)',
      redirect: '/',
    },
  ],
});
