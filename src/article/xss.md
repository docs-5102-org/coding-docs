---
title: 防止XSS跨站脚本攻击总结
category:
  - java
tag:
  - xss
---


# 防止XSS跨站脚本攻击总结

## 一、什么是XSS攻击

XSS攻击（Cross Site Scripting，跨站脚本攻击）是一种代码注入攻击。攻击者通过在网站注入恶意脚本，使之在用户浏览器上运行，从而盗取用户信息、诱导用户操作或破坏网站功能。为了不与层叠样式表（CSS）缩写混淆，故将跨站脚本攻击缩写为XSS。

## 二、Java防XSS攻击解决方案

### 2.1 基于Filter的通用防护方案

#### 核心思路
通过自定义Filter拦截所有HTTP请求，对请求参数和头部信息进行XSS过滤处理。

#### 实现步骤

**第一步：创建XSS过滤器**

```java
public class XSSFilter implements Filter {
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {}

    @Override
    public void destroy() {}

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                        FilterChain chain) throws IOException, ServletException {
        chain.doFilter(new XSSRequestWrapper((HttpServletRequest) request), response);
    }
}
```

**第二步：实现HttpServletRequestWrapper包装类**

```java
public class XSSRequestWrapper extends HttpServletRequestWrapper {
    
    public XSSRequestWrapper(HttpServletRequest servletRequest) {
        super(servletRequest);
    }

    @Override
    public String[] getParameterValues(String parameter) {
        String[] values = super.getParameterValues(parameter);
        if (values == null) {
            return null;
        }
        int count = values.length;
        String[] encodedValues = new String[count];
        for (int i = 0; i < count; i++) {
            encodedValues[i] = stripXSS(values[i]);
        }
        return encodedValues;
    }

    @Override
    public String getParameter(String parameter) {
        String value = super.getParameter(parameter);
        return stripXSS(value);
    }

    @Override
    public String getHeader(String name) {
        String value = super.getHeader(name);
        return stripXSS(value);
    }

    private String stripXSS(String value) {
        if (value != null) {
            // 移除null字符
            value = value.replaceAll("", "");
            
            // 移除script标签
            Pattern scriptPattern = Pattern.compile("<script>(.*?)</script>", 
                                                   Pattern.CASE_INSENSITIVE);
            value = scriptPattern.matcher(value).replaceAll("");
            
            // 移除src属性中的危险内容
            scriptPattern = Pattern.compile("src[\\r\\n]*=[\\r\\n]*\\\'(.*?)\\\'", 
                           Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL);
            value = scriptPattern.matcher(value).replaceAll("");
            
            // 移除各种危险的JavaScript表达式
            scriptPattern = Pattern.compile("eval\\((.*?)\\)", 
                           Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL);
            value = scriptPattern.matcher(value).replaceAll("");
            
            scriptPattern = Pattern.compile("javascript:", Pattern.CASE_INSENSITIVE);
            value = scriptPattern.matcher(value).replaceAll("");
            
            scriptPattern = Pattern.compile("onload(.*?)=", 
                           Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL);
            value = scriptPattern.matcher(value).replaceAll("");
        }
        return value;
    }
}
```

### 2.2 SpringBoot集成方案

#### 基于Jsoup的高级过滤

**第一步：添加依赖**

```xml
<dependency>
    <groupId>org.jsoup</groupId>
    <artifactId>jsoup</artifactId>
    <version>1.9.2</version>
</dependency>
```

**第二步：创建Jsoup工具类**

```java
public class JsoupUtil {
    /**
     * 使用basicWithImages白名单
     * 允许基本标签：a,b,blockquote,br,cite,code,dd,dl,dt,em,i,li,ol,p,pre,q,small,span,
     * strike,strong,sub,sup,u,ul,img
     */
    private static final Whitelist whitelist = Whitelist.basicWithImages();
    private static final Document.OutputSettings outputSettings = 
                                    new Document.OutputSettings().prettyPrint(false);
    
    static {
        // 允许所有标签的style属性（支持富文本编辑器样式）
        whitelist.addAttributes(":all", "style");
    }

    public static String clean(String content) {
        if(StringUtils.isNotBlank(content)){
            content = content.trim();
        }
        return Jsoup.clean(content, "", whitelist, outputSettings);
    }
}
```

**第三步：创建请求包装器**

```java
public class XssHttpServletRequestWrapper extends HttpServletRequestWrapper {
    HttpServletRequest orgRequest = null;
    private boolean isIncludeRichText = false;

    public XssHttpServletRequestWrapper(HttpServletRequest request, boolean isIncludeRichText) {
        super(request);
        orgRequest = request;
        this.isIncludeRichText = isIncludeRichText;
    }

    @Override
    public String getParameter(String name) {
        // 对于富文本内容参数，可选择性过滤
        Boolean flag = ("content".equals(name) || name.endsWith("WithHtml"));
        if(flag && !isIncludeRichText){
            return super.getParameter(name);
        }
        
        name = JsoupUtil.clean(name);
        String value = super.getParameter(name);
        if (StringUtils.isNotBlank(value)) {
            value = JsoupUtil.clean(value);
        }
        return value;
    }

    @Override
    public String[] getParameterValues(String name) {
        String[] arr = super.getParameterValues(name);
        if(arr != null){
            for (int i=0;i<arr.length;i++) {
                arr[i] = JsoupUtil.clean(arr[i]);
            }
        }
        return arr;
    }

    @Override
    public String getHeader(String name) {
        name = JsoupUtil.clean(name);
        String value = super.getHeader(name);
        if (StringUtils.isNotBlank(value)) {
            value = JsoupUtil.clean(value);
        }
        return value;
    }
}
```

**第四步：配置SpringBoot Filter**

```java
@Configuration
public class XssConfig{
    @Bean
    public FilterRegistrationBean xssFilterRegistrationBean() {
        FilterRegistrationBean filterRegistrationBean = new FilterRegistrationBean();
        filterRegistrationBean.setFilter(new XssFilter());
        filterRegistrationBean.setOrder(1);
        filterRegistrationBean.setEnabled(true);
        filterRegistrationBean.addUrlPatterns("/*");
        
        Map<String, String> initParameters = Maps.newHashMap();
        // 配置排除的URL路径
        initParameters.put("excludes", "/favicon.ico,/img/*,/js/*,/css/*");
        // 是否包含富文本过滤
        initParameters.put("isIncludeRichText", "true");
        filterRegistrationBean.setInitParameters(initParameters);
        
        return filterRegistrationBean;
    }
}
```

### 2.3 JSP页面防护

#### 使用c:out标签

在JSP页面中，避免直接使用EL表达式输出用户输入的内容，而应使用`c:out`标签：

```jsp
<!-- 不安全的写法 -->
${user.name}

<!-- 安全的写法 -->
<c:out value="${user.name}" />
```

**原理：**`c:out`标签默认设置了`escapeXML="true"`属性，会自动对特殊HTML字符进行转义处理。

## 三、防护方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 自定义Filter+正则 | 实现简单，性能较好 | 正则规则可能不够全面，容易遗漏 | 简单应用，对安全要求不是特别高 |
| Jsoup库过滤 | 功能强大，白名单机制安全可靠 | 性能开销相对较大 | 对安全要求高的企业应用 |
| ESAPI库 | 专业安全库，功能全面 | 引入复杂，学习成本高 | 对安全有极高要求的系统 |
| JSP c:out标签 | 使用简单，JSP原生支持 | 只能用于页面输出防护 | JSP页面输出安全 |

## 四、最佳实践建议

### 4.1 分层防护策略
1. **输入过滤**：在接收用户输入时进行第一道过滤
2. **存储转义**：将数据存储到数据库前进行转义处理
3. **输出编码**：在页面输出时进行HTML编码

### 4.2 配置要点
1. **Filter优先级**：将XSS Filter配置为最高优先级（order=1）
2. **URL排除**：合理配置静态资源路径排除，提升性能
3. **富文本处理**：对于富文本编辑器内容，采用白名单机制而非黑名单

### 4.3 注意事项
1. **性能考量**：过滤操作会增加请求处理时间，需要在安全与性能间找到平衡
2. **业务兼容**：某些业务场景可能需要允许部分HTML标签，需要灵活配置白名单
3. **全面覆盖**：不仅要过滤请求参数，还要过滤HTTP头、Cookie等所有用户可控输入

## 五、总结

XSS防护是Web应用安全的重要组成部分，需要采用多层防护策略。通过合理选择过滤方案，正确配置过滤规则，并结合前端输出编码，可以有效防范XSS攻击。在实际项目中，建议根据业务需求和安全要求选择合适的防护方案，确保应用安全的同时不影响正常的业务功能。