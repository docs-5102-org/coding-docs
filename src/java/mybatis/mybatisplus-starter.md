---
title: MyBatis-Plus指南
category:
  - 持久层框架
tag:
  - MyBatisPlus
---

# MyBatis-Plus 教程 & 配置注意事项

## 目录

[[toc]]

## 官方资源

- **官网**: https://baomidou.com/
- **CRUD接口**: https://baomidou.com/pages/49cc81/#service-crud-%E6%8E%A5%E5%8F%A3

## 常用注意事项

### 1. 首次集成 MyBatis-Plus 报错

**错误信息**: `NoClassDefFoundError: org/mybatis/logging/LoggerFactory`

**原因**: `mybatis-spring-boot-starter` 和 `mybatis-plus-boot-starter` 冲突

**解决方案**: 移除 `mybatis-spring-boot-starter` 依赖，因为 MyBatis-Plus 已内置相关功能

### 2. 驼峰命名转换问题

MyBatis-Plus 默认将 Java 实体类的驼峰属性转换为下划线模式查询数据库字段。

**解决方案一**: 修改 yml 配置

```yaml
mybatis-plus:
  configuration:
    # 关闭驼峰转下划线模式
    map-underscore-to-camel-case: false
    # 输出 MyBatis SQL 日志
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
```

**解决方案二**: 使用注解映射

```java
@TableField(value = "activity_id")
private String activityId;
```

### 3. 设置非查询字段

**MyBatis-Plus 方式**:
```java
@TableField(select = false)
private String qkAwardActivityName;
```

**TkMapper 或原生方式**:
```java
@Transient
private String qkAwardActivityName;
```

### 4. 批量插入/修改最佳实践

**推荐方案**: 自定义 SQL 注入器，注入 `insertBatchSomeColumn()` 方法

**参考资料**:
- [MyBatis批量插入的五种方式对比](https://app.yinxiang.com/shard/s2/nl/1541430/ea6c95a6-d741-43b7-8420-0e4892929500)
- [具体实现参考](https://blog.csdn.net/knock_me/article/details/132165909)
- [官方 Mapper 层选装件文档](https://baomidou.com/pages/49cc81/#mapper-%E5%B1%82-%E9%80%89%E8%A3%85%E4%BB%B6)

**注意**: 官方 Service 接口的批量方法实际是伪批量（单条插入）

**实现示例**:

#### a. 自定义 SQL 注入器

```java
@Component
public class MySqlInjector extends DefaultSqlInjector {

    @Override
    public List<AbstractMethod> getMethodList(Class<?> mapperClass, TableInfo tableInfo) {
        List<AbstractMethod> methodList = super.getMethodList(mapperClass, tableInfo);
        
        // 增加自定义方法 - 以下 3 个为内置选装件
        // 批量插入时，不要指定了 update 填充的字段
        methodList.add(new InsertBatchSomeColumn(i -> i.getFieldFill() != FieldFill.UPDATE));
        methodList.add(new AlwaysUpdateSomeColumnById());
        methodList.add(new LogicDeleteBatchByIds());
        
        return methodList;
    }
}
```

#### b. 增强型 BaseMapper

```java
public interface EnhanceMapper<T> extends BaseMapper<T> {

    // 链式查询方法
    default QueryChainWrapper<T> queryChain() {
        return new QueryChainWrapper<>(this);
    }

    default LambdaQueryChainWrapper<T> lambdaQueryChain() {
        return new LambdaQueryChainWrapper<>(this);
    }

    default UpdateChainWrapper<T> updateChain() {
        return new UpdateChainWrapper<>(this);
    }

    default LambdaUpdateChainWrapper<T> lambdaUpdateChain() {
        return new LambdaUpdateChainWrapper<T>(this);
    }

    // 自定义批量方法
    int insertBatchSomeColumn(List<T> entityList);
    int alwaysUpdateSomeColumnById(@Param(Constants.ENTITY) T entity);
    int deleteByIdWithFill(T entity);
}
```

#### c. 业务 Mapper 使用

```java
public interface AdminMapper extends EnhanceMapper<AdminEntity> {
    // 继承批量操作能力
}
```

### 5. 主键策略

**参考资料**:
- https://blog.csdn.net/m0_57313444/article/details/129447116
- https://www.cnblogs.com/mark5/p/14268122.html

### 6. QueryWrapper 条件判断

**参考资料**: https://app.yinxiang.com/shard/s2/nl/1541430/ea6c95a6-d741-43b7-8420-0e4892929500

## JSON 查询功能

### 7. 自定义 JSON 数组匹配查询

#### 示例一: 查询 JSON 数组中 title 字段

```java
@Select("<script> " +
    " select main.*" +
    " from media_publish_t as main " +
    " where JSON_CONTAINS_PATH(content, 'one', '$.videoData[*].title') \n " +
    "   AND JSON_SEARCH(content->'$.videoData[*].title', 'all', '%${queryTitle}%') IS NOT NULL" +
    " order by main.last_modified desc " +
    " </script>")
Page<MediaPublishEntity> findPageList(Page page, String queryTitle);
```

#### 示例二: 查询 tags 数组中 value 字段

```java
@Select("<script> " +
    " select main.* " +
    " ,toolCategory.name as toolCategoryName  " +
    " from tool_detail_t as main " +
    " left join tool_category_t as toolCategory on main.category_id = toolCategory.id " +
    " where main.remove=0 " +
    " <if test='name!=\"\" and name!=null '> " +
    "   and main.name like CONCAT(CONCAT('%', #{name}), '%') " +
    " </if> " +
    " <if test='categoryId!=\"\" and categoryId!=null '> " +
    "   and toolCategory.id = #{categoryId} " +
    " </if> " +
    " <if test='tagIdList != null and tagIdList.size() > 0'>" +
    "   AND ( " +
    "   <foreach collection='tagIdList' item='tagId' separator=' OR '> " +
    "     JSON_CONTAINS_PATH(tags, 'one', '$[*].value') " +
    "     AND JSON_SEARCH(tags->'$[*].value', 'one', #{tagId}) IS NOT NULL " +
    "   </foreach> " +
    "   ) " +
    " </if>" +
    " order by main.last_modified desc " +
    " </script>")
Page<ToolDetailEntity> findPageList(Page page, @Param("categoryId") Integer categoryId, 
                                   @Param("name") String name, @Param("tagIdList") List<String> tagIdList);
```

### JSON 函数说明

**官方文档**:
- https://dev.mysql.com/doc/refman/8.0/en/json-functions.html
- https://dev.mysql.com/doc/refman/8.0/en/json-search-functions.html

#### JSON_CONTAINS_PATH

**功能**: 检查 JSON 文档中是否存在指定路径

**语法**: `JSON_CONTAINS_PATH(json_doc, 'one' | 'all', path[, path] ...)`

**参数说明**:
- `json_doc`: 要搜索的 JSON 文档
- `'one' | 'all'`: 
  - `'one'`: 至少存在一个路径时返回 true
  - `'all'`: 所有路径都存在时才返回 true
- `path`: 要检查的路径，可指定多个

#### JSON_SEARCH

**功能**: 在 JSON 文档中查找匹配字符串的值的路径

**语法**: `JSON_SEARCH(json_doc, 'one' | 'all', search_str[, escape_char[, path ...]])`

**参数说明**:
- `json_doc`: 要搜索的 JSON 文档
- `'one' | 'all'`:
  - `'one'`: 返回第一个匹配路径，找到后停止搜索
  - `'all'`: 返回所有匹配路径的 JSON 数组
- `search_str`: 搜索字符串
- `escape_char` (可选): 转义字符
- `path` (可选): 限制搜索范围的路径

### 8. QueryWrapper 构造 JSON 查询

```java
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;

String searchValue = "%目标字符串%"; // 搜索字符串，使用 % 进行模糊查询
QueryWrapper<User> queryWrapper = new QueryWrapper<>();
queryWrapper.apply("JSON_EXTRACT(extra_info, '$.name') LIKE {0}", searchValue);

List<User> users = userMapper.selectList(queryWrapper);
```