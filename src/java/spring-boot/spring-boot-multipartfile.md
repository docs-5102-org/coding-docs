---
title: 上传文件
category:
  - Web框架
tag:
  - Spring Boot
  - Multipartfile上传文件
---

# SpringBoot Multipartfile上传文件应用指南

## 目录

[[toc]]

## 简介

SpringBoot中的Multipartfile是处理文件上传的核心组件，基于Servlet 3.0规范，提供了简单而强大的文件上传功能。本文将详细介绍如何在SpringBoot应用中正确使用Multipartfile进行文件上传，并解决常见的路径问题。

## 基础配置

### 1. 添加依赖

在`pom.xml`中添加SpringBoot Web依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

### 2. 应用配置

在`application.properties`中配置文件上传参数：

```properties
# 文件上传配置
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=100MB
spring.servlet.multipart.file-size-threshold=0
# 临时文件存储路径
spring.servlet.multipart.location=/app/upload/tmp
```

### 3. Java配置方式

如果需要通过Java代码配置，可以创建配置Bean：

```java
@Configuration
public class FileUploadConfig {

    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        // 设置文件大小限制
        factory.setMaxFileSize(DataSize.ofMegabytes(10));
        factory.setMaxRequestSize(DataSize.ofMegabytes(100));
        // 设置临时文件存储路径（重要：解决路径问题）
        factory.setLocation("/app/upload/tmp");
        return factory.createMultipartConfig();
    }
}
```

## 控制器实现

### 1. 单文件上传

```java
@RestController
@RequestMapping("/file")
public class FileUploadController {

    private final String uploadDir = "/app/upload/files/";

    @PostMapping("/upload")
    public ResponseEntity<String> uploadSingleFile(
            @RequestParam("file") MultipartFile file) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("文件不能为空");
        }

        try {
            // 创建上传目录
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 生成文件名
            String originalFileName = file.getOriginalFilename();
            String fileName = System.currentTimeMillis() + "_" + originalFileName;
            Path filePath = uploadPath.resolve(fileName);

            // 保存文件（使用绝对路径）
            file.transferTo(filePath.toFile());

            return ResponseEntity.ok("文件上传成功: " + fileName);

        } catch (IOException e) {
            return ResponseEntity.status(500).body("文件上传失败: " + e.getMessage());
        }
    }
}
```

### 2. 多文件上传

```java
@PostMapping("/upload/multiple")
public ResponseEntity<List<String>> uploadMultipleFiles(
        @RequestParam("files") MultipartFile[] files) {
    
    List<String> uploadedFiles = new ArrayList<>();
    
    for (MultipartFile file : files) {
        if (!file.isEmpty()) {
            try {
                // 创建上传目录
                Path uploadPath = Paths.get(uploadDir);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }

                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                Path filePath = uploadPath.resolve(fileName);
                
                file.transferTo(filePath.toFile());
                uploadedFiles.add(fileName);
                
            } catch (IOException e) {
                return ResponseEntity.status(500).body(
                    Arrays.asList("文件上传失败: " + e.getMessage()));
            }
        }
    }
    
    return ResponseEntity.ok(uploadedFiles);
}
```

### 3. 带参数的文件上传

```java
@PostMapping("/upload/with-params")
public ResponseEntity<String> uploadFileWithParams(
        @RequestParam("file") MultipartFile file,
        @RequestParam("description") String description,
        @RequestParam("category") String category) {
    
    // 处理文件上传和其他参数
    // ... 文件上传逻辑
    
    return ResponseEntity.ok("文件和参数上传成功");
}
```

## 前端表单配置

### 1. HTML表单

```html
<!DOCTYPE html>
<html>
<head>
    <title>文件上传</title>
</head>
<body>
    <!-- 单文件上传 -->
    <form action="/file/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="file" required>
        <input type="submit" value="上传">
    </form>

    <!-- 多文件上传 -->
    <form action="/file/upload/multiple" method="post" enctype="multipart/form-data">
        <input type="file" name="files" multiple required>
        <input type="submit" value="上传多个文件">
    </form>

    <!-- 带参数的文件上传 -->
    <form action="/file/upload/with-params" method="post" enctype="multipart/form-data">
        <input type="file" name="file" required>
        <input type="text" name="description" placeholder="文件描述">
        <select name="category">
            <option value="image">图片</option>
            <option value="document">文档</option>
        </select>
        <input type="submit" value="上传">
    </form>
</body>
</html>
```

### 2. JavaScript/Ajax上传

```javascript
function uploadFile() {
    const formData = new FormData();
    const fileInput = document.getElementById('fileInput');
    formData.append('file', fileInput.files[0]);

    fetch('/file/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        console.log('上传成功:', data);
    })
    .catch(error => {
        console.error('上传失败:', error);
    });
}
```

## 常见问题及解决方案

### 1. 路径错误问题

**问题描述：**
使用相对路径时，出现以下错误：
```
java.io.IOException: java.io.FileNotFoundException: /tmp/tomcat.xxx/work/Tomcat/localhost/ROOT/tmp/source/file.jpg (No such file or directory)
```

**原因分析：**
- SpringBoot使用Servlet 3.0的文件上传功能
- 当使用相对路径时，`transferTo`方法会在相对路径前添加一个`location`路径
- 如果没有创建对应的目录结构，就会抛出异常

**解决方案：**

#### 方案1：使用绝对路径
```java
@PostMapping("/upload")
public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
    try {
        // 使用绝对路径
        String absolutePath = "/app/upload/files/" + file.getOriginalFilename();
        File destFile = new File(absolutePath);
        
        // 确保父目录存在
        destFile.getParentFile().mkdirs();
        
        file.transferTo(destFile);
        return ResponseEntity.ok("上传成功");
    } catch (IOException e) {
        return ResponseEntity.status(500).body("上传失败: " + e.getMessage());
    }
}
```

#### 方案2：配置临时文件目录
在配置类中设置`location`：

```java
@Bean
public MultipartConfigElement multipartConfigElement() {
    MultipartConfigFactory factory = new MultipartConfigFactory();
    // 设置临时文件目录为项目目录
    factory.setLocation(System.getProperty("user.dir") + "/tmp");
    return factory.createMultipartConfig();
}
```

#### 方案3：使用Path API
```java
@PostMapping("/upload")
public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
    try {
        Path uploadDir = Paths.get("uploads").toAbsolutePath();
        Files.createDirectories(uploadDir);
        
        Path filePath = uploadDir.resolve(file.getOriginalFilename());
        file.transferTo(filePath.toFile());
        
        return ResponseEntity.ok("上传成功");
    } catch (IOException e) {
        return ResponseEntity.status(500).body("上传失败: " + e.getMessage());
    }
}
```

### 2. 文件大小限制问题

**问题：** 上传大文件时出现限制错误

**解决方案：**
```properties
# 单个文件最大大小
spring.servlet.multipart.max-file-size=50MB
# 请求最大大小
spring.servlet.multipart.max-request-size=100MB
```

### 3. 中文文件名乱码问题

**解决方案：**
```java
@PostMapping("/upload")
public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
    try {
        // 处理中文文件名
        String originalFileName = new String(
            file.getOriginalFilename().getBytes("ISO-8859-1"), "UTF-8");
        
        // ... 其他处理逻辑
    } catch (Exception e) {
        // 异常处理
    }
}
```

## 最佳实践

### 1. 文件验证

```java
@Service
public class FileValidationService {

    private final Set<String> ALLOWED_EXTENSIONS = 
        Set.of("jpg", "jpeg", "png", "gif", "pdf", "doc", "docx");

    public boolean isValidFile(MultipartFile file) {
        // 检查文件是否为空
        if (file.isEmpty()) {
            return false;
        }

        // 检查文件扩展名
        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            return false;
        }

        String extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            return false;
        }

        // 检查MIME类型
        String contentType = file.getContentType();
        return contentType != null && (
            contentType.startsWith("image/") || 
            contentType.equals("application/pdf") ||
            contentType.startsWith("application/vnd.openxmlformats"));
    }
}
```

### 2. 文件存储服务

```java
@Service
public class FileStorageService {

    @Value("${app.upload.dir:/app/upload/}")
    private String uploadDir;

    public String storeFile(MultipartFile file) throws IOException {
        // 创建存储目录
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);

        // 生成唯一文件名
        String fileName = generateFileName(file.getOriginalFilename());
        Path targetLocation = uploadPath.resolve(fileName);

        // 检查路径遍历攻击
        if (!targetLocation.getParent().equals(uploadPath)) {
            throw new SecurityException("文件路径不安全: " + fileName);
        }

        // 存储文件
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        return fileName;
    }

    private String generateFileName(String originalFileName) {
        String extension = "";
        int i = originalFileName.lastIndexOf('.');
        if (i > 0) {
            extension = originalFileName.substring(i);
        }
        return UUID.randomUUID().toString() + extension;
    }
}
```

### 3. 异常处理

```java
@ControllerAdvice
public class FileUploadExceptionHandler {

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<String> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
            .body("文件大小超过限制！");
    }

    @ExceptionHandler(IOException.class)
    public ResponseEntity<String> handleIOException(IOException exc) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body("文件处理失败: " + exc.getMessage());
    }
}
```

## 完整示例

### 完整的控制器类

```java
@RestController
@RequestMapping("/api/files")
@Validated
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private FileValidationService fileValidationService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") @NotNull MultipartFile file) {
        
        try {
            // 验证文件
            if (!fileValidationService.isValidFile(file)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "文件格式不支持或文件为空"));
            }

            // 存储文件
            String fileName = fileStorageService.storeFile(file);

            // 返回结果
            Map<String, Object> response = Map.of(
                "success", true,
                "fileName", fileName,
                "originalName", file.getOriginalFilename(),
                "size", file.getSize(),
                "contentType", file.getContentType()
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "文件上传失败: " + e.getMessage()));
        }
    }

    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        try {
            Resource resource = fileStorageService.loadFileAsResource(fileName);
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                    "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
                
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
```

## 实战项目

`miliqk`、`jasper`实战项目对应的file模块都已经集成好，直接可以调用接口

## 相关链接

- [官网](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/multipart-forms.html#page-title)
- [第三方](https://www.cnblogs.com/lmk-sym/p/6529232.html)