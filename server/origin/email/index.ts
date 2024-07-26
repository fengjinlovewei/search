import { DateFormat } from '../util';
import nodemailer from 'nodemailer';

/**
 * 共有邮件申请：https://ishare.58corp.com/articleDetail?id=850
 * 发送邮件（nodemailer）：https://nodemailer.com/message/
 */

interface ISendMailOpts {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  [key: string]: any;
}

interface SendEmailOpts {
  toUserList: Array<string>;
  html: string;
  user: string;
  pass: string;
  outputJson: OutputJsonType;
}

export async function sendMail(options: ISendMailOpts, EmailConfig) {
  //
  const client = nodemailer.createTransport(EmailConfig);

  if (!client || typeof client.sendMail !== 'function') {
    throw new Error('请传入 mail 客户端');
  }

  const info = await client.sendMail(options, null);

  return info;
}

export async function sendEmail(data: SendEmailOpts) {
  const { toUserList = [], html = '', user = '', pass = '', outputJson } = data;
  const EmailConfig = {
    host: 'smtp.exmail.qq.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  };

  const info = await sendMail(
    {
      from: `"${user}" <${user}>`, // sender address
      to: toUserList.map(item => `${item}@58.com`).join(','),
      subject: `【提测报告】${DateFormat()}`,
      html,
    },
    EmailConfig
  );
  return info;
}
