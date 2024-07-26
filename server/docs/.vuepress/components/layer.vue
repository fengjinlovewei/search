<template>
  <div class="layer-box">
    <div class="layer-info" v-show="show">
      <div v-for="item in list">
        {{ item.os }}
        {{ item.ua58 }}
      </div>
    </div>

    <div>
      <div>
        <el-button size="mini" v-if="list.length" @click="getData"
          >点我显示真实上报数据</el-button
        >
      </div>
      <slot></slot>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  props: ['option', 'type'],
  data() {
    return {
      list: [],
      show: false,
    };
  },
  methods: {
    async getData() {
      const res = await axios({
        method: 'get',
        url: 'http://buluo.58v5.cn/tracklog/getTracklog',
        params: this.option,
      });

      console.log(res);
    },
    showList() {
      this.show = !this.show;
    },
  },
};
</script>
<style scoped>
.layer-box {
  position: relative;
}
.layer-info {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #ccc;
}
</style>
