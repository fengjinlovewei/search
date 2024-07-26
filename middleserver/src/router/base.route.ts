import Router from 'koa-router';
import { indexPage } from '../controller/base.controller';

const route = new Router({ prefix: '/' });

//route.post('/rootData', rootData);
route.get('/', indexPage);

export default route;
