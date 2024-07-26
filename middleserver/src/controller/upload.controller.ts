//const { createBase } = require('../service/base.service');
const path = require('path');

const uploadFile = async (ctx, next) => {
  //file = 上传的key
  const { file } = ctx.request.files;
  const fileTypes = ['image/jpeg', 'image/png'];
  if (file) {
    // if (!fileTypes.includes(file.type)) {
    //   return (ctx.body = {
    //     code: 3000,
    //     message: '上传失败',
    //     data: { name: path.basename(file.path) },
    //   });
    // }
    ctx.body = {
      code: 0,
      message: '上传成功',
      data: { pathname: path.basename(file.path) },
    };
  }
};

export { uploadFile };
