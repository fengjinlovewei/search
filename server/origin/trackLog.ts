import path from 'path';
import compressing from 'compressing';
import fs from 'fs';
import glob from 'glob';
import Search from '.';
import { execSync } from 'child_process';

import traverse, { NodePath } from '@babel/traverse';
import type { CallExpression } from '@babel/types';
import _ from 'lodash';
import needle from 'needle';

import { RunCommand, getType, mdParse, fixedCharAt } from './util';
import type { getValueReturnType } from './getPrimitive';

const trackLogSetOptionsPathMap = {};
/**
 * 生成的新文件（ps：意味着收工时，需要再代码最后删除的文件）
 * 1. vuepress 目录下的工程名字文件夹，这是生成的html 如：server/docs/.vuepress/neighbourhood
 * 2. vuepress 目录下的工程名字塔索文件，这是生成的html打包后的文件 如：server/docs/.vuepress/neighbourhood.zip
 * 3. vuepress 目录下的data.json，这是生成的打包配置文件 如：server/docs/.vuepress/data.json
 * 4. server/docs/home 整个目录，这是生成的打包HTML需要的md文件
 */

async function trackLog(this: Search) {
  // 打包命令bin路径
  const binPath = path.resolve(__dirname, '../../node_modules/.bin/vuepress');

  const homePage = path.join(this.trackLogDocsHtmlPath, `home/page`);

  this.delFile(homePage);
  fs.mkdirSync(homePage);

  // 打包输出路径
  const destPath = path.join(
    this.trackLogDocsHtmlPath,
    `.vuepress/${this.packageJson.name}`
  );

  // 新的项目名字路径
  const newProjectPath = path.join(
    this.trackLogDocsHtmlPath,
    `.vuepress/${this.packageJson.name}`
  );

  // 压缩包名字
  const newProjectPathZip = `${newProjectPath}.zip`;

  // 打包相关配置文件路径
  const vuepressJsonPath = path.join(
    this.trackLogDocsHtmlPath,
    `.vuepress/data.json`
  );

  // 上传接口
  const uploadUrl = `${this.middleserverIP}/upload/file`;

  // 上传接口
  const getTracklogUrl = `${this.middleserverIP}/tracklog/getTracklog`;

  // needle.get(getTracklogUrl, { realtime: '1' }, function (err, resp, body) {
  //   console.log('哈哈', err, resp, body); // another nice treat from this handsome fella.
  // });
  console.log('begin!');

  const getTracklog = (params) => {
    return new Promise((resolve, reject) => {
      needle.request('get', getTracklogUrl, params, function (err, resp) {
        if (err) {
          reject(err);
        }
        if (resp.statusCode == 200) {
          resolve(resp.body);
        }
        reject(resp);
      });
    });
  };

  const sendZIP = () => {
    return new Promise((resolve, reject) => {
      needle.post(
        uploadUrl,
        {
          uploadType: '1',
          file: {
            file: newProjectPathZip,
            content_type: 'application/zip',
          },
        },
        { multipart: true },
        function (err, resp, body) {
          if (err) {
            reject(err);
          }
          resolve({ resp, body });
          // needle will read the file and include it in the form-data as binary
          // console.log(body);
        }
      );
    });
  };

  let projectTracklogData = [];

  try {
    const res: any = await getTracklog({
      projectName: this.packageJson.name,
    });
    if (res.code == 0) {
      projectTracklogData = res.data;
    }
  } catch (e) {}

  // 从数据库拿来的数据，有的字段需要格式化一下
  projectTracklogData.forEach((item) => {
    item.paramsArray = JSON.parse(item.paramsArray);
    item.paramsJson = JSON.parse(item.paramsJson);
  });

  // console.log('projectTracklogData', projectTracklogData);

  // 获取埋点入口文件，这个文件只能是一个
  const trackEntry = glob
    .sync('**/+(tracks*|track*)/index.+(js|ts)', {
      cwd: this.include,
      nosort: true,
    })
    .map((p) => path.join(this.include, p));

  console.log(trackEntry);

  const getTrackerName = (entry: string): getValueReturnType | null => {
    const fullPath = this.addPrefix(entry);

    // 生成语法树
    const { body } = this.getAst(fullPath).program;

    //引用埋点index文件的文件数据集合
    const trackLogImport: string[] = [entry];

    // import Tracker from '@core/shared/utils/Tracker';

    const fullPathObj = this.MAP[fullPath];

    // 埋点类名的名称,不除意外的话，应该是 'Tracker'
    let className = '';

    for (const importItem of fullPathObj.all) {
      // 找到了 import Tracker from '@core/shared/utils/Tracker';
      if (importItem.fullPath.indexOf('/Tracker') > -1) {
        className = importItem.ImportDefaultSpecifier;
        break;
      }
    }

    if (!className) {
      console.log(`className出错！ ${fullPath}`);
      return null;
    }

    //('className:' + className);

    let option: getValueReturnType | null = null;

    // Tracker 类的变量名
    let classVarName = '';

    for (const bodyItem of body) {
      if (bodyItem.type === 'VariableDeclaration') {
        for (const item of bodyItem.declarations) {
          if (
            item.type === 'VariableDeclarator' &&
            item.init.type === 'NewExpression'
          ) {
            // 命中了className
            if (
              item.init.callee.type === 'Identifier' &&
              item.init.callee.name === className
            ) {
              //const tracker = new Tracker
              if (item.id.type === 'Identifier') {
                classVarName = item.id.name;
              }

              // const { tracker } = new Tracker
              // 这种的先不管了

              const argument = item.init.arguments[0];

              if (argument && argument.type === 'ObjectExpression') {
                //debugger;
                option = this.getPrimitive({ value: argument, fullPath });
                break;
              }
            }
          }
        }
      }
    }

    // console.log('classVarName:' + classVarName);

    // 找出所有的，引用埋点index文件的文件数据集合
    for (const MAP_path of Object.keys(this.MAP)) {
      const MAP_path_children = this.MAP[MAP_path]?.children || [];

      for (const MAP_path_child of MAP_path_children) {
        if (MAP_path_child === fullPath) {
          trackLogImport.push(MAP_path);
        }
      }
    }

    //console.log('trackLogImport', trackLogImport);

    // 在这些引入埋点index文件的文件中，找出是否有setOption的函数
    // 如果有，拿出setOption的函数的参数
    for (const trackLogImportPath of trackLogImport) {
      const ArgumentsValue: getValueReturnType[] = [];

      traverse(this.getAst(trackLogImportPath), {
        CallExpression: (path: NodePath<CallExpression>) => {
          // debugger;
          // console.log(classVarName);
          // console.log(path);

          const callee = path.get('callee');

          //
          if (callee.isMemberExpression()) {
            // 直接判断classVarName不是很保险，应该先知晓导出的变量名，比如export {tracker:}
            if (
              `${callee.get('object')}` === classVarName &&
              `${callee.get('property')}` === 'setOptions'
            ) {
              const Arguments = path.get('arguments');

              ArgumentsValue.push(
                this.getPrimitive({
                  value: Arguments[0].node,
                  fullPath: trackLogImportPath,
                })
              );
            }
          }
        },
      });

      if (!trackLogSetOptionsPathMap[trackLogImportPath]) {
        trackLogSetOptionsPathMap[trackLogImportPath] = {};
      }

      trackLogSetOptionsPathMap[trackLogImportPath][fullPath] = ArgumentsValue;
    }

    return option;
  };

  const splitStr = (str: string, split: number) => {
    let i = 0,
      cur = '',
      arrStr = '';
    const arr = [];

    while ((cur = fixedCharAt(str, i))) {
      arrStr += cur;
      i++;
      if (Array.from(arrStr).length >= split) {
        arr.push(arrStr);
        arrStr = '';
      }
    }

    arr.push(arrStr);

    return arr.join('</br>');
  };

  const formatterStr = (data, split?: number): string => {
    if (!data) return '';
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }
    // 这块主要处理md里面的关键字符
    data = data.replace(/(\||\-|\*)/g, '\\$1');
    data = data.replace(/\s/g, '');
    // markdown 有自己的emoji表情，很烦，要去掉
    data = data.replace(/:/g, ': ');

    if (!split) return data;

    return splitStr(data, split);
  };

  const ObjectToStr = (json = {}): string => {
    let str = '';
    for (const key in json) {
      if (key.indexOf('__comment__') === 0) continue;
      str += `<span class="track-key">${formatterStr(
        key
      )}:</span> ${formatterStr(json[key], 30)} </br>`;
    }
    return str;
  };

  const ArrayToStr = (arr = []): string => {
    return arr.map((item) => `${formatterStr(item, 40)}`).join(',</br>');
  };

  const getJsonString = ({
    trackMaps = {},
    pagetype = '',
    commonParams = {},
    page,
  }) => {
    let str = '';

    for (const key in trackMaps) {
      if (key.indexOf('__comment__') === 0) continue;

      const comment = trackMaps[`__comment__${key}`] || [];

      const opts = trackMaps[key] || {};

      const ptype = opts.page_type || opts.pagetype || pagetype || '';
      const atype = opts.action_type || opts.actiontype || '';

      const params =
        opts.params || opts.paramsArray || opts.paramsArrayJson || [];

      // json
      const json = {
        // 部落内业务固定参数
        //neirong_flag: 'neirong,tribe_all,tribe',
        ...(commonParams || {}),
        ...(opts.json || {}),
        ...(opts.paramsJson || {}),
      };

      //console.log(ptype);

      str += `| <span class="track-key">pagetype:<hello>wowow</hello></span> ${formatterStr(
        ptype,
        20
      )} `;

      str += `<br/><br/><span class="track-key">actiontype:</span> ${formatterStr(
        atype,
        20
      )} `;

      str += `<br/><br/><span class="track-key">trackName:</span> ${formatterStr(
        key,
        20
      )} `;

      str += `<br/><br/><span class="track-key">备注:<el-button size="mini" >点我显示真实上报数据</el-button></span> ${formatterStr(
        comment.join(','),
        12
      )} `;

      const option = {
        page,
        projectName: this.packageJson.name,
        trackName: key,
      };

      str += `| <layer :options='${JSON.stringify(
        option
      )} ' type='paramsArray'>${ArrayToStr(params)}</layer> `;

      str += `| <layer :options='${JSON.stringify(
        option
      )} ' type='paramsJson'>${ObjectToStr(json)}</layer> `;

      str += `| \n`;
    }
    return str;
  };

  const getMarkDown = ({ trackMaps, pagetype, commonParams, entry, page }) => {
    let str = '';

    if (getType(trackMaps) === 'Array') {
      const [one, two, three] = trackMaps;
      //console.log(trackMaps);
      if (one.indexOf('@@ConditionalExpression[') !== -1) {
        str += `#### ————多组埋点start————\n`;
        str += `**根据条件【${one}】可得两组埋点配置**\n\n`;

        str += getMarkDown({
          trackMaps: two,
          pagetype,
          commonParams,
          entry,
          page,
        });
        str += `\n`;
        str += getMarkDown({
          trackMaps: three,
          pagetype,
          commonParams,
          entry,
          page,
        });

        str += `\n#### ————多组埋点end————\n`;
      }
    }

    if (getType(trackMaps) === 'Object') {
      let str = '';

      if (entry) {
        str += `### ${this.deletePrefix(entry).replace('packages/', '')}\n\n`;
      }

      str +=
        '|pagetype|actiontype|备注（功能描述）|params|json|\n|-|-|-|-|-|\n';
      return (
        str + getJsonString({ trackMaps, pagetype, commonParams, page }) + '\n'
      );
    }

    return str;
  };
  //   trackEntry = [
  //     '/Users/a58/Desktop/work/neighbourhood/packages/core/pages/topicDetail/entries/comment-detail/tracks/index.js',
  //   ];
  const trackEntryJson: { [x: string]: getValueReturnType } = {};

  // packages_task_pages_taskTieComment_tracks
  for (const entry of trackEntry) {
    // if (entry.indexOf('myRecord/tracks') === -1) continue;
    // if (entry.indexOf('/interests/tracks') === -1) continue;

    try {
      const data = getTrackerName(entry);

      if (data === null) {
        console.log(`没有发现实体类中中的埋点参数，entry = ${entry}`);
      }

      trackEntryJson[entry] = data;
    } catch (e) {
      console.error(e);
      console.log(`错误 entry = ${entry}`);
    }
  }

  // 遍历页面入口文件
  const vuepressStaticData = [];

  // 打包时一个页面可能有多个入口文件，多个入口文件会造成多个文档tab，所以清理这些
  // 入口文件，只留一个index的文件，因为人们习惯把index作为入口文件之一
  const pagesFileEntryIndex = this.pagesFileEntry.filter((item) => {
    return /index\.(js|ts|jsx|tsx)$/.test(item.path);
  });

  for (const entryPage of pagesFileEntryIndex) {
    const { path: p, page } = entryPage;
    // debugger;
    const { children_array } = this.getScope(p, false);
    const children_path = children_array.map((item) => item.path);

    let str = '';
    let title = '';

    const pageMd = this.getPage(p);

    debugger;

    const pageData = projectTracklogData.filter((item) => item.page === page);

    if (pageMd) {
      str += pageMd.md;
      str = str.replace(/（示例：[\s|\S]*?）/g, '');

      const { head } = mdParse(str) || {};
      title = head.title;

      str = str.replace(/\-\-\-\n/g, '```\n');
    }

    str += '\n\n## 埋点\n\n';

    // 遍历埋点文件
    for (const entry of trackEntry) {
      // 页面入口引用了埋点文件，那么此埋点文件的数据就要记录
      if (children_path.includes(entry)) {
        const trackEntryData: any = trackEntryJson[entry] || {};

        const { v = {}, t = '' } = trackEntryData;

        //if (t !== 'Object') continue;

        const allDataList = [];

        for (const child_path of children_path) {
          if (
            trackLogSetOptionsPathMap[child_path] &&
            trackLogSetOptionsPathMap[child_path][entry]
          ) {
            const arr = trackLogSetOptionsPathMap[child_path][entry] || [];
            arr.forEach((item) => {
              const { v, t } = item;
              allDataList.push(v);
            });
          }
        }

        const allData = _.merge(v, ...allDataList);

        // console.log(allData);

        const { trackMaps, pagetype = '', commonParams } = allData;

        //console.log('trackMaps', trackMaps);

        str += getMarkDown({
          trackMaps,
          pagetype,
          commonParams,
          entry,
          page,
        });
      }
    }

    const paths =
      'home/page/' + this.deletePrefix(path.dirname(p)).replace(/\//g, '-');

    vuepressStaticData.push([
      paths, // 路径
      title || paths.replace('home/page/packages-', ''), // title
    ]);

    try {
      fs.writeFileSync(
        path.join(this.trackLogDocsHtmlPath, `${paths}.md`),
        str
      );
    } catch (e) {
      console.error(p);
    }
  }

  // 创建文档路由配置文件
  try {
    fs.writeFileSync(
      vuepressJsonPath,
      JSON.stringify({
        name: this.packageJson.name,
        dest: destPath,
        page: {
          children: vuepressStaticData,
        },
      })
    );
  } catch (e) {
    console.error(e);
  }

  const currentContent = process.cwd();

  // 切换node上下文环境，以免执行报错。
  process.chdir(`${path.resolve(__dirname, '../../')}`);

  // 开始打包
  // try {
  //   await RunCommand(`${binPath} build ${this.trackLogDocsHtmlPath}`);
  // } catch (e) {
  //   console.log('打包出错');
  //   console.log(e);
  // }

  execSync(`${binPath} build ${this.trackLogDocsHtmlPath}`, {
    stdio: 'inherit',
  });

  // 开始压缩
  try {
    await compressing.zip.compressDir(newProjectPath, newProjectPathZip);
  } catch (e) {
    console.log('压缩出错');
    console.log(e);
  }

  // 切回node上下文环境。
  process.chdir(currentContent);

  // 把压缩发送到中间服务器
  try {
    const res: any = await sendZIP();
    if (res.code === 0) {
      console.log(res.message);
    } else {
      console.log(res.message);
    }
  } catch (e) {
    console.log('发送压缩包出错');
    console.log(e);
  }
}

export { trackLog };
