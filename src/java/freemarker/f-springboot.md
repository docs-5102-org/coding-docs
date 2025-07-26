---
title: SpringBoot集成Freemarker
category:
  - java
  - 模版引擎
  - SpringBoot
tag:
  - FreeMarker
---

# SpringBoot集成Freemarker

## 1. Freemarker简介

Freemarker是一个基于Java的模板引擎，专注于使用模板和数据模型生成文本输出（HTML网页、电子邮件、配置文件、源代码等）。它不是一个Web框架，而是一个可以与任何框架集成的通用工具。

### 1.1 主要特点

- **纯Java实现**：易于集成到Java项目中
- **模板与业务逻辑分离**：实现了MVC设计模式
- **强大的模板语言**：支持条件判断、循环、宏定义等
- **不需要编译**：模板修改后即时生效
- **国际化支持**：内置本地化支持

## 2. SpringBoot集成Freemarker

### 2.1 添加依赖

在`pom.xml`中添加Freemarker依赖：

```xml
<!-- freemarker模板引擎 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-freemarker</artifactId>
</dependency>
```

在本项目中使用的版本：

```xml
<dependency>
    <groupId>org.freemarker</groupId>
    <artifactId>freemarker</artifactId>
    <version>2.3.31</version>
</dependency>
```

### 2.2 配置Freemarker

在`application.properties`或`application.yml`中进行配置：

```properties
# Freemarker配置
spring.freemarker.template-loader-path=classpath:/templates/
spring.freemarker.cache=false
spring.freemarker.charset=UTF-8
spring.freemarker.check-template-location=true
spring.freemarker.content-type=text/html
spring.freemarker.expose-request-attributes=true
spring.freemarker.expose-session-attributes=true
spring.freemarker.request-context-attribute=request
spring.freemarker.suffix=.ftl
```

## 3. Freemarker基础语法

### 3.1 基本指令

| 指令 | 描述 |
| --- | --- |
| `${...}` | 插值表达式，用于输出变量值 |
| `<#if condition>...</#if>` | 条件判断 |
| `<#list items as item>...</#list>` | 循环遍历 |
| `<#include "path">` | 包含其他模板 |
| `<#assign name=value>` | 变量赋值 |
| `<#macro name>...</#macro>` | 定义宏 |
| `<@name />` | 调用宏 |

### 3.2 变量与表达式

```
${变量名} - 输出变量值
${变量名!默认值} - 设置默认值
${变量名?string("yes", "no")} - 布尔值格式化
${数值?string(",##0.00")} - 数值格式化
${日期?string("yyyy-MM-dd")} - 日期格式化
```

### 3.3 条件判断

```
<#if condition>
    满足条件时显示的内容
<#elseif condition2>
    满足条件2时显示的内容
<#else>
    不满足条件时显示的内容
</#if>
```

### 3.4 循环遍历

```
<#list items as item>
    ${item.property}
    <#if item_has_next>,</#if>
<#else>
    列表为空时显示的内容
</#list>
```

循环状态变量：
- `item_index`: 当前项的索引（从0开始）
- `item_has_next`: 是否有下一项
- `item_is_first`: 是否是第一项
- `item_is_last`: 是否是最后一项

## 4. 在SpringBoot中使用Freemarker

### 4.1 创建控制器

```java
@Controller
public class HomeController {
    
    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("title", "Freemarker示例");
        model.addAttribute("message", "欢迎使用Freemarker!");
        
        List<User> users = new ArrayList<>();
        users.add(new User("张三", 25));
        users.add(new User("李四", 30));
        model.addAttribute("users", users);
        
        return "home";  // 对应templates/home.ftl
    }
}
```

### 4.2 创建模板文件

在`src/main/resources/templates`目录下创建`home.ftl`：

```html
<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
</head>
<body>
    <h1>${message}</h1>
    
    <h2>用户列表：</h2>
    <ul>
    <#list users as user>
        <li>${user.name} - ${user.age}岁</li>
    </#list>
    </ul>
</body>
</html>
```

## 5. 高级特性

### 5.1 宏定义

宏是可重用的模板片段：

```
<#macro input name label type="text">
<div class="form-group">
    <label for="${name}">${label}</label>
    <input type="${type}" id="${name}" name="${name}">
</div>
</#macro>

<@input name="username" label="用户名" />
<@input name="password" label="密码" type="password" />
```

### 5.2 命名空间

导入其他模板的宏：

```
<#import "/common/forms.ftl" as forms>
<@forms.input name="username" label="用户名" />
```

### 5.3 内建函数

Freemarker提供了许多内建函数用于处理变量：

```
${name?upper_case} - 转为大写
${name?lower_case} - 转为小写
${name?cap_first} - 首字母大写
${name?length} - 获取长度
${name?substring(0, 5)} - 截取子字符串
${name?replace("a", "b")} - 替换字符串
${list?size} - 获取集合大小
${list?sort} - 对集合排序
${list?join(",")} - 将集合连接为字符串
```

## 6. 项目中的Freemarker应用

项目地址：[代码生成器](https://gitee.com/fast-template-org/fast-plus-generator)

本项目中主要使用Freemarker作为代码生成器的模板引擎，通过`EnhanceFreemarkerTemplateEngine`类扩展了Freemarker的功能。

### 6.1 自定义Freemarker模板引擎

项目中的`EnhanceFreemarkerTemplateEngine`类继承自`FreemarkerTemplateEngine`，增强了自定义文件输出功能：

```java
public final class EnhanceFreemarkerTemplateEngine extends FreemarkerTemplateEngine {
    @Override
    protected void outputCustomFile(@NotNull List<CustomFile> customFiles, @NotNull TableInfo tableInfo, @NotNull Map<String, Object> objectMap) {
        Map<String, Object> tableInfoUtil = (Map<String, Object>) objectMap.get("tableInfoUtil");
        String parentPath = getPathInfo(OutputFile.parent);
        customFiles.forEach(file -> {
            String filePath = StringUtils.isNotBlank(file.getFilePath()) ? file.getFilePath() : parentPath;
            String name =  getName(file.getPackageName(), tableInfoUtil);
            String packageName = getPackageName(file.getPackageName(), tableInfoUtil);
            if (StringUtils.isNotBlank(file.getPackageName())) {
                filePath = filePath + File.separator + packageName;
                filePath = filePath.replaceAll("\\.", StringPool.BACK_SLASH + File.separator);
            }
            String fileName = filePath + File.separator + name + file.getFileName();
            outputFile(new File(fileName), objectMap, file.getTemplatePath(), file.isFileOverride());
        });
    }
}
```

### 6.2 在代码生成器中使用Freemarker

在代码生成器配置中指定使用Freemarker模板引擎：

```java
private static void autoGenerator(TableProvider tableProvider) {
    AutoGenerator generator = new AutoGenerator(DATA_SOURCE_CONFIG);
    //全局配置
    generator.global(globalConfig());
    //数据库策略配置
    StrategyConfig strategyConfig = strategyConfig(tableProvider.getTableName());
    generator.strategy(strategyConfig);
    //获取表的模块名称
    String moduleName = TableInfoUtil.processName(tableProvider.getTableName(), strategyConfig.entity().getNaming(), strategyConfig.getTablePrefix(), strategyConfig.getTableSuffix());
    //包策略配置 动态模块名称
    generator.packageInfo(packageInfo(moduleName));
    //模板配置路径 自定义模板
    generator.template(templateInfo(tableProvider.getTemplateName()));
    //注入配置 模板生成前注入一些自定义变量和文件
    generator.injection(injectionInfo(tableProvider.getTemplateName(), moduleName));
    //模板引擎使用
    generator.execute(new EnhanceFreemarkerTemplateEngine()); // 使用Freemarker模板引擎
}
```

### 6.3 模板配置

项目中的模板配置示例：

```java
protected static TemplateConfig templateInfo(String templateName) {
    return new TemplateConfig.Builder()
            .entity(String.format("/templates/%s/entity.java", templateName))
            .controller(String.format("/templates/%s/controller.java", templateName))
            .mapper(String.format("/templates/%s/mapper.java", templateName))
            .xml(String.format("/templates/%s/mapper.xml", templateName))
            .service(String.format("/templates/%s/service.java", templateName))
            .build();
}
```

## 7. 最佳实践

### 7.1 模板组织

- 将公共部分提取为独立模板，通过`<#include>`或`<#import>`引入
- 使用宏定义复用代码片段
- 按功能或模块组织模板文件

### 7.2 性能优化

- 开启模板缓存（生产环境）
- 避免在模板中进行复杂计算
- 预处理数据，减少模板中的逻辑处理

### 7.3 安全注意事项

- 对输出内容进行转义，防止XSS攻击：`${content?html}`
- 限制模板访问系统资源
- 避免在模板中执行不受信任的代码

## 8. 常见问题与解决方案

### 8.1 模板找不到

- 检查模板路径配置是否正确
- 确认模板文件是否存在于指定目录
- 检查模板文件名和后缀是否匹配配置

### 8.2 变量未定义错误

- 使用`${variable!}`或`${variable!"默认值"}`设置默认值
- 使用`<#if variable??>...</#if>`检查变量是否存在

### 8.3 日期格式化问题

- 使用正确的日期格式模式：`${date?string("yyyy-MM-dd HH:mm:ss")}`
- 对于Java 8日期时间API，需要特殊处理或使用适配器

## 9. 总结

Freemarker是一个强大而灵活的模板引擎，结合SpringBoot可以轻松实现视图渲染、代码生成、邮件模板等功能。通过本指南的学习，您应该已经掌握了Freemarker的基本用法和在SpringBoot项目中的集成方式。

在本项目中，Freemarker主要用于代码生成，通过自定义模板和增强的模板引擎，实现了灵活的代码生成功能。您可以根据项目需求，进一步扩展和定制Freemarker的使用方式。 