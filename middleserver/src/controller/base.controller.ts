import path from 'path';
import fs from 'fs';

const projects = path.resolve(__dirname, '../views');

const ignore = ['.DS_Store', '.gitkeep'];

const indexPage = async (ctx, next) => {
  const files = fs
    .readdirSync(projects)
    .filter((item) => !ignore.includes(item));

  await ctx.render('index', {
    data: JSON.stringify(files),
    list: files,
  });
};

export { indexPage };
