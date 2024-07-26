<template>
  <!-- 发送邮件弹窗 -->
  <el-dialog title="邮件预览" v-model="email.emailVisible" width="850px">
    <iframe
      :srcdoc="email.emailHTML"
      width="100%"
      height="500px"
      class="iframe-style"
      id="emailIframe"
      @load="emailIframeLoad"
    ></iframe>
    <template #footer>
      <span class="dialog-footer">
        <el-button
          type="primary"
          class="uploadBtn"
          @click="uploadVisible = true"
          >上传附件<i class="uploadNumber" v-if="fileList.length > 0">{{
            fileList.length
          }}</i></el-button
        >
        <el-button type="primary" @click="getHistory">发送邮件</el-button>
      </span>
    </template>

    <!-- 添加附件弹窗 -->
    <el-dialog
      title="上传附件"
      v-model="uploadVisible"
      append-to-body
      width="400px"
    >
      <el-upload
        class="upload-box"
        drag
        :action="uploadUrl"
        :on-success="uploadSuccess"
        :on-remove="uploadRemove"
        :before-upload="beforeAvatarUpload"
        :file-list="fileList"
        multiple
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip" slot="tip">文件不超过2M</div>
      </el-upload>
    </el-dialog>

    <!-- 发送邮件确认信息弹窗 -->
    <el-dialog
      title="信息确认"
      v-model="historyVisible"
      width="400px"
      append-to-body
    >
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item label="发件标题：" :label-width="formLabelWidth">
          <el-input v-model="form.title" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item
          label="发件人："
          :label-width="formLabelWidth"
          placeholder="例如：fengkang01"
          prop="user"
          :hide-required-asterisk="true"
        >
          <el-input v-model="form.user" autocomplete="off"></el-input>
        </el-form-item>

        <el-form-item :label-width="formLabelWidth">
          <template #label>
            <span class="startRed">发送至：</span>
          </template>
          <el-checkbox-group v-model="form.group">
            <el-checkbox
              v-for="emailGroup of defaultEmailList"
              :label="emailGroup"
              name="group"
              >{{ emailGroup }}</el-checkbox
            >
          </el-checkbox-group>
          <el-input
            type="textarea"
            v-model="form.toUserList"
            autocomplete="off"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="historyVisible = false">取 消</el-button>
          <el-button type="primary" @click="sendEmail(formRef)"
            >确 定</el-button
          >
        </span>
      </template>
    </el-dialog>

    <!-- 图片控制 -->
    <el-dialog
      :title="'图片控制'"
      v-model="imageVisible"
      append-to-body
      :modal="false"
      top="5vh"
      width="600px"
    >
      <el-slider v-model="currentImageWidth" :show-tooltip="false"></el-slider>
      <div slot="footer" class="dialog-footer"></div>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watchEffect, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import _ from 'lodash';
import { useStore } from '@/store';
import {
  uploadUrl,
  axiosGetHistory,
  axiosSendEmail,
  axiosSetHistory,
} from '@/api';
import { openIde } from '@/util';

const store = useStore();

console.log('store', store);

const { core, email } = store.state;

const fileList = ref<any>([]);

// 附加弹窗
const uploadVisible = ref(false);

const historyVisible = ref(false);

const defaultEmailList = ref(['teg_rdm_UGGqa', 'gp-fe', 'information-server']);

const formRef = ref<FormInstance>();

let currentImageSetStyle = (value: number) => {};

const currentImageWidth = ref(0);

watchEffect(() => {
  currentImageSetStyle(currentImageWidth.value);
});

const imageVisible = ref(false);

const form = reactive<{
  title: string;
  user: string;
  toUserList: string;
  group: string[];
}>({
  title: '',
  user: '',
  toUserList: '',
  group: [],
});

const rules = reactive<FormRules>({
  user: [{ required: true, message: '请输入发件人', trigger: 'blur' }],
});

const formLabelWidth = '100px';

let emailIframe: Window | null = null;

const emailIframeClick = (e: Event) => {
  console.log(e);
  //
  try {
    // @ts-ignore
    const label: string = e.target?.dataset?.file;
    label && openIde(label);
  } catch (e) {
    console.log(e);
  }
};

const observer = new MutationObserver((mutationsList, observer) => {
  window.emailCache = emailIframe?.document.documentElement.outerHTML || '';
});

onUnmounted(() => {
  emailIframe?.removeEventListener('click', emailIframeClick);
  //停止观察
  observer.disconnect();
});

const emailIframeLoad = () => {
  const iframeElement = document.getElementById(
    'emailIframe'
  ) as HTMLIFrameElement;

  emailIframe = iframeElement.contentWindow;

  if (emailIframe) {
    emailIframe.addEventListener('click', emailIframeClick);
    observer.observe(emailIframe.document, {
      attributes: true,
      subtree: true,
      characterData: true,
    });
  }
  addImages();
};

const addImages = () => {
  if (!emailIframe) return;
  const $dataInfo = emailIframe.document.getElementsByClassName('$dataInfo');
  const IMAGE = emailIframe.document.getElementsByClassName('IMAGE');

  const $dataInfoArr = Array.from($dataInfo);
  const IMAGEArr = Array.from(IMAGE) as HTMLImageElement[];

  IMAGEArr.forEach((item) => {
    item.onclick = function (event: Event) {
      const width = parseInt(item.style.width);
      currentImageSetStyle = (w: number) => {
        item.setAttribute(
          'style',
          `max-width:100%;cursor: pointer;width:${w}%;`
        );
      };
      currentImageWidth.value = width;
      imageVisible.value = true;
    };
  });

  function readAndPreview(file: any, context: any) {
    // 确保 `file.name` 符合我们要求的扩展名
    if (/\.(jpe?g|png|gif)$/i.test(file.name)) {
      const reader = new FileReader();

      reader.addEventListener(
        'load',
        function () {
          const image: HTMLImageElement = new Image();
          image.title = file.name;
          image.src = this.result as string;
          image.id = _.uniqueId('IMAGE');
          image.className = 'IMAGE';
          let width = 0;
          const setStyle = (w: number) => {
            width = w;
            image.setAttribute(
              'style',
              `max-width:100%;cursor: pointer;width:${width}%;`
            );
          };

          context.appendChild(image);
          image.onload = function () {
            setStyle((image.width / 718) * 100);
            image.onclick = function () {
              currentImageSetStyle = setStyle;
              currentImageWidth.value = width;
              imageVisible.value = true;
            };
          };
        },
        false
      );

      reader.readAsDataURL(file);
    }
  }

  function handleEvent(event: Event) {
    event.preventDefault();

    // 当可拖动的元素进入可放置的目标高亮目标节点
    if (event.type == 'dragenter') {
      // @ts-ignore
      if (event.target?.className == '$dataInfo') {
        // @ts-ignore
        event.target.style.background = '#409eff';
      }
    }

    // 当可拖动的元素离开可放置的目标高亮目标节点
    if (event.type == 'dragleave') {
      // @ts-ignore
      if (event.target?.className == '$dataInfo') {
        // @ts-ignore
        event.target.style.background = '';
      }
    }

    if (event.type == 'drop') {
      // @ts-ignore
      event.target.style.background = '';
      // @ts-ignore
      const files = Array.from(event.dataTransfer.files);
      if (files) {
        Array.from(files).forEach((file) => {
          // @ts-ignore
          readAndPreview(file, this);
        });
      }
    }
  }
  $dataInfoArr.forEach((dropTarget) => {
    dropTarget.addEventListener('dragenter', handleEvent);
    dropTarget.addEventListener('dragleave', handleEvent);
    dropTarget.addEventListener('drop', handleEvent);
  });
};

const getHistory = async () => {
  const data = await axiosGetHistory();

  if (data.code != 0) return;

  const {
    toUserList = [],
    group = defaultEmailList.value,
    title = `提测-${core?.coreData?.iworkId}`,
    user = core?.coreData?.commit['%cn'],
  } = data.data;

  form.title = title;
  form.user = user;
  form.toUserList = toUserList.join(',');
  form.group = group;

  historyVisible.value = true;
};

const uploadSuccess = (response: any, file: any, filelist: any[]) => {
  fileList.value = filelist;
};
const uploadRemove = (file: any, filelist: string[]) => {
  fileList.value = filelist;
};

const beforeAvatarUpload = (file: any) => {
  //const isJPG = file.type === 'image/jpeg';
  const maxMB = 2;
  const isLt2M = file.size / 1024 / 1024 < maxMB;

  // if (!isJPG) {
  //   this.$message.error('上传头像图片只能是 JPG 格式!');
  // }
  if (!isLt2M) {
    ElMessage.error(`上传头像图片大小不能超过 ${maxMB}MB!`);
  }
  return isLt2M;
};

const sendEmail = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  try {
    await formEl.validate();
  } catch (e) {
    console.log(e);
    return false;
  }

  if (form.group.length === 0 && !form.toUserList) {
    return ElMessage.error('至少得有一个收件群组或者收件个人！！');
  }

  //this.fullscreenLoading = true;
  store.commit('core/setGlobalLoading', true);

  if (!emailIframe) return;

  const Document = emailIframe.document;

  const cloneDocument = Document.cloneNode(true) as Document;

  const pages = cloneDocument.getElementById('pages');

  const deleteIcon: HTMLElement[] = Array.from(
    cloneDocument.querySelectorAll('.delete')
  );

  deleteIcon.forEach((item) => {
    item.style.display = 'none';
  });

  const deleteCheck: HTMLInputElement[] = Array.from(
    cloneDocument.querySelectorAll('.md-input-delete')
  );

  deleteCheck.forEach((item) => {
    if (item.checked && pages && item.parentNode) {
      pages.removeChild(item.parentNode);
    }
  });

  const HTML = cloneDocument.documentElement.innerHTML;

  const innerHTML = /<body[\s|\S]*<\/body>/.exec(HTML);

  const body = innerHTML ? innerHTML[0] : '';

  const emailHTML = email.emailHTML.replace(/<body[\s|\S]*<\/body>/, body);

  const toUserList = form.toUserList.split(/,|，/).filter(Boolean);

  const html = emailHTML.replace(/contenteditable=\"true\"/g, '');

  if (html.length > 800 * 1024) {
    //this.fullscreenLoading = false;
    store.commit('core/setGlobalLoading', false);
    return ElMessage.error('文件过大，请压缩图片！');
  }

  const json = {
    html,
    title: form.title,
    user: form.user,
    // pass: this.form.pass,
    iworkId: core.coreData.iworkId,
    toUserList: [...form.group, ...toUserList],
    files: fileList.value.map((item: any) => {
      return {
        filename: item.name,
        pathname: item.response.data.pathname,
      };
    }),
  };

  try {
    const data = await axiosSendEmail(json);

    //this.fullscreenLoading = false;
    store.commit('core/setGlobalLoading', false);

    if (data.err) {
      if (data.err.responseCode === 535) {
        return ElMessage.error('身份验证失败');
      }
      return ElMessage.error('身份验证失败-2');
    }
    if (data.code === 0) {
      store.commit('email/setEmailVisible', false);

      historyVisible.value = false;
      fileList.value = [];

      ElMessage.success('发送成功');

      return await axiosSetHistory({
        title: form.title,
        user: form.user,
        toUserList, // 输入字符串的发件人
        group: form.group, // 群组里的发件人
      });
    }
  } catch (e) {
    console.log(e);
  }

  store.commit('core/setGlobalLoading', false);
  ElMessage.error('发送失败');
};
</script>

<style>
.uploadBtn {
  position: relative;
}
.uploadNumber {
  position: absolute;
  top: -5px;
  right: -5px;
  font-style: normal;
  display: inline-block;
  width: 20px;
  line-height: 20px;
  color: #fff;
  background-color: #f01010;
  border-radius: 50%;
}
</style>
