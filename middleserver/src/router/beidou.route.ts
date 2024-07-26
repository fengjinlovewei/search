import Router from 'koa-router';
import { getDayData } from '../controller/beidou.controller';

const route = new Router({ prefix: '/beidou' });

route.post('/getDays', getDayData);

export default route;
