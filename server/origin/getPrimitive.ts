import fs from 'fs';
import Search from '.';

import type {
  Expression,
  PatternLike,
  Identifier,
  SpreadElement,
  TSDeclareFunction,
  FunctionDeclaration,
  ClassDeclaration,
  Declaration,
  BlockStatement,
  ClassBody,
  VariableDeclarator,
  JSXNamespacedName,
  ArgumentPlaceholder,
  MemberExpression,
  V8IntrinsicIdentifier,
} from '@babel/types';

import { getType } from './util';

const ERROR = {
  '000': '返回的不是对象',
  '001': '返回的不是对象',
  '002': '返回的不是对象',
  '100': '返回的不是数组',
  '101': '返回的不是数组',
  '102': '返回的不是数组',
};

export interface getValueReturnType {
  v: any;
  t:
    | 'Undefined'
    | 'Number'
    | 'Boolean'
    | 'String'
    | 'Null'
    | 'Array'
    | 'Object'
    | 'ConditionalExpression'
    | 'CallExpressionFunction'
    | 'CallExpressionFunctionData'
    | 'MemberExpressionData'
    | 'global'
    | 'PrimitiveValue'
    | 'Expression';
}

interface getStrType {
  value: {
    start?: number;
    end?: number;
  };
  fullPath: string;
}

interface getIdentifierType {
  name: string;
  fullPath: string;
  originValue: Identifier;
}

interface getValueType {
  value:
    | Expression
    | PatternLike
    | SpreadElement
    | TSDeclareFunction
    | FunctionDeclaration
    | ClassDeclaration
    | BlockStatement
    | ClassBody
    | JSXNamespacedName
    | V8IntrinsicIdentifier
    | ArgumentPlaceholder
    | Declaration;
  fullPath: string;
}

interface MemberExpressionOption {
  value: MemberExpression;
  fullPath: string;
}

// 获取文件中的字符串片段
const getStr = ({
  value,
  fullPath,
}: getStrType): getValueReturnType & { t: 'Expression' } => {
  const code = fs.readFileSync(fullPath, 'utf-8');
  return {
    v: code.substring(value.start, value.end),
    t: 'Expression',
  };
};

const arrOrobj = (data) => {
  const dataType = getType(data);
  if (dataType === 'Array' || dataType === 'Object') {
    return JSON.stringify(data, null, '\t');
  }
  return data;
};

const none = Symbol();

// 当前文件的所有导出赋值到对象上
function getImportNamespace(
  this: Search,
  { fullPath }: getImportNamespaceType,
  originValue: Identifier
) {
  const { all } = this.MAP[fullPath];

  const { body } = this.getAst(fullPath).program;

  let obj = {};

  for (const exportItem of all) {
    const {
      fullPath: newFullPath,
      ExportSpecifier,
      ExportNamespaceSpecifier,
      ExportAllDeclaration,
    } = exportItem;

    // 1.
    // export { thing1, thing2 } from './module-a.js';
    // export { n as n1, m as m1 } from './module-a3.js';
    for (const ExportSpecifierItem of ExportSpecifier) {
      const { currentName, originName } = ExportSpecifierItem;
      obj[currentName] = this.getExportIdentifier(
        {
          type: 'ImportSpecifier',
          name: originName,
          fullPath: newFullPath,
        },
        originValue
      );
    }

    // 2. export * as fff from 'kkk';
    if (ExportNamespaceSpecifier) {
      obj[ExportNamespaceSpecifier] = this.getImportNamespace(
        { fullPath: newFullPath },
        originValue
      );
    }

    // 3. export * from 'kkk';
    if (ExportAllDeclaration) {
      const newObj = this.getImportNamespace(
        { fullPath: newFullPath },
        originValue
      );
      obj = { ...obj, ...newObj };
    }
  }

  // 2. 在找ast中的变量导出
  for (const bodyItem of body) {
    if (bodyItem.type === 'ExportNamedDeclaration' && !bodyItem.source) {
      //  export const a = 1,b =2,c = () => {};
      if (bodyItem.declaration.type === 'VariableDeclaration') {
        for (const varItem of bodyItem.declaration.declarations) {
          if (
            varItem.type === 'VariableDeclarator' &&
            varItem.id.type === 'Identifier'
          ) {
            const { v, t } = this.getPrimitive({
              value: varItem.init,
              fullPath,
            });
            obj[varItem.id.name] = v;
          }
        }
      } else {
        // export function lk() {};export class hh {};...
        // 这一类都是无法得到原始值的类型，直接丢getValue处理吧
        const other = bodyItem.declaration as
          | FunctionDeclaration
          | ClassDeclaration;
        try {
          if (other?.id.type === 'Identifier') {
            const { v, t } = this.getPrimitive({
              value: other?.body,
              fullPath,
            });
            obj[other.id.name] = v;
          }
        } catch (e) {
          console.log('tip2', e);
          console.error(`--错误1-1-- name ${name}`);
        }
      }

      // export { list, fuck };
      // export { list as list1, fuck as fuck1 };
      if (!bodyItem.declaration && bodyItem.specifiers.length) {
        for (const specifierItem of bodyItem.specifiers) {
          if (
            specifierItem.type === 'ExportSpecifier' &&
            specifierItem.local.type === 'Identifier' &&
            specifierItem.exported.type === 'Identifier'
          ) {
            const { v, t } = this.getPrimitive({
              value: specifierItem.local,
              fullPath,
            });
            obj[specifierItem.exported.name] = v;
          }
        }
      }
    }
  }

  return {
    v: obj,
    t: 'Object',
  };
}

// 获取导入变量对应其他文件的导出变量的原始值
function getExportIdentifier(
  this: Search,
  { type, name, fullPath }: getExportIdentifierType,
  originValue: Identifier
) {
  // if (name === 'lll') {
  //   debugger;
  // }
  const { all } = this.MAP[fullPath];

  const { body } = this.getAst(fullPath).program;

  // 一、寻找默认导出
  if (type === 'ImportDefaultSpecifier') {
    //debugger;
    // 1. import store from './store' => export default () => {};
    for (const ExportDefaultItem of body) {
      if (ExportDefaultItem.type === 'ExportDefaultDeclaration') {
        return this.getPrimitive({
          value: ExportDefaultItem.declaration,
          fullPath,
        });
      }
    }

    // 2.  export { default } from 'xxx'; 默认接口转发
    for (const exportItem of all) {
      const { fullPath: newFullPath, ExportSpecifier } = exportItem;
      for (const ExportSpecifierItem of ExportSpecifier) {
        const { currentName, originName } = ExportSpecifierItem;
        if ('default' === currentName) {
          // 1. export { default } from 'xxx'; 默认接口转发
          // 2. export { sss as default } from 'xxx'; 具名接口改为默认接口
          const type =
            'default' === originName
              ? 'ImportDefaultSpecifier'
              : 'ImportSpecifier';

          return this.getExportIdentifier(
            {
              type,
              name: originName,
              fullPath: newFullPath,
            },
            originValue
          );
        }
      }
    }

    throw new Error('没找到导出 ExportDefaultDeclaration');
  }

  // 二、寻找具名导出
  if (type === 'ImportSpecifier') {
    // 1. 先找带引用文件的ImportSpecifier变量导出
    // export eee, { thing1, thing2 } from './module-a.js';
    for (const exportItem of all) {
      const {
        fullPath: newFullPath,
        ExportSpecifier,
        ExportNamespaceSpecifier,
      } = exportItem;

      // export { thing1, thing2 } from './module-a.js';
      // export { n as n1, m as m1 } from './module-a3.js';
      for (const ExportSpecifierItem of ExportSpecifier) {
        const { currentName, originName } = ExportSpecifierItem;
        // 如果是其他文件导入的变量，继续在其他文件中寻找（递归）
        if (name === currentName) {
          const type =
            'default' === originName
              ? 'ImportDefaultSpecifier'
              : 'ImportSpecifier';

          return this.getExportIdentifier(
            {
              type,
              name: originName,
              fullPath: newFullPath,
            },
            originValue
          );
        }
      }

      // export * as fff from 'xxx';
      // 相当于 = import * as fff from 'xxx'; export { fff };
      // 直接放到 ImportNamespaceSpecifier 中去处理。
      if (name === ExportNamespaceSpecifier) {
        return this.getExportIdentifier(
          {
            type: 'ImportNamespaceSpecifier',
            name,
            fullPath: newFullPath,
          },
          originValue
        );
      }
    }

    // 2. 在找ast中的变量导出
    for (const bodyItem of body) {
      if (bodyItem.type === 'ExportNamedDeclaration' && !bodyItem.source) {
        //  export const a = 1,b =2,c = () => {};
        if (bodyItem.declaration) {
          if (bodyItem.declaration.type === 'VariableDeclaration') {
            for (const varItem of bodyItem.declaration.declarations) {
              if (
                varItem.type === 'VariableDeclarator' &&
                varItem.id.type === 'Identifier'
              ) {
                if (name === varItem.id.name) {
                  return this.getPrimitive({
                    value: varItem.init,
                    fullPath,
                  });
                }
              }
            }
          } else {
            // export function lk() {};export class hh {};...
            // 这一类都是无法得到原始值的类型，直接丢getValue处理吧
            const other = bodyItem.declaration as
              | FunctionDeclaration
              | ClassDeclaration;

            try {
              if (other?.id.type === 'Identifier' && other?.id.name === name) {
                return this.getPrimitive({
                  value: other?.body,
                  fullPath,
                });
              }
            } catch (e) {
              console.log('tip3', e);
              console.error(`--错误1-2-- name ${name}`);
            }
          }
        }

        // export { list, fuck };
        // export { list as list1, fuck as fuck1 };
        if (!bodyItem.declaration && bodyItem.specifiers.length) {
          for (const specifierItem of bodyItem.specifiers) {
            if (
              specifierItem.type === 'ExportSpecifier' &&
              specifierItem.local.type === 'Identifier' &&
              specifierItem.exported.type === 'Identifier'
            ) {
              if (name === specifierItem.exported.name) {
                return this.getPrimitive({
                  value: specifierItem.local,
                  fullPath,
                });
              }
            }
          }
        }
      }
    }
  }

  // 三、整体导入是把全部导出变量整合到了一个对象上
  // import * as r from './storel'
  if (type === 'ImportNamespaceSpecifier') {
    return this.getImportNamespace({ fullPath }, originValue);
  }

  // 四、如果以上都没有找到变量，可以在 export * from 'kkk' 查询
  // 如果以上都没有找到变量，那么会执行到此
  for (const exportItem of all) {
    const { fullPath: newFullPath, ExportAllDeclaration } = exportItem;
    //  export * from 'kkk'
    if (ExportAllDeclaration) {
      const newValue = this.getExportIdentifier(
        {
          type,
          name,
          fullPath: newFullPath,
        },
        originValue
      );
      // 如果不是none，说明找到了真实的值
      if (newValue !== none) return newValue;
    }
  }

  return none;
}

// 追溯变量的原始值
function getIdentifier(
  this: Search,
  { name, fullPath, originValue }: getIdentifierType
) {
  //debugger;

  //   if (name === 'TABS') {
  //     debugger;
  //   }

  // 这里是当前文件的所有的 import 导入的变量，因为之前分析过了，就直接拿来用了
  // 之所以用这个是因为在之前的处理中，引入路径被补全了
  // console.log(fullPath);
  const { all } = this.MAP[fullPath];

  for (const importItem of all) {
    const {
      fullPath,
      ImportDefaultSpecifier,
      ImportSpecifier,
      ImportNamespaceSpecifier,
    } = importItem;

    // import store from './store'
    if (name === ImportDefaultSpecifier) {
      return this.getExportIdentifier(
        {
          type: 'ImportDefaultSpecifier',
          name: ImportDefaultSpecifier,
          fullPath,
        },
        originValue
      );
    }

    //import {data, eee as jjj}from './store'
    for (const ImportSpecifierItem of ImportSpecifier) {
      const { currentName, originName } = ImportSpecifierItem;
      if (name === currentName) {
        return this.getExportIdentifier(
          {
            type: 'ImportSpecifier',
            name: originName,
            fullPath,
          },
          originValue
        );
      }
    }

    //import * as r from './storel'
    if (name === ImportNamespaceSpecifier) {
      return this.getExportIdentifier(
        {
          type: 'ImportNamespaceSpecifier',
          name: ImportNamespaceSpecifier,
          fullPath,
        },
        originValue
      );
    }
  }

  const ast = this.getAst(fullPath);

  // 第二步收集对比页面表达式中的变量声明
  for (const bodyItem of ast.program.body) {
    let content: VariableDeclarator[] = [];

    // 这个是普通变量const a = 1
    if (bodyItem.type === 'VariableDeclaration') {
      content = bodyItem.declarations;
    }

    // 这一部分是export的本地变量，export const a = 1;
    if (
      bodyItem.type === 'ExportNamedDeclaration' &&
      bodyItem?.declaration?.type === 'VariableDeclaration'
    ) {
      content = bodyItem.declaration.declarations;
    }

    // 他是一个数组，因为有var ap = 1,f =8;这种情况
    for (const varItem of content) {
      //1. 常规变量：这样的 var ap = 1;
      if (varItem.id.type === 'Identifier') {
        // 命中条件
        if (name === varItem.id.name) {
          return this.getPrimitive({ value: varItem.init, fullPath });
        }
      }

      //2. 对象解构变量：这样的 var {r1, r2: tt5 , r3 = 55, r4:jj = 6, ...g} = uuu;
      if (varItem.id.type === 'ObjectPattern') {
        // 收集剩余运算符之外的所有变量，比如：r1,r2，下面要用
        const idList: string[] = [];
        //
        for (const idItem of varItem.id.properties) {
          // 1.
          // r1,r2,r3,r4 = ObjectProperty
          if (idItem.type === 'ObjectProperty') {
            // idItem.key = r2
            // idItem.value = tt5
            if (idItem.key.type === 'Identifier') {
              // 收集变量
              idList.push(idItem.key.name);

              //r1, r2: tt5
              if (idItem.value.type === 'Identifier') {
                // 命中条件
                if (name === idItem.value.name) {
                  const { v, t } = this.getPrimitive({
                    value: varItem.init,
                    fullPath,
                  });
                  if (t === 'Object') {
                    // 这个值就是变量在 uuu 上引用的key，所以需要拿到 uuu 的具体值
                    const keyName = idItem.key.name;
                    return v[keyName];
                  } else {
                    console.error();
                    return {
                      v: `${name}`,
                      t: '000',
                    };
                  }
                }
              }

              // r3 = 55, r4:jj = 6
              if (idItem.value.type === 'AssignmentPattern') {
                if (idItem.value.left.type === 'Identifier') {
                  // 命中条件
                  if (name === idItem.value.left.name) {
                    const { v, t } = this.getPrimitive({
                      value: varItem.init,
                      fullPath,
                    });
                    if (t === 'Object') {
                      // 这个值就是变量在 uuu 上引用的key，所以需要拿到 uuu 的具体值
                      const keyName = idItem.key.name;

                      return v[keyName] !== undefined
                        ? v[keyName]
                        : this.getPrimitive({
                            value: idItem.value.right,
                            fullPath,
                          }).v;
                    } else {
                      // throw new Error('返回的不是对象');
                      return {
                        v: `${name}`,
                        t: '001',
                      };
                    }
                  }
                }
              }
            }
          }

          //2.
          // ...g = RestElement,g变量本质上还是对象
          // 并且这玩意必须要在解构的最后，Rest element must be last element
          // 由于这一特性
          if (idItem.type === 'RestElement') {
            if (idItem.argument.type === 'Identifier') {
              // 命中条件
              if (name === idItem.argument.name) {
                const { v, t } = this.getPrimitive({
                  value: varItem.init,
                  fullPath,
                });
                if (t === 'Object') {
                  // 删除掉已经解构出去的变量名
                  idList.forEach((item) => {
                    delete v[item];
                  });
                  return { v, t };
                } else {
                  // throw new Error('返回的不是对象');
                  return {
                    v: `${name}`,
                    t: '002',
                  };
                }
              }
            }
          }
        }
      }

      //3. 数组解构变量：这样的 var [t1,t2,t3 = 1,...s]= uuus;
      if (varItem.id.type === 'ArrayPattern') {
        // idList收集剩余运算符之外的所有变量，比如：t1,t2，下面要用
        const idList: string[] = [];

        for (let i = 0; i < varItem.id.elements.length; i++) {
          const idItem = varItem.id.elements[i];
          //1. t1,t2
          if (idItem.type === 'Identifier') {
            idList.push(idItem.name);
            // 命中,直接返回对应的数组的值
            if (name === idItem.name) {
              const { v, t } = this.getPrimitive({
                value: varItem.init,
                fullPath,
              });
              if (t === 'Array') {
                return v[i];
              } else {
                // throw new Error('返回的不是数组');
                return {
                  v: `${name}`,
                  t: '100',
                };
              }
            }
          }

          //2. t3 = 1
          if (idItem.type === 'AssignmentPattern') {
            // t3 = left , 1 = right
            if (idItem.left.type === 'Identifier') {
              idList.push(idItem.left.name);
              // 命中
              if (name === idItem.left.name) {
                const { v, t } = this.getPrimitive({
                  value: varItem.init,
                  fullPath,
                });

                if (t === 'Array') {
                  // 如果原数组中有对应的值就返回值，没有就返回默认值，例子中就是1
                  return v[i] !== undefined
                    ? v[i]
                    : this.getPrimitive({ value: idItem.right, fullPath }).v;
                } else {
                  // throw new Error('返回的不是数组');
                  return {
                    v: `${name}`,
                    t: '101',
                  };
                }
              }
            }
          }

          //3. t3 = 1
          if (idItem.type === 'RestElement') {
            if (idItem.argument.type === 'Identifier') {
              // 命中条件
              if (name === idItem.argument.name) {
                const { v, t } = this.getPrimitive({
                  value: varItem.init,
                  fullPath,
                });
                if (t === 'Array') {
                  // 如果原数组中有对应的值就返回值，没有就返回默认值，例子中就是1
                  return v.slice(idList.length);
                } else {
                  // throw new Error('返回的不是数组');
                  return {
                    v: `${name}`,
                    t: '102',
                  };
                }
              }
            }
          }
        }
      }
    }
  }

  return none;
}

// 扩展运算符恢复溯源函数
// 扩展运算中，数组可以在数组中展开，也可以在对象中展开，如:{...[1,2]} = {0:1, 1:2}
// 对象可以在对象中展开，但对象不能再数组中展开，因为没有迭代器
/**
 *
 * @param value
 * @param fileCode
 * @returns
 */

function getMemberExpression(
  this: Search,
  { value, fullPath }: MemberExpressionOption
): getValueReturnType {
  let name: string | number = '';

  // a[b]
  if (value.property.type === 'Identifier' && value.computed) {
    name = this.getIdentifier({
      name: value.property.name,
      fullPath,
      originValue: value.property,
    });
  }

  // a.b
  if (value.property.type === 'Identifier') {
    name = value.property.name;
  }

  // a['b']
  if (value.property.type === 'StringLiteral') {
    name = value.property.value;
  }

  // a[0]
  if (value.property.type === 'NumericLiteral') {
    name = value.property.value;
  }

  // if (name === 'tabName') {
  //   debugger;
  // }

  let data: getValueReturnType;

  if (value.object.type === 'MemberExpression') {
    // 递归调用 a['a'][0] 从右向左分析
    data = this.getMemberExpression({
      value: value.object,
      fullPath,
    });
  } else {
    // 其他类型，比如{a:1,b:2}[a], [1,2,3][0] 这种字面量数据
    data = this.getPrimitive({
      value: value.object,
      fullPath,
    });
  }

  if (data.t === 'Expression') {
    return {
      v: `${data.t}.${name}`,
      t: 'Expression',
    };
  }
  // 这个值是原始值，不是ast对象，所以类型需要特备备注
  try {
    return {
      v: data.v[name],
      t: 'PrimitiveValue',
    };
  } catch (e) {
    this.log.red(e);
    this.log.red(fullPath);
    this.log.red(name + '');
    return {
      v: null,
      t: 'PrimitiveValue',
    };
  }
}

// 数据恢复溯源函数
/**
 *
 * @param value
 * @param fullPath
 * @returns
 */
function getPrimitive(
  this: Search,
  { value, fullPath }: getValueType
): getValueReturnType {
  // undefined 的字面量
  if (value.type === 'Identifier' && value.name === 'undefined') {
    return {
      v: undefined,
      t: 'Undefined',
    };
  }

  // NaN 的字面量
  if (value.type === 'Identifier' && value.name === 'NaN') {
    return {
      v: NaN,
      t: 'Number',
    };
  }

  // 数字
  if (value.type === 'NumericLiteral') {
    return {
      v: value.value,
      t: 'Number',
    };
  }

  // 布尔值的字面量
  if (value.type === 'BooleanLiteral') {
    return {
      v: value.value,
      t: 'Boolean',
    };
  }

  // 字符串
  if (value.type === 'StringLiteral')
    return {
      v: `'${value.value}'`,
      t: 'String',
    };

  // null的字面量
  if (value.type === 'NullLiteral')
    return {
      v: null,
      t: 'Null',
    };

  // 如果是变量
  if (value.type === 'Identifier') {
    // 这个主要是处理内置对象，比如：Math、Date、Object
    if (global[value.name]) {
      return {
        v: global[value.name],
        t: 'global',
      };
    }

    if (typeof this.globalFunction[value.name] === 'function') {
      return {
        v: this.globalFunction[value.name],
        t: 'global',
      };
    }
    return this.getIdentifier({
      name: value.name,
      fullPath,
      originValue: value,
    });
  }

  // 如果是扩展运算符
  // 只有数组（包括赋值数组），对象（包括赋值对象）出现
  if (value.type === 'SpreadElement') {
    return this.getPrimitive({ value: value.argument, fullPath });
  }

  if (value.type === 'CallExpression') {
    // 所有参数都是基础数据类型
    let allBaseData = true;

    if (
      value.callee.type === 'Identifier' &&
      value.callee.name === 'formatTrackMaps'
    ) {
      debugger;
    }

    const argList = value.arguments.map((item) => {
      const { v, t } = this.getPrimitive({ value: item, fullPath });
      if (t === 'Expression' || t === 'ConditionalExpression') {
        allBaseData = false;
      }
      return v;
    });

    // fn(), fn = Identifier

    const { v, t } = this.getPrimitive({ value: value.callee, fullPath });

    let name = v;

    try {
      if (typeof v === 'function' && allBaseData) {
        // console.log(argList);
        const newVal = v(...argList);
        return {
          v: newVal,
          t: 'CallExpressionFunctionData',
        };
      }
    } catch (e) {
      this.log.yellow('tip-1');
      this.log.yellow(e);

      this.log.yellow(v.name);
      this.log.yellow(JSON.stringify(argList));
      this.log.yellow(fullPath);
      name = v.name;
    }

    return {
      v: `${name}(${argList.map((item) => JSON.stringify(item)).join(',')})`,
      t: 'CallExpressionFunction',
    };
  }

  if (value.type === 'MemberExpression') {
    //debugger;
    return this.getMemberExpression({ value, fullPath });
  }

  // 数组
  if (value.type === 'ArrayExpression') {
    const arr = [];
    for (const item of value.elements) {
      const { v, t } = this.getPrimitive({ value: item, fullPath });
      const vType = getType(v);

      const isArray = t !== 'ConditionalExpression' && vType === 'Array';
      const isString = t === 'String';

      // 数组中能展开数组/字符串，变量按常规处理
      // ...[x,x,x], ...'xxx'
      if (item.type === 'SpreadElement') {
        if (isArray || isString) {
          arr.push(...v);
        } else {
          arr.push(`...${typeof v === 'string' ? v : JSON.stringify(v)}`);
        }
      } else {
        arr.push(v);
      }
    }

    return {
      v: arr,
      t: 'Array',
    };
  }

  // 对象
  if (value.type === 'ObjectExpression') {
    let obj = {};
    for (const item of value.properties) {
      // 常规的键值对，常规处理
      if (item.type === 'ObjectProperty') {
        if (item.key.type === 'Identifier') {
          const { v, t } = this.getPrimitive({ value: item.value, fullPath });
          const comment = item.leadingComments?.map((item) => {
            const { type, value } = item;
            // 块级注释，去掉特殊字符
            if (type === 'CommentBlock') {
              // 这块的逻辑先不用特殊处理了，以后有需要再说
              return value;
            }

            return value;
          });

          obj[item.key.name] = v;

          if (comment) {
            const key = `__comment__${item.key.name}`;
            //obj[Symbol(key)] = comment;
            obj[key] = comment;
          }
        }
      }

      // 对象中能展开数组，字符串，对象
      // ...[x,x,x], ...'xxx'，...{a:1}
      if (item.type === 'SpreadElement') {
        const { v, t } = this.getPrimitive({ value: item, fullPath });
        const vType = getType(v);
        // 数组、字符串、对象直接处理就好了

        // 数组：不能直接判断数据类型，因为三目运算符会返回数组
        const isArray = t !== 'ConditionalExpression' && vType === 'Array';
        const isObject = vType === 'Object';
        const isString = t === 'String';

        if (isArray || isObject || isString) {
          obj = { ...obj, ...v };
        } else {
          obj[`...${typeof v === 'string' ? v : JSON.stringify(v)}`] = `...`;
        }

        //   if (t === 'Expression') {
        //     obj[`...${v}`] = `...`;
        //   }
      }

      // 如果是函数，那么就直接赋值函数体字符串吧，没招
      if (item.type === 'ObjectMethod') {
        if (item.key.type === 'Identifier') {
          const { v, t } = getStr({ value: item, fullPath });
          obj[item.key.name] = v;
        }
      }
    }

    return {
      v: obj,
      t: 'Object',
    };
  }

  // 三元运算符
  if (value.type === 'ConditionalExpression') {
    const { v: test } = this.getPrimitive({ value: value.test, fullPath });
    const { v: consequent } = this.getPrimitive({
      value: value.consequent,
      fullPath,
    });
    const { v: alternate } = this.getPrimitive({
      value: value.alternate,
      fullPath,
    });
    const data = [
      `@@ConditionalExpression[${arrOrobj(test)}]`,
      consequent,
      alternate,
    ];
    return {
      v: data,
      t: 'ConditionalExpression',
    };
  }

  // 都没找到返回原始表达式
  return getStr({ value, fullPath });
}

export {
  getImportNamespace,
  getExportIdentifier,
  getIdentifier,
  getMemberExpression,
  getPrimitive,
};
