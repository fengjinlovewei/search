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
  iworkId?: string;
  attachments?: Array<any>;
  title?: string;
}

export { ISendMailOpts, SendEmailOpts };
