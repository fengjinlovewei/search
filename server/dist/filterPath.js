"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterPath = void 0;
/**
 *
 */
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const parser_1 = require("@babel/parser");
function filterPath({ item }) {
    const file = item.path;
    // 因为引入文件路径使用频率较高，所以单独放一个数组
    const childrenArr = [];
    // 这个数组 = 当前文件引入的变量、路径, 包含了childrenArr的信息
    const allArr = [];
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
        if (newUrl) {
            return newUrl.replace(/\/+/g, '/');
        }
        return '';
    };
    try {
        const code = fs_1.default.readFileSync(file, 'utf-8');
        // if (
        //   file ===
        //   '/Users/a58/Desktop/work/neighbourhood/packages/activity/pages/frontPage/tracks/trackMaps/b.js'
        // ) {
        //   debugger;
        // }
        // 生成语法树
        const ast = (0, parser_1.parse)(code, this.babelParserConfig);
        // 这段匹配了require动态导入的文件
        const requireList = code.match(/(?<=require\(('|"|`))(.*?)(?=('|"|`)\))/g);
        if (Array.isArray(requireList)) {
            for (const item of requireList) {
                const fullPath = pathReducer(item);
                fullPath && childrenArr.push(fullPath);
            }
        }
        ast.program.body.forEach((bodyItem) => {
            const allData = {
                fullPath: '',
                ImportDefaultSpecifier: null,
                ImportSpecifier: [],
                ImportNamespaceSpecifier: null,
                ExportSpecifier: [],
                ExportNamespaceSpecifier: null,
                ExportAllDeclaration: false,
            };
            /**
             * 例如：
             * ImportDeclaration = import store from './store' || import './tracks/browse';
             * ExportNamedDeclaration = export {thing1, thing2} from './module-a.js';
             */
            if (bodyItem.type === 'ImportDeclaration' ||
                bodyItem.type === 'ExportNamedDeclaration') {
                // import xxxx from './storeh'
                // source.value = './storeh'
                const { source, specifiers } = bodyItem;
                //export { tracker, trackLog }; 这种没有sourse
                if (source === null)
                    return;
                const fullPath = pathReducer(source.value);
                // 这里没有分析引入的npm包模块，比如这种 import React from 'react';
                // 1.因为一般不会使用npm的常量
                // 2.就算有，我也分析不了，成本太高，再见
                if (fullPath) {
                    childrenArr.push(fullPath);
                    allData.fullPath = fullPath;
                    // import store , {data, ggg as jjj}from 'xxxx'
                    // specifiers =  store , {data, ggg as jjj}
                    for (const item of specifiers) {
                        // import store from 'xxxx'
                        // ImportDefaultSpecifier = store
                        if (item.type === 'ImportDefaultSpecifier') {
                            allData.ImportDefaultSpecifier = item.local.name;
                        }
                        // import {data, ggg as jjj}from 'xxxx'
                        // 1. originName = data, currentName = data
                        // 2. originName = ggg, currentName = jjj
                        if (item.type === 'ImportSpecifier' &&
                            item.imported.type === 'Identifier' &&
                            item.local.type === 'Identifier') {
                            allData.ImportSpecifier.push({
                                originName: item.imported.name,
                                currentName: item.local.name,
                            });
                        }
                        // import * as r from './storel'
                        // ImportNamespaceSpecifier = * as r
                        if (item.type === 'ImportNamespaceSpecifier' &&
                            item.local.type === 'Identifier') {
                            allData.ImportNamespaceSpecifier = item.local.name;
                        }
                        // export { thing1, thing2 } from './module-a.js';
                        // export { n as n1, m as m1 } from './module-a3.js';
                        // 注意这个和import是反着的，因为ast解析就是反着的
                        if (item.type === 'ExportSpecifier' &&
                            item.local.type === 'Identifier' &&
                            item.exported.type === 'Identifier') {
                            const originName = item.local.name;
                            const currentName = item.exported.name;
                            allData.ExportSpecifier.push({
                                originName,
                                currentName,
                            });
                        }
                        //export * as fff from 'kkk';
                        if (item.type === 'ExportNamespaceSpecifier' &&
                            item.exported.type === 'Identifier') {
                            allData.ExportNamespaceSpecifier = item.exported.name;
                        }
                    }
                    allArr.push(allData);
                }
            }
            /**
             * 例如：
             * ExportAllDeclaration = export * from './module-a.js';
             */
            if (bodyItem.type === 'ExportAllDeclaration') {
                allData.ExportAllDeclaration = true;
                const { source } = bodyItem;
                const fullPath = pathReducer(source.value);
                if (fullPath) {
                    allData.fullPath = fullPath;
                    childrenArr.push(fullPath);
                    allArr.push(allData);
                }
            }
        });
        this.MAP[file] = {
            children: childrenArr,
            all: allArr,
            $cited: [],
        };
    }
    catch (e) {
        // if (
        //   file ===
        //   '/Users/a58/Desktop/work/neighbourhood/packages/activity/pages/frontPage/tracks/index.js'
        // ) {
        //   console.log(e);
        // }
        this.babelParserError.push(Object.assign(Object.assign({}, e), { path: file }));
    }
}
exports.filterPath = filterPath;
