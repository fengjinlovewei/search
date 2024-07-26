## 本地使用docker-compose安装mysql数据库

1. 确保本地安装了 docker-compose，一般安装docker客户端自动安装这个
2. 使用 docker-compose --version 看看是否安装
3. 进入 middleserver 目录运行：docker-compose up -d search-mysql
4. 本地就会生成一个mysql的docker镜像服务

## 服务端使用

1. 确保服务安装了 docker-compose，一般安装docker客户端自动安装这个
2. 使用 docker-compose --version 看看是否安装
3. 建立一个空文件夹，把 docker-compose.yml 拷贝进去
4. 进入这个文件夹， 运行：docker-compose up -d search-mysql
5. 我服务端会生成一个端口为3306端口的mysql镜像服务