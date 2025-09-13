---
title: MyBatis-Plus[QueryWrapper]指南
category:
  - 持久层框架
tag:
  - MyBatis
  - MyBatis-Plus
---

# MyBatis-Plus QueryWrapper 使用指南

MyBatis-Plus 提供的 QueryWrapper 是一个强大的查询条件构造器，能够帮助开发者优雅地构建各种复杂的 SQL 查询条件。本指南将详细介绍 QueryWrapper 的各种用法和最佳实践。

> 📚 官方文档：[MyBatis-Plus Wrapper](https://baomidou.com/guides/wrapper/#%E7%A4%BA%E4%BE%8B)

## 目录

[[toc]]

## 1. 相等判断

### 1.1 allEq - 批量相等查询

使用 Map 设置多个字段的相等条件进行查询，适用于需要同时判断多个字段相等的场景。

```java
// 创建条件映射
Map<String, Object> map = new HashMap<>();
map.put("type", 1);
map.put("name", "张三");

// 构建查询条件
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.allEq(map);  
// 生成 SQL: WHERE type = 1 AND name = '张三'

// 执行查询
List<Category> categories = categoryMapper.selectList(queryWrapper);
```

**过滤空值的用法：**
```java
// 过滤 null 值
queryWrapper.allEq(map, false);  // null 值不会被拼接到 SQL 中

// 自定义过滤条件
queryWrapper.allEq((k, v) -> !k.equals("name"), map);  // 排除 name 字段
```

### 1.2 eq - 单字段相等查询

使用 Lambda 表达式指定单个字段的相等条件，推荐使用 Lambda 方式避免硬编码字段名。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().eq(Category::getName, "李四");  
// 生成 SQL: WHERE name = '李四'

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

### 1.3 ne - 不等查询

查询字段值不等于指定值的记录。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().ne(Category::getName, "李四");  
// 生成 SQL: WHERE name != '李四'

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

## 2. 范围判断

### 2.1 gt - 大于

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().gt(Category::getType, 1);  
// 生成 SQL: WHERE type > 1

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

### 2.2 ge - 大于等于

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().ge(Category::getType, 2);  
// 生成 SQL: WHERE type >= 2

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

### 2.3 lt - 小于

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().lt(Category::getType, 2);  
// 生成 SQL: WHERE type < 2

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

### 2.4 le - 小于等于

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().le(Category::getType, 2);  
// 生成 SQL: WHERE type <= 2

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

### 2.5 between - 范围查询

查询字段值在指定范围内的记录（包含边界值）。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().between(Category::getType, 2, 3);  
// 生成 SQL: WHERE type BETWEEN 2 AND 3

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

### 2.6 notBetween - 范围排除

查询字段值不在指定范围内的记录。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().notBetween(Category::getType, 2, 3);  
// 生成 SQL: WHERE type NOT BETWEEN 2 AND 3

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

## 3. 模糊匹配

MyBatis-Plus 提供了多种模糊匹配方式，可以灵活地进行字符串搜索。

### 3.1 like - 包含查询

查询字段值包含指定字符串的记录。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().like(Category::getName, "张");  
// 生成 SQL: WHERE name LIKE '%张%'

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

### 3.2 notLike - 不包含查询

查询字段值不包含指定字符串的记录。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().notLike(Category::getName, "张");  
// 生成 SQL: WHERE name NOT LIKE '%张%'

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

### 3.3 likeLeft - 后缀匹配

查询字段值以指定字符串结尾的记录。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().likeLeft(Category::getName, "三");  
// 生成 SQL: WHERE name LIKE '%三'

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

### 3.4 likeRight - 前缀匹配

查询字段值以指定字符串开头的记录。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().likeRight(Category::getName, "张");  
// 生成 SQL: WHERE name LIKE '张%'

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

## 4. 非空判断

### 4.1 isNull - 字段为空

查询指定字段值为 null 的记录。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().isNull(Category::getDescription);
// 生成 SQL: WHERE description IS NULL

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

### 4.2 isNotNull - 字段不为空

查询指定字段值不为 null 的记录。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().isNotNull(Category::getDescription);
// 生成 SQL: WHERE description IS NOT NULL

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

## 5. IN条件查询

### 5.1 in - 包含查询

查询字段值在指定列表中的记录。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().in(Category::getType, 1, 2, 3);
// 生成 SQL: WHERE type IN (1, 2, 3)

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

**使用集合的方式：**
```java
List<Integer> typeList = Arrays.asList(1, 2, 3);
queryWrapper.lambda().in(Category::getType, typeList);
```

### 5.2 notIn - 不包含查询

查询字段值不在指定列表中的记录。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().notIn(Category::getType, 1, 3);
// 生成 SQL: WHERE type NOT IN (1, 3)

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

### 5.3 inSql - SQL方式IN查询

使用子查询或 SQL 字符串进行 IN 查询。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().inSql(Category::getType, "1,2,3");
// 生成 SQL: WHERE type IN (1,2,3)

// 或者使用子查询
queryWrapper.lambda().inSql(Category::getType, "SELECT type FROM other_table WHERE condition = 1");

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

### 5.4 notInSql - SQL方式NOT IN查询

使用子查询或 SQL 字符串进行 NOT IN 查询。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().notInSql(Category::getType, "1,3");
// 生成 SQL: WHERE type NOT IN (1,3)

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

## 6. 分组查询

### 6.1 groupBy - 分组

按指定字段进行分组查询。

```java
QueryWrapper<UserEntity> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().groupBy(UserEntity::getSex);
// 生成 SQL: GROUP BY sex

List<UserEntity> users = userMapper.selectList(queryWrapper);
```

**多字段分组：**
```java
queryWrapper.lambda().groupBy(UserEntity::getSex, UserEntity::getAge);
// 生成 SQL: GROUP BY sex, age
```

## 7. 排序查询

### 7.1 orderByAsc - 升序排序

根据指定字段进行升序排序。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().orderByAsc(Category::getCreateTime);
// 生成 SQL: ORDER BY create_time ASC

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

**多字段排序：**
```java
queryWrapper.lambda().orderByAsc(Category::getType, Category::getCreateTime);
// 生成 SQL: ORDER BY type ASC, create_time ASC
```

### 7.2 orderByDesc - 降序排序

根据指定字段进行降序排序。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda().orderByDesc(Category::getCreateTime);
// 生成 SQL: ORDER BY create_time DESC

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

### 7.3 orderBy - 自定义排序

根据条件参数决定升序或降序排序。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
// 参数说明：condition(是否执行), isAsc(是否升序), column(排序字段)
queryWrapper.lambda().orderBy(true, false, Category::getCreateTime);
// 生成 SQL: ORDER BY create_time DESC

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

**动态排序示例：**
```java
boolean isAsc = getSortDirection(); // 从参数获取排序方向
queryWrapper.lambda().orderBy(true, isAsc, Category::getCreateTime);
```

## 8. 条件判断

### 8.1 having - 分组条件

配合 `groupBy` 使用，对分组后的结果进行筛选。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.select("type, COUNT(*) as count")
           .groupBy("type")
           .having("COUNT(*) > 1");
// 生成 SQL: SELECT type, COUNT(*) as count FROM category GROUP BY type HAVING COUNT(*) > 1

List<Map<String, Object>> result = categoryMapper.selectMaps(queryWrapper);
```

**注意事项：**
- `having()` 需要配合 `select()` 和 `groupBy()` 一起使用
- `having` 子句中只能使用聚合函数或分组字段

### 8.2 func - 函数式条件

方便在条件分支中调用不同方法，保持链式调用的连贯性。

```java
Boolean needFilter = true;
LambdaQueryWrapper<Category> queryWrapper = Wrappers.<Category>lambdaQuery();

queryWrapper.func(wrapper -> {
    if (needFilter) {
        wrapper.eq(Category::getType, 2);
    } else {
        wrapper.eq(Category::getType, 1);
    }
});

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

## 9. 逻辑判断

### 9.1 and - 逻辑与

用于连接多个查询条件，所有条件都必须满足。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda()
           .eq(Category::getName, "张三")
           .and(wrapper -> wrapper.eq(Category::getType, 1).or().eq(Category::getType, 2));
// 生成 SQL: WHERE name = '张三' AND (type = 1 OR type = 2)

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

### 9.2 or - 逻辑或

用于连接多个查询条件，满足任一条件即可。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.lambda()
           .eq(Category::getName, "张三")
           .or(wrapper -> wrapper.eq(Category::getType, 2));
// 生成 SQL: WHERE name = '张三' OR type = 2

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

**复杂逻辑示例：**
```java
queryWrapper.lambda()
           .eq(Category::getStatus, 1)
           .and(wrapper -> wrapper.eq(Category::getType, 1).or().eq(Category::getType, 2))
           .or(wrapper -> wrapper.eq(Category::getName, "特殊分类"));
// 生成 SQL: WHERE status = 1 AND (type = 1 OR type = 2) OR name = '特殊分类'
```

## 10. 存在判断

### 10.1 exists - 存在查询

检查子查询是否返回数据，如果子查询有结果则条件为真。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.exists("SELECT 1 FROM user WHERE user.category_id = category.id AND user.status = 1");
// 生成 SQL: WHERE EXISTS (SELECT 1 FROM user WHERE user.category_id = category.id AND user.status = 1)

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

### 10.2 notExists - 不存在查询

检查子查询是否不返回数据，如果子查询无结果则条件为真。

```java
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.notExists("SELECT 1 FROM user WHERE user.category_id = category.id");
// 生成 SQL: WHERE NOT EXISTS (SELECT 1 FROM user WHERE user.category_id = category.id)

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

## 11. 字段选择

### 11.1 select - 指定查询字段

指定要查询的字段，避免查询不必要的字段，提高查询性能。

```java
// 方式一：使用字符串指定字段
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.select("id", "name", "type");

// 方式二：使用 Lambda 表达式（推荐）
LambdaQueryWrapper<Category> lambdaQuery = Wrappers.<Category>lambdaQuery()
    .select(Category::getId, Category::getName, Category::getType);

List<Category> categories = categoryMapper.selectList(queryWrapper);
```

**排除字段查询：**
```java
// 查询除了 description 字段外的所有字段
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.select(Category.class, info -> !info.getColumn().equals("description"));
```

## 最佳实践

### 1. 推荐使用 Lambda 表达式

```java
// ✅ 推荐：类型安全，支持重构
LambdaQueryWrapper<Category> lambdaQuery = Wrappers.<Category>lambdaQuery()
    .eq(Category::getName, "张三")
    .gt(Category::getType, 1);

// ❌ 不推荐：硬编码字段名，容易出错
QueryWrapper<Category> queryWrapper = new QueryWrapper<>();
queryWrapper.eq("name", "张三").gt("type", 1);
```

### 2. 条件动态构建

```java
public List<Category> findCategories(CategoryQuery query) {
    LambdaQueryWrapper<Category> wrapper = Wrappers.<Category>lambdaQuery();
    
    // 动态添加条件
    if (StringUtils.hasText(query.getName())) {
        wrapper.like(Category::getName, query.getName());
    }
    
    if (query.getType() != null) {
        wrapper.eq(Category::getType, query.getType());
    }
    
    if (query.getStartTime() != null && query.getEndTime() != null) {
        wrapper.between(Category::getCreateTime, query.getStartTime(), query.getEndTime());
    }
    
    return categoryMapper.selectList(wrapper);
}
```

### 3. 复用查询条件

```java
public class CategoryQueryBuilder {
    
    public static LambdaQueryWrapper<Category> buildActiveQuery() {
        return Wrappers.<Category>lambdaQuery()
            .eq(Category::getStatus, 1)
            .isNotNull(Category::getName);
    }
    
    public static LambdaQueryWrapper<Category> buildByType(Integer type) {
        return buildActiveQuery().eq(Category::getType, type);
    }
}
```

## 总结

MyBatis-Plus 的 QueryWrapper 提供了丰富的查询条件构建方法，通过合理使用这些方法，可以：

1. **提高开发效率**：无需手写复杂的 SQL 语句
2. **增强代码可读性**：链式调用让查询逻辑更清晰
3. **保证类型安全**：Lambda 表达式避免字段名硬编码
4. **支持动态查询**：根据条件灵活构建查询语句
5. **便于维护**：统一的API风格，降低学习成本

在实际开发中，建议优先使用 Lambda 表达式方式，并根据业务需求合理组合各种查询条件，以构建出高效、可维护的查询代码。