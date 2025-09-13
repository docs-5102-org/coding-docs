---
title: GMT、UTC、CST、ISO的概念
category:
  - java
tag:
  - GMT
  - UTC
  - CST
  - ISO
---



---

# GMT、UTC、CST、ISO的概念

## 一、常见时间标准概念

| 缩写      | 含义                                              | 描述                                                                                                                                                                                             |
| ------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GMT** | Greenwich Mean Time                             | 格林尼治时间，旧的世界标准时间。                                                                                                                                                                               |
| **UTC** | Coordinated Universal Time                      | 世界协调时间，当前通用的世界标准时间，替代 GMT。                                                                                                                                                                     |
| **CST** | Central Standard Time / China Standard Time / 等 | 有多个含义，请结合上下文理解：<br> - 中国标准时间（China Standard Time）：UTC+8<br> - 美国中央时间（Central Standard Time）：UTC-6<br> - 古巴标准时间（Cuba Standard Time）：UTC-4<br> - 澳大利亚中央时间（Australia Central Standard Time）：UTC+9 |
| **ISO** | ISO 8601 标准                                     | 一种日期/时间的国际标准格式。例如：`2000-10-31`、`2021-07-20T11:27:31Z` 等。                                                                                                                                       |

---

## 二、Java 中的时间格式化工具函数

### 1. 获取当前时间的格式化字符串

```java
/**
 * 获取当前时间的字符串表示形式，基于指定的时区和格式。
 * @param zone 指定的时区
 * @param pattern 时间格式，例如："yyyy-MM-dd HH:mm:ss"
 * @param locale 语言环境，例如：Locale.US、Locale.CHINA
 * @return 格式化后的时间字符串
 */
private static String getCurrentTimeStr(ZoneId zone, String pattern, Locale locale) {
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern, locale);
    return ZonedDateTime.now(zone).format(formatter);
}
```

---

### 2. 获取当前 GMT 时间字符串

```java
/**
 * 获取当前 GMT（格林尼治标准时间）字符串。
 * 格式：Thu, 22 Sep 2022 09:41:01 GMT
 */
public static String getCurrentGMTTime() {
    return getCurrentTimeStr(ZoneId.of("GMT"), "EEE, d-MMM-yyyy HH:mm:ss z", Locale.CHINA);
}
```

### 3. 获取当前 GMT 时间（指定语言）

```java
/**
 * 获取当前 GMT 时间（指定语言环境）。
 * @param locale 语言环境，例如：Locale.US、Locale.DE
 */
public static String getCurrentGMTTime(Locale locale) {
    return getCurrentTimeStr(ZoneId.of("GMT"), "EEE, d-MMM-yyyy HH:mm:ss z", locale);
}
```

---

### 4. 获取当前 UTC 时间（ISO 格式）

```java
/**
 * 获取当前 UTC 时间，格式为 ISO 8601。
 * 示例：20210720T112731Z
 */
public static String getCurrentUTCTime() {
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'")
        .withZone(ZoneId.of("UTC+8")); // 注意：如需纯 UTC 请改为 ZoneId.of("UTC")
    return Instant.now().atZone(ZoneId.of("UTC+8")).format(formatter);
}
```

---

### 5. GMT 字符串转普通日期格式

```java
/**
 * 将 GMT 时间格式转换为指定格式的日期字符串。
 * @param gmtTimeStr GMT 格式字符串（如："Thu, 22 Sep 2022 09:41:01 GMT"）
 * @param locale 语言环境（默认 Locale.US）
 * @param pattern 目标格式（如："yyyy-MM-dd HH:mm:ss"）
 * @return 转换后的时间字符串
 */
public static String gmtStrToDateStr(String gmtTimeStr, Locale locale, String pattern) {
    try {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(
            "EEE, dd MMM yyyy HH:mm:ss 'GMT'",
            locale != null ? locale : Locale.US
        );
        LocalDateTime parsedTime = LocalDateTime.parse(gmtTimeStr, formatter);
        return parsedTime.format(DateTimeFormatter.ofPattern(pattern));
    } catch (Exception e) {
        System.err.println("Error parsing GMT time string: " + e.getMessage());
        return null;
    }
}
```

---

### 6. 获取当前 CST（美国中央标准时间）

```java
/**
 * 获取当前 CST（美国中央标准时间）时间。
 * 格式：Thu Sep 22 15:00:00 CST 2022
 */
public static String getCurrentCSTTime() {
    return getCurrentTimeStr(
        ZoneId.of("America/Chicago"),
        "EEE MMM dd HH:mm:ss 'CST' yyyy",
        Locale.US
    );
}
```

---

## 三、常用时间格式说明（Java 示例）

| 格式                           | 示例                              | 描述                     |
| ---------------------------- | ------------------------------- | ---------------------- |
| `yyyy-MM-dd`                 | `2024-07-18`                    | 年-月-日                  |
| `EEE, d-MMM-yyyy HH:mm:ss z` | `Thu, 18-Jul-2024 09:41:01 GMT` | RFC 风格，常用于 HTTP Header |
| `yyyyMMdd'T'HHmmss'Z'`       | `20240718T115000Z`              | ISO 8601 UTC 时间格式      |

---

如果你需要兼容国际化和标准接口（如 API、日志、数据库等），推荐统一使用 **ISO 8601 UTC 时间格式**。

如需进一步封装成工具类或扩展格式支持，可继续优化代码逻辑。

是否需要我帮你封装为一个完整的 `TimeUtils` 工具类？
