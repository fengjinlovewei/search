"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplate = void 0;
const mjml_1 = __importDefault(require("mjml"));
const lodash_1 = __importDefault(require("lodash"));
const util_1 = require("../../util");
function emailTemplate(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { pageInfo = [] } = data;
        const { commit } = this.outputJson;
        const pageInfoData = [...pageInfo];
        pageInfoData.sort((a, b) => b.weight - a.weight);
        const c1 = '#f01010';
        const c2 = '#f7a605';
        const c3 = '#3399ff';
        const [weight1, weight2] = this.weight;
        const getPageStr = data => {
            let { entry, md = '', weight = 0 } = data;
            let html = '';
            const { head } = (0, util_1.mdParse)(md);
            const { title, description } = head;
            const isMD = !!title;
            const uid = lodash_1.default.uniqueId('page_');
            const styles = (() => {
                if (weight < weight1) {
                    return {
                        box: {
                            'background-color': c3,
                            color: '#fff',
                        },
                        btn: {
                            color: '#fff',
                        },
                    };
                }
                if (weight < weight2) {
                    return {
                        box: {
                            'background-color': c2,
                            color: '#fff',
                        },
                        btn: {
                            color: '#fff',
                        },
                    };
                }
                return {
                    box: {
                        'background-color': c1,
                        color: '#fff',
                    },
                    btn: {
                        color: '#fff',
                    },
                };
            })();
            const styleStr = style => {
                return Object.keys(style)
                    .map(key => `${key}:${style[key]};`)
                    .join('');
            };
            if (!isMD) {
                styles.btn['display'] = 'none';
                const a = `<span data-file="${entry}">${entry}</span>`;
                html = `
      <div style="padding:5px 0;">
        <span>(${weight})</span>
        <span class="md-nodata">没有md说明文件或者格式错误，入口：${a}</span>
      </div>
      `;
            }
            else {
                html = `
      <div style="padding: 10px 0;font-size: 20px;font-weight: bold;">
        <span class="delete">(${weight}) </span>${title}
      </div>
      <div style="padding-bottom: 10px;font-size: 13px;">${description}</div>
      `;
            }
            return `
      <div class="md-page-item" >
        
        <input type="checkbox" ${!isMD ? 'checked' : ''} id="${uid}-delete" class="md-input-delete" />
        
        <div class="md-shade"></div>

        <input type="checkbox" id="${uid}" class="md-input-show" />
        
        <div class="md-box" style="${styleStr(styles.box)}">
          <div class="md-info">${html}</div>
          <label class="md-delete delete" for="${uid}-delete" style="${styleStr(styles.btn)}"></label>
        </div>
      </div>
    `;
        };
        let pages = pageInfoData.map(data => getPageStr(data)).join('');
        if (pages.length === 0) {
            pages =
                '<div style="font-size:20px;font-weight: bold;">没有收集到依赖页面！</div>';
        }
        const tempStr = `
  <mjml>
    <mj-head>
      <mj-title>Hello Register</mj-title>
      <mj-attributes>
        <!-- 1、定义 global 样式 -->
        <!-- 针对某个元素 -->
        <mj-text line-height="150%" padding="5px 10px" />
        <!-- 针对所有元素 -->
        <mj-all font-family="Arial" color="#333" />
        <!-- 2、定义 class 样式 -->
        <mj-class name="title" align="center" font-weight="600" color="#744f3c" />
        <mj-class name="label" font-size="16px" font-weight="600" />
        <mj-class name="table" border="1px solid #999" border-bottom="0" padding="0" />
        <mj-class name="table-top" border-top="1px solid #999" padding="0" />
        <mj-class name="table-bottom" border-bottom="1px solid #999" padding="0" />
        <mj-class name="table-all" border="1px solid #999" padding="0" />
      </mj-attributes>

      <!-- 3、定义 css 样式 -->
      <mj-style inline="inline">
        ol {
          display: block;
          list-style-type: decimal;
          margin-block-start: 1em;
          margin-block-end: 1em;
          margin-inline-start: 0px;
          margin-inline-end: 0px;
          padding-inline-start: 40px;
        }
        ul {
          display: block;
          list-style-type: disc;
          margin-block-start: 1em;
          margin-block-end: 1em;
          margin-inline-start: 0px;
          margin-inline-end: 0px;
          padding-inline-start: 40px;
        }
        li {
          display: list-item;
          text-align: -webkit-match-parent;
        }
      </mj-style>

      <mj-style inline="inline">
        .$dataInfo{ color: #000; padding:5px 10px; }
        .label{ font-weight:600;font-size:16px; color: #744f3c;}
        #pages{ background-color: #fff; padding: 20px}
        .md-input-show , .md-input-delete{
          display: none;
        }

        .md-page-item{
          position: relative;
          margin: 5px 0;
          overflow: hidden;
          border-radius: 10px;
        }

        .md-btn-box {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 50px;
          text-align: center;
          user-select: none;
          cursor: pointer;
          opacity: 0;
          z-index: 90;
        }
        
        .md-info img{
          max-height:400px;
        }
        
        .md-box {
          padding: 0 20px;
          border-style: solid;
          border-width: 2px;
        }
        .md-shade{
          display: none;
          position: absolute;
          top:0;
          left:0;
          right:0;
          bottom:0;
          background: rgba(0,0,0,0.5);
          z-index: 120;
          pointer-events: none;
        }
        .type-Line {
          display: table;
          margin: 0 auto;
        }
        .type-Line i{
          display: inline-block;
          width: 50px;
          height: 30px;
          vertical-align: middle;
        }
        .type-Line span{
          display: inline-block;
          padding: 0 30px 0 10px;
          vertical-align: middle;
        }
      </mj-style>
      <mj-style>

        .md-btn-box {
          opacity: 1 !important;
        }

        .md-none {
          display: inline-block;
          height: 50px;
          vertical-align: middle;
        }
        .md-nodata{
          display: inline-block;
          vertical-align: middle;
          color: #fff;
        }

        [data-file]{
          cursor: pointer;
          position: relative;
          z-index: 120;
        }
        
        .md-delete{
          position: absolute;
          width: 30px;
          height: 30px;
          top: 10px;
          right: 10px;
          background: url('https://a.58cdn.com.cn/app58/img/tribeall/close.png') no-repeat;
          background-size: 100% auto;
          background-position: center;
          z-index: 100;
          cursor: pointer;
        }

        .md-input-show:checked ~ .md-box > .md-info {
          display: block;
        }
        .md-input-show:checked ~ .md-box > .md-none {
          display: block;
        }

        .md-input-delete:checked ~ .md-shade{
          display: block !important;
        }
      </mj-style>
    </mj-head>
    <mj-body width="800px">
      <mj-wrapper background-color="#f7f7f7" padding="20px">
        <mj-section padding="0">
          <mj-column>
            <mj-text mj-class="title" font-size="35px">提测邮件</mj-text>
          </mj-column>
        </mj-section>

        <mj-section mj-class="table">
          <mj-column>
            <mj-text><span class="label">需求描述：</span></mj-text>
            <mj-text>
              <div class="$dataInfo" id="iwork" contenteditable="true">${this.iwork}</div>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section mj-class="table">
          <mj-column>
            <mj-text><span class="label">接口文档：</span></mj-text>
            <mj-text>
              <div class="$dataInfo" id="interface-doc" contenteditable="true">无</div>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section mj-class="table">
          <mj-column>
            <mj-text><span class="label">取包地址 / 测试url：</span></mj-text>
            <mj-text>
              <div class="$dataInfo" id="bundle-url" contenteditable="true">无</div>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section mj-class="table">
          <mj-column>
            <mj-text><span class="label">前端环境配置：</span></mj-text>
            <mj-text>
              <div class="$dataInfo" id="fe-env" contenteditable="true">无</div>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section mj-class="table">
          <mj-column>
            <mj-text><span class="label">后端环境配置：</span></mj-text>
            <mj-text>
              <div class="$dataInfo" id="rd-env" contenteditable="true">无</div>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section mj-class="table">
          <mj-column>
            <mj-text><span class="label">RD建议测试点：</span></mj-text>
            <mj-text>
              <div class="$dataInfo" id="rd-env" contenteditable="true">无</div>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section mj-class="table">
          <mj-column>
            <mj-text><span class="label">上线检查清单：</span></mj-text>
            <mj-text>
              <div class="$dataInfo" id="rd-env" contenteditable="true">无</div>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section mj-class="table">
          <mj-column>
            <mj-text>
              <span class="label">前端开发人员：</span>
              <span class="$dataInfo" id="fe-name" contenteditable="true">${commit['%cn']}</span>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section mj-class="table">
          <mj-column>
            <mj-text>
              <span class="label">后端开发人员：</span>
              <span class="$dataInfo" id="rd-name" contenteditable="true">无</span>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section mj-class="table">
          <mj-column>
            <mj-text>
              <span class="label">冒烟测试是否通过：</span>
              <span class="$dataInfo" id="is-smoke" contenteditable="true">是</span>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section mj-class="table">
          <mj-column>
            <mj-text>
              <span class="label">埋点并自测是否通过：</span>
              <span class="$dataInfo" id="is-tracklog" contenteditable="true">是</span>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section mj-class="table">
          <mj-column>
            <mj-text>
              <span class="label">接口测试是否通过：</span>
              <span class="$dataInfo" id="is-interface" contenteditable="true">是</span>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section mj-class="table">
          <mj-column>
            <mj-text>
              <span class="label">计划提测时间：</span>
              <span class="$dataInfo" id="test-time" contenteditable="true">${(0, util_1.DateFormat)({ format: `y/m/d` })}</span>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section mj-class="table table-bottom">
          <mj-column>
            <mj-text>
              <span class="label">计划上线时间：</span>
              <span class="$dataInfo" id="online-time" contenteditable="true">${(0, util_1.DateFormat)({ format: `y/m/d` })}</span>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section>
          <mj-column>
            <mj-text mj-class="title" font-size="25px">以下为受到影响的页面集合</mj-text>
          </mj-column>
        </mj-section>

        <mj-section padding="0">
         <mj-column>
           <mj-text>
             <div class="type-Line">
               <i style="background-color:${c1}"></i>
               <span style="color:${c1}">重度依赖</span>
               <i style="background-color:${c2}"></i>
               <span style="color:${c2}">中度依赖</span>
               <i style="background-color:${c3}"></i>
               <span style="color:${c3}">轻度依赖</span>
             </div>
           </mj-text>
         </mj-column>
       </mj-section>

        <mj-section padding="0">
          <mj-column>
            <mj-text>
              <div id="pages">${pages}</div>
            </mj-text>
          </mj-column>
        </mj-section>

      </mj-wrapper>
    </mj-body>
  </mjml>
  `;
        return (0, mjml_1.default)(tempStr, {
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
        }).html;
    });
}
exports.emailTemplate = emailTemplate;
