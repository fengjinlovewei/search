//const { createBase } = require('../service/base.service');
import path from 'path';
import compressing from 'compressing';

const uploadFile = async (ctx, next) => {
  //debugger;
  //file = 上传的key
  const { files = {}, body = {} } = ctx.request;
  const { file } = files;
  const { uploadType } = body;
  const fileTypes = ['image/jpeg', 'image/png'];
  // const compressionTypes = [
  //   'application/zip',
  //   'application/gzip',
  //   'application/tar',
  //   'application/tgz',
  // ];

  const extname = path.extname(file.path);
  const basename = path.basename(file.path);

  if (file) {
    // if (!fileTypes.includes(file.type)) {
    //   return (ctx.body = {
    //     code: 3000,
    //     message: '上传失败',
    //     data: { name: path.basename(file.path) },
    //   });
    // }
    if (extname === '.zip' && uploadType === '1') {
      try {
        await compressing.zip.uncompress(
          path.resolve(__dirname, `../upload/${basename}`),
          path.resolve(__dirname, `../views`)
        );
      } catch (e) {
        console.log('解压失败', e);
      }
    }
    ctx.body = {
      code: 0,
      message: '上传成功',
      data: { pathname: basename },
    };
  }
};

export { uploadFile };
