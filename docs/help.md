# 帮助文档

## md 文档增加iframe的html显示

1. html文档存储在 `src\.vuepress\public` 文件夹下

2. 在md文档中输入如下内容:

```html
<iframe src="/html/log.html" width="100%" height="800"></iframe>
```

## 插入图片

1. 添加图片 在`src\.vuepress\public\assets` 

2. 在md文档中输入如下内容:
<img :src="$withBase('/assets/images/high-concurrency-design-1.png')" 
  alt=""
  width="800px" 
  height="auto">

## 文件下载

文件需要通过 <a :href="$withBase('./xxx/xxx.pdf')">下载 PDF</a> 这种方式来动态引入

## 修改样式

* `src/.vuepress/styles/config.scss` [修改主题色]
* `src/.vuepress/styles/index.scss` [修改局部样式]
* `src/.vuepress/styles/palette.scss` [修改全局变量设置]

## vercel部署文档

![alt text](./deploy)