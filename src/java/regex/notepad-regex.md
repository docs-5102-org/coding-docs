---
title: 在Notepad中使用正则表达式添加行末逗号
date: 2022-08-16
---

# 在文本编辑器中使用正则表达式在每行末尾添加逗号

本文介绍如何使用正则表达式在文本文件的每行末尾添加逗号。这个技巧适用于Notepad++等支持正则表达式的文本编辑器。

## 步骤一：添加行末逗号

在"查找和替换"对话框中：

- 查找目标：`\n`
- 替换为：`,\n`
- 建议勾选"正则表达式"选项

<img :src="$withBase('/assets/images/regex/notepad-1.png')" 
  alt="图片"
  height="auto">

## 步骤二：清理多余的逗号（如果需要）

如果文件使用 Windows 格式的换行符（CRLF），可能需要清理多余的逗号：

- 查找目标：`\r,`
- 替换为：`,`

<img :src="$withBase('/assets/images/regex/notepad-2.png')" 
  alt="图片"
  height="auto">

## 最终效果

处理后的文本将在每行末尾都添加一个逗号，如下图所示：

<img :src="$withBase('/assets/images/regex/notepad-3.png')" 
  alt="图片"
  height="auto">

::: tip
这个方法同样适用于其他支持正则表达式的文本编辑器，如 VS Code、Sublime Text 等。只需要根据具体编辑器调整正则表达式的语法即可。
:::
