<template>
  <div id="index-0" class="container-info">
    <el-row class="btn-box">
      <el-button type="primary" round @click="getHtml">邮件预览</el-button>
      <!-- <el-button type="primary" round @click="test">test</el-button> -->
    </el-row>
    <el-collapse accordion>
      <el-collapse-item
        :title="typeList[item.type] + ' ' + item.path"
        v-for="item in store.getters['core/changeList']"
      >
        <div v-if="item.children.length === 0">
          <el-tag type="info">{{ item.error ? item.error : '无数据' }}</el-tag>
        </div>
        <div v-else>
          <p v-for="child in item.children" class="pages-box">
            <el-tag type="danger" @click="openDialog(child)">{{
              child.entry
            }}</el-tag>
          </p>
        </div>
      </el-collapse-item>
    </el-collapse>
    <div v-if="store.getters['core/changeList'].length === 0">
      <h3>没有数据</h3>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { axiosEmailTemplate } from '@/api';
import { useStore } from '@/store';
import { typeList } from '@/common';

const store = useStore();

const getHtml = async () => {
  const data = window.emailCache || (await axiosEmailTemplate())?.data;

  store.commit('email/setEmailHTML', data);
  store.commit('email/setEmailVisible', true);
};

const openDialog = (child: SearchJsonType) => {
  // this.pageData = data;
  // this.dialogVisible = true;
};
</script>

<style scoped></style>
