---
title: ImageMagick教程
category:
  - 图像处理
tag:
  - ImageMagick
---

# ImageMagick教程

## 目录

[[toc]]

## 简介

ImageMagick是一套功能强大的图像处理工具，支持超过200种图像格式的读取、写入和编辑。它提供了命令行工具和编程接口，特别适合批量处理图像，在服务器端图像处理中应用广泛。

## 安装与配置

### 官方下载地址
- **官网地址**：http://www.imagemagick.org/script/download.php
- **中文地址**：http://www.imagemagick.com.cn/download.html

### 参考资料

- **api**: http://downloads.jmagick.org/jmagick-doc/


### 版本说明
- 目前官网已升级到7.x版本
- 6.x版本仍可下载使用：ImageMagick-6.2.7-6-Q16-windows-dll.zip

### 验证安装
查看安装版本：
```bash
convert -version
# 或者指定完整路径
/usr/local/bin/convert -version
```

查看支持的文件格式：
```bash
convert -list format
# 或者
/usr/local/bin/convert -list format
```

## 核心命令工具

### identify - 图像信息查看

#### 查看图像详细信息
```bash
identify image.png
# 输出示例：image.png PNG 559x559 559x559+0+0 8-bit sRGB 467KB 0.000u 0:00.008
```

相关参数说明如下：

::: tip
**🖼️ 一、图像基础信息**

| 参数             | 说明                              |
| -------------- | ------------------------------- |
| **Image**      | 图像文件名（sport.jpg）                |
| **Format**     | 图像格式（JPEG）                      |
| **Mime type**  | MIME 类型（image/jpeg）             |
| **Class**      | 图像类（DirectClass，直接像素访问）         |
| **Geometry**   | 图像分辨率，宽 × 高（183×275 像素）         |
| **Units**      | 图像单位（Undefined，未定义，如 DPI 或 PPI） |
| **Colorspace** | 颜色空间（sRGB）                      |
| **Type**       | 图像类型（TrueColor）                 |
| **Depth**      | 位深度（8 位/通道）                     |

---

**🎨 二、颜色通道信息**

每个通道（R、G、B）的统计值：

| 项目                     | 说明                          |
| ---------------------- | --------------------------- |
| **min / max**          | 通道最小值 / 最大值（0～255）          |
| **mean**               | 通道平均值，例如 Red: 166.014（色调偏红） |
| **standard deviation** | 标准差，颜色变化的离散程度               |
| **kurtosis**           | 峰度（判断数据分布是否尖锐）              |
| **skewness**           | 偏度（判断颜色分布是偏暗还是偏亮）           |
| **entropy**            | 熵值，表示信息丰富度，接近1表示颜色分布较均匀     |

---

**📊 三、整体图像统计**

| 参数                         | 说明                       |
| -------------------------- | ------------------------ |
| **Overall mean**           | 所有像素平均亮度值（151.392）       |
| **Overall std. deviation** | 所有像素的颜色标准差（61.1867）      |
| **Entropy**                | 图像信息量（0.920818）越高代表细节越丰富 |

---

**⚙️ 四、图像配置参数**

| 参数                    | 说明                       |
| --------------------- | ------------------------ |
| **Rendering intent**  | 渲染意图（Perceptual，感知优先）    |
| **Gamma**             | Gamma 值（0.454545，用于色彩校正） |
| **Chromaticity**      | 色度坐标（颜色的基础原色坐标）          |
| **Matte color**       | 透明色默认背景（灰色）              |
| **Background color**  | 背景色（白色）                  |
| **Border color**      | 边框色（灰）                   |
| **Transparent color** | 没有设置透明色（none）            |
| **Interlace**         | 交错格式（None）               |
| **Compose**           | 合成方式（Over，覆盖）            |
| **Compression**       | 压缩方式（JPEG）               |
| **Quality**           | JPEG压缩质量（76，代表中等压缩）      |
| **Orientation**       | 方向（未定义）                  |

---

**📅 五、文件与性能信息**

| 参数                           | 说明                       |
| ---------------------------- | ------------------------ |
| **date\:create**             | 文件创建时间                   |
| **date\:modify**             | 文件最后修改时间                 |
| **Filesize**                 | 文件大小（12,202 字节）          |
| **Number pixels**            | 总像素数（183×275 = 50325）    |
| **signature**                | 文件哈希签名，用于唯一标识内容          |
| **Tainted**                  | 是否被修改（False 表示未变更）       |
| **User time / Elapsed time** | 处理用时（性能分析）               |
| **Version**                  | ImageMagick 版本（7.0.8-46） |

:::

#### 获取特定信息
仅获取宽高信息：
```bash
identify -format "%wx%h" image.png
```

### convert - 图像处理核心命令

## 基础图像操作

### 1. 图像缩放

#### 按像素尺寸缩放
```bash
# 缩放到指定尺寸
convert image.png -resize 200x200 resize.png
```

#### 按比例缩放
```bash
# 缩小一半
convert image.png -resize 50% resize.png

# 多次缩放（制造模糊效果）
convert image.png -resize 50% -resize 200% resize.png
```

#### 采样缩放（产生马赛克效果）
```bash
# 普通采样
convert image.png -sample 50% sample.png

# 马赛克效果
convert image.png -sample 10% -sample 1000% sample.png
```

### 2. 图像裁剪

#### 指定位置裁剪
```bash
# 从坐标(50,50)开始裁剪100x100像素
convert image.png -crop 100x100+50+50 crop.png
```

#### 自动分割
```bash
# 按100x100大小分割，生成crop-0.png, crop-1.png等
convert image.png -crop 100x100 crop.png
```

#### 使用gravity指定相对位置
```bash
# 从右上角开始裁剪
convert image.png -gravity northeast -crop 100x100+0+0 crop.png
```

**gravity参数说明：**
- `northwest`：左上角
- `north`：上边中间  
- `northeast`：右上角
- `east`：右边中间
- `southeast`：右下角
- `south`：下边中间
- `southwest`：左下角
- `west`：左边中间
- `center`：中心

### 3. 图像旋转

#### 基本旋转
```bash
# 顺时针旋转45度
convert image.png -rotate 45 rotate.png
```

#### 指定背景色
```bash
# 黑色背景
convert image.png -background black -rotate 45 rotate.png
convert image.png -background #000000 -rotate 45 rotate.png

# 透明背景
convert image.png -background rgba(0,0,0,0) -rotate 45 rotate.png
```

### 4. 图像透明度处理

#### 设置透明度
```bash
# 转换为png32格式确保有alpha通道
convert image.png -define png:format=png32 image32.png

# 设置50%透明度
convert image32.png -channel alpha -fx "0.5" imagealpha.png
```

### 5. 边框处理

#### 去除边框
```bash
# 去掉边框，容差10%
convert image.png -trim -fuzz 10% newimage.png
```

## 图像合并与覆盖

### 基本覆盖操作

#### 1. over - 安全覆盖
```bash
convert background.png -compose over overlay.png -geometry 100x100+0+0 -composite new.png
```

#### 2. xor - 异或操作
```bash
# 相交处变为无色，不相交处保持不变
convert background.png -compose xor overlay.png -geometry 100x100+0+0 -composite new.png
```

#### 3. in - 交集显示
```bash
# 顶层图片与背景图片交汇处不变，未交汇处变为无色
convert background.png -compose in overlay.png -geometry 100x100+0+0 -composite new.png
```

#### 4. out - 差集显示  
```bash
# 交汇处变为无色，未交汇处不变
convert background.png -compose out overlay.png -geometry 100x100+0+0 -composite new.png
```

#### 5. atop - 顶层覆盖
```bash
# 交汇处不变，未交汇处变为无色，背景图片显示
convert background.png -compose atop overlay.png -geometry 100x100+0+0 -composite new.png
```

### 高级合并模式

#### 乘法操作 - 使图像变暗
```bash
convert gradient_back.png -compose multiply old.png -geometry 114x114+0+0 -composite new.png
```

#### 反向乘法 - 使图像变亮
```bash  
convert gradient_back.png -compose screen old.png -geometry 114x114+0+0 -composite new.png
```

#### 黑白乘法
```bash
convert gradient_back.png -compose bumpmap old.png -geometry 114x114+0+0 -composite new.png
```

#### 除法操作 - 去除阴影
```bash
convert gradient_back.png -compose divide old.png -geometry 114x114+0+0 -composite new.png
```

#### 数学运算
```bash
# 加法
convert background.png -compose plus old.png -geometry 114x114+0+0 -composite new.png

# 减法  
convert background.png -compose minus old.png -geometry 114x114+0+0 -composite new.png

# 差异
convert gradient_back.png -compose difference old.png -geometry 114x114+0+0 -composite new.png
```

#### 融合效果
```bash
# 溶解效果 - 指定透明度比例
convert background.png -compose dissolve -define compose:args=50x70 overlay.png -geometry 100x100+0+0 -composite new.png

# 调和效果 - 颜色调和
convert background.png -compose blend -define compose:args=100x70 overlay.png -geometry 100x100+0+0 -composite new.png

# 覆盖效果
convert shaded.png -compose overlay old.png -geometry 114x114+0+0 -composite new.png
```

### 水印和特效

#### 添加水印
```bash
# 使用gravity指定位置
convert image.png -gravity center -compose over overlay.png -composite newimage.png
convert image.png -gravity southeast -compose over overlay.png -composite newimage.png
```

#### 添加光源效果
```bash
# 在指定位置添加圆形光源
convert old.png -compose atop \( -size 50x50 canvas:none -draw "circle 25,25 25,40" -negate -channel A -blur 0x8 \) -geometry +5+30 -composite new.png
```

#### 区域变色
```bash
# 指定区域着色
convert old.png -region 50x60+20+10 -fill "rgb(255,0,0)" -colorize 20% new.png
```

#### 调制水印
```bash
convert old.png -compose modulate -define compose:args=50x120 189.png -geometry 114x114+0+0 -composite new.png
```

#### 更换背景
```bash
convert 189works.png -compose changemask old.png -composite new.png
```

## 图像拼接

### 水平拼接
```bash
# 水平拼接，底部对齐
convert image1.png image2.png image3.png -gravity south +append result.png
```

### 垂直拼接  
```bash
# 垂直拼接，右对齐
convert image1.png image2.png image3.png -gravity east -append result.png
```

## 文字处理

### 添加文字
```bash
# 在指定位置添加文字
convert image.png -draw "text 0,20 'some text'" newimage.png
```

### 高级文字处理
```bash
# 从文件读取文字，指定字体、颜色、大小、位置
convert source.jpg -font xxx.ttf -fill red -pointsize 48 -annotate +50+50 @text.txt result.jpg
```

## 格式转换

### 基本格式转换
```bash
# PNG转JPG
convert image.png image.jpg

# 指定PNG格式
convert image.png -define png:format=png32 newimage.png
```

## 实用示例

### 批量处理示例
```bash
# 批量缩放图片
for file in *.jpg; do
    convert "$file" -resize 800x600 "thumb_$file"
done
```

### 复合操作示例
```bash
# 图片覆盖（指定位置和大小）
convert mode1.jpg -compose over rotate.png -geometry 100x100+240+410 -composite new.png
convert mode1.jpg -compose over rotate.png -geometry 190x125+210+380 -composite new.png

# 图片融合
convert mode1.jpg -compose overlay rotate.png -geometry 100x100+240+410 -composite new.png
convert mode1.jpg -compose overlay rotate.png -geometry 190x125+210+380 -composite new.png

# 缩放后覆盖
convert -resize 50x50 rotate.png rotate.png
convert mode1.jpg rotate.png -gravity SouthWest -geometry 100x100+240+410 -composite new.png
```

### 多图拼接示例
```bash
# 三张图片水平拼接
convert nan1.png result5.png nan4.png -gravity east -append result6.png

# 图片覆盖到指定位置
convert 00f0486b-f8ae-4d89-8aae-c52c5f6a0d1b.jpg 05.png -gravity SouthWest -geometry +1+1 -composite dest4.jpg
```

## 常用参数说明

### geometry参数格式
- `WIDTHxHEIGHT+X+Y`：指定宽度、高度和坐标位置
- `+X+Y`：正偏移量
- `-X-Y`：负偏移量

### compose参数选项
- `over`：标准覆盖
- `multiply`：乘法（变暗）
- `screen`：反向乘法（变亮）
- `overlay`：覆盖融合
- `dissolve`：溶解
- `blend`：调和
- `difference`：差异
- `xor`：异或

## 性能优化建议

1. **批量处理**：使用脚本批量处理多个文件
2. **内存管理**：处理大图片时注意内存限制
3. **格式选择**：根据需求选择合适的输出格式
4. **质量平衡**：在文件大小和图像质量间找平衡

## 参考资源

- **官方文档**：http://www.imagemagick.org/script/command-line-options.php
- **中文手册**：http://www.pooy.net/imagemagick-chinese-manual.html
- **更多教程**：http://www.68idc.cn/help/buildlang/java/20150714442042.html

## 总结

ImageMagick是功能强大的图像处理工具，特别适合：
- 服务器端批量图像处理
- 自动化图像工作流
- 复杂的图像合成和特效
- 多种格式间的转换

掌握这些基本命令和参数，就能处理大部分日常图像处理需求。建议在实际使用中根据具体需求查阅官方文档获取更详细的参数说明。