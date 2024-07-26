declare namespace C {
  export type include = string;
  export type ignores = Array<string>;
  export type excludes = Array<string>;
  export type excPaths = Array<string>;
  export type excPatterns = Array<string>;
  export type jsonPath = string;
  export type extensions = Array<string>;
  export type alias = Obj;
  export type dependencies = Array<string>;
  export type pagesFileEntry = Array<pagesFileDataType>;
  export type port = number;
  export type weight = [number, number];
  export type iworkExcPaths = string[];
  export type iworkCallback = null | ((data: EntryIworkType) => void);
  export type weightFile = weightFileType[];
  export type gitLog = string;
}

declare interface TabType {
  path: string;
  component: any;
  name: string;
  index: number;
}

declare interface Obj {
  [x: string]: any;
}

declare interface commonFn {
  (...arg: any[]): any;
}

declare interface PathObj extends Obj {
  path: string;
}

declare interface MAPDataType {
  children: string[];
  $cited: string[];
}

declare type MAPType = {
  [x: string]: MAPDataType;
};

declare type PrefixType =
  | string
  | Array<string>
  | PathObj
  | Options['pagesFileEntry'];

declare interface pagesFileDataType {
  path: string;
  weight?: number | string;
  pv?: number;
}

declare interface scopeDataType {
  path: string;
  total: number;
}

declare interface scopeEntryDataItemType {
  path: string;
  total: number;
  children: Array<scopeDataType>;
}

declare type scopeEntryDataType = scopeEntryDataItemType[];

declare interface MDParseType extends Obj {
  head: {
    title: string;
    description: string;
    rating: string;
    bundleid?: string;
  };
  default: any[];
}

declare interface weightFileType {
  reg: RegExp;
  weight: number;
}

declare interface DictList {
  M: string;
  D: string;
  A: string;
  $test: string;
  $waste: string;
}

// enum DictList {
//   // M = '修改',
//   // D = '删除',
//   // A = '新增',
//   M = 'M',
//   D = 'D',
//   A = 'A',
//   $test = '自定义测试',
//   $waste = '垃圾清理',
// }

declare type ChangeType = keyof DictList;

declare interface ChangeFileType {
  changeType: ChangeType;
  changePath: string;
}

declare interface IWorkDataType {
  hash: string;
  hashURL: string;
  user: string;
  time: string;
  branch: string;
  issuesText: string;
  closedId: string;
  closedIdURL: string;
  info: string;
  mergeRequestId: string;
  mergeRequestIdRUL: string;
  changeFiles: Array<ChangeFileType>;
  iwork: string;
  iworkURL: string;
  entryPath: string;
  error: any;
}

declare type EntryIworkType = {
  [x: string]: IWorkDataType[];
};

declare type ChangeFilesType = Array<ChangeFileType>;

declare interface SearchJsonType {
  md: string;
  entry: string;
}

declare interface entryFileCacheType {
  [x: string]: SearchJsonType;
}

declare type childrenType = Array<SearchJsonType>;

declare interface ChangePagesJsonType {
  [x: string]: {
    changeType: ChangeType;
    children: childrenType;
  };
}

declare interface ChangePagesJsonFullType {
  [x: string]: {
    children: Array<string>;
  };
}

// https://git-scm.com/book/zh/v2/Git-%E5%9F%BA%E7%A1%80-%E6%9F%A5%E7%9C%8B%E6%8F%90%E4%BA%A4%E5%8E%86%E5%8F%B2
declare type CommitItemValueType =
  | '%H' // 提交的完整哈希值
  | '%h' //提交的简写哈希值
  | '%T' //树的完整哈希值
  | '%t' //树的简写哈希值
  | '%P' // 父提交的完整哈希值
  | '%p' //父提交的简写哈希值
  | '%an' //作者名字
  | '%ae' //作者的电子邮件地址
  | '%ad' //作者修订日期（可以用 --date=选项 来定制格式）
  | '%ar' //作者修订日期，按多久以前的方式显示
  | '%cn' //提交者的名字
  | '%ce' //提交者的电子邮件地址
  | '%cd' // 提交日期
  | '%cr' //提交日期（距今多长时间）
  | '%s'; //提交说明

declare type CommitItemType = Array<CommitItemValueType>;

/**
 * util
 */

declare type entrytype = string[][];

declare interface PathMergeParamType {
  entry: entrytype;
  isPath?: boolean;
}

declare interface PathMergeItemType {
  label: string;
  name: string;
  path?: string;
  children: Array<PathMergeItemType>;
}

declare type PathMergeReturnType = PathMergeItemType['children'];

declare interface ChangeItemType {
  path: string;
  type: ChangeType;
  children: childrenType;
  error: any;
}

declare interface treeItemType {
  path: string;
  type: ChangeType;
  entry: entrytype;
  merge: PathMergeReturnType;
}

declare type treeType = treeItemType[];

declare interface CommonInOut {}

declare interface Options {
  include: C.include;
  ignores?: C.ignores;
  excludes?: C.excludes;
  excPaths?: C.excPaths;
  excPatterns?: C.excPatterns;
  jsonPath?: C.jsonPath;
  extensions?: C.extensions;
  alias?: C.alias;
  dependencies?: C.dependencies;
  pagesFileEntry?: C.pagesFileEntry;
  port?: C.port;
  weight?: C.weight;
  iworkExcPaths?: C.iworkExcPaths;
  iworkCallback?: C.iworkCallback;
  weightFile?: C.weightFile;
  gitLog?: C.gitLog;
}

declare interface NotUseJsonFullType {
  Map: MAPType;
  list: any;
}

declare interface WasteDataMapType {
  path: string;
  cited: MAPDataType['$cited'];
}

declare interface WasteDataType {
  projectName: string;
  root: string;
  port: number;
  fileType: string;
  tree: PathMergeReturnType;
  paths: string[];
  map: WasteDataMapType[];
  scopeData: scopeEntryDataType;
}

declare interface OutputJsonType {
  branch: string;
  pagesFileEntry: Options['pagesFileEntry'];
  iwork: string;
  iworkId: string;
  commit: Obj;
  port: number;
  root: string;
  fileType: string;
  timestamp: number;
  time: string;
  projectName: string;
  change: Array<ChangeItemType>;
  tree: treeType;
  dataError: Array<string>;
  babelParserError: Array<any>;
}

declare interface commitDataType {
  hash: string;
  type:
    | 'feat'
    | 'fix'
    | 'chore'
    | 'test'
    | 'refactor'
    | 'style'
    | 'cosm'
    | 'docs'
    | 'build';
  message: string;
}

declare interface userDataType {
  user?: string;
  pass?: string;
  toUserList?: Array<string>;
}

declare interface testDataType extends setEmailTemplateRequest {
  pageInfo: Array<Obj>;
}

declare interface outputOption {
  changePagesJson: ChangePagesJsonType;
  changePagesJsonFull: ChangePagesJsonFullType;
  interfaceClose?: Promise<any>;
}

/**
 * api
 */

declare interface responseCommon {
  code: number;
}

declare interface indexDataResponse extends responseCommon {
  data: OutputJsonType;
}

declare interface setEmailTemplateRequest {
  imgBase64?: string;
}
declare interface emailTemplateResponse extends responseCommon {
  data: string;
}

declare interface setHistoryRequest {
  title: string;
  user: string;
  toUserList: string[];
  group: string[];
}

declare interface getHistoryResponse extends responseCommon {
  data: setHistoryRequest;
}

declare interface setOpenRequest {
  path: string;
}

declare interface setOpenResponse extends responseCommon {}

declare interface setHistoryResponse extends responseCommon {
  data: null;
}

declare interface sendEmailResponse extends responseCommon {
  data: any;
  message: string;
  err: any;
}

declare interface setImportRequest<T = any> {
  path: string[];
  cancelToken: T;
}

declare interface setImportResponse extends responseCommon {
  data: OutputJsonType;
}

declare interface setExportRequest<T = any> {
  path: string[];
  cancelToken: T;
}

declare interface setExportResponse extends responseCommon {
  data: {
    tree: treeType;
    // pagesFileEntry: Options['pagesFileEntry'];
  };
}

declare interface setGarbageResponse extends responseCommon {
  data: WasteDataType;
}
