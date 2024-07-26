import axios from 'axios';

/**
 *  appId=triberobot, secret=60642205e608f307a41de0cd311373d3, encryCode=1
 * 机器人id（即消息发送方id）：MIS_ROBOT_triberobot
 */

/**
 * timestamp: 1657001374060 + random: 543009
 *  = sign是 be8631be1f4cd6ff19c0ae97988de3c2
 */
// const meishiBaseUrl = 'http://172.29.146.251:8001';
const meishiBaseUrl = 'http://openapi.mism.58dns.org';

/**
 * @see http://wbook.58corp.com/books/meishi/sendMessage/sendMsg-http.html
 */

declare interface SendGroupMsgMeishiType {
  text: string;
  toId?: string;
}

export async function sendGroupMsgMeishi({
  text,
  toId = '81466',
}: SendGroupMsgMeishiType) {
  const reqTime = +Date.now();
  const random = '543009';

  const data = await axios.post<any, any>(`${meishiBaseUrl}/msg/sendGroupMsg`, {
    msRequestId: {
      //调用方鉴权相关参数
      appId: 'triberobot', // appId
      reqTime, // 时间戳 1659338099464
      random, // 一个随机数
      sign: 'be8631be1f4cd6ff19c0ae97988de3c2', // 加密后的字符串，生成方法请参考[接口鉴权]
      trace: `triberobot:${reqTime}:${random}`, // 查询日志使用，每次接口调用生成一个随机字符串即可
    },
    msg: {
      //content 消息内容，json字符串
      // 注意，msg里转义字符用法，换行\\n，制表：\\t，双引号\\\"等转义字符，否则消息会发送失败(虽然接口返回成功)
      content: `{"msg":"${text}","type":"text"}`,
      senderId: 'MIS_ROBOT_triberobot', //发送方用户id
      showType: 'text', //消息类型，与content中的type字段相同。showType=text为文本消息
      toId, //群id  测试的群id 26793
      atUsers: [
        {
          id: toId, // 需要at所有人的话就设置成群id，不需要设置name字段
          pos_start: 0, // 在msg中的起始位置
          pos_end: 4, // 在msg中的结束位置+1
        },
      ],
    },
  });

  return data.data.code === '1';
}
