/*
 * @file:
 * @author: fengjin02
 */
import Search from '.';
// 当前函数确定传入的路径引用了哪些文件，枚举出来返回
function getScope(this: Search, p: string, istreeData: Boolean = true) {
  let Map = this.Map;

  const indexPathData = Map[p];

  // 两个变量是为了保证顺序不变，因为对象转化成数组，顺序不能保证
  const children_array: scopeDataType[] = [];
  const children_object = {};
  const treeData = { label: p, name: p, children: [] };

  if (!indexPathData) return { children_array, children_object, treeData };

  const finedName = `$${Date.now() + Math.random()}`;

  interface treeDataType {
    label: string;
    children: treeDataType[];
  }

  const group = (data: treeDataType) => {
    const { label, children } = data;

    const current = Map[label];

    data.label = this.deletePrefix(data.label);
    // 如果没找到对象， 超出检查的范围
    // 如果bool为布尔类型，说明检查的子元素已经确定过了，
    if (!current || current[finedName] === true) return;

    for (const child of current.children) {
      const son = { label: child, children: [] };

      // 检查过的，做标记
      current[finedName] = true;

      group(son);

      children.push(son);
    }
  };

  istreeData && group(treeData);

  // 再次创建一个新的纯洁的女体
  Map = this.Map;

  if (!indexPathData) return;
  // 创建一个队列
  let searchQueue = [...indexPathData.children];

  while (searchQueue.length) {
    // 推出数组第一个人
    const pathShift = searchQueue.shift();

    const personData = Map[pathShift];

    if (children_object[pathShift]) {
      children_object[pathShift].total++;
    } else {
      const data = { path: pathShift, total: 1 };
      children_object[pathShift] = data;
      children_array.push(data);
    }

    // 如果没找到对象， 超出检查的范围
    // 如果bool为布尔类型，说明检查的子元素已经确定过了，
    if (!personData || typeof personData[finedName] === 'boolean') continue;

    // 如果当前不是，就把他的全部儿子，推入队列尾部
    searchQueue = [...searchQueue, ...personData.children];

    // 检查过的，做标记
    personData[finedName] = true;
  }

  return {
    treeData,
    children_array,
    children_object,
  };
}

// 当前返回每个入口文件的引用文件，以及引用次数
async function getEntryScope(this: Search) {
  const scopeData: scopeEntryDataType = [];

  for (const entry of this.pagesFileEntry) {
    const { path: p } = entry;

    const { children_array: children } = this.getScope(p, false);

    // 排序
    children.sort((a, b) => b.total - a.total);

    const total = children.reduce((a, b) => a + b.total, 0);

    scopeData.push({
      path: p,
      children,
      total,
    });
  }
  scopeData.sort((a, b) => b.total - a.total);

  this.scopeData = scopeData;
}

export { getEntryScope, getScope };
