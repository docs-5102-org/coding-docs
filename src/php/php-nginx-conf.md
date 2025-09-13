---
title: PHP Nginx配置教程
category:
  - PHP
---

# PHP Nginx配置教程

## 目录

[[toc]]

## 概述

本教程将详细介绍如何配置Nginx来运行PHP应用程序，包括基础配置、安全设置、性能优化等多个方面。

## 基础配置结构

### 1. 基本的PHP站点配置

```nginx
server {
    listen 80;
    server_name example.com www.example.com;
    
    charset UTF-8;
    
    # 日志配置
    access_log /var/log/nginx/example.access.log;
    error_log /var/log/nginx/example.error.log;
    
    # 错误页面
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
    
    # 网站根目录
    root /var/www/html/example;
    index index.php index.html index.htm;
    
    # PHP处理配置
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass 127.0.0.1:9000;  # 或者 unix:/var/run/php/php8.1-fpm.sock
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
    
    # 静态文件处理
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
```

### 2. 带伪静态的PHP配置（适用于框架）

```nginx
server {
    listen 80;
    server_name framework-site.com;
    
    root /var/www/framework-site/public;
    index index.php index.html;
    
    # 伪静态规则 - 适用于大多数PHP框架
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    # 特定框架的伪静态规则（如ThinkPHP）
    location / {
        if (!-e $request_filename) {
            rewrite ^/(.*)$ /index.php?s=$1 last;
        }
    }
    
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        
        # 增加超时时间
        fastcgi_read_timeout 300;
        fastcgi_connect_timeout 300;
        fastcgi_send_timeout 300;
    }
}
```

## 不同PHP框架的配置示例

### 3. Laravel项目配置

```nginx
server {
    listen 80;
    server_name laravel-app.com;
    
    root /var/www/laravel-app/public;
    index index.php;
    
    # Laravel的伪静态规则
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    # 处理PHP文件
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $realpath_root;
    }
    
    # 阻止访问敏感文件
    location ~ /\. {
        deny all;
    }
    
    location ~ /\.ht {
        deny all;
    }
}
```

### 4. WordPress配置

```nginx
server {
    listen 80;
    server_name wordpress-site.com;
    
    root /var/www/wordpress;
    index index.php index.html;
    
    # WordPress伪静态规则
    location / {
        try_files $uri $uri/ /index.php?$args;
    }
    
    # 处理PHP文件
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
    
    # WordPress特殊规则
    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }
    
    location = /robots.txt {
        allow all;
        log_not_found off;
        access_log off;
    }
    
    # 阻止访问wp-config.php等敏感文件
    location ~* /(wp-config\.php|readme\.html|license\.txt)$ {
        deny all;
    }
}
```

### 5. Symfony项目配置

```nginx
server {
    listen 80;
    server_name symfony-app.com;
    
    root /var/www/symfony-app/public;
    
    location / {
        try_files $uri /index.php$is_args$args;
    }
    
    location ~ ^/index\.php(/|$) {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $realpath_root;
        internal;
    }
    
    # 禁止直接访问其他PHP文件
    location ~ \.php$ {
        return 404;
    }
}
```

### 5.1 ptcms 项目配置

```conf
server {
     
    listen 91;
    server_name  127.0.0.1;
	
	charset UTF-8;
    
	access_log  /usr/local/nginx/logs/ptcms.access.log;
    error_log /usr/local/nginx/logs/ptcms.error.log;
	
	error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root html;
    }
	
	root /home/daizhao/ptcms/public;
	index index.html index.htm index.php default.html default.htm default.php;
	
	#伪静态设置
	location / {
	if (!-e $request_filename){
	rewrite ^/(.*) /index.php?s=$1 last;           
	break;     
	} 
	}

	
    #这个配置很关键 没有跑不了图片的静态资源等
    #location ~ \.(htm|html|gif|jpg|jpeg|png|ico|rar|css|js|zip|txt|flv|swf|doc|ppt|xls|pdf|ttf|woff|svg|eot)$ {  
    #	root /home/daizhao/ptcms/public/; #这是网站根目录 也就是静态资源的根目录
    #	if (-f $request_filename) {
    #	   expires 1d;
    #	   break;
    #	}
    #}
    
    location ~ \.php$ {
   	include fastcgi_params;
    fastcgi_pass 127.0.0.1:9000;
    fastcgi_index index.php;
	#这里的$document_root$等同于上面的root，如：fastcgi_param SCRIPT_FILENAME /home/daizhao/ptcms/public$fastcgi_script_name;
	fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }	
	 
}
```

## 安全配置

### 6. 带安全增强的配置

```nginx
server {
    listen 80;
    server_name secure-php-site.com;
    
    root /var/www/secure-site;
    index index.php;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'" always;
    
    # 隐藏Nginx版本号
    server_tokens off;
    
    # 基本伪静态
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    # PHP处理
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php8.1-fmp.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        
        # 安全参数
        fastcgi_param HTTP_PROXY "";
        fastcgi_intercept_errors on;
    }
    
    # 阻止访问敏感文件和目录
    location ~ /\.(ht|git|svn) {
        deny all;
    }
    
    location ~ /(vendor|node_modules|storage|bootstrap\/cache) {
        deny all;
    }
    
    # 阻止执行上传目录中的PHP文件
    location ~* ^/uploads/.*\.php$ {
        deny all;
    }
}
```

## 性能优化配置

### 7. 高性能PHP站点配置

```nginx
upstream php-fpm {
    server unix:/var/run/php/php8.1-fpm.sock;
    keepalive 16;
}

server {
    listen 80;
    server_name high-performance-site.com;
    
    root /var/www/high-performance-site;
    index index.php;
    
    # 开启gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
        expires 1M;
        add_header Cache-Control "public, immutable";
        access_log off;
        
        # 开启sendfile
        sendfile on;
        tcp_nopush on;
        tcp_nodelay on;
    }
    
    # 主要路由
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    # 优化的PHP处理
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass php-fpm;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        
        # 性能优化参数
        fastcgi_buffer_size 128k;
        fastcgi_buffers 4 256k;
        fastcgi_busy_buffers_size 256k;
        fastcgi_temp_file_write_size 256k;
        fastcgi_read_timeout 240;
        
        # 启用fastcgi缓存（需要在http块中定义）
        fastcgi_cache_bypass $skip_cache;
        fastcgi_no_cache $skip_cache;
        fastcgi_cache FASTCGI;
        fastcgi_cache_valid 60m;
    }
}
```

## 多站点配置

### 8. 多PHP版本支持配置

```nginx
# PHP 7.4站点
server {
    listen 80;
    server_name php74-site.com;
    
    root /var/www/php74-site;
    index index.php;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}

# PHP 8.1站点
server {
    listen 80;
    server_name php81-site.com;
    
    root /var/www/php81-site;
    index index.php;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

## 常见问题和解决方案

### 9. 调试配置

```nginx
server {
    listen 80;
    server_name debug-site.com;
    
    root /var/www/debug-site;
    index index.php;
    
    # 开启详细日志
    access_log /var/log/nginx/debug-site.access.log main;
    error_log /var/log/nginx/debug-site.error.log debug;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        
        # 调试参数
        fastcgi_param REMOTE_ADDR $remote_addr;
        fastcgi_param REQUEST_TIME $request_time;
        fastcgi_param QUERY_STRING $query_string;
    }
    
    # 显示PHP信息的特殊location
    location = /phpinfo {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root/phpinfo.php;
        include fastcgi_params;
    }
}
```

## 配置要点总结

### 关键配置参数说明

1. **fastcgi_pass**: 指定PHP-FPM的监听地址
   - TCP方式: `127.0.0.1:9000`
   - Unix Socket方式: `unix:/var/run/php/php8.1-fpm.sock`

2. **SCRIPT_FILENAME**: 必须正确设置，否则会出现404错误
   - 推荐使用: `$document_root$fastcgi_script_name`

3. **try_files**: 用于处理伪静态规则
   - 通用格式: `try_files $uri $uri/ /index.php?$query_string;`

4. **静态文件处理**: 合理设置缓存和压缩

5. **安全设置**: 阻止访问敏感文件和目录

### 性能优化建议

1. 使用Unix Socket连接PHP-FPM
2. 开启gzip压缩
3. 设置合理的缓存策略
4. 使用fastcgi缓存
5. 优化fastcgi缓冲区参数

### 常见错误排查

1. **404错误**: 检查SCRIPT_FILENAME参数
2. **502错误**: 检查PHP-FPM是否运行，连接方式是否正确
3. **静态文件无法访问**: 检查静态文件处理规则
4. **伪静态不生效**: 检查try_files配置

这个配置教程涵盖了从基础到高级的各种场景，可以根据实际需求选择合适的配置方案。