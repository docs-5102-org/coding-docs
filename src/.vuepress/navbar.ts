import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: '☕ Java专区',
    children: [
      { text: 'Java基础教程', link: '/java/' },
      { text: 'Java8教程', link: '/java8-tutorial/' },
      { text: 'Java新特性导读', link: 'https://github.com/tuonioooo/docker' },
      { text: 'Java并发编程教程', link: '/java-concurrent/' }
    ],
  },
  {
    text: '💻 编程语言',
    children: [
      {
        text: '🐘 PHP',
        link: '/php/'
      },
      {
        text: '🐍 Python',
        link: '/python/'
      },
      {
        text: ' Go',
        icon: 'https://go.dev/blog/go-brand/logos.jpg',
        link: '/go/'
      },
    ],
  },
  {
    text: '🗄️ 数据服务',
    link: '/middleware/solr/solr-starter',
    children: [
      {
        text: '中间件',
        link: '/middleware/solr/solr-starter',
      },
      {
        text: '数据存储',
        children: [
          { text: '📝 数据库', link: '/store/database/mysql/mysql-common-sql' },
          { text: '📝 对象存储', link: '/store/minio/minio-starter' },
        ],
      },
    ]
  },
  {
    text: '🔧 工具集',
    link: '/tools/'
  },
  {
    text: '📱 应用开发',
    children: [
      {
        text: '🔄 API 设计',
        link: '/api-design/'
      },
      {
        text: '🎮 游戏开发',
        link: '/game-development/',
      }
    ],
  },
  {
    text: '📘 专项文档',
    children: [
      {
        text: '📑 博客文档',
        link: '/article/',
      },
      {
        text: '📑 面试文档',
        link: '/interview/java/基础.md',
      },
      { text: '🐧 Linux', link: 'https://devops.dzspace.top/linux/' },
      { text: 'Docker', icon: 'skill-icons:docker', link: 'https://github.com/tuonioooo/docker' },
      {
        text: '📜 AI智能化文档',
        link: 'https://notion.dzspace.top',
      },
      {
        text: '🌐 Web和移动开发技术栈',
        link: 'https://web.dzspace.top',
      },
    ]
  }
]);
