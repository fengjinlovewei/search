import path from 'path';
import nodemailer from 'nodemailer';
import smtpTransport from 'nodemailer-smtp-transport';
import { ISendMailOpts, SendEmailOpts } from '../type';
import ENV from '../config/config.default';

const { EMAIL_PORT, EMAIL_HOST, EMAIL_USER, EMAIL_PASS } = ENV;
/**
 * 共有邮件申请：https://ishare.58corp.com/articleDetail?id=850
 * 发送邮件（nodemailer）：https://nodemailer.com/message/
 */

async function sendMail(options: ISendMailOpts, EmailConfig) {
  //
  const client = nodemailer.createTransport(smtpTransport(EmailConfig));

  if (!client || typeof client.sendMail !== 'function') {
    throw new Error('请传入 mail 客户端');
  }

  const info = await client.sendMail(options);

  return info;
}

async function send(data: SendEmailOpts) {
  const {
    toUserList = [],
    html = '',
    user = '',
    iworkId = '',
    attachments = [],
    title = '',
  } = data;

  const EmailConfig = {
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  };

  const subject = title || `[${iworkId}][前端提测][${user}]`;

  const info = await sendMail(
    {
      from: `"${user}" <${EMAIL_USER}>`, // sender address
      to: toUserList.map((item) => `${item}@58.com`).join(','),
      subject,
      html,
      attachments,
    },
    EmailConfig
  );
  return info;
}

export { send };
