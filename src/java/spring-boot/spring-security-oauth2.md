---
title: spring-security-oauth2[2.5.2.RELEASE教程 已归档]
category:
  - Web框架
tag:
  - Spring Boot
  - spring-security-oauth2
---

# spring-security-oauth2[2.5.2.RELEASE教程 已归档]

## 目录

[[toc]]

## 介绍

Spring Security 的 OAuth2 功能已整合到 Spring Security 核心模块中，原先的 `spring-security-oauth(1a)`、`spring-security-oauth2` 模块已被弃用。

您可以通过添加 `spring-boot-starter-oauth2-client` 依赖来使用相关功能。

归档最新版本为： `2.5.2.RELEASE`

归档tags版本地址：<https://github.com/spring-attic/spring-security-oauth/tags>

归档地址为：<https://github.com/spring-attic/spring-security-oauth>

## 快速入门

### 添加依赖

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.7.18</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>

    <groupId>com.yichuang</groupId>
    <artifactId>yichuang-security</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>yichuang-security</name>
    <description>旧版本[spring-security-oauth2]示例项目</description>

    <properties>
        <java.version>1.8</java.version>
        <lombok.version>1.18.0</lombok.version>
        <fastjson.version>1.2.49</fastjson.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <!-- oauth2配置 start -->
        <dependency>
            <groupId>org.springframework.security.oauth</groupId>
            <artifactId>spring-security-oauth2</artifactId>
            <version>2.3.5.RELEASE</version>
        </dependency>
        <!-- oauth2配置 end -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>${lombok.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-lang3</artifactId>
            <version>${commons-lang3.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>fastjson</artifactId>
            <version>${fastjson.version}</version>
        </dependency>


        <!-- http start-->
        <dependency>
            <groupId>org.apache.httpcomponents</groupId>
            <artifactId>httpclient</artifactId>
            <version>${httpclient.version}</version>
        </dependency>
        <!-- http end-->

        <!-- jwt 解析相关 begin -->

        <!-- spring-security-oauth2（>=5.x），它已经废弃了对 spring-security-jwt 的直接依赖，你需要手动添加它。 -->
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-jwt</artifactId>
            <version>1.0.7.RELEASE</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.10.5</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.10.5</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>com.auth0</groupId>
            <artifactId>java-jwt</artifactId>
            <version>3.10.3</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.10.5</version>
            <scope>runtime</scope>
        </dependency>
        <!-- jwt 解析相关 end -->

    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>

</project>
```
    

### AuthorizationServerConfigurerAdapter 认证服务器适配

#### token存储方式-[内存]适配

`1.AuthorizationServerConfiguration.java`

```java
@Configuration
@EnableAuthorizationServer
public class AuthorizationServerConfiguration extends AuthorizationServerConfigurerAdapter {

    private final AuthenticationManager authenticationManager;

    private final MyUserDetailsService myUserDetailsService;

    // token有效期24小时，单位为秒 24 * 60 * 60
    private static final int accessTokenValiditySeconds = 24 * 60 * 60;

    public AuthorizationServerConfiguration(AuthenticationManager authenticationManager, MyUserDetailsService myUserDetailsService) {
        this.authenticationManager = authenticationManager;
        this.myUserDetailsService = myUserDetailsService;
    }

    /**
     * 配置clientDetails存储的方式-》内存方式
     */
    @Override
    public void configure(ClientDetailsServiceConfigurer clients) throws Exception {
        clients.inMemory() // 使用内存存储客户端信息
                .withClient(OAuth2Client.CLIENT_ID) // 客户端ID
                .secret(OAuth2Client.CLIENT_SECRET) // 客户端密钥
                .authorizedGrantTypes("password", "refresh_token", "authorization_code", "client_credentials") // 支持的授权模式
                .scopes("read", "write") // 授权范围
                .accessTokenValiditySeconds(accessTokenValiditySeconds) // token有效期
                .refreshTokenValiditySeconds(accessTokenValiditySeconds * 2); // refresh_token有效期
    }

    @Override
    public void configure(AuthorizationServerEndpointsConfigurer endpoints) throws Exception {
        // 配置认证管理器和UserDetailsService
        endpoints.authenticationManager(authenticationManager);
        endpoints.userDetailsService(myUserDetailsService);

        // 自定义Token生成方式
        TokenEnhancerChain tokenEnhancerChain = new TokenEnhancerChain();
        tokenEnhancerChain.setTokenEnhancers(Arrays.asList(customTokenEnhancer(), accessTokenConverter()));
        endpoints.tokenEnhancer(tokenEnhancerChain);

        // 指定Token存储方式为内存存储
        endpoints.tokenStore(tokenStore());
    }

    @Override
    public void configure(AuthorizationServerSecurityConfigurer oauthServer) {
        oauthServer.tokenKeyAccess("permitAll()")// 开启/oauth/token_key验证端口无权限访问
                .checkTokenAccess("isAuthenticated()")// 开启/oauth/check_token验证端口认证权限访问
                .allowFormAuthenticationForClients();//允许表单认证
    }

    /**
     * 指定token存储的位置为内存
     */
    @Bean
    public TokenStore tokenStore() {
        return new InMemoryTokenStore(); // 使用内存存储Token
    }

    /**
     * 自定义AccessToken转换器
     */
    @Bean
    public JwtAccessTokenConverter accessTokenConverter() {
        JwtAccessTokenConverter converter = new JwtAccessTokenConverter();
        converter.setSigningKey("123456"); // 设置对称加密密钥 (生产环境请替换为更安全的密钥)
        converter.setAccessTokenConverter(new CustomerAccessTokenConverter());
        return converter;
    }

    /**
     * 自定义token增强器
     */
    @Bean
    public TokenEnhancer customTokenEnhancer() {
        return new CustomTokenEnhancer();
    }   
}
```    

2.自定义增强器 `CustomTokenEnhancer.java`

使token携带更多的信息，当获取token时，会将额外的信息一同token返回。

```java
    /**
     * <p>
     * 自定义token增强器（使token携带更多的信息）
     * </p>
     *
     * @author daizhao
     * @site https://www.motopa.cn
     * @date 2019/11/29 11:42
     */
    public class CustomTokenEnhancer implements TokenEnhancer {
    
        @Override
        public OAuth2AccessToken enhance(OAuth2AccessToken accessToken, OAuth2Authentication authentication) {
            final Map<String, Object> additionalInfo = new HashMap<>();
            additionalInfo.put("id", 1001);
            ((DefaultOAuth2AccessToken) accessToken).setAdditionalInformation(additionalInfo);
            return accessToken;
        }
    }
```    

#### token存储方式-[持久化]适配

[yichuang-security](https://gitee.com/code-org/yichuang-security/blob/master/docs/advanced.md#%E5%AE%9E%E6%88%98%E6%BC%94%E7%BB%83)
