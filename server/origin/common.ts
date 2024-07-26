export const Tab: TabType[] = [
  {
    path: '/',
    component: null,
    name: '影响页面',
    index: 0,
  },
  {
    path: '/info',
    component: null,
    name: '依赖细节',
    index: 1,
  },
  {
    path: '/util',
    component: null,
    name: '搜索工具',
    index: 2,
  },
  {
    path: '/all',
    component: null,
    name: '综合信息',
    index: 3,
  },
];

export const typeList: DictList = {
  M: '修改',
  D: '删除',
  A: '新增',
  $test: '自定义测试',
  $waste: '垃圾清理',
};
