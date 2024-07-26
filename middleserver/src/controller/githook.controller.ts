//const { createBase } = require('../service/base.service');
import { sendGroupMsgMeishi } from '../robot';

const gitBase = async (ctx, next) => {
  console.log(ctx.request.body);
  /**
   * user = 合并执行人信息
   * assignees = 合并请求人信息
   */
  const {
    user = {},
    assignees = [],
    object_attributes = {},
    project = {},
  } = ctx.request.body;

  const { source_branch, target_branch, state, action } = object_attributes;
  const { name: rootName } = user;
  const { name: projectName } = project;

  const requestName = assignees.map((item) => `@${item.name} `).join(',');

  // 合并目标为 master 分支
  const isIntoMater = target_branch === 'master';
  // 确认是合并操作
  const isMerged = state === 'merged' && action === 'merge';

  if (isIntoMater && isMerged) {
    /**
     * 大部落前端id: 81466
     * fuckhorse: 160483
     */
    const toId = projectName === 'search' ? '160483' : '81466';
    const isRN = projectName === 'react-native-apps';

    const text = `@所有人 ${projectName} 项目：\\n${
      requestName ? requestName + '的' : ''
    }分支 ${source_branch} 已被${
      rootName ? ` @${rootName} ` : ''
    }合并到master，请及时上线。${
      isRN ? '\\n注意：RN同城和本地要同步上线' : ''
    }`;

    // console.log(text);
    sendGroupMsgMeishi({ text, toId });
  }

  ctx.body = 'git钩子！';
};

export { gitBase };
