const getDayData = async (ctx, next) => {
  console.log(ctx);
  console.log(ctx.request.body);
};

export { getDayData };