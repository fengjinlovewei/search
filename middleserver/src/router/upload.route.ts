import Router from 'koa-router';
import { uploadFile } from '../controller/upload.controller';

const route = new Router({ prefix: '/upload' });

//route.post('/rootData', rootData);
route.post('/file', uploadFile);

export default route;
