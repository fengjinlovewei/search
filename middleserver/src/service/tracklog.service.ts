import { scheduleJob } from 'node-schedule';
import Tracklog from '../model/tracklog.model';

let newDay = true;
// 每天3点reset
scheduleJob('0 0 3 * * *', () => {
  newDay = true;
});

// 更新的间隔时间 一天
const updateTime = 1 * 60 * 1000;

const createTracklog = async (params: tracklogSQL) => {
  const { id, paramsArray, paramsJson } = params;

  const [item, created] = await Tracklog.findOrCreate({
    where: { id },
    // @ts-ignore
    defaults: params,
  });

  console.log(created ? '新的' : '老的');

  // 如果不是新创建的
  if (!created) {
    const time = Date.now() - item.getDataValue('updatedAt');
    if (time > updateTime) {
      item.set({
        paramsArray,
        paramsJson,
      });
      await item.save();
    }
  }

  return item;
};

const searchTracklog = async (params: tracklogSQL) => {
  const data = await Tracklog.findAll({
    where: {
      ...params,
    },
  });

  return data;
};

const deleteTracklog = async (params: tracklogSQL) => {
  const data = await Tracklog.destroy({
    where: {
      ...params,
    },
  });

  return data;
};

export { createTracklog, searchTracklog, deleteTracklog };
