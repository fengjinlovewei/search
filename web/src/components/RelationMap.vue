<template>
  <div class="CanvasWarp">
    <div class="CanvasBox" ref="CanvasBox" :style="{ width, height }">
      <div class="Canvas" ref="Canvas"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStore } from '@/store';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';

import * as echarts from 'echarts';

import _ from 'lodash';

import { openIde } from '@/util';

const store = useStore();

const route = useRoute();

const { core } = store.state;

let myChart: echarts.ECharts | null = null;

const Canvas = ref<null | HTMLElement>(null);

const CanvasBox = ref<null | HTMLElement>(null);

let option: echarts.EChartsCoreOption | null = null;

const props = withDefaults(
  defineProps<{
    data: PathMergeReturnType[];
    indexPath: string[];
    width?: string;
    height?: string;
    zoom?: number;
  }>(),
  { zoom: 0.3 }
);

console.log(props.data);

watch(
  () => props.indexPath,
  () => {
    console.log(props);
    setMap();
  }
);

watch(route, (val: any) => {
  console.log('route', val);
  setTimeout(() => {
    resizeMyChartContainer();
  });
});

const setMap = () => {
  if (!myChart) return;

  const links: any[] = [];

  const allItem: any[] = [];

  const linksHas: string[] = [];

  let showtext: boolean = false;

  const pagesFileEntry =
    core?.coreData?.pagesFileEntry?.map((item) => item.path) || [];

  const setTotal = (label: string, type: 'source' | 'target') => {
    let allone = allItem.filter((item) => item.label === label)[0];
    // 所有不重复的文件

    if (!allone) {
      allone = { label, source: 0, target: 0 };
      allItem.push(allone);
    }
    ++allone[type];
  };

  const setData = (data: PathMergeItemType) => {
    const { children, label } = data;

    if (!children.length) return;

    for (const child of children) {
      const json = {
        source: child.label,
        target: label,
        // lineStyle: {
        //   opacity: 0.5,
        // },
        // label: {
        //   show: true,
        //   position: 'right',
        //   formatter: function (data: any, ...arg: any[]) {
        //     //console.log('arg', data, arg);

        //     return data.name.replace('packages/', '9999');
        //   },
        // },
      };

      const strJson = JSON.stringify(json);

      // 组装双依赖关系
      if (!linksHas.includes(strJson)) {
        links.push(json);
        linksHas.push(strJson);
        setTotal(json.source, 'source');
        setTotal(json.target, 'target');
      }

      setData(child);
    }
  };

  props.data.forEach((item) => item.forEach(setData));

  const categories: any[] = [];

  const nodes = allItem.map((item) => {
    const { label, source, target } = item;
    const [path1, path2] = label.split('/');

    const pathTile = `${path1}/${path2}`;

    const filterList = categories.filter((item) => item.name === pathTile);

    if (!filterList.length) {
      categories.push({
        name: pathTile,
      });
    }

    const index = categories.findIndex((item) => item.name === pathTile);

    let otherValue = {};

    if (props.indexPath.includes(label)) {
      otherValue = {
        symbol:
          'path://M992 528c0 273.9-222.1 496-496 496S0 801.9 0 528 222.1 32 496 32c86.2 0 167.3 22 238 60.7 2.3 1.3 2.8 4.4 0.9 6.3l-37 37.3-4.2 4.3c-1.2 1.2-3.1 1.5-4.6 0.8-8.2-4.1-16.5-7.9-24.9-11.5C610.9 107.4 554.3 96 496 96s-114.9 11.4-168.1 33.9c-51.4 21.8-97.7 52.9-137.3 92.6-39.7 39.7-70.9 85.9-92.6 137.3C75.4 413.1 64 469.6 64 528c0 58.3 11.4 114.9 33.9 168.1 21.8 51.4 52.9 97.6 92.6 137.3 39.7 39.7 85.9 70.9 137.3 92.6 53.3 22.6 109.9 34 168.2 34s114.9-11.4 168.1-33.9c51.4-21.8 97.7-52.9 137.3-92.6 39.7-39.7 70.9-85.9 92.6-137.3 22.6-53.3 34-109.9 34-168.2 0-58.4-11.4-114.9-33.9-168.1-3.6-8.5-7.4-16.8-11.5-25-0.8-1.5-0.5-3.4 0.8-4.6l4.3-4.2 37.3-37c1.9-1.9 5-1.4 6.3 0.9C970 360.6 992 441.7 992 528z M781.4 397c-3.7-8-11.7-13.1-20.6-13.1H740c-6 0-11.8 2.4-16 6.6-7 7-8.6 17.6-4.1 26.4 2.6 5.1 5 10.3 7.3 15.7 13.2 31.2 19.9 64.3 19.9 98.5s-6.7 67.3-19.9 98.5c-12.7 30.1-31 57.2-54.2 80.4-23.3 23.3-50.3 41.5-80.4 54.2-31.3 13.1-64.4 19.8-98.6 19.8s-67.3-6.7-98.5-19.9c-30.1-12.7-57.2-31-80.4-54.2-23.3-23.3-41.5-50.3-54.2-80.4-13.2-31.2-19.9-64.3-19.9-98.5s6.7-67.3 19.9-98.5c12.7-30.1 31-57.2 54.2-80.4 23.3-23.3 50.3-41.5 80.4-54.2 31.2-13.2 64.3-19.9 98.5-19.9s67.3 6.7 98.5 19.9c4.9 2.1 9.8 4.3 14.6 6.7 8.8 4.4 19.4 2.6 26.3-4.4 4.3-4.3 6.7-10.1 6.7-16.2v-20.2c0-9-5.2-17.1-13.4-20.8-40.4-18.6-85.3-29-132.6-29-175.5 0-318 143.4-317 318.9C178 707.1 319.6 848 494 848c174.8 0 316.6-141.3 317-316.2 0.1-48.2-10.5-93.9-29.6-134.8z M634.5 488.5c-0.8-2.9-4.5-3.9-6.7-1.7l-34.7 34.7-1.8 1.8c-9 9-15.7 20.1-20.1 32.1-11.5 31.6-42.4 54-78.3 52.7-41.6-1.6-75.3-35.3-76.9-76.9-1.4-35.9 21-66.8 52.7-78.3 12-4.4 23-11.1 32.1-20.1l1.8-1.8 34.7-34.7c2.2-2.2 1.2-5.8-1.7-6.7-12.9-3.7-26.5-5.6-40.6-5.5-79.4 0.5-143 64.5-143 143.9 0 79.5 64.5 144 144 144 79.4 0 143.4-63.6 144-142.9 0.1-14.1-1.8-27.8-5.5-40.6z M1017.1 152.8L911.6 257.2l-46.5 46.1-44.3 43.9c-3 3-7 4.6-11.3 4.6H724c-4.2 0-8.3 1.7-11.3 4.7l-19 19-123.2 123.3-51.8 51.9c-6.3 6.3-14.4 9.4-22.6 9.4s-16.4-3.1-22.6-9.4c-12.5-12.5-12.5-32.8 0-45.3l51.8-51.9 47.4-47.4 94.7-94.7c3-3 4.7-7.1 4.7-11.3v-85.5c0-4.2 1.7-8.3 4.6-11.3l44-44.4 46.1-46.5L871.2 6.9c0.8-0.8 1.8-1.2 2.8-1.2 2.1 0 4 1.6 4 4v132.2c0 2.2 1.8 4 4 4h132.2c3.6 0.1 5.4 4.4 2.9 6.9z',
        symbolSize: 40,
        label: {
          show: true,
        },
        itemStyle: {
          shadowColor: 'rgba(0, 0, 0, 0.2)',
          shadowBlur: 10,
        },
      };
    }

    if (pagesFileEntry.includes(label)) {
      otherValue = {
        symbol:
          'path://M170.666667 746.666667h85.333333V426.666667H192c-23.466667 0-42.666667-19.2-42.666667-42.666667V64c0-23.466667 19.2-42.666667 42.666667-42.666667h213.333333c23.466667 0 42.666667 19.2 42.666667 42.666667v106.666667h128V64c0-23.466667 19.2-42.666667 42.666667-42.666667h213.333333c23.466667 0 42.666667 19.2 42.666667 42.666667v320c0 23.466667-19.2 42.666667-42.666667 42.666667h-64v320h85.333333c23.466667 0 42.666667 19.2 42.666667 42.666666v170.666667c0 23.466667-19.2 42.666667-42.666667 42.666667H170.666667c-23.466667 0-42.666667-19.2-42.666667-42.666667v-170.666667c0-23.466667 19.2-42.666667 42.666667-42.666666z m128 85.333333h-85.333334v85.333333h597.333334v-85.333333H298.666667z m42.666666-85.333333h341.333334V426.666667H341.333333v320z m-106.666666-405.333334h554.666666V106.666667h-128v106.666666c0 23.466667-19.2 42.666667-42.666666 42.666667H405.333333c-23.466667 0-42.666667-19.2-42.666666-42.666667V106.666667h-128v234.666666z',
        symbolSize: 40,
        label: {
          show: true,
        },
        itemStyle: {
          shadowColor: 'rgba(0, 0, 0, 0.2)',
          shadowBlur: 10,
        },
      };
    }

    return {
      name: label,
      category: index,
      value: `<br />引用数：${target} 被引用数：${source}`,
      id: label,
      symbolSize: 15 + source + target,
      label: {
        show: false,
      },
      itemStyle: {
        borderColor: '#fff',
      },
      ...otherValue,
    };
  });

  option = {
    toolbox: {
      feature: {
        myShowText: {
          show: true,
          title: '显示路径',
          icon: 'path://M939.264 499.0464l14.1312 26.0096-6.8608 12.544-7.2704 13.4656c-76.0832 138.4448-241.3056 248.1664-403.456 248.1664-162.3552 0-327.5776-109.824-402.944-247.808l-15.104-26.4704 7.5264-13.056 7.3728-12.8C208.0256 360.6016 373.2992 250.88 535.7568 250.88c162.304 0 327.424 109.568 403.456 248.2176z m-290.4064-44.1344c0-2.9696-1.2288-5.632-1.8432-8.704a137.216 137.216 0 0 1-111.6672 216.3712 137.216 137.216 0 0 1-136.8576-137.5232 137.2672 137.2672 0 0 1 136.8576-137.9328c29.0304 0 56.1664 9.5232 78.336 25.1392-3.0208-0.4096-5.7856-1.536-8.8064-1.536a44.4416 44.4416 0 0 0 0 88.7296 44.032 44.032 0 0 0 43.9808-44.544z m-113.1008-150.7328c-141.2608 0-288.9216 98.048-355.6352 220.672 66.8672 122.9312 214.528 221.0816 355.6352 221.0816 141.056 0 288.768-98.0992 355.7888-220.16v-1.4336c-67.072-122.2656-214.6304-220.16-355.7888-220.16z m-447.3344-14.336a32.5632 32.5632 0 1 1-65.1264 0V88.4736c0-35.9936 29.184-65.1264 65.1264-65.1264h209.2544a32.5632 32.5632 0 0 1 0 65.1264H88.4224v201.472z m670.4128-201.4208a32.5632 32.5632 0 1 1 0-65.1264h195.328c35.9936 0 65.1776 29.184 65.1776 65.1264V290.304a32.5632 32.5632 0 1 1-65.1776 0V88.4224h-195.328z m195.328 676.352a32.5632 32.5632 0 0 1 65.1776 0v189.44c0 35.9424-29.184 65.1264-65.1776 65.1264h-201.216a32.5632 32.5632 0 0 1 0-65.1776h201.216v-189.44z m-664.5248 189.44a32.5632 32.5632 0 0 1 0 65.1264h-201.216c-35.9936 0-65.1264-29.184-65.1264-65.1776V754.176a32.5632 32.5632 0 0 1 65.1264 0v199.9872h201.216z',
          onclick: () => {
            const newOption = myChart?.getOption();

            if (!newOption) return;

            // @ts-ignore
            const series = newOption.series[0];

            const list = [...pagesFileEntry, ...props.indexPath];

            showtext = !showtext;

            myChart?.setOption({
              series: [
                {
                  data: series.data.map((item: any) => {
                    if (list.includes(item.name)) return item;
                    return {
                      ...item,
                      label: {
                        show: showtext,
                      },
                    };
                  }),
                },
              ],
            });
          },
        },
        myFull: {
          show: true,
          title: '全屏查看',
          icon: 'path://M641.750109 384.100028l205.227128-204.519-0.704035 115.89966c-0.282433 9.611915 7.489578 18.09103 17.101493 17.808598l12.297071 0c9.611915-0.283456 17.667382-5.936199 17.808598-15.689331l0.565888-172.57752c0-0.14224 0.282433-9.187243 0.282433-9.187243 0.14224-4.804423-0.99056-9.187243-4.100388-12.297071-3.109828-3.109828-7.347339-5.086855-12.297071-4.946662l-8.763594 0.14224c-0.141216 0-0.278339 0-0.420579 0.14224L697.581696 98.166787c-9.611915 0.283456-17.667382 8.200776-17.808598 17.950837l0 12.297071c1.416256 11.44875 10.458189 18.092054 20.070104 17.808598l112.789832 0.283456-204.66124 203.814965c-9.329483 9.329483-9.329483 24.449855 0 33.778314 9.329483 9.470699 24.452925 9.470699 33.782408 0L641.750109 384.100028zM383.095141 576.889893 177.726797 780.705881l0.707105-115.338888c0.283456-9.607822-7.492648-18.086937-17.104563-17.808598l-13.001105 0c-9.611915 0.283456-17.667382 5.937223-17.808598 15.690354l-0.565888 172.718737c0 0.14224-0.282433 9.187243-0.282433 9.187243-0.14224 4.808516 0.99056 9.187243 4.096295 12.297071 3.109828 3.109828 7.351432 5.086855 12.297071 4.946662l8.762571-0.14224c0.14224 0 0.283456 0 0.425695-0.14224l171.873486 0.708128c9.607822-0.283456 17.667382-8.196683 17.808598-17.950837L344.93503 832.575226c-1.415232-11.44875-10.461259-18.092054-20.074198-17.808598L212.069977 814.483172 416.59 610.671277c9.329483-9.329483 9.329483-24.453948 0-33.782408C407.40685 567.41817 392.424624 567.41817 383.095141 576.889893L383.095141 576.889893zM894.047276 835.967486l-0.424672-172.718737c-0.283456-9.612938-8.200776-15.406898-17.809621-15.690354l-12.296047 0c-9.612938-0.278339-17.243733 8.200776-17.105586 17.808598l0.708128 115.903753L641.750109 576.889893c-9.329483-9.329483-24.452925-9.329483-33.782408 0-9.325389 9.328459-9.325389 24.452925 0 33.782408L812.490795 814.483172l-112.789832 0.283456c-9.611915-0.283456-18.515702 6.502088-20.073174 17.808598l0 12.297071c0.282433 9.611915 8.200776 17.667382 17.808598 17.950837l171.166381-0.708128c0.141216 0 0.282433 0.14224 0.424672 0.14224l8.763594 0.14224c4.803399 0.141216 9.187243-1.694595 12.296047-4.946662 3.109828-3.109828 4.238534-7.488555 4.097318-12.297071 0 0-0.14224-9.046027-0.14224-9.187243L894.047276 835.968509zM212.216309 146.506748l112.789832-0.283456c9.607822 0.283456 18.512632-6.502088 20.070104-17.808598L345.076246 116.116601c-0.283456-9.611915-8.196683-17.667382-17.808598-17.950837l-172.011632 0.708128c-0.14224 0-0.283456-0.14224-0.425695-0.14224l-8.761548-0.14224c-4.808516-0.141216-9.187243 1.694595-12.297071 4.946662-3.109828 3.109828-4.242627 7.488555-4.096295 12.297071 0 0 0.282433 9.046027 0.282433 9.187243l0.420579 172.718737c0.14224 9.608845 8.200776 15.406898 17.808598 15.686261l13.005198 0c9.611915 0.282433 17.242709-8.196683 17.10047-17.808598l-0.564865-115.334795 205.231221 203.958228c9.324366 9.329483 24.448832 9.329483 33.777291 0 9.329483-9.329483 9.329483-24.452925 0-33.782408L212.216309 146.506748 212.216309 146.506748zM212.216309 146.506748',
          onclick: () => {
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
          },
        },
      },
    },

    legend: [
      {
        // selectedMode: 'single',
        data: categories.map(function (a) {
          return a.name;
        }),
      },
    ],
    tooltip: {
      //triggerOn: 'click',
      formatter: function (data: any, ...arg: any[]) {
        //console.log('arg', data, arg);

        if (data.dataType == 'edge') {
          return `${data.data.target} 引用 ${data.data.source}`;
        }

        return data.name + data.data.value;
      },
    },

    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        selectedMode: 'multiple',
        zoom: props.zoom,
        // draggable: true,
        select: {
          //disabled: true,
          label: {
            show: true,
            position: 'right',
            formatter: function (data: any, ...arg: any[]) {
              //console.log('arg', data, arg);

              return data.name;
            },
          },
          lineStyle: {
            color: '#000',
            type: 'dotted',
            curveness: 0.5,
            width: 2,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
            shadowBlur: 20,
          },
          itemStyle: {
            shadowColor: 'rgba(0, 0, 0, 0.2)',
            shadowBlur: 20,
          },
        },
        force: {
          edgeLength: 30,
          repulsion: 1000,
          layoutAnimation: true,
        },
        label: {
          show: true,
          position: 'right',
          formatter: function (data: any, ...arg: any[]) {
            //console.log('arg', data, arg);

            return data.name;
          },
        },

        lineStyle: {
          color: 'source',
          width: 1,
        },
        emphasis: {
          disabled: true,
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 7,
        edgeLabel: {
          fontSize: 12,
        },
        categories,
        data: nodes,
        links,
      },
    ],
  };

  // 绘制图表
  myChart?.setOption(option);
};

const resizeMyChartContainer = _.throttle(() => {
  if (!Canvas.value || !CanvasBox.value) return;

  myChart?.resize();
}, 200);

onMounted(() => {
  //console.log(ggg);
  // 基于准备好的dom，初始化echarts实例

  if (!Canvas.value || !CanvasBox.value) return;

  myChart = echarts.init(Canvas.value);

  const selectHandle = function (params: any, name: any, dataIndex: any) {
    const mousemoveFn = function () {
      myChart?.dispatchAction({
        type: 'unselect',
        dataType: 'node',
        seriesIndex: 0,
        //dataIndex: 0,
        name,
      });
      myChart?.dispatchAction({
        type: 'unselect',
        dataType: 'edge',
        seriesIndex: 0,
        dataIndex,
      });
      myChart?.off('mouseout', mousemoveFn);
    };

    const clickFn = function (params2: any, ...arg: any[]) {
      myChart?.off('mouseout', mousemoveFn);
      myChart?.off('click', clickFn);

      if (params2.dataType === 'node') {
        if (name.includes(params2.name)) {
          myChart?.dispatchAction({
            type: 'select',
            dataType: 'node',
            seriesIndex: 0,
            name,
          });
        }
      }

      if (params2.dataType === 'edge') {
        if (dataIndex.includes(params2.dataIndex)) {
          myChart?.dispatchAction({
            type: 'select',
            dataType: 'edge',
            seriesIndex: 0,
            dataIndex: params2.dataIndex,
          });
        }
      }
    };

    myChart?.on('mouseout', params, mousemoveFn);

    if (params.dataType === 'edge') {
      myChart?.on('click', params, clickFn);
    }

    myChart?.dispatchAction({
      type: 'select',
      dataType: 'node',
      seriesIndex: 0,
      name,
    });

    myChart?.dispatchAction({
      type: 'select',
      dataType: 'edge',
      seriesIndex: 0,
      dataIndex,
    });
  };

  myChart.on('mouseover', function (params) {
    const newOption = myChart?.getOption();

    if (!newOption) return;

    // @ts-ignore
    const series = newOption.series[0];

    const list: any[] = [];
    const listIndex: any[] = [];

    const selectedMap = series.selectedMap || {};

    if (params.dataType === 'node') {
      if (!selectedMap[params.name]) {
        list.push(params.name);
      }

      series.links.forEach((item: any, index: any) => {
        const { source, target } = item;

        const hitName =
          source === params.name
            ? target
            : target === params.name
            ? source
            : '';

        if (hitName) {
          if (!selectedMap[hitName]) {
            list.push(hitName);
          }
          if (!selectedMap[`${source} > ${target}`]) {
            listIndex.push(index);
          }
        }
      });

      selectHandle(params, list, listIndex);
    }

    if (params.dataType === 'edge') {
      const { source, target } = params.data as any;
      [source, target].forEach((item) => {
        if (!selectedMap[item]) {
          list.push(item);
        }
      });
      if (!selectedMap[`${source} > ${target}`]) {
        listIndex.push(params.dataIndex);
      }
      selectHandle(params, list, listIndex);
    }
  });

  myChart.on('dblclick', function (params) {
    if (params.dataType === 'node' && params.name) {
      openIde(params.name);
    }
  });

  window.addEventListener('resize', resizeMyChartContainer);

  resizeMyChartContainer();

  setMap();
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeMyChartContainer);
});

const getImage = (pixelRatio = 1) => {
  console.log('pixelRatio', pixelRatio);
  let picInfo = myChart?.getDataURL({
    type: 'png', // jpeg’，png',type图表的类型
    pixelRatio, //放大n倍下载，之后压缩到同等大小展示，解决生成图片模糊问题
    backgroundColor: 'white', //导出的图片背景颜色
    excludeComponents: ['toolbox'],
  });

  return picInfo;
};

defineExpose({
  getImage,
});
</script>

<style scoped>
.Canvas {
  width: 100%;
  height: 100%;
}
.CanvasBox {
  height: calc(100vh - 200px);
  background-color: #fff;
}
.CanvasWarp {
  padding: 20px 0;
}
</style>
