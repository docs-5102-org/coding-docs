---
title: IDEA 常用快捷键
category:
  - 开发工具
tag:
  - IntelliJ IDEA
---

# IntelliJ IDEA 常用快捷键指南

## 目录

[[toc]]

## 设置快捷键

如需修改快捷键设置：
1. 点击 **文件菜单(File)** → **设置(Settings… Ctrl+Alt+S)**
2. 在左侧导航框中点击 **KeyMap**
3. 在右边的树型框中选择 **Main menu** → **Code** → **Completion**
4. 根据需要修改快捷键绑定

## 核心快捷键

### 最常用的快捷键
| 快捷键 | 功能描述 |
|--------|----------|
| `Ctrl+E` | 显示最近编辑的文件列表 |
| `Shift+Click` | 关闭文件 |
| `Ctrl+[` 或 `Ctrl+]` | 跳到大括号的开头/结尾 |
| `Ctrl+Shift+Backspace` | 跳转到上次编辑的地方 |
| `Ctrl+F12` | 显示当前文件的结构 |
| `Ctrl+N` | 快速打开类 |
| `Ctrl+Shift+N` | 快速打开文件 |
| `Alt+Q` | 查看当前方法的声明 |
| `Ctrl+W` | 选择单词→语句→行→函数（递进选择） |
| `Alt+F1` | 将正在编辑的元素在各个面板中定位 |

## 代码编辑

### 基础编辑
| 快捷键 | 功能描述 |
|--------|----------|
| `Alt+Enter` | 导入包，自动修正 |
| `Ctrl+Alt+L` | 格式化代码 |
| `Ctrl+Alt+O` | 优化导入的类和包 |
| `Alt+Insert` | 生成代码（getter/setter、构造函数等） |
| `Ctrl+D` | 复制行 |
| `Ctrl+X` | 删除行 |
| `Ctrl+/` 或 `Ctrl+Shift+/` | 行注释 / 块注释 |
| `Ctrl+J` | 自动代码（Live Templates） |

### 代码补全与提示
| 快捷键 | 功能描述 |
|--------|----------|
| `Ctrl+Space` | 代码提示 |
| `Ctrl+Shift+Space` | 智能代码补全 |
| `Ctrl+Alt+Space` | 类名或接口名提示 |
| `Ctrl+P` | 方法参数提示 |
| `Ctrl+Q` | 显示注释文档 |

### 查找与替换
| 快捷键 | 功能描述 |
|--------|----------|
| `Ctrl+F` | 查找文本 |
| `Ctrl+R` | 替换文本 |
| `Ctrl+Shift+F7` | 高亮显示所有相同文本 |
| `Alt+F3` | 逐个查找相同文本并高亮显示 |
| `Ctrl+F7` | 查询当前元素在当前文件中的引用 |

## 导航与跳转

### 文件导航
| 快捷键 | 功能描述 |
|--------|----------|
| `Ctrl+E` | 最近打开的文件 |
| `Alt+Shift+C` | 对比最近修改的代码 |
| `Ctrl+Alt+Left/Right` | 返回至上次浏览的位置 |
| `Alt+Left/Right` | 切换代码视图 |

### 代码导航
| 快捷键 | 功能描述 |
|--------|----------|
| `Ctrl+B` | 快速打开光标处的类或方法 |
| `Ctrl+Alt+B` | 跳转到抽象方法的实现 |
| `Alt+Up/Down` | 在方法间快速移动定位 |
| `Ctrl+Up/Down` | 光标跳转到第一行或最后一行 |
| `F2` 或 `Shift+F2` | 高亮错误或警告快速定位 |
| `Ctrl+H` | 显示类结构图 |

### 查找定位
| 快捷键 | 功能描述 |
|--------|----------|
| `Ctrl+Shift+Alt+N` | 查找类中的方法或变量 |
| `Alt+F7` | 查找使用位置 |
| `Ctrl+Shift+F7` | 高亮当前元素在当前文件中的使用 |

## 重构与生成

### 重构操作
| 快捷键 | 功能描述 |
|--------|----------|
| `Shift+F6` | 重构-重命名 |
| `Ctrl+Alt+V` | 引入变量 |
| `Ctrl+Alt+T` | 把代码包围在一块内（try/catch等） |
| `Ctrl+O` | 选择父类的方法进行重写 |
| `Ctrl+I` | 实现接口方法 |

### 代码移动
| 快捷键 | 功能描述 |
|--------|----------|
| `Ctrl+Shift+Up/Down` | 代码向上/下移动 |
| `Ctrl+Shift+J` | 合并两行 |

## 调试相关

| 快捷键 | 功能描述 |
|--------|----------|
| `Alt+F8` | 计算变量值 |
| `Ctrl+Alt+Up/Down` | 快速跳转搜索结果 |

## 界面控制

| 快捷键 | 功能描述 |
|--------|----------|
| `Alt+1` | 快速打开或隐藏工程面板 |
| `Escape` | 将焦点移到编辑器 |
| `Shift+Escape` | 将焦点移到编辑器并隐藏工具窗口 |
| `F12` | 将焦点从编辑器移到最近使用的工具窗口 |

## 剪贴板操作

| 快捷键 | 功能描述 |
|--------|----------|
| `Ctrl+Shift+V` | 选择剪贴板内容并插入 |
| `Ctrl+Shift+Insert` | 选择剪贴板内容并插入 |

## 使用技巧

1. **Live Templates**: 输入代码标签后按 `Tab` 键生成代码
2. **多重选择**: 选中文本后按 `Ctrl+W` 连续按会选择更大范围的代码块
3. **智能补全**: 在需要特定类型时使用 `Ctrl+Shift+Space` 获得更精确的建议
4. **快速文档**: 在代码补全列表中也可以使用 `Ctrl+Q` 查看文档
5. **文件结构**: 使用 `Ctrl+F12` 快速导航到类的特定成员

## 外部文档

| 快捷键 | 功能描述 |
|--------|----------|
| `Shift+F1` | 打开外部JavaDoc |
| `Ctrl+Q` | 显示快速JavaDoc |

## 官方资源链接

### JetBrains 官方文档
- **快捷键掌握指南**: https://www.jetbrains.com/help/idea/mastering-keyboard-shortcuts.html
- **快捷键配置**: https://www.jetbrains.com/help/idea/configuring-keyboard-and-mouse-shortcuts.html

### 官方快捷键参考卡片（PDF）
- **Windows/Linux 快捷键参考卡片**: https://resources.jetbrains.com/storage/products/intellij-idea/docs/IntelliJIDEA_ReferenceCard.pdf
- **macOS 快捷键参考**: https://www.jetbrains.com/help/idea/reference-keymap-mac-default.html

### 在 IDEA 中获取快捷键参考
在 IntelliJ IDEA 中，你可以通过 **Help | Keyboard Shortcuts PDF** 菜单项直接获取当前键盘映射的PDF参考卡片。

### 插件推荐
- **Key Promoter X**: 一个插件，当你使用鼠标执行命令时会显示相应的键盘快捷键弹出通知，并建议为频繁执行的命令创建快捷键

---

> **提示**: 这些快捷键可以大大提高开发效率，建议从最常用的开始逐步掌握。可以在IDEA的设置中根据个人习惯自定义快捷键。你也可以使用 **Find Action**（双击 Shift 或 Ctrl+Shift+A）来搜索命令和设置。