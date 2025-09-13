---
title: Pyinstaller 基础教程
category:
  - Python
tag:
  - Pyinstaller  
---

# PyInstaller 打包 EXE 完整指南

PyInstaller 是目前最流行的 Python 应用程序打包工具之一，能够将 Python 程序及其依赖打包成独立的可执行文件（.exe），让用户在没有 Python 环境的计算机上也能运行你的程序。

## 目录

[[toc]]

## 安装 PyInstaller

使用 pip 安装 PyInstaller：

```bash
pip install pyinstaller
```

## 基础用法

### 最简单的打包命令

```bash
pyinstaller yourscript.py
```

这个命令会创建一个 `dist` 文件夹，里面包含可执行文件和相关依赖。

### 生成单个 EXE 文件

```bash
pyinstaller --onefile yourscript.py
```

使用 `-F` 或 `--onefile` 参数可以将所有文件打包成一个独立的 .exe 文件。

## 常用参数详解

### 核心参数

- **`-F` / `--onefile`**：打包成单个可执行文件
- **`-w` / `--windowed`**：隐藏控制台窗口（GUI 应用必备）
- **`--name`**：指定生成的 exe 文件名称

```bash
pyinstaller --onefile --windowed --name MyApp yourscript.py
```

### 外观定制

- **`--icon=ICON`**：设置程序图标（.ico 格式）

```bash
pyinstaller --onefile --icon=app.ico yourscript.py
```

### 包含外部文件

- **`--add-data`**：添加数据文件，格式为 `源路径;目标路径`

```bash
# Windows 系统
pyinstaller --add-data "data.txt;." yourscript.py

# Linux/Mac 系统  
pyinstaller --add-data "data.txt:." yourscript.py
```

### 处理自定义模块

- **`--paths`**：指定模块搜索路径

当项目中有自定义模块，使用 `from xxx import xx` 时，需要指定路径：

```bash
pyinstaller --paths=./custom_modules --paths=./utils yourscript.py
```

**常见错误示例：**
```
ModuleNotFoundError: No module named 'custom_module'
Failed to execute script 'main' due to unhandled exception!
```

### 其他实用参数

- **`--clean`**：清理临时文件
- **`--distpath`**：指定输出目录
- **`--workpath`**：指定临时工作目录

## 完整示例

```bash
pyinstaller --onefile \
           --windowed \
           --icon=app.ico \
           --name=MyApplication \
           --add-data="config.json;." \
           --add-data="assets;assets" \
           --paths=./modules \
           --clean \
           main.py
```

## 常见问题与解决方案

### 1. 启动速度慢
- **原因**：`--onefile` 需要解压到临时目录
- **解决**：权衡是否必须单文件，或考虑使用目录模式

### 2. 缺少依赖模块
```bash
# 手动指定隐藏导入
pyinstaller --hidden-import=module_name yourscript.py
```

### 3. 文件路径问题
在代码中使用相对路径时，需要获取正确的资源路径：

```python
import sys
import os

def resource_path(relative_path):
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

# 使用示例
config_path = resource_path('config.json')
```

## 打包前检查清单

- [ ] 确保程序在 Python 环境中正常运行
- [ ] 安装所有必需的依赖包
- [ ] 准备好图标文件（.ico 格式）
- [ ] 确认需要包含的数据文件
- [ ] 测试自定义模块的导入路径

## 类似的 Python 打包工具推荐

### 1. **cx_Freeze**
- 跨平台支持（Windows, Mac, Linux）
- 配置相对复杂但功能强大
- 适合需要精细控制打包过程的项目

```bash
pip install cx_freeze
```

### 2. **auto-py-to-exe**
- PyInstaller 的图形界面版本
- 可视化操作，适合新手
- 基于 Web 界面，操作直观

```bash
pip install auto-py-to-exe
auto-py-to-exe
```

### 3. **Nuitka**
- 将 Python 编译成 C++，性能更好
- 生成的可执行文件更小更快
- 支持渐进式编译

```bash
pip install nuitka
```

### 4. **py2exe**（仅 Windows）
- Windows 专用打包工具
- 历史悠久，稳定性好
- 配置方式与 PyInstaller 不同

### 5. **briefcase**
- Django 软件基金会开发
- 支持打包成多种格式（exe, dmg, AppImage）
- 适合跨平台应用开发

### 6. **pyapp**
- 轻量级打包工具
- 专注于简单快速的打包
- 适合小型项目

## 性能对比

| 工具 | 文件大小 | 启动速度 | 跨平台 | 易用性 |
|------|----------|----------|--------|--------|
| PyInstaller | 较大 | 中等 | 优秀 | 简单 |
| cx_Freeze | 中等 | 快 | 优秀 | 复杂 |
| Nuitka | 较小 | 很快 | 优秀 | 中等 |
| auto-py-to-exe | 较大 | 中等 | 优秀 | 很简单 |

## 最佳实践建议

1. **开发阶段**：使用 auto-py-to-exe 快速测试
2. **生产环境**：使用 PyInstaller 或 cx_Freeze
3. **性能要求高**：考虑 Nuitka
4. **简单脚本**：PyInstaller 的 `--onefile` 即可
5. **复杂项目**：使用 cx_Freeze 进行精细控制

选择合适的工具取决于你的具体需求、项目复杂度和目标平台。PyInstaller 仍然是大多数情况下的最佳选择，因为它易用性和功能性的平衡做得最好。