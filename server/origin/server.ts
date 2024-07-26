import path from 'path';
import open from 'open';
import net from 'net';

import Koa from 'koa';
import KoaBody from 'koa-body';
import KoaRouter from 'koa-router';
import KoaCors from 'koa2-cors';
import KoaViews from 'koa-views';
import KoaStatic from 'koa-static';

import Search from '.';
import { Tab } from './common';

//模拟异步请求
const getTime = function (time, bool) {
  return new Promise(function (resolve, reject) {
    setTimeout(() => {
      bool ? resolve(time) : reject(`${time}报错了`);
    }, time);
  });
};

const App = new Koa();
const router = new KoaRouter();

type ctxType<T> = Koa.ParameterizedContext<
  Koa.DefaultState,
  Koa.DefaultContext,
  T
>;

// App.use(history());

// 处理跨域
App.use(KoaCors());

// 处理post请求
App.use(KoaBody());

App.use(
  KoaViews(path.resolve(__dirname, '../views'), { map: { html: 'ejs' } })
);

App.use(router.routes());

App.use(KoaStatic(path.resolve(__dirname, '../views')));

interface pageInfoType extends SearchJsonType {
  weight: number;
}

function portIsOccupied(port: number): Promise<number> {
  const server = net.createServer().listen(port);

  return new Promise((resolve, reject) => {
    server.on('listening', () => {
      server.close();
      resolve(port);
    });

    server.on('error', (err) => {
      // @ts-ignore
      if (err.code === 'EADDRINUSE') {
        resolve(portIsOccupied(port + 1)); //注意这句，如占用端口号+1
      } else {
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

async function server(this: Search) {
  /**
   *
   * @returns
   */
  const getWeight = () => {
    const pageInfo: Array<pageInfoType> = [];
    const pageWeight: { [x: string]: number } = {};

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
        } else {
          pageWeight[frist] = totalWeight;
        }
      }
    }

    // 处理传入的权重
    this.pagesFileEntry.forEach((item) => {
      const { path, weight } = item;
      const pathx = this.deletePrefix(path);
      if (!weight) return;

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
  const home = (tab: TabType) => async (ctx) => {
    await ctx.render('index', {
      data: JSON.stringify(this.outputJson),
      tab: JSON.stringify(tab),
    });
  };

  Tab.forEach((tab) => {
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
  router.get('/test', async (ctx) => {
    ss++;
    if (ss % 2 === 0) {
      setTimeout(() => {
        ctx.body = { code: 0, data: ss };
      });
    } else {
      setTimeout(() => {
        ctx.body = { code: 0, data: ss };
      }, 10000);
    }
  });

  // 发送邮件成功后，存储账号、密码、收件人
  router.post('/setHistory', async (ctx) => {
    //
    this.userData = ctx.request.body;

    ctx.body = { code: 0, data: null };
  });

  // 引用
  router.post('/import', async (ctx: ctxType<setImportResponse>) => {
    //;
    let abort: any;
    const interfaceClose = new Promise((resolve, reject) => {
      abort = reject;
      // ctx.req.on('close', resolve);
      ctx.req.socket.on('close', resolve);
    });

    const { path } = ctx.request.body as setImportRequest;

    const changeFiles: ChangeFilesType = path.map((item) => {
      return {
        changeType: '$test',
        changePath: this.addPrefix(item.trim()),
      };
    });

    const { changePagesJson, changePagesJsonFull } =
      await this.dependenceAnalysis(changeFiles);

    try {
      const Json = await this.output({
        changePagesJson,
        changePagesJsonFull: changePagesJsonFull,
        interfaceClose,
      });
      ctx.body = { code: 0, data: Json };
    } catch (e) {
      ctx.body = { code: 0, data: null };
    }
    abort();
  });

  // 被引用
  router.post('/export', async (ctx: ctxType<setExportResponse>) => {
    const { path } = ctx.request.body as setExportRequest;

    const changeFiles = path.map((item) => this.addPrefix(item.trim()));

    const tree: treeType = changeFiles.map((item) => {
      const { treeData } = this.getScope(item);

      return {
        path: this.deletePrefix(item),
        type: '$test',
        merge: [treeData],
        entry: [],
      };
    });

    ctx.body = { code: 0, data: { tree } };
  });

  // 返回对应邮件的模板
  router.get('/emailTemplate', async (ctx: ctxType<emailTemplateResponse>) => {
    const pageInfo = getWeight();

    if (typeof this.emailTemplate === 'function') {
      const data = await this.emailTemplate({
        pageInfo,
      });

      ctx.body = { code: 0, data };
    } else {
      ctx.body = { code: 1000, data: '' };
    }
  });

  // 返回垃圾文件数据
  router.get('/garbage', async (ctx: ctxType<setGarbageResponse>) => {
    // 配置文件
    this.changeFiles = this.pagesFileEntry.map((item) => ({
      changeType: '$waste',
      changePath: item.path,
    }));

    await this.wasteDependenceAnalysis();
    await this.getEntryScope();
    await this.waste();

    ctx.body = { code: 0, data: this.wasteData };
  });

  return new Promise(async () => {
    const port = await portIsOccupied(this.port);

    if (port !== this.port) {
      this.spinner.start(
        `端口:${this.port}已被占用，新端口为:${port}，服务运行中...`
      );
    }

    this.port = port;

    App.listen(this.port, async () => {
      //
      const url = `http://localhost:${this.port}`;

      open(url);

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
    });
  });
}

export { server };
