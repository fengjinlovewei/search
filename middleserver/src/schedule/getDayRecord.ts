import axios from "axios";
import moment from "moment";
import { send } from "../email/index";
import { formatterWeekReport } from "../util/index";
import ENV from "../config/config.default";

const {
  BULUO_EMAIL_LIST,
  BEIDOU_EXTRA_TOKEN,
  BEIDOU_H5_LIST,
  BEIDOU_RN_LIST,
} = ENV;

function getData(params) {
  return axios.get("https://beidou.58corp.com/api/extra/common/getReportData", {
    headers: {
      "beidou-extra-token": BEIDOU_EXTRA_TOKEN,
    },
    params: params,
  });
}

function formatter(list = [], platform, t) {
  const flist = list.map((item) => {
    return {
      ...item,
      time: t,
      platform: platform,
    };
  });
  return flist;
}

function sendBeidouEmail(title, week) {
  const html = formatterWeekReport(week);

  const params = {
    toUserList: BULUO_EMAIL_LIST.split(","),
    // toUserList: ['fengkang01'],
    user: "部落",
    title,
    html: html,
  };
  // return;
  send(params);
}

function handleALL(week, preweek, days) {
  return week.map((item) => {
    const { projectId, projectName } = item || {};
    const preItemList = preweek.filter((i) => {
      return i.projectId === projectId;
    });
    const preItem = preItemList[0] || {};

    const daylist = days
      .filter((day) => {
        return day.projectName === projectName;
      })
      .map((m) => {
        return {
          projectId: m.projectId || "",
          time: m.startTime.split(" ")[0],
          pv: m.pv,
          projectName: m.projectName,
          currentExceptionCount: m.exceptionCount || 0,
          currentExceptionPvRatio: m.exceptionPvRatio || 0,
        };
      });
    return {
      projectId: projectId,
      projectName: projectName,
      pv: item.pv,
      currentExceptionCount: item.exceptionCount || 0,
      currentExceptionPvRatio: item.exceptionPvRatio || 0,
      preExceptionCount: preItem.exceptionCount || 0,
      preExceptionPvRatio: preItem.exceptionPvRatio || 0,
      diffCount: +item.exceptionCount - +preItem.exceptionCount || 0,
      diffRatio: +item.exceptionPvRatio - +preItem.exceptionPvRatio || 0,
      days: daylist,
    };
  });
}

export const getWeekRecord = async () => {
  try {
    const startTime = moment().subtract(7, "days").format("YYYY-MM-DD");
    const endTime = moment().subtract(1, "days").format("YYYY-MM-DD");

    const preStartTime = moment().subtract(14, "days").format("YYYY-MM-DD");
    const preEndTime = moment().subtract(8, "days").format("YYYY-MM-DD");

    // H5 和 RN 7日数据
    const H5Allparams = {
      platform: "H5",
      projectId: BEIDOU_H5_LIST,
      startTime,
      endTime,
    };
    const RNAllparams = {
      platform: "RN",
      projectId: BEIDOU_RN_LIST,
      startTime,
      endTime,
    };
    // H5 和 RN 7日每日数据
    const H5params = {
      platform: "H5",
      projectId: BEIDOU_H5_LIST,
      startTime,
      endTime,
      dataType: "list",
    };
    const RNparams = {
      platform: "RN",
      projectId: BEIDOU_RN_LIST,
      startTime,
      endTime,
      dataType: "list",
    };
    // H5 和 RN 上周7日总数据
    const preH5params = {
      platform: "H5",
      projectId: BEIDOU_H5_LIST,
      startTime: preStartTime,
      endTime: preEndTime,
    };
    const preRNparams = {
      platform: "RN",
      projectId: BEIDOU_RN_LIST,
      startTime: preStartTime,
      endTime: preEndTime,
    };

    axios
      .all([
        getData(H5Allparams),
        getData(RNAllparams),
        getData(preH5params),
        getData(preRNparams),
        getData(H5params),
        getData(RNparams),
      ])
      .then(
        axios.spread((h5all, rnall, preh5all, prernh5all, h5, rn) => {
          // 两个请求现在都执行完成
          const H5ALL = h5all.data.data || [];
          const RNALL = rnall.data.data || [];
          const preH5ALL = preh5all.data.data || [];
          const preRNALL = prernh5all.data.data || [];
          const H5 = h5.data.data || [];
          const RN = rn.data.data || [];

          const week = [...H5ALL, ...RNALL];

          const orderWeek = week.sort((a, b) => {
            return b.pv - a.pv;
          });

          // 处理7日总数据和上周数据的对比
          const weekList = handleALL(
            orderWeek,
            [...preH5ALL, ...preRNALL],
            [...H5, ...RN]
          );

          const weekData = {
            time: `${startTime} 至 ${endTime}`,
            preTime: `${preStartTime} 至 ${preEndTime}`,
            list: weekList,
          };
          sendBeidouEmail("【部落业务北斗异常周报】", weekData);
        })
      );
  } catch (error) {}
};
