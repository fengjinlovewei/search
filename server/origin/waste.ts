/**
 *
 *
 *
 */
import path from 'path';
import _ from 'lodash';
import Search from '.';
import { PathMerge } from './util';

async function waste(this: Search) {
  const { Map, list } = this.notUseJsonFull;

  let paths = this.deletePrefix(Object.keys(list));

  const map: WasteDataType['map'] = [];

  for (const key in Map) {
    let { $cited = [] } = Map[key];
    map.push({
      path: this.deletePrefix(key),
      cited: $cited,
    });
  }

  map.sort((a, b) => b.cited.length - a.cited.length);

  if (!paths.length) return Promise.reject('没有检测出无用文件！');

  // 分割路径，并且去掉数组开头的空字符串数据
  const entry = paths.map((item) => item.split(path.sep).filter(Boolean));

  const tree = PathMerge({ entry, isPath: true });

  const scopeData = _.cloneDeep(this.scopeData) as scopeEntryDataType;

  for (const item of scopeData) {
    item.path = this.deletePrefix(item.path);
    for (const child of item.children) {
      child.path = this.deletePrefix(child.path);
    }
  }

  this.wasteData = {
    projectName: this.packageJson.name,
    root: this.root,
    port: this.port,
    fileType: this.fileType,
    tree,
    paths,
    map,
    scopeData,
  };
}

export { waste };
