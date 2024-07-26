import { Sequelize } from 'sequelize';
import ENV from '../config/config.default';

const { MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PWD, MYSQL_DB } = ENV;

const seq = new Sequelize(MYSQL_DB, MYSQL_USER, MYSQL_PWD, {
  host: MYSQL_HOST,
  port: +MYSQL_PORT,
  dialect: 'mysql' /* 选择 'mysql' | 'mariadb' | 'postgres' | 'mssql' 其一 */,
  dialectOptions: {
    // 字符集
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  timezone: '+08:00', // 东八时区
  define: {
    timestamps: true, // 是否自动创建时间字段， 默认会自动创建createdAt、updatedAt
    // paranoid: true, // 是否自动创建deletedAt字段
    // createdAt: "createTime", // 重命名字段
    // updatedAt: "updateTime",
    // underscored: true // 开启下划线命名方式，默认是驼峰命名
  },

});

(async () => {
  //
  try {
    await seq.authenticate();
    console.log('连接数据库成功.');
  } catch (error) {
    console.error('连接数据库失败:', error);
  }
})();

export default seq;
