// axios配置
import Axios from 'axios';
import { rootURL, middleNodeURL } from './api.config';

//import store from '@/redux/store'
//import qs from 'qs'

/* 添加一个计数器 */
let needLoadingRequestCount = 0;

function showFullScreenLoading() {
  if (needLoadingRequestCount === 0) {
    //store.dispatch(setLoading(true));
  }
  needLoadingRequestCount++;
}

function tryHideFullScreenLoading() {
  if (needLoadingRequestCount <= 0) return;
  needLoadingRequestCount--;
  if (needLoadingRequestCount === 0) {
    //store.dispatch(setLoading(false));
  }
}

export const AxiosInit = ({ contentType = '', baseURL = '' }) => {
  const axios = Axios.create({
    //withCredentials: true,
    //crossDomain: true,
    baseURL,
    //timeout: 10000,
    headers: {
      'Content-Type': contentType
        ? contentType
        : 'application/json;charset=UTF-8',
      'Cache-Control': 'no-cache',
    },
  });

  axios.interceptors.request.use(
    (config) => {
      const { method, params = {} } = config;
      showFullScreenLoading();
      // 这个字段有时会有特殊字符，需要编码
      // if (method === 'get' && params.resource) {
      //   params.resource = encodeURIComponent(params.resource);
      //   console.log(config);
      // }
      return config;
    },
    (err) => {
      tryHideFullScreenLoading();
      // notification.error({
      //   message: '网络错误',
      //   duration: null,
      //   className: 'notification-text-style',
      //   description: JSON.stringify(err),
      // });
      console.log('err');
      return Promise.reject(err);
    }
  );

  // code状态码拦截
  axios.interceptors.response.use(
    (res) => {
      tryHideFullScreenLoading();
      const { status, data = {} } = res;
      if (status === 200 || status === 204 || status === 304) {
        if (data.code !== 0) {
          // notification.error({
          //   message: '返回错误',
          //   duration: null,
          //   className: 'notification-text-style',
          //   description: JSON.stringify(res.data),
          // });
          return Promise.reject(res);
        }
        return data;
      }

      // notification.error({
      //   message: '请求错误',
      //   duration: null,
      //   className: 'notification-text-style',
      //   description: JSON.stringify(res.data),
      // });
      return Promise.reject(res);
    },
    (err) => {
      tryHideFullScreenLoading();
      console.log(err);
      // notification.error({
      //   message: '网络错误',
      //   duration: null,
      //   className: 'notification-text-style',
      //   description: JSON.stringify(err),
      // });
      return Promise.reject(err.response.data);
    }
  );

  return axios;
};

const rootFORM = AxiosInit({
  contentType: 'application/x-www-form-urlencoded;charset=UTF-8',
  baseURL: rootURL,
});

const rootJSON = AxiosInit({
  contentType: 'application/json;charset=UTF-8',
  baseURL: rootURL,
});

const middleNodeFORM = AxiosInit({
  contentType: 'application/x-www-form-urlencoded;charset=UTF-8',
  baseURL: middleNodeURL,
});

const middleNodeJSON = AxiosInit({
  contentType: 'application/json;charset=UTF-8',
  baseURL: middleNodeURL,
});

export default AxiosInit;

export {
  rootFORM,
  rootJSON,
  middleNodeFORM,
  middleNodeJSON,
  rootURL,
  middleNodeURL,
};
