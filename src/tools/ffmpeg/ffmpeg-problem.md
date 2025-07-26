---
title: FFmpeg 常见问题
category:
  - 音视频
tag:
  - FFmpeg
---

# FFmpeg 常见问题

## 1. 视频压缩与格式转换

### 常用压缩命令
```bash
# Linux下的命令
ffmpeg -i IMG_2174.MOV -vcodec libx264 -profile:v baseline -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" 2.mp4

# Windows下的命令
ffmpeg -i 1.mp4 -vcodec libx264 -profile:v baseline -vf scale=750:-1 2.mp4

# 高质量压缩
ffmpeg -i IMG_2174.MOV -vcodec libx264 -profile:v baseline -preset:v fast -level 3.1 -vf "scale=720:trunc(ow/a/2)*2" 2.mp4
```

### 编码优化策略

#### 延时最小化设置
- `lookahead 0`
- `zerolatency 1`
- `2pass 0`
- `preset fast`
- `level` 尽可能小

#### 质量最大化设置
- `bit_rate` 尽可能大
- `gop_size` 尽可能小
- `max_b_frames` 尽可能小
- `preset losslesshp`

#### 文件大小最小化设置
- `bit_rate` 尽可能小
- `gop_size` 尽可能大
- `max_b_frames` 尽可能大
- `2pass 1`

## 2. 编译配置问题

### libx264 not found 错误解决

**问题现象：**
```
ERROR: libx264 not found
fatal error: x264.h: No such file or directory
```

**解决方案：**
在configure时添加额外的include/link路径：
```bash
./configure --enable-memalign-hack --enable-ffserver --enable-network --enable-protocols --enable-muxers --disable-yasm --enable-shared --enable-w32threads --enable-libx264 --enable-gpl --extra-cflags=-I/usr/local/include --extra-ldflags=-L/usr/local/lib
```

**依赖包下载：**
x264依赖包可从以下地址获取：http://download.videolan.org/pub/videolan/x264/snapshots/

## 3. 转码延时优化

### 不同preset参数的延时对比

| 设置 | 延时范围 | 画质 | 适用场景 |
|------|----------|------|----------|
| `-preset slow` | 10.6-12.1秒 | 高 | 非实时转码 |
| 无优化参数 | 1.6-2.6秒 | 中等 | 一般应用 |
| `-preset fast` | 2.1-2.2秒 | 中等 | 平衡方案 |
| `-preset ultrafast` | 0.6-0.8秒 | 低 | 实时转码 |
| `-tune zerolatency -preset ultrafast` | 0.2-0.6秒 | 很低 | 超低延时 |

### 延时优化参数配置

**超低延时配置示例：**
```bash
ffmpeg -i rtmp://192.168.1.12/live/src -tune zerolatency -vcodec libx264 -preset ultrafast -b:v 400k -s 720x576 -r 25 -acodec libfaac -b:a 64k -f flv rtmp://192.168.1.12/live/dst
```

### 延时优化步骤
1. 关闭sync-lookahead
2. 降低rc-lookahead（别小于10，默认是-1）
3. 降低threads（比如从12降到6）
4. 禁用rc-lookahead
5. 禁用b-frames
6. 缩小GOP
7. 开启x264的 `-preset fast/faster/verfast/superfast/ultrafast` 参数
8. 使用 `-tune zerolatency` 参数

## 4. 常见应用场景总结

### 实时流媒体转码
- 优先考虑延时，使用 `ultrafast` + `zerolatency`
- 适当降低画质以换取实时性

### 视频文件压缩
- 平衡文件大小和画质
- 可以使用较慢的preset提高压缩效率

### 高质量视频制作
- 使用 `slow` 或更慢的preset
- 提高bitrate确保画质

### 批量处理
- 根据硬件性能调整threads参数
- 考虑使用硬件加速（如NVENC、QSV等）

## 5. 注意事项

1. **分辨率处理：** 使用 `scale=trunc(iw/2)*2:trunc(ih/2)*2` 确保宽高为偶数，避免编码错误
2. **兼容性：** baseline profile确保更好的设备兼容性
3. **测试环境：** 延时测试需要在相同网络环境下进行，减少网络因素影响
4. **编译依赖：** 确保x264库正确安装和配置路径