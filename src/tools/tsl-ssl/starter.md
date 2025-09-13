---
source: https://freessl.cn/
---

# 免费证书申请 & nginx  docker 安装部署证书

## 官网

https://freessl.cn/

## 证书普及

[SSL 证书格式普及 PEM、CER、JKS、PKCS12](./ssl.md)

## 证书申请& 配置教程

[https 免费证书 ACME v2证书自动化](https://blog.freessl.cn/acme-quick-start/)

## 什么是https协议？ 

https协议是由SSL+http协议构建的安全协议，支持加密传输和身份认证, 安全性比http要更好，因为数据的加密传输，更能保证数据的安全性和完整性。

nginx / docker  nginx容器下 配置 https ssl 证书

**一、nginx 配置ssl 证书**

```conf

server {
    listen 80;
    #填写绑定证书的域名
    server_name http://miliqkadmin.motopa.cn;
    #把http的域名请求转成https，相当于用户访问http也可以自动跳转到https，避免出现网页提示不安全  
    #用地址重写规则 rewrite ^(.*)$ https://${server_name}$1 permanent;
    return 301 https://$host$request_uri;
}

server {
    #miliqk-manage-web 前端
     listen  443 ssl;

    #证书配置开始=================================================
    #证书文件名称
    ssl_certificate_key /etc/nginx/ssl/miliqkadmin.motopa.cn.key;
    #私钥文件名称 .crt和.pem都可以用
    ssl_certificate /etc/nginx/ssl/fullchain.cer;
    ssl_session_timeout 5m;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
    ssl_prefer_server_ciphers on;
    #证书配置结束=================================================

    server_name  https://miliqkadmin.motopa.cn;

    #root /home/daizhao/apps/web/miliqk-manage-dev;     

    location /api/ {
    #rewrite  ^/api/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:9330/;
    proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 100m;
        client_body_buffer_size 128k;
        proxy_connect_timeout   300;
        proxy_send_timeout      300;
        proxy_read_timeout      300;
        proxy_buffer_size       4k;
        proxy_buffers           4 32k;
        proxy_busy_buffers_size 64k;
        proxy_temp_file_write_size 64k;
    }

    location ^~ /fmsf {
        root /home/daizhao/static/miliqk;
        proxy_set_header Host $host;
        expires 30d;
        access_log off;
    }

    location / {
        root   /home/daizhao/web/miliqk-manage-web-dev;
        try_files $uri $uri/ /index.html;
        index  index.html index.htm;
    }

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   html;
    }

}
```

**二 、docker nginx容器下 配置 https ssl 证书**

**1.基于docker-compose 部署容器 nginx,docker-compose.yml配置如下：**

```yml
version: '3'
services:
  nginx:
    image: nginx:latest          #镜像名称
    container_name: nginx        #设置容器名称
    restart: always              #跟随docker的启动而启动
    network_mode: host           #网络端口模式为主机 设置这个以后 不能再设置端口，类似docker --net:host
    volumes:                     #挂载卷命令
      - /mnt/data/docker-mount/nginx/conf/nginx.conf:/etc/nginx/nginx.conf                #映射配置文件入口文件
      - /mnt/data/docker-mount/nginx/html:/usr/share/nginx/html                           #nginx静态资源根目录挂载         
      - /mnt/data/docker-mount/nginx/logs:/var/log/nginx                                  #日志文件挂载        
      - /mnt/data/docker-mount/nginx/conf.d:/etc/nginx/conf.d                             #映射配置文件
      - /mnt/data/docker-mount/nginx/ssl:/etc/nginx/ssl                                   #挂载证书配置目录  
      - /home/daizhao/web:/home/daizhao/web                                                   #自定义扩展静态资源目录挂载
      - /home/daizhao/static:/home/daizhao/static                                             #自定义扩展静态资源目录挂载
    #ports:                       #宿主主机端口80 映射到 容器端口80
    # - 80:80   
```

**2.配置文件跟nginx配置的文件一样，这里区别一下路径**

#如果在linux中直接安装nginx，是可以直接写全路径的
# 私钥文件名称 .crt/.pem/.cer都可以用
# 证书key .pem/.key都可以用
ssl_certificate /etc/letsencrypt/live/www.goodstudy.top/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/www.goodstudy.top/privkey.pem;

#证书挂载到docker中的路径
ssl_certificate /etc/nginx/cert/fullchain.pem;
ssl_certificate_key /etc/nginx/cert/privkey.pem;

**3.重要说明**
**1)、/mnt/data/docker-mount/nginx/ssl:/etc/nginx/ssl  宿主主机目录挂载 -> nginx容器的目录**
**2)、这两个目录都必须授予权限** 
    **chown -R /mnt/data/docker-mount/nginx/ssl**
    **chown -R /etc/nginx/ssl**
**3)、挂载后，一定要重启docker-compose 而不是单单的重启 nginx容器，否则会挂载失败**

    **# 停止服务容器。**
    **docker-compose stop** 
    **# 后台启动**
    **docker-compose up -d**

**三、其他第三方的 nginx、docker 容器下的nginx 配置方案**
**1、**https://blog.csdn.net/catoop/article/details/128415821      （推荐）

2、https://blog.csdn.net/qq_35893120/article/details/119085777

3、https://www.jianshu.com/p/db2bdea49c25
**4、**https://www.jb51.net/server/288214w0z.htm

5、https://blog.csdn.net/AA2534193348/article/details/131038926

