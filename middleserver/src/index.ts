import ENV from './config/config.default';
import App from './app';

App.listen(ENV.APP_PORT, () => {
  console.log(`server ok, port: ${ENV.APP_PORT}`);
});
