---
title: Java中byte[]与String转换的编码陷阱
category:
  - java
---

# Java中byte[]与String转换的编码陷阱

## 问题描述

在Java开发中，经常遇到将`byte[]`数组转换为`String`，然后再转回`byte[]`的场景。然而，很多开发者会发现转换后的字节数组与原数组内容不一致。

## 问题代码示例

```java
byte[] bytes = new byte[]{40, -37, -96, 46, -75, -10};
byte[] myBytes = new String(bytes).getBytes();

System.out.println("原始数组：" + Arrays.toString(bytes));
System.out.println("转换后数组：" + Arrays.toString(myBytes));
```

**输出结果：**
```
原始数组：[40, -37, -96, 46, -75, -10]
转换后数组：[40, -17, -65, -67, -17, -65, -67, 46, -17, -65, -67, -17, -65, -67]
```

可以看到，转换后的数组不仅内容发生了变化，连长度都不一致了。

## 问题根本原因

### 默认编码获取方式

`new String(byte[])`和`getBytes()`方法默认使用的编码都是通过以下语句获取的：

```java
String csn = Charset.defaultCharset().name();
```

在大多数现代系统中，默认编码通常是UTF-8。

### UTF-8编码特性

- **UTF-8是多字节编码**：需要用1-4个字节来表示一个字符
- **编码规则复杂**：不是所有字节序列都是有效的UTF-8序列
- **错误处理**：遇到无效字节时，会用替换字符（�，对应字节-17, -65, -67）来处理

## 问题分析

以下两行代码在UTF-8环境下是等效的：

```java
byte[] bytes1 = new String(bytes).getBytes();
byte[] bytes2 = new String(bytes, StandardCharsets.UTF_8).getBytes(StandardCharsets.UTF_8);
```

当原始字节数组包含无效的UTF-8序列时：
1. `new String(bytes, UTF-8)`会将无效字节替换为替换字符
2. 再调用`getBytes(UTF-8)`时，替换字符被编码为`[-17, -65, -67]`
3. 导致最终结果与原数组完全不同

## 解决方案

### 方案1：使用ISO-8859-1编码

ISO-8859-1（Latin-1）是单字节编码，每个字节值(0-255)都对应一个有效字符：

```java
byte[] originalBytes = new byte[]{40, -37, -96, 46, -75, -10};

// 正确的转换方式
byte[] correctBytes = new String(originalBytes, StandardCharsets.ISO_8859_1)
    .getBytes(StandardCharsets.ISO_8859_1);

System.out.println("原始数组：" + Arrays.toString(originalBytes));
System.out.println("正确转换：" + Arrays.toString(correctBytes));
// 输出：两个数组完全一致
```

### 方案2：使用Base64编码

对于二进制数据的字符串表示，推荐使用Base64：

```java
import java.util.Base64;

byte[] originalBytes = new byte[]{40, -37, -96, 46, -75, -10};

// Base64编码和解码
String base64String = Base64.getEncoder().encodeToString(originalBytes);
byte[] decodedBytes = Base64.getDecoder().decode(base64String);

System.out.println("Base64字符串：" + base64String);
System.out.println("解码后数组：" + Arrays.toString(decodedBytes));
```

### 方案3：使用十六进制表示

```java
public class HexUtils {
    public static String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b & 0xFF));
        }
        return result.toString();
    }
    
    public static byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                                 + Character.digit(hex.charAt(i+1), 16));
        }
        return data;
    }
}
```

## 最佳实践建议

1. **明确编码意图**：
   - 如果是文本数据，明确指定字符编码
   - 如果是二进制数据，避免直接转换为String

2. **选择合适的编码方案**：
   - 纯二进制数据 → Base64编码
   - 需要可读性 → 十六进制表示
   - 临时转换 → ISO-8859-1编码

3. **代码规范**：
   ```java
   // 避免使用默认编码
   String text = new String(bytes); // ❌
   
   // 明确指定编码
   String text = new String(bytes, StandardCharsets.UTF_8); // ✅
   ```

## 总结

byte[]与String之间的转换看似简单，实际涉及复杂的字符编码机制。理解不同编码的特性，选择合适的转换方案，是避免数据损坏的关键。在处理二进制数据时，推荐使用Base64或十六进制表示，而不是直接的字符串转换。