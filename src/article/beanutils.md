---
title: Java实现Brotli解压缩技术指南
category:
  - java
tag:
  - BeanUtils
---

# 属性copy工具类 BeanUtils介绍

## 概述

在Java业务系统开发中，经常需要在不同对象之间进行属性的拷贝。虽然逐个属性的手动拷贝是最快速最安全的做法，但当数据对象的属性字段数量超过5个时，代码就会变得臃肿不堪。使用属性拷贝工具类将是很好的选择。

BeanUtils是Apache Jakarta Commons项目中的一个强大组件，它提供了对Java反射和自省API的包装。主要目的是利用反射机制对JavaBean的属性进行处理，避免大量get/set代码堆积。

## 主流工具类对比

### 1. Apache Commons BeanUtils
- **类路径**: `org.apache.commons.beanutils.BeanUtils`
- **实现原理**: 反射机制
- **特点**: 支持类型转换，功能强大但性能较低

### 2. Apache Commons PropertyUtils
- **类路径**: `org.apache.commons.beanutils.PropertyUtils`
- **实现原理**: 反射机制
- **特点**: 不支持类型转换，但速度比BeanUtils快

### 3. Spring BeanUtils
- **类路径**: `org.springframework.beans.BeanUtils`
- **实现原理**: 反射机制
- **特点**: Spring框架内置，支持忽略特定属性

### 4. CGLib BeanCopier
- **类路径**: `net.sf.cglib.beans.BeanCopier`
- **实现原理**: 动态代理
- **特点**: 效率最高，但功能相对简单

### 5. Dozer
- **实现原理**: XML配置映射
- **特点**: 功能最完善，但性能最低

## 性能对比测试

基于1000次拷贝操作的测试结果：

| 工具类 | 耗时 | 性能排名 |
|--------|------|----------|
| CGLib BeanCopier | ~140ms | 🥇 最快 |
| Apache PropertyUtils | ~240ms | 🥈 较快 |
| Apache BeanUtils | ~500ms | 🥉 中等 |
| Dozer | ~2500ms | 🐌 最慢 |

**结论**: 对于简单的属性拷贝，性能排序为：**BeanCopier > PropertyUtils > BeanUtils > Dozer**

## BeanUtils详细介绍

### 基本用法

```java
// 传统方式：手动属性赋值
TeacherForm teacherForm = (TeacherForm) form;
Teacher teacher = new Teacher();
teacher.setName(teacherForm.getName());
teacher.setAge(teacherForm.getAge());
teacher.setGender(teacherForm.getGender());
teacher.setMajor(teacherForm.getMajor());
teacher.setDepartment(teacherForm.getDepartment());

// 使用BeanUtils：一行代码搞定
TeacherForm teacherForm = (TeacherForm) form;
Teacher teacher = new Teacher();
BeanUtils.copyProperties(teacher, teacherForm);
```

### 方法签名

```java
public static void copyProperties(java.lang.Object dest, java.lang.Object orig) 
    throws java.lang.IllegalAccessException, java.lang.reflect.InvocationTargetException
```

**参数说明**:
- `dest`: 目标对象（属性被复制到的对象）
- `orig`: 源对象（属性被复制来源的对象）

### 支持的数据类型转换

BeanUtils与PropertyUtils的主要区别在于BeanUtils支持类型转换功能。支持的转换类型包括：

- 基本数据类型：`boolean`, `byte`, `char`, `double`, `float`, `int`, `long`, `short`
- 包装类型：`Boolean`, `Byte`, `Character`, `Double`, `Float`, `Integer`, `Long`, `Short`
- 数值类型：`BigDecimal`, `BigInteger`
- 其他类型：`String`, `Class`
- 日期类型：`java.sql.Date`, `java.sql.Time`, `java.sql.Timestamp`

**⚠️ 注意**: `java.util.Date`不被支持，只有其子类`java.sql.Date`被支持。

### 日期类型处理示例

由于BeanUtils对日期类型的支持有限，在实际开发中需要特别注意日期类型的处理：

#### 1. 支持的日期类型转换
```java
public class DateExample {
    // 源对象
    public static class SourceObject {
        private java.sql.Date sqlDate;
        private java.sql.Time sqlTime;
        private java.sql.Timestamp sqlTimestamp;
        private String dateString;
        
        // getters and setters...
    }
    
    // 目标对象
    public static class TargetObject {
        private java.sql.Date sqlDate;
        private java.sql.Time sqlTime;
        private java.sql.Timestamp sqlTimestamp;
        private String dateString;
        
        // getters and setters...
    }
    
    public static void supportedDateConversion() {
        SourceObject source = new SourceObject();
        source.setSqlDate(new java.sql.Date(System.currentTimeMillis()));
        source.setSqlTime(new java.sql.Time(System.currentTimeMillis()));
        source.setSqlTimestamp(new java.sql.Timestamp(System.currentTimeMillis()));
        source.setDateString("2024-01-01");
        
        TargetObject target = new TargetObject();
        
        try {
            // 这些转换会成功
            BeanUtils.copyProperties(target, source);
            System.out.println("日期拷贝成功");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

#### 2. 不支持的日期类型处理
```java
public class UnsupportedDateExample {
    // 源对象
    public static class SourceObject {
        private java.util.Date utilDate;
        private LocalDate localDate;
        private LocalDateTime localDateTime;
        private ZonedDateTime zonedDateTime;
        
        // getters and setters...
    }
    
    // 目标对象
    public static class TargetObject {
        private java.util.Date utilDate;
        private LocalDate localDate;
        private LocalDateTime localDateTime;
        private ZonedDateTime zonedDateTime;
        
        // getters and setters...
    }
    
    public static void unsupportedDateHandling() {
        SourceObject source = new SourceObject();
        source.setUtilDate(new Date());
        source.setLocalDate(LocalDate.now());
        source.setLocalDateTime(LocalDateTime.now());
        source.setZonedDateTime(ZonedDateTime.now());
        
        TargetObject target = new TargetObject();
        
        try {
            // 先执行BeanUtils拷贝（会跳过不支持的日期类型）
            BeanUtils.copyProperties(target, source);
            
            // 手动处理不支持的日期类型
            target.setUtilDate(source.getUtilDate());
            target.setLocalDate(source.getLocalDate());
            target.setLocalDateTime(source.getLocalDateTime());
            target.setZonedDateTime(source.getZonedDateTime());
            
            System.out.println("日期拷贝完成（包含手动处理）");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

#### 3. 自定义日期转换器
```java
import org.apache.commons.beanutils.Converter;
import org.apache.commons.beanutils.ConvertUtils;

public class CustomDateConverter implements Converter {
    
    @Override
    public Object convert(Class type, Object value) {
        if (value == null) {
            return null;
        }
        
        if (value instanceof String) {
            String dateStr = (String) value;
            // 自定义日期解析逻辑
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                Date date = sdf.parse(dateStr);
                
                if (type.equals(java.sql.Date.class)) {
                    return new java.sql.Date(date.getTime());
                } else if (type.equals(java.sql.Timestamp.class)) {
                    return new java.sql.Timestamp(date.getTime());
                }
            } catch (ParseException e) {
                throw new RuntimeException("日期转换失败: " + dateStr, e);
            }
        }
        
        if (value instanceof java.util.Date && type.equals(java.sql.Date.class)) {
            return new java.sql.Date(((java.util.Date) value).getTime());
        }
        
        return value;
    }
    
    // 使用自定义转换器
    public static void useCustomConverter() {
        // 注册自定义转换器
        ConvertUtils.register(new CustomDateConverter(), java.sql.Date.class);
        ConvertUtils.register(new CustomDateConverter(), java.sql.Timestamp.class);
        
        // 现在可以使用自定义转换逻辑
        SourceObject source = new SourceObject();
        TargetObject target = new TargetObject();
        
        try {
            BeanUtils.copyProperties(target, source);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

#### 4. 实用的日期处理工具类
```java
import org.apache.commons.beanutils.BeanUtils;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

public class DateCopyUtils {
    
    /**
     * 带日期处理的属性拷贝
     */
    public static void copyPropertiesWithDateHandling(Object target, Object source) {
        try {
            // 先执行常规拷贝
            BeanUtils.copyProperties(target, source);
            
            // 处理java.util.Date类型
            handleUtilDate(target, source);
            
            // 处理Java 8时间类型
            handleJava8DateTime(target, source);
            
        } catch (Exception e) {
            throw new RuntimeException("属性拷贝失败", e);
        }
    }
    
    /**
     * 处理java.util.Date类型
     */
    private static void handleUtilDate(Object target, Object source) {
        // 使用反射处理java.util.Date类型字段
        Field[] sourceFields = source.getClass().getDeclaredFields();
        Field[] targetFields = target.getClass().getDeclaredFields();
        
        for (Field sourceField : sourceFields) {
            if (sourceField.getType().equals(java.util.Date.class)) {
                try {
                    sourceField.setAccessible(true);
                    Date sourceValue = (Date) sourceField.get(source);
                    
                    if (sourceValue != null) {
                        // 在目标对象中查找同名字段
                        Field targetField = findField(targetFields, sourceField.getName());
                        if (targetField != null && targetField.getType().equals(java.util.Date.class)) {
                            targetField.setAccessible(true);
                            targetField.set(target, new Date(sourceValue.getTime()));
                        }
                    }
                } catch (Exception e) {
                    // 忽略无法处理的字段
                }
            }
        }
    }
    
    /**
     * 处理Java 8时间类型
     */
    private static void handleJava8DateTime(Object target, Object source) {
        Field[] sourceFields = source.getClass().getDeclaredFields();
        Field[] targetFields = target.getClass().getDeclaredFields();
        
        for (Field sourceField : sourceFields) {
            try {
                sourceField.setAccessible(true);
                Object sourceValue = sourceField.get(source);
                
                if (sourceValue != null) {
                    Field targetField = findField(targetFields, sourceField.getName());
                    if (targetField != null) {
                        targetField.setAccessible(true);
                        
                        // 处理LocalDate
                        if (sourceField.getType().equals(LocalDate.class) && 
                            targetField.getType().equals(LocalDate.class)) {
                            targetField.set(target, sourceValue);
                        }
                        
                        // 处理LocalDateTime
                        if (sourceField.getType().equals(LocalDateTime.class) && 
                            targetField.getType().equals(LocalDateTime.class)) {
                            targetField.set(target, sourceValue);
                        }
                        
                        // LocalDate转Date
                        if (sourceField.getType().equals(LocalDate.class) && 
                            targetField.getType().equals(Date.class)) {
                            LocalDate localDate = (LocalDate) sourceValue;
                            Date date = Date.from(localDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
                            targetField.set(target, date);
                        }
                        
                        // Date转LocalDate
                        if (sourceField.getType().equals(Date.class) && 
                            targetField.getType().equals(LocalDate.class)) {
                            Date date = (Date) sourceValue;
                            LocalDate localDate = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                            targetField.set(target, localDate);
                        }
                    }
                }
            } catch (Exception e) {
                // 忽略无法处理的字段
            }
        }
    }
    
    /**
     * 查找指定名称的字段
     */
    private static Field findField(Field[] fields, String fieldName) {
        for (Field field : fields) {
            if (field.getName().equals(fieldName)) {
                return field;
            }
        }
        return null;
    }
    
    /**
     * 使用示例
     */
    public static void example() {
        SourceObject source = new SourceObject();
        source.setUtilDate(new Date());
        source.setLocalDate(LocalDate.now());
        source.setLocalDateTime(LocalDateTime.now());
        
        TargetObject target = new TargetObject();
        
        // 使用增强的拷贝方法
        DateCopyUtils.copyPropertiesWithDateHandling(target, source);
        
        System.out.println("增强日期处理拷贝完成");
    }
}
```

### 处理不同名属性

当源对象和目标对象存在名称不相同的属性时，BeanUtils不会处理这些属性，需要手动处理：

```java
// 拷贝相同属性
BeanUtils.copyProperties(teacher, teacherForm);

// 手动处理不同属性
teacher.setModifyDate(new Date());
```

## 实际应用场景

### 1. PO与VO转换
```java
// 数据库实体转换为视图对象
UserPO userPO = userService.findById(userId);
UserVO userVO = new UserVO();
BeanUtils.copyProperties(userVO, userPO);
```

### 2. DTO与Entity转换
```java
// 请求DTO转换为实体对象
UserDTO userDTO = getUserFromRequest();
User user = new User();
BeanUtils.copyProperties(user, userDTO);
userService.save(user);
```

### 3. 深拷贝场景
```java
// 创建对象副本
OriginalObject original = getOriginalObject();
OriginalObject copy = new OriginalObject();
BeanUtils.copyProperties(copy, original);
```

## 优缺点分析

### 优点
1. **代码简洁**: 一行代码完成多属性拷贝
2. **减少错误**: 避免手动编写大量get/set代码
3. **类型转换**: 自动处理支持的数据类型转换
4. **维护性强**: 当对象新增属性时，无需修改拷贝代码

### 缺点
1. **性能开销**: 使用反射机制，性能比手动拷贝低
2. **调试困难**: 运行时才能发现类型不匹配等问题
3. **有限的类型支持**: 不支持所有数据类型的转换
4. **隐式行为**: 属性拷贝过程不够透明

## 性能优化建议

### 1. 选择合适的工具
- **高性能要求**: 使用CGLib BeanCopier
- **需要类型转换**: 使用Apache BeanUtils
- **Spring环境**: 使用Spring BeanUtils
- **不需要类型转换**: 使用PropertyUtils

### 2. 缓存BeanCopier实例
```java
// 创建并缓存BeanCopier实例
private static final BeanCopier COPIER = BeanCopier.create(Source.class, Target.class, false);

// 重复使用
public void copyProperties(Source source, Target target) {
    COPIER.copy(source, target, null);
}
```

### 3. 批量操作优化
```java
// 批量拷贝时，重用BeanCopier实例
BeanCopier copier = BeanCopier.create(SourceClass.class, TargetClass.class, false);
for (SourceClass source : sourceList) {
    TargetClass target = new TargetClass();
    copier.copy(source, target, null);
    targetList.add(target);
}
```

## 最佳实践

1. **明确使用场景**: 根据性能要求和功能需求选择合适的工具
2. **注意数据类型**: 特别是日期类型的处理
3. **异常处理**: 妥善处理可能出现的异常
4. **单元测试**: 确保拷贝后的对象数据正确性
5. **性能监控**: 在高并发场景下监控拷贝操作的性能影响

## 总结

BeanUtils工具类在Java开发中是一个非常实用的工具，能够大大简化对象属性拷贝的代码。虽然性能不是最优的，但在大多数业务场景下都是可以接受的。选择合适的工具类需要在功能性和性能之间找到平衡点。对于追求极致性能的场景，建议使用CGLib BeanCopier；对于需要类型转换的场景，Apache BeanUtils是不错的选择。

