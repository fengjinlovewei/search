import path from 'path';
import fs from 'fs';
import hash from 'object-hash';

import {
  createTracklog,
  searchTracklog,
  deleteTracklog,
} from '../service/tracklog.service';

const emptyImg = fs.readFileSync(
  path.resolve(__dirname, '../static/empty.gif')
);

const keyList = [
  'id',
  'os',
  'ua58',
  'projectName',
  'page',
  'trackName',
  'pagetype',
  'actiontype',
  'realtime',
  'paramsArray',
  'paramsJson',
];

const common = async (tracklogQuery: tracklogRequest) => {
  const {
    os,
    ua58,
    projectName = '',
    page = '',
    trackName = '',
    pagetype = '',
    actiontype = '',
    realtime = false,
    paramsArray = [],
    paramsJson = {},
  } = tracklogQuery;

  const id = hash.MD5(
    `${projectName}-${page}-${trackName}-${pagetype}-${actiontype}-${os}-${ua58}-${realtime}-${
      paramsArray.length
    }-${hash.keysMD5(paramsJson)}`
  );

  const params: tracklogSQL = {
    id,
    os,
    ua58,
    projectName,
    page,
    trackName,
    pagetype,
    actiontype,
    realtime,
    paramsArray: JSON.stringify(paramsArray),
    paramsJson: JSON.stringify(paramsJson),
  };

  console.log(params);
  try {
    await createTracklog(params);
  } catch (e) {
    console.log('添加失败', e);
  }
};

const setTracklog = async (ctx, next) => {
  try {
    var tracklogQuery: tracklogRequest = JSON.parse(ctx.request.query.data);
    console.log('setTracklog', tracklogQuery);
  } catch (e) {
    console.log('setTracklog埋点数据格式化出错', e);
    return;
  }

  ctx.body = {
    code: 0,
  };

  common(tracklogQuery);
};

const setTracklogGif = async (ctx, next) => {
  try {
    var tracklogQuery: tracklogRequest = JSON.parse(ctx.request.query.data);
    console.log('setTracklogGif', tracklogQuery);
  } catch (e) {
    console.log('setTracklogGif埋点数据格式化出错', e);
    return;
  }

  ctx.set('content-type', 'image/gif'); //设置返回类型
  ctx.body = emptyImg;

  common(tracklogQuery);
};

const getTracklog = async (ctx, next) => {
  const params = {};
  try {
    const query = ctx.request.query;

    Object.keys(query).forEach((key) => {
      if (keyList.includes(key)) {
        const value = query[key];

        if (![undefined, null, ''].includes(value)) {
          params[key] = query[key];
        }
      }
    });
  } catch (e) {
    console.log('getTracklog 埋点数据格式化出错', e);
    return;
  }

  try {
    const data = await searchTracklog(params);

    ctx.body = {
      code: 0,
      data,
    };
  } catch (e) {
    console.log('获取失败', e);
    ctx.body = {
      code: 4000,
      data: null,
      message: '获取失败',
    };
  }
};

const delTracklog = async (ctx, next) => {
  const params = {};
  try {
    const query = ctx.request.query;

    Object.keys(query).forEach((key) => {
      if (keyList.includes(key)) {
        const value = query[key];

        if (![undefined, null, ''].includes(value)) {
          params[key] = query[key];
        }
      }
    });
  } catch (e) {
    console.log('delTracklog 埋点数据格式化出错', e);
    return;
  }

  try {
    const data = await deleteTracklog(params);

    ctx.body = {
      code: 0,
      data,
    };
  } catch (e) {
    console.log('删除失败', e);
    ctx.body = {
      code: 3000,
      data: null,
      message: '删除失败',
    };
  }
};

export { setTracklog, setTracklogGif, getTracklog, delTracklog };
