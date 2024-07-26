"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDiffChangeFiles = void 0;
/**
 * 获取变动了的文件
 */
const path_1 = __importDefault(require("path"));
const util_1 = require("./util");
function getDiffChangeFiles() {
    return __awaiter(this, void 0, void 0, function* () {
        // 获取commit信息
        const command_commit = `git log -1 --pretty=format:${this.commitItem.join(',')}`;
        // 对比远程master分支 diff 部分命令
        const command_diff_master = 'git diff --name-status origin/master ';
        //获取当前分支的所有commit（和 master 对比过后的）
        const command_all_commit = 'git cherry -v origin/master';
        // 获取change文件的完整路径，和change类型
        const getArrList = (code, changeType) => {
            const arr = code.split('\n');
            // 匹配 比如 M xxxxxxxxxxxx.fileType
            const regex1 = new RegExp(`^${changeType}.*${this.fileType}`);
            // 匹配 比如 M xxxxxxxxxxxx
            const regex2 = new RegExp(`^${changeType}|\\s`, 'g');
            return arr
                .map((item) => {
                if (regex1.test(item)) {
                    const url = item.replace(regex2, '');
                    // 这个url是以项目名 （如：neighbourhood） 为根的，所以要合并绝对路径
                    // url = packages/paper/pages/detail/services/index.js
                    // this.include = /Users/a58/Desktop/work/neighbourhood/packages
                    const changePath = path_1.default.resolve(this.include, `../${url}`);
                    return {
                        changeType,
                        changePath,
                    };
                }
            })
                .filter(Boolean);
        };
        const getAllCommit = (code) => {
            if (!code)
                return [];
            const arr = code.trim().split('\n');
            const commit = arr.map((item) => {
                const [, hash, type, message] = /^\+\s(.*?)\s(.*?):\s(.*)/.exec(item);
                return {
                    hash,
                    type,
                    message,
                };
            });
            return commit;
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
            }
            catch (e) {
                console.log('\n');
                console.log(e);
                throw new Error('\n分支命名不符合规范！参考：https://igit.58corp.com/wuxianfe/neighbourhood/-/wikis/docs/开发流程和规范#如何创建分支');
            }
        };
        // 获取提测邮件需要的commit 信息
        const all_commit = yield (0, util_1.RunCommand)(command_all_commit);
        // if (!all_commit) return Promise.reject('没有变动文件！');
        this.allCommitData = getAllCommit(all_commit);
        setBranch();
        // 获取当前分支的commit
        const commit = (yield (0, util_1.RunCommand)(command_commit))
            .trim()
            .split(',');
        commit.forEach((item, i) => {
            const key = this.commitItem[i];
            this.commit[key] = item;
        });
        // 获取对比后变动的内容
        const code = yield (0, util_1.RunCommand)(command_diff_master + this.branch);
        let changeFiles = [];
        Object.keys(this.dictList).forEach((changeType) => {
            const arr = getArrList(code, changeType);
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
    });
}
exports.getDiffChangeFiles = getDiffChangeFiles;
