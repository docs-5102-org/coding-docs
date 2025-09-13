## Vercel部署`VuePress Theme Hope`

Vercel部署 `VuePress Theme Hope` 主题的项目

安装过程参考：[https://theme-hope.vuejs.press/zh/get-started/](https://theme-hope.vuejs.press/zh/get-started/)

### 部署项目
#### 添加项目

![](attachments/QQ_1757744989249.png)

#### 选择github已存在的项目

![](attachments/QQ_1757745079646.png)

#### 部署项目
需要配置一下，构建`VuePress Theme Hope` 命令，这里已经包含官方提供的默认的`.github\workflows\deploy-docs.yml`工作流

![](attachments/QQ_1757745155836.png)
#### 配置自定义域名

点击 Domains

![](attachments/QQ_1757745256310.png)
点击Add Domain，这里可以通过CF来代理当前的域名
![](attachments/QQ_1757745284574.png)