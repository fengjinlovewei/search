FROM node:14-alpine

# RUN sed -i 's#http://dl-cdn.alpinelinux.org#https://mirrors.ustc.edu.cn#g' /etc/apk/repositories

# RUN apk add --no-cache tzdata

ENV TZ Asia/Shanghai

WORKDIR /search

COPY . .

RUN yarn

EXPOSE 1990

CMD ["yarn", "dev"]
