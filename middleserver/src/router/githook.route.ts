import Router from 'koa-router';
import { gitBase } from '../controller/githook.controller';

const route = new Router({ prefix: '/githook' });

route.post('/', gitBase);

export default route;
