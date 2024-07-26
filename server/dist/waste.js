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
exports.waste = void 0;
/**
 *
 *
 *
 */
const path_1 = __importDefault(require("path"));
const lodash_1 = __importDefault(require("lodash"));
const util_1 = require("./util");
function waste() {
    return __awaiter(this, void 0, void 0, function* () {
        const { Map, list } = this.notUseJsonFull;
        let paths = this.deletePrefix(Object.keys(list));
        const map = [];
        for (const key in Map) {
            let { $cited = [] } = Map[key];
            map.push({
                path: this.deletePrefix(key),
                cited: $cited,
            });
        }
        map.sort((a, b) => b.cited.length - a.cited.length);
        if (!paths.length)
            return Promise.reject('没有检测出无用文件！');
        // 分割路径，并且去掉数组开头的空字符串数据
        const entry = paths.map((item) => item.split(path_1.default.sep).filter(Boolean));
        const tree = (0, util_1.PathMerge)({ entry, isPath: true });
        const scopeData = lodash_1.default.cloneDeep(this.scopeData);
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
    });
}
exports.waste = waste;
