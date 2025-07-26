---
title: Solr 安装和启动完整指南
category:
  - 中间件
tag:
  - Solr
---

# Solr 安装和启动完整指南

## 1. Solr 下载和安装

### 1.1 下载 Solr
- 访问 Apache 官网：http://lucene.apache.org/solr/
- 下载二进制版本（**注意：不要下载源码版本，源码版本需要编译**）
- 或使用命令行下载：
  ```bash
  # Linux/Mac 下载示例
  wget https://archive.apache.org/dist/lucene/solr/8.11.2/solr-8.11.2.tgz
  tar -xzf solr-8.11.2.tgz
  cd solr-8.11.2
  ```

### 1.2 目录结构说明

<img :src="$withBase('/assets/images/solr/solr2.png')" 
  alt=""
  height="auto">

解压后的 Solr 目录结构如下：

```
solr-x.x.x/
├── bin/           # Solr 启动脚本和工具
├── dist/          # Solr 核心 JAR 包
├── example/       # 示例配置和演示
├── server/        # 服务器相关文件
├── contrib/       # 扩展模块
├── docs/          # 文档
└── licenses/      # 许可证文件
```

- **bin**: Solr 基本启动项和管理工具
- **dist**: Solr 基本 JAR 包存放位置
- **example**: Solr 演示示例，包含 WAR 包、自带服务器和 SolrHome 配置文件

## 2. Solr 启动方式

### 2.1 使用自带 Jetty 服务器启动（推荐）

Solr 自带 Jetty 服务器，启动非常简单，默认访问端口为 8983。

#### Windows 启动：
```cmd
# 进入 bin 目录
cd C:\path\to\solr-x.x.x\bin

# 启动 Solr
solr.cmd start

# 指定端口启动
solr.cmd start -p 8984

# 后台启动
solr.cmd start -d
```

#### Linux/Mac 启动：
```bash
# 进入 bin 目录
cd /path/to/solr-x.x.x/bin

# 启动 Solr
./solr start

# 指定端口启动
./solr start -p 8984

# 后台启动
./solr start -d
```

#### 验证启动
启动成功后，访问：`http://localhost:8983/solr` 或 `http://服务器IP:8983/solr`

<img :src="$withBase('/assets/images/solr/solr1.png')" 
  alt=""
  height="auto">

### 2.2 使用 Tomcat 启动方式

如果需要在 Tomcat 环境中运行 Solr，按以下步骤操作：

#### 步骤 1：部署 WAR 包
```bash
# 将 solr.war 复制到 Tomcat 的 webapps 目录
cp example/webapps/solr.war /path/to/tomcat/webapps/
```

#### 步骤 2：启动 Tomcat
启动 Tomcat 服务器，会自动解压 solr.war 包

#### 步骤 3：创建 SolrHome 目录
```bash
# 复制示例配置作为 SolrHome
cp -r example/solr /path/to/solrhome
```

#### 步骤 4：配置 SolrHome 路径
编辑 `tomcat/webapps/solr/WEB-INF/web.xml` 文件，找到以下配置并修改：

```xml
<env-entry>
    <env-entry-name>solr/home</env-entry-name>
    <env-entry-value>/path/to/solrhome</env-entry-value>
    <env-entry-type>java.lang.String</env-entry-type>
</env-entry>
```

#### 步骤 5：重启 Tomcat
重启 Tomcat 服务器即可访问 Solr

## 3. Solr 管理命令

### 3.1 启动相关命令
```bash
# 启动 Solr
bin/solr start

# 指定端口启动
bin/solr start -p 8984

# 指定 JVM 内存启动
bin/solr start -m 2g

# 前台启动（便于调试）
bin/solr start -f

# 后台启动
bin/solr start -d
```

### 3.2 停止 Solr
```bash
# 停止 Solr
bin/solr stop

# 停止指定端口的 Solr
bin/solr stop -p 8983

# 强制停止所有 Solr 实例
bin/solr stop -all
```

### 3.3 查看状态
```bash
# 查看 Solr 运行状态
bin/solr status

# 查看版本信息
bin/solr version
```

## 4. 创建和管理 Core

### 4.1 创建 Core
```bash
# 创建一个新的 Core
bin/solr create -c mycore

# 创建 Core 并指定配置
bin/solr create -c mycore -d basic_configs
```

### 4.2 删除 Core
```bash
# 删除 Core
bin/solr delete -c mycore
```

## 5. 常见问题和解决方案

### 5.1 端口被占用
```bash
# 查看端口占用情况
netstat -tlnp | grep 8983

# 使用其他端口启动
bin/solr start -p 8984
```

### 5.2 内存不足
```bash
# 增加 JVM 内存
bin/solr start -m 4g
```

### 5.3 权限问题（Linux）
```bash
# 给予执行权限
chmod +x bin/solr

# 切换到非 root 用户启动
```

## 6. 生产环境部署建议

### 6.1 系统要求
- Java 8 或更高版本
- 至少 2GB 内存（推荐 4GB+）
- 足够的磁盘空间存储索引

### 6.2 性能优化
```bash
# 启动时设置合适的 JVM 参数
bin/solr start -m 4g -Xms4g -Xmx4g -XX:+UseConcMarkSweepGC
```

### 6.3 安全配置
- 配置防火墙只允许必要端口访问
- 启用 SSL/TLS
- 配置身份验证和授权

## 7. 验证安装

安装完成后，通过以下方式验证：

1. **Web 界面验证**：访问 `http://localhost:8983/solr`
2. **API 验证**：
   ```bash
   curl "http://localhost:8983/solr/admin/info/system"
   ```
3. **创建测试 Core**：
   ```bash
   bin/solr create -c test
   ```

成功后即可开始使用 Solr 进行全文搜索和数据索引操作。