<template>
  <Header />
  <Content>
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </Content>
</template>

<script setup lang="ts">
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import Header from '@/components/Header.vue';
import Content from '@/components/Content.vue';
import { axiosIndexData } from '@/api';
import { useStore } from '@/store';
import { useRouter, useRoute } from 'vue-router';
import { Tab } from '@/common';

const store = useStore();
(async () => {
  if (import.meta.env.DEV) {
    const data = await axiosIndexData();

    store.commit('core/setCoreData', data.data);
  }
})();
</script>

<style>
body {
  margin: 0;
  padding: 0;
}

div.el-dialog__body {
  padding-top: 0;
  padding-bottom: 0;
}

span.el-tree-node__label {
  font-size: 16px;
}
div.el-tree-node__content {
  height: 32px;
}
div.el-collapse-item__header {
  font-size: 18px;
}
span.el-tag {
  font-size: 16px;
}

.el-menu--horizontal > .el-menu-item.is-active {
  font-weight: 600;
}

div.el-collapse-item__content {
  font-size: 16px;
}

.util-box-header {
  display: flex;
}

.search-type {
  width: 200px;
}

.startRed {
  display: inline-flex;
  justify-content: flex-end;
  align-items: flex-start;
  flex: 0 0 auto;
  font-size: var(--el-form-label-font-size);
  color: var(--el-text-color-regular);
  height: 32px;
  line-height: 32px;
  box-sizing: border-box;
}
.startRed:before {
  content: '*';
  color: var(--el-color-danger);
  margin-right: 4px;
}
.el-message {
  z-index: 9000 !important;
}
</style>

<style>
#root {
  position: relative;
}

.container-info {
  height: calc(100vh - 120px);
  overflow-y: auto;
}
.input-with-select {
  padding-bottom: 20px;
}
.search-data-info {
  height: calc(100vh - 200px);
  overflow-y: auto;
}
.tab-pane-box {
  padding-left: 40px;
  height: calc(100vh - 140px);
  overflow-y: auto;
}
.tab-none {
  height: 100px;
}
.el-menu-demo {
  padding: 0 0px;
}
.title {
  padding: 20px 0;
}
.upload-box {
  padding-bottom: 20px;
}
.tree-foot {
  padding: 10px 0;
}
.file-tip1 {
  color: red;
}
.file-tip2 {
  color: #67c23a;
}
.tit {
  padding: 30px 0;
}
.pages-box {
  margin-top: 10px;
  cursor: pointer;
}
.pointer {
  cursor: pointer;
}
.qa-item {
  padding-bottom: 10px;
}
.img-box {
  display: flex;
}
.img-info {
  width: 45%;
  margin: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tag-info {
  padding: 5px 0;
}
.page-label {
  min-width: 80px;
}
.btn-box {
  padding-bottom: 20px;
}
.iframe-style {
  border: 0;
}
.interfaceCloseInfo {
  font-size: 14px;
  color: #409eff;
}

.interfaceCloseInfo a {
  font-size: 14px;
  color: #f56c6c;
}
.interfaceCloseInfo em {
  font-style: normal;
}

/*
垃圾文件样式
*/

.tit {
  padding: 50px 0;
}
.p-style {
  display: flex;
  font-size: 16px;
  margin: 15px 0;
}
.p-style .p-item {
  padding-left: 20px;
}
.p-style .p-item em {
  font-style: normal;
  color: red;
  font-weight: bold;
  cursor: pointer;
  text-decoration: underline;
}
.p-style span i {
  font-style: normal;
  color: red;
  font-weight: bold;
}
.scroll-box {
  width: 100%;
  height: 400px;
  overflow-y: scroll;
}
span.el-tag {
  cursor: pointer;
}
</style>
