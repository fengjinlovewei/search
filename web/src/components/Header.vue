<template>
  <div class="tab-box">
    <el-menu
      :default-active="defaultAction"
      class="menu-box"
      mode="horizontal"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
    >
      <el-menu-item index="name" class="project-name-box" disabled>
        <div class="project-name">
          <span>项目名称：</span>
          <span>{{ core.coreData?.projectName }}</span>
        </div>
      </el-menu-item>
      <el-menu-item
        :index="`${index}`"
        v-for="(tab, index) of routes"
        :key="index"
        @click="jumpRouter(tab)"
        >{{ tab?.name }}</el-menu-item
      >
    </el-menu>
  </div>
  <div class="tab-none"></div>
</template>

<script setup lang="ts">
import { routes } from '@/router';
import { useStore } from '@/store';
import { Tab } from '@/common';
import { useRouter, useRoute } from 'vue-router';
import { reactive, ref } from 'vue';

const router = useRouter();

const store = useStore();
const route = useRoute();

const { core } = store.state;

setTimeout(() => {
  const tab = Tab.filter((item) => {
    return route.path === item.path;
  })[0];

  defaultAction.value = import.meta.env.DEV
    ? `${tab.index}`
    : `${core.coreTab?.index}`;
});

const defaultAction = ref('');

const jumpRouter = (route: any) => {
  router.push({ path: route.path });
};
</script>

<style>
.tab-box {
  width: 100%;
  box-sizing: border-box;
  height: 60px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}
.project-name-box {
  opacity: 1 !important;
  height: auto !important;
}
.project-name {
  height: 100%;
  flex-direction: column;
  display: flex;
  color: #ffd04b !important;
  justify-content: center;
  font-size: 16px !important;
  font-weight: 500;
  padding-right: 40px;
  cursor: default;
}
.project-name span {
  line-height: 20px;
}
.tab-box .el-menu-item {
  font-size: 20px;
}
.menu-box {
  padding: 0 40px 0;
}
</style>
