<template>
  <div id="util-box">
    <el-input
      placeholder="请输入相对路径或绝对路径，多个英文逗号分割"
      v-model="search_text"
      class="input-with-select"
      @keyup.enter.native="getImport"
    >
      <template #prepend>
        <el-select
          v-model="search_type"
          multiple
          class="searc-type"
          placeholder="请选择类型"
        >
          <el-option
            v-for="item in search_type_options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
          </el-option>
        </el-select>
      </template>
      <template #append>
        <el-button :icon="Search" @click="getImport"></el-button>
      </template>
    </el-input>

    <div class="search-data-info" id="box">
      <div v-for="(item, index) in importTree" :key="'importTree' + item.path">
        <h2 class="title">
          <el-tag type="danger" size="small" effect="dark">被引用</el-tag>
          {{ item.path }}
        </h2>

        <div>
          <!-- <File :list="item.merge" :first="true" :type="-1"></File> -->
          <el-tree
            :data="item.merge"
            :ref="'treeImportData' + index"
            :id="'treeImportData' + index"
            :props="defaultProps"
            :load="
              loadNode_isCommon({
                id: 'treeImportData' + index,

                tree: importTree,
              })
            "
            lazy
            @node-click="pathClick"
            :render-after-expand="false"
          ></el-tree>
        </div>
        <RelationMap :data="[item.merge]" :indexPath="[item.path]" />
      </div>

      <div v-for="(item, index) in exportTree" :key="'exportTree' + item.path">
        <h2 class="title">
          <el-tag type="success" size="small" effect="dark">引用</el-tag>
          {{ item.path }}
        </h2>
        <div>
          <el-tree
            :data="item.merge"
            :ref="'treeExportData' + index"
            :id="'treeExportData' + index"
            :props="defaultProps"
            :load="
              loadNode_isCommon({
                id: 'treeExportData' + index,
                className: 'file-tip2',
                tree: exportTree,
              })
            "
            lazy
            @node-click="pathClick"
            :render-after-expand="false"
          ></el-tree>
        </div>
        <RelationMap :data="[item.merge]" :indexPath="[item.path]" />
      </div>
    </div>
    <!--  -->
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ElLoading } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { ref, onMounted } from 'vue';
import _ from 'lodash';
import { axiosImport, axiosExport } from '@/api';
import { loadNode_isCommon, dblclickOpenIde } from '@/util';
import RelationMap from './RelationMap.vue';

const search_text = ref<string>('');
const search_type = ref<string[]>(['0', '1']);
const importTree = ref<treeType>([]);
const exportTree = ref<treeType>([]);

const search_type_options = [
  {
    value: '0',
    label: '被引用',
  },
  {
    value: '1',
    label: '引用',
  },
];

const defaultProps = {
  children: 'children',
  label: 'label',
  isLeaf: 'leaf',
};

const pathClick = ({ label }: any) => {
  dblclickOpenIde(label);
};

// 获取被引入文件
const getImport = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: '分析过程可能长达几分钟，CPU燃烧中...',
    target: document.querySelector('#util-box') as HTMLElement,
    customClass: 'interfaceCloseBox',
  });

  const CancelToken = axios.CancelToken;
  const source = CancelToken.source();

  const interfaceCloseBox = document.querySelector(
    '.interfaceCloseBox .el-loading-spinner'
  );

  const div = document.createElement('span');

  div.innerHTML = `<span class="interfaceCloseInfo">已等待 <em id="activeNumber">0</em> 秒，<a href="javascript:;" id="activeClose">去尼玛不等了</a></span>`;

  const activeClose = div.querySelector<HTMLAnchorElement>('#activeClose');

  if (activeClose) {
    activeClose.onclick = function () {
      source.cancel('Operation canceled by the user.');
    };
  }

  const activeNumber = div.querySelector<HTMLElement>('#activeNumber');

  let second = 0;

  const timer = window.setInterval(() => {
    if (activeNumber) {
      activeNumber.innerHTML = `${++second}`;
    }
  }, 1000);

  interfaceCloseBox && interfaceCloseBox.appendChild(div);

  const path = search_text.value.split(',').map((item) => item.trim());

  const proList: [
    Promise<setImportResponse | null>,
    Promise<setExportResponse | null>
  ] = [Promise.resolve(null), Promise.resolve(null)];

  if (search_type.value.includes('0')) {
    proList[0] = axiosImport({ path, cancelToken: source.token });
  }

  if (search_type.value.includes('1')) {
    proList[1] = axiosExport({ path, cancelToken: source.token });
  }

  try {
    const [p1, p2] = await Promise.all(proList);

    importTree.value = p1?.data?.tree || [];
    exportTree.value = p2?.data?.tree || [];
  } catch (e) {
    console.log(e);
  }

  loading.close();
};
</script>

<style scoped></style>
