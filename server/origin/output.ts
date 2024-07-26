/**
 * 生成文件
 */
import { PathMerge, DateFormat } from './util';
import { Defragmentierung } from './worker';

/**
 * 函数有两种模式
 * 1.不带参数时，是走命令行的主程序，没有返回值，把数据挂在到类上
 * 2.带参数时，作为工具函数使用，只有返回值，不把数据挂在到类上
 */

import Search from '.';

async function output(this: Search, option: outputOption) {
  const { changePagesJson, changePagesJsonFull, interfaceClose } = option;

  const initNewAll: { [x: string]: string[] } = {};

  for (const key in changePagesJsonFull) {
    initNewAll[key] = changePagesJsonFull[key].children;
  }

  const date = new Date();

  const Json: OutputJsonType = {
    projectName: this.packageJson.name,
    branch: this.branch,
    iwork: this.iwork,
    iworkId: this.iworkId,
    commit: this.commit,
    timestamp: date.valueOf(),
    time: DateFormat({ date }),
    root: this.root,
    fileType: this.fileType,
    port: this.port,
    change: [],
    tree: [], // 完整依赖图谱
    dataError: this.deletePrefix([...this.dataError]), // 异常数据处理
    babelParserError: this.babelParserError.map((t) => ({
      ...t,
      path: this.deletePrefix(t.path),
    })),
  };

  for (const path in changePagesJson) {
    const { changeType, children } = changePagesJson[path];

    const error =
      path.indexOf(this.include) === 0
        ? null
        : '超出 include 覆盖范围，不考虑影响';

    Json.change.push({
      path: this.deletePrefix(path),
      type: changeType,
      children,
      error,
    });

    if (error) continue;

    // 使用worker多线程运算
    const { promise, worker } = Defragmentierung({
      origin: path,
      target: path,
      newAll: initNewAll,
      replace: this.root + '/',
    });

    // 如果接口被主断开连接，停止计算
    if (interfaceClose) {
      interfaceClose
        .then(() => {
          // this.log.red('\n计算被中断！\n');
          worker.terminate();
        })
        .catch(() => {});
    }

    const entry = await promise;

    const merge = PathMerge({ entry });

    Json.tree.push({
      path: this.deletePrefix(path),
      type: changeType,
      entry,
      merge,
    });
  }

  return Json;
}

export { output };
