import { defineUserConfig } from "vuepress";
import theme from "./theme.js";



export default defineUserConfig({
  base: '/', // 兼容 GitHub Pages 的路径
  // base: '/', // 如果不使用 GitHub Pages，可以将 base 设置为根路径

  lang: "zh-CN",
  title: "tuonioooo's DevOps Docs",
  description: "一个高效的运维文档",
  // 在head中添加meta标签，支持访问微信图片
  head: [
    ['meta', { name: 'referrer', content: 'no-referrer' }],
    // 其他meta标签...
  ],
  theme,
 
  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
