import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  // "/linux/",
  // { text: "Linux", icon: "codicon:terminal-linux", link: "/linux/"},
  // 将 Docker 相关链接合并为下拉菜单
  {
    text: 'Java专区',
    icon: 'skill-icons:docker',
    children: [
      { text: 'Java8教程', link: '/java8-tutorial/' },
      { text: 'Java编程思想', link: 'https://github.com/tuonioooo/docker' },
      { text: 'Java新特性导读', link: 'https://github.com/tuonioooo/docker' },
      { text: 'Java并发编程教程', link: '/java-concurrent/' },
      { text: 'Java基础教程', link: '/java/' },
      { text: 'Java日常文章', link: '/java-article/' },
    ],
  },
  {
    text: 'Docker',
    icon: 'skill-icons:docker',
    children: [
      { text: 'Gitbook Docker', link: 'https://tuonioooo-notebook.gitbook.io/docker' },
      { text: 'Github Docker', link: 'https://github.com/tuonioooo/docker' },
    ],
  },
  {
    text: '中间件',
    children: [
      { text: '搜索引擎', link: '/middleware/solr/solr-starter' },
      // { text: 'solr', link: '/middleware/solr/solr-starter' },
      // { text: 'es', link: '/middleware/elasticsearch/es-starter' },
    ],
  },
  {
    text: '工具集',
    link: '/tools/'
    // children: [
    //   { text: '', link: '/tools/' },
    //   // { text: 'solr', link: '/middleware/solr/solr-starter' },
    //   // { text: 'es', link: '/middleware/elasticsearch/es-starter' },
    // ],
  }
]);
