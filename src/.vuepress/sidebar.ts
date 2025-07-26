import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "intro",
  ],
  // Java基础知识
  "/java/":[
    {
      text: "Java 基础教程",
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
          text: "Spring MVC",
          icon: "puzzle-piece",
          collapsible: true,
          prefix: '/java/spring-mvc/',  // 嵌套子文件夹
          children: [
            "spring-mvc-starter",
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
        }
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
          ]
        },
        
      ]  
    }
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
      text: "搜索引擎",   // 分组
      // prefix: "/search/",
      children: [
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
        "lucene"
      ],
    },
  ],

  "/tools/": [
  // {
  //   text: "工具集",
  //   link: ""
  // },
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
   
  ]
  
});
