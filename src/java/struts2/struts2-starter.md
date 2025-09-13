---
title: Struts2 教程
category:
  - Web框架
tag:
  - struts2
---

# Struts2 上传和下载文件教程

## 目录

[[toc]]

## 1. 文件上传功能实现

### 1.1 JSP页面配置

在JSP页面中，使用Struts2的文件上传标签：

```jsp
<s:form action="upload" method="post" enctype="multipart/form-data">
    <s:file name="upload" label="上传的文件" />
    <s:submit value="上传" />
</s:form>
```

**注意要点：**
- 表单必须设置 `enctype="multipart/form-data"`
- 使用 `<s:file>` 标签创建文件选择框

### 1.2 Action类配置

在Action类中声明文件上传相关的属性：

```java
public class FileUploadAction extends ActionSupport {
    
    // 上传的文件对象
    private File upload;
    
    // 文件的MIME类型
    private String uploadContentType;
    
    // 上传文件的原始文件名
    private String uploadFileName;
    
    // getter和setter方法
    public File getUpload() {
        return upload;
    }
    
    public void setUpload(File upload) {
        this.upload = upload;
    }
    
    public String getUploadContentType() {
        return uploadContentType;
    }
    
    public void setUploadContentType(String uploadContentType) {
        this.uploadContentType = uploadContentType;
    }
    
    public String getUploadFileName() {
        return uploadFileName;
    }
    
    public void setUploadFileName(String uploadFileName) {
        this.uploadFileName = uploadFileName;
    }
    
    public String execute() throws Exception {
        // 处理文件上传逻辑
        if (upload != null) {
            // 获取上传目录
            String uploadPath = ServletActionContext.getServletContext()
                               .getRealPath("/uploads");
            
            // 创建目标文件
            File destFile = new File(uploadPath, uploadFileName);
            
            // 复制文件
            FileUtils.copyFile(upload, destFile);
            
            System.out.println("文件名: " + uploadFileName);
            System.out.println("文件类型: " + uploadContentType);
            System.out.println("文件大小: " + upload.length());
        }
        
        return SUCCESS;
    }
}
```

### 1.3 文件上传原理解析

**属性命名约定：**
Struts2框架通过`FileUploadInterceptor`拦截器自动处理文件上传，遵循以下命名约定：

- `upload` - 文件对象本身
- `upload + "ContentType"` = `uploadContentType` - 文件MIME类型
- `upload + "FileName"` = `uploadFileName` - 原始文件名

**内部处理流程：**

```java
// FileUploadInterceptor内部处理过程（简化版）
String fileName = multiWrapper.getFileNames(inputName);
if (isNonEmpty(fileName)) {
    File files = multiWrapper.getFiles(inputName);
    if (files != null && files.length > 0) {
        String contentTypeName = inputName + "ContentType"; // upload + ContentType
        String fileNameName = inputName + "FileName";       // upload + FileName
        
        // 将参数添加到ActionContext中，通过OGNL注入到Action
        Map<String, Object> params = ac.getParameters();
        params.put(inputName, acceptedFiles.toArray());
        params.put(contentTypeName, acceptedContentTypes.toArray());
        params.put(fileNameName, acceptedFileNames.toArray());
    }
}
```

### 1.4 Struts配置文件

```xml
<struts>
    <package name="fileUpload" extends="struts-default">
        <action name="upload" class="com.example.FileUploadAction">
            <result name="success">/success.jsp</result>
            <result name="error">/error.jsp</result>
            <!-- 配置文件上传限制 -->
            <interceptor-ref name="fileUpload">
                <param name="maximumSize">10485760</param> <!-- 10MB -->
                <param name="allowedExtensions">jpg,png,gif,pdf,doc,docx</param>
            </interceptor-ref>
            <interceptor-ref name="defaultStack"/>
        </action>
    </package>
</struts>
```

## 2. 文件下载功能实现

### 2.1 Action类配置

```java
public class FileDownloadAction extends ActionSupport {
    
    private String inputPath;    // 文件路径
    private String fileName;     // 初始文件名
    private InputStream inputStream;  // 下载流
    
    public String download() throws Exception {
        // 获取文件的真实路径
        String realPath = ServletActionContext.getServletContext()
                         .getRealPath(inputPath);
        
        // 创建输入流
        inputStream = new FileInputStream(new File(realPath));
        
        return SUCCESS;
    }
    
    // 提供下载文件名（支持中文编码）
    public String getDownloadFileName() throws UnsupportedEncodingException {
        return URLEncoder.encode(fileName, "UTF-8");
    }
    
    // getter和setter方法
    public String getInputPath() {
        return inputPath;
    }
    
    public void setInputPath(String inputPath) {
        this.inputPath = inputPath;
    }
    
    public String getFileName() {
        return fileName;
    }
    
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public InputStream getInputStream() {
        return inputStream;
    }
    
    public void setInputStream(InputStream inputStream) {
        this.inputStream = inputStream;
    }
}
```

### 2.2 Struts配置文件

```xml
<action name="download" class="com.example.FileDownloadAction" method="download">
    <!-- 文件路径 -->
    <param name="inputPath">/files/document.doc</param>
    <!-- 初始文件名 -->
    <param name="fileName">承诺书.doc</param>
    
    <result name="success" type="stream">
        <!-- 定义流的类型和编码 -->
        <param name="contentType">application/octet-stream;charset=ISO8859-1</param>
        <!-- 从Action中获取流的属性，默认是inputStream -->
        <param name="inputName">inputStream</param>
        <!-- 使用经过转码的文件名作为下载文件名 -->
        <param name="contentDisposition">attachment;filename="${downloadFileName}"</param>
        <!-- 缓冲区大小 -->
        <param name="bufferSize">4096</param>
    </result>
</action>
```

### 2.3 JSP页面调用

```jsp
<!-- 下载链接 -->
<a href="download.action">下载文件</a>

<!-- 或者使用Struts2标签 -->
<s:url var="downloadUrl" action="download"/>
<s:a href="%{downloadUrl}">下载文件</s:a>
```

## 3. 配置说明

### 3.1 文件上传拦截器参数

```xml
<interceptor-ref name="fileUpload">
    <!-- 最大文件大小（字节） -->
    <param name="maximumSize">10485760</param>
    <!-- 允许的文件扩展名 -->
    <param name="allowedExtensions">jpg,png,gif,pdf,doc,docx</param>
    <!-- 允许的MIME类型 -->
    <param name="allowedTypes">image/jpeg,image/png,image/gif,application/pdf</param>
</interceptor-ref>
```

### 3.2 Stream结果类型参数

| 参数名 | 说明 | 默认值 |
|--------|------|--------|
| `contentType` | 响应的MIME类型 | `text/plain` |
| `inputName` | Action中输入流的属性名 | `inputStream` |
| `contentDisposition` | 内容处理方式 | `inline` |
| `bufferSize` | 缓冲区大小 | `1024` |

## 4. 注意事项

### 4.1 文件上传注意事项

1. **文件大小限制**：默认限制为2MB，可通过拦截器参数调整
2. **文件类型限制**：建议设置允许的文件扩展名和MIME类型
3. **文件存储**：上传的文件存储在临时目录，需要复制到目标位置
4. **安全考虑**：验证文件类型，防止恶意文件上传

### 4.2 文件下载注意事项

1. **中文文件名**：需要进行URL编码处理
2. **文件路径安全**：避免路径遍历攻击
3. **流关闭**：确保输入流正确关闭
4. **MIME类型**：根据文件类型设置正确的ContentType

## 5. 完整示例

### 5.1 完整的Action类

```java
public class FileAction extends ActionSupport {
    
    // 上传相关属性
    private File upload;
    private String uploadContentType;
    private String uploadFileName;
    
    // 下载相关属性
    private String inputPath;
    private String fileName;
    private InputStream inputStream;
    
    // 上传方法
    public String upload() throws Exception {
        if (upload != null) {
            String uploadPath = ServletActionContext.getServletContext()
                               .getRealPath("/uploads");
            
            File destFile = new File(uploadPath, uploadFileName);
            FileUtils.copyFile(upload, destFile);
            
            addActionMessage("文件上传成功：" + uploadFileName);
        }
        return SUCCESS;
    }
    
    // 下载方法
    public String download() throws Exception {
        String realPath = ServletActionContext.getServletContext()
                         .getRealPath(inputPath);
        inputStream = new FileInputStream(new File(realPath));
        return SUCCESS;
    }
    
    // 获取编码后的下载文件名
    public String getDownloadFileName() throws UnsupportedEncodingException {
        return URLEncoder.encode(fileName, "UTF-8");
    }
    
    // 省略getter和setter方法...
}
```

通过以上配置，您就可以在Struts2应用中实现完整的文件上传和下载功能了。

## 6. 参考资料

### 新版文档

官方文档：[https://struts.apache.org/getting-started/](https://struts.apache.org/getting-started/)

前稳定版本为 Struts 7.0.3 GA，于 2025 年 3 月发布

### 旧版文档

<iframe 
  src="./docs/STRUTS2学习文档.pdf"  
  width="100%" 
  height="600px" 
>
  <p>您的浏览器不支持 PDF 预览，请<a href="./docs/STRUTS2学习文档.pdf">下载 PDF</a>。</p>
</iframe>
