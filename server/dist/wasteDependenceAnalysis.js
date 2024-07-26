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
exports.wasteDependenceAnalysis = void 0;
function wasteDependenceAnalysis() {
    return __awaiter(this, void 0, void 0, function* () {
        // 所有的入口文件
        // changeFiles = [
        //   '/Users/a58/Desktop/work/neighbourhood/packages/shared/common_init.js',
        //   '/Users/a58/Desktop/work/neighbourhood/packages/activity/pages/formPage/index.jsx',
        //   '/Users/a58/Desktop/work/neighbourhood/packages/activity/pages/frontPage/index.jsx',
        //   '/Users/a58/Desktop/work/neighbourhood/packages/core/pages/bluevPage/index.jsx',
        //   '/Users/a58/Desktop/work/neighbourhood/packages/core/pages/cardReport/index.jsx',
        //   ......
        // ];
        const tipName = '$use';
        // 被引用次数
        const cited = '$cited';
        //
        const Map = this.Map;
        for (const changePathData of this.changeFiles) {
            const { changePath } = changePathData;
            // 当前的path对象
            //debugger;
            const indexPathData = Map[changePath];
            //
            // 跳过已经过滤的
            if (indexPathData[tipName])
                continue;
            // 创建一个队列
            let searchQueue = [...indexPathData.children];
            // 检查过的做一个标记，避免出现无限循环。
            const searched = [changePath];
            // 只要队列不为空
            while (searchQueue.length) {
                // 推出数组第一个人
                const pathShift = searchQueue.shift();
                const personData = Map[pathShift];
                // 如果没找到对象， 超出检查的范围
                if (!personData) {
                    this.dataError.add(pathShift);
                    continue;
                }
                // 检查过的跳过,处于当前的栈中
                if (!searched.includes(pathShift)) {
                    // 添加标记
                    personData[tipName] = true;
                    // 如果当前不是，就把他的全部儿子，推入队列尾部
                    searchQueue = [...searchQueue, ...personData.children];
                    // 检查过的，放入容器
                    searched.push(pathShift);
                }
            }
            indexPathData[tipName] = true;
        }
        const list = {};
        const MAP_KEYS = Object.keys(Map);
        for (const key of MAP_KEYS) {
            const item = Map[key];
            // 筛选垃圾分析--需要的数据
            if (!item[tipName]) {
                list[key] = item.children;
            }
            // 引用次数分析-需要的数据
            for (const child of item.children) {
                const item_ = Map[child] || {};
                const newKey = this.deletePrefix(key);
                if (item_[cited]) {
                    item_[cited].push(newKey);
                }
                else {
                    item_[cited] = [newKey];
                }
            }
        }
        //debugger;
        // list = {
        //   '/Users/a58/Desktop/work/neighbourhood/packages/personal/pages/awardList/containers/mock.js': [],
        //   '/Users/a58/Desktop/work/neighbourhood/packages/personal/pages/bluev/containers/Header/Icon/index.jsx': [
        //     '/Users/a58/Desktop/work/neighbourhood/packages/shared/components/NavBar/Icon/index.jsx',
        //     '/Users/a58/Desktop/work/neighbourhood/packages/shared/components/Popup/index.jsx',
        //     '/Users/a58/Desktop/work/neighbourhood/packages/core/shared/utils/index.js',
        //     '/Users/a58/Desktop/work/neighbourhood/packages/shared/utils/goto.js',
        //     '/Users/a58/Desktop/work/neighbourhood/packages/personal/pages/homePage/constants/index.js',
        //     '/Users/a58/Desktop/work/neighbourhood/packages/personal/pages/homePage/services/getSharedData.js',
        //     '/Users/a58/Desktop/work/neighbourhood/packages/personal/pages/bluev/tracks/index.js',
        //     '/Users/a58/Desktop/work/neighbourhood/packages/personal/pages/bluev/containers/reload.js',
        //     '/Users/a58/Desktop/work/neighbourhood/packages/core/shared/utils/wrapLogin.js',
        //     '/Users/a58/Desktop/work/neighbourhood/packages/core/pages/topicDetail/services/getCheckUrl.js',
        //     '/Users/a58/Desktop/work/neighbourhood/packages/shared/envs/index.js',
        //   ],
        //   '/Users/a58/Desktop/work/neighbourhood/packages/personal/pages/bluev/utils/getSharedData.js': [
        //     '/Users/a58/Desktop/work/neighbourhood/packages/personal/pages/homePage/store/index.js',
        //   ],
        //   '/Users/a58/Desktop/work/neighbourhood/packages/personal/pages/bluev/utils/wrapInApp.js': [
        //     '/Users/a58/Desktop/work/neighbourhood/packages/core/shared/utils/getInApp.js',
        //     '/Users/a58/Desktop/work/neighbourhood/packages/core/shared/utils/callApp.js',
        //   ],
        // };
        this.notUseJsonFull = { Map, list };
    });
}
exports.wasteDependenceAnalysis = wasteDependenceAnalysis;
