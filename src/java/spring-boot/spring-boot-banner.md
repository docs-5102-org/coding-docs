---
title: Banner配置指南
category:
  - Web框架
tag:
  - Spring Boot
  - Banner
---


# Spring Boot Banner配置指南


## 1. 内置 Banner 加载顺序

Spring Boot 在启动时会按如下优先级查找并显示 Banner。只要命中任意一级，后续步骤即被跳过。

| 优先级 | 类型 | 配置项 / 默认文件名 | 说明 |
|---|---|---|---|
| ① | 文本 | `banner.txt` 或 `banner.location` | 纯文本文件，支持占位符（`${spring.version}` 等） |
| ② | 图片 | `banner.image.location` | 图片路径；未配置时，依次查找 `banner.gif` → `banner.jpg` → `banner.png` |
| ③ | 默认 | 无 | Spring Boot 自带小绿条 |

### 1.1 配置示例

YAML
```yaml
spring:
  banner:
    location: classpath:my-banner.txt          # 文本
    image:
      location: classpath:static/banner.png    # 图片
```

Properties
```properties
spring.banner.location=classpath:my-banner.txt
spring.banner.image.location=classpath:static/banner.png
```

---

## 2. 在线生成 ASCII 艺术字

| 站点 | 特色 | 地址 |
|---|---|---|
| TAAG | 字体最全，支持「测试模式」预览 | http://patorjk.com/software/taag |
| Bootschool ASCII | 中文友好，支持动物、节日主题 | https://www.bootschool.net/ascii |
| Network-Science | 复古风格，支持字符宽度调整 | http://www.network-science.de/ascii |
| Bootschool 动物 | 可爱动物合集 | https://www.bootschool.net/ascii-art/animals |

### 2.1 快速三步
1. 在线生成 → 复制 ASCII 文本  
2. 在 `src/main/resources` 下新建 `banner.txt` → 粘贴保存  
3. 启动应用，查看效果  

> 小技巧：在 `banner.txt` 末尾加 `${AnsiColor.BRIGHT_RED}` 可以让版本号高亮。

---

## 3 常见问题 & 最佳实践

| 问题 | 原因 | 解决方案 |
|---|---|---|
| Banner 不生效 | 文件放错目录 / 配置写错 | 确保文件位于 `classpath:` 根目录，或检查 `spring.banner.*` 配置 |
| 图片 Banner 变形 | 终端宽度不足 | 在配置里打开图片缩放：`spring.banner.image.width=76` |
| 多环境 Banner | 不同环境需要不同 Banner | 使用 Spring Profiles：<br>`application-prod.yml` 中单独指定 `spring.banner.location` |

---

## 4 一句话总结

把生成的 ASCII 文本保存为 `banner.txt`，丢进 `resources`，重启应用——你的专属 Banner 就上线了！