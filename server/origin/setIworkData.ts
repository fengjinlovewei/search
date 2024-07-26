import path from 'path';
import fs from 'fs';
import Search from '.';
import { RunCommand, mdParse, ProgressBar } from './util';

// 历史需求数据拼装成md的表格格式
function getIworkInfo(iworkList: IWorkDataType[]): string {
  let str = `|\n|`;

  const keyList = [
    {
      name: '需求地址',
      filter: (data: IWorkDataType): string => {
        const { iwork, iworkURL } = data;
        return `[${iwork}](${iworkURL})`;
      },
    },
    {
      name: '分支',
      filter: (data: IWorkDataType): string => {
        const { branch, mergeRequestIdRUL } = data;
        return `[${branch}](${mergeRequestIdRUL})`;
      },
    },
    // {
    //   name: 'commit',
    //   filter: (data: IWorkDataType): string => {
    //     const { hash, hashURL } = data;
    //     return `[${hash}](${hashURL})`;
    //   },
    // },
    {
      name: '时间',
      filter: (data: IWorkDataType): string => {
        const { time } = data;
        return `${time}`;
      },
    },
  ];

  for (let i = keyList.length; i--; i >= 0) {
    const { name } = keyList[i];
    str = `|${name}${str}-|`;
  }

  for (const iwork of iworkList) {
    str += `\n|`;
    for (const { filter } of keyList) {
      str += `${filter(iwork) || ' '}|`;
    }
  }
  return str;
}

async function setIworkData(this: Search) {
  const pb = new ProgressBar('分析进度', 40, this);

  const key = `[x]`;
  const keyEnd = `[d]`;

  const intoMasterReg = /Merge branch '(.*?)' into 'master'$/;

  const infoReg1 =
    /Resolve "(.*?)"\n\nCloses #(\d+?)\n\nSee merge request (.*?)!(\d+)/;

  const infoReg2 = /(.*?)\n\nSee merge request (.*?)!(\d+)/;

  const sliceBranch = /^(.+?)\/(.*)/;

  const isNumber = /^\d+$/;

  const isLetter = /^[a-zA-Z0-9]+$/;

  const types = ['%h', '%an', '%ci', '%s', '%b'].join(key) + keyEnd;

  const branchTypeList = {
    fix: 'https://ee.58corp.com/w/bug/',
    hotfix: 'https://ee.58corp.com/w/bug/',
    bugfix: 'https://ee.58corp.com/w/bug/', // 还真有这么写的！
    feature: 'https://ee.58corp.com/w/issue/',
    featrue: 'https://ee.58corp.com/w/issue/', // 有人把字母打错！
  };

  // 查出最近一年的数据，【根据types的设置列出清单】
  /**
   "c366c90d4[x]要嵘赫[x]2021-10-29 02:46:02 +0000[x]Merge branch 'feature/wxnr-451' into 'master'[x]Resolve "feat:本地版全局弹窗新增"

    Closes #529

    See merge request wuxianfe/react-native-apps!776[d]
    5206b626f[x]muzhaoyang[x]2021-10-29 10:42:59 +0800[x]Merge remote-tracking branch 'origin/master' into feature/wxnr-451[x][d]
    49e422813[x]要嵘赫[x]2021-10-28 08:23:17 +0000[x]Merge branch 'feature/daojia-add-pub' into 'master'[x]Resolve "到家app接入部落发布页"

    Closes #520

    ...
   */
  const gitlogData = await RunCommand(
    `git log --pretty=format:"${types}" ${this.gitLog}`
  );

  //
  /**
   [
    'c366c90d4',
    '要嵘赫',
    '2021-10-29 02:46:02 +0000',
    "Merge branch 'feature/wxnr-451' into 'master'",
    'Resolve "feat:本地版全局弹窗新增"\n' +
      '\n' +
      'Closes #529\n' +
      '\n' +
      'See merge request wuxianfe/react-native-apps!776'
    ],
    [
      '\n5206b626f',
      'muzhaoyang',
      '2021-10-29 10:42:59 +0800',
      "Merge remote-tracking branch 'origin/master' into feature/wxnr-451",
      ''
    ],
    [
      '\n49e422813',
      '要嵘赫',
      '2021-10-28 08:23:17 +0000',
      "Merge branch 'feature/daojia-add-pub' into 'master'",
      'Resolve "到家app接入部落发布页"\n' +
        '\n' +
        'Closes #520\n' +
        '\n' +
        'See merge request wuxianfe/react-native-apps!762'
    ]
   */
  const gitlogDatNew = gitlogData.split(keyEnd).map((item) => item.split(key));

  gitlogDatNew.pop(); // 最后一个是空的，删除掉

  const iworkDataList: IWorkDataType[] = [];
  // "http://igit.58corp.com/wuxianfe/react-native-apps.git"
  let { url } = this.packageJson.repository || {};

  // 去掉文件名后缀
  // "http://igit.58corp.com/wuxianfe/react-native-apps"
  url = url.replace(/\.git$/, '');

  for (const kid of gitlogDatNew) {
    /**
     [
      'c366c90d4',
      '要嵘赫',
      '2021-10-29 02:46:02 +0000',
      "Merge branch 'feature/wxnr-451' into 'master'",
      'Resolve "feat:本地版全局弹窗新增"\n' +
        '\n' +
        'Closes #529\n' +
        '\n' +
        'See merge request wuxianfe/react-native-apps!776'
      ],
     */
    let [hash, user, time, type, info] = kid;

    // ["Merge branch 'feature/wxnr-451' into 'master'", "feature/wxnr-451"]
    const regData = type.match(intoMasterReg);

    /**
      [
        "Resolve \"feat:本地版全局弹窗新增\"\n\nCloses #529\n\nSee merge request wuxianfe/react-native-apps!776",
        "feat:本地版全局弹窗新增",
        "529",
        "wuxianfe/react-native-apps",
        "776"
      ]
    */
    const infoData1 = info.match(infoReg1);

    /**
     [
       "Closes #529\n\nSee merge request wuxianfe/react-native-apps!776",
       "Closes #529",
       "wuxianfe/react-native-apps",
       "776"
     ]
     */
    const infoData2 = info.match(infoReg2);

    if (regData) {
      let issuesText = '',
        closedId = '',
        mergeRequestId = '';

      if (infoData1) {
        [, issuesText, closedId, , mergeRequestId] = infoData1;
      } else if (infoData2) {
        [, issuesText, , mergeRequestId] = infoData2;
      }

      hash = hash.replace(/^\s/g, '');

      // https://igit.58corp.com/wuxianfe/neighbourhood/commit/81f0340
      // https://igit.58corp.com/wuxianfe/neighbourhood/-/issues/873
      // https://igit.58corp.com/wuxianfe/neighbourhood/-/merge_requests/1275

      iworkDataList.push({
        hash,
        hashURL: `${url}/commit/${hash}`,
        user,
        time: time.split(/\s/g)[0],
        branch: regData[1],
        issuesText,
        closedId,
        closedIdURL: closedId ? `${url}/-/issues/${closedId}` : '',
        info,
        mergeRequestId,
        mergeRequestIdRUL: `${url}/-/merge_requests/${mergeRequestId}`,
        changeFiles: [],
        iwork: '',
        iworkURL: '',
        entryPath: '',
        error: null,
      });
    }
  }

  const promiseAll: Promise<string>[] = [];

  // 通过对比上一次master合并，或的变动文件
  // 两两笔对弊端就是最后一个merge没法跟其他比对了，因为它下面没人了
  /**
   promiseAll = 
   0: [[PromiseValue]]: 'D\tpackages/shared/SDK/GlobalModal/components/PullN…ges/shared/SDK/GlobalModal/getModal/modalMaps.js\n'}
   1: [[PromiseValue]]: 'D\tApp/bundle.100.wbdaojia.js\nM\tpackages/publish/co…yncStorage.js\nD\tpackages/shared/envs/wbdaojia.js\n'}
   2: [[PromiseValue]]: 'M\tApp/bundle.100.wbutown.js\nM\tApp/bundle.166.wbuto…bundle.493.wbutown.js\nM\tApp/index.147.wbutown.js\n'}
   */

  if (iworkDataList.length < 2)
    return Promise.reject('少于2条需求记录，无法分析');

  iworkDataList.reduce((previousValue, currentValue) => {
    promiseAll.push(
      RunCommand(
        `git diff --name-status ${previousValue.hash} ${currentValue.hash}`
      )
    );
    return currentValue;
  });

  // 将变文件数据格式化，挂载到 iworkList 中
  /**
   0: 'D\tpackages/shared/SDK/GlobalModal/components/PullN…ges/shared/SDK/GlobalModal/getModal/modalMaps.js\n'}
   1: 'D\tApp/bundle.100.wbdaojia.js\nM\tpackages/publish/co…yncStorage.js\nD\tpackages/shared/envs/wbdaojia.js\n'}
   2: 'M\tApp/bundle.100.wbutown.js\nM\tApp/bundle.166.wbuto…bundle.493.wbutown.js\nM\tApp/index.147.wbutown.js\n'}
   */
  const promiseAllData = await Promise.all(promiseAll);

  promiseAllData.forEach((item, index) => {
    let changeFiles = item.split('\n');

    changeFiles.pop(); // 最后一个是空的，没有意义去掉

    changeFiles = changeFiles.filter((item) => this.fileTypeRegExp.test(item));

    /**
     0: {changeType: 'D', changePath: '/Users/a58/Desktop/work/react-native-apps/packages…DK/GlobalModal/components/PullNewTZModal/index.js'}
     1: {changeType: 'D', changePath: '/Users/a58/Desktop/work/react-native-apps/packages…DK/GlobalModal/components/PullNewTZModal/style.js'}
     2: {changeType: 'D', changePath: '/Users/a58/Desktop/work/react-native-apps/packages…red/SDK/GlobalModal/getModal/getPullNewTZModal.js'}
     3: {changeType: 'M', changePath: '/Users/a58/Desktop/work/react-native-apps/packages/shared/SDK/GlobalModal/getModal/modalMaps.js'}
     */
    const _changeFiles = changeFiles.map((item) => {
      const [changeType, changePath] = item.split(/\s/);

      return {
        changeType: changeType as ChangeType,
        changePath: this.addPrefix(changePath),
      };
    });

    iworkDataList[index].changeFiles = _changeFiles;
  });

  // 遍历入口文件的所有引用文件
  /**
   this.scopeData = 
    0: {path: '/Users/a58/Desktop/work/react-native-apps/packages/discovery/index.js', children: Array(674), total: 1656}
    1: {path: '/Users/a58/Desktop/work/react-native-apps/packages/tribe-home/index.js', children: Array(375), total: 903}
    2: {path: '/Users/a58/Desktop/work/react-native-apps/packages/news/index.js', children: Array(272), total: 594}
    ....
 
  children = 
    0: {path: '/Users/a58/Desktop/work/react-native-apps/packages/shared/dark-mode-helper/const.js', total: 123}
    1: {path: '/Users/a58/Desktop/work/react-native-apps/packages/shared/utils/resolveImageURL.js', total: 49}
    2: {path: '/Users/a58/Desktop/work/react-native-apps/packages/shared/utils/resolveURL.js', total: 41} 
  */

  // 获取iwork id和 iwork url
  const getIwork = (branch: string) => {
    let iwork = '';
    let iworkURL = '';

    const [, bType, information = ''] = branch.match(sliceBranch) || [];

    const arr = information.split('-');

    for (let i = 0; i < arr.length; i++) {
      if (i > 0 && isNumber.test(arr[i]) && isLetter.test(arr[i - 1])) {
        iwork = `${arr[i - 1]}-${arr[i]}`;
        // 如果没有匹配的type，使用feature兜底
        const t = branchTypeList[bType] || branchTypeList.feature;

        iworkURL = `${t}${iwork}`;

        break;
      }
    }

    return { iwork, iworkURL };
  };

  const entryIwork: EntryIworkType = {};

  // 切换分支
  const iworkDataListLen = iworkDataList.length;

  this.log.red('\n\n分析需求依赖已开始，请不要操作文件和中断操作！\n');

  pb.render({ completed: 0, total: iworkDataListLen });

  // 缓存当前分支代码
  // await RunCommand(`git stash`);

  // 错误需求容器
  const errorList: IWorkDataType[] = [];

  for (let i = 0; i < iworkDataListLen; i++) {
    const iworkData = iworkDataList[i];
    try {
      const { hash, branch, changeFiles } = iworkData;
      //log(hash);

      await RunCommand(`git checkout ${hash}`);

      // 重新编译
      await this.runModules.creatFileTree.func();
      await this.runModules.formatFiles.func();
      await this.runModules.getEntryScope.func();

      // 每一个入口文件对每一个需求都要检测。
      this.scopeData.forEach((fileEntry) => {
        const { path, children } = fileEntry;
        const childrenFiles = children.map((item) => item.path);

        for (const changeFile of changeFiles) {
          const { changePath } = changeFile;

          // 先判断是否是需要排出的文件
          const isExcPathsList = this.iworkExcPaths.filter(
            (item) => changePath.indexOf(item) === 0
          );
          // 如果当前文件是被排除的范围，那么直接跳过检查
          if (isExcPathsList.length > 0) continue;

          if (childrenFiles.includes(changePath)) {
            // 只要发现一个改动文件在此入口下，就可以判定命中
            const { iwork, iworkURL } = getIwork(branch);

            // 不符合规范的分支默认为不是需求分支

            iworkData.iworkURL = iworkURL;
            iworkData.iwork = iwork;
            iworkData.entryPath = path;

            if (entryIwork[path]) {
              entryIwork[path].push(iworkData);
            } else {
              entryIwork[path] = [iworkData];
            }

            break;
          }
        }
      });
    } catch (e) {
      iworkData.error = e;
      errorList.push(iworkData);
    }
    pb.render({ completed: i + 1, total: iworkDataListLen });
    //await getTime(1000000, true);
  }

  if (errorList.length) {
    this.log.red(`\n需求分析出错个数: ${errorList.length}\n`);
    this.log.red(`\n${JSON.stringify(errorList)}\n`);
  }
  // 根据入口写入需求
  const writeMd = (entryPath: string, iworkList: IWorkDataType[]) => {
    if (iworkList.length === 0) return;
    // 获取入口对应的md文件路径
    const newFileEntry = this.getMD(entryPath);

    const iworksInfoStr = getIworkInfo(iworkList);

    const iworks = '\n\n## 历史需求\n\n' + iworksInfoStr;

    // 判断文件路径是否存在
    if (fs.existsSync(newFileEntry)) {
      const originMd = fs.readFileSync(newFileEntry, 'utf-8');
      let md = originMd;
      const mdData = mdParse(md);

      // 如果md存在，并且不存在“历史需求”数据，添加
      if (!mdData['历史需求']) {
        md = md + iworks;
      } else {
        if (/## 历史需求\n\n[\s|\S]*?(\n## )/.test(md)) {
          const reg = /## 历史需求\n\n[\s|\S]*?(\n## )/;
          md = md.replace(reg, `## 历史需求\n\n${iworksInfoStr}\n$1`);
        } else {
          const reg = /## 历史需求[\s|\S]*/;
          md = md.replace(reg, `## 历史需求\n\n${iworksInfoStr}\n\n`);
        }
      }
      try {
        if (originMd !== md) {
          fs.writeFileSync(newFileEntry, md);
          return true;
        }
      } catch (e) {
        this.log(`\n\nerror: ${newFileEntry} 写入失败\n\n`);
      }
    } else {
      // 读出模板md
      const defauleMD = fs.readFileSync(
        path.resolve(__dirname, '../static/README.md'),
        'utf-8'
      );
      // 如果不存在md文件，直接写入模板 + 需求数据
      try {
        fs.writeFileSync(newFileEntry, defauleMD + iworks);
        return true;
      } catch (e) {
        this.log(`\n\nerror: ${newFileEntry} 写入失败\n\n`);
      }
    }
  };

  // 切换成原本的分支
  await RunCommand(`git checkout ${this.branch}`);

  //await RunCommand(`git stash pop`);

  if (typeof this.iworkCallback === 'function') {
    this.iworkCallback(entryIwork);
  } else {
    let n = 0;
    Object.keys(entryIwork).forEach((key) => {
      if (writeMd(key, entryIwork[key])) {
        n++;
      }
    });
    this.log.green(`\n有 ${n} 个入口markdown文件的“历史需求”被更新\n`);
  }
}

export { setIworkData };
