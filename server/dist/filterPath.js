"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterPath = void 0;
/**
 *
 * 1. 处理 import xx from 后的路径
 * 2. 处理 require('xxx') 暂时不管
 *
 */
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("./util");
const { parse } = require('@babel/parser');
const TYPE = ['ImportDeclaration', 'ExportNamedDeclaration'];
function filterPath({ item }) {
    const file = item.path;
    const fileArr = [];
    // 还原绝对路径
    const pathReducer = (url) => {
        //
        let newUrl = url;
        // 先判断是不是node_modules里的宝宝
        newUrl = this.filterNodeModules(newUrl);
        if (!newUrl)
            return;
        // 查看url前面有没有@自定义的标识符啥的
        newUrl = this.filterAlias(newUrl);
        // 如果 filterAlias 没返回值，说明是相对路径
        newUrl = newUrl || path_1.default.resolve(item.absDir, url);
        //判断后缀，并且补全
        newUrl = this.filterSuffixAll(newUrl);
        // 如果结果不是undefined，那么就放入依赖数组
        // 操作系统应该可以判断并忽略多余的“/”符，windows和linux都是支持这样的。
        // 合并多余的连续的"/"
        newUrl && fileArr.push(newUrl.replace(/\/+/g, '/'));
    };
    try {
        const code = fs_1.default.readFileSync(file, 'utf-8');
        // 生成语法树
        const ast = parse(code, {
            sourceType: 'module',
            plugins: [
                'jsx',
                'typescript',
                'decorators-legacy',
                'exportDefaultFrom',
                'importAssertions',
            ],
        });
        // 这段匹配了require动态导入的文件
        const requireList = code.match(/(?<=require\(('|"|`))(.*?)(?=('|"|`)\))/g);
        if (Array.isArray(requireList)) {
            for (const item of requireList) {
                pathReducer(item);
            }
        }
        ast.program.body.forEach((obj) => {
            const { type, source } = obj;
            if (TYPE.includes(type) && (0, util_1.getType)(source) === 'Object') {
                if (source.value) {
                    pathReducer(source.value);
                }
            }
        });
        this.MAP[file] = {
            children: fileArr,
            $cited: [],
        };
    }
    catch (e) {
        this.babelParserError.push(Object.assign(Object.assign({}, e), { path: file }));
    }
}
exports.filterPath = filterPath;
