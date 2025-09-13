---
title: UEditor 教程
category:
  - 富文本
tag:
  - UEditor
---

# UEditor 教程

## 目录

[[toc]]


## 简介

UEditor 是百度开发的富文本编辑器，功能强大且易于集成。本教程将介绍 UEditor 的基本使用、与 Spring Boot 的整合以及常见问题的解决方案。

## 基本信息

- **官网地址**: https://github.com/fex-team/ueditor
- 注意：已经归档

## Spring Boot + Thymeleaf 整合 UEditor

### 集成步骤

在 Spring Boot 项目中集成 UEditor，主要用于实现图片上传等富文本编辑功能。

### 参考资源

- [Spring Boot + UEditor整合详解](http://blog.csdn.net/sinat_24527911/article/details/78094867)
- [UEditor集成教程](http://www.jianshu.com/p/ad9c998809e3)
- [Spring Boot集成百度UEditor](https://www.cnblogs.com/liter7/p/7745606.html)
- [UEditor使用中的常见问题](http://www.jianshu.com/p/3564b0010335)

## 视频预览功能配置

### 问题描述

UEditor 默认上传视频后显示空白，无法正常预览视频内容。

### 解决方案

#### 1. 修改 ueditor.all.js 文件

在第 17769 行找到以下代码：
```javascript
html.push(creatInsertStr( vi.url, vi.width || 420,  vi.height || 280, id + i, null, cl, 'image'));
```

修改为：
```javascript
html.push(creatInsertStr( vi.url, vi.width || 420,  vi.height || 280, id + i, null, cl, 'video'));
```

#### 2. 注释相关代码

在第 7343、7344、7346 行，注释掉以下代码：
```javascript
// var root = UE.htmlparser(html);
// me.filterInputRule(root);
// html = root.toHtml();
```

#### 3. JSP页面引入

```html
<!-- 富文本编辑器 -->
<script type="text/javascript" src="<%=path %>/plugins/ueditors/ueditor.config.js"></script>
<script type="text/javascript" src="<%=path %>/plugins/ueditors/ueditor.all.js"></script>
<link rel="stylesheet" type="text/css" href="<%=path %>/plugins/ueditors/third-party/video-js/video-js.min.css"/>
<script type="text/javascript" src="<%=path %>/plugins/ueditors/third-party/video-js/video.js"></script>
<script src="<%=path%>/js/html5media.min.js"></script>
<script type="text/javascript" src="<%=path %>/plugins/ueditors/ueditor.parse.js"></script>
<script type="text/javascript" src="<%=path %>/plugins/ueditors/lang/zh-cn/zh-cn.js"></script>
```

完成以上修改后，清理浏览器缓存并刷新页面，即可正常显示和播放视频。

## 图片上传按钮响应慢问题

### 问题描述

点击图片上传按钮时，需要等待 3-4 秒才能弹出上传窗口，响应非常缓慢。

### 原因分析

默认配置下，上传按钮会检测所有文件类型，导致程序解析时响应缓慢。

### 解决方案

#### 方案一：修改 ueditor.all.min.js

找到以下代码：
```javascript
accept="image/*"
```

修改为：
```javascript
accept="image/jpeg,image/jpg,image/png,image/gif"
```

#### 方案二：针对多图片上传

修改 `/ueditor/dialogs/image/image.js` 文件：

将：
```javascript
accept: {
    title: 'Images',
    extensions: acceptExtensions,
    mimeTypes: 'image/*'
},
```

修改为：
```javascript
accept: {
    title: 'Images',
    extensions: acceptExtensions,
    mimeTypes: 'image/gif,image/jpeg,image/png,image/jpg,image/bmp'
},
```

#### 方案三：针对单图片上传

修改 `/ueditor/ueditor.all.js` 或 `/ueditor.all.min.js` 文件：

将：
```javascript
accept="image/*"
```

修改为：
```javascript
accept="image/gif,image/jpeg,image/png,image/jpg,image/bmp"
```

### 效果

完成以上修改后，图片上传按钮将只搜索指定格式的文件，大大提升响应速度。如需支持其他格式，可在配置中自行添加。

## 总结

UEditor 作为一款功能丰富的富文本编辑器，在实际使用中可能会遇到一些性能和兼容性问题。通过合理的配置和代码修改，可以有效解决视频预览和图片上传响应慢等常见问题，提升用户体验。

在集成到 Spring Boot 项目时，建议参考相关教程并根据项目实际需求进行配置调整。