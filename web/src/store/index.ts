// store.ts
import { InjectionKey } from 'vue';
import {
  createStore,
  useStore as baseUseStore,
  Store,
  createLogger,
} from 'vuex';

import core, { coreStoreType } from './modules/core';

import email, { emailStoreType } from './modules/email';
// 引入vuex-ts自定义类型推断类，代码提示的核心
import { CommonStore } from './vuex_ts';

const debug = process.env.NODE_ENV !== 'production';

// 定义根级State类型
export type RootState = {
  core: coreStoreType;
  email: emailStoreType;
};

// 把多个模块聚合在一起
export const modules = {
  core,
  email,
};

export const key: InjectionKey<Store<RootState>> = Symbol('key');

export const store = createStore<RootState>({
  modules,
  //strict: debug,
  plugins: debug ? [createLogger()] : [],
}) as CommonStore;

// 定义自己的 `useStore` 组合式函数
export function useStore(): CommonStore {
  return baseUseStore(key);
}
