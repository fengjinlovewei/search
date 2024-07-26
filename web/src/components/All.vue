<template>
  <div id="all-box">
    <el-tabs tab-position="left" v-if="garbageData">
      <el-tab-pane label="树形">
        <div class="tab-pane-box">
          <el-tree
            :data="garbageData.tree"
            :props="defaultProps"
            ref="tree_garbage"
            id="tree_garbage"
            :load="loadNode_isGarbage({ id: 'tree_garbage' })"
            lazy
            @node-click="handleNodeClickGarbage"
            :render-after-expand="false"
          >
          </el-tree>
          <TreeMap :data="garbageData.tree" />
        </div>
      </el-tab-pane>
      <el-tab-pane label="平铺">
        <div class="tab-pane-box">
          <el-collapse accordion>
            <el-collapse-item
              :title="`平铺垃圾文件（${garbageData.paths.length}）`"
            >
              <p v-for="item in garbageData.paths" class="p-style">
                <a href="javascript:;" @click="openIde(item)">{{ item }}</a>
              </p>
            </el-collapse-item>

            <el-collapse-item
              :title="`全部文件（${garbageData.map.length}）被引用次数`"
            >
              <p v-for="item in garbageData.map" class="p-style">
                <a href="javascript:;" @click="openIde(item.path)">{{
                  item.path
                }}</a>
                <span class="p-item"
                  >被引用<em @click="openDialogGarbage(item.cited)">{{
                    item.cited.length
                  }}</em
                  >次</span
                >
              </p>
            </el-collapse-item>

            <el-collapse-item
              :title="`全部入口文件（${garbageData.scopeData.length}）引用的文件`"
            >
              <p v-for="item in garbageData.scopeData" class="p-style">
                <el-tag type="danger" @click="openIde(item.path)">{{
                  item.path
                }}</el-tag>
                <span class="p-item"
                  >引用<em @click="openEntryDialogGarbage(item.children)">{{
                    item.children.length
                  }}</em
                  >个文件</span
                >
                <span class="p-item"
                  >共引用<i @click="openEntryDialogGarbage(item.children)"
                    >{{ item.total }} </i
                  >次</span
                >
              </p>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog title="引用者" v-model="alertGarbage.show" width="70%">
      <div class="scroll-box">
        <div>
          <div v-for="item in alertGarbage.data" class="p-style">
            <a href="javascript:;" @click="openIde(item)">{{ item }}</a>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog title="被引用者" v-model="entryGarbage.show" width="70%">
      <div class="scroll-box">
        <div>
          <div v-for="item in entryGarbage.data" class="p-style">
            <a href="javascript:;" @click="openIde(item.path)">{{
              item.path
            }}</a>
            <span
              >被引用<i>{{ item.total }}</i
              >次</span
            >
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElLoading } from 'element-plus';
import { ref, reactive } from 'vue';
import _ from 'lodash';
import { axiosGarbage } from '@/api';
import { loadNode_isGarbage, dblclickOpenIde, openIde } from '@/util';
import TreeMap from './TreeMap.vue';

const garbageData = ref<WasteDataType | null>(null);

const defaultProps = {
  children: 'children',
  label: 'label',
  isLeaf: 'leaf',
};

const alertGarbage = reactive<{
  data: WasteDataMapType['cited'];
  show: boolean;
}>({
  data: [],
  show: false,
});

const entryGarbage = reactive<{
  data: scopeEntryDataItemType['children'];
  show: boolean;
}>({
  data: [],
  show: false,
});

const handleNodeClickGarbage = (node: any) => {
  // 自由最后一个才是真正的文件名称
  if (node.children.length) return;
  //console.log(arg);
  dblclickOpenIde(node.path);
};

const openDialogGarbage = (data: WasteDataMapType['cited']) => {
  alertGarbage.data = data;
  alertGarbage.show = true;
};

const openEntryDialogGarbage = (
  children: scopeEntryDataItemType['children']
) => {
  entryGarbage.data = children;
  entryGarbage.show = true;
};

//
const getGarbageData = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: '分析过程可能长达几分钟，CPU燃烧中...',
    target: document.querySelector('#all-box') as HTMLElement,
    customClass: 'interfaceCloseBox',
  });

  try {
    const { data } = await axiosGarbage();
    garbageData.value = data;
  } catch (e) {}

  loading.close();
};

getGarbageData();
</script>

<style scoped>
.container {
  padding: 0 50px 0;
}
.Canvas {
  width: 100%;
  height: 100%;
}
.CanvasBox {
  width: 100%;
  height: calc(100vh - 140px);
}
</style>
