import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "intro",
  ],
  "/article/": false, // 隐藏侧边栏
  "/php/":[
    {
      text: "入门教程",
      link: "intro",
    },
    {
      text: "PHP扩展插件配置教程",
      link: "php-extend",
    },
    {
      text: "PHP Nginx配置教程",
      link: "php-nginx-conf",
    },
    {
      text: "PHP 本地开发环境运行配置",
      link: "php-env",
    },
    {
      text: "PHP 常见问题",
      link: "php-problem",
    },
    {
      text: "Wordpress 教程",
      link: "wordpress-starter",
    }
  ],
  "/python/": [
    "intro",
    "env",
    "django",
    "pyinstaller",
    "qt",
    "problem",
    "podt"
  ],
  "/api-design/":[
    {
      text: "RESTful API 设计",
      link: "restful-api",
    },
    {
      text: "为什么 APP 要用token而不用session认证？",
      link: "/api-design/auth/app-token-vs-session",
    }
  ],
  // Java基础知识
  "/java/":[
    {
      text: "Java 教程资料",
      link: "intro",
    },
    {
      text: "Java 模版引擎", // 分组
      children: [
        {
          text: "FreeMarker",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/java/freemarker/',  // 嵌套子文件夹
          children: [
            "f-starter",
            "f-grammar",
            "f-template-loading",
            "f-springboot"
          ]
        },
        {
          text: "Thymeleaf",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/java/thymeleaf/',  // 嵌套子文件夹
          children: [
            "thy-starter",
          ]
        },
        {
          text: "Velocity",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/java/velocity/',  // 嵌套子文件夹
          children: [
            "ve-starter",
          ]
        },
      ]  
    },
    {
      text: "Java 爬虫框架", // 分组
      children: [
        {
          text: "Gecco",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/java/crawler/',  // 嵌套子文件夹
          children: [
            "gecco",
          ]
        },
      ]  
    },
    {
      text: "Java Web框架", // 分组
      children: [
        {
          text: "Struts2",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/java/struts2/',  // 嵌套子文件夹
          children: [
            "struts2-starter",
          ]
        },
        {
          text: "Spring",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/java/spring/',  // 嵌套子文件夹
          children: [
            "spring-framework-architecture",
            "spring-annotation",
            "spring-aop",
            "spring-applicationcontextaware",
            "spring-applicationtext",
            "spring-bean-scope",
            "spring-distributed-transaction",
            "spring-initializingbean",
            "spring-interceptor",
            "spring-jsp-tag",
            "spring-loadxml",
            "spring-mvc-starter",
            "spring-mvc-web",
            "spring-servletcontextaware",
            "spring-threadlocal",
            "spring-transaction",
            "spring-webapplicationcontext"
          ]
        },
        {
          text: "Spring WebFlux",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/java/spring-web-flux/',  // 嵌套子文件夹
          children: [
            "spring-web-flux",
          ]
        },
        {
          text: "Spring Boot",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/java/spring-boot/',  // 嵌套子文件夹
          children: [
            "spring-boot-reference-manual",
            "spring-boot-version-intro",
            "spring-boot-startup",
            "spring-boot-banner",
            "spring-boot-runner",
            {
              text: "基础配置",
              collapsible: true,
              children: [
                "spring-boot-multiple-config",
                "spring-boot-config-ssl",
                "spring-boot-environmentaware",
                "spring-boot-servletInitializer",
                "spring-boot-deploy-war",
                "spring-boot-multiple-module"
              ]
            },
            {
              text: "数据访问",
              collapsible: true,
              children: [
                "spring-boot-hikaricp",
                "spring-boot-h2",
                "spring-boot-redis",
                "spring-boot-redis-timout",
                "spring-boot-redis-session",
                "spring-boot-redisearch",
                "spring-boot-multiple-datasource",
                "spring-boot-multiple-datasource-2",
                "spring-boot-shardingsphere"
              ]
            },
            {
              text: "Web开发",
              collapsible: true,
              children: [
                "spring-boot-cors",
                "spring-boot-view-jsp",
                "spring-boot-multipartfile",
                "spring-boot-jsonview",
                "spring-boot-jackson",
                "spring-boot-swagger-springdoc",
                "spring-boot-sse",
                "spring-boot-netty-socketio"
              ]
            },
            {
              text: "安全认证",
              collapsible: true,
              children: [
                "spring-boot-login-verify",
                "spring-boot-prevent-duplicate-requests",
                "spring-boot-api-sign",
                "spring-security-oauth2",
                "spring-boot-shiro-transactional"
              ]
            },
            {
              text: "日志监控",
              collapsible: true,
              children: [
                "spring-boot-log4j",
                "spring-boot-logback",
                "spring-boot-monitor"
              ]
            },
            {
              text: "中间件集成",
              collapsible: true,
              children: [
                "spring-boot-dubbo",
                "spring-boot-kafka",
                "spring-boot-quartz"
              ]
            },
            {
              text: "缓存应用",
              collapsible: true,
              children: [
                "spring-boot-cache-annotation",
                "spring-boot-pool"
              ]
            },
            {
              text: "其他",
              collapsible: true,
              children: [
                "spring-boot-2.7.x-upgrade",
                "spring-boot-hmrvh",
                "spring-boot-problem"
              ]
            }
          ]
        },
        {
          text: "Spring Cloud",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/java/spring-cloud/',  // 嵌套子文件夹
          children: [
            "spring-cloud-starter",
            "spring-cloud-versions",
          ]
        },
      ]  
    },
    {
      text: "Java 安全认证框架", // 分组
      children: [
        {
          text: "Java Apache Shiro",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/java/security-framework/apache-shiro',  // 嵌套子文件夹
          children: [
            "shiro-starter"
          ],
        },
      ]  
    },
    {
      text: "Java 持久层框架", // 分组
      children: [
        {
          text: "Jpa",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/java/jpa/',  // 嵌套子文件夹
          children: [
            "jpa-starter",
            "jpa-mapping",
            "jpa-mapping-table",
            "jpa-jpql",
            "java-bean-validation",
            "spring-data-jpa"
          ]
        },
        {
          text: "Hibernate",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/java/hibernate/',  // 嵌套子文件夹
          children: [
            "hibernate-starter",
            "hibernate-group-validator"
          ]
        },
        {
          text: "Mybatis",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/java/mybatis/',  // 嵌套子文件夹
          children: [
            "mybatis-starter",
            "mybatis-result",
            "mybatis-select",
            "mybatis-where",
            "mybatis-config",
            "mybatis-many-insert",
            "mybatis-tkmapper",
            "mybatisplus-starter",
            "mybatisplus-querywrapper",
            "mybatis-sharejdbc"
          ]
        },
        
      ]  
    },
    {
      text: "Java JVM", // 分组
      collapsible: true,
      prefix: '/java/jvm/',
      children: [
        "jar-intro",
        "intro",
        "common",
        "metaspace-size",
        "stack",
        "tools",
        "urlclassloader"
      ]  
    },
    {
      text: "Java 注解", // 分组
      collapsible: true,
      children: [
        {
          text: "Java Annotation 教程",
          icon: "puzzle-piece",
          link: "/java/annotation/starter"
        }
      ]  
    },
    {
      text: "Java 正则表达式", // 分组
      collapsible: true,
      children: [
        {
          text: "Java 正则表达式基础",
          icon: "puzzle-piece",
          link: "/java/regex/starter"
        },
        {
          text: "日期时间正则表达式",
          icon: "puzzle-piece",
          link: "/java/regex/datetime-regex"
        },
        {
          text: "普通正则表达式",
          icon: "puzzle-piece",
          link: "/java/regex/common-regex"
        },
        {
          text: "捕获组和非贪婪正则表达式",
          icon: "puzzle-piece",
          link: "/java/regex/capture-group"
        },
        {
          text: "国际电话号码正则表达式",
          icon: "puzzle-piece",
          link: "/java/regex/foreign-phone"
        },
        {
          text: "Notepad中使用正则表达式",
          icon: "puzzle-piece",
          link: "/java/regex/notepad-regex"
        },
      ]  
    },
    {
      text: "Java 日志", // 分组
      collapsible: true,
      children: [
        { 
          text: 'Log4j', 
          link: '/java/log/log4j' 
        },
        { 
          text: 'Logback', 
          link:'/java/log/logback'
        },
        { 
          text: 'JUL', 
          link:'/java/log/jul'
        },
      ]
    },
    {
      text: "Java 定时任务", // 分组
      children: [
        {
          text: "Quartz 定时任务",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/java/schedule/quartz',  // 嵌套子文件夹
          children: [
            "quartz-starter",
            "quartz-springboot"
          ]
        },
      ]  
    },
    {
      text: "Java Web容器", // 分组
      children: [
        {
          text: "resin",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: "/java/resin",
          children: [
            "resin-starter",
            "resin-cluster",
          ]
        },
        {
          text: "Tomcat",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: "/java/tomcat",
          children: [
            "tomcat-install",
            "tomcat-conf",
            "tomcat-mysql-mapping",
            "tomcat-servlet-mapping",
            "tomcat-deploy",
            "tomcat-architecture",
            "tomcat-session-share",
            "tomcat-cluster",
            "tomcat-problem"
          ]
        }
      ]  
    },
  ],
  "/java-article/":[
    {
      text: "Java编程技巧汇总",
      collapsible: true,
      children: [
        "skill-1",
        "ttf",
        "brotli",
        "javassist",
        "beanutils",
        "timeformate",
        "transcoding",
        "singleton",
        "design-mode-1",
        "design-mode-2",
        "qrcode",
        "inner",
        "byte-string",
        "fos",
        "base64",
        "equals",
        "rotate",
        "vcf",
        "thumbnailator",
        "high-concurrency-design",
        "xss",
        "get-resource"
      ]
    },
  ],
  //# Java 8 专用侧边栏
  "/java8-tutorial/": [
    "",
    {
      text: "Java 8 Lambda 表达式",
      link: "lambda",
    },
    {
      text: "Java 8 Optional",
      link: "optional"
    },
    {
      text: "Java 8 并发编程",
      collapsible: true,
      children: [
        "concurrent-1.md",
        "concurrent-2.md",
        "concurrent-3.md",
        "concurrent-4.md"
      ]
    },
    {
      text: "Java 8 default默认方法",
      link: "default-methods"
    },
    {
      text: "Java 8 函数式接口",
      link: "functional-interface"
    },
    {
      text: "Java 8 Stream API",
      collapsible: true,
      children: [
        "stream",
        "stream-sorted",
        "stream-list",
      ]
    },
    {
      text: "Java 8 日期和时间 API",
      // icon: "calendar",
      collapsible: true,
      link: "localdate",
    },
    {
      text: "Java 8 文件操作",
      link: "file",
    },
    {
      text: "Java 8 字符串高效处理",
      // icon: "file-lines",
      link: "string",
    },
    {
      text: "Java 8 Base64指南",
      // icon: "shield-keyhole",
      link: "base64",
    },
    {
      text: "Java 8 Math精确运算",
      link: "math",
    },
    {
      text: "Java 8 Nashorn 教程",
      link: "nashorn",
    },
    {
      text: "参考资料",
      link: "introduction",
    },
  ],

  // # Java 并发编程
  "/java-concurrent/": [
    {
      text: "Java 线程", // 分组
      children: [
        {
          text: "创建和启动线程",
          icon: "puzzle-piece",
          link: "/java-concurrent/thread/intro"
          // collapsible: true,
          // prefix: '/java-concurrent/thread/',  // 嵌套子文件夹
          // children: [
          //   "starter",
          // ]
        },
        {
          text: "线程的状态",
          icon: "puzzle-piece",
          link: "/java-concurrent/thread/thread-status"
        },
        {
          text: "Runnable接口",
          icon: "puzzle-piece",
          link: "/java-concurrent/thread/runnable"
        },
        {
          text: "Thread类",
          icon: "puzzle-piece",
          link: "/java-concurrent/thread/thread-starter"
        },
        {
          text: "sleep用法",
          icon: "puzzle-piece",
          link: "/java-concurrent/thread/thread-sleep"
        },
        {
          text: "join用法",
          icon: "puzzle-piece",
          link: "/java-concurrent/thread/thread-join"
        },
        {
          text: "interrupt用法",
          icon: "puzzle-piece",
          link: "/java-concurrent/thread/thread-interrupt"
        },
        {
          text: "wait/notify用法",
          icon: "puzzle-piece",
          link: "/java-concurrent/thread/thread-wait-notify"
        },
        {
          text: "设置线程名",
          icon: "puzzle-piece",
          link: "/java-concurrent/thread/thread-setname"
        },
        {
          text: "线程优先级",
          icon: "puzzle-piece",
          link: "/java-concurrent/thread/thread-priority"
        },
        {
          text: "检测线程是否运行(isAlive)",
          icon: "puzzle-piece",
          link: "/java-concurrent/thread/thread-isalive"
        },
        {
          text: "线程组",
          icon: "puzzle-piece",
          collapsible: true,
          children: [
            {
              text: "概述",
              icon: "puzzle-piece",
              link: "/java-concurrent/thread/thread-group/intro"
            },
            {
              text: "activeCount()方法",
              icon: "puzzle-piece",
              link: "/java-concurrent/thread/thread-group/active-count"
            },
            {
              text: "activeGroupCount()方法",
              icon: "puzzle-piece",
              link: "/java-concurrent/thread/thread-group/active-group-count"
            },
            {
              text: "enumerate()方法",
              icon: "puzzle-piece",
              link: "/java-concurrent/thread/thread-group/enumerate"
            },
            {
              text: "getMaxPriority()方法",
              icon: "puzzle-piece",
              link: "/java-concurrent/thread/thread-group/get-max-priority"
            },
            {
              text: "getName()方法",
              icon: "puzzle-piece",
              link: "/java-concurrent/thread/thread-group/get-name"
            },
            {
              text: "getParent()方法",
              icon: "puzzle-piece",
              link: "/java-concurrent/thread/thread-group/get-parent"
            },
            {
              text: "interrupt()方法",
              icon: "puzzle-piece",
              link: "/java-concurrent/thread/thread-group/interrupt"
            },
            {
              text: "list()方法",
              icon: "puzzle-piece",
              link: "/java-concurrent/thread/thread-group/list"
            },
          ]
        },
        {
          text: "同步机制",
          icon: "puzzle-piece",
          link: "/java-concurrent/thread/synchronized"
        },
        {
          text: "volatile关键字",
          icon: "puzzle-piece",
          link: "/java-concurrent/thread/volatile"
        },
        {
          text: "ThreadLocal类",
          icon: "puzzle-piece",
          collapsible: true,
          children: [
            {
              text: "概述",
              icon: "puzzle-piece",
              link: "/java-concurrent/thread/threadlocal/intro"
            },
            {
              text: "get()方法",
              icon: "puzzle-piece",
              link: "/java-concurrent/thread/threadlocal/get"
            },
            {
              text: "initialValue()方法",
              icon: "puzzle-piece",
              link: "/java-concurrent/thread/threadlocal/initial-value"
            },
            {
              text: "remove()方法",
              icon: "puzzle-piece",
              link: "/java-concurrent/thread/threadlocal/remove"
            },
            {
              text: "set()方法",
              icon: "puzzle-piece",
              link: "/java-concurrent/thread/threadlocal/set"
            }
          ]
        },
        {
          text: "Daemon守护线程",
          icon: "puzzle-piece",
          link: "/java-concurrent/thread/daemon"
        },
        {
          text: "线程的安全终止",
          icon: "puzzle-piece",
          link: "/java-concurrent/thread/safe-stop"
        },
      ]  
    },
    {
      text: "Java 并发编程", // 分组
      children: [
        {
          text: "概述",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/intro"
        },
        {
          text: "ExecutorService接口",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/executor-service"
        },
        {
          text: "ScheduledExecutorService接口",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/scheduled-executor-service"
        },
        {
          text: "Future接口",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/future"
        },
        {
          text: "CompletionService接口",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/completion-service"
        },
        {
          text: "CompletableFuture接口",
          icon: "puzzle-piece",
          link: "/java8-tutorial/concurrent-1"
        },
        {
          text: "ffcc的区别",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/ffcc-difference"
        },
        {
          text: "Callable vs Future",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/callable-future"
        },
        {
          text: "单个工作线程执行器",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/new-single-thread-executor"
        },
        {
          text: "固定线程池",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/new-fixed-threadpool"
        },
        {
          text: "缓存线程池",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/new-cached-threadpool"
        },
        {
          text: "定时任务线程池",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/new-scheduled-threadpool"
        },
        {
          text: "自定义线程池管理器",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/single-thread-pool-manager"
        },
        {
          text: "RejectedExecutionException产生的原因",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/rejected-execution-exception"
        },
        {
          text: "SpringBoot线程池应用",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/spring-boot-threadpool"
        },
        {
          text: "GroboUtils多线程测试指南",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/grobo-utils-starter"
        },
        {
          text: "多线程数据库操作方案",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/multithread-batch"
        },
        {
          text: "锁的详解",
          icon: "puzzle-piece",
          collapsible: true,
          children: [
            {
              text: "概述",
              icon: "puzzle-piece",
              link: "/java-concurrent/concurrent/lock/intro"
            },
            {
              text: "可重入锁的实现原理",
              icon: "puzzle-piece",
              link: "/java-concurrent/concurrent/lock/kcrs"
            }
          ]
        },
        {
          text: "CountDownLatch应用",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/count-down-latch"
        },
        {
          text: "ConcurrentHashMap应用",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/concurrent-hashmap"
        },
        {
          text: "参考手册",
          icon: "puzzle-piece",
          link: "/java-concurrent/concurrent/reference-manual"
        }
      ]  
    },
    {
      text: "Java 阻塞队列", // 分组
      children: [
        {
          text: "概述",
          icon: "puzzle-piece",
          link: "/java-concurrent/queue/intro"
        },
        {
          text: "阻塞队列原理",
          icon: "puzzle-piece",
          link: "/java-concurrent/queue/blocking-queue-principle"
        },
        {
          text: "阻塞队列应用",
          icon: "puzzle-piece",
          link: "/java-concurrent/queue/blocking-queue-application"
        }
      ]  
    }
  ],

  // # 中间件
  "/middleware/": [
    {
      text: "Elasticsearch",
      collapsible: true,
      prefix: '/middleware/elasticsearch/',  // 嵌套子文件夹
      children: [
        "es-starter"
      ]
    },
    {
      text: "Solr",
      collapsible: true,
      prefix: '/middleware/solr/',  // 嵌套子文件夹
      children: [
        "solr-starter",
        "solr-install",
        "solrcloud",
        "solr-vs-lucene"
      ]
    },
    {
      text: "Redis",
      collapsible: true,
      prefix: '/middleware/redis/',  // 嵌套子文件夹
      children: [
        "redis-install",
        "redis-conf",
        "redisson-starter",
        "redis-search",
        "redis-stack",
        "redis-command",
        "redis-bitmap",
        "redis-value",
        "redis-key",
        "redis-requirepass",
        "redis-cluster-ms",
        "redis-jedis",
        "redis-springboot",
        "redis-rate-limit",
        "redis-problem",
      ]
    },
    {
      text: "Memcached",
      collapsible: true,
      prefix: '/middleware/memcached/',  // 嵌套子文件夹
      children: [
        "starter",
        "command",
        "java-simple",
        "hashed",
        "cluster",
        "magent",
        "memcached-vs-redis",
      ]
    },
    {
      text: "RabbitMQ",
      collapsible: true,
      prefix: '/middleware/rabbitmq/',  // 嵌套子文件夹
      children: [
        "starter",
        "tutorial",
      ]
    },
    "lucene",
    {
      text: "ZooKeeper",
      collapsible: true,
      prefix: '/middleware/zookeeper/',  // 嵌套子文件夹
      children: [
        "zookeeper-starter",
      ]
    },
    {
      text: "ShardingSphere",
      collapsible: true,
      prefix: '/middleware/sharding-sphere/',  // 嵌套子文件夹
      children: [
        "sharding-sphere-starter",
      ]
    },
  ],

  "/tools/": [
    {
      text: "音视频", // 分组
      children: [
        {
          text: "FFmpeg",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/tools/ffmpeg/',  // 嵌套子文件夹
          children: [
            "ffmpeg-starter",
            "ffmpeg-problem",
            "ffmpeg-cut",
            "ffmpeg-java"
          ]
        },
      ]  
    },
    {
      text: "图像", // 分组
      children: [
        {
          text: "ImageMagick",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/tools/imagemagick/',  // 嵌套子文件夹
          children: [
            "imagemagick-starter"
          ]
        },
      ]  
    },
    {
      text: "电子书解析", // 分组
      children: [
        {
          text: "Epub",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/tools/epub/',  // 嵌套子文件夹
          children: [
            "epub-starter",
            "epub-encrypt"
          ]
        },
      ]  
    },
    {
      text: "网络协议与通信", // 分组
      children: [
        {
          text: "Websocket",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/tools/websocket/',  // 嵌套子文件夹
          children: [
            "websocket-starter",
          ]
        },
      ]  
    },
    {
      text: "富文本工具", // 分组
      children: [
        {
          text: "UEditor",
          icon: "puzzle-piece",
          link: "/tools/richtext/ueditor"
        },
      ]  
    },

    {
      text: "认证授权", // 分组
      children: [
        {
          text: "JustAuth",
          icon: "puzzle-piece",
          link: "/tools/auth/justauth"
        },
      ]  
    },

    {
      text: "依赖管理", // 分组
      children: [
        {
          text: "Maven",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/tools/dependency-management/maven',  // 嵌套子文件夹
          children: [
            "starter",
            "command",
            "scope",
            "install",
            "make-plugin",
            "version",
            "settings-xml",
            "repository",
            "package",
            "profile",
            "build",
            "manifest",
            "config-old-tomcat",
            "module-build",
            "scm",
            "nexus",
            "problem"
          ]
        },
        {
          text: "Gradle",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/tools/dependency-management/gradle',  // 嵌套子文件夹
          children: [
            "starter",
          ]
        },
      ]  
    },
    {
      text: "开发工具", // 分组
      children: [
        {
          text: "IntelliJ IDEA",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/tools/devtools/idea/',  // 嵌套子文件夹
          children: [
            "idea-install",
            "idea-keyword",
            "idea-template",
            "idea-debug-jenkins",
            "idea-maven-run-config",
            "idea-theme",
            "idea-svn-config",
            "idea-problem"
          ]
        },
        {
          text: "数据库工具",
          icon: "file-lines",
          prefix: "/tools/devtools/database/",
          collapsible: true,
          // children: "structure",
          children: [
            "navicat-starter",
            "power-designer",
          ]
        },
        {
          text: "shell工具",
          icon: "file-lines",
          prefix: "/tools/devtools/shell/",
          collapsible: true,
          // children: "structure",
          children: [
            "securefx",
          ]
        },
        {
          text: "eclipse工具",
          icon: "file-lines",
          prefix: "/tools/devtools/eclipse/",
          collapsible: true,
          // children: "structure",
          children: [
            "eclipse-starter",
            "myeclipse-starter",
          ]
        }
      ]
    },
    {
      text: "笔记工具", // 分组
      children: [
        {
          text: "Markdown",
          icon: "puzzle-piece",
          link: "/tools/notebook/markdown"
        },
      ]  
    },
    {
      text: "测试工具", // 分组
      children: [
        {
          text: "Jmeter",
          icon: "file-lines",
          prefix: "/tools/jmeter/",
          collapsible: true,
          children: [
            "jmeter-starter",
            "jmeter-simple",
          ]
        },
      ]  
    },
    {
      text: "其他工具", // 分组
      children: [
        {
          text: "Lombok",
          icon: "puzzle-piece",
          link: "/tools/lombok"
        },
        {
          text: "JWT",
          icon: "puzzle-piece",
          link: "/tools/jwt"
        },
      ]  
    },
  ],

  "/store/":[
    {
      text: "数据库",
      icon: "file-lines",
      prefix: "database/",
      collapsible: true,
      children: [
          {
            text: "Mysql",
            icon: "file-lines",
            prefix: "mysql/",
            collapsible: true,
            children: "structure",
          },
          {
            text: "Oracle",
            icon: "file-lines",
            prefix: "oracle/",
            collapsible: true,
            children: "structure",
          },
          {
            text: "Mongodb",
            icon: "file-lines",
            prefix: "Mongodb/",
            collapsible: true,
            children: "structure",
          },
          {
            text: "SqlServer",
            icon: "file-lines",
            prefix: "sqlserver/",
            collapsible: true,
            children: "structure",
          }
      ],
    },
    {
      text: "对象存储",
      icon: "file-lines",
      collapsible: true,
      children: [
          {
            text: "Minio",
            icon: "file-lines",
            prefix: "minio/",
            collapsible: true,
            children: "structure",
          },
      ],
    },
  ],
  "/game-development/":[
    {
      text: "Unity",
      link: "/game-development/unity/unity-starter",
    },
    {
      text: "Cocos Creator",
      link: "/game-development/creator/cocos-creator-starter",
    }
  ],
});
