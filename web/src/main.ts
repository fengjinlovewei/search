import { createApp } from 'vue';
import router from '@/router';
import { store, key } from '@/store';
import App from '@/App.vue';
// import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/el-message.css';

const app = createApp(App);

app.use(router);
app.use(store, key);

app.mount('#app');
