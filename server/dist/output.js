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
Object.defineProperty(exports, "__esModule", { value: true });
exports.output = void 0;
/**
 * 生成文件
 */
const util_1 = require("./util");
const worker_1 = require("./worker");
function output(option) {
    return __awaiter(this, void 0, void 0, function* () {
        const { changePagesJson, changePagesJsonFull, interfaceClose } = option;
        const initNewAll = {};
        for (const key in changePagesJsonFull) {
            initNewAll[key] = changePagesJsonFull[key].children;
        }
        const date = new Date();
        const Json = {
            projectName: this.packageJson.name,
            branch: this.branch,
            iwork: this.iwork,
            iworkId: this.iworkId,
            commit: this.commit,
            timestamp: date.valueOf(),
            time: (0, util_1.DateFormat)({ date }),
            root: this.root,
            fileType: this.fileType,
            port: this.port,
            change: [],
            tree: [],
            dataError: this.deletePrefix([...this.dataError]),
            babelParserError: this.babelParserError.map((t) => (Object.assign(Object.assign({}, t), { path: this.deletePrefix(t.path) }))),
        };
        for (const path in changePagesJson) {
            const { changeType, children } = changePagesJson[path];
            const error = path.indexOf(this.include) === 0
                ? null
                : '超出 include 覆盖范围，不考虑影响';
            Json.change.push({
                path: this.deletePrefix(path),
                type: changeType,
                children,
                error,
            });
            if (error)
                continue;
            // 使用worker多线程运算
            const { promise, worker } = (0, worker_1.Defragmentierung)({
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
                    .catch(() => { });
            }
            const entry = yield promise;
            const merge = (0, util_1.PathMerge)({ entry });
            Json.tree.push({
                path: this.deletePrefix(path),
                type: changeType,
                entry,
                merge,
            });
        }
        return Json;
    });
}
exports.output = output;
