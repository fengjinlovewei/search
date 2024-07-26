import Koa from 'koa';
import KoaBody from 'koa-body';
import KoaCors from 'koa2-cors';
import path from 'path';
import { scheduleJob } from 'node-schedule';

import { deleteUpload } from '../util';
import { sendGroupMsgMeishi } from '../robot';
// import '../robot/wx';

import baseRouter from '../router/base.route';
import uploadRouter from '../router/upload.route';
import githookRouter from '../router/githook.route';

import { getWeekRecord } from '../schedule/getDayRecord';

const App = new Koa();

// 处理post请求
App.use(
  KoaBody({
    multipart: true,
    formidable: {
      uploadDir: path.resolve(__dirname, '../upload'),
      keepExtensions: true,
    },
  })
);
// 处理跨域
App.use(KoaCors());

App.use(baseRouter.routes());
App.use(uploadRouter.routes());
App.use(githookRouter.routes());

/*
  *    *    *    *    *    *
  ┬    ┬    ┬    ┬    ┬    ┬
  │    │    │    │    │    │
  │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
  │    │    │    │    └───── month (1 - 12)
  │    │    │    └────────── day of month (1 - 31)
  │    │    └─────────────── hour (0 - 23)
  │    └──────────────────── minute (0 - 59)
  └───────────────────────── second (0 - 59, OPTIONAL)
*/
// 每天3点时清除upload内的临时文件
scheduleJob('0 0 3 * * *', deleteUpload);

// 每周4上午8：00获取上一周数据，获取成功后发送邮件
// scheduleJob('30 * * * * *', getWeekRecord);
scheduleJob('0 0 8 * * 4', getWeekRecord);

// 周报提醒，提醒三次
// 每周四17点
scheduleJob('0 0 17 * * 4', () => {
  sendGroupMsgMeishi({ text: `@所有人 今天星期四，记得发周报。` });
});
// 每周四19点
scheduleJob('0 0 19 * * 4', () => {
  sendGroupMsgMeishi({ text: `@所有人 今天星期四，周报发了吗？` });
});
// 每周四21点
scheduleJob('0 0 21 * * 4', () => {
  sendGroupMsgMeishi({ text: `@所有人 今天星期四，周报都发了吧！` });
});

export default App;
