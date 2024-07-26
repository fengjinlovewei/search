/**
 * 使用广度优先算法，抽离出基本依赖结构
 */
import Search from '.';

async function dependenceAnalysis(this: Search, changeFiles: ChangeFilesType) {
  // changeFiles = [
  //   {
  //     changeType: 'M',
  //     changePath: '/Users/a58/Desktop/work/neighbourhood/packages/paper/pages/detail/services/index.js'
  //   },
  //   {
  //     changeType: 'A',
  //     changePath: '/Users/a58/Desktop/work/neighbourhood/scripts/search/dependenceAnalysis.js'
  //   }
  // ]

  const Map = this.Map;

  const MAP_KEYS: Array<string> = Object.keys(Map);
  // 最终依赖结果容器
  const changePagesJson: ChangePagesJsonType = {};
  // 依赖的全部细节容器
  const changePagesJsonFull: ChangePagesJsonFullType = {};
  // 遍历变动的文件
  for (const changePathData of changeFiles) {
    const { changePath, changeType } = changePathData;

    // 如果当前路径不在 Map 内，抛弃
    if (!Map[changePath]) {
      continue;
    }
    //
    const current: Array<SearchJsonType | boolean> = [];
    // 修改的文件自身也要被查看影响了哪个页面
    current.push(this.getPage(changePath));

    const finedName: string = `$${changePath}`;
    // 广度优先算法
    // 遍历整个文件目录
    for (const key of MAP_KEYS) {
      // 当前的path对象
      const indexPathData = Map[key];
      // 跳过已经过滤的
      if (indexPathData[finedName] !== undefined) continue;
      // 创建一个队列
      let searchQueue: Array<string> = [...indexPathData.children];
      // 检查过的做一个标记，避免出现无限循环。
      const searched = [key];

      let finded: boolean = false;

      // 只要队列不为空
      while (searchQueue.length) {
        // 推出数组第一个人
        const pathShift = searchQueue.shift();
        // 修复2021年 january 8 的bug
        // 需要先把数组第一层的key对比完，把这个丢了
        if (pathShift === changePath) {
          changePagesJsonFull[key] = { children: Map[key].children };
          finded = true;
          break;
        }

        const personData = Map[pathShift];

        // 如果没找到对象， 超出检查的范围
        if (!personData) {
          this.dataError.add(pathShift);
          continue;
        }
        const bool = personData[finedName];
        // 如果bool为布尔类型，说明检查的子元素已经确定过了，
        if (typeof bool === 'boolean') {
          // 如果包含，直接挂载true，否则跳过当前子元素检测
          if (bool) {
            changePagesJsonFull[key] = {
              children: Map[key].children,
            };
            // 如果是，直接返回
            finded = true;
          }
          continue;
        }
        // 检查过的跳过,
        // 检查过的分两种，1.对象本身处理过了 2.处于当前的栈中
        if (!searched.includes(pathShift)) {
          // 判断当前文件和变动文件是不是同一个文件，是 = 命中
          if (pathShift === changePath) {
            changePagesJsonFull[key] = {
              children: Map[key].children,
            };
            // 如果是，直接返回
            finded = true;
            break;
          } else {
            // 如果当前不是，就把他的全部儿子，推入队列尾部
            searchQueue = [...searchQueue, ...personData.children];
            // 检查过的，放入容器
            searched.push(pathShift);
          }
        }
      }

      if ((indexPathData[finedName] = finded)) {
        // 过滤出有依赖的页面
        current.push(this.getPage(key));
      }
    }

    changePagesJson[changePath] = {
      changeType,
      children: current.filter(Boolean) as childrenType,
    };
  }

  // changePagesJson = {
  //   '/Users/a58/Desktop/work/neighbourhood/packages/paper/pages/detail/services/index.js': {
  //     changeType: 'M',
  //     children: [], // 影响到的入口文件
  //   },
  //   '/Users/a58/Desktop/work/neighbourhood/scripts/search/dependenceAnalysis.js': {
  //     changeType: 'A',
  //     children: [],  // 影响到的入口文件
  //   },
  // };
  // changePagesJsonFull = {
  //   '/Users/a58/Desktop/work/neighbourhood/packages/paper/pages/detail/containers/App/index.jsx':
  //     {
  //       children: [
  //         '/Users/a58/Desktop/work/neighbourhood/packages/paper/shared/components/FullScreenView/index.jsx',
  //         '/Users/a58/Desktop/work/neighbourhood/packages/paper/shared/components/NavBar/index.jsx',
  //         '/Users/a58/Desktop/work/neighbourhood/packages/paper/shared/components/PublishBtn/index.jsx',
  //       ],
  //     },

  //   '/Users/a58/Desktop/work/neighbourhood/packages/paper/pages/detail/containers/Content/index.jsx':
  //     {
  //       children: [
  //         '/Users/a58/Desktop/work/neighbourhood/packages/shared/components/Button/index.jsx',
  //         '/Users/a58/Desktop/work/neighbourhood/packages/paper/shared/components/Message/index.jsx',
  //         '/Users/a58/Desktop/work/neighbourhood/packages/core/shared/utils/wrapLogin.js',
  //         '/Users/a58/Desktop/work/neighbourhood/packages/core/shared/utils/getInApp.js',
  //       ],
  //     },

  //   '/Users/a58/Desktop/work/neighbourhood/packages/paper/pages/detail/index.jsx':
  //     {
  //       children: [
  //         '/Users/a58/Desktop/work/neighbourhood/packages/core/shared/utils/addons/force-in-common.js',
  //         '/Users/a58/Desktop/work/neighbourhood/packages/paper/pages/detail/reducers/store.js',
  //         '/Users/a58/Desktop/work/neighbourhood/packages/paper/pages/detail/containers/App/index.jsx',
  //         '/Users/a58/Desktop/work/neighbourhood/packages/paper/pages/detail/browseDuration.js',
  //       ],
  //     },
  // };
  //debugger;

  return {
    changePagesJson,
    changePagesJsonFull,
  };
}

export { dependenceAnalysis };
