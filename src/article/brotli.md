---
title: Java实现Brotli解压缩技术指南
category:
  - java
tag:
  - Brotli
---


# Java实现Brotli解压缩技术指南：处理Content-Encoding: br响应

## 1. 什么是Brotli压缩算法

Brotli是Google在2015年9月推出的无损压缩算法，它通过变种的LZ77算法、Huffman编码以及二阶文本建模等方式进行数据压缩。相比传统的压缩算法，Brotli具有更高的压缩效率。


### 1.1 Brotli的核心优势

- **压缩率更高**：相比Gzip压缩，CDN流量可再减少20%
- **性能更优**：针对Web资源内容，性能比Gzip提高17-25%
- **效率更强**：Brotli压缩级别为1时，压缩率比Gzip最高级别（9）还要高
- **适用性广**：对不同HTML文档都能提供高压缩率

### 1.2 浏览器支持情况

目前除了IE和Opera Mini之外，几乎所有主流浏览器都已支持Brotli算法，包括Chrome、Firefox、Safari、Edge等。


<img :src="$withBase('/assets/images/brotli.png')" 
  alt="Java 提取TTF字体中的指定文字"
  height="auto">

## 2. 在Java开发中遇到的问题

### 2.1 问题场景

在使用HttpClient调用接口时，如果服务器返回的响应使用了Brotli压缩（Content-Encoding: br），直接使用`EntityUtils.toString(entity, Consts.UTF_8)`处理会出现乱码问题，无法获取正确的数据。

### 2.2 问题表现

- 返回内容出现大量乱码
- 显示方格符号等不可读字符
- 无法正确解析响应数据

## 3. Java解决方案

### 3.1 添加依赖

首先需要在项目中添加Brotli解压缩的依赖：

```xml
<dependency>
    <groupId>org.brotli</groupId>
    <artifactId>dec</artifactId>
    <version>0.1.2</version>
</dependency>
```

### 3.2 核心实现代码

```java
import org.brotli.dec.BrotliInputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;

// 检查响应头中的压缩编码类型
BufferedReader bufferedReader = null;
if (response.getLastHeader("content-encoding").getValue().equals("br")) {
    // 处理Brotli压缩流
    bufferedReader = new BufferedReader(
        new InputStreamReader(
            new BrotliInputStream(response.getEntity().getContent())
        )
    );
} else {
    // 处理未压缩流
    bufferedReader = new BufferedReader(
        new InputStreamReader(response.getEntity().getContent())
    );
}

// 读取解压后的数据
StringBuilder result = new StringBuilder();
String line;
while ((line = bufferedReader.readLine()) != null) {
    System.out.println(line);
    result.append(line);
}
```

### 3.3 完整的解决方案

```java
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.HttpClientBuilder;
import org.brotli.dec.BrotliInputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;

public class BrotliDecompressionExample {
    
    public static String handleBrotliResponse(HttpResponse response) throws IOException {
        BufferedReader bufferedReader = null;
        
        try {
            // 检查Content-Encoding头
            String contentEncoding = response.getLastHeader("content-encoding") != null ? 
                response.getLastHeader("content-encoding").getValue() : "";
            
            if ("br".equals(contentEncoding)) {
                // 使用BrotliInputStream解压
                bufferedReader = new BufferedReader(
                    new InputStreamReader(
                        new BrotliInputStream(response.getEntity().getContent())
                    )
                );
            } else if ("gzip".equals(contentEncoding)) {
                // 处理gzip压缩（如果需要）
                // 这里可以添加gzip解压逻辑
                bufferedReader = new BufferedReader(
                    new InputStreamReader(response.getEntity().getContent())
                );
            } else {
                // 未压缩内容
                bufferedReader = new BufferedReader(
                    new InputStreamReader(response.getEntity().getContent())
                );
            }
            
            // 读取内容
            StringBuilder result = new StringBuilder();
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                result.append(line);
            }
            
            return result.toString();
            
        } finally {
            if (bufferedReader != null) {
                bufferedReader.close();
            }
        }
    }
    
    public static void main(String[] args) {
        try {
            HttpClient client = HttpClientBuilder.create().build();
            HttpGet request = new HttpGet("https://example.com/api");
            
            // 设置Accept-Encoding头，支持多种压缩格式
            request.setHeader("Accept-Encoding", "gzip, deflate, br");
            
            HttpResponse response = client.execute(request);
            String result = handleBrotliResponse(response);
            
            System.out.println("Response: " + result);
            
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

## 4. 最佳实践和注意事项

### 4.1 兼容性处理

在实际项目中，建议同时支持多种压缩格式：

```java
public static BufferedReader createReader(HttpResponse response) throws IOException {
    String contentEncoding = response.getLastHeader("content-encoding") != null ? 
        response.getLastHeader("content-encoding").getValue() : "";
    
    InputStream inputStream = response.getEntity().getContent();
    
    switch (contentEncoding.toLowerCase()) {
        case "br":
            return new BufferedReader(new InputStreamReader(new BrotliInputStream(inputStream)));
        case "gzip":
            return new BufferedReader(new InputStreamReader(new GZIPInputStream(inputStream)));
        case "deflate":
            return new BufferedReader(new InputStreamReader(new InflaterInputStream(inputStream)));
        default:
            return new BufferedReader(new InputStreamReader(inputStream));
    }
}
```

### 4.2 错误处理

```java
public static String safeHandleBrotliResponse(HttpResponse response) {
    try {
        return handleBrotliResponse(response);
    } catch (IOException e) {
        System.err.println("Failed to decompress Brotli content: " + e.getMessage());
        return null;
    }
}
```

### 4.3 性能优化建议

1. **复用HttpClient实例**：避免每次请求都创建新的HttpClient
2. **适当的缓冲区大小**：根据实际数据量调整BufferedReader的缓冲区大小
3. **资源管理**：确保所有IO资源都能正确关闭

## 5. Brotli在实际项目中的应用

### 5.1 触发条件

服务器使用Brotli压缩需要满足以下条件：

- Content-Type符合特定MIME类型列表
- Content-Length大于256字节
- 客户端请求头包含`Accept-Encoding: br`

### 5.2 常见应用场景

- **API接口调用**：处理返回Brotli压缩的JSON数据
- **网页爬虫**：处理使用Brotli压缩的HTML内容
- **文件下载**：处理压缩传输的文件内容

## 6. 总结

Brotli压缩算法在国外网站中使用较多，近年来国内网站（如B站等）也开始采用。对于Java开发者来说，掌握Brotli解压缩技术是处理现代Web应用必备的技能。通过使用`org.brotli.dec.BrotliInputStream`类，可以轻松解决Content-Encoding为br的响应处理问题。

在实际开发中，建议：
- 始终检查Content-Encoding头
- 支持多种压缩格式的兼容处理
- 做好异常处理和资源管理
- 合理设置Accept-Encoding请求头

通过这些实践，可以确保应用程序能够正确处理各种压缩格式的HTTP响应，提供更好的用户体验。