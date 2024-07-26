import Router from 'koa-router';
import { sendEmail } from '../controller/email.controller';

const route = new Router({ prefix: '/email' });

//route.post('/rootData', rootData);
route.post('/send', sendEmail);

export default route;
