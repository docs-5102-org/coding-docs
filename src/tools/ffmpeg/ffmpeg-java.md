---
title: FFmpeg Java 实战示例
category:
  - 音视频
tag:
  - FFmpeg
---

# FFmpeg Java 实战示例

## 概述

本文介绍如何在Java应用中集成FFmpeg进行视频处理，包括视频格式转换和视频缩略图生成。通过Java调用FFmpeg命令行工具，实现高效的音视频处理功能。

## 环境准备

### 1. FFmpeg安装
- **Windows**: 下载FFmpeg可执行文件，解压到指定目录（如：`D:/ffmpeg/bin/ffmpeg.exe`）
- **Linux/Mac**: 通过包管理器安装或编译安装

### 2. Java依赖
```xml
<dependencies>
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-lang3</artifactId>
        <version>3.12.0</version>
    </dependency>
    <dependency>
        <groupId>log4j</groupId>
        <artifactId>log4j</artifactId>
        <version>1.2.17</version>
    </dependency>
</dependencies>
```

## 核心实现

### 1. 视频格式转换工具类

```java
package com.example.video.util;

import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * 视频格式转换工具类
 * 支持多种视频格式转换为MP4格式
 */
public class VideoConvertUtil implements Runnable {
    private static final Logger logger = Logger.getLogger(VideoConvertUtil.class);
    
    // FFmpeg可执行文件路径，需根据实际安装路径修改
    public static final String FFMPEG_PATH = "D:/ffmpeg/bin/ffmpeg.exe";
    
    private final String videoPath;
    private final String videoFileName;
    
    public VideoConvertUtil(String videoPath, String videoFileName) {
        this.videoPath = videoPath;
        this.videoFileName = videoFileName;
    }
    
    @Override
    public void run() {
        convertToMp4(videoPath, videoFileName);
    }
    
    /**
     * 视频格式转换为MP4
     * 
     * @param inputPath 输入视频文件路径
     * @param fileName  文件名
     * @return 转换后的视频URL
     */
    public static String convertToMp4(String inputPath, String fileName) {
        if (StringUtils.isEmpty(inputPath)) {
            logger.error("输入路径不能为空");
            return null;
        }
        
        File inputFile = new File(inputPath);
        if (!inputFile.exists()) {
            logger.error("视频文件不存在: " + inputPath);
            return null;
        }
        
        try {
            // 生成输出文件路径
            String outputPath = inputPath.substring(0, inputPath.lastIndexOf(".")) + ".mp4";
            String outputFileName = fileName.substring(0, fileName.lastIndexOf(".")) + ".mp4";
            
            // 检查视频格式
            VideoFormat format = checkVideoFormat(inputPath);
            logger.info("原视频路径: " + inputPath);
            logger.info("转换后路径: " + outputPath);
            
            if (format == VideoFormat.NEED_CONVERT) {
                boolean success = executeConversion(inputPath, outputPath);
                if (success) {
                    // 构建访问URL（根据实际部署情况调整）
                    String videoUrl = "http://your-server.com/videos/" + outputFileName;
                    logger.info("视频转换完成: " + videoUrl);
                    return videoUrl;
                }
            } else if (format == VideoFormat.MP4) {
                logger.info("视频已是MP4格式，无需转换");
                return "http://your-server.com/videos/" + fileName;
            }
            
        } catch (Exception e) {
            logger.error("视频转换异常", e);
        }
        
        return null;
    }
    
    /**
     * 执行FFmpeg转换命令
     */
    private static boolean executeConversion(String inputPath, String outputPath) {
        List<String> commands = buildConversionCommand(inputPath, outputPath);
        
        try {
            ProcessBuilder builder = new ProcessBuilder(commands);
            Process process = builder.start();
            
            // 处理输出流，防止进程阻塞
            handleProcessStreams(process);
            
            int exitCode = process.waitFor();
            return exitCode == 0;
            
        } catch (Exception e) {
            logger.error("FFmpeg执行异常", e);
            return false;
        }
    }
    
    /**
     * 构建FFmpeg转换命令
     */
    private static List<String> buildConversionCommand(String inputPath, String outputPath) {
        List<String> commands = new ArrayList<>();
        commands.add(FFMPEG_PATH);
        commands.add("-i");              // 输入文件
        commands.add(inputPath);
        commands.add("-vcodec");         // 视频编码器
        commands.add("libx264");
        commands.add("-preset");         // 编码预设
        commands.add("ultrafast");
        commands.add("-profile:v");      // H.264配置文件
        commands.add("baseline");
        commands.add("-acodec");         // 音频编码器
        commands.add("aac");
        commands.add("-strict");
        commands.add("experimental");
        commands.add("-qscale");         // 视频质量
        commands.add("6");
        commands.add("-ab");             // 音频比特率
        commands.add("128k");
        commands.add("-y");              // 覆盖输出文件
        commands.add(outputPath);
        
        return commands;
    }
    
    /**
     * 处理进程输入输出流
     */
    private static void handleProcessStreams(Process process) {
        new Thread(() -> {
            try (InputStream errorStream = process.getErrorStream();
                 InputStream inputStream = process.getInputStream()) {
                
                byte[] buffer = new byte[1024];
                int bytesRead;
                
                // 读取错误流
                while ((bytesRead = errorStream.read(buffer)) != -1) {
                    logger.debug("FFmpeg错误输出: " + new String(buffer, 0, bytesRead));
                }
                
                // 读取标准输出流
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    logger.debug("FFmpeg输出: " + new String(buffer, 0, bytesRead));
                }
                
            } catch (IOException e) {
                logger.error("处理进程流异常", e);
            }
        }).start();
    }
    
    /**
     * 检查视频格式
     */
    private static VideoFormat checkVideoFormat(String filePath) {
        String extension = filePath.substring(filePath.lastIndexOf(".") + 1).toLowerCase();
        
        // 支持的格式列表
        String[] supportedFormats = {"avi", "mpg", "wmv", "3gp", "mov", "asf", "asx", "flv"};
        String[] unsupportedFormats = {"wmv9", "rm", "rmvb"};
        
        if ("mp4".equals(extension)) {
            return VideoFormat.MP4;
        }
        
        for (String format : supportedFormats) {
            if (format.equals(extension)) {
                return VideoFormat.NEED_CONVERT;
            }
        }
        
        for (String format : unsupportedFormats) {
            if (format.equals(extension)) {
                return VideoFormat.UNSUPPORTED;
            }
        }
        
        return VideoFormat.UNKNOWN;
    }
    
    /**
     * 视频格式枚举
     */
    private enum VideoFormat {
        MP4,           // 已是MP4格式
        NEED_CONVERT,  // 需要转换
        UNSUPPORTED,   // 不支持的格式
        UNKNOWN        // 未知格式
    }
}
```

### 2. 视频缩略图生成工具类

```java
package com.example.video.util;

import org.apache.log4j.Logger;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * 视频缩略图生成工具类
 */
public class VideoThumbnailUtil {
    private static final Logger logger = Logger.getLogger(VideoThumbnailUtil.class);
    public static final String FFMPEG_PATH = "D:/ffmpeg/bin/ffmpeg.exe";
    
    /**
     * 生成视频缩略图
     * 
     * @param videoPath 视频文件路径
     * @param outputDir 输出目录
     * @param timeOffset 截取时间点（秒）
     * @return 缩略图URL
     */
    public static String generateThumbnail(String videoPath, String outputDir, int timeOffset) {
        File videoFile = new File(videoPath);
        if (!videoFile.exists()) {
            logger.error("视频文件不存在: " + videoPath);
            return null;
        }
        
        try {
            // 生成唯一的图片文件名
            long timestamp = new Date().getTime();
            String imageName = "thumbnail_" + timestamp + ".jpg";
            String imagePath = outputDir + File.separator + imageName;
            
            // 确保输出目录存在
            new File(outputDir).mkdirs();
            
            List<String> commands = buildThumbnailCommand(videoPath, imagePath, timeOffset);
            
            ProcessBuilder builder = new ProcessBuilder(commands);
            Process process = builder.start();
            
            // 处理进程输出
            handleProcessStreams(process);
            
            int exitCode = process.waitFor();
            if (exitCode == 0) {
                String thumbnailUrl = "http://your-server.com/images/" + imageName;
                logger.info("缩略图生成成功: " + thumbnailUrl);
                return thumbnailUrl;
            } else {
                logger.error("缩略图生成失败，退出码: " + exitCode);
            }
            
        } catch (Exception e) {
            logger.error("生成缩略图异常", e);
        }
        
        return null;
    }
    
    /**
     * 构建缩略图生成命令
     */
    private static List<String> buildThumbnailCommand(String videoPath, String imagePath, int timeOffset) {
        List<String> commands = new ArrayList<>();
        commands.add(FFMPEG_PATH);
        commands.add("-i");
        commands.add(videoPath);
        commands.add("-y");              // 覆盖输出文件
        commands.add("-f");              // 输出格式
        commands.add("image2");
        commands.add("-ss");             // 截取时间点
        commands.add(String.valueOf(timeOffset));
        commands.add("-vframes");        // 只截取一帧
        commands.add("1");
        commands.add("-s");              // 输出尺寸
        commands.add("640x480");
        commands.add(imagePath);
        
        return commands;
    }
    
    /**
     * 处理进程流
     */
    private static void handleProcessStreams(Process process) {
        new Thread(() -> {
            try (InputStream errorStream = process.getErrorStream();
                 InputStream inputStream = process.getInputStream()) {
                
                byte[] buffer = new byte[1024];
                int bytesRead;
                
                while ((bytesRead = errorStream.read(buffer)) != -1) {
                    logger.debug("FFmpeg错误输出: " + new String(buffer, 0, bytesRead));
                }
                
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    logger.debug("FFmpeg输出: " + new String(buffer, 0, bytesRead));
                }
                
            } catch (IOException e) {
                logger.error("处理进程流异常", e);
            }
        }).start();
    }
}
```

### 3. 视频上传处理服务

```java
package com.example.video.service;

import com.example.video.util.VideoConvertUtil;
import com.example.video.util.VideoThumbnailUtil;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * 视频处理服务类
 */
@Service
public class VideoProcessingService {
    
    private static final String UPLOAD_DIR = "/app/uploads/videos/";
    private static final String THUMBNAIL_DIR = "/app/uploads/thumbnails/";
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    
    /**
     * 处理视频上传
     * 
     * @param file 上传的视频文件
     * @return 处理结果
     */
    public VideoProcessResult processVideoUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return VideoProcessResult.error("文件不能为空");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            return VideoProcessResult.error("文件大小超出限制");
        }
        
        try {
            // 保存原始文件
            String originalFileName = file.getOriginalFilename();
            String fileExtension = getFileExtension(originalFileName);
            String uniqueFileName = UUID.randomUUID().toString() + "." + fileExtension;
            String filePath = UPLOAD_DIR + uniqueFileName;
            
            // 确保目录存在
            new File(UPLOAD_DIR).mkdirs();
            new File(THUMBNAIL_DIR).mkdirs();
            
            // 保存文件
            file.transferTo(new File(filePath));
            
            // 异步处理视频转换和缩略图生成
            CompletableFuture<String> conversionFuture = CompletableFuture.supplyAsync(() -> 
                VideoConvertUtil.convertToMp4(filePath, uniqueFileName)
            );
            
            CompletableFuture<String> thumbnailFuture = CompletableFuture.supplyAsync(() -> 
                VideoThumbnailUtil.generateThumbnail(filePath, THUMBNAIL_DIR, 5)
            );
            
            // 立即返回结果，转换在后台进行
            VideoProcessResult result = VideoProcessResult.success();
            result.setOriginalUrl("http://your-server.com/videos/" + uniqueFileName);
            result.setProcessing(true);
            
            // 设置完成回调
            CompletableFuture.allOf(conversionFuture, thumbnailFuture)
                .thenRun(() -> {
                    String convertedUrl = conversionFuture.join();
                    String thumbnailUrl = thumbnailFuture.join();
                    
                    // 这里可以通过WebSocket或其他方式通知前端处理完成
                    notifyProcessingComplete(uniqueFileName, convertedUrl, thumbnailUrl);
                });
            
            return result;
            
        } catch (IOException e) {
            return VideoProcessResult.error("文件保存失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String fileName) {
        if (StringUtils.isEmpty(fileName)) {
            return "";
        }
        int lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : "";
    }
    
    /**
     * 通知处理完成（示例实现）
     */
    private void notifyProcessingComplete(String fileName, String convertedUrl, String thumbnailUrl) {
        // 实际应用中可以通过WebSocket、消息队列等方式通知前端
        System.out.println("视频处理完成:");
        System.out.println("文件: " + fileName);
        System.out.println("转换后URL: " + convertedUrl);
        System.out.println("缩略图URL: " + thumbnailUrl);
    }
    
    /**
     * 视频处理结果类
     */
    public static class VideoProcessResult {
        private boolean success;
        private String message;
        private String originalUrl;
        private String convertedUrl;
        private String thumbnailUrl;
        private boolean processing;
        
        public static VideoProcessResult success() {
            VideoProcessResult result = new VideoProcessResult();
            result.setSuccess(true);
            return result;
        }
        
        public static VideoProcessResult error(String message) {
            VideoProcessResult result = new VideoProcessResult();
            result.setSuccess(false);
            result.setMessage(message);
            return result;
        }
        
        // Getters and Setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public String getOriginalUrl() { return originalUrl; }
        public void setOriginalUrl(String originalUrl) { this.originalUrl = originalUrl; }
        
        public String getConvertedUrl() { return convertedUrl; }
        public void setConvertedUrl(String convertedUrl) { this.convertedUrl = convertedUrl; }
        
        public String getThumbnailUrl() { return thumbnailUrl; }
        public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
        
        public boolean isProcessing() { return processing; }
        public void setProcessing(boolean processing) { this.processing = processing; }
    }
}
```

## 使用示例

### 1. Spring Boot Controller

```java
@RestController
@RequestMapping("/api/video")
public class VideoController {
    
    @Autowired
    private VideoProcessingService videoProcessingService;
    
    @PostMapping("/upload")
    public ResponseEntity<VideoProcessingService.VideoProcessResult> uploadVideo(
            @RequestParam("file") MultipartFile file) {
        
        VideoProcessingService.VideoProcessResult result = 
            videoProcessingService.processVideoUpload(file);
        
        return ResponseEntity.ok(result);
    }
}
```

### 2. 测试用例

```java
public class VideoUtilTest {
    
    @Test
    public void testVideoConversion() {
        String inputPath = "/path/to/input/video.avi";
        String fileName = "test_video.avi";
        
        String result = VideoConvertUtil.convertToMp4(inputPath, fileName);
        System.out.println("转换结果: " + result);
    }
    
    @Test
    public void testThumbnailGeneration() {
        String videoPath = "/path/to/video.mp4";
        String outputDir = "/path/to/thumbnails";
        
        String thumbnailUrl = VideoThumbnailUtil.generateThumbnail(videoPath, outputDir, 10);
        System.out.println("缩略图URL: " + thumbnailUrl);
    }
}
```

## 配置建议

### 1. FFmpeg参数优化

根据不同场景调整FFmpeg参数：

- **快速转换**: `-preset ultrafast`
- **高质量**: `-preset slow -crf 18`
- **小文件**: `-preset medium -crf 28`

### 2. 异步处理

视频转换是CPU密集型操作，建议：

- 使用异步处理避免阻塞用户请求
- 配置合适的线程池大小
- 实现进度反馈机制

### 3. 错误处理

- 检查FFmpeg安装和路径配置
- 处理不支持的视频格式
- 实现转换失败重试机制
- 监控磁盘空间和系统资源

### 4. 性能优化

- 使用SSD存储提升I/O性能
- 根据服务器配置调整并发数
- 定期清理临时文件
- 考虑使用GPU加速

## 总结

通过Java集成FFmpeg可以实现强大的音视频处理功能。本示例展示了视频格式转换和缩略图生成的完整实现，包括错误处理、异步处理和配置优化等最佳实践。在实际应用中，还需要根据具体业务需求调整参数和架构设计。