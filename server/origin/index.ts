import dirParser from 'dir-parser';
import type { Parsed, FileInfo, DirInfo } from 'dir-parser';
import path from 'path';
import fs from 'fs';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import _ from 'lodash';

import { getDiffChangeFiles } from './getDiffChangeFiles';
import { getEntryScope, getScope } from './scope';
import { filterPath } from './filterPath';
import { dependenceAnalysis } from './dependenceAnalysis';
import { wasteDependenceAnalysis } from './wasteDependenceAnalysis';
import { waste } from './waste';
import { output } from './output';
import { server } from './server';
import { launchEditor } from './launchEditor';
import { emailTemplate } from './email/EmailTemplate/testInfo';
import { setIworkData } from './setIworkData';
import { trackLog } from './trackLog';
import {
  getImportNamespace,
  getExportIdentifier,
  getIdentifier,
  getMemberExpression,
  getPrimitive,
} from './getPrimitive';

import { RunCommand, getType } from './util';
import { typeList } from './common';
import { parse } from '@babel/parser';
import type { ParserOptions, ParseResult } from '@babel/parser';
import type { File } from '@babel/types';

// 注意：依赖引用不是树结构，比如b和c都引用了a，并且b和c之间又相互引用，这就不是一个树
interface RunItem {
  message: string;
  func: () => any;
}

interface Color {
  (text: string): void;
  red?(text: string): void;
  green?(text: string): void;
  blue?(text: string): void;
  yellow?(text: string): void;
}

type RunList = RunItem[][];

interface RunModules {
  [x: string]: RunItem;
}

interface ModeType {
  name: string;
  value: RunItem[];
}

export default class Search {
  MAP: MAPType;
  dataError: Set<string> = new Set(); // 错误的引入路径信息，检查导入的路径超出检索范围;
  babelParserError: any = []; // babel 编译错误记录;
  dictList: DictList = typeList; // git diff 的标记映射,$开头的事自定义标记
  branch: string = ''; // 当前分支名称;
  branchType: string = ''; // 分值类型
  iwork: string = ''; // iwork 地址
  iworkId: string = ''; // iwork 地址
  spinner = ora();
  mode: Array<ModeType>;
  root: string = process.cwd(); // 项目入口
  middleserverIP: string = 'http://buluo.58v5.cn'; // 这块现在都改成域名了，需要配置开发环境的话，需要修改本地的hosts文件，做映射

  commitItem: CommitItemType = ['%H', '%T', '%P', '%cn', '%ce', '%cd', '%s'];
  userDataPath: string = path.resolve(__dirname, '../local_data/user.json');
  trackLogDocsHtmlPath = path.resolve(__dirname, '../docs');
  commit: Obj = {};
  allCommitData: Array<commitDataType> = [];
  parsed: Parsed | null = null;
  changeFiles: ChangeFilesType = [];
  changePagesJson: ChangePagesJsonType = {};
  changePagesJsonFull: ChangePagesJsonFullType = {};
  notUseJsonFull: NotUseJsonFullType;
  outputJson: OutputJsonType;
  wasteData: WasteDataType;
  scopeData: scopeEntryDataType = [];
  entryFileCacheJson: entryFileCacheType = {}; // 入口文件的 search.json 的缓存数据

  fileType: string;
  fileTypeRegExp: RegExp;
  suffixAll: Array<string>;
  runModules: RunModules;
  runList: RunList;

  port: C.port;
  weight: C.weight;
  weightFile: C.weightFile;
  alias: C.alias;
  dependencies: C.dependencies;
  jsonPath: C.jsonPath;
  include: C.include;
  ignores: C.ignores;
  excludes: C.excludes;
  excPaths: C.excPaths;
  excPatterns: C.excPatterns;
  extensions: C.extensions;
  pagesFileEntry: C.pagesFileEntry;
  iworkExcPaths: C.iworkExcPaths;
  iworkCallback: C.iworkCallback;
  gitLog: C.gitLog;
  debug: C.debug;
  globalFunction: C.globalFunction;
  astCache: Map<string, ParseResult<File>>;

  // @babel/parser 的参数配置
  babelParserConfig: ParserOptions = {
    sourceType: 'module',
    plugins: [
      'jsx',
      'typescript',
      'decorators-legacy',
      'exportDefaultFrom',
      'importAssertions',
    ],
  };

  constructor(options: Options) {
    const {
      include = '',
      ignores = [],
      excludes = ['node_modules'],
      excPaths = [],
      excPatterns = [],
      jsonPath = '',
      extensions = ['js', 'jsx', 'ts', 'tsx'],
      alias = {},
      dependencies = this.getDependencies(),
      pagesFileEntry = [],
      port = 10086,
      weight = [500, 1000],
      weightFile = [
        { reg: /\.(ts|js)$/, weight: 2 },
        { reg: /\.(jsx|tsx)$/, weight: 10 },
      ],
      iworkExcPaths = [], // iwork分析师要排除的路径前缀
      iworkCallback = null,
      gitLog = '--after="2021-01-01"',
      globalFunction = {},
      debug = false,
    }: Options = options;

    this.port = port; // 启动服务的端口号
    this.alias = alias; // 这个特殊，不能用this.addPrefix自动填充路径前缀，因为neighbourhood特殊
    this.weight = weight; //分析等级分级
    this.weightFile = weightFile;
    this.iworkExcPaths = this.addPrefix(iworkExcPaths);
    this.iworkCallback = iworkCallback;
    this.gitLog = gitLog;
    this.debug = debug;
    this.globalFunction = globalFunction;

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

    this.astCache = new Map<string, ParseResult<File>>();

    // 模块组
    this.runModules = {
      pullMater: {
        message: '拉取远程分支 master 代码',
        func: async () => await RunCommand('git pull origin master'),
      },
      creatFileTree: {
        message: '生成文件树',
        func: async () => {
          this.parsed = await dirParser(this.include, {
            includes: [],
            ignores: this.ignores,
            excludes: this.excludes,
            excPaths: this.excPaths,
            excPatterns: this.excPatterns,
            patterns: [this.fileType],
            getFiles: true, // 默认为false，返回结果是否包含一个包含所有子文件信息的数组。
            getChildren: true, // 默认为false，返回结果是否包含一个所有子文件夹和子文件信息的数组。
            dirTree: false, // 默认为true，返回结果是否包含生成的文件树信息
          });
        },
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
        func: async () => {
          const { changePagesJson, changePagesJsonFull } =
            await this.dependenceAnalysis(this.changeFiles);

          this.changePagesJson = changePagesJson;
          this.changePagesJsonFull = changePagesJsonFull;
        },
      },
      getEntryScope: {
        message: '分析页面引用依赖总数',
        func: () => this.getEntryScope(),
      },
      getDetailsDep: {
        message: '生成详细数据',
        func: async () => {
          const Json = await this.output({
            changePagesJson: this.changePagesJson,
            changePagesJsonFull: this.changePagesJsonFull,
          });
          // 写入文件
          if (this.jsonPath) {
            try {
              fs.writeFileSync(
                this.addPrefix(this.jsonPath),
                JSON.stringify(Json, null, '\t')
              );
            } catch (e) {
              console.log('\n输出json失败\n');
              console.log(e);
            }
          }
          this.outputJson = Json;
        },
      },
      startServer: {
        message: '服务运行中',
        func: () => this.server(),
      },
      setIworkData: {
        message: '注入历史相关需求',
        func: () => this.setIworkData(),
      },
      trackLog: {
        message: '生成埋点文档',
        func: () => this.trackLog(),
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
      {
        name: '生成埋点文档',
        value: [
          //this.runModules.pullMater,
          this.runModules.creatFileTree,
          this.runModules.formatFiles,
          this.runModules.trackLog,
        ],
      },
    ];

    this.log.red = (text) => this.log(chalk.red(text));
    this.log.green = (text) => this.log(chalk.green(text));
    this.log.blue = (text) => this.log(chalk.blue(text));
    this.log.yellow = (text) => this.log(chalk.yellow(text));

    this.run();
  }

  /**
   * 这一部分是动态挂载的原型方法
   */

  getDiffChangeFiles = getDiffChangeFiles;
  filterPath = filterPath;
  dependenceAnalysis = dependenceAnalysis;
  wasteDependenceAnalysis = wasteDependenceAnalysis;
  waste = waste;
  output = output;
  server = server;
  launchEditor = launchEditor;
  getEntryScope = getEntryScope;
  getScope = getScope;
  emailTemplate = emailTemplate;
  setIworkData = setIworkData;
  trackLog = trackLog;

  getImportNamespace = getImportNamespace;
  getExportIdentifier = getExportIdentifier;
  getIdentifier = getIdentifier;
  getMemberExpression = getMemberExpression;
  getPrimitive = getPrimitive;

  get userData(): userDataType {
    let userDataJson = {};
    try {
      const userDataJsonStr = fs.readFileSync(this.userDataPath, 'utf-8');
      userDataJson = JSON.parse(userDataJsonStr);
    } catch (e) {
      // 这个错误在预料之中，不需要打印
      //console.log(e);
    }

    return userDataJson;
  }

  set userData(data) {
    fs.writeFileSync(this.userDataPath, JSON.stringify(data));
  }

  get packageJson(): Obj {
    const path = this.addPrefix('./package.json');
    return require(path) || {};
  }

  get Map(): MAPType {
    return _.cloneDeep(this.MAP);
  }

  /**
   * 什么样的方法挂载到原型上？
   * 函数内部依赖 this 数据的，挂载到class上
   * 不依赖的，放到 util.ts  文件中
   */

  getDependencies = (): Options['dependencies'] => {
    const { dependencies = {} } = this.packageJson;
    return Object.keys(dependencies);
  };

  getAst = (fullPath: string): ParseResult<File> => {
    if (this.astCache.has(fullPath)) {
      return this.astCache.get(fullPath);
    }

    const ast = this.babelParse(fullPath);
    this.astCache.set(fullPath, ast);
    return ast;
  };

  log: Color = (test: string) => {
    console.log(test);
  };

  // 补全路径的common
  _prefix = <T extends PrefixType>(data: T, type: 'add' | 'delete'): T => {
    const dataType = getType(data);

    if (dataType === 'String') {
      if (type === 'add') {
        return path.resolve(this.root, data as string) as T;
      }
      if (type === 'delete') {
        return (data as string).replace(this.root + '/', '') as T;
      }
    }

    if (dataType === 'Object') {
      const { path, ...other } = data as PathObj;
      if (typeof path === 'string') {
        return {
          ...other,
          path: this._prefix(path, type),
        } as T;
      }
    }

    if (dataType === 'Array') {
      return (data as Array<string | PathObj>).map((item) => {
        return this._prefix(item, type);
      }) as T;
    }

    return data;
  };

  // 补全路径 字符串和数组
  addPrefix = <T extends PrefixType>(data: T): T => {
    return this._prefix(data, 'add');
  };

  // 去掉路径前缀
  deletePrefix = <T extends PrefixType>(data: T): T => {
    return this._prefix(data, 'delete');
  };

  // 删除文件或文件夹
  delFile = (file: string) => {
    if (fs.existsSync(file)) {
      //如果是文件夹
      if (fs.statSync(file).isDirectory()) {
        fs.readdirSync(file).forEach((item) => {
          const curPath = path.join(file, item);
          this.delFile(curPath); //递归删除
        });
        fs.rmdirSync(file); // 删除文件夹
      } else {
        fs.unlinkSync(file); //删除文件
      }
    }
  };

  // 判断是不是node_modules里的宝宝
  filterNodeModules = (url: string): string => {
    // 如果第一个字符是. 说明他不能是npm包
    // 这一步就是为了减少循环而已，节省部分性能
    if (!url || url.indexOf('.') === 0) return url;
    for (const node_module of this.dependencies) {
      // 如果是一个npm包，就返回空，
      if (url.indexOf(node_module) === 0) return null;
    }
    return url;
  };

  // 查看url前面有没有@自定义的标识符啥的
  filterAlias = (url: string): string | null => {
    if (!url) return url;
    let newUrl: string | null = null;
    for (const key in this.alias) {
      if (url.indexOf(key) === 0) {
        newUrl = url.replace(key, this.alias[key]);
        break;
      }
    }
    return newUrl;
  };

  //判断后缀，并且补全
  filterSuffixAll = (url: string): string => {
    if (!url || this.fileTypeRegExp.test(url)) return url;
    for (const suffix of this.suffixAll) {
      const newUrl = `${url}${suffix}`;
      // 判断文件路径是否存在
      if (fs.existsSync(newUrl)) return newUrl;
    }
  };

  getMD = (file: string): string => path.join(file, '../README.md');

  // 判断是不是、是哪个入口文件
  getPage = (file: string): SearchJsonType | false => {
    const pagesFileEntryPath = this.pagesFileEntry.map((item) => item.path);

    if (pagesFileEntryPath.includes(file)) {
      // 这段代码相当于去重数据
      if (this.entryFileCacheJson[file]) return this.entryFileCacheJson[file];
      // 获取和入口文件平行的 .md 文件 的数据
      const MDPath = this.getMD(file);
      let md = '';
      try {
        md = fs.readFileSync(MDPath, 'utf-8');
      } catch (e) {}
      const data = {
        md,
        entry: this.deletePrefix(file),
      };
      this.entryFileCacheJson[file] = data;
      return data;
    }
    return false;
  };

  babelParse = (fullPath: string): ParseResult<File> => {
    const code = fs.readFileSync(fullPath, 'utf-8');

    // 生成语法树
    return parse(code, this.babelParserConfig);
  };

  // 递归路径
  forFile = (children: Array<DirInfo | FileInfo>) => {
    if (Array.isArray(children)) {
      children.forEach((item) => {
        const { children } = item as DirInfo;
        // 存在 children 属性，就说明是一个文件夹
        if (children) {
          this.forFile(children);
        } else {
          // 不存在 children 属性，就说明是一个文件
          this.filterPath({ item: item as FileInfo });
        }
      });
    }
  };

  // 驱动器-绞肉机
  drivers = async (modules: RunItem[]) => {
    for (const module of modules) {
      const { message, func } = module;
      try {
        this.spinner.start(`${message}...`);
        await func();
        this.spinner.succeed(`${message}完成！`);
      } catch (e) {
        this.spinner.fail(`${message}出错！`);
        console.log('\n');
        console.log(e);
        console.log('\n');
        process.exit();
      }
    }
    this.spinner.stop();
  };

  // 没病走两步？
  run = async () => {
    console.log(process.env.NODE_ENV);

    const { goon, modules } = await inquirer.prompt([
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

    if (!goon) return;
    // 获取当前分支名称命令
    const command_head: string = 'git rev-parse --abbrev-ref HEAD';
    // 获取当前分支名称
    this.branch = (await RunCommand(command_head)).trim();

    await this.drivers(modules);
  };
}
