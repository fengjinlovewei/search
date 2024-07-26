import { workerData, parentPort } from 'worker_threads';

const { replace, ...other } = workerData;

const data = [];

const deletePrefix = (p) => p.map((item) => item.replace(replace, ''));

// 所有文件的导入文件集合，如果不在这个集合中，则说明是最外层电子
// 递归抽离文件之间的详细引用
const Defragmentierung = ({
  origin,
  target,
  newAll = {},
  entry = data,
  newEntry = [],
}) => {
  // 平铺当前收集的所有数据的子元素
  // 如果目标不在集合中，说明结束或者超出范围，终止！
  // 还可以防止循环引用不输出数据的bug
  const childFull = Object.values(newAll).flat();

  // 检验是最外层，终止递归
  if (!childFull.includes(target)) {
    // 目的，最外层文件放在第一位置
    newEntry.reverse();
    // 吧变动的文件origin加上
    newEntry.push(origin);
    // 去掉路径的前缀（/Users/a58/Desktop/work/neighbourhood/packages）
    entry.push(deletePrefix(newEntry));
    return;
  }

  for (const path in newAll) {
    const children = newAll[path];
    if (children.includes(target)) {
      Defragmentierung({
        origin,
        target: path,
        // 如果当前path下包含目标target，那么在下次递归时，剔除这个数组
        newAll: { ...newAll, [path]: [] },
        entry,
        newEntry: [...newEntry, path],
      });
    }
  }
};

Defragmentierung(other);

parentPort.postMessage({ data });
//parentPort.close();
