import { axiosOpen } from '@/api';
import { store } from '@/store';
import { ElMessage } from 'element-plus';

console.log(store.state.core.coreData);

export async function openIde(path: string) {
  ElMessage.warning('正在从编辑器打开对应文件，请等待');
  await axiosOpen({ path });
}

interface setStyleCommonType {
  id: string;
  className?: string;
}

interface setStyleGarbageType extends setStyleCommonType {}

interface setStyleCommnType extends setStyleCommonType {
  tree: treeType;
}

function makeNode(node: any, resolve: any) {
  //console.log('1', node);
  const nodedata = node.level === 0 ? node.data : node.data.children;

  nodedata.forEach((item: any) => {
    if (item.children.length === 0) {
      item.leaf = true;
    }
  });
  resolve(nodedata);
}

export function loadNode_isGarbage({ id, className }: setStyleGarbageType) {
  return (node: any, resolve: any) => {
    makeNode(node, resolve);
    setTimeout(() => {
      setStyleGarbage({ id, className });
    });
  };
}

export function loadNode_isCommon({ id, className, tree }: setStyleCommnType) {
  return (node: any, resolve: any) => {
    makeNode(node, resolve);
    setTimeout(() => {
      setStyleCommon({ id, className, tree });
    });
  };
}

// export function loadNode({ id, isGarbage, className, data }: loadNodeType) {
//   return (node: any, resolve: any) => {
//     //console.log('1', node);
//     const nodedata = node.level === 0 ? node.data : node.data.children;

//     nodedata.forEach((item: any) => {
//       if (item.children.length === 0) {
//         item.leaf = true;
//       }
//     });
//     resolve(nodedata);

//     setTimeout(() => {
//       if (isGarbage) {
//         setStyleGarbage({ id, className });
//       } else {
//         setStyle({ id, className, data });
//       }
//     });
//   };
// }

function setStyleGarbage({ id, className = 'file-tip1' }: setStyleGarbageType) {
  //if (!this.garbageData) return;
  const nodes = Array.from(
    document.querySelectorAll(`#${id} span.el-tree-node__label`)
  );

  console.log(store.state.core.coreData);

  const fileType = store.state.core.coreData.fileType;

  const reg = new RegExp(fileType);

  for (const node of nodes) {
    if (reg.test(node.innerHTML)) {
      node.classList.add(className);
    }
  }
}

function setStyleCommon({
  id,
  className = 'file-tip1',
  tree,
}: setStyleCommnType) {
  //   const data = {
  //     1: this.data,
  //     2: this.importData,
  //   }[this.currentindex];

  const nodes = Array.from(
    document.querySelectorAll(`#${id} span.el-tree-node__label`)
  );

  if (Array.isArray(tree)) {
    const arr = tree.map((item) => item.path.trim());

    for (const node of nodes) {
      if (arr.includes(node.innerHTML.trim())) {
        node.classList.add(className);
      }
    }
  }
}

export function dblclickCurring<T>(fn: commonFn) {
  let number = 0;
  let timer: undefined | number = undefined;
  const infoFn: unknown = (...arg: any[]) => {
    number++;
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (number > 1) {
        fn(...arg);
      }
      number = 0;
    }, 200);
  };

  return infoFn as T;
}

export const dblclickOpenIde = dblclickCurring<typeof openIde>(openIde);
