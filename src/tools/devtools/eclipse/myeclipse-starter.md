---
title: MyEclipse 使用&配置教程
category:
  - 开发工具
tag:
  - MyEclipse
---

# MyEclipse 使用&配置教程

## 目录

[[toc]]

## 基础配置

### 1. Java环境配置
**路径：** Window → Preferences → Java → Installed JREs

1. 点击右侧的 **ADD** → **Standard VM** → **Next**
2. 点击 **Directory** 选择本地JDK安装目录
3. 点击 **Finish** 完成添加
4. 勾选新添加的JRE环境 → **OK**

### 2. 编辑器背景色设置
**路径：** Window → Preferences → General → Editors → Text Editors

1. 选中 **Background color** 选项
2. 取消勾选 **System default**
3. 点击 **Color** 选择护眼的背景色（推荐淡绿色）
4. 点击 **OK** 保存

### 3. 文件编码设置
**路径：** Window → Preferences → General → Content Types

1. 展开 **Text** → 选择需要设置的文件类型
2. 将 **Default Character Set** 的值改为 **UTF-8**
3. 点击 **Update** → **Apply** → **OK**

**JSP文件编码设置：**
路径：Window → Preferences → MyEclipse → Files and Editors → JSP
将编码设置为 **UTF-8**

## 性能优化

### 1. 内存配置
编辑 MyEclipse 安装目录下的 `myeclipse.ini` 文件，修改以下参数：

```ini
-vmargs
-Xms512m              # JAVA能够分配的内存
-Xmx512m              # JAVA能够分配的最大内存
-XX:PermSize=512M      # 非堆内存初始值
-XX:MaxPermSize=512M   # 非堆内存最大值
-XX:ReservedCodeCacheSize=64m  # eclipse缓存
```

### 2. 关闭自动校验
**路径：** Window → Preferences → MyEclipse → Validation

**操作：** 除了 **Manual** 下面的复选框保持选中外，其他全部取消勾选

**手工验证方法：** 右键文件 → MyEclipse → Run Validation

### 3. 取消拼写检查
**路径：** Window → Preferences → General → Editors → Text Editors → Spelling

取消勾选 **Enable spell checking**

### 4. 关闭Maven自动更新
**路径：** Window → Preferences → MyEclipse → Maven4MyEclipse

取消勾选 **Download repository index updates on startup**

### 5. 关闭JavaScript悬停提示
**路径：** Window → Preferences → MyEclipse → Files and Editors → JavaScript → Editor → Hovers

取消勾选 **Combined Hover**

### 6. 关闭JPA项目变更事件处理器

**方法一：通过配置（推荐）**
1. 退出 MyEclipse
2. 进入 MyEclipse 安装目录
3. 创建 `disabled` 文件夹
4. 在 `disabled` 文件夹下创建 `features` 和 `plugins` 两个文件夹
5. 将 `plugins` 目录下以 `org.eclipse.jpt` 开头的jar文件移动到 `disabled/plugins` 目录
6. 将 `features` 目录下以 `org.eclipse.jpt` 开头的文件夹移动到 `disabled/features` 目录
7. 重启 MyEclipse

## 代码注释模板

### 1. 类注释模板设置
**路径：** Window → Preferences → Java → Code Style → Code Templates

1. 展开左侧 **Comments** → 选择 **Types**
2. 点击右侧 **Edit** 按钮
3. 在 Pattern 区域输入以下模板：

```java
/**
 * <p>Title: ${type_name}</p>
 * <p>Description: </p>
 * <p>Company: </p>
 * @author ${user}
 * @date ${date} ${time}
 */
```

### 2. 方法注释模板
选择 **Methods**，设置以下模板：

```java
/**
 * <p>方法描述:</p>
 * @author ${user}
 * @date ${date} ${time}
 ${tags}
 */
```

### 3. 使用注释模板
- **自动生成：** 输入 `/**` 然后按回车
- **快捷键：** Shift + Alt + J

## 插件安装

### 1. SVN插件安装

**步骤：**
1. 下载 SVN 插件（Subclipse）：http://subclipse.tigris.org/servlets/ProjectDocumentList?folderID=2240
2. 找到 MyEclipse 安装目录下的 `dropins` 文件夹
3. 在 `dropins` 文件夹中新建 `svn` 文件夹
4. 解压下载的插件包，将 `features` 和 `plugins` 文件夹复制到 `dropins/svn` 目录中
5. 重启 MyEclipse

**使用SVN：**
1. Window → Show View → Other → SVN → SVN Repositories
2. 右键 SVN Repositories 视图 → New → Repository Location
3. 输入SVN服务器地址和认证信息

### 2. Lombok插件安装

**步骤：**
1. 下载 `lombok.jar`：http://projectlombok.org
2. 将 `lombok.jar` 复制到 `myeclipse.ini` 所在文件夹
3. 编辑 `myeclipse.ini`，添加以下两行：
   ```
   -Xbootclasspath/a:lombok.jar
   -javaagent:lombok.jar
   ```
4. 重启 MyEclipse
5. 将 `lombok.jar` 加入项目的 lib 目录

## 常见问题解决

### 1. Spring Data校验报错
**路径：** Window → Preferences → Spring → Project Validators → Data Validator

取消勾选 **Invalid Derived Query**

**MyEclipse路径：** MyEclipse → Preferences → Validation → Spring → Data Validator

### 2. Spring XML校验报错
**路径：** Window → Preferences → MyEclipse → Validation → Spring

根据需要取消相应的校验选项

### 3. Web项目部署名称修改
**方法一：** 修改项目根目录下的 `.project` 文件，将 `<name>` 标签的值改为目标项目名称

**方法二：** 右键项目 → Properties → MyEclipse → Project Facets → Web，修改部署路径

### 4. 内存溢出问题
**Tomcat配置：** Window → Preferences → MyEclipse → Servers → Tomcat → Tomcat 6.x → JDK

在 **Optional Java VM arguments** 中输入：
```
-Xms256m -Xmx512m -XX:MaxNewSize=128m -XX:MaxPermSize=256m
```

## 高级配置

### 1. 自动代码提示功能增强

**步骤：**
1. Window → Preferences → Java → Editor → Content Assist
2. 找到 **Auto Activation triggers for java** 选项（默认为 `.`）
3. 将触发字符改为：`.abcdefghijklmnopqrstuvwxyz(,`
4. 设置 **Auto Activation delay** 为较小值（如50ms）

### 2. 代码高亮配置
**路径：** Window → Preferences → Java → Editor → Syntax Coloring

1. 展开 **Java** → 选择要配置的元素（如Classes、Interfaces等）
2. 勾选 **Enable** 选项
3. 选择喜欢的颜色和字体样式

### 3. 启动项优化
**路径：** Window → Preferences → General → Startup and Shutdown

取消不必要的启动项，保留以下核心项目：
- MyEclipse QuickSetup
- MyEclipse EASIE MyEclipse Tomcat 6 Server（如果使用Tomcat）
- MyEclipse File Creation Wizards

### 4. 文件关联设置
**路径：** Window → Preferences → General → Editors → File Associations

选择文件类型，设置默认编辑器为 **MyEclipse JSP/XML/HTML Editor**

## 小贴士

1. **快捷键大全：**
   - Ctrl + Shift + F：格式化代码
   - Ctrl + Shift + O：自动导入包
   - Alt + /：代码提示
   - Shift + Alt + J：添加JavaDoc注释
   - Ctrl + D：删除当前行
   - Ctrl + Alt + ↓：复制当前行到下一行

2. **定期清理：**
   - 定期清理项目：Project → Clean
   - 清理工作空间：.metadata\.plugins\org.eclipse.core.resources\.projects

3. **备份设置：**
   - File → Export → Preferences 导出配置
   - 可以在其他环境导入相同配置

## 总结

通过以上配置，可以显著提升 MyEclipse 的使用体验和开发效率。建议根据实际开发需求选择性应用这些配置，特别是性能优化部分对于提升开发体验非常重要。