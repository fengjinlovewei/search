"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const { replace } = worker_threads_1.workerData, other = __rest(worker_threads_1.workerData, ["replace"]);
const data = [];
const deletePrefix = (p) => p.map((item) => item.replace(replace, ''));
// 所有文件的导入文件集合，如果不在这个集合中，则说明是最外层电子
// 递归抽离文件之间的详细引用
const Defragmentierung = ({ origin, target, newAll = {}, entry = data, newEntry = [], }) => {
    // 平铺当前收集的所有数据的子元素
    // 如果目标不在集合中，说明结束或者超出范围，终止！
    // 还可以防止循环引用不输出数据的bug
    const childFull = Object.values(newAll).flat();
    // 检验是最外层，终止递归
    if (!childFull.includes(target)) {
        // 目的，最外层文件放在第一位置
        newEntry.reverse();
        // 吧变动的文件origin加上
        newEntry.push(origin);
        // 去掉路径的前缀（/Users/a58/Desktop/work/neighbourhood/packages）
        entry.push(deletePrefix(newEntry));
        return;
    }
    for (const path in newAll) {
        const children = newAll[path];
        if (children.includes(target)) {
            Defragmentierung({
                origin,
                target: path,
                // 如果当前path下包含目标target，那么在下次递归时，剔除这个数组
                newAll: Object.assign(Object.assign({}, newAll), { [path]: [] }),
                entry,
                newEntry: [...newEntry, path],
            });
        }
    }
};
Defragmentierung(other);
worker_threads_1.parentPort.postMessage({ data });
//parentPort.close();
