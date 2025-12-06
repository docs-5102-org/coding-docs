---
title: StandardPBEStringEncryptor 详解
category:
  - Java
  - Jasypt
tag:
  - 反射机制
---

# StandardPBEStringEncryptor 详解

`StandardPBEStringEncryptor` 是 Jasypt (Java Simplified Encryption) 库中用于字符串加密和解密的核心类。PBE 代表 Password-Based Encryption（基于密码的加密）。

## 核心概念

这个类允许你使用一个密码（password）来加密和解密字符串数据，而不需要管理复杂的密钥。它在内部会将密码转换为加密密钥。

## 主要特性

**基于密码的加密**：使用人类可读的密码而非复杂的密钥文件，简化了密钥管理。

**加盐处理**：自动为每次加密操作生成随机盐值，即使相同的明文使用相同密码加密，每次结果也不同，增强安全性。

**标准算法支持**：支持多种 PBE 算法，如 PBEWithMD5AndDES、PBEWithHMACSHA512AndAES_256 等。

## 基本使用示例

```java
import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;

// 创建加密器
StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor();

// 设置密码
encryptor.setPassword("mySecretPassword");

// 加密
String originalText = "sensitive data";
String encryptedText = encryptor.encrypt(originalText);
System.out.println("加密后: " + encryptedText);

// 解密
String decryptedText = encryptor.decrypt(encryptedText);
System.out.println("解密后: " + decryptedText);
```

## 重要配置项

**algorithm（算法）**：指定加密算法，默认是 PBEWithMD5AndDES。推荐使用更强的算法如 PBEWITHHMACSHA512ANDAES_256。

**password（密码）**：加密和解密使用的密码，必须配置。

**keyObtentionIterations（密钥迭代次数）**：从密码生成密钥时的迭代次数，默认 1000，增加此值可提高安全性但会降低性能。

**saltGenerator（盐值生成器）**：生成随机盐值的策略，默认使用 RandomSaltGenerator。

**ivGenerator（初始化向量生成器）**：用于某些加密模式的 IV 生成。

**stringOutputType（输出类型）**：加密后的输出格式，可选 base64（默认）或 hexadecimal。

## 高级配置示例

```java
StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor();
encryptor.setPassword("myStrongPassword");
encryptor.setAlgorithm("PBEWITHHMACSHA512ANDAES_256");
encryptor.setKeyObtentionIterations(10000);
encryptor.setStringOutputType("base64");

// 初始化（可选，首次使用时会自动初始化）
encryptor.initialize();

String encrypted = encryptor.encrypt("my secret");
String decrypted = encryptor.decrypt(encrypted);
```

## 在 Spring Boot 中的应用

Jasypt 常用于加密配置文件中的敏感信息：

```yaml
# application.yml
spring:
  datasource:
    password: ENC(加密后的密码)

jasypt:
  encryptor:
    password: ${JASYPT_PASSWORD} # 从环境变量读取
    algorithm: PBEWITHHMACSHA512ANDAES_256
```

## 安全建议

1. **使用强密码**：密码应足够复杂且长度适当
2. **选择强算法**：避免使用已过时的算法如 PBEWithMD5AndDES
3. **增加迭代次数**：适当增加 keyObtentionIterations 提高暴力破解难度
4. **密码管理**：不要将密码硬编码在代码中，使用环境变量或密钥管理服务
5. **JCE 无限强度策略**：某些强算法需要安装 JCE Unlimited Strength Jurisdiction Policy Files

## 注意事项

- 加密是双向的，如果只需要验证（如密码），应使用单向哈希而非加密
- 每次加密结果不同是正常的（因为随机盐值），但都能正确解密
- 线程安全：实例化后是线程安全的，可以在多线程环境中共享
- 性能考虑：加密解密操作相对耗时，不适合高频操作场景

这个类为 Java 应用提供了简单而有效的字符串加密方案，特别适合保护配置文件中的敏感数据。