---
title: FFmpeg 入门指南
category:
  - 音视频
tag:
  - FFmpeg
---

# FFmpeg 入门指南

## 什么是 FFmpeg

FFmpeg 是一套可以用来记录、转换数字音频、视频，并能将其转化为流的开源计算机程序。它提供了录制、转换以及流化音视频的完整解决方案，包含了非常先进的音频/视频编解码库 libavcodec。FFmpeg 是一个完整的、跨平台的解决方案，可以记录、转换和传输音频和视频。

## Windows 系统安装 FFmpeg

### 1. 下载 FFmpeg

- 访问官方下载页面：http://ffmpeg.zeranoe.com/builds/
- 根据操作系统选择下载最新的 32位 或 64位 静态程序版本
- 建议下载 Shared 版本以获得更好的兼容性

### 2. 解压安装文件

- 下载完成后解压 FFmpeg 压缩包
- 会生成一个类似 "ffmpeg-20150504-git-eb9fb50-win32-static" 的文件夹
- 在任意磁盘（如 D盘）新建一个名为 "ffmpeg" 的文件夹
- 将解压生成的文件夹中的所有内容拷贝到新建的 "ffmpeg" 文件夹中

### 3. 配置环境变量

**步骤详解：**

1. **打开系统设置**
   - 点击"开始菜单" → "控制面板" → "系统与安全" → "系统"
   - 点击"高级系统设置" → "环境变量"

2. **编辑 Path 变量**
   - 在"环境变量"窗口中找到并选中"Path"变量
   - 点击"编辑"按钮
   - 在变量值末尾添加 `;D:\ffmpeg\bin`（注意分号不可遗漏）
   - 一路点击"确定"保存设置

### 4. 验证安装

- 打开命令提示符（CMD）
- 输入命令：`ffmpeg -version`
- 如果返回 FFmpeg 版本信息，说明安装成功

### 5. 常见问题解决

如果出现 "libstdc++ -6 is missing" 错误，需要安装 Microsoft Visual C++ Redistributable Package，可从微软官网免费获取。

## Linux 系统安装 FFmpeg

### 方法一：源码编译安装

**1. 下载源码包**
```bash
# 下载最新版本（如 ffmpeg-3.3.1.tar.bz2）
wget https://ffmpeg.org/releases/ffmpeg-3.3.1.tar.bz2

# 解压
tar -xjvf ffmpeg-3.3.1.tar.bz2
cd ffmpeg-3.3.1/
```

**2. 安装依赖**

首先需要安装 yasm 汇编器：
```bash
# 下载 yasm
wget http://www.tortall.net/projects/yasm/releases/yasm-1.3.0.tar.gz

# 编译安装 yasm
tar -xvzf yasm-1.3.0.tar.gz
cd yasm-1.3.0/
./configure
make
make install
```

**3. 编译安装 FFmpeg**
```bash
# 返回 FFmpeg 目录
cd ../ffmpeg-3.3.1/

# 配置编译选项
./configure --enable-shared --prefix=/usr/local/ffmpeg

# 编译（耗时较长）
make

# 安装
make install
```

**4. 配置库文件路径**
```bash
# 创建配置文件
vim /etc/ld.so.conf.d/ffmpeg.conf

# 添加库路径
/usr/local/ffmpeg/lib

# 使配置生效
ldconfig
```

**5. 配置环境变量**
```bash
# 编辑环境变量文件
vim ~/.bashrc

# 添加 FFmpeg bin 路径
export PATH="/usr/local/ffmpeg/bin:$PATH"

# 使配置生效
source ~/.bashrc
```

### 方法二：包管理器安装

**Ubuntu/Debian 系统：**
```bash
sudo apt update
sudo apt install ffmpeg
```

**CentOS/RHEL 系统：**
```bash
# 需要先安装 EPEL 源
sudo yum install epel-release
sudo yum install ffmpeg
```

## FFmpeg 基本使用

### 1. 验证安装
```bash
ffmpeg -version
```

### 2. 查看支持的格式
```bash
# 查看支持的编解码器
ffmpeg -codecs

# 查看支持的格式
ffmpeg -formats
```

### 3. 基本视频转换
```bash
# 格式转换（AVI 转 MP4）
ffmpeg -i input.avi output.mp4

# 指定编码器
ffmpeg -i input.avi -codec:v libx264 -codec:a aac output.mp4
```

### 4. 常用参数说明

- `-i`: 指定输入文件
- `-codec:v` 或 `-c:v`: 指定视频编码器
- `-codec:a` 或 `-c:a`: 指定音频编码器
- `-b:v`: 设置视频比特率
- `-b:a`: 设置音频比特率
- `-r`: 设置帧率
- `-s`: 设置视频分辨率

### 5. 实用示例

**视频压缩：**
```bash
ffmpeg -i input.mp4 -b:v 1000k -b:a 128k output.mp4
```

**提取音频：**
```bash
ffmpeg -i input.mp4 -vn -acodec copy output.aac
```

**调整分辨率：**
```bash
ffmpeg -i input.mp4 -s 1280x720 output.mp4
```

**截取视频片段：**
```bash
# 从第30秒开始截取60秒
ffmpeg -i input.mp4 -ss 00:00:30 -t 00:01:00 output.mp4
```

## 总结

FFmpeg 是一个功能强大的音视频处理工具，支持几乎所有的音视频格式。通过命令行界面，用户可以轻松完成格式转换、压缩、剪辑等操作。虽然没有图形界面，但其强大的功能和灵活性使其成为音视频处理的首选工具。

掌握基本的安装和使用方法后，可以根据具体需求学习更多高级功能，如滤镜应用、流媒体处理等。FFmpeg 的命令行工具功能丰富，结合适当的参数可以实现各种复杂的音视频处理任务。