---
title: Java二维码开源库
category:
  - java
tag:
  - 二维码
  - qrcode
---

# Java二维码开源库

## 1. ZXing (推荐)
- **项目地址**: https://github.com/zxing/zxing
- **特点**: Google开发的多格式条码处理库，支持QR码、DataMatrix等多种格式
- **优势**: 功能全面，文档完善，社区活跃，既能生成也能解析
- **Maven依赖**:
```xml
<dependency>
    <groupId>com.google.zxing</groupId>
    <artifactId>core</artifactId>
    <version>3.5.1</version>
</dependency>
<dependency>
    <groupId>com.google.zxing</groupId>
    <artifactId>javase</artifactId>
    <version>3.5.1</version>
</dependency>
```
- **实战案例**：https://www.cnblogs.com/qq376324789/p/9836873.html

## 2. QRGen
- **项目地址**: https://github.com/kenglxn/QRGen
- **特点**: 基于ZXing封装的简化版本，使用更简单
- **优势**: API简洁易用，专注于QR码生成
- **适用场景**: 只需要基本QR码生成功能的项目

## 3. QRCode-Generator
- **项目地址**: https://github.com/nayuki/QR-Code-generator
- **特点**: 轻量级，支持多种编程语言版本
- **优势**: 代码简洁，无外部依赖，可定制性强

## 4. Barbecue
- **项目地址**: http://barbecue.sourceforge.net/
- **特点**: 支持多种条码格式，包括QR码
- **优势**: 老牌开源库，稳定可靠

**推荐使用ZXing**，因为它功能最全面，文档最完善，社区支持最好。如果只需要简单的QR码生成，QRGen是不错的选择。
