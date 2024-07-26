import { DataTypes } from 'sequelize';

import seq from '../db/seq';

const Tracklog = seq.define('buluo_search_tracklog', {
  // 在这里定义模型属性
  id: {
    type: DataTypes.STRING,
    allowNull: false, // 不能为空
    autoIncrement: false, // 自动增量
    primaryKey: true,
  },

  projectName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '项目名称',
  },
  page: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '页面标记',
  },
  os: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '设备系统',
  },
  ua58: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '58客户端',
  },
  trackName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '埋点的名字',
  },
  pagetype: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'pagetype',
  },
  actiontype: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'actiontype',
  },
  realtime: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    comment: '是否实时上报',
  },
  paramsArray: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'paramsArray',
  },
  paramsJson: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'paramsJson',
  },
});

Tracklog.sync({ force: false });

export default Tracklog;
