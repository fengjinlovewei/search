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
exports.server = void 0;
const path_1 = __importDefault(require("path"));
const open_1 = __importDefault(require("open"));
const net_1 = __importDefault(require("net"));
const koa_1 = __importDefault(require("koa"));
const koa_body_1 = __importDefault(require("koa-body"));
const koa_router_1 = __importDefault(require("koa-router"));
const koa2_cors_1 = __importDefault(require("koa2-cors"));
const koa_views_1 = __importDefault(require("koa-views"));
const koa_static_1 = __importDefault(require("koa-static"));
const common_1 = require("./common");
//模拟异步请求
const getTime = function (time, bool) {
    return new Promise(function (resolve, reject) {
        setTimeout(() => {
            bool ? resolve(time) : reject(`${time}报错了`);
        }, time);
    });
};
const App = new koa_1.default();
const router = new koa_router_1.default();
// App.use(history());
// 处理跨域
App.use((0, koa2_cors_1.default)());
// 处理post请求
App.use((0, koa_body_1.default)());
App.use((0, koa_views_1.default)(path_1.default.resolve(__dirname, '../views'), { map: { html: 'ejs' } }));
App.use(router.routes());
App.use((0, koa_static_1.default)(path_1.default.resolve(__dirname, '../views')));
function portIsOccupied(port) {
    const server = net_1.default.createServer().listen(port);
    return new Promise((resolve, reject) => {
        server.on('listening', () => {
            server.close();
            resolve(port);
        });
        server.on('error', (err) => {
            // @ts-ignore
            if (err.code === 'EADDRINUSE') {
                resolve(portIsOccupied(port + 1)); //注意这句，如占用端口号+1
            }
            else {
                reject(err);
            }
        });
    });
}
/**
 *
 * @param this
 * @returns
 */
function server() {
    return __awaiter(this, void 0, void 0, function* () {
        /**
         *
         * @returns
         */
        const getWeight = () => {
            const pageInfo = [];
            const pageWeight = {};
            for (const item of this.outputJson.tree) {
                for (const entry of item.entry) {
                    // 入口文件不算
                    const [frist, ...other] = entry;
                    let totalWeight = 0;
                    for (let i = 0; i < other.length; i++) {
                        const c = other[i];
                        for (const { reg, weight } of this.weightFile) {
                            if (reg.test(c)) {
                                totalWeight += weight * (1 / Math.pow(2, other.length - 1 - i));
                                break;
                            }
                        }
                    }
                    if (pageWeight[frist]) {
                        pageWeight[frist] += totalWeight;
                    }
                    else {
                        pageWeight[frist] = totalWeight;
                    }
                }
            }
            // 处理传入的权重
            this.pagesFileEntry.forEach((item) => {
                const { path, weight } = item;
                const pathx = this.deletePrefix(path);
                if (!weight)
                    return;
                if (typeof weight === 'number') {
                    pageWeight[pathx] += weight;
                }
                if (typeof weight === 'string' && /%$/.test(weight)) {
                    const w = +weight.replace(/%$/, '');
                    pageWeight[pathx] = (pageWeight[pathx] * w) / 100;
                }
            });
            for (const item of this.outputJson.change) {
                for (const children of item.children) {
                    const { entry, md } = children;
                    if (!pageInfo[entry]) {
                        let weight = pageWeight[entry];
                        weight = weight === undefined ? -1 : weight;
                        pageInfo.push({ entry, weight: Math.round(weight), md });
                        pageInfo[entry] = true;
                    }
                }
            }
            return pageInfo;
        };
        // 依赖分析页面
        const home = (tab) => (ctx) => __awaiter(this, void 0, void 0, function* () {
            yield ctx.render('index', {
                data: JSON.stringify(this.outputJson),
                tab: JSON.stringify(tab),
            });
        });
        common_1.Tab.forEach((tab) => {
            const { path } = tab;
            router.get(path, home(tab));
        });
        // 打开编辑器中对应的文件
        router.get('/indexData', (ctx) => {
            ctx.body = { code: 0, data: this.outputJson };
        });
        // 打开编辑器中对应的文件
        router.get('/open', (ctx) => {
            const { path } = ctx.request.query;
            ctx.body = { code: 0 };
            this.launchEditor(`${this.root}/${path}`, 1, 1);
        });
        // 返回用户账号、密码、收件人
        router.get('/getHistory', (ctx) => {
            ctx.body = { code: 0, data: this.userData };
        });
        let ss = 0;
        router.get('/test', (ctx) => __awaiter(this, void 0, void 0, function* () {
            ss++;
            if (ss % 2 === 0) {
                setTimeout(() => {
                    ctx.body = { code: 0, data: ss };
                });
            }
            else {
                setTimeout(() => {
                    ctx.body = { code: 0, data: ss };
                }, 10000);
            }
        }));
        // 发送邮件成功后，存储账号、密码、收件人
        router.post('/setHistory', (ctx) => __awaiter(this, void 0, void 0, function* () {
            //
            this.userData = ctx.request.body;
            ctx.body = { code: 0, data: null };
        }));
        // 引用
        router.post('/import', (ctx) => __awaiter(this, void 0, void 0, function* () {
            //;
            let abort;
            const interfaceClose = new Promise((resolve, reject) => {
                abort = reject;
                // ctx.req.on('close', resolve);
                ctx.req.socket.on('close', resolve);
            });
            const { path } = ctx.request.body;
            const changeFiles = path.map((item) => {
                return {
                    changeType: '$test',
                    changePath: this.addPrefix(item.trim()),
                };
            });
            const { changePagesJson, changePagesJsonFull } = yield this.dependenceAnalysis(changeFiles);
            try {
                const Json = yield this.output({
                    changePagesJson,
                    changePagesJsonFull: changePagesJsonFull,
                    interfaceClose,
                });
                ctx.body = { code: 0, data: Json };
            }
            catch (e) {
                ctx.body = { code: 0, data: null };
            }
            abort();
        }));
        // 被引用
        router.post('/export', (ctx) => __awaiter(this, void 0, void 0, function* () {
            const { path } = ctx.request.body;
            const changeFiles = path.map((item) => this.addPrefix(item.trim()));
            const tree = changeFiles.map((item) => {
                const { treeData } = this.getScope(item);
                return {
                    path: this.deletePrefix(item),
                    type: '$test',
                    merge: [treeData],
                    entry: [],
                };
            });
            ctx.body = { code: 0, data: { tree } };
        }));
        // 返回对应邮件的模板
        router.get('/emailTemplate', (ctx) => __awaiter(this, void 0, void 0, function* () {
            const pageInfo = getWeight();
            if (typeof this.emailTemplate === 'function') {
                const data = yield this.emailTemplate({
                    pageInfo,
                });
                ctx.body = { code: 0, data };
            }
            else {
                ctx.body = { code: 1000, data: '' };
            }
        }));
        // 返回垃圾文件数据
        router.get('/garbage', (ctx) => __awaiter(this, void 0, void 0, function* () {
            // 配置文件
            this.changeFiles = this.pagesFileEntry.map((item) => ({
                changeType: '$waste',
                changePath: item.path,
            }));
            yield this.wasteDependenceAnalysis();
            yield this.getEntryScope();
            yield this.waste();
            ctx.body = { code: 0, data: this.wasteData };
        }));
        return new Promise(() => __awaiter(this, void 0, void 0, function* () {
            const port = yield portIsOccupied(this.port);
            if (port !== this.port) {
                this.spinner.start(`端口:${this.port}已被占用，新端口为:${port}，服务运行中...`);
            }
            this.port = port;
            App.listen(this.port, () => __awaiter(this, void 0, void 0, function* () {
                //
                const url = `http://localhost:${this.port}`;
                (0, open_1.default)(url);
                // "electron": "^17.1.0",
                // const Json = { url };
                // fs.writeFileSync(
                //   path.resolve(__dirname, '../data/electron.json'),
                //   JSON.stringify(Json, null, '\t')
                // );
                // try {
                //   await RunCommand(
                //     `${path.resolve(
                //       __dirname,
                //       '../node_modules/.bin/electron'
                //     )} ${path.resolve(__dirname, './electron/index.js')}`
                //   );
                // } catch (e) {
                //   console.log(e);
                // }
                //resolve(true);
            }));
        }));
    });
}
exports.server = server;
