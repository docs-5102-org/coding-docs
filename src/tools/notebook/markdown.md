---
title: Markdown 教程
category:
  - 笔记工具
tag:
  - Markdown
---

# Markdown 完整教程文档



## 目录

[[toc]]

## 什么是 Markdown

Markdown 是一种轻量级标记语言，它允许人们使用易读易写的纯文本格式编写文档。Markdown 文件可以转换为 HTML、PDF 等多种格式，广泛应用于技术文档、博客写作、README 文件等场景。

## Front-Matter 介绍

### 什么是 Front-Matter

Front-Matter 是一种用于记录元数据的格式，它在 Markdown 文件中常被用于记录像标题、创建日期、作者等元数据信息。这种元数据记录在文件内容的最前面，被一对三个连字符 `---` 包围。

### Front-Matter 语法

Front-Matter 的语法基本上是 YAML 格式：

```yaml
---
title: 文章标题
date: 2022-03-20
author: John Doe
---
```

### 常用键值对

- **title**: 文章标题
- **date**: 发布日期
- **author**: 作者
- **tags / categories**: 标签/分类
- **permalink**: 永久链接

### 自定义键值对

你还可以定义自己的键，并在页面模板中使用它们：

```yaml
---
myKey: myValue
---
```

然后在页面模板中，你可以使用 `{{ page.myKey }}` 来读取这个值（具体写法取决于你使用的框架）。

### 注意事项

- 前后的 `---` 不可以缺少，否则不会被识别
- 空格、冒号等关键符号后面需要有空格，这是 YAML 的语法要求

## 基础语法

### 标题

```markdown
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题
```

### 强调

```markdown
**粗体文本**
*斜体文本*
~~删除线文本~~
```

### 列表

#### 无序列表
```markdown
- 项目1
- 项目2
  - 子项目1
  - 子项目2
```

#### 有序列表
```markdown
1. 第一项
2. 第二项
   1. 子项目1
   2. 子项目2
```

### 链接和图片

```markdown
[链接文本](https://example.com)
![图片描述](图片链接)
```

### 代码

#### 行内代码
```markdown
使用 `代码` 来标记行内代码
```

#### 代码块
````markdown
```javascript
function hello() {
    console.log("Hello, World!");
}
```
````

### 表格

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容1 | 内容2 | 内容3 |
| 内容4 | 内容5 | 内容6 |
```

### 引用

```markdown
> 这是一个引用
> 
> 可以多行引用
```

## 扩展功能

### 1. 自动生成侧边栏 TOC（目录）

许多 Markdown 编辑器和静态网站生成器支持自动生成目录功能。可以通过以下方式实现：

- 使用 `[TOC]` 标记
- 基于标题层级自动生成导航

参考资源：
- [CSDN 教程](https://blog.csdn.net/uxyheaven/article/details/49253757)
- [博客园教程](https://www.cnblogs.com/rogge7/p/7591291.html)

### 2. 分割线

#### 代码插入方式
```html
<hr style="border: none; height: 1px; width: auto; margin-left: 0;">
```

#### 快捷符号插入

使用「星号」作为分割线：
```markdown
***
```

使用「减号」作为分割线：
```markdown
---
```

使用「下划线」作为分割线：
```markdown
___
```

### 3. 嵌入视频（以 B站 为例）

```html
<iframe src="//player.bilibili.com/player.html?aid=915619819&bvid=BV1bu4y1y7sr&cid=1257131235&p=1"
scrolling="no"
width="100%"
height="400px"
border="0"
frameborder="no"
framespacing="0" allowfullscreen="true">
</iframe>
```

### 4. 表情符号

Markdown 支持 emoji 表情符号，可以通过以下方式使用：

```markdown
:smile: :heart: :thumbsup:
```

表情库资源：
- [官方 Emoji 速查表](https://www.webfx.com/tools/emoji-cheat-sheet/)
- [Unicode 表情表](https://apps.timwhitlock.info/emoji/tables/unicode)
- [第三方博客](https://blog.csdn.net/BinBinCome/article/details/128135109)
## 实用工具与资源

### 在线编辑器和工具

- [Markdown 中文网工具](http://markdown.p2hp.com/tools/index.html)

### 学习资源

- [Appinn Markdown 教程](https://www.appinn.com/markdown/)
- [简书 Markdown 教程](https://www.jianshu.com/p/0130ad32a08d)

### 应用场景

Markdown 广泛应用于：

- **静态网站生成器**：如 Hexo、Jekyll 等
- **技术文档**：API 文档、用户手册
- **博客写作**：简洁的写作体验
- **项目文档**：README 文件、CHANGELOG
- **笔记记录**：支持 Markdown 的笔记应用

## 总结

Markdown 是一种简单易学的标记语言，配合 Front-Matter 可以创建功能丰富的文档。通过掌握基础语法和扩展功能，您可以高效地创建各种类型的文档。建议从基础语法开始学习，逐步掌握高级功能，在实践中不断提升 Markdown 的使用技巧。