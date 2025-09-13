---
title: Java调用Shell脚本完整指南
category:
  - java
tag:
  - ProcessBuilder
  - Runtime.exec()  
---

# Java调用Shell脚本完整指南

## 概述

在Java开发中，经常需要调用系统Shell脚本来完成一些特定任务，如文件处理、数据抓取、打包等操作。Java提供了两种主要方式来执行Shell命令：`ProcessBuilder`和`Runtime.exec()`。本文将详细介绍这两种方法的使用及其区别。

## ProcessBuilder vs Runtime.exec() 对比

### 版本差异
- **ProcessBuilder**: Java 1.5引入，功能更完善
- **Runtime.exec()**: Java 1.0就存在，到Java 1.5已有6个重载方法

### ProcessBuilder、Runtime、和Process 三者之间的联系
`ProcessBuilder.start()` 和 `Runtime.exec()` 都用于创建操作系统进程（执行命令行操作），并返回`Process`子类的实例，该实例可用来控制进程状态并获得相关信息。

## 方法一：ProcessBuilder（推荐）

ProcessBuilder提供了更灵活的参数设置和环境配置。

### 基本用法

```java
ProcessBuilder pb = new ProcessBuilder("./" + SHELL_FILE, param1, param2, param3);
pb.directory(new File(SHELL_FILE_DIR));
int runningStatus = 0;

try {
    Process p = pb.start();
    runningStatus = p.waitFor();
} catch (InterruptedException | IOException e) {
    e.printStackTrace();
}

if (runningStatus != 0) {
    System.err.println("Shell执行失败");
}
```

### 完整示例

```java
import java.io.*;
import java.util.Map;

public class ProcessBuilderExample {
    public static void executeShell() throws IOException, InterruptedException {
        // ProcessBuilder示例
        ProcessBuilder pb = new ProcessBuilder("java", "-jar", "Test.jar");
        pb.directory(new File("F:\\dist"));
        
        // 获取并修改环境变量
        Map<String, String> env = pb.environment();
        env.put("CUSTOM_VAR", "custom_value");
        
        Process process = pb.start();
        
        // 读取输出
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        }
        
        // 等待执行完成
        int exitCode = process.waitFor();
        System.out.println("Exit code: " + exitCode);
    }
}
```

## 方法二：Runtime.exec()

这是一种更直接但不够灵活的方式。

### 基本用法

```java
Process p = Runtime.getRuntime().exec(SHELL_FILE_DIR + SHELL_FILE + " " + param1 + " " + param2 + " " + param3);
p.waitFor();
```

### 完整示例

```java
import java.io.*;

public static void executeWithRuntime() throws IOException, InterruptedException {
    String cmd = "c:\\test\\test.bat";
    try {
        Process p = Runtime.getRuntime().exec(cmd);
        
        // 读取输出流
        try (InputStream fis = p.getInputStream();
             InputStreamReader isr = new InputStreamReader(fis);
             BufferedReader br = new BufferedReader(isr)) {
            
            String line;
            while ((line = br.readLine()) != null) {
                System.out.println(line);
            }
        }
        
        int exitCode = p.waitFor();
        System.out.println("命令执行完成，退出码: " + exitCode);
        
    } catch (IOException | InterruptedException e) {
        e.printStackTrace();
        throw e; // 重新抛出异常
    }
}
```

## 常见问题及解决方案

### 1. 权限问题

当脚本没有执行权限时，需要先授权：

```java
ProcessBuilder builder = new ProcessBuilder("/bin/chmod", "755", tempFile.getPath());
Process process = builder.start();
int rc = process.waitFor();
if (rc != 0) {
    System.err.println("权限设置失败");
}
```

### 2. 进程挂起问题

**问题原因**: Shell脚本有输出时，缓冲区满了会导致进程挂起。

**解决方案**: 必须读取输出流和错误流（注意：需要在不同线程中读取，避免死锁）：

```java
ProcessBuilder pb = new ProcessBuilder("./" + SHELL_FILE, param1, param2, param3);
pb.directory(new File(SHELL_FILE_DIR));

try {
    Process p = pb.start();
    
    // 创建线程读取标准输出
    Thread stdoutThread = new Thread(() -> {
        try (BufferedReader stdInput = new BufferedReader(
                new InputStreamReader(p.getInputStream()))) {
            String s;
            while ((s = stdInput.readLine()) != null) {
                System.out.println("STDOUT: " + s);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    });
    
    // 创建线程读取错误输出
    Thread stderrThread = new Thread(() -> {
        try (BufferedReader stdError = new BufferedReader(
                new InputStreamReader(p.getErrorStream()))) {
            String s;
            while ((s = stdError.readLine()) != null) {
                System.err.println("STDERR: " + s);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    });
    
    stdoutThread.start();
    stderrThread.start();
    
    int runningStatus = p.waitFor();
    
    // 等待读取线程完成
    stdoutThread.join();
    stderrThread.join();
    
} catch (IOException | InterruptedException e) {
    e.printStackTrace();
}
```

### 3. 命令找不到问题

**问题现象**: 手动执行正常，Java调用时报"命令不存在"。

**原因**: Java调用Shell时使用的环境变量PATH可能与手动执行时不同，特别是在系统服务或不同用户权限下运行时。

**解决方案**: 
1. 创建软链接到系统PATH中的目录：

```bash
# 为自定义命令创建软链接到/usr/local/bin目录（推荐）
sudo ln -s /home/admin/casperjs/bin/casperjs /usr/local/bin/casperjs
sudo ln -s /home/admin/node/bin/node /usr/local/bin/node
sudo ln -s /home/admin/phantomjs/bin/phantomjs /usr/local/bin/phantomjs
```

2. 或者在Java代码中设置环境变量：

```java
ProcessBuilder pb = new ProcessBuilder("casperjs", "script.js");
Map<String, String> env = pb.environment();
String path = env.get("PATH");
env.put("PATH", path + ":/home/admin/casperjs/bin:/home/admin/node/bin");
```

### 4. 打包路径问题

使用tar命令时要注意路径问题：

```bash
# 错误写法
tar -zcf /home/admin/data/result.tar.gz /home/admin/data/result

# 正确写法
tar -zcf /home/admin/data/result.tar.gz -C /home/admin/data/ result
```

### 5. JAR包中的Shell脚本

如果Shell脚本在JAR包中，需要先解压到临时文件：

```java
import java.util.jar.*;
import java.nio.file.Files;
import org.apache.commons.io.IOUtils; // 需要引入commons-io依赖

public void extractAndExecuteShell() throws IOException, InterruptedException {
    String jarPath = findClassJarPath(this.getClass());
    try (JarFile jarFile = new JarFile(jarPath)) {
        Enumeration<JarEntry> entries = jarFile.entries();
        
        while (entries.hasMoreElements()) {
            JarEntry entry = entries.nextElement();
            if (!entry.isDirectory() && entry.getName().endsWith(".sh")) {
                // 创建临时文件
                File tempFile = File.createTempFile("script", ".sh");
                tempFile.deleteOnExit();
                
                // 复制脚本内容到临时文件
                try (FileOutputStream fos = new FileOutputStream(tempFile);
                     InputStream is = jarFile.getInputStream(entry)) {
                    IOUtils.copy(is, fos);
                }
                
                // 设置执行权限
                ProcessBuilder chmod = new ProcessBuilder("chmod", "+x", tempFile.getAbsolutePath());
                Process chmodProcess = chmod.start();
                int chmodResult = chmodProcess.waitFor();
                if (chmodResult != 0) {
                    throw new IOException("设置脚本执行权限失败");
                }
                
                // 执行脚本
                ProcessBuilder pb = new ProcessBuilder(tempFile.getAbsolutePath());
                Process p = pb.start();
                
                // 处理输出...
                int exitCode = p.waitFor();
                System.out.println("脚本执行完成，退出码: " + exitCode);
            }
        }
    }
}

// 辅助方法：获取当前类所在JAR文件路径
private String findClassJarPath(Class<?> clazz) {
    return clazz.getProtectionDomain().getCodeSource().getLocation().getPath();
}
```

## 最佳实践

1. **优先使用ProcessBuilder**: 功能更强大，参数设置更方便，支持环境变量配置
2. **必须处理输出流**: 使用单独线程读取stdout和stderr，避免进程挂起
3. **检查退出码**: 通过`Process.waitFor()`获取执行结果，0表示成功
4. **合理设置工作目录**: 使用`ProcessBuilder.directory()`设置脚本执行目录
5. **环境变量配置**: 通过`ProcessBuilder.environment()`设置必要的环境变量
6. **异常处理**: 妥善处理`IOException`和`InterruptedException`
7. **资源管理**: 使用try-with-resources确保流和文件的正确关闭
8. **超时控制**: 对于可能长时间运行的脚本，使用`Process.waitFor(long timeout, TimeUnit unit)`设置超时

## 注意事项

- 不要在主线程中同步读取输出流，可能导致死锁
- 对于需要交互的命令，考虑使用`ProcessBuilder.redirectInput()`
- 大量数据输出时，必须异步处理输出流
- 安全考虑：验证用户输入，避免命令注入攻击
- 跨平台兼容性：Windows和Linux的命令语法可能不同
- 长时间运行的进程应设置超时机制，避免程序无限等待

通过以上方法和注意事项，可以在Java中安全、高效地调用Shell脚本，实现Java程序与系统命令的良好交互。