---
title: 正则表达式基础
category:
  - 正则表达式
---

# Java正则表达式完整指南

## 目录

[[toc]]

## 基础概念

### 什么是正则表达式
正则表达式是一种用于匹配字符串中字符组合的模式。在Java中，主要通过`Pattern`和`Matcher`类实现。

### 贪婪匹配 vs 非贪婪匹配
- **贪婪匹配**：默认模式，尽可能匹配最长的字符串
- **非贪婪匹配**：在量词后加`?`，匹配最短的字符串

```java
String s = "abdcababc";
String greedy = "ab(.*)c";      // 匹配 "dcabab"
String nonGreedy = "ab(.*?)c";  // 匹配 "d"
```

## 基本语法

### 特殊字符
| 字符 | 说明 |
|------|------|
| `^` | 匹配字符串开始位置 |
| `$` | 匹配字符串结束位置 |
| `.` | 匹配除换行符外的任意字符 |
| `*` | 匹配前面字符0次或多次 |
| `+` | 匹配前面字符1次或多次 |
| `?` | 匹配前面字符0次或1次 |
| `\` | 转义字符 |
| `|` | 或运算符 |
| `[]` | 字符集合 |
| `()` | 分组 |

### 转义字符
| 字符 | 说明 |
|------|------|
| `\t` | 制表符 |
| `\n` | 换行符 |
| `\r` | 回车符 |
| `\\` | 反斜杠 |
| `\"` | 双引号 |

## 常用字符类

### 预定义字符类
| 字符类 | 说明 | 等价形式 |
|--------|------|----------|
| `\d` | 数字字符 | `[0-9]` |
| `\D` | 非数字字符 | `[^0-9]` |
| `\w` | 单词字符 | `[a-zA-Z0-9_]` |
| `\W` | 非单词字符 | `[^a-zA-Z0-9_]` |
| `\s` | 空白字符 | `[ \t\n\r\f]` |
| `\S` | 非空白字符 | `[^ \t\n\r\f]` |

### 自定义字符类
```java
[abc]       // 匹配 a、b 或 c
[^abc]      // 匹配除 a、b、c 之外的字符
[a-z]       // 匹配小写字母
[A-Z]       // 匹配大写字母
[0-9]       // 匹配数字
[a-zA-Z0-9] // 匹配字母和数字
```

### 中文字符匹配
```java
[\u4e00-\u9fa5]     // 匹配中文字符
[^\x00-\xff]        // 匹配双字节字符（包括中文）
```

## 量词与匹配模式

### 量词
| 量词 | 说明 |
|------|------|
| `{n}` | 精确匹配n次 |
| `{n,}` | 至少匹配n次 |
| `{n,m}` | 匹配n到m次 |
| `*` | 等价于`{0,}` |
| `+` | 等价于`{1,}` |
| `?` | 等价于`{0,1}` |

### 非贪婪量词
在量词后添加`?`变为非贪婪模式：
- `*?` - 非贪婪的0次或多次
- `+?` - 非贪婪的1次或多次
- `??` - 非贪婪的0次或1次
- `{n,m}?` - 非贪婪的n到m次

## 捕获组与命名组

### 普通捕获组
```java
String regex = "(\\d{4})-(\\d{2})-(\\d{2})";
Pattern pattern = Pattern.compile(regex);
Matcher matcher = pattern.matcher("2023-12-25");
if (matcher.find()) {
    String year = matcher.group(1);   // 2023
    String month = matcher.group(2);  // 12
    String day = matcher.group(3);    // 25
}
```

### 命名捕获组
```java
String regex = "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})";
Pattern pattern = Pattern.compile(regex);
Matcher matcher = pattern.matcher("2023-12-25");
if (matcher.find()) {
    String year = matcher.group("year");   // 2023
    String month = matcher.group("month"); // 12
    String day = matcher.group("day");     // 25
}
```

### 非捕获组
```java
(?:pattern)  // 匹配但不捕获
(?=pattern)  // 正向先行断言
(?!pattern)  // 负向先行断言
```

## 常用正则表达式示例

### 数字验证
```java
// 正整数
"^[1-9]\\d*$"

// 非负整数（包括0）
"^[1-9]\\d*|0$"

// 浮点数
"^-?\\d+(\\.\\d+)?$"

// 金额格式（最多两位小数）
"^([1-9]\\d{0,9}|0)(\\.\\d{1,2})?$"
```

### 字符串验证
```java
// 纯英文字母
"^[A-Za-z]+$"

// 英文字母和数字
"^[A-Za-z0-9]+$"

// 用户名（字母开头，5-16位，允许字母数字下划线）
"^[a-zA-Z][a-zA-Z0-9_]{4,15}$"

// 密码强度（6-18位，包含字母数字）
"^[a-zA-Z]\\w{5,17}$"
```

### 联系方式验证
```java
// 中国手机号
"^1[3-9]\\d{9}$"

// 中国固定电话
"^\\d{3}-\\d{8}|\\d{4}-\\d{7}$"

// 邮箱地址
"^\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*$"

// 中国邮政编码
"^[1-9]\\d{5}(?!\\d)$"

// 身份证号
"^\\d{15}|\\d{18}$"
```

### 网络相关
```java
// URL
"^[a-zA-z]+://[^\\s]*$"

// IP地址
"^\\d+\\.\\d+\\.\\d+\\.\\d+$"

// MAC地址
"^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
```

## 日期验证

### 简单日期格式
```java
// YYYY-MM-DD 基本格式
"^\\d{4}-(\\-|\\/|\\.)\\d{1,2}\\1\\d{1,2}$"

// 支持多种分隔符的日期格式
"^(\\d{4}|\\d{2})(\\-|\\/|\\.)\\d{1,2}\\3\\d{1,2}$"
```

### 精确日期验证（包含闰年）
```java
// 完整的日期验证正则（YYYY-MM-DD格式）
String dateRegex = "^(([0-9]{3}[1-9]|[0-9]{2}[1-9][0-9]{1}|[0-9]{1}[1-9][0-9]{2}|[1-9][0-9]{3})" +
    "-(((0[13578]|1[02])-(0[1-9]|[12][0-9]|3[01]))" +
    "|((0[469]|11)-(0[1-9]|[12][0-9]|30))" +
    "|(02-(0[1-9]|[1][0-9]|2[0-8]))))" +
    "|((([0-9]{2})(0[48]|[2468][048]|[13579][26])" +
    "|((0[48]|[2468][048]|[3579][26])00))-02-29)$";
```

### 推荐的日期验证方法
结合正则表达式和日期函数的验证方式更为可靠：

```java
public static boolean isValidDate(String dateStr) {
    Pattern pattern = Pattern.compile("^(\\d{1,4})(-|/)(\\d{1,2})\\2(\\d{1,2})$");
    Matcher matcher = pattern.matcher(dateStr);
    
    if (!matcher.matches()) {
        return false;
    }
    
    try {
        int year = Integer.parseInt(matcher.group(1));
        int month = Integer.parseInt(matcher.group(3));
        int day = Integer.parseInt(matcher.group(4));
        
        LocalDate date = LocalDate.of(year, month, day);
        return date.getYear() == year && 
               date.getMonthValue() == month && 
               date.getDayOfMonth() == day;
    } catch (Exception e) {
        return false;
    }
}
```

## 表单输入控制

### JavaScript中的输入限制
```javascript
// 只允许数字
onkeyup="value=value.replace(/[^\\d]/g,'')"

// 只允许中文
onkeyup="value=value.replace(/[^\\u4E00-\\u9FA5]/g,'')"

// 只允许英文字母
onkeyup="value=value.replace(/[^A-Za-z]/g,'')"

// 只允许字母数字下划线
onkeyup="value=value.replace(/[\\W]/g,'')"

// 金额格式（整数或最多两位小数）
onkeyup="value=value.replace(/[^0-9.]/g,'').replace(/(\\.[0-9]{2})[0-9]*/g,'$1')"
```

### HTML5 pattern属性
```html
<!-- 手机号码 -->
<input type="tel" pattern="^1[3-9]\\d{9}$" title="请输入正确的手机号码">

<!-- 邮箱 -->
<input type="email" pattern="^\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*$">

<!-- 身份证 -->
<input type="text" pattern="^\\d{15}|\\d{18}$" title="请输入15或18位身份证号">
```

## 最佳实践

### 1. 性能优化
```java
// 预编译正则表达式
private static final Pattern EMAIL_PATTERN = 
    Pattern.compile("^\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*$");

public boolean isValidEmail(String email) {
    return EMAIL_PATTERN.matcher(email).matches();
}
```

### 2. 使用非捕获组
当不需要提取匹配内容时，使用非捕获组`(?:)`提高性能：
```java
// 低效
"(https?|ftp)://(www\\.)?([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,4}"

// 高效
"(?:https?|ftp)://(?:www\\.)?(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,4}"
```

### 3. 合理使用字符类
```java
// 推荐
"[0-9]+"

// 不推荐（在某些环境下可能包含其他数字字符）
"\\d+"
```

### 4. 边界匹配
```java
// 精确匹配整个字符串
"^\\d+$"

// 匹配字符串中的数字部分
"\\d+"
```

### 5. 常用工具方法
```java
public class RegexUtils {
    
    public static boolean matches(String regex, String input) {
        return Pattern.matches(regex, input);
    }
    
    public static String replaceAll(String input, String regex, String replacement) {
        return input.replaceAll(regex, replacement);
    }
    
    public static List<String> findAll(String regex, String input) {
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(input);
        List<String> results = new ArrayList<>();
        
        while (matcher.find()) {
            results.add(matcher.group());
        }
        
        return results;
    }
}
```

### 6. 调试技巧
- 使用在线正则表达式测试工具
- 将复杂正则分解为多个简单部分
- 添加注释说明正则表达式的用途
- 编写单元测试验证正则表达式的正确性

```java
@Test
public void testEmailRegex() {
    String emailRegex = "^\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*$";
    
    // 有效邮箱
    assertTrue(Pattern.matches(emailRegex, "test@example.com"));
    assertTrue(Pattern.matches(emailRegex, "user.name@domain.co.uk"));
    
    // 无效邮箱
    assertFalse(Pattern.matches(emailRegex, "invalid.email"));
    assertFalse(Pattern.matches(emailRegex, "@domain.com"));
}
```

## 总结

正则表达式是处理字符串的强大工具，但也要注意：

1. **简洁性**：复杂的正则表达式难以维护，考虑拆分或使用其他方法
2. **性能**：对于频繁使用的正则，预编译Pattern对象
3. **可读性**：为复杂正则添加注释说明
4. **测试**：编写充分的测试用例验证正则表达式的正确性
5. **国际化**：注意Unicode字符的处理

记住：正则表达式是工具，不是万能的解决方案。在某些情况下，使用专门的解析器或验证库可能更合适。