import { RootState } from '@/store';
import { ActionContext } from 'vuex';
import { axiosIndexData } from '@/api';

type globalLoading = boolean;

type contextType = ActionContext<coreStoreType, RootState>;

export interface coreStoreType {
  coreData: OutputJsonType;
  coreTab: TabType;
  globalLoading: globalLoading;
}

const state = (): coreStoreType => ({
  coreData: window.DATA,
  coreTab: window.TAB,
  globalLoading: false,
});

// getters
const getters = {
  changeList(state: coreStoreType, getters: any, rootState: any) {
    return state.coreData?.change || [];
  },
  treeList(state: coreStoreType, getters: any, rootState: any) {
    return state.coreData?.tree || [];
  },
  // cartProducts: (state, getters, rootState) => {
  //   return state.items.map(({ id, quantity }) => {
  //     const product = rootState.products.all.find(
  //       (product) => product.id === id
  //     );
  //     return {
  //       id: product.id,
  //       title: product.title,
  //       price: product.price,
  //       quantity,
  //     };
  //   });
  // },
  // cartTotalPrice: (state, getters) => {
  //   return getters.cartProducts.reduce((total, product) => {
  //     return total + product.price * product.quantity;
  //   }, 0);
  // },
};

// actions
const actions = {
  async setGlobalLoading({ commit }: contextType, status: globalLoading) {
    commit('setGlobalLoading', status);
  },
  // async checkout({ commit, state }, products) {
  //   const savedCartItems = [...state.items];
  //   commit('setCheckoutStatus', null);
  //   // empty cart
  //   commit('setCartItems', { items: [] });
  //   try {
  //     commit('setCheckoutStatus', 'successful');
  //   } catch (e) {
  //     console.error(e);
  //     commit('setCheckoutStatus', 'failed');
  //     // rollback to the cart saved before sending the request
  //     commit('setCartItems', { items: savedCartItems });
  //   }
  // },
  // addProductToCart({ state, commit }, product) {
  //   commit('setCheckoutStatus', null);
  //   if (product.inventory > 0) {
  //     const cartItem = state.items.find((item) => item.id === product.id);
  //     if (!cartItem) {
  //       commit('pushProductToCart', { id: product.id });
  //     } else {
  //       commit('incrementItemQuantity', cartItem);
  //     }
  //     // remove 1 item from stock
  //     commit(
  //       'products/decrementProductInventory',
  //       { id: product.id },
  //       { root: true }
  //     );
  //   }
  // },
};

// mutations
const mutations = {
  setGlobalLoading(state: coreStoreType, status: boolean) {
    state.globalLoading = status;
  },
  setCoreData(state: coreStoreType, data: OutputJsonType) {
    state.coreData = data;
  },
  setCoreTab(state: coreStoreType, tab: TabType) {
    state.coreTab = tab;
  },
  // pushProductToCart(state, { id }) {
  //   state.items.push({
  //     id,
  //     quantity: 1,
  //   });
  // },
  // incrementItemQuantity(state, { id }) {
  //   const cartItem = state.items.find((item) => item.id === id);
  //   cartItem.quantity++;
  // },
  // setCartItems(state, { items }) {
  //   state.items = items;
  // },
  // setCheckoutStatus(state, status) {
  //   state.checkoutStatus = status;
  // },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
