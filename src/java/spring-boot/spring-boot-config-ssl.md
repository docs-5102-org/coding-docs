---
title: 配置SSL证书
category:
  - Web框架
---

# Spring Boot SSL证书配置指南

本文详细介绍如何在Spring Boot 2.x项目中配置SSL证书，启用HTTPS服务，适用于需要安全连接的生产环境部署。

## 应用场景

- 微信小程序后端接口（要求HTTPS）
- 生产环境API服务
- 需要数据传输加密的Web应用
- 企业内部安全系统

## 1. 生成SSL证书

### 1.1 使用Java Keytool生成自签名证书

#### macOS/Linux系统

```bash
keytool -genkey -alias myapp-ssl \
    -storetype PKCS12 \
    -keyalg RSA \
    -keysize 2048 \
    -keystore keystore.p12 \
    -validity 3650
```

#### Windows系统

找到JDK安装目录下的`keytool.exe`，执行：

```bash
keytool -genkey -alias myapp-ssl \
    -keypass your_key_password \
    -keyalg RSA \
    -keysize 2048 \
    -validity 3650 \
    -keystore D:/ssl/keystore.p12 \
    -storetype PKCS12 \
    -storepass your_store_password
```

### 1.2 证书信息配置

执行命令后，按提示输入以下信息：

```bash
输入密钥库口令: [设置密码]
再次输入新口令: [确认密码]
您的名字与姓氏是什么? [Unknown]: your-domain.com
您的组织单位名称是什么? [Unknown]: IT Department
您的组织名称是什么? [Unknown]: Your Company
您所在的城市或区域名称是什么? [Unknown]: Beijing
您所在的省/市/自治区名称是什么? [Unknown]: Beijing
该单位的双字母国家/地区代码是什么? [Unknown]: CN
```

**重要提示：** "名字与姓氏"应填写域名或localhost（开发环境）

## 2. Spring Boot项目配置

### 2.1 证书文件放置

将生成的`keystore.p12`文件复制到项目的`src/main/resources`目录下。

### 2.2 application.yml配置

```yaml
server:
  port: 8443  # HTTPS端口
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: your_store_password
    key-store-type: PKCS12
    key-alias: myapp-ssl
    # 可选：客户端认证配置
    # client-auth: need
    # trust-store: classpath:truststore.p12
    # trust-store-password: trust_password

# 应用配置
spring:
  application:
    name: ssl-demo
  profiles:
    active: prod
    
# 日志配置
logging:
  level:
    org.springframework.web: INFO
    org.apache.catalina: INFO
```

### 2.3 同时支持HTTP和HTTPS

如果需要同时支持HTTP和HTTPS访问，需要添加配置类：

```java
@Configuration
public class ServerConfig {

    @Bean
    public ServletWebServerFactory servletContainer() {
        TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory();
        tomcat.addAdditionalTomcatConnectors(createHttpConnector());
        return tomcat;
    }

    private Connector createHttpConnector() {
        Connector connector = new Connector("org.apache.coyote.http11.Http11NioProtocol");
        connector.setScheme("http");
        connector.setSecure(false);
        connector.setPort(8080);          // HTTP端口
        connector.setRedirectPort(8443);  // 重定向到HTTPS端口
        return connector;
    }
}
```

### 2.4 强制HTTPS重定向

如果要将所有HTTP请求重定向到HTTPS：

```java
@Configuration
public class HttpsRedirectConfig {

    @Bean
    public ServletWebServerFactory servletContainer() {
        TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory() {
            @Override
            protected void postProcessContext(Context context) {
                SecurityConstraint securityConstraint = new SecurityConstraint();
                securityConstraint.setUserConstraint("CONFIDENTIAL");
                SecurityCollection collection = new SecurityCollection();
                collection.addPattern("/*");
                securityConstraint.addCollection(collection);
                context.addConstraint(securityConstraint);
            }
        };
        tomcat.addAdditionalTomcatConnectors(createHttpConnector());
        return tomcat;
    }

    private Connector createHttpConnector() {
        Connector connector = new Connector("org.apache.coyote.http11.Http11NioProtocol");
        connector.setScheme("http");
        connector.setSecure(false);
        connector.setPort(8080);
        connector.setRedirectPort(8443);
        return connector;
    }
}
```

## 3. 测试配置

### 3.1 创建测试Controller

```java
@RestController
@RequestMapping("/api")
public class SslTestController {
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("protocol", "HTTPS");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getServerInfo(HttpServletRequest request) {
        Map<String, Object> info = new HashMap<>();
        info.put("secure", request.isSecure());
        info.put("scheme", request.getScheme());
        info.put("serverName", request.getServerName());
        info.put("serverPort", request.getServerPort());
        info.put("requestURL", request.getRequestURL().toString());
        return ResponseEntity.ok(info);
    }
}
```

### 3.2 启动应用测试

1. 启动Spring Boot应用
2. 访问 `https://localhost:8443/api/health`
3. 访问 `http://localhost:8080/api/health`（如果配置了HTTP支持）

**注意：** 浏览器会显示安全警告，这是正常的，因为使用的是自签名证书。

## 4. 生产环境配置

### 4.1 使用CA签名证书

在生产环境中，建议使用受信任的CA签名证书：

1. 从证书颁发机构购买SSL证书
2. 将证书文件转换为Java KeyStore格式
3. 更新application.yml中的证书配置

### 4.2 证书转换

将PEM格式证书转换为PKCS12：

```bash
openssl pkcs12 -export \
    -in certificate.crt \
    -inkey private.key \
    -out keystore.p12 \
    -name myapp-ssl \
    -CAfile ca-bundle.crt \
    -caname root
```

### 4.3 环境变量配置

生产环境建议使用环境变量管理敏感信息：

```yaml
server:
  port: ${SERVER_PORT:8443}
  ssl:
    key-store: ${SSL_KEY_STORE:classpath:keystore.p12}
    key-store-password: ${SSL_KEY_STORE_PASSWORD}
    key-store-type: ${SSL_KEY_STORE_TYPE:PKCS12}
    key-alias: ${SSL_KEY_ALIAS:myapp-ssl}
```

## 5. 故障排除

### 常见问题及解决方案

1. **证书密码错误**
   - 检查key-store-password是否正确
   - 确认证书别名(key-alias)是否匹配

2. **证书文件找不到**
   - 确认证书文件路径正确
   - 检查classpath:前缀是否正确

3. **浏览器显示不安全**
   - 自签名证书会有此提示，属于正常现象
   - 生产环境使用CA签名证书可解决

4. **端口冲突**
   - 检查8443端口是否被占用
   - 使用`netstat -an | grep 8443`检查端口状态

5. **HTTP重定向问题**
   - 确认Connector配置正确
   - 检查redirectPort设置

## 6. 安全建议

1. **证书管理**
   - 定期更新证书
   - 使用强密码保护私钥
   - 避免在代码中硬编码密码

2. **配置优化**
   - 禁用不必要的HTTP端口
   - 配置适当的SSL协议版本
   - 启用HSTS (HTTP Strict Transport Security)

3. **监控和日志**
   - 监控证书过期时间
   - 记录SSL握手失败日志
   - 定期检查安全配置

## 总结

通过以上配置，您的Spring Boot应用已经成功启用了HTTPS支持。在开发环境中可以使用自签名证书进行测试，在生产环境中务必使用受信任的CA签名证书以确保安全性。

记住在部署到生产环境时，还需要考虑负载均衡、反向代理等因素对SSL配置的影响。