import Base from '../model/base.model';

const createBase = async ({ project_name, branch, oa, change_file }) => {
  //
  const res = await Base.create({ project_name, branch, oa, change_file });

  console.log(res);

  return res;
};

export { createBase };
