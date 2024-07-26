import Router from 'koa-router';
import {
  setTracklog,
  setTracklogGif,
  getTracklog,
  delTracklog,
} from '../controller/tracklog.controller';

const route = new Router({ prefix: '/tracklog' });

route.get('/empty', setTracklog);
route.get('/empty.gif', setTracklogGif);
route.get('/getTracklog', getTracklog);
route.get('/delTracklog', delTracklog);

export default route;
