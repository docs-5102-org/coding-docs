---
title: FreeMarker 模板目录加载方法
category:
  - java
  - 模版引擎
tag:
  - FreeMarker
---

# FreeMarker模板目录加载方法详解

FreeMarker是一个功能强大的Java模板引擎，在Web开发和代码生成等场景中被广泛应用。正确配置模板加载路径是使用FreeMarker的关键步骤。本文将详细介绍FreeMarker提供的三种模板目录加载方法，并提供最佳实践建议。

## 概述

FreeMarker通过`Configuration`类提供了三种主要的模板加载方式：

1. **基于类路径加载** - 适用于加载JAR包内的模板资源
2. **基于文件系统加载** - 适用于加载本地文件系统中的模板
3. **基于Servlet上下文加载** - 适用于Web应用中加载WebRoot下的模板

## 方法一：基于类路径加载模板

### API签名
```java
public void setClassForTemplateLoading(Class clazz, String pathPrefix);
```

### 适用场景
- 模板文件打包在JAR包内
- 模板作为项目资源文件存在于classpath中
- 需要确保模板文件的安全性和不可修改性

### 目录结构示例
```
项目结构 (Maven/Gradle项目)
src/
├── main/
│   ├── java/
│   │   └── com/example/util/
│   │       └── FreemarkerUtil.class
│   └── resources/
│       └── template/                    ← 模板目录
│           ├── Base.ftl                 ← 目标模板文件
│           ├── user/
│           │   ├── profile.ftl
│           │   └── settings.ftl
│           └── common/
│               ├── header.ftl
│               └── footer.ftl

编译后的目录结构 (classpath)
/
├── com/example/util/
│   └── FreemarkerUtil.class
└── template/                           ← pathPrefix="/template"
    ├── Base.ftl                        ← cfg.getTemplate("Base.ftl")
    ├── user/
    │   ├── profile.ftl                 ← cfg.getTemplate("user/profile.ftl")
    │   └── settings.ftl
    └── common/
        ├── header.ftl
        └── footer.ftl
```

### 基础示例
```java
Configuration cfg = new Configuration(Configuration.VERSION_2_3_31);
// 以FreemarkerUtil类所在的包为基准，加载/template目录下的模板
cfg.setClassForTemplateLoading(FreemarkerUtil.class, "/template");
Template template = cfg.getTemplate("Base.ftl");
```

### 高级用法
```java
public class TemplateLoader {
    private static final Configuration cfg = new Configuration(Configuration.VERSION_2_3_31);
    
    static {
        // 使用当前类作为基准类，加载templates目录
        cfg.setClassForTemplateLoading(TemplateLoader.class, "/templates");
        
        // 设置模板更新延迟（用于开发环境）
        cfg.setTemplateUpdateDelayMilliseconds(0);
        
        // 设置默认编码
        cfg.setDefaultEncoding("UTF-8");
        
        // 设置异常处理器
        cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
    }
    
    public static Template getTemplate(String templateName) throws IOException {
        return cfg.getTemplate(templateName);
    }
}
```

### 路径说明
- `pathPrefix`参数支持相对路径和绝对路径
- 以"/"开头表示从classpath根目录开始
- 不以"/"开头表示相对于指定类的包路径

## 方法二：基于文件系统加载模板

### API签名
```java
public void setDirectoryForTemplateLoading(File dir) throws IOException;
```

### 适用场景
- 模板文件存储在文件系统中
- 需要运行时动态修改模板内容
- 模板文件较大或需要版本控制

### 目录结构示例
```
文件系统结构
/
├── home/
│   └── user/
│       └── templates/                   ← 模板根目录
│           ├── Base.ftl                 ← cfg.getTemplate("Base.ftl")
│           ├── report/
│           │   ├── daily.ftl           ← cfg.getTemplate("report/daily.ftl")
│           │   ├── weekly.ftl
│           │   └── monthly.ftl
│           └── email/
│               ├── welcome.ftl
│               ├── notification.ftl
│               └── common/
│                   ├── header.ftl
│                   └── footer.ftl

应用运行目录示例
/opt/myapp/
├── myapp.jar
├── config/
└── templates/                          ← 运行时模板目录
    ├── Base.ftl
    ├── generator/
    │   ├── entity.ftl
    │   ├── dao.ftl
    │   └── service.ftl
    └── views/
        ├── list.ftl
        └── detail.ftl
```

### 基础示例
```java
Configuration cfg = new Configuration(Configuration.VERSION_2_3_31);
cfg.setDirectoryForTemplateLoading(new File("/home/user/templates"));
Template template = cfg.getTemplate("Base.ftl");
```

### 动态路径加载
```java
public class DynamicTemplateLoader {
    
    public static Configuration createConfiguration() throws IOException {
        Configuration cfg = new Configuration(Configuration.VERSION_2_3_31);
        
        // 获取当前应用的运行目录
        String currentPath = DynamicTemplateLoader.class
            .getProtectionDomain()
            .getCodeSource()
            .getLocation()
            .getPath();
            
        // 构建模板目录路径
        File templateDir = new File(currentPath, "templates");
        
        // 确保目录存在
        if (!templateDir.exists()) {
            templateDir.mkdirs();
        }
        
        cfg.setDirectoryForTemplateLoading(templateDir);
        cfg.setDefaultEncoding("UTF-8");
        cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
        
        return cfg;
    }
}
```

### 多目录支持
```java
public class MultiDirectoryTemplateLoader {
    
    public static Configuration createConfiguration(String... templateDirs) throws IOException {
        Configuration cfg = new Configuration(Configuration.VERSION_2_3_31);
        
        // 创建多模板加载器
        List<TemplateLoader> loaders = new ArrayList<>();
        
        // 添加文件系统加载器
        for (String dir : templateDirs) {
            loaders.add(new FileTemplateLoader(new File(dir)));
        }
        
        // 添加类路径加载器作为后备
        loaders.add(new ClassTemplateLoader(MultiDirectoryTemplateLoader.class, "/templates"));
        
        // 创建多模板加载器
        MultiTemplateLoader mtl = new MultiTemplateLoader(
            loaders.toArray(new TemplateLoader[0])
        );
        
        cfg.setTemplateLoader(mtl);
        cfg.setDefaultEncoding("UTF-8");
        
        return cfg;
    }
}
```

## 方法三：基于Servlet上下文加载模板

### API签名
```java
public void setServletContextForTemplateLoading(Object servletContext, String path);
```

### 适用场景
- Web应用环境
- 模板文件位于WebRoot目录下
- 需要通过Web容器管理模板资源

### 目录结构示例
```
Web应用目录结构 (传统Web应用)
WebRoot/                                ← Web应用根目录
├── WEB-INF/
│   ├── web.xml
│   ├── classes/
│   └── lib/
├── css/
├── js/
├── images/
└── ftl/                                ← 模板目录 (path="/ftl")
    ├── Base.ftl                        ← cfg.getTemplate("Base.ftl")
    ├── pages/
    │   ├── index.ftl                   ← cfg.getTemplate("pages/index.ftl")
    │   ├── about.ftl
    │   └── contact.ftl
    ├── components/
    │   ├── navbar.ftl
    │   ├── sidebar.ftl
    │   └── pagination.ftl
    └── layouts/
        ├── main.ftl
        └── admin.ftl

Spring Boot Web应用示例
src/main/
├── java/
└── resources/
    ├── static/
    ├── templates/                      ← Thymeleaf模板目录
    └── freemarker/                     ← FreeMarker模板目录
        ├── Base.ftl
        ├── user/
        │   ├── login.ftl
        │   └── register.ftl
        └── admin/
            ├── dashboard.ftl
            └── users.ftl

部署后的Web应用结构
/var/lib/tomcat8/webapps/myapp/
├── WEB-INF/
├── META-INF/
└── ftl/                                ← ServletContext相对路径"/ftl"
    ├── Base.ftl
    └── ...
```

### 基础示例
```java
@WebServlet("/template")
public class TemplateServlet extends HttpServlet {
    private Configuration cfg;
    
    @Override
    public void init() throws ServletException {
        cfg = new Configuration(Configuration.VERSION_2_3_31);
        
        // 设置模板目录为WebRoot/ftl
        cfg.setServletContextForTemplateLoading(getServletContext(), "/ftl");
        cfg.setDefaultEncoding("UTF-8");
        cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
    }
    
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) 
            throws ServletException, IOException {
        Template template = cfg.getTemplate("Base.ftl");
        
        // 处理模板...
    }
}
```

### Spring框架集成
```java
@Configuration
public class FreeMarkerConfig {
    
    @Bean
    public FreeMarkerConfigurer freeMarkerConfigurer(ServletContext servletContext) {
        FreeMarkerConfigurer configurer = new FreeMarkerConfigurer();
        
        // 设置模板路径
        configurer.setTemplateLoaderPath("/WEB-INF/templates/");
        
        // 或者使用ServletContext方式
        freemarker.template.Configuration cfg = new freemarker.template.Configuration(
            Configuration.VERSION_2_3_31
        );
        cfg.setServletContextForTemplateLoading(servletContext, "/WEB-INF/templates/");
        configurer.setConfiguration(cfg);
        
        return configurer;
    }
}
```

## 最佳实践与建议

### 1. 选择合适的加载方式

| 场景 | 推荐方式 | 目录特点 | 原因 |
|------|----------|----------|------|
| 生产环境，模板固定 | 类路径加载 | resources/templates/ | 安全性高，性能好，随JAR打包 |
| 开发环境，需要热更新 | 文件系统加载 | /home/user/templates/ | 便于调试和修改，支持外部配置 |
| Web应用，模板在WebRoot | Servlet上下文加载 | WebRoot/ftl/ | 符合Web应用结构，容器管理 |

### 2. 通用配置模板
```java
public class FreeMarkerConfigurationBuilder {
    
    public static Configuration.Builder createBuilder() {
        return new Configuration.Builder(Configuration.VERSION_2_3_31)
            .defaultEncoding("UTF-8")
            .templateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER)
            .logTemplateExceptions(false)
            .wrapUncheckedExceptions(true)
            .fallbackOnNullLoopVariable(false);
    }
    
    public static Configuration createClasspathConfiguration(Class<?> clazz, String path) {
        Configuration cfg = createBuilder().build();
        cfg.setClassForTemplateLoading(clazz, path);
        return cfg;
    }
    
    public static Configuration createFileSystemConfiguration(String directory) throws IOException {
        Configuration cfg = createBuilder().build();
        cfg.setDirectoryForTemplateLoading(new File(directory));
        return cfg;
    }
}
```

### 3. 性能优化建议

- **缓存Configuration对象**：避免重复创建，使用单例模式
- **设置适当的模板更新延迟**：生产环境可设置较长延迟或禁用检查
- **使用模板缓存**：合理配置缓存大小和过期策略
- **选择合适的编码**：统一使用UTF-8编码

### 4. 错误处理
```java
public class SafeTemplateLoader {
    
    public static Template loadTemplate(Configuration cfg, String templateName) {
        try {
            return cfg.getTemplate(templateName);
        } catch (TemplateNotFoundException e) {
            throw new RuntimeException("模板文件未找到: " + templateName, e);
        } catch (MalformedTemplateNameException e) {
            throw new RuntimeException("模板名称格式错误: " + templateName, e);
        } catch (ParseException e) {
            throw new RuntimeException("模板解析错误: " + templateName, e);
        } catch (IOException e) {
            throw new RuntimeException("模板加载IO错误: " + templateName, e);
        }
    }
}
```

## 总结

FreeMarker的三种模板加载方式各有特点，在实际项目中应根据具体需求选择合适的方式。类路径加载适合生产环境的稳定部署，文件系统加载提供了灵活的动态更新能力，而Servlet上下文加载则完美契合Web应用的架构。

通过合理配置和使用这些加载方式，可以构建出高效、稳定的模板处理系统，为应用的模板化需求提供强有力的支持。