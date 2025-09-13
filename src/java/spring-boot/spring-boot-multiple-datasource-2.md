---
title: 多数据源配置教程2
category:
  - Web框架
tag:
  - Spring Boot
---

# Spring Boot 多数据源配置与 MyBatis 拦截器集成指南

## 概述

本文档介绍如何在 Spring Boot 项目中配置多数据源实现读写分离，并解决配置多数据源后 MyBatis 拦截器失效的问题。该方案支持一主多从的数据库架构，实现动态数据源切换和自动分页功能。

## 技术栈

- **框架**: Spring Boot + Spring Cloud
- **ORM**: MyBatis
- **数据源**: 阿里 Druid 连接池
- **配置管理**: Spring Cloud Config
- **数据库**: MySQL (一主多从)

## 实现方案

### 1. 数据源配置

#### 1.1 数据源配置类

```java
@Configuration
public class DataSourceConfiguration {
    /**
     * 数据源类型
     */
    @Value("${spring.datasource.type}")
    private Class<? extends DataSource> dataSourceType;

    /**
     * 主数据源配置
     */
    @Bean(name = "masterDataSource", destroyMethod = "close")
    @Primary
    @ConfigurationProperties(prefix = "spring.datasource")
    public DataSource masterDataSource() {
        return DataSourceBuilder.create().type(dataSourceType).build();
    }

    /**
     * 从数据源配置
     */
    @Bean(name = "slaveDataSource0")
    @ConfigurationProperties(prefix = "spring.slave0")
    public DataSource slaveDataSource0() {
        return DataSourceBuilder.create().type(dataSourceType).build();
    }

    /**
     * 从数据源集合
     */
    @Bean(name = "slaveDataSources")
    public List<DataSource> slaveDataSources() {
        List<DataSource> slaveDataSources = new ArrayList<>();
        slaveDataSources.add(slaveDataSource0());
        return slaveDataSources;
    }
}
```

#### 1.2 数据源类型枚举

```java
public enum DataSourceType {
    MASTER("master", "master"), 
    SLAVE("slave", "slave");
    
    private String type;
    private String name;

    DataSourceType(String type, String name) {
        this.type = type;
        this.name = name;
    }

    // getter and setter methods
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
```

### 2. 数据源上下文管理

#### 2.1 ThreadLocal 数据源持有器

```java
public class DataSourceContextHolder {
    private static final ThreadLocal<String> local = new ThreadLocal<>();

    public static ThreadLocal<String> getLocal() {
        return local;
    }

    public static void slave() {
        local.set(DataSourceType.SLAVE.getType());
    }

    public static void master() {
        local.set(DataSourceType.MASTER.getType());
    }

    public static String getJdbcType() {
        return local.get();
    }

    public static void clearDataSource() {
        local.remove();
    }
}
```

### 3. 动态数据源路由

#### 3.1 自定义数据源路由器

```java
public class DataSourceRoute extends AbstractRoutingDataSource {
    private static final Logger logger = Logger.getLogger(DataSourceRoute.class);
    private final int dataSourceNumber;
    
    public DataSourceRoute(int dataSourceNumber) {
        this.dataSourceNumber = dataSourceNumber;
    }

    @Override
    protected Object determineCurrentLookupKey() {
        String typeKey = DataSourceContextHolder.getJdbcType();
        logger.info("==================== switch dataSource: " + typeKey);
        
        if (DataSourceType.MASTER.getType().equals(typeKey)) {
            return DataSourceType.MASTER.getType();
        } else {
            // 从数据源随机分配（负载均衡）
            Random random = new Random();
            return random.nextInt(dataSourceNumber);
        }
    }
}
```

### 4. SqlSession 工厂配置

#### 4.1 自定义 SqlSessionFactory（关键配置）

```java
@Configuration
@ConditionalOnClass({EnableTransactionManagement.class})
@Import({DataSourceConfiguration.class, PageInterceptor.class})
public class DataSourceSqlSessionFactory {
    private static final Logger logger = Logger.getLogger(DataSourceSqlSessionFactory.class);

    @Value("${spring.datasource.type}")
    private Class<? extends DataSource> dataSourceType;

    @Value("${mybatis.mapper-locations}")
    private String mapperLocations;

    @Value("${mybatis.type-aliases-package}")
    private String aliasesPackage;

    @Value("${slave.datasource.number}")
    private int dataSourceNumber;

    @Resource(name = "masterDataSource")
    private DataSource masterDataSource;

    @Resource(name = "slaveDataSources")
    private List<DataSource> slaveDataSources;

    @Autowired
    private PageInterceptor pageInterceptor;

    @Bean
    @ConditionalOnMissingBean
    public SqlSessionFactory sqlSessionFactory() throws Exception {
        logger.info("======================= init sqlSessionFactory");
        
        SqlSessionFactoryBean sqlSessionFactoryBean = new SqlSessionFactoryBean();
        
        // ⚠️ 重要：必须在 getObject() 之前设置拦截器
        sqlSessionFactoryBean.setPlugins(new Interceptor[]{pageInterceptor});
        sqlSessionFactoryBean.setDataSource(roundRobinDataSourceProxy());
        
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        sqlSessionFactoryBean.setMapperLocations(resolver.getResources(mapperLocations));
        sqlSessionFactoryBean.setTypeAliasesPackage(aliasesPackage);
        
        SqlSessionFactory sqlSessionFactory = sqlSessionFactoryBean.getObject();
        sqlSessionFactory.getConfiguration().setMapUnderscoreToCamelCase(true);
        
        return sqlSessionFactory;
    }

    @Bean(name = "roundRobinDataSourceProxy")
    public AbstractRoutingDataSource roundRobinDataSourceProxy() {
        logger.info("======================= init robinDataSourceProxy");
        
        DataSourceRoute proxy = new DataSourceRoute(dataSourceNumber);
        Map<Object, Object> targetDataSources = new HashMap<>();
        
        targetDataSources.put(DataSourceType.MASTER.getType(), masterDataSource);
        
        if (slaveDataSources != null) {
            for (int i = 0; i < slaveDataSources.size(); i++) {
                targetDataSources.put(i, slaveDataSources.get(i));
            }
        }
        
        proxy.setDefaultTargetDataSource(masterDataSource);
        proxy.setTargetDataSources(targetDataSources);
        return proxy;
    }
}
```

### 5. AOP 切面配置

#### 5.1 数据源切换切面

```java
@Aspect
@Component
public class DataSourceAop {
    private static final Logger logger = Logger.getLogger(DataSourceAop.class);

    /**
     * 读操作切换到从数据源
     */
    @Before("execution(* com.dbq.iot.mapper..*.get*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.isExist*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.select*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.count*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.list*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.query*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.find*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.search*(..))")
    public void setSlaveDataSourceType(JoinPoint joinPoint) {
        DataSourceContextHolder.slave();
        logger.info("=========slave, method: " + joinPoint.getSignature().getName());
    }

    /**
     * 写操作切换到主数据源
     */
    @Before("execution(* com.dbq.iot.mapper..*.add*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.del*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.upDate*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.insert*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.create*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.update*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.delete*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.remove*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.save*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.relieve*(..)) || " +
            "execution(* com.dbq.iot.mapper..*.edit*(..))")
    public void setMasterDataSourceType(JoinPoint joinPoint) {
        DataSourceContextHolder.master();
        logger.info("=========master, method: " + joinPoint.getSignature().getName());
    }
}
```

### 6. 事务管理配置

```java
@Configuration
@Import({DataSourceConfiguration.class})
public class DataSourceTransaction extends DataSourceTransactionManagerAutoConfiguration {
    private static final Logger logger = Logger.getLogger(DataSourceTransaction.class);

    @Resource(name = "masterDataSource")
    private DataSource masterDataSource;

    /**
     * 配置事务管理器（只对主数据源进行事务管理）
     */
    @Bean(name = "transactionManager")
    public DataSourceTransactionManager transactionManagers() {
        logger.info("===================== init transactionManager");
        return new DataSourceTransactionManager(masterDataSource);
    }
}
```

### 7. MyBatis 分页拦截器

#### 7.1 分页拦截器实现

```java
@Intercepts({@Signature(type = StatementHandler.class, method = "prepare", args = {Connection.class, Integer.class})})
public class PageInterceptor implements Interceptor {
    private static final Log logger = LogFactory.getLog(PageInterceptor.class);
    private static final ObjectFactory DEFAULT_OBJECT_FACTORY = new DefaultObjectFactory();
    private static final ObjectWrapperFactory DEFAULT_OBJECT_WRAPPER_FACTORY = new DefaultObjectWrapperFactory();
    private static final ReflectorFactory DEFAULT_REFLECTOR_FACTORY = new DefaultReflectorFactory();
    
    private static final String DEFAULT_DIALECT = "mysql";
    private static final String DEFAULT_PAGE_SQL_ID = ".*Page$";
    
    private String dialect = "";
    private String pageSqlId = "";

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        StatementHandler statementHandler = (StatementHandler) invocation.getTarget();
        MetaObject metaStatementHandler = MetaObject.forObject(statementHandler, DEFAULT_OBJECT_FACTORY,
                DEFAULT_OBJECT_WRAPPER_FACTORY, DEFAULT_REFLECTOR_FACTORY);

        // 分离代理对象链
        while (metaStatementHandler.hasGetter("h")) {
            Object object = metaStatementHandler.getValue("h");
            metaStatementHandler = MetaObject.forObject(object, DEFAULT_OBJECT_FACTORY, 
                    DEFAULT_OBJECT_WRAPPER_FACTORY, DEFAULT_REFLECTOR_FACTORY);
        }

        // 分离最后一个代理对象的目标类
        while (metaStatementHandler.hasGetter("target")) {
            Object object = metaStatementHandler.getValue("target");
            metaStatementHandler = MetaObject.forObject(object, DEFAULT_OBJECT_FACTORY, 
                    DEFAULT_OBJECT_WRAPPER_FACTORY, DEFAULT_REFLECTOR_FACTORY);
        }

        Configuration configuration = (Configuration) metaStatementHandler.getValue("delegate.configuration");
        
        // 设置默认值
        if (dialect == null || "".equals(dialect)) {
            logger.warn("Property dialect is not set, use default 'mysql'");
            dialect = DEFAULT_DIALECT;
        }
        if (pageSqlId == null || "".equals(pageSqlId)) {
            logger.warn("Property pageSqlId is not set, use default '.*Page$'");
            pageSqlId = DEFAULT_PAGE_SQL_ID;
        }

        MappedStatement mappedStatement = (MappedStatement) metaStatementHandler.getValue("delegate.mappedStatement");

        // 只重写需要分页的 SQL 语句
        if (mappedStatement.getId().matches(pageSqlId)) {
            BoundSql boundSql = (BoundSql) metaStatementHandler.getValue("delegate.boundSql");
            Object parameterObject = boundSql.getParameterObject();
            
            if (parameterObject == null) {
                throw new NullPointerException("parameterObject is null!");
            } else {
                PageParameter page = (PageParameter) metaStatementHandler
                        .getValue("delegate.boundSql.parameterObject.page");
                String sql = boundSql.getSql();
                
                // 重写 SQL
                String pageSql = buildPageSql(sql, page);
                metaStatementHandler.setValue("delegate.boundSql.sql", pageSql);
                metaStatementHandler.setValue("delegate.rowBounds.offset", RowBounds.NO_ROW_OFFSET);
                metaStatementHandler.setValue("delegate.rowBounds.limit", RowBounds.NO_ROW_LIMIT);
                
                Connection connection = (Connection) invocation.getArgs()[0];
                // 重设分页参数里的总页数等
                setPageParameter(sql, connection, mappedStatement, boundSql, page);
            }
        }
        
        return invocation.proceed();
    }

    /**
     * 设置分页参数
     */
    private void setPageParameter(String sql, Connection connection, MappedStatement mappedStatement,
                                  BoundSql boundSql, PageParameter page) {
        String countSql = "select count(0) from (" + sql + ") as total";
        PreparedStatement countStmt = null;
        ResultSet rs = null;
        
        try {
            countStmt = connection.prepareStatement(countSql);
            BoundSql countBS = new BoundSql(mappedStatement.getConfiguration(), countSql,
                    boundSql.getParameterMappings(), boundSql.getParameterObject());

            // 处理 foreach 参数问题
            handleForeachParameters(boundSql, countBS);

            setParameters(countStmt, mappedStatement, countBS, boundSql.getParameterObject());
            rs = countStmt.executeQuery();
            
            int totalCount = 0;
            if (rs.next()) {
                totalCount = rs.getInt(1);
            }
            
            page.setTotalCount(totalCount);
            int totalPage = totalCount / page.getPageSize() + ((totalCount % page.getPageSize() == 0) ? 0 : 1);
            page.setTotalPage(totalPage);

        } catch (SQLException e) {
            logger.error("Ignore this exception", e);
        } finally {
            closeResources(rs, countStmt);
        }
    }

    /**
     * 处理 foreach 参数问题
     */
    private void handleForeachParameters(BoundSql boundSql, BoundSql countBS) {
        try {
            Field metaParamsField = ReflectUtil.getFieldByFieldName(boundSql, "metaParameters");
            if (metaParamsField != null) {
                MetaObject mo = (MetaObject) ReflectUtil.getValueByFieldName(boundSql, "metaParameters");
                ReflectUtil.setValueByFieldName(countBS, "metaParameters", mo);
            }

            Field additionalField = ReflectUtil.getFieldByFieldName(boundSql, "additionalParameters");
            if (additionalField != null) {
                Map<String, Object> map = (Map<String, Object>) ReflectUtil.getValueByFieldName(boundSql, "additionalParameters");
                ReflectUtil.setValueByFieldName(countBS, "additionalParameters", map);
            }
        } catch (Exception e) {
            logger.error("Handle foreach parameters error", e);
        }
    }

    /**
     * 设置 SQL 参数
     */
    private void setParameters(PreparedStatement ps, MappedStatement mappedStatement, BoundSql boundSql,
                               Object parameterObject) throws SQLException {
        ParameterHandler parameterHandler = new DefaultParameterHandler(mappedStatement, parameterObject, boundSql);
        parameterHandler.setParameters(ps);
    }

    /**
     * 构建分页 SQL
     */
    private String buildPageSql(String sql, PageParameter page) {
        if (page != null) {
            return buildPageSqlForMysql(sql, page).toString();
        } else {
            return sql;
        }
    }

    /**
     * 构建 MySQL 分页语句
     */
    public StringBuilder buildPageSqlForMysql(String sql, PageParameter page) {
        StringBuilder pageSql = new StringBuilder(100);
        String beginrow = String.valueOf((page.getCurrentPage() - 1) * page.getPageSize());
        pageSql.append(sql);
        pageSql.append(" limit ").append(beginrow).append(",").append(page.getPageSize());
        return pageSql;
    }

    /**
     * 关闭资源
     */
    private void closeResources(ResultSet rs, PreparedStatement stmt) {
        try {
            if (rs != null) rs.close();
        } catch (SQLException e) {
            logger.error("Close ResultSet error", e);
        }
        try {
            if (stmt != null) stmt.close();
        } catch (SQLException e) {
            logger.error("Close PreparedStatement error", e);
        }
    }

    @Override
    public Object plugin(Object target) {
        if (target instanceof StatementHandler) {
            return Plugin.wrap(target, this);
        } else {
            return target;
        }
    }

    @Override
    public void setProperties(Properties properties) {
        // 可以通过 properties 设置dialect和pageSqlId
    }
}
```

### 8. 配置文件

#### 8.1 数据源配置

```properties
# 主数据源配置
spring.datasource.name=writedb
spring.datasource.url=jdbc:mysql://192.168.0.1/master?useUnicode=true&characterEncoding=utf8&autoReconnect=true&failOverReadOnly=false
spring.datasource.username=root
spring.datasource.password=1234
spring.datasource.type=com.alibaba.druid.pool.DruidDataSource
spring.datasource.driver-class-name=com.mysql.jdbc.Driver
spring.datasource.filters=stat
spring.datasource.initialSize=20
spring.datasource.minIdle=20
spring.datasource.maxActive=200
spring.datasource.maxWait=60000

# 从库数量配置
slave.datasource.number=1

# 从数据源配置
spring.slave0.name=readdb
spring.slave0.url=jdbc:mysql://192.168.0.2/slave?useUnicode=true&characterEncoding=utf8&autoReconnect=true&failOverReadOnly=false
spring.slave0.username=root
spring.slave0.password=1234
spring.slave0.type=com.alibaba.druid.pool.DruidDataSource
spring.slave0.driver-class-name=com.mysql.jdbc.Driver
spring.slave0.filters=stat
spring.slave0.initialSize=20
spring.slave0.minIdle=20
spring.slave0.maxActive=200
spring.slave0.maxWait=60000

# MyBatis 配置
mybatis.mapper-locations=classpath:mapper/*.xml
mybatis.type-aliases-package=com.dbq.iot.entity
```

## 关键问题解决

### 问题描述

配置多数据源后，MyBatis 分页拦截器失效。

### 原因分析

自定义 `SqlSessionFactory` 时，没有正确注入 MyBatis 拦截器，导致拦截器无法生效。

### 解决方案

1. **通过 `@Import` 注解引入拦截器类**:
   ```java
   @Import({DataSourceConfiguration.class, PageInterceptor.class})
   ```

2. **注入拦截器实例**:
   ```java
   @Autowired
   private PageInterceptor pageInterceptor;
   ```

3. **在创建 SqlSessionFactory 时设置拦截器**:
   ```java
   sqlSessionFactoryBean.setPlugins(new Interceptor[]{pageInterceptor});
   ```

### ⚠️ 重要注意事项

- **设置顺序**: 必须在调用 `sqlSessionFactoryBean.getObject()` 之前设置 `plugins`
- **原因**: SqlSessionFactory 在生成时会获取 plugins 并设置到 Configuration 中，如果在之后设置则不会注入

### 源码分析

```java
// SqlSessionFactoryBean.getObject()
public SqlSessionFactory getObject() throws Exception {
    if (this.sqlSessionFactory == null) {
        afterPropertiesSet(); // 在这里会调用 buildSqlSessionFactory()
    }
    return this.sqlSessionFactory;
}

// buildSqlSessionFactory() 中的关键代码
if (!isEmpty(this.plugins)) {
    for (Interceptor plugin : this.plugins) {
        configuration.addInterceptor(plugin); // 注入拦截器
    }
}
```

## 特性说明

### 读写分离

- **读操作**: 自动路由到从数据源（支持多从库负载均衡）
- **写操作**: 自动路由到主数据源
- **事务支持**: 写操作支持事务管理

### 负载均衡

- **策略**: 随机分配算法
- **扩展性**: 支持多个从库配置
- **可定制**: 可替换为其他负载均衡算法（如轮询）

### 分页功能

- **自动分页**: 拦截以 `Page` 结尾的方法名
- **总数统计**: 自动计算总记录数和总页数
- **参数支持**: 完整支持 MyBatis foreach 等复杂参数

## 总结

本方案成功实现了 Spring Boot 环境下的多数据源读写分离，并解决了 MyBatis 拦截器失效的问题。通过合理的配置和代码组织，实现了：

- 透明的读写分离
- 灵活的负载均衡
- 完整的分页功能
- 良好的事务支持

该方案适用于中小型项目的数据库读写分离需求，具有良好的扩展性和维护性。