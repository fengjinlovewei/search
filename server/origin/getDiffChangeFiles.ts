/**
 * 获取变动了的文件
 */
import path from 'path';
import Search from '.';
import { RunCommand } from './util';

async function getDiffChangeFiles(this: Search) {
  // 获取commit信息
  const command_commit: string = `git log -1 --pretty=format:${this.commitItem.join(
    ','
  )}`;

  // 对比远程master分支 diff 部分命令
  const command_diff_master: string = 'git diff --name-status origin/master ';

  //获取当前分支的所有commit（和 master 对比过后的）
  const command_all_commit: string = 'git cherry -v origin/master';

  // 获取change文件的完整路径，和change类型
  const getArrList = (
    code: string,
    changeType: ChangeType
  ): ChangeFilesType => {
    const arr: Array<string> = code.split('\n');
    // 匹配 比如 M xxxxxxxxxxxx.fileType
    const regex1: RegExp = new RegExp(`^${changeType}.*${this.fileType}`);
    // 匹配 比如 M xxxxxxxxxxxx
    const regex2: RegExp = new RegExp(`^${changeType}|\\s`, 'g');

    return arr
      .map((item) => {
        if (regex1.test(item)) {
          const url: string = item.replace(regex2, '');
          // 这个url是以项目名 （如：neighbourhood） 为根的，所以要合并绝对路径
          // url = packages/paper/pages/detail/services/index.js
          // this.include = /Users/a58/Desktop/work/neighbourhood/packages
          const changePath: string = path.resolve(this.include, `../${url}`);
          return {
            changeType,
            changePath,
          };
        }
      })
      .filter(Boolean);
  };

  const getAllCommit = (code: string): Array<commitDataType> => {
    if (!code) return [];
    const arr: Array<string> = code.trim().split('\n');
    const commit = arr.map((item) => {
      const [, hash, type, message] = /^\+\s(.*?)\s(.*?):\s(.*)/.exec(item);
      return {
        hash,
        type,
        message,
      };
    });
    return commit as Array<commitDataType>;
  };

  const setBranch = () => {
    const reg = /^(.+?)\/(.*)/g;
    const branchTypeList = {
      fix: 'https://ee.58corp.com/w/bug/',
      hotfix: 'https://ee.58corp.com/w/bug/',
      feature: 'https://ee.58corp.com/w/issue/',
    };

    try {
      // 获取iwork
      // this.branch = feature/fengjin02-WXNR-1040-other
      const [, branchType, barnch] = reg.exec(this.branch);
      const [, type, id, other] = barnch.split('-');

      this.branchType = branchType;

      // 如果type为纯数字，那么判定为新版的iwork链接的id
      if (/^\d+$/.test(type)) {
        this.iworkId = `${type}`;
        this.iwork = `https://ee.58corp.com/base2/w/items/${this.iworkId}`;
        return;
      }

      if (id) {
        this.iworkId = `${type}-${id}`;
        this.iwork = `${branchTypeList[branchType]}${this.iworkId}`;
      }
    } catch (e) {
      console.log('\n');
      console.log(e);
      throw new Error(
        '\n分支命名不符合规范！参考：https://igit.58corp.com/wuxianfe/neighbourhood/-/wikis/docs/开发流程和规范#如何创建分支'
      );
    }
  };

  // 获取提测邮件需要的commit 信息
  const all_commit = await RunCommand(command_all_commit);

  // if (!all_commit) return Promise.reject('没有变动文件！');

  this.allCommitData = getAllCommit(all_commit);

  setBranch();

  // 获取当前分支的commit
  const commit: Array<string> = (await RunCommand(command_commit))
    .trim()
    .split(',');

  commit.forEach((item, i) => {
    const key = this.commitItem[i];
    this.commit[key] = item;
  });

  // 获取对比后变动的内容
  const code: string = await RunCommand(command_diff_master + this.branch);

  let changeFiles: ChangeFilesType = [];

  Object.keys(this.dictList).forEach((changeType) => {
    const arr = getArrList(code, changeType as ChangeType);
    if (arr.length) {
      changeFiles = [...changeFiles, ...arr];
    }
  });
  // changeFiles = [
  //   {
  //     changeType: 'M',
  //     changePath: '/Users/a58/Desktop/work/neighbourhood/packages/userGrowth/shared/components/CardScrollAnimate/index.jsx'
  //   },
  //   {
  //     changeType: 'A',
  //     changePath: '/Users/a58/Desktop/work/neighbourhood/scripts/tree.js'
  //   }
  // ]
  this.changeFiles = changeFiles;
}

export { getDiffChangeFiles };
