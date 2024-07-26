<template>
  <div>
    <div class="toolBox">
      <img class="fullScreenIcon" :src="icon" @click="setFull" />
    </div>
    <div class="CanvasTreeBox" ref="CanvasBox">
      <div
        class="Canvas"
        ref="Canvas"
        :style="{ width: height + 'px', height: width + 'px' }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import _ from 'lodash';
import { loadNode_isGarbage, dblclickOpenIde, openIde } from '@/util';

const props = defineProps<{
  data: PathMergeReturnType;
}>();

let myChart: echarts.ECharts | null = null;
const Canvas = ref<null | HTMLElement>(null);
const CanvasBox = ref<null | HTMLElement>(null);
let option: echarts.EChartsCoreOption | null = null;

const height = ref<number>(0);
const width = ref<number>(0);

const icon = ref(
  'data:image/png;base64,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'
);

const setFull = () => {
  let element = CanvasBox.value as HTMLElement;
  try {
    if (element.requestFullscreen) {
      // HTML W3C 提议
      element.requestFullscreen();
    }

    // 退出全屏
    // @ts-ignore
    if (element.requestFullscreen) {
      document.exitFullscreen();
    }
  } catch (e) {}
};

const resizeMyChartContainer = _.throttle(() => {
  console.log(8888, typeof myChart?.resize);
  myChart?.resize();
}, 200);

const setMap = () => {
  console.log('garbageData.value?.tree', props.data);

  if (!Canvas.value || !CanvasBox.value) return;

  if (!myChart) {
    myChart = echarts.init(Canvas.value);
  }

  const maps = (item: PathMergeItemType) => {
    const { children } = item;
    const obj: any = { ...item, itemStyle: {} };
    if (children.length) {
      obj.itemStyle.color = '#5470c6';
      obj.children = children.map(maps);
    } else {
      obj.itemStyle.color = '#ee6666';
    }

    return obj;
  };

  const list = props.data.map(maps);

  option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
    },

    series: [
      {
        type: 'tree',
        data: list,
        symbolSize: 17,
        roam: true,
        initialTreeDepth: -1,

        tooltip: {
          //triggerOn: 'click',
          position: 'bottom',
          formatter: function (data: any, ...arg: any[]) {
            //console.log('arg', data, arg);

            if (data.dataType == 'main') {
              return data.data.path;
            }

            return data.data.value;
          },
        },
        symbol: function (value: any, params: any) {
          const { data = {} } = params || {};
          const { children = [] } = data;

          if (!children.length) {
            return 'path://M682.666667 245.333333a10.666667 10.666667 0 0 0 10.666666 10.666667h189.913334c-0.913333-1.066667-1.86-2.12-2.866667-3.126667L685.793333 58.286667c-1.006667-1.006667-2.06-1.953333-3.126666-2.866667z M640 245.333333V42.666667H181.333333a53.393333 53.393333 0 0 0-53.333333 53.333333v832a53.393333 53.393333 0 0 0 53.333333 53.333333h661.333334a53.393333 53.393333 0 0 0 53.333333-53.333333V298.666667h-202.666667a53.393333 53.393333 0 0 1-53.333333-53.333334z m-320 10.666667h170.666667a21.333333 21.333333 0 0 1 0 42.666667H320a21.333333 21.333333 0 0 1 0-42.666667z m384 512H320a21.333333 21.333333 0 0 1 0-42.666667h384a21.333333 21.333333 0 0 1 0 42.666667z m21.333333-234.666667a21.333333 21.333333 0 0 1-21.333333 21.333334H320a21.333333 21.333333 0 0 1 0-42.666667h384a21.333333 21.333333 0 0 1 21.333333 21.333333z';
          }
          return 'path://M855.04 385.024q19.456 2.048 38.912 10.24t33.792 23.04 21.504 37.376 2.048 54.272q-2.048 8.192-8.192 40.448t-14.336 74.24-18.432 86.528-19.456 76.288q-5.12 18.432-14.848 37.888t-25.088 35.328-36.864 26.112-51.2 10.24l-567.296 0q-21.504 0-44.544-9.216t-42.496-26.112-31.744-40.96-12.288-53.76l0-439.296q0-62.464 33.792-97.792t95.232-35.328l503.808 0q22.528 0 46.592 8.704t43.52 24.064 31.744 35.84 12.288 44.032l0 11.264-53.248 0q-40.96 0-95.744-0.512t-116.736-0.512-115.712-0.512-92.672-0.512l-47.104 0q-26.624 0-41.472 16.896t-23.04 44.544q-8.192 29.696-18.432 62.976t-18.432 61.952q-10.24 33.792-20.48 65.536-2.048 8.192-2.048 13.312 0 17.408 11.776 29.184t29.184 11.776q31.744 0 43.008-39.936l54.272-198.656q133.12 1.024 243.712 1.024l286.72 0z';
        },

        symbolKeepAspect: true,
        label: {
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
          formatter: function (data: any, ...arg: any[]) {
            return data.name;
          },
        },

        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left',
          },
        },

        emphasis: {
          focus: 'descendant',
        },

        expandAndCollapse: true,
        animationDuration: 550,
        animationDurationUpdate: 750,
      },
    ],
  };

  myChart.setOption(option);

  setTimeout(() => {
    resizeMyChartContainer();
  });

  const resize = () => {
    let elesArr = Array.from(
      // @ts-ignore/
      new Set(myChart._chartsViews[0]._data._graphicEls)
    );
    // @ts-ignore/
    let dep = myChart._chartsViews[0]._data.tree.root.height; //获取树高
    let layer_height = 200; //层级之间的高度
    let currentHeight = layer_height * (dep + 1) || layer_height;
    let newHeight = Math.max(currentHeight, layer_height);
    height.value = newHeight;
    let layer_width = 15; // 兄弟节点之间的距离
    let currentWidth = layer_width * (elesArr.length - 1) || layer_width;
    let newWidth = Math.max(currentWidth, layer_width);
    width.value = newWidth;
  };

  resize();
};

onMounted(() => {
  //console.log(ggg);
  // 基于准备好的dom，初始化echarts实例

  window.addEventListener('resize', resizeMyChartContainer);

  setMap();

  myChart?.on('click', function (params) {
    const { data = {} } = params;
    const { children = [], path } = data as any;
    console.log('params', params);
    if (params.dataType === 'main' && !children.length) {
      openIde(path);
    }
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeMyChartContainer);
});
</script>

<style scoped>
.container {
  padding: 0 50px 0;
}
.Canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
.CanvasTreeBox {
  position: relative;
  width: 100%;
  height: calc(100vh - 200px);
  overflow: hidden;
  background-color: #fff;
}

.fullScreenIcon {
  width: 20px;
  height: 20px;
  cursor: pointer;
}
.toolBox {
  padding: 3px 100px;
  display: flex;
  justify-content: end;
}
</style>
