---
title: 搭建 Python + OpenCV + dlib + Torch 环境运行
category:
  - Python
---

# CentOS 6.5 搭建 Python + OpenCV + dlib + Torch 环境运行 OpenFace

本文记录了在 **CentOS 6.5** 下搭建 `Python + OpenCV + dlib + Torch` 环境，以运行 [OpenFace](https://github.com/cmusatyalab/openface) 的完整过程。

> 注：以下命令均在 **root 用户**下执行，如果你使用普通用户，请在需要的地方添加 `sudo`。

---

## 📦 1. 安装开发工具

```bash
yum update
yum groupinstall "Development Tools"
```

---

## 🐍 2. 安装 Anaconda

* 下载地址：[Anaconda 官方下载](https://www.continuum.io/downloads)

安装命令：

```bash
bash Anaconda2-4.0.0-Linux-x86_64.sh
```

---

## 👁 3. 安装 OpenCV

### 方法一：源码编译安装

* 下载地址：[OpenCV 2.4.11](https://codeload.github.com/Itseez/opencv/zip/2.4.11)

下载后解压并手动编译。

### 方法二：使用 conda 安装

```bash
conda install opencv
```

---

## 🔧 4. 安装 dlib

安装依赖：

```bash
yum install boost boost-devel boost-doc
```

下载 dlib 源码：

* [dlib v18.16](https://github.com/davisking/dlib/releases/download/v18.16/dlib-18.16.tar.bz2)

编译安装：

```bash
mkdir -p ~/src
cd ~/src
tar xf dlib-18.16.tar.bz2
cd dlib-18.16/python_examples
mkdir build
cd build
cmake ../../tools/python
cmake --build . --config Release
cp dlib.so ~/anaconda2/lib/python2.7/site-packages
```

参考文档：
[OpenFace Setup - dlib](https://github.com/cmusatyalab/openface/blob/master/docs/setup.md#dlib)

---

## 🔥 5. 安装 Torch

参考文档：[Torch Getting Started](http://torch.ch/docs/getting-started.html)

下载源码：

```bash
git clone https://github.com/torch/distro.git ~/torch --recursive
```

安装依赖：

```bash
cd ~/torch
bash install-deps
```

### 常见问题及解决方案

**问题一：系统版本过低**
Torch 仅支持 CentOS7，而这里使用的是 CentOS 6.5。
解决方法：修改 `install-deps` 文件第 254 行：

```bash
if [[ $centos_major_version == '7' ]]; then
```

改为：

```bash
if [[ 1 ]]; then
```

---

**问题二：OpenBLAS 编译报错**
报错信息：

```
centos 6.5 assembler provided by binutils is too old
```

这是因为 gcc 太旧，不支持部分汇编指令。
解决方法：更新 gcc，参考：[升级 CentOS gcc](http://ask.xmodulo.com/upgrade-gcc-centos.html)

---

完成依赖安装后，运行：

```bash
./install.sh
```

安装 OpenFace 依赖的 Torch 库：

```bash
for NAME in dpnn nn optim optnet csvigo cutorch cunn fblualib torchx tds; do
  luarocks install $NAME
done
```

---

参考图片


[](./file/FireShot%20Capture%201%20-%20CentOS%206.png)

## 📚 参考文章

* [CentOS 6.5 搭建 Python+OpenCV+dlib+Torch 环境运行 openface](http://linxianyan.cn/centos-6-5-%E6%90%AD%E5%BB%BA-pythonopencvdlibtorch-%E7%8E%AF%E5%A2%83%E8%BF%90%E8%A1%8C-openface/)
* [CSDN 相关文章](http://blog.csdn.net/u010793915/article/details/53908243)
* [OpenFace 官方文档](https://github.com/cmusatyalab/openface/blob/master/docs/setup.md)


---

我整理后的 md 文档更偏向于“操作手册”风格，清晰分步骤、代码高亮，还加入了小标题和提示。

要不要我再帮你加上 **适配 CentOS7 或更高版本的补充说明**？这样可以让文档对不同环境的用户都更友好。
