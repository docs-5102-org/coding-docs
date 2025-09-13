---
title: IDEA 自定义模板
category:
  - 开发工具
tag:
  - IntelliJ IDEA
---

# IDEA 自定义类注释和模板

## 目录

[[toc]]

## 简介

在日常开发中，良好的代码注释是必不可少的。IntelliJ IDEA 提供了强大的模板功能，可以帮助我们快速生成标准化的类注释和方法注释，提高开发效率和代码质量。

## 为什么需要自定义注释模板

- **统一代码风格**：确保团队成员使用相同的注释格式
- **提高开发效率**：避免重复编写相同的注释内容
- **规范文档输出**：为后续生成API文档提供标准格式
- **便于代码维护**：清晰的注释有助于代码的理解和维护

## 类注释模板配置

### 访问模板设置

1. 打开 IntelliJ IDEA
2. 进入 `File` → `Settings`（Windows/Linux）或 `IntelliJ IDEA` → `Preferences`（macOS）
3. 导航到 `Editor` → `File and Code Templates`
4. 选择 `Files` 选项卡

### 自定义 Java 类模板

在 `Class` 模板中，可以添加以下注释内容：

```java
/**
 * ${DESCRIPTION}
 * 
 * @author ${USER}
 * @version 1.0
 * @since ${DATE}
 * @created ${TIME}
 */
#if (${PACKAGE_NAME} && ${PACKAGE_NAME} != "")package ${PACKAGE_NAME};#end

public class ${NAME} {
}
```

### 常用模板变量

| 变量名 | 描述 | 示例 |
|--------|------|------|
| `${NAME}` | 类名 | UserService |
| `${USER}` | 当前用户名 | developer |
| `${DATE}` | 当前日期 | 2024-01-15 |
| `${TIME}` | 当前时间 | 10:30:45 |
| `${YEAR}` | 当前年份 | 2024 |
| `${MONTH}` | 当前月份 | 01 |
| `${DAY}` | 当前日期 | 15 |
| `${PACKAGE_NAME}` | 包名 | com.example.service |

## 方法注释模板配置

### 设置 Live Templates

1. 进入 `File` → `Settings` → `Editor` → `Live Templates`
2. 点击右侧的 `+` 号，选择 `Template Group`
3. 创建一个新组，例如 "Custom Comments"
4. 在新组下添加模板

### 自定义方法注释模板

创建一个缩写为 `mc`（method comment）的模板：

```java
/**
 * $DESCRIPTION$
 * 
 * @param $PARAM$ $PARAM_DESCRIPTION$
 * @return $RETURN_DESCRIPTION$
 * @throws $EXCEPTION$ $EXCEPTION_DESCRIPTION$
 * @author $AUTHOR$
 * @since $DATE$
 */
```

### 配置模板变量

点击 `Edit variables` 按钮，为每个变量设置默认值和表达式：

- `DESCRIPTION`: 方法描述（手动输入）
- `PARAM`: 参数名（可使用 `methodParameters()` 表达式）
- `PARAM_DESCRIPTION`: 参数描述（手动输入）
- `RETURN_DESCRIPTION`: 返回值描述（手动输入）
- `EXCEPTION`: 异常类型（手动输入）
- `EXCEPTION_DESCRIPTION`: 异常描述（手动输入）
- `AUTHOR`: `user()` 表达式获取当前用户
- `DATE`: `date()` 表达式获取当前日期

## 实用技巧

### 1. 条件性注释

使用 Velocity 语法添加条件判断：

```java
#if ($PARAM != "")
 * @param $PARAM$ $PARAM_DESCRIPTION$
#end
```

### 2. 多参数处理

对于多个参数的方法，可以使用以下模板：

```java
/**
 * $DESCRIPTION$
 * 
#foreach($param in $PARAMS)
 * @param $param.name$ $param.description$
#end
 * @return $RETURN_DESCRIPTION$
 */
```

### 3. 快速应用场景

设置适用范围，在 `Applicable in` 部分选择：
- Java → Statement
- Java → Declaration

## 团队协作建议

### 导出和分享模板

1. 导出设置：`File` → `Export Settings`
2. 选择 `File templates` 和 `Live templates`
3. 生成 `.jar` 文件分享给团队成员

### 版本控制

将模板配置文件加入版本控制：
- Windows: `%USERPROFILE%\.IntelliJIdea<version>\config`
- macOS: `~/Library/Application Support/JetBrains/IntelliJIdea<version>`
- Linux: `~/.IntelliJIdea<version>/config`

## 最佳实践

1. **保持简洁**：注释应该简洁明了，避免冗余信息
2. **统一格式**：团队内部使用统一的注释格式和模板
3. **及时更新**：当代码逻辑变更时，及时更新相应的注释
4. **合理使用**：不是所有方法都需要详细注释，简单的 getter/setter 可以省略
5. **中英文规范**：根据项目需求选择合适的语言，保持一致性

## 常见问题

### Q: 如何修改已有模板？
A: 在 `File and Code Templates` 中直接编辑对应的模板文件即可。

### Q: 模板变量不生效怎么办？
A: 检查变量名是否正确，确保使用了正确的表达式语法。

### Q: 如何在现有类中快速添加注释？
A: 使用 Live Templates 功能，输入缩写后按 Tab 键展开。

## Java 常用通用模板配置

以下是一些 Java 开发中最常用的 Live Templates 配置，可以显著提高开发效率。

### 1. 主方法模板 (main)

**缩写**: `main`
**描述**: 快速生成 main 方法
**模板内容**:
```java
public static void main(String[] args) {
    $END$
}
```
**适用范围**: Java → Declaration

### 2. System.out.println 模板 (sout)

**缩写**: `sout`
**描述**: 快速输出语句
**模板内容**:
```java
System.out.println($EXPR$);
```
**变量设置**:
- `EXPR`: 默认值为空，可手动输入

**扩展模板**:
- `soutv`: `System.out.println("$EXPR$ = " + $EXPR$);` （输出变量名和值）
- `soutm`: `System.out.println("$CLASS_NAME$.$METHOD_NAME$");` （输出方法名）

### 3. 私有字段生成器 (prf)

**缩写**: `prf`
**描述**: 生成私有字段
**模板内容**:
```java
private $TYPE$ $NAME$;
```
**变量设置**:
- `TYPE`: 字段类型
- `NAME`: 字段名称

### 4. Getter 方法模板 (getter)

**缩写**: `getter`
**描述**: 快速生成 getter 方法
**模板内容**:
```java
public $TYPE$ get$CAPITALIZED_NAME$() {
    return $FIELD_NAME$;
}
```
**变量设置**:
- `TYPE`: 字段类型
- `CAPITALIZED_NAME`: 首字母大写的字段名
- `FIELD_NAME`: 字段名

### 5. Setter 方法模板 (setter)

**缩写**: `setter`
**描述**: 快速生成 setter 方法
**模板内容**:
```java
public void set$CAPITALIZED_NAME$($TYPE$ $FIELD_NAME$) {
    this.$FIELD_NAME$ = $FIELD_NAME$;
}
```

### 6. Try-Catch 模板 (try)

**缩写**: `try`
**描述**: 快速生成 try-catch 块
**模板内容**:
```java
try {
    $SELECTION$
} catch ($EXCEPTION$ e) {
    $LOG_STATEMENT$
    $END$
}
```
**变量设置**:
- `EXCEPTION`: 默认 `Exception`
- `LOG_STATEMENT`: `e.printStackTrace();`

### 7. 增强 for 循环模板 (foreach)

**缩写**: `foreach` 或 `iter`
**描述**: 生成增强 for 循环
**模板内容**:
```java
for ($TYPE$ $VAR$ : $COLLECTION$) {
    $END$
}
```
**变量设置**:
- `TYPE`: 元素类型
- `VAR`: 循环变量名
- `COLLECTION`: 集合名称

### 8. 条件判断模板 (ifn)

**缩写**: `ifn`
**描述**: 非空判断
**模板内容**:
```java
if ($VAR$ != null) {
    $END$
}
```

**扩展模板**:
- `inn`: `if ($VAR$ == null) { $END$ }` （空值判断）
- `ife`: `if ($CONDITION$) { $END$ } else { $END$ }` （if-else）

### 9. 日志记录模板 (log)

**缩写**: `log`
**描述**: 快速生成日志语句
**模板内容**:
```java
private static final Logger logger = LoggerFactory.getLogger($CLASS_NAME$.class);
```

**相关模板**:
- `logi`: `logger.info("$MESSAGE$");`
- `loge`: `logger.error("$MESSAGE$", $EXCEPTION$);`
- `logd`: `logger.debug("$MESSAGE$");`

### 10. 单例模式模板 (singleton)

**缩写**: `singleton`
**描述**: 生成单例模式代码
**模板内容**:
```java
private static final $CLASS_NAME$ INSTANCE = new $CLASS_NAME$();

private $CLASS_NAME$() {
}

public static $CLASS_NAME$ getInstance() {
    return INSTANCE;
}
```

### 11. 构造方法模板 (ctor)

**缩写**: `ctor`
**描述**: 生成构造方法
**模板内容**:
```java
public $CLASS_NAME$($PARAMS$) {
    $END$
}
```

### 12. toString 方法模板 (tostrin)

**缩写**: `tostrin`
**描述**: 生成 toString 方法
**模板内容**:
```java
@Override
public String toString() {
    return "$CLASS_NAME${" +
           "$FIELDS$" +
           '}';
}
```

### 13. 常量定义模板 (const)

**缩写**: `const`
**描述**: 生成常量定义
**模板内容**:
```java
public static final $TYPE$ $NAME$ = $VALUE$;
```

### 14. 线程安全的懒加载单例 (singlazy)

**缩写**: `singlazy`
**描述**: 生成线程安全的懒加载单例
**模板内容**:
```java
private static class $CLASS_NAME$Holder {
    private static final $CLASS_NAME$ INSTANCE = new $CLASS_NAME$();
}

private $CLASS_NAME$() {
}

public static $CLASS_NAME$ getInstance() {
    return $CLASS_NAME$Holder.INSTANCE;
}
```

### 15. 异常抛出模板 (thr)

**缩写**: `thr`
**描述**: 快速抛出异常
**模板内容**:
```java
throw new $EXCEPTION$("$MESSAGE$");
```

## 模板配置步骤

1. **打开设置**: `File` → `Settings` → `Editor` → `Live Templates`
2. **创建模板组**: 点击 `+` → `Template Group`，命名为 "Java Common"
3. **添加模板**: 在新组下点击 `+` → `Live Template`
4. **配置模板**:
   - 输入缩写 (Abbreviation)
   - 输入描述 (Description)  
   - 粘贴模板内容 (Template text)
   - 点击 `Edit variables` 配置变量
   - 设置适用范围 (Applicable in): 选择 Java

## 使用技巧

### 快速应用
1. 在代码中输入缩写
2. 按 `Tab` 键展开模板
3. 使用 `Tab` 键在变量间跳转
4. 按 `Enter` 完成编辑

### 自定义扩展
- 可以根据项目需求修改模板内容
- 添加项目特定的注释格式
- 结合代码规范调整命名方式

## 总结

合理使用 IntelliJ IDEA 的注释模板功能，可以显著提升开发效率和代码质量。通过自定义模板，我们可以确保代码注释的规范性和一致性，为团队协作和代码维护奠定良好基础。

这些通用模板涵盖了 Java 开发的大部分常见场景，可以根据团队和项目的具体需求进行调整和扩展。建议根据项目实际需求和团队规范，制定适合的注释模板标准，并在团队内部推广使用。