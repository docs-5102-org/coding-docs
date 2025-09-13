---
title: Java 性能工具汇总
category:
  - Java
tag:
  - JVM
---

# Java 性能工具汇总

本文汇总了Java开发中常用的性能分析和代码优化工具，帮助开发者提升应用性能、发现潜在问题并优化代码质量。

## 目录

[[toc]]

## 一、性能分析工具

### 1. NetBeans Profiler
**官网：** https://profiler.netbeans.org/

NetBeans Profiler是NetBeans IDE的模块化组件，提供全面的Java应用程序分析功能。

**主要特性：**
- 支持所有Java应用程序类型（Java SE、JavaFX、Java ME、Web应用、EJB）
- CPU性能分析
- 内存使用分析
- 线程分析
- 基本JVM监控
- 开源免费

**适用场景：** 适合需要解决内存泄漏和性能瓶颈问题的开发者

### 2. JProfiler
**官网：** http://www.ej-technologies.com/products/jprofiler/overview.html

JProfiler是功能强大的商业Java性能分析工具，集CPU、内存和线程分析于一体。

**主要特性：**
- 性能瓶颈分析
- 内存泄漏检测
- CPU负载分析
- 线程问题解决
- 支持本地分析和远程分析
- 专为Java EE和Java SE应用程序设计

**许可类型：** 商业许可

### 3. VisualVM
**官网：** http://visualvm.java.net/

VisualVM基于NetBeans平台，采用模块化架构，易于通过插件扩展。

**主要特性：**
- 详细的JVM运行信息获取
- 支持本地和远程Java应用程序监控
- 数据保存和共享功能
- CPU分析
- 内存分析
- 垃圾收集分析
- 快照功能

**许可类型：** 开源免费

### 4. GC Viewer
**官网：** http://www.tagtraum.com/gcviewer.html

GC Viewer专注于垃圾收集数据的可视化分析。

**主要特性：**
- 垃圾收集数据可视化
- 性能指标计算（吞吐量、累计暂停时间、最长暂停时间等）
- 支持通过-verbose:gc和-Xloggc:生成的数据
- 堆大小优化建议

**许可类型：** 开源免费（GitHub下载）

### 5. JRockit
**官网：** http://www.oracle.com/technetwork/middleware/jrockit/overview/

JRockit是Oracle的专有Java虚拟机解决方案。

**主要特性：**
- 高性能Java虚拟机
- JRockit任务控制工具套件
- 垃圾收集可视化
- 性能统计分析
- 运行时性能分析
- 内存问题分析
- 延迟预测功能

**许可类型：** Oracle商业产品

### 6. Eclipse Memory Analyzer
**官网：** http://www.eclipse.org/mat/

专业的Java堆内存分析工具。

**主要特性：**
- 内存泄漏发现
- 内存消耗优化
- 堆转储分析
- 内存使用反模式检测
- 大小计算和报告

**许可类型：** 开源免费

### 7. JIP (Java Interactive Profiler)
**官网：** http://jiprof.sourceforge.net/

高性能、低开销的Java分析器。

**主要特性：**
- 高性能、低开销
- 运行时开关控制
- 类和包过滤
- 输出控制
- BSD许可证

**许可类型：** BSD开源许可

### 8. Profiler4J
**官网：** http://profiler4j.sourceforge.net/

专用的CPU性能分析工具。

**主要特性：**
- 用户友好界面
- 远程分析支持
- 基于动态字节码技术
- 100%纯Java实现
- 无需本地库
- 调用图和调用树
- 内存监控
- 细粒度配置

**许可类型：** Apache V2.0

### 9. Patty Project
**官网：** http://patty.sourceforge.net/

针对Java 1.5.0及更高版本的开源分析工具。

**主要特性：**
- 运行时重点分析
- 功能动态开关
- 方法执行分析
- 代码覆盖率
- 线程争用分析
- TCP/IP数据传输
- GUI界面
- 堆分析功能

**许可类型：** 开源免费（测试阶段）

## 二、代码质量分析工具

### 1. PMD
**官网：** http://pmd.sourceforge.net/

强大的Java源代码分析工具，能够检测多种潜在问题。

**检测范围：**
- 可能的bug（空值返回、死代码等）
- 未使用的代码（局部变量、参数、私有方法）
- 不理想的代码结构
- 过于复杂的表达式
- 重复代码

**IDE集成：** JDeveloper、Eclipse、IntelliJ IDEA、NetBeans等

### 2. FindBugs
**官网：** http://findbugs.sourceforge.net/

使用静态分析方法查找Java代码漏洞的专业工具。

**主要功能：**
- 静态代码分析
- 漏洞检测
- Bug模式识别

### 3. SonarQube (SonarSource)
**官网：** http://www.sonarsource.org/

开放的代码质量管理平台。

**覆盖的质量方面：**
- 架构与设计
- 代码重复
- 单元测试
- 复杂性分析
- 潜在错误
- 编码规则
- 代码注释

## 三、代码覆盖率工具

### 1. Clover
**官网：** http://www.cenqua.com/clover/

专业的代码覆盖率测试工具。

**主要特性：**
- IDE内直接测试
- Apache Ant、Maven集成
- 快速准确的覆盖率检测
- 多种报告格式（HTML、PDF、XML、Swing GUI）
- 源代码级别过滤
- 图表支持
- 完全兼容JUnit、TestNG等测试框架

### 2. EMMA
**官网：** http://emma.sourceforge.net/

轻量级的代码覆盖率工具。

**主要特性：**
- 方法、类覆盖率支持
- 多种输出格式（文本、HTML、XML）
- 高亮显示功能
- 无需源代码访问
- 减少调试信息依赖

### 3. Cobertura
**官网：** http://cobertura.sourceforge.net/

基于jcoverage的免费Java代码覆盖率工具。

**主要功能：**
- 测试覆盖率百分比计算
- 缺少测试覆盖的部分识别
- 免费开源

## 四、架构分析工具

### 1. Macker
**官网：** http://innig.net/macker/

Java架构规则检查工具。

**主要功能：**
- 自定义架构规则
- 项目特定规则配置
- 通用代码规则说明

### 2. XRadar
**官网：** http://xradar.sourceforge.net/

开放的代码报告生成工具。

**主要功能：**
- 扩展报告生成
- HTML/SVG报告支持
- 代码大小、复杂性评估
- 代码重复性和依赖性分析

### 3. Relief
**官网：** http://www.workingfrog.org/

Java项目设计工具。

**主要功能：**
- 项目可视化
- 大小、形状、关系检测
- 简化处理过程

## 五、持续集成工具

### 1. Hudson
**官网：** http://hudson-ci.org/

Java编写的持续集成工具。

**主要特性：**
- 运行在Servlet容器中
- 支持多种SCM工具（CVS、Subversion、Git、ClearCase）
- Apache Ant、Maven项目支持
- Shell脚本和批处理命令执行

### 2. Hammurapi
**官网：** http://www.hammurapi.com/

Java代码自动检测工具。

**主要特性：**
- 282条代码规则
- 120多个Java类
- 三级代码检测
- 编码标准违规检测

## 总结

选择合适的Java性能工具需要根据具体需求：

- **性能分析：** 推荐VisualVM（免费）或JProfiler（商业）
- **内存分析：** Eclipse Memory Analyzer或JProfiler
- **代码质量：** PMD + FindBugs + SonarQube组合
- **覆盖率测试：** EMMA（轻量级）或Clover（功能丰富）
- **持续集成：** Hudson/Jenkins

建议在项目中建立完整的工具链，包含静态代码分析、动态性能监控、代码覆盖率测试和持续集成，以确保Java应用的高质量和高性能。