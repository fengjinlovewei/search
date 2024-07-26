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

export { sendEmail };
