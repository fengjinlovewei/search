import path from 'path';
import fs from 'fs';
import { send } from '../email';
//import { createBase } from '../service/base.service';

const sendEmail = async (ctx, next) => {
  const { html, user, toUserList, iworkId, files, title } = ctx.request.body;
  const attachments = files.map((item) => {
    const { filename, pathname } = item;
    return {
      filename,
      path: path.resolve(__dirname, `../upload/${pathname}`),
    };
  });
  try {
    const data = await send({
      html,
      user,
      toUserList,
      iworkId,
      attachments,
      title,
    });
    ctx.body = {
      //
      code: 0,
      message: '邮件链接成功',
      data,
    };
    // 发送成功删除
    attachments.forEach((item) => {
      fs.unlinkSync(item.path);
    });
  } catch (err) {
    console.log(err);
    ctx.body = {
      //
      code: 10000,
      message: '邮件链接失败',
      data: null,
      err,
    };
  }
};

// const rootData = async (ctx, next) => {
//   //console.log(ctx.request.body);

//   const { project = {}, change, oa, branch } = ctx.request.body;

//   try {
//     const { name: project_name } = project;

//     const change_file = change
//       .map(item => `${item.type}|${item.path}`)
//       .join(',');

//     console.log({ project_name, branch, oa, change_file });
//     const res = await createBase({ project_name, branch, oa, change_file });
//     console.log(res);

//     ctx.body = {
//       //
//       code: 0,
//       message: '存储成功',
//       data: res,
//     };
//   } catch (err) {
//     console.log(err);
//     ctx.body = {
//       code: 10001,
//       message: '写入失败',
//       data: null,
//       err,
//     };
//   }
// };

// export { rootData, sendEmail };
export { sendEmail };
