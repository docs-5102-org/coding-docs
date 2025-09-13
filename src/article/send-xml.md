---
title: Java发送XML格式HTTP请求
category:
  - Java
---

# Java发送XML格式HTTP请求完整指南

## 目录

[[toc]]

## 概述

在Java开发中，经常需要向第三方服务发送XML格式的HTTP请求。本文档将介绍两种主要的实现方式：使用Apache HttpClient和使用Java原生URLConnection，并提供完整的代码示例。

## 方式一：使用Apache HttpClient

### 依赖引入

首先需要在项目中引入Apache HttpClient依赖：

```xml
<dependency>
    <groupId>commons-httpclient</groupId>
    <artifactId>commons-httpclient</artifactId>
    <version>3.1</version>
</dependency>
```

### 核心实现

使用HttpClient发送XML请求的核心方法：

```java
public String post(String url, String xmlFileName) {
    // 关闭日志输出
    System.setProperty("org.apache.commons.logging.Log", "org.apache.commons.logging.impl.SimpleLog");
    System.setProperty("org.apache.commons.logging.simplelog.showdatetime", "true");
    System.setProperty("org.apache.commons.logging.simplelog.log.org.apache.commons.httpclient", "stdout");

    // 创建HttpClient实例
    HttpClient client = new HttpClient();
    // 创建POST请求
    PostMethod myPost = new PostMethod(url);
    // 设置请求超时时间（5分钟）
    client.setConnectionTimeout(300 * 1000);
    
    String responseString = null;
    
    try {
        // 设置请求头
        myPost.setRequestHeader("Content-Type", "text/xml");
        myPost.setRequestHeader("charset", "utf-8");

        // 设置请求体 - 从资源文件读取XML
        InputStream body = this.getClass().getResourceAsStream("/" + xmlFileName);
        myPost.setRequestBody(body);

        // 执行请求
        int statusCode = client.executeMethod(myPost);
        
        if (statusCode == HttpStatus.SC_OK) {
            // 处理响应
            BufferedInputStream bis = new BufferedInputStream(myPost.getResponseBodyAsStream());
            byte[] bytes = new byte[1024];
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            int count = 0;
            
            while ((count = bis.read(bytes)) != -1) {
                bos.write(bytes, 0, count);
            }
            
            byte[] strByte = bos.toByteArray();
            responseString = new String(strByte, 0, strByte.length, "utf-8");
            
            bos.close();
            bis.close();
        }
    } catch (Exception e) {
        e.printStackTrace();
    }
    
    // 释放连接
    myPost.releaseConnection();
    return responseString;
}
```

### 关键特性

- **超时设置**：防止请求长时间阻塞
- **编码处理**：正确处理UTF-8编码
- **资源管理**：及时释放连接和流资源
- **错误处理**：完整的异常捕获机制

## 方式二：使用Java原生URLConnection

### 核心实现

```java
public void testPost(String urlStr) {
    try {
        URL url = new URL(urlStr);
        URLConnection con = url.openConnection();
        
        // 设置连接属性
        con.setDoOutput(true);
        con.setRequestProperty("Pragma:", "no-cache");
        con.setRequestProperty("Cache-Control", "no-cache");
        con.setRequestProperty("Content-Type", "text/xml");

        // 发送XML数据
        OutputStreamWriter out = new OutputStreamWriter(con.getOutputStream());
        String xmlInfo = getXmlInfo();
        
        out.write(new String(xmlInfo.getBytes("UTF-8")));
        out.flush();
        out.close();
        
        // 读取响应
        BufferedReader br = new BufferedReader(new InputStreamReader(con.getInputStream()));
        String line = "";
        for (line = br.readLine(); line != null; line = br.readLine()) {
            System.out.println(line);
        }
    } catch (Exception e) {
        e.printStackTrace();
    }
}
```

### XML内容构建

```java
private String getXmlInfo() {
    StringBuilder sb = new StringBuilder();
    sb.append("<?xml version='1.0' encoding='UTF-8'?>");
    sb.append("<Message>");
    sb.append(" <header>");
    sb.append("     <action>readMeetingStatus</action>");
    sb.append("     <service>meeting</service>");
    sb.append("     <type>xml</type>");
    sb.append("     <userName>admin</userName>");
    sb.append("     <password>admin</password>");
    sb.append("     <siteName>box</siteName>");
    sb.append(" </header>");
    sb.append(" <body>");
    sb.append("     <confKey>43283344</confKey>");
    sb.append(" </body>");
    sb.append("</Message>");
    
    return sb.toString();
}
```

## 两种方式对比

| 特性 | Apache HttpClient | URLConnection |
|------|-------------------|---------------|
| 依赖 | 需要第三方库 | JDK自带 |
| 功能 | 功能丰富，支持连接池 | 功能基础 |
| 配置 | 配置选项多 | 配置相对简单 |
| 性能 | 更好的连接管理 | 基础性能 |
| 维护 | 社区支持好 | JDK官方维护 |

## 最佳实践

### 1. 资源管理
```java
// 确保流和连接得到正确关闭
try (InputStream is = response.getEntity().getContent()) {
    // 处理响应
} finally {
    // 释放连接
    httpMethod.releaseConnection();
}
```

### 2. 错误处理
```java
if (statusCode != HttpStatus.SC_OK) {
    throw new RuntimeException("HTTP请求失败，状态码：" + statusCode);
}
```

### 3. 编码处理
```java
// 明确指定编码格式
myPost.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
String response = new String(responseBytes, "UTF-8");
```

### 4. 超时配置
```java
// 设置连接超时和读取超时
client.setConnectionTimeout(30000);  // 30秒连接超时
client.setTimeout(60000);           // 60秒读取超时
```

## 使用示例

```java
public class TestMeetingInterface {
    public static void main(String[] args) {
        String url = "http://192.168.0.68/integration/xml";
        TestMeetingInterface tmi = new TestMeetingInterface();
        
        // 使用HttpClient方式
        String response = tmi.post(url, "listSummaryMeeting.xml");
        System.out.println("响应结果：" + response);
        
        // 使用URLConnection方式
        tmi.testPost(url);
    }
}
```

## 注意事项

1. **编码问题**：确保XML内容和HTTP请求都使用正确的编码格式
2. **超时设置**：避免请求无限期等待
3. **资源释放**：及时关闭流和释放连接
4. **异常处理**：完善的错误处理机制
5. **安全考虑**：在生产环境中避免硬编码敏感信息

## 总结

本文档介绍了Java发送XML格式HTTP请求的两种主要方式。Apache HttpClient提供了更强大的功能和更好的性能，适合复杂的HTTP交互场景；而URLConnection作为JDK原生API，适合简单的请求场景。选择哪种方式取决于项目的具体需求和复杂程度。