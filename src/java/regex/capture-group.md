---
title: 正则表达式捕获组
category:
  - Java
  - 正则表达式
---

# 正则表达式捕获组指南

[[toc]]

## 前言

在Java中，正则表达式的捕获组（Capturing Groups）是一个非常强大的特性，它允许我们从复杂的文本模式中提取出特定的部分。本文将详细介绍捕获组的概念、语法和实际应用。

## 什么是捕获组？

捕获组是正则表达式中一种用于提取匹配文本的特性。通过将部分正则表达式包含在圆括号 `()` 中来创建捕获组。每个捕获组可以单独访问匹配的文本。

## 捕获组的基本语法

1. `(pattern)` - 创建一个捕获组
2. `(?:pattern)` - 创建一个非捕获组（不存储匹配结果）
3. `\n` - 反向引用第n个捕获组（n是一个数字）

## 正则表达式基本元字符

|字符|描述|
|---|---|
|.|匹配除"\r\n"之外的任何单个字符。要匹配包括"\r\n"在内的任意字符，请使用"[\s\S]"之类的模式。|
|*|零次或多次匹配前面的字符或子表达式。例如，zo* 匹配"z"和"zoo"。* 等效于 {0,}。|
|?|当此字符紧随任何其他限定符（*、+、?、{n}、{n,}、{n,m}）之后时，匹配模式是"非贪心的"。|

## 贪婪匹配 vs 非贪婪匹配

### 贪婪匹配
- 默认情况下，正则表达式使用贪婪匹配
- 会尽量匹配最长的结果
- 会进行回溯，直到匹配不能继续为止
- 使用 `(.*)`

### 非贪婪匹配
- 在量词后添加 `?` 使用非贪婪匹配
- 尽量匹配最短的结果
- 不会进行回溯，匹配到就停止
- 使用 `(.*?)`

## 实例演示

### 示例一：贪婪vs非贪婪匹配

```java
String s = "abdcababc";
String regx1 = "ab(.*)c";     // 贪婪匹配
String regx2 = "ab(.*?)c";    // 非贪婪匹配
Pattern pattern1 = Pattern.compile(regx1);
Pattern pattern2 = Pattern.compile(regx2);
Matcher matcher1 = pattern1.matcher(s);
Matcher matcher2 = pattern2.matcher(s);

matcher1.find();
System.out.println(matcher1.group(1)); // 输出 dcabab
matcher2.find();
System.out.println(matcher2.group(1)); // 输出 d
```

### 示例二：URL解析

```java
String s = "https://www.douyin.com/music/1232";
String regx1 = "https://www.douyin.com/music/(.*)";    // 贪婪匹配
String regx2 = "https://www.douyin.com/music/(.*?)";   // 非贪婪匹配
Pattern pattern1 = Pattern.compile(regx1);
Pattern pattern2 = Pattern.compile(regx2);
Matcher matcher1 = pattern1.matcher(s);
Matcher matcher2 = pattern2.matcher(s);

matcher1.find();
System.out.println(matcher1.group(1)); // 输出 1232
matcher2.find();
System.out.println(matcher2.group(1)); // 什么都不输出
```

## 捕获组的常见用法

### 1. 基本捕获

```java
String text = "John Doe";
Pattern pattern = Pattern.compile("(\\w+)\\s(\\w+)");
Matcher matcher = pattern.matcher(text);
if (matcher.find()) {
    String firstName = matcher.group(1); // John
    String lastName = matcher.group(2);  // Doe
}
```

### 2. 命名捕获组

```java
String text = "John Doe";
Pattern pattern = Pattern.compile("(?<firstName>\\w+)\\s(?<lastName>\\w+)");
Matcher matcher = pattern.matcher(text);
if (matcher.find()) {
    String firstName = matcher.group("firstName"); // John
    String lastName = matcher.group("lastName");   // Doe
}
```

### 3. 捕获组的替换

```java
String text = "John Doe";
String result = text.replaceAll("(\\w+)\\s(\\w+)", "$2, $1"); // Doe, John
```

## 最佳实践

1. 使用命名捕获组提高代码可读性
2. 当不需要捕获组的内容时，使用非捕获组 `(?:pattern)` 提高性能
3. 注意贪婪匹配可能导致的性能问题，适时使用非贪婪匹配
4. 在处理大文本时，考虑使用非捕获组来减少内存使用

## 实际应用示例

### 1. 解析SQL建表语句

```java
// 匹配整个DDL，将DDL分为表名、列SQL部分、表注释
private static final Pattern DDL_PATTERN = Pattern.compile(
    "\\s*create\\s+table\\s+(?<tableName>\\S+)[^\\(]*\\(" + 
    "(?<columnsSQL>[\\s\\S]+)\\)" +
    "[^\\)]+?(comment\\s*(=|on\\s+table)\\s*'(?<tableComment>.*?)'\\s*;?)?$", 
    Pattern.CASE_INSENSITIVE
);

// 匹配列的定义，解析列名、类型和注释
private static final Pattern COL_PATTERN = Pattern.compile(
    "\\s*(?<fieldName>\\S+)\\s+" +
    "(?<fieldType>\\w+)\\s*(?:\\([\\s\\d,]+\\))?" +
    "((?!comment).)*(comment\\s*'(?<fieldComment>.*?)')?\\s*(,|$)", 
    Pattern.CASE_INSENSITIVE
);

public static void parse(String sql) {
    Matcher matcher = DDL_PATTERN.matcher(sql);
    if (matcher.find()) {
        String tableName = matcher.group("tableName");
        String tableComment = matcher.group("tableComment");
        System.out.println(tableName + "\t\t" + tableComment);
        
        String columnsSQL = matcher.group("columnsSQL");
        if (columnsSQL != null && columnsSQL.length() > 0) {
            Matcher colMatcher = COL_PATTERN.matcher(columnsSQL);
            while (colMatcher.find()) {
                String fieldName = colMatcher.group("fieldName");
                String fieldType = colMatcher.group("fieldType");
                String fieldComment = colMatcher.group("fieldComment");
                if (!"key".equalsIgnoreCase(fieldType)) {
                    System.out.println(fieldName + "\t\t" + fieldType + "\t\t" + fieldComment);
                }
            }
        }
    }
}

// 使用示例
String createTableSQL = "CREATE TABLE `userinfo` (\n" +
    "  `user_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '用户ID',\n" +
    "  `username` varchar(255) NOT NULL COMMENT '用户名',\n" +
    "  `addtime` datetime NOT NULL COMMENT '创建时间',\n" +
    "  PRIMARY KEY (`user_id`)\n" +
    ") ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户信息';";

parse(createTableSQL);
// 输出:
// `userinfo`        用户信息
// `user_id`        int        用户ID
// `username`       varchar    用户名
// `addtime`       datetime   创建时间
```

### 2. 解析JSON脚本标签

```java
// 正则
String regex1 = "<script id=\"RENDER_DATA\" type=\"application/json\">(?<data>(.*?))</script>";
String regex2 = "<script id=\"RENDER_DATA\" type=\"application/json\">(?<data>[\\s\\S]*?)</script>";
// 解析内容
String str = "<script id=\"RENDER_DATA\" type=\"application/json\">{\"abc\":1}</script>";
Pattern p = Pattern.compile(regex1);
Matcher matcher = p.matcher(str);
if(matcher.find()){
    System.out.println("group = " + matcher.group("data")); // 输出: {"abc":1}
}
```

说明：
- 捕获组名称为 `data`
- `(?<data>(.*?))` 使用非贪婪方式匹配
- `(?<data>[\\s\\S]*?)` 是另一种匹配任意字符的方式，包括换行符

### 3. 解析章节标题

```java
String regex1 = "第(?<sort>[\\s\\S]*?)[章|卷|回合]";
String str = "第1章";
Pattern p = Pattern.compile(regex1);
Matcher matcher = p.matcher(str);
if(matcher.find()){
    System.out.println("group = " + matcher.group("sort")); // 输出: 1
}
```

说明：
- 使用命名捕获组 `sort` 提取章节序号
- `[章|卷|回合]` 匹配多个可能的章节单位
- 使用非贪婪匹配确保只获取数字部分

### 4. 解析小说URL ID

```java
String regex1 = "https://m.yunyue.cc/book/(?<novelId>[\\s\\S]*)/";
String str = "https://m.yunyue.cc/book/644323431/";
Pattern p = Pattern.compile(regex1);
Matcher matcher = p.matcher(str);
if(matcher.find()){
    System.out.println("group = " + matcher.group("novelId")); // 输出: 644323431
}
```

说明：
- 使用命名捕获组 `novelId` 提取URL中的ID部分
- 使用 `[\\s\\S]*` 匹配任意字符（包括换行）
- URL末尾的 `/` 作为边界确保准确匹配

## 常见使用场景

### 1. 匹配两个字符之间的内容

在处理字符串时，经常需要提取两个特定字符之间的内容。以下是三种常见场景：

```java
// 1. 包含边界字符的匹配
String pattern1 = "A.*?B";  // 匹配包含A和B的内容
// 示例：Abaidu.comB -> Abaidu.comB

// 2. 包含开始字符但不包含结束字符
String pattern2 = "A.*?(?=B)";  // 匹配包含A但不包含B的内容
// 示例：Awww.apizl.comB -> Awww.apizl.com

// 3. 不包含边界字符的匹配
String pattern3 = "(?<=A).*?(?=B)";  // 匹配不包含A和B的内容
// 示例：Awww.baidu.comB -> www.baidu.com
```

说明：
- `(?<=A)` 表示后向预查，匹配A之后的位置但不包含A
- `(?=B)` 表示前向预查，匹配B之前的位置但不包含B
- `.*?` 使用非贪婪模式匹配中间的内容

### 2. 章节标题匹配

```java
// 匹配章节编号
String pattern = "第\\d{1,3}章";  // 匹配"第000章"格式
// 在替换时可以使用 $0 引用完整匹配
// 示例：将"第001章"替换为"第$0章" -> "第001章"

// 更灵活的章节匹配
String pattern2 = "第(?<number>\\d{1,3})[章|卷|回]";
// 可以匹配"第1章"、"第1卷"、"第1回"等格式
```

### 3. 特殊字符前的内容匹配

```java
// 匹配冒号前的内容
String pattern = ".*?(?=:)";
// 示例：groupName: 'basic' -> groupName

// 匹配多个运算符前的内容
String pattern2 = ".*?(?=>|<)";
// 示例：$abc>=10&&$ABC<20 -> 分别匹配 $abc 和 $ABC

Pattern p = Pattern.compile(pattern2);
Matcher m = p.matcher("$abc>=10&&$ABC<20");
while(m.find()) {
    System.out.println(m.group()); // 输出变量名
}
```

### 4. 中括号内容匹配

```java
String str = "text[input]more text";
String pattern = "(?<=\\[).*?(?=\\])";
Pattern r = Pattern.compile(pattern);
Matcher matcher = r.matcher(str);
if (matcher.find()) {
    String content = matcher.group(0); // 得到 "input"
}
```

### 5. HTML标签处理

```java
// 匹配font标签内容并保留内部文本
String pattern = "<font.*?>(.*?)</font>";
// 使用 $1 引用第一个捕获组
// 示例：<font color="red">text</font> -> text

// 复杂的多模式匹配
String pattern2 = "<font.*?>(.*?)</font>|`\\*\\*(.*?)\\*\\*`|`\\*\\*<font.*?>(.*?)</font>\\*\\*`";
// 可以用 $1$2$3 引用不同捕获组的内容
```

## 进阶技巧

1. **正则表达式的可维护性**
   - 使用命名捕获组提高代码可读性
   - 为复杂的正则表达式添加注释
   - 将复杂的正则表达式分解成小部分

2. **性能优化**
   - 使用非捕获组 `(?:pattern)` 减少内存使用
   - 适当使用非贪婪匹配避免回溯
   - 使用边界匹配 `^`, `$`, `\\b` 提高匹配效率

3. **调试技巧**
   - 使用在线正则表达式测试工具
   - 分步测试复杂的正则表达式
   - 使用 Pattern.COMMENTS 标志使正则表达式更易读

## 参考资料

1. Java官方文档：
   - [Pattern (Java Platform SE 8)](https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html)
   - [Matcher (Java Platform SE 8)](https://docs.oracle.com/javase/8/docs/api/java/util/regex/Matcher.html)

2. 在线工具：
   - [regex101](https://regex101.com/) - 在线正则表达式测试
   - [RegExr](https://regexr.com/) - 正则表达式学习工具

3. 更多学习资源：
   - [Java Regular Expressions](https://www.runoob.com/java/java-regular-expressions.html)
   - [Regular-Expressions.info](https://www.regular-expressions.info/)
