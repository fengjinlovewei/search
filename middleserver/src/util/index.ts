import console from "console";
import fs from "fs";
import path from "path";
import mjml2html from "mjml";

// 时间序列化
function DateFormat({ format = `y年m月d日 H:M:S`, date = new Date() } = {}) {
  const formatNumber = (n) => (n >= 10 ? n : "0" + n);
  return format
    .replace("y", date.getFullYear().toString())
    .replace("m", formatNumber((date.getMonth() + 1).toString()))
    .replace("d", formatNumber(date.getDate().toString()))
    .replace("H", formatNumber(date.getHours().toString()))
    .replace("M", formatNumber(date.getMinutes().toString()))
    .replace("S", formatNumber(date.getSeconds().toString()));
}

// 获取数据类型
function getType(o: any): string {
  return Object.prototype.toString.call(o).slice(8, -1);
}

function deleteUpload() {
  const dir = path.resolve(__dirname, `../upload`);
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((item) => {
      if (item !== ".gitkeep") {
        const current = path.join(dir, item);
        fs.unlinkSync(current);
      }
    });
  }
}

//写入文件
function createDir(name, content) {
  const dir = path.resolve(__dirname, `../jsonDB`);
  const file = path.resolve(__dirname, `../jsonDB`, `${name}`);
  let writeData = [content];
  if (fs.existsSync(dir) && fs.existsSync(file)) {
    // 存在，读取内容并追加content

    const fileStr = fs.readFileSync(file, "utf8");
    const fileJson = JSON.parse(fileStr) || [];
    writeData = [...fileJson, content];
  }
  // 创建文件，写内容
  fs.writeFile(file, JSON.stringify(writeData), function (err) {
    if (err) {
      console.log(`写入错误${writeData}`);
    }
  });
}

function formatterNum(num) {
  const n = (+num * 100).toFixed(2);
  return `${n}%`;
}

// 格式化周报信息
function formatterWeekReport(week) {
  const { time, list = [], preTime } = week || {};

  const htmlStr = `
  <mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Arial" />
      <mj-text line-height="130%" font-size="14px" font-weight="400" color="#2f2936" />
      <mj-class name="title" line-height="150%" font-size="20px" color="#2f2936" />
      <mj-class name="white-font" color="#ffffff" />
      <mj-class name="text-right" text-align="right" />
      <mj-class name="table-item" align="center" padding="10px" />
    </mj-attributes> 
  </mj-head>
  <mj-body css-class="body-bg">
    <mj-section padding="20px 0px" background-color="#fff">
      <mj-column>
          <mj-text 
            font-size="20px"
            color="#626262">部落主要业务北斗异常统计周报</mj-text>
            <mj-text color="#525252">时间：${time}</mj-text>
            <mj-text color="#525252">对比上周时间：${preTime}</mj-text>
            <mj-text color="#525252">说明：影响访问占比展示2位小数，故存在【上周 + 差异值 !== 本周】情况</mj-text>
            <mj-text color="#525252">
              图示：
              <span style="color:#000">本周汇总数据</span>
              <span style="color:red">【本周汇总数据和上周对比】</span>
              <span style="color:#909399">上周汇总数据</span>
            </mj-text>
            <mj-text color="#525252">2022-XX-XX     本周每日数据（无对比）</mj-text>
      </mj-column>
    </mj-section>

    <mj-section padding="0px 0px" background-color="#d9d9d9">
      <mj-column width="100px">
        <mj-text mj-class="table-item">项目名称</mj-text>
      </mj-column>
      <mj-column width="80px">
        <mj-text mj-class="table-item">PV</mj-text>
      </mj-column>
      <mj-column width="210px">
        <mj-text mj-class="table-item">JS异常</mj-text>
      </mj-column>
      <mj-column width="210px">
        <mj-text mj-class="table-item">影响访问占比</mj-text>
      </mj-column>
    </mj-section>
    
    ${list.map((item, index) => {
      return `
      <mj-section padding="0px 0px" background-color="${
        index % 2 === 0 ? "#ebedf0" : "#ebedf0"
      }">
        <mj-column width="100px">
          <mj-text mj-class="table-item">${item.projectName}</mj-text>
        </mj-column>
        <mj-column width="80px">
          <mj-text mj-class="table-item">${item.pv}</mj-text>
        </mj-column>
        <mj-column width="210px">
          <mj-text mj-class="table-item">
          <span>${item.currentExceptionCount}</span>
          <span style="color:${
            item.diffCount <= 0 ? "green" : "red"
          };margin:'0 5px'">【${item.diffCount <= 0 ? "↓" : "↑"}${
        item.diffCount
      }】</span>
          <span style="color:#909399">${item.preExceptionCount}</span>
          </mj-text>
        </mj-column>
        <mj-column width="210px">
          <mj-text mj-class="table-item">
          <span>${formatterNum(item.currentExceptionPvRatio)}</span>
          <span style="color:${
            item.diffRatio <= 0 ? "green" : "red"
          };margin:'0 5px'">【${item.diffRatio <= 0 ? "↓" : "↑"}${formatterNum(
        item.diffRatio
      )}】</span>
          <span style="color:#909399">${formatterNum(
            item.preExceptionPvRatio
          )}</span>
          </mj-text>
        </mj-column>
      </mj-section>
      ${item.days.map((day) => {
        return `
        <mj-section padding="0px 0px">
          <mj-column width="100px">
            <mj-text mj-class="table-item">${day.time}</mj-text>
          </mj-column>  
          <mj-column width="80px">
            <mj-text mj-class="table-item">${day.pv}</mj-text>
          </mj-column>
          <mj-column width="210px">
            <mj-text mj-class="table-item">
              <span>${day.currentExceptionCount}</span>
            </mj-text>
          </mj-column>
          <mj-column width="210px">
            <mj-text mj-class="table-item">
              <span>${formatterNum(day.currentExceptionPvRatio)}</span>
            </mj-text>
          </mj-column>
        </mj-section>
        `;
      })}
      `;
    })}
  </mj-body>
</mjml>
  `;

  return mjml2html(htmlStr, {
    keepComments: false,
    validationLevel: "strict",
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
  }).html;
}

export { DateFormat, getType, deleteUpload, createDir, formatterWeekReport };
