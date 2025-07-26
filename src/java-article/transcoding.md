---
title: Java常用的编码转换
category:
  - java
tag:
  - unicode
  - utf-8
---

# ✅ Java 字符串编码转换全解：UTF-8、Unicode 编码互转

---

## ✅ 正确认识编码概念

| 编码类型           | 特点说明                                                        | 示例                     |
| -------------- | ----------------------------------------------------------- | ---------------------- |
| **Unicode 编码** | Java 内部 `char` 使用 UTF-16，常以 `\uXXXX` 表示 1 个字符               | `"湖"` → `\u6E56`       |
| **UTF-8 编码**   | 可变长字节编码，中文一般为 3 字节，用于网络传输、文件存储等                             | `"湖"` → `\xE6\xB9\x96` |
| **Java 编码方法**  | 使用 `.getBytes("UTF-8")` 编码、`new String(byte[], "UTF-8")` 解码 | —                      |

---

## 🔹 1. 字符串 → UTF-8 字节编码（十六进制显示）

```java
import java.nio.charset.StandardCharsets;

public class Utf8EncodeDemo {
    public static void main(String[] args) {
        String strInput = "湖北武汉";

        byte[] utf8Bytes = strInput.getBytes(StandardCharsets.UTF_8);

        System.out.println("\"" + strInput + "\" 的 UTF-8 编码：");
        for (byte b : utf8Bytes) {
            System.out.print(String.format("\\x%02X", b));
        }
    }
}
```

🧾 **输出示例**：

```
"湖北武汉" 的 UTF-8 编码：
\xE6\xB9\x96\xE5\x8C\x97\xE6\xAD\xA6\xE6\xB1\x89
```

---

## 🔹 2. UTF-8 字节数组 → 字符串

```java
import java.nio.charset.StandardCharsets;

public class Utf8DecodeDemo {
    public static void main(String[] args) {
        byte[] utf8Bytes = new byte[] {
            (byte) 0xE6, (byte) 0xB9, (byte) 0x96, // 湖
            (byte) 0xE5, (byte) 0x8C, (byte) 0x97, // 北
            (byte) 0xE6, (byte) 0xAD, (byte) 0xA6, // 武
            (byte) 0xE6, (byte) 0xB1, (byte) 0x89  // 汉
        };

        String decoded = new String(utf8Bytes, StandardCharsets.UTF_8);
        System.out.println("UTF-8 字节解码后为：" + decoded);
    }
}
```

🧾 **输出**：

```
UTF-8 字节解码后为：湖北武汉
```

---

## 🔹 3. 字符串 → Unicode 编码（`\uXXXX` 格式）

```java
public class UnicodeHexDemo {
    public static void main(String[] args) {
        String str = "湖北武汉";
        StringBuilder sb = new StringBuilder();

        for (char c : str.toCharArray()) {
            sb.append(String.format("\\u%04X", (int) c));
        }

        System.out.println("Unicode 编码：" + sb.toString());
    }
}
```

🧾 **输出**：

```
Unicode 编码：\u6E56\u5317\u6B66\u6C49
```

---

## 🔹 4. Unicode 编码 → 字符串（`\uXXXX` 反解）

```java
public class UnicodeDecodeDemo {
    public static void main(String[] args) {
        String unicodeStr = "\\u6E56\\u5317\\u6B66\\u6C49";
        StringBuilder result = new StringBuilder();

        for (int i = 0; i < unicodeStr.length();) {
            if (unicodeStr.startsWith("\\u", i) && i + 6 <= unicodeStr.length()) {
                String hex = unicodeStr.substring(i + 2, i + 6);
                result.append((char) Integer.parseInt(hex, 16));
                i += 6;
            } else {
                result.append(unicodeStr.charAt(i));
                i++;
            }
        }

        System.out.println("解码结果：" + result);
    }
}
```

🧾 **输出**：

```
解码结果：湖北武汉
```

---

## ✅ 工具类封装：`UnicodeUtils.java`

```java
public class UnicodeUtils {

    public static String stringToUnicode(String input) {
        StringBuilder unicodeStr = new StringBuilder();
        for (char c : input.toCharArray()) {
            unicodeStr.append(String.format("\\u%04X", (int) c));
        }
        return unicodeStr.toString();
    }

    public static String unicodeToString(String unicodeStr) {
        StringBuilder result = new StringBuilder();
        int len = unicodeStr.length();
        for (int i = 0; i < len;) {
            if (unicodeStr.charAt(i) == '\\' && i + 5 < len && unicodeStr.charAt(i + 1) == 'u') {
                String hex = unicodeStr.substring(i + 2, i + 6);
                try {
                    result.append((char) Integer.parseInt(hex, 16));
                } catch (NumberFormatException e) {
                    result.append(unicodeStr, i, i + 6);
                }
                i += 6;
            } else {
                result.append(unicodeStr.charAt(i));
                i++;
            }
        }
        return result.toString();
    }

    public static void main(String[] args) {
        String original = "湖北武汉";
        String unicode = stringToUnicode(original);
        System.out.println("字符串 → Unicode: " + unicode);

        String decoded = unicodeToString(unicode);
        System.out.println("Unicode → 字符串: " + decoded);
    }
}
```

🧾 **输出**：

```
字符串 → Unicode: \u6E56\u5317\u6B66\u6C49
Unicode → 字符串: 湖北武汉
```

---

## ✅ 最终功能对比表

| 方法/功能                        | 输入示例                 | 输出示例                 |
| ---------------------------- | -------------------- | -------------------- |
| `stringToUnicode("汉")`       | `"汉"`                | `\u6C49`             |
| `unicodeToString("\\u6C49")` | `\u6C49`             | `"汉"`                |
| `getBytes("UTF-8")`          | `"汉"`                | `[0xE6, 0xB1, 0x89]` |
| `new String(bytes, "UTF-8")` | `[0xE6, 0xB1, 0x89]` | `"汉"`                |

---


