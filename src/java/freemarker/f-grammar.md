---
title: FreeMarker 语法进阶指南
category:
  - java
  - 模版引擎
tag:
  - FreeMarker
---

# FreeMarker 语法进阶指南

FreeMarker 作为一款强大的模板引擎，提供了丰富的语法特性来处理复杂的模板逻辑。本文档将深入介绍 FreeMarker 的进阶语法特性，帮助您更高效地使用这个模板引擎。

## 1. 变量存在性检查

### 1.1 `??` 操作符
`??` 操作符用于检查对象是否存在（非 null）：

```FreeMarker
<#if object??>
    对象存在，可以安全使用
<#else>
    对象不存在或为 null
</#if>
```

### 1.2 `?exists` 关键字
另一种检查对象存在性的方式：

```FreeMarker
<#if object?exists>
    对象存在
</#if>
```

### 1.3 安全输出
结合存在性检查进行安全输出：

```FreeMarker
<#if str??>
    ${str?string}
</#if>
```

## 2. 类型检查内建函数

FreeMarker 提供了一系列 `is_xxx` 内建函数来判断变量的类型，这些函数对于动态处理不同类型的数据非常有用。

<img :src="$withBase('/assets/images/freeMarker/f-neijian.png')" 
  alt="内建函数"
  height="auto">

### 2.1 数字类型检查 `?is_number`
```FreeMarker
<#if value?is_number>
    ${value?string('#.##')}  <!-- 格式化数字输出 -->
<#else>
    ${value}  <!-- 非数字直接输出 -->
</#if>
```

### 2.2 字符串类型检查 `?is_string`
```FreeMarker
<#if value?is_string>
    字符串值：${value}
<#else>
    非字符串类型
</#if>
```

### 2.3 布尔类型检查 `?is_boolean`
```FreeMarker
<#if value?is_boolean>
    布尔值：${value?string('是', '否')}
<#else>
    非布尔类型
</#if>
```

### 2.4 日期类型检查 `?is_date`
```FreeMarker
<#if value?is_date>
    日期值：${value?string('yyyy-MM-dd')}
<#else>
    非日期类型
</#if>
```

### 2.5 序列类型检查 `?is_sequence`
```FreeMarker
<#if value?is_sequence>
    <#list value as item>
        ${item}
    </#list>
<#else>
    非序列类型
</#if>
```

### 2.6 哈希类型检查 `?is_hash`
```FreeMarker
<#if value?is_hash>
    这是一个对象/Map
<#else>
    非对象类型
</#if>
```

### 2.7 方法类型检查 `?is_method`
```FreeMarker
<#if value?is_method>
    这是一个可调用的方法
<#else>
    非方法类型
</#if>
```

### 2.8 实际应用示例
动态处理数组中的不同类型数据：

```FreeMarker
<#list dataArray as item>
    <#if item?is_number>
        数字：${item?string('#.##')}
    <#elseif item?is_string>
        字符串：${item}
    <#elseif item?is_boolean>
        布尔：${item?string('真', '假')}
    <#elseif item?is_date>
        日期：${item?string('yyyy-MM-dd HH:mm:ss')}
    <#else>
        其他类型：${item}
    </#if>
</#list>
```

### 2.9 复杂数据处理示例
结合存在性检查和类型检查的完整示例：

```FreeMarker
<#-- 处理表格数据，根据类型进行不同的格式化 -->
<#list rows as r>
    <#list 0..<columnCount as i>
        <#if r[i]??>
            <#if r[i]?is_number>
                ${(r[i]?string('#.##'))!}
            <#elseif r[i]?is_date>
                ${(r[i]?string('yyyy-MM-dd'))!}
            <#elseif r[i]?is_boolean>
                ${(r[i]?string('是', '否'))!}
            <#else>
                ${(r[i])!}
            </#if>
        <#else>
            <!-- 空值处理 -->
            -
        </#if>
        <#if i_has_next> | </#if>
    </#list>
</#list>
```

## 3. 条件语句进阶

### 3.1 复杂条件判断
使用比较运算符进行复杂的条件判断：

```FreeMarker
<#if student.studentAge lt 12>
    ${student.studentName}不是一个初中生
<#elseif student.studentAge lt 15>
    ${student.studentName}不是一个高中生
<#elseif student.studentAge lt 18>
    ${student.studentName}不是一个大学生
<#else>
    ${student.studentName}是一个大学生
</#if>
```

### 3.2 布尔类型判断
处理布尔值时需要转换为字符串进行比较：

```FreeMarker
<#if (booleanVal?string('yes', 'no'))=='yes'>
    布尔值为 true
</#if>
```

## 4. 字符串操作详解

### 4.1 字符串截取
使用 `substring` 方法截取字符串：

```FreeMarker
${'hello world'?substring(0)}     <!-- 结果：hello world -->
${'hello world'?substring(6)}     <!-- 结果：world -->
${'hello world'?substring(0,5)}   <!-- 结果：hello -->
```

### 4.2 大小写转换
```FreeMarker
${'hello'?cap_first}      <!-- 结果：Hello -->
${'Hello'?uncap_first}    <!-- 结果：hello -->
${'hello'?capitalize}     <!-- 结果：HELLO -->
${'HELLO'?lower_case}     <!-- 结果：hello -->
${'hello'?upper_case}     <!-- 结果：HELLO -->
```

### 4.3 字符串查找和替换
```FreeMarker
<!-- 查找子字符串位置 -->
${"hello world"?index_of("world")}    <!-- 结果：6 -->
${"hello world"?index_of("abc")}      <!-- 结果：-1 -->

<!-- 替换字符串 -->
${"hello world"?replace("world", "FreeMarker")}  <!-- 结果：hello FreeMarker -->
```

### 4.4 字符串包含检查
```FreeMarker
<#if "apple,banana,orange"?contains("apple")>
    包含 apple
</#if>

<!-- 或者使用布尔值转字符串 -->
${"hello world"?contains("world")?string}  <!-- 结果：true -->
```

### 4.5 字符串结尾检查
```FreeMarker
${"filename.txt"?ends_with(".txt")?string}  <!-- 结果：true -->
```

### 4.6 字符串分割
```FreeMarker
<#list "apple,banana,orange"?split(",") as fruit>
    ${fruit}
</#list>
<!-- 输出：
apple
banana  
orange
-->
```

### 4.7 字符串长度和清理
```FreeMarker
${"hello world"?length}    <!-- 结果：11 -->
${" hello world "?trim}    <!-- 结果：hello world -->
```

## 5. 数据类型转换

### 5.1 字符串转数字
```FreeMarker
${"123.45"?number}  <!-- 结果：123.45 -->
```

### 5.2 日期时间格式化
```FreeMarker
<#assign date1="2023-12-25"?date("yyyy-MM-dd")>
<#assign time1="14:30:00"?time("HH:mm:ss")>
<#assign datetime1="2023-12-25 14:30:00"?datetime("yyyy-MM-dd HH:mm:ss")>

${date1}      <!-- 显示日期 -->
${time1}      <!-- 显示时间 -->
${datetime1}  <!-- 显示日期时间 -->

<!-- 当前时间格式化 -->
${nowDate?date}  <!-- 如：2023-12-25 -->
${nowDate?time}  <!-- 如：14:30:00 -->
```

## 6. HTML 安全处理
```FreeMarker
${"<script>alert('xss')</script>"?html}
<!-- 结果：&lt;script&gt;alert('xss')&lt;/script&gt; -->
```

## 7. 循环控制进阶

### 7.1 循环状态判断
使用 `_has_next` 判断是否为最后一项，常用于控制分隔符显示：

```FreeMarker
<#list ["苹果","香蕉","橘子"] as fruit>
    <span>${fruit}</span><#if fruit_has_next>,</#if>
</#list>
<!-- 输出：<span>苹果</span>,<span>香蕉</span>,<span>橘子</span> -->
```

### 7.2 循环索引使用
```FreeMarker
<#list items as item>
    ${item_index}: ${item}  <!-- item_index 从0开始 -->
    <!-- 或者使用 item_index + 1 从1开始编号 -->
</#list>
```

## 8. 特殊字符转义

### 8.1 输出 FreeMarker 语法字符
当需要在模板中输出 `${` 和 `}` 字符时：

```FreeMarker
${r"${"}variableName${r"}"}
<!-- 输出：${variableName} -->
```

这种方式常用于生成其他模板文件或配置文件。

## 9. 实用技巧总结

### 9.1 安全的变量输出
```FreeMarker
<!-- 推荐的安全输出方式 -->
<#if variable??>
    ${variable}
<#else>
    默认值
</#if>

<!-- 或使用默认值操作符 -->
${variable!"默认值"}
```

### 9.2 复杂条件组合
```FreeMarker
<#if (user?? && user.age?? && user.age > 18)>
    成年用户
<#elseif (user?? && user.name??)>
    未成年用户：${user.name}
<#else>
    访客用户
</#if>
```

### 9.3 字符串处理链式调用
```FreeMarker
${"  Hello World  "?trim?lower_case?replace(" ", "_")}
<!-- 结果：hello_world -->
```

## 10. 最佳实践建议

1. **始终检查变量存在性**：使用 `??` 避免 null 指针异常
2. **利用类型检查函数**：使用 `?is_number`、`?is_string` 等进行类型判断
3. **合理使用字符串方法**：根据需求选择合适的字符串处理方法
4. **注意数据类型**：布尔值需要转换为字符串才能输出
5. **善用循环状态**：使用 `_has_next` 等状态变量优化输出格式
6. **转义特殊字符**：处理用户输入时使用 `?html` 防止 XSS 攻击
7. **动态类型处理**：结合类型检查和条件语句处理复杂的动态数据