const debug = process.env.NODE_ENV !== 'production';

const development = {
  rootURL: 'http://localhost:10086',
  middleNodeURL: 'http://10.146.84.35:1991',
};

const production = {
  rootURL: '',
  middleNodeURL: 'http://10.146.84.35:1991',
};

const apiConfig = debug ? development : production;

export const rootURL = apiConfig.rootURL;
export const middleNodeURL = apiConfig.middleNodeURL;
