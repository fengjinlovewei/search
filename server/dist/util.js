"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixedCharAt = exports.ProgressBar = exports.mdParse = exports.currying = exports.getType = exports.DateFormat = exports.PathMerge = exports.RunCommand = void 0;
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
// https://marked.js.org/using_pro#renderer
const marked_1 = require("marked");
const chalk_1 = __importDefault(require("chalk"));
// 多线程通用函数
const RunCommand = (command) => {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, { maxBuffer: 1024 * 1024 * 3 }, (err, stdout, stderr) => {
            if (err) {
                reject({ err, stderr });
            }
            else {
                resolve(stdout);
            }
        });
    });
};
exports.RunCommand = RunCommand;
// 把相同路径的项合并
const PathMerge = ({ entry = [], isPath = false, }) => {
    // entry = [
    //   [
    //     '/packages/task/pages/taskTieDetail/index.jsx',
    //     '/packages/task/pages/taskTieDetail/containers/App/index.jsx',
    //     '/packages/task/pages/taskTieDetail/containers/TabView/tabview.jsx',
    //     '/packages/task/pages/taskTieDetail/components/MyList/index.jsx',
    //     '/packages/shared/components/CardItem/index.jsx',
    //     '/packages/shared/utils/setNativeDetailsData.js',
    //   ],
    // ];
    const tree = [];
    for (const pathArr of entry) {
        let current = tree;
        let _path = '';
        const newPathArr = [...pathArr];
        while (newPathArr.length) {
            const name = newPathArr.shift();
            let curItem = null;
            _path += `${path_1.default.sep}${name}`;
            for (const item of current) {
                const { label } = item;
                // 检索到了
                if (label === name) {
                    curItem = item;
                }
            }
            if (curItem === null) {
                curItem = {
                    label: name,
                    children: [],
                };
                // 只有指定需要添加路径字段，才会添加
                if (isPath) {
                    curItem.path = _path;
                }
                current.push(curItem);
            }
            current = curItem.children;
        }
    }
    return tree;
};
exports.PathMerge = PathMerge;
// 时间序列化
function DateFormat({ format = `y年m月d日 H:M:S`, date = new Date() } = {}) {
    const formatNumber = (n) => (n >= 10 ? n : '0' + n);
    return format
        .replace('y', date.getFullYear().toString())
        .replace('m', formatNumber((date.getMonth() + 1).toString()))
        .replace('d', formatNumber(date.getDate().toString()))
        .replace('H', formatNumber(date.getHours().toString()))
        .replace('M', formatNumber(date.getMinutes().toString()))
        .replace('S', formatNumber(date.getSeconds().toString()));
}
exports.DateFormat = DateFormat;
// 获取数据类型
function getType(o) {
    return Object.prototype.toString.call(o).slice(8, -1);
}
exports.getType = getType;
function currying(fn, ...arr) {
    let len = fn.length;
    return function (...arg) {
        arr = [...arr, ...arg];
        if (arr.length < len) {
            return currying(fn, ...arr);
        }
        return fn.call(this, ...arr);
    };
}
exports.currying = currying;
/**
0: {type: 'hr', raw: '---\n'}
1: {type: 'paragraph', raw: 'title: 关注页面\nbundleid: 1514\ndescription: 原一级页的关注tab分离出来的,关注的人的动态相关。有无登陆均可访问，\nrating: ***\n', text: 'title: 关注页面\nbundleid: 1514\ndescription: 原一级页的关注tab分离出来的,关注的人的动态相关。有无登陆均可访问，\nrating: ***', tokens: Array(1)}
2: {type: 'hr', raw: '---\n\n'}
3: {type: 'heading', raw: '## 业务对接人\n\n', depth: 2, text: '业务对接人', tokens: Array(1)}
4: {type: 'table', header: Array(2), align: Array(2), rows: Array(3), raw: '| 角色 | 接口人              |\n| ---- | ---------------…xiudou liuhe05 |\n| QA   | zhangjiaxi02        |\n\n'}
5: {type: 'heading', raw: '## 重要网站\n\n', depth: 2, text: '重要网站', tokens: Array(1)}
6: {type: 'paragraph', raw: '设计图：https://hotwheel.58.com/project/0e4b4905-6437-…4q3c\n初始需求：https://ee.58corp.com/w/issue/WXNR-1751', text: '设计图：https://hotwheel.58.com/project/0e4b4905-6437-…4q3c\n初始需求：https://ee.58corp.com/w/issue/WXNR-1751', tokens: Array(6)}
7: {type: 'space', raw: '\n\n'}
8: {type: 'heading', raw: '## 重要入口\n\n', depth: 2, text: '重要入口', tokens: Array(1)}
9: {type: 'paragraph', raw: '一级页关注金刚位\n我的 => 关注', text: '一级页关注金刚位\n我的 => 关注', tokens: Array(1)}
10: {type: 'space', raw: '\n\n'}
11: {type: 'heading', raw: '## 注意事项\n\n', depth: 2, text: '注意事项', tokens: Array(1)}
12: {type: 'paragraph', raw: '无\n', text: '无', tokens: Array(1)}
links: {}
 */
function strToObj(str) {
    const obj = {};
    const arr = str.split('\n').filter(Boolean);
    arr.forEach((item) => {
        if (item.includes(':')) {
            const [key, value] = item.split(':');
            obj[key.trim()] = value.trim();
        }
    });
    return obj;
}
function mdParse(md) {
    var _a, _b, _c;
    // 过滤掉空白item
    const list = marked_1.marked.lexer(md).filter((item) => item.type !== 'space');
    const json = {
        head: {},
        default: [],
    };
    // 先把头部的键值对处理掉
    if (((_a = list[0]) === null || _a === void 0 ? void 0 : _a.type) === 'hr' &&
        ['heading', 'paragraph'].includes((_b = list[1]) === null || _b === void 0 ? void 0 : _b.type)) {
        json.head = strToObj(((_c = list[1]) === null || _c === void 0 ? void 0 : _c.text) || '');
        // 再删了这2个狗日的
        list.splice(0, 2);
    }
    //
    let key = 'default';
    while (list.length) {
        const one = list.shift();
        if (one.type === 'heading') {
            key = one.text;
            json[key] = [];
        }
        else {
            json[key].push(one);
        }
    }
    return json;
}
exports.mdParse = mdParse;
class ProgressBar {
    // 两个基本参数(属性)
    constructor(description, length, context) {
        this.description = 'Progress'; // 命令行开头的文字信息
        this.length = 25; // 进度条的长度(单位：字符)，默认设为 25
        this.description = description;
        this.length = length;
        this.context = context;
    }
    // 刷新进度条图案、文字的方法
    render(opts) {
        const { completed, total } = opts;
        const percent = completed / total; // 计算进度(子任务的 完成数 除以 总数)
        const cellNum = Math.floor(percent * this.length); // 计算需要多少个 █ 符号来拼凑图案
        // 拼接黑色条,拼接灰色条
        const bar = ''.padEnd(cellNum, '█').padEnd(this.length, '░');
        // 拼接最终文本
        const cmdText = chalk_1.default.yellow(`${this.description}: ${completed}/${total} ${bar} ${Math.ceil(100 * percent)}%`);
        if (percent === 1) {
            this.context.spinner.succeed(cmdText);
        }
        else {
            this.context.spinner.start(cmdText + '\n');
        }
    }
}
exports.ProgressBar = ProgressBar;
function fixedCharAt(str, idx) {
    var ret = '';
    str += '';
    var end = str.length;
    var surrogatePairs = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
    while (surrogatePairs.exec(str) != null) {
        var li = surrogatePairs.lastIndex;
        if (li - 2 < idx) {
            idx++;
        }
        else {
            break;
        }
    }
    if (idx >= end || idx < 0) {
        return '';
    }
    ret += str.charAt(idx);
    if (/[\uD800-\uDBFF]/.test(ret) &&
        /[\uDC00-\uDFFF]/.test(str.charAt(idx + 1))) {
        // Go one further, since one of the "characters" is part of a surrogate pair
        ret += str.charAt(idx + 1);
    }
    return ret;
}
exports.fixedCharAt = fixedCharAt;
