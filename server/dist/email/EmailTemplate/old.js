"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportEmailTemplate = exports.getChart = exports.getTable = exports.getTitle = exports.getReportInfo = exports.getReportTop = exports.getFooter = exports.getOther = exports.getHead = void 0;
/* eslint-disable max-len */
const mjml2html = __importStar(require("mjml"));
/**
 * 获取邮件模版 head
 */
const getHead = (options) => {
    const defaultOpts = {
        title: '北斗报表',
        bgImg: 'https://j1.58cdn.com.cn/base_static/pattern.png',
    };
    const { title, bgImg } = Object.assign(Object.assign({}, defaultOpts), options);
    return `
    <mj-head>
      <mj-title>${title}</mj-title>
      <mj-attributes>
        <mj-all font-family="Arial" />
        <mj-text line-height="130%" font-size="14px" font-weight="400" color="#2f2936" />
        <mj-class name="title" line-height="150%" font-size="20px" color="#2f2936" />

        <mj-class name="white-font" color="#ffffff" />
        <mj-class name="text-right" text-align="right" />

        <mj-class name="table-item" align="center" padding="10px" />
      </mj-attributes>
      <mj-style inline="inline">
        .body-bg {
          background-image: url(${bgImg});
          background-repeat: repeat;
        }
        .wrap-shadow {
          -webkit-box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
          -moz-box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
          box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
        }
        .border-sty {
          border-width: 1px;
          border-color: #c7d0d4;
          border-style: solid;
        }
        .padding-30 {
          padding: 30px;
        }
        .margin-15 {
          padding: 30px;
        }
        .wrap {
          padding: 15px 0;
        }
        .width-full {
          width: 100%!important;
        }
        .table-item-border {
        	height: 1px;
          background-color: #f0f0f0;
        }
      </mj-style>
    </mj-head>
  `;
};
exports.getHead = getHead;
/**
 * 获取补充信息
 */
const getOther = () => {
    return `
    <!-- 附 -->
    <mj-section>
      <mj-column>
        <mj-text mj-class="title">Other</mj-text>
        <mj-text>了解更多数据详情，请在 PC 端点击下方按钮跳转至北斗看板页面查看。</mj-text>
        <mj-text>问题反馈请联系「liyi06」、「jianghongwei」、「wenjiawei01」。</mj-text>
        <mj-button background-color="#24292f" href="https://beidou.58corp.com/dashboard/"> 跳转北斗 </mj-button>
      </mj-column>
    </mj-section>
  `;
};
exports.getOther = getOther;
/**
 * 获取 footer
 */
const getFooter = () => {
    return `
    <!-- 底部 -->
    <mj-section border-top="1px solid #E7EBEE">
      <mj-column>
        <mj-text align="center" color="#687276" font-size="12px">&copy; 2022,58同城,北斗协同团队</mj-text>
      </mj-column>
    </mj-section>
  `;
};
exports.getFooter = getFooter;
/**
 * 获取邮件模版顶部
 */
const getReportTop = (options) => {
    const { orgName, platform, time } = options;
    return `
    <!-- 顶部 -->
    <mj-section background-color="#24292f">
      <mj-column width="180px">
        <mj-image width="180px" padding="10px 0px" src="https://j1.58cdn.com.cn/base_static/logov2.png"></mj-image>
      </mj-column>

      <mj-column width="20px"></mj-column>

      <mj-column width="400px">
        <mj-text mj-class="white-font" align="right" font-size="16px" padding-top="0px" padding-bottom="0px">${orgName}周报「${platform}」</mj-text>
        <mj-text mj-class="white-font" align="right" padding="5px 25px">${time}</mj-text>
      </mj-column>
    </mj-section>
  `;
};
exports.getReportTop = getReportTop;
/**
 * 获取邮件模版基本信息
 */
const getReportInfo = (options) => {
    const { orgName, platform, time } = options;
    return `
    <!-- 前言 -->
    <mj-section>
      <mj-column>
        <mj-text mj-class="title">报表基本信息</mj-text>
        <mj-text>业务线：${orgName}</mj-text>
        <mj-text>项目类型：${platform}</mj-text>
        <mj-text>报表时间：${time}</mj-text>
        <mj-text>说明：本数据为北斗团队收集，仅供参考。「对比集团」：相同时间段内本业务线数据与北斗全量数据的计算对比。「集团内占比」：相同时间段内本业务线数据在北斗全量数据中所占的比率。</mj-text>
      </mj-column>
    </mj-section>
  `;
};
exports.getReportInfo = getReportInfo;
/**
 * 获取标题
 */
const getTitle = (options) => {
    const { title, text } = options;
    return `
    <mj-section padding-bottom="0px" padding-top="0px">
      <mj-column width="600px">
        ${title ? `<mj-text mj-class="title">${title}</mj-text>` : ''}
        ${text ? `<mj-text>${text}</mj-text>` : ''}
      </mj-column>
    </mj-section>
  `;
};
exports.getTitle = getTitle;
/**
 * 获取表格
 */
const getTable = (options) => {
    const { columns, data } = options;
    return `
    <!-- 表头 -->
    <mj-section padding="0px 25px">
      ${columns
        .map((item) => `
          <mj-column width="${item.width || '100px'}" background-color="#ebedf0">
            <mj-text mj-class="table-item">${item.name}</mj-text>
          </mj-column>
        `)
        .join('')}
    </mj-section>

    ${data
        .map((item) => `
        <mj-section padding="0px 25px">
          ${columns
        .map((column) => {
        let val = item[column.dataIndex];
        let colorStr = '';
        if (typeof val === 'number' && column.compared) {
            // 添加颜色
            val > 0 && (colorStr = 'color="#cf1322"');
            val < 0 && (colorStr = 'color="#3f8600"');
        }
        if (val === undefined ||
            val === null ||
            Number.isNaN(val) ||
            val === '') {
            val = column.defaultVal;
        }
        else {
            // 加后缀
            val = `${val}${column.suffix || ''}`;
        }
        return `
                <mj-column width="${column.width || '100px'}" background-color="#ffffff">
                  <mj-text mj-class="table-item" ${colorStr}>${val}</mj-text>
                </mj-column>
              `;
    })
        .join('')}
        </mj-section>
        <mj-section padding="0 25px">
        	<mj-column width="550px" css-class="table-item-border"></mj-column>
        </mj-section>
      `)
        .join('')}
  `;
};
exports.getTable = getTable;
/**
 * 获取图表
 */
const getChart = (options) => {
    const defaultOpts = {
        suffix: '',
        cols: ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'], // 每周四开周会，所以周四发送报表 上周四 ～ 本周三
    };
    const { title, data, cols, suffix } = Object.assign(Object.assign({}, defaultOpts), options);
    const maxVal = 0;
    const middleVal = 0;
    return `
    <!-- 图表 -->
    <mj-section>
      <mj-column width="74px"></mj-column>
      <mj-column css-class="border-sty" border-radius="4px" width="450px" padding="10px">
        <mj-text padding-top="0px" padding-bottom="20px" align="center" css-class="width-full">${title}</mj-text>

        <mj-text padding="0" font-size="0px" align="center" css-class="width-full">
          ${data
        .map((item, index) => {
        const xKey = cols[index];
        let valHei = maxVal ? Math.round((item / maxVal) * 200) : 0; // 当前值转换为 200px 后所占比例
        valHei > 200 && (valHei = 200);
        const emptyHei = 200 - valHei;
        return `
                <div style="width: 10%;height: 220px;display: inline-block;vertical-align: top;">
                  <div style="height: ${emptyHei}px;margin-left: 5px;background-color: #f0f0f0;"></div>
                  <div style="height: ${valHei}px;margin-left: 5px;background-color: #fae5cf;"></div>
                  <div style="height: 20px;margin-left: 5px;font-size: 12px;line-height: 20px;">${xKey}</div>
                </div>
              `;
    })
        .join('')}

          <div style="height: 200px;display: inline-block;vertical-align: top;max-width: 30%;">
            <span style="display: block;height: 12px;font-size: 12px;line-height: 100%;padding: 5px;border-top: 1px dashed #c7d0d4;text-align:left;margin-left: 5px;">
            ${maxVal ? `${maxVal}${suffix}` : ''}
            </span>
            <span
              style="margin-top:77px;display:block;height:12px;font-size:12px;line-height:100%;padding:5px;border-top:1px dashed #c7d0d4;text-align:left;margin-left: 5px;">
            ${middleVal ? `${middleVal}${suffix}` : ''}
            </span>
            <span
              style="margin-top:54px;display:block;height:12px;font-size:12px;line-height:100%;padding:5px;border-bottom:1px dashed #c7d0d4;text-align:left;margin-left:5px;">
            0${suffix}
            </span>
          </div>
        </mj-text>
      </mj-column>
      <mj-column width="74px"></mj-column>
    </mj-section>
  `;
};
exports.getChart = getChart;
const getReportEmailTemplate = (options) => {
    const { orgName, platform, time, items, outHtml, timeSuffix } = options;
    const itemCont = items.map((item) => {
        const { title, table, chart } = item;
        return `
      ${(0, exports.getTitle)({ title })}
      ${table ? (0, exports.getTitle)({ text: '数据总览' }) : ''}
      ${table ? (0, exports.getTable)(table) : ''}
      ${chart ? (0, exports.getTitle)({ text: '数据图表' }) : ''}
      ${chart ? (0, exports.getChart)(chart) : ''}
    `;
    });
    const tempStr = `
    <mjml>
      ${(0, exports.getHead)()}

      <mj-body css-class="body-bg wrap">
        <mj-wrapper background-color="#ffffff" padding="0px" border-radius="4px" css-class="wrap-shadow border-sty">
        ${(0, exports.getReportTop)({ orgName, platform, time })}
        ${(0, exports.getReportInfo)({
        orgName,
        platform,
        time: `${time}${timeSuffix || ''}`,
    })}
        ${(0, exports.getTitle)({ title: '' })}

        ${itemCont}

        ${(0, exports.getOther)()}
        ${(0, exports.getFooter)()}
        </mj-wrapper>
      </mj-body>
    </mjml>
  `;
    return outHtml
        ? mjml2html(tempStr, {
            keepComments: false,
            validationLevel: 'strict',
            minifyOptions: {
                stdout: true,
                removeComments: true,
                minifyCSS: true,
                minifyJS: true,
                decodeEntities: false,
                collapseWhitespace: true,
                collapseInlineTagWhitespace: true,
                // maxLineLength: 20000,
                preventAttributesEscaping: true,
                removeTagWhitespace: true,
            },
        }).html
        : tempStr;
};
exports.getReportEmailTemplate = getReportEmailTemplate;
