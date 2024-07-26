import { DataTypes } from 'sequelize';

import seq from '../db/seq';

const Base = seq.define(
  'buluo_search_base',
  {
    // 在这里定义模型属性
    project_name: {
      type: DataTypes.STRING,
      allowNull: false, // 不能为空
      comment: '项目名',
    },
    branch: {
      type: DataTypes.STRING,
      allowNull: false, // 不能为空
      comment: '分支名称',
    },
    oa: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'oa账号',
    },
    change_file: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '变动的文件',
    },
  },
  {
    // 这是其他模型参数
    // 不要忘记启用时间戳！
    timestamps: true,

    // 不想要 createdAts
    createdAt: true,

    // 想要 updatedAt 但是希望名称叫做 updateTimestamp
    updatedAt: false,
  }
);
Base.sync();
//Base.sync({ force: true });

export default Base;
