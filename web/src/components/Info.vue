<template>
  <div>
    <div>
      <el-tag type="success" size="small">提示：双击文件可在编辑器打开</el-tag>
    </div>
    <div
      v-for="(item, index) in store.getters['core/treeList']"
      :key="item.path"
    >
      <h2>{{ typeList[item.type] }} {{ item.path }}</h2>
      <div>
        <!-- <File :list="item.merge" :first="true" :type="-1"></File> -->
        <el-tree
          :data="item.merge"
          :ref="'treeRoot' + index"
          :id="'treeRoot' + index"
          :props="defaultProps"
          :load="
            loadNode_isCommon({
              id: 'treeRoot' + index,
              tree: store.getters['core/treeList'],
            })
          "
          lazy
          @node-click="pathClick"
          :render-after-expand="false"
        >
        </el-tree>
        <RelationMap :data="[item.merge]" :indexPath="[item.path]" />
      </div>
    </div>
    <div v-if="store.getters['core/treeList'].length === 0">
      <h3>没有数据</h3>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStore } from '@/store';
import { typeList } from '@/common';
import { loadNode_isCommon, dblclickOpenIde } from '@/util';
import RelationMap from './RelationMap.vue';

const store = useStore();

const pathClick = ({ label }: any) => {
  dblclickOpenIde(label);
};

const defaultProps = {
  children: 'children',
  label: 'label',
  isLeaf: 'leaf',
};

const { core, email } = store.state;
</script>

<style scoped></style>
