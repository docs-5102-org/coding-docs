---
title: MinIO 入门教程
date: 2025-08-06
category:
  - 对象存储
tag:
  - MinIO
  - 云存储
---

# MinIO 对象存储使用指南

## 1. 产品简介

MinIO 是一个高性能、兼容 S3 协议的对象存储解决方案，专为大规模 AI/ML、数据湖和数据库工作负载设计。它支持多种部署环境：
- 本地数据中心
- 公有云/私有云
- 边缘计算环境

**适用场景**：图片、视频、日志文件、备份数据和容器/虚拟机镜像等非结构化数据存储。

**官网**：https://min.io/

## 2. 快速开始

### 2.1 下载安装

**下载地址**：https://min.io/download

#### Windows 安装指南

1. **环境变量配置**：
   ```cmd
   setx MINIO_ROOT_USER minio
   setx MINIO_ROOT_PASSWORD 12345678
   ```
   > 注意：密码需至少8位，设置后需关闭CMD窗口才能生效。未生效时默认账号为：
   > - RootUser: minioadmin
   > - RootPass: minioadmin

2. **服务端启动**：
   ```cmd
   minio.exe server D:/SoftWare/minio/miniodata --console-address ":9001"
   ```
   - 控制台地址: http://[IP]:9001
   - 数据存储路径: D:/SoftWare/minio/miniodata

3. **客户端配置**：
   ```cmd
   mc.exe alias set myminio/ http://[IP]:9000 minio 12345678
   ```

**访问地址**：
- API 端点: http://[IP]:9000
- 控制台: http://[IP]:9001

### 2.2 Java 集成

#### Maven 依赖
```xml
<!-- MinIO 核心库 -->
<dependency>
    <groupId>io.minio</groupId>
    <artifactId>minio</artifactId>
    <version>8.4.5</version>
</dependency>

<!-- 解决依赖冲突 -->
<dependency>
    <groupId>com.squareup.okhttp3</groupId>
    <artifactId>okhttp</artifactId>
    <version>4.9.3</version>
</dependency>
```

#### 示例代码
```java
public class MinIOExample {
    public static void main(String[] args) throws Exception {
        try {
            // 初始化客户端
            MinioClient minioClient = MinioClient.builder()
                .endpoint("http://192.168.122.103:9000")
                .credentials("minio", "12345678")
                .build();
            
            String bucketName = "asiatrip";
            
            // 检查并创建存储桶
            if (!minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build())) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            }
            
            // 上传文件
            minioClient.uploadObject(
                UploadObjectArgs.builder()
                    .bucket(bucketName)
                    .object("webp/D376L31FKORLN00000NGLF.jpg")
                    .filename("C:\\Users\\Administrator\\Desktop\\cover\\D376L31FKORLN00000NGLF.jpg")
                    .build());
            
            System.out.println("文件上传成功");
        } catch (MinioException e) {
            System.err.println("操作失败: " + e);
            System.err.println("HTTP跟踪: " + e.httpTrace());
        }
    }
}
```

## 3. 学习资源

- **官方文档**：https://min.io/docs
- **Java SDK 文档**：https://min.io/docs/minio/linux/developers/java/minio-java.html
- **Mall项目集成示例**：
  - https://www.macrozheng.com/project/minio_console_start.html
  - https://www.macrozheng.com/mall/technology/minio_use.html

## 4. 注意事项

1. 版本兼容性：推荐使用 MinIO 8.4.5 + okhttp 4.9.3 组合以避免依赖冲突
2. 安全建议：
   - 生产环境务必修改默认凭证
   - 建议配置HTTPS访问
3. 性能优化：
   - 对大文件上传使用分片上传
   - 合理设置存储桶策略

## 5. 其他语言支持

MinIO 提供多语言 SDK，包括：
- JavaScript/Node.js
- Python
- Go
- .NET

各语言示例请参考官方文档对应章节。
