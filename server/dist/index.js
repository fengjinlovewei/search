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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dir_parser_1 = __importDefault(require("dir-parser"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const lodash_1 = __importDefault(require("lodash"));
const getDiffChangeFiles_1 = require("./getDiffChangeFiles");
const scope_1 = require("./scope");
const filterPath_1 = require("./filterPath");
const dependenceAnalysis_1 = require("./dependenceAnalysis");
const wasteDependenceAnalysis_1 = require("./wasteDependenceAnalysis");
const waste_1 = require("./waste");
const output_1 = require("./output");
const server_1 = require("./server");
const launchEditor_1 = require("./launchEditor");
const testInfo_1 = require("./email/EmailTemplate/testInfo");
const setIworkData_1 = require("./setIworkData");
const util_1 = require("./util");
const common_1 = require("./common");
class Search {
    constructor(options) {
        this.dataError = new Set(); // 错误的引入路径信息，检查导入的路径超出检索范围;
        this.babelParserError = []; // babel 编译错误记录;
        this.dictList = common_1.typeList; // git diff 的标记映射,$开头的事自定义标记
        this.branch = ''; // 当前分支名称;
        this.branchType = ''; // 分值类型
        this.iwork = ''; // iwork 地址
        this.iworkId = ''; // iwork 地址
        this.spinner = (0, ora_1.default)();
        this.root = process.cwd(); // 项目入口
        this.commitItem = ['%H', '%T', '%P', '%cn', '%ce', '%cd', '%s'];
        this.userDataPath = path_1.default.resolve(__dirname, '../local_data/user.json');
        this.commit = {};
        this.allCommitData = [];
        this.parsed = {};
        this.changeFiles = [];
        this.changePagesJson = {};
        this.changePagesJsonFull = {};
        this.scopeData = [];
        this.entryFileCacheJson = {}; // 入口文件的 search.json 的缓存数据
        /**
         * 这一部分是动态挂载的原型方法
         */
        this.getDiffChangeFiles = getDiffChangeFiles_1.getDiffChangeFiles;
        this.filterPath = filterPath_1.filterPath;
        this.dependenceAnalysis = dependenceAnalysis_1.dependenceAnalysis;
        this.wasteDependenceAnalysis = wasteDependenceAnalysis_1.wasteDependenceAnalysis;
        this.waste = waste_1.waste;
        this.output = output_1.output;
        this.server = server_1.server;
        this.launchEditor = launchEditor_1.launchEditor;
        this.getEntryScope = scope_1.getEntryScope;
        this.getScope = scope_1.getScope;
        this.emailTemplate = testInfo_1.emailTemplate;
        this.setIworkData = setIworkData_1.setIworkData;
        /**
         * 生么样的方法挂载到原型上？
         * 函数内部依赖 this 数据的，挂载到class上
         * 不依赖的，放到 util.ts  文件中
         */
        this.getDependencies = () => {
            const { dependencies = {} } = this.packageJson;
            return Object.keys(dependencies);
        };
        this.log = (test) => {
            console.log(test);
        };
        // 补全路径的common
        this._prefix = (data, type) => {
            const dataType = (0, util_1.getType)(data);
            if (dataType === 'String') {
                if (type === 'add') {
                    return path_1.default.resolve(this.root, data);
                }
                if (type === 'delete') {
                    return data.replace(this.root + '/', '');
                }
            }
            if (dataType === 'Object') {
                const _a = data, { path } = _a, other = __rest(_a, ["path"]);
                if (typeof path === 'string') {
                    return Object.assign(Object.assign({}, other), { path: this._prefix(path, type) });
                }
            }
            if (dataType === 'Array') {
                return data.map((item) => {
                    return this._prefix(item, type);
                });
            }
            return data;
        };
        // 补全路径 字符串和数组
        this.addPrefix = (data) => {
            return this._prefix(data, 'add');
        };
        // 去掉路径前缀
        this.deletePrefix = (data) => {
            return this._prefix(data, 'delete');
        };
        // 判断是不是node_modules里的宝宝
        this.filterNodeModules = (url) => {
            // 如果第一个字符是. 说明他不能是npm包
            // 这一步就是为了减少循环而已，节省部分性能
            if (!url || url.indexOf('.') === 0)
                return url;
            for (const node_module of this.dependencies) {
                // 如果是一个npm包，就返回空，
                if (url.indexOf(node_module) === 0)
                    return null;
            }
            return url;
        };
        // 查看url前面有没有@自定义的标识符啥的
        this.filterAlias = (url) => {
            if (!url)
                return url;
            let newUrl = null;
            for (const key in this.alias) {
                if (url.indexOf(key) === 0) {
                    newUrl = url.replace(key, this.alias[key]);
                    break;
                }
            }
            return newUrl;
        };
        //判断后缀，并且补全
        this.filterSuffixAll = (url) => {
            if (!url || this.fileTypeRegExp.test(url))
                return url;
            for (const suffix of this.suffixAll) {
                const newUrl = `${url}${suffix}`;
                // 判断文件路径是否存在
                if (fs_1.default.existsSync(newUrl))
                    return newUrl;
            }
        };
        this.getMD = (file) => path_1.default.join(file, '../README.md');
        // 判断是不是、是哪个入口文件
        this.getPage = (file) => {
            const pagesFileEntryPath = this.pagesFileEntry.map((item) => item.path);
            if (pagesFileEntryPath.includes(file)) {
                // 这段代码相当于去重数据
                if (!this.entryFileCacheJson[file]) {
                    // 获取和入口文件平行的 .md 文件 的数据
                    const MDPath = this.getMD(file);
                    let md = '';
                    try {
                        md = fs_1.default.readFileSync(MDPath, 'utf-8');
                    }
                    catch (e) { }
                    const data = {
                        md,
                        entry: this.deletePrefix(file),
                    };
                    this.entryFileCacheJson[file] = data;
                    return data;
                }
                return this.entryFileCacheJson[file];
            }
            return false;
        };
        // 递归路径
        this.forFile = (children) => {
            if (Array.isArray(children)) {
                children.forEach((item) => {
                    const { children } = item;
                    // 存在 children 属性，就说明是一个文件夹
                    if (children) {
                        this.forFile(children);
                    }
                    else {
                        this.filterPath({ item });
                    }
                });
            }
        };
        // 驱动器-绞肉机
        this.drivers = (modules) => __awaiter(this, void 0, void 0, function* () {
            for (const module of modules) {
                const { message, func } = module;
                try {
                    this.spinner.start(`${message}...`);
                    yield func();
                    this.spinner.succeed(`${message}完成`);
                }
                catch (e) {
                    this.spinner.fail(`${message}失败`);
                    console.log('\n');
                    console.log(e);
                    console.log('\n');
                    process.exit();
                }
            }
            this.spinner.stop();
        });
        // 没病走两步？
        this.run = () => __awaiter(this, void 0, void 0, function* () {
            const { goon, modules } = yield inquirer_1.default.prompt([
                {
                    type: 'list',
                    message: `请务必先 commit 当前代码`,
                    name: 'goon',
                    choices: [
                        {
                            name: '还没有 commit 代码，这就去',
                            value: false,
                        },
                        {
                            name: '已经 commit 代码，继续',
                            value: true,
                        },
                    ],
                },
                {
                    when: ({ goon }) => goon,
                    type: 'list',
                    message: `选择功能`,
                    name: 'modules',
                    choices: this.mode,
                },
            ]);
            if (!goon)
                return;
            // 获取当前分支名称命令
            const command_head = 'git rev-parse --abbrev-ref HEAD';
            // 获取当前分支名称
            this.branch = (yield (0, util_1.RunCommand)(command_head)).trim();
            yield this.drivers(modules);
        });
        const { include = '', ignores = [], excludes = ['node_modules'], excPaths = [], excPatterns = [], jsonPath = '', extensions = ['js', 'jsx', 'ts', 'tsx'], alias = {}, dependencies = this.getDependencies(), pagesFileEntry = [], port = 10086, weight = [500, 1000], weightFile = [
            { reg: /\.(ts|js)$/, weight: 2 },
            { reg: /\.(jsx|tsx)$/, weight: 10 },
        ], iworkExcPaths = [], // iwork分析师要排除的路径前缀
        iworkCallback = null, gitLog = '--after="2021-01-01"', } = options;
        this.port = port; // 启动服务的端口号
        this.alias = alias; // 这个特殊，不能用this.addPrefix自动填充路径前缀，因为neighbourhood特殊
        this.weight = weight; //分析等级分级
        this.weightFile = weightFile;
        this.iworkExcPaths = this.addPrefix(iworkExcPaths);
        this.iworkCallback = iworkCallback;
        this.gitLog = gitLog;
        // 引用的第三包集合
        this.dependencies = dependencies;
        // 存放生成的记录文件路径
        this.jsonPath = jsonPath;
        // 搜索依赖的入口
        this.include = this.addPrefix(include);
        // 根据名称忽略一些文件夹或文件
        this.ignores = ignores;
        // 根据名称排除文件夹或文件
        this.excludes = excludes;
        // 根据路径排除文件夹或文件
        this.excPaths = excPaths;
        // 根据正则排除文件夹或文件
        this.excPatterns = excPatterns;
        // 支持搜索文件的后缀
        this.extensions = extensions;
        // 生成匹配支持文件后缀的正则字符串
        this.fileType = `\\\.(${this.extensions.join('|')})$`;
        // 实例化正则
        this.fileTypeRegExp = new RegExp(this.fileType);
        // 补全没有后缀的路径，在这其中进行匹配
        this.suffixAll = this.extensions
            .map((t) => [`.${t}`, `/index.${t}`])
            .flat();
        // 入口文件列表
        this.pagesFileEntry = this.addPrefix(pagesFileEntry);
        // 模块组
        this.runModules = {
            pullMater: {
                message: '拉取远程分支 master 代码',
                func: () => __awaiter(this, void 0, void 0, function* () { return yield (0, util_1.RunCommand)('git pull origin master'); }),
            },
            creatFileTree: {
                message: '生成文件树',
                func: () => __awaiter(this, void 0, void 0, function* () {
                    this.parsed = yield (0, dir_parser_1.default)(this.include, {
                        includes: [],
                        ignores: this.ignores,
                        excludes: this.excludes,
                        excPaths: this.excPaths,
                        excPatterns: this.excPatterns,
                        patterns: [this.fileType],
                        getFiles: true,
                        getChildren: true,
                        dirTree: false, // 默认为true，返回结果是否包含生成的文件树信息
                    });
                }),
            },
            formatFiles: {
                message: '筛选和补全引入文件路径',
                func: () => {
                    // 在开始挂在前，先把MAP清空下
                    this.MAP = {};
                    this.forFile(this.parsed.children);
                },
            },
            gitDiffFiles: {
                message: '获取 diff 文件',
                func: () => this.getDiffChangeFiles(),
            },
            getBaseDep: {
                message: '抽离基本依赖结构',
                func: () => __awaiter(this, void 0, void 0, function* () {
                    const { changePagesJson, changePagesJsonFull } = yield this.dependenceAnalysis(this.changeFiles);
                    this.changePagesJson = changePagesJson;
                    this.changePagesJsonFull = changePagesJsonFull;
                }),
            },
            getEntryScope: {
                message: '分析页面引用依赖总数',
                func: () => this.getEntryScope(),
            },
            getDetailsDep: {
                message: '生成详细数据',
                func: () => __awaiter(this, void 0, void 0, function* () {
                    const Json = yield this.output({
                        changePagesJson: this.changePagesJson,
                        changePagesJsonFull: this.changePagesJsonFull,
                    });
                    // 写入文件
                    if (this.jsonPath) {
                        try {
                            fs_1.default.writeFileSync(this.addPrefix(this.jsonPath), JSON.stringify(Json, null, '\t'));
                        }
                        catch (e) {
                            console.log('\n输出json失败\n');
                            console.log(e);
                        }
                    }
                    this.outputJson = Json;
                }),
            },
            startServer: {
                message: '服务运行中',
                func: () => this.server(),
            },
            setIworkData: {
                message: '入口 README.md 注入历史相关需求',
                func: () => this.setIworkData(),
            },
        };
        // 拼装模块
        this.mode = [
            {
                name: '依赖分析',
                value: [
                    this.runModules.pullMater,
                    this.runModules.creatFileTree,
                    this.runModules.formatFiles,
                    this.runModules.gitDiffFiles,
                    this.runModules.getBaseDep,
                    this.runModules.getDetailsDep,
                    this.runModules.startServer,
                ],
            },
            {
                name: '入口 README.md 注入历史相关需求',
                value: [
                    this.runModules.pullMater,
                    this.runModules.creatFileTree,
                    this.runModules.formatFiles,
                    this.runModules.getEntryScope,
                    this.runModules.setIworkData,
                ],
            },
        ];
        this.log.red = (text) => this.log(chalk_1.default.red(text));
        this.log.green = (text) => this.log(chalk_1.default.green(text));
        this.log.blue = (text) => this.log(chalk_1.default.blue(text));
        this.log.yellow = (text) => this.log(chalk_1.default.yellow(text));
        this.run();
    }
    get userData() {
        let userDataJson = {};
        try {
            const userDataJsonStr = fs_1.default.readFileSync(this.userDataPath, 'utf-8');
            userDataJson = JSON.parse(userDataJsonStr);
        }
        catch (e) {
            // 这个错误在预料之中，不需要打印
            //console.log(e);
        }
        return userDataJson;
    }
    set userData(data) {
        fs_1.default.writeFileSync(this.userDataPath, JSON.stringify(data));
    }
    get packageJson() {
        const path = this.addPrefix('./package.json');
        return require(path) || {};
    }
    get Map() {
        return lodash_1.default.cloneDeep(this.MAP);
    }
}
exports.default = Search;
