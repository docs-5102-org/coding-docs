---
title: SpringBoot集成Swagger2、3 以及 springdoc-openapi-ui 完整指南
category:
  - Web框架
tag:
  - Spring Boot
  - swagger
  - springdoc-openapi-ui
---

# Spring Boot 集成 Swagger2、3 以及 springdoc-openapi-ui 完整指南

## 目录

[[toc]]

## 简介

本文详细介绍 Spring Boot 不同版本（2.2.6.Release 和 2.7.18）集成 Swagger 的配置方法，以及最新的 **springdoc-openapi-ui** 集成方案。

**重要提醒：** 建议优先选择 **springdoc-openapi-ui**，因为：
- springdoc-openapi-ui 目前仍在维护
- springfox-swagger 已停止维护
- springfox-swagger 对高版本 Spring Boot 兼容性较差

## Spring Boot 2.2.6.Release 集成 Swagger2

### 添加依赖

```xml
<!-- swagger start -->
<dependency>
    <groupId>io.springfox</groupId>
    <artifactId>springfox-swagger2</artifactId>
    <version>2.9.2</version>
    <exclusions>
        <exclusion>
            <groupId>io.swagger</groupId>
            <artifactId>swagger-annotations</artifactId>
        </exclusion>
        <exclusion>
            <groupId>io.swagger</groupId>
            <artifactId>swagger-models</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>io.springfox</groupId>
    <artifactId>springfox-swagger-ui</artifactId>
    <version>2.9.2</version>
</dependency>
<!-- 解决Swagger 2.9.2版本NumberFormatException -->
<dependency>
    <groupId>io.swagger</groupId>
    <artifactId>swagger-models</artifactId>
    <version>1.6.0</version>
</dependency>
<dependency>
    <groupId>io.swagger</groupId>
    <artifactId>swagger-annotations</artifactId>
    <version>1.6.0</version>
</dependency>
<!-- swagger end -->
```

### 配置静态资源访问路径

```java
@Configuration
@EnableGlobalMethodSecurity(prePostEnabled=true)
public class WebConfig extends WebMvcConfigurationSupport {

    @Autowired
    private AccessInterceptor interceptor;

    /**
     * 注册自定义拦截器
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(interceptor)
                .excludePathPatterns("/swagger-ui.html", "/webjars/**", "/v2/**", 
                                   "/swagger-resources/**", "/error/**");
    }

    /**
     * 注册自定义静态资源
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 解决静态资源无法访问
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/");
        // 解决swagger无法访问
        registry.addResourceHandler("/swagger-ui.html")
                .addResourceLocations("classpath:/META-INF/resources/");
        // 解决swagger的js文件无法访问
        registry.addResourceHandler("/webjars/**")
                .addResourceLocations("classpath:/META-INF/resources/webjars/");
        super.addResourceHandlers(registry);
    }
}
```

### 配置 Swagger 配置类

```java
@Configuration
@EnableSwagger2 // 开启swagger2
public class SwaggerConfig {

    /**
     * 构建swagger 配置简介、认证插件、扫描包的路径
     */
    @Bean
    public Docket webApiConfig(){
        Docket docket = new Docket(DocumentationType.SWAGGER_2)
                .groupName("webApi")
                .apiInfo(webApiInfo())
                .select()
                .apis(RequestHandlerSelectors.withClassAnnotation(Api.class))
                .paths(PathSelectors.any())
                .build();

        // 配置认证插件
        docket.securitySchemes(securitySchemes()).securityContexts(securityContexts());
        return docket;
    }

    private ApiInfo webApiInfo(){
        return new ApiInfoBuilder()
                .title("API文档")
                .description("API文档接口定义")
                .version("1.0")
                .contact(new Contact("java", "http://localhost:9330/login", "xxxxx@qq.com"))
                .build();
    }

    /**
     * 设置请求头信息
     */
    private List<SecurityScheme> securitySchemes() {
        List<SecurityScheme> result = new ArrayList<>();
        result.add(new ApiKey("Authorization", "Authorization", "header"));
        result.add(new ApiKey("unique", "unique", "header"));
        return result;
    }

    /**
     * 设置需要登录认证的路径
     */
    private List<SecurityContext> securityContexts() {
        List<SecurityContext> result = new ArrayList<>();
        result.add(getContextByPath("/*/.*"));
        return result;
    }

    private SecurityContext getContextByPath(String pathRegex) {
        return SecurityContext.builder()
                .securityReferences(defaultAuth())
                .forPaths(PathSelectors.regex(pathRegex))
                .build();
    }

    private List<SecurityReference> defaultAuth() {
        List<SecurityReference> result = new ArrayList<>();
        result.add(new SecurityReference("Authorization", scopes()));
        result.add(new SecurityReference("unique", scopes()));
        return result;
    }

    private AuthorizationScope[] scopes() {
        return new AuthorizationScope[]{new AuthorizationScope("global", "accessAnything")};
    }
}
```

### 访问地址

配置完成后，默认访问地址：`http://localhost:port/swagger-ui.html`

## Spring Boot 2.7.18 集成 Swagger3

### 添加依赖

```xml
<!-- swagger start -->
<!-- Swagger3 -->
<dependency>
    <groupId>io.springfox</groupId>
    <artifactId>springfox-boot-starter</artifactId>
    <version>3.0.0</version>
</dependency>

<dependency>
    <groupId>io.springfox</groupId>
    <artifactId>springfox-swagger-ui</artifactId>
    <version>3.0.0</version>
</dependency>

<dependency>
    <groupId>com.github.xiaoymin</groupId>
    <artifactId>knife4j-spring-boot-starter</artifactId>
    <version>3.0.3</version>
</dependency>
<!-- swagger end -->
```

### 配置静态资源访问路径

```java
@Configuration
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class WebConfig extends WebMvcConfigurationSupport {

    @Autowired
    private AccessInterceptor interceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(interceptor)
                .excludePathPatterns("/swagger-ui/**", "/swagger-ui.html", "/webjars/**", 
                                   "/v2/**", "/swagger-resources/**", "/error/**");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/");
        registry.addResourceHandler("doc.html")
                .addResourceLocations("classpath:/META-INF/resources/");
        registry.addResourceHandler("/webjars/**")
                .addResourceLocations("classpath:/META-INF/resources/webjars/");
        registry.addResourceHandler("/swagger-ui/**")
                .addResourceLocations("classpath:/META-INF/resources/webjars/springfox-swagger-ui/");
    }
}
```

### 配置 Swagger 配置类

```java
@Configuration
@EnableOpenApi
public class SwaggerConfig {

    @Bean
    public Docket webApiConfig() {
        Docket docket = new Docket(DocumentationType.SWAGGER_2)
                .groupName("webApi")
                .apiInfo(webApiInfo())
                .enable(true)
                .select()
                .apis(RequestHandlerSelectors.withClassAnnotation(Api.class))
                .paths(PathSelectors.any())
                .build();

        // 配置认证插件
        docket.securitySchemes(securitySchemes()).securityContexts(securityContexts());
        return docket;
    }

    private ApiInfo webApiInfo() {
        return new ApiInfoBuilder()
                .title("后台API文档")
                .description("本文档描述了后台API文档接口定义")
                .version("1.0")
                .contact(new Contact("java", "http://localhost:9660/login", "xxxxx@qq.com"))
                .build();
    }

    // 其他方法与2.2.6版本相同...
}
```

### 解决路径匹配问题

Spring Boot 2.6.x 以后版本需要添加以下配置来解决 Springfox 路径匹配问题：

```java
@Slf4j
@Configuration
public class BeanPostProcessorConfig {

    @Bean
    public BeanPostProcessor springfoxHandlerProviderBeanPostProcessor() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
                if (bean instanceof WebMvcRequestHandlerProvider || bean instanceof WebFluxRequestHandlerProvider) {
                    customizeSpringfoxHandlerMappings(getHandlerMappings(bean));
                }
                return bean;
            }

            private <T extends RequestMappingInfoHandlerMapping> void customizeSpringfoxHandlerMappings(List<T> mappings) {
                List<T> copy = mappings.stream()
                        .filter(mapping -> mapping.getPatternParser() == null)
                        .collect(Collectors.toList());
                mappings.clear();
                mappings.addAll(copy);
            }

            @SuppressWarnings("unchecked")
            private List<RequestMappingInfoHandlerMapping> getHandlerMappings(Object bean) {
                try {
                    Field field = ReflectionUtils.findField(bean.getClass(), "handlerMappings");
                    field.setAccessible(true);
                    return (List<RequestMappingInfoHandlerMapping>) field.get(bean);
                } catch (IllegalArgumentException | IllegalAccessException e) {
                    throw new IllegalStateException(e);
                }
            }
        };
    }
}
```

## Spring Boot 2.7.18 集成 springdoc-openapi-ui

### 添加依赖

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-ui</artifactId>
</dependency>
```

### 配置访问路径（可选）

```yaml
# swagger-ui 默认地址为 /swagger-ui.html
springdoc:
  swagger-ui:
    path: /swagger-ui.html

# springdoc 默认访问地址就是 /v3/api-docs
springdoc.api-docs.path=/v3/api-docs
```

### 配置拦截器（推荐方式）

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private AccessInterceptor interceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(interceptor)
                .excludePathPatterns("/v3/**", "/swagger-ui/**", "/swagger-ui.html", 
                                   "/v2/**", "/error/**", "/favicon*.ico");
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
        // Spring data jpa pageable的参数分解器
        argumentResolvers.add(new PageableHandlerMethodArgumentResolver());
    }
}
```

### 访问地址

- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON**: `http://localhost:9660/v3/api-docs`

## 常用 Swagger 注解

| 注解 | 描述 |
|------|------|
| @Api | 用于描述整个API接口的信息，包括API的标题、描述等 |
| @ApiOperation | 用于描述单个接口的操作信息，包括接口的HTTP方法、路径、描述等 |
| @ApiParam | 用于描述接口参数的信息，包括参数名、类型、描述等 |
| @ApiModel | 用于描述接口返回结果或请求体的模型信息 |
| @ApiModelProperty | 用于描述模型属性的信息，包括属性名、类型、描述等 |
| @ApiIgnore | 用于忽略某个API接口，使其不在生成的文档中显示 |
| @ApiResponse | 用于描述接口的响应信息，包括响应码、描述、返回类型等 |
| @ApiResponses | 用于描述多个接口响应的信息，可以与@ApiResponse配合使用 |

## 版本对比与选择建议

### SpringFox vs SpringDoc

- **OpenAPI**: 是规范标准
- **Swagger**: 规范的实现之一
- **SpringFox**: 基于 Swagger2 的实现，已停止维护
- **SpringDoc**: 基于 OpenAPI3 的实现，持续维护中

### 兼容性说明

- SpringFox 3.0.0 是唯一的 release 版本，支持 Spring Boot 2.2+
- SpringFox 对 Spring Boot 2.7.x 兼容性较差
- SpringDoc 对新版本 Spring Boot 支持更好

### 推荐方案

1. **新项目**: 优先选择 **springdoc-openapi-ui**
2. **老项目**: 
   - Spring Boot 2.2.x 以下: 使用 Swagger2
   - Spring Boot 2.6.x 以上: 建议迁移到 springdoc-openapi-ui

## 注意事项

1. 如有权限路径拦截配置，需要放行相应的访问地址
2. SpringFox 在高版本 Spring Boot 中可能遇到路径匹配问题，需要额外配置
3. 官方建议使用 SpringDoc 替代 SpringFox
4. 注意不同版本的访问路径可能不同（如 swagger-ui.html vs index.html）

## 参考资源

- SpringDoc 官方文档: https://springdoc.org/
- SpringDoc GitHub: https://github.com/springdoc/springdoc-openapi
- Swagger UI 属性配置: https://springdoc.org/#swagger-ui-properties
- SpringDoc 属性配置: https://springdoc.org/#properties