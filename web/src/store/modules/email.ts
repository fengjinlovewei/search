import { RootState } from '@/store';
import { ActionContext } from 'vuex';

type emailVisible = boolean;
type emailHTML = string;
type emailIframe = Window | null;

export interface emailStoreType {
  emailVisible: emailVisible;
  emailHTML: emailHTML;
  emailIframe: emailIframe;
}

const state = (): emailStoreType => ({
  emailVisible: false,
  emailHTML: '',
  emailIframe: null,
});

// getters
const getters = {};

// actions
const actions = {};

// mutations
const mutations = {
  setEmailVisible(state: emailStoreType, status: emailVisible) {
    console.log(status);
    state.emailVisible = status;
  },
  setEmailHTML(state: emailStoreType, htmlStr: emailHTML) {
    state.emailHTML = htmlStr;
  },
  setEmailIframe(state: emailStoreType, htmlStr: emailIframe) {
    state.emailIframe = htmlStr;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
