import Router from 'koa-router';
import { sendEmail } from '../controller/base.controller';

const route = new Router({ prefix: '/base' });

//route.post('/rootData', rootData);
route.post('/sendEmail', sendEmail);

export default route;
