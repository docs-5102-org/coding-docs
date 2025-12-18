我来详细讲解 **SIP/VoIP 接入层**的工作原理，这是一个非常有技术含量的电信级系统开发工作。
# SIP/VoIP 接入层

---

## 一、整体架构概览

```
┌─────────────┐      SIP协议      ┌──────────────┐      内部协议    ┌─────────────┐
│  运营商/PBX  │ ←──────────────→ │ SIP接入层     │ ←──────────────→ │  业务系统    │
│  (外部)     │   (UDP/TCP/TLS)   │ (你负责开发)  │                  │ (呼叫中心等) │
└─────────────┘                   └──────────────┘                  └─────────────┘
                                        │
                                        ↓
                                  ┌──────────────┐
                                  │  媒体服务器   │
                                  │  (RTP/录音)  │
                                  └──────────────┘
```

---

## 二、核心模块详解

### 1️⃣ **语音中继对接（Trunk/Gateway）**

#### 什么是语音中继？
语音中继就是连接你的系统和运营商/其他电话系统的"桥梁"，让你的应用能打电话和接电话。

#### 工作原理

```
场景：客户拨打 400-888-8888 进入你的呼叫中心

步骤流程：
┌──────────┐  ①呼入  ┌──────────┐  ②转换  ┌──────────┐  ③路由  ┌──────────┐
│ 客户手机  │ ─────→ │ 运营商    │ ─────→ │ SIP接入层 │ ─────→ │ 坐席系统  │
│ 13912345678│        │ (中继商)  │        │ (你开发)  │        │          │
└──────────┘         └──────────┘         └──────────┘         └──────────┘
```

#### 对接技术要点

**A. SIP 协议注册（Register）**

```java
/**
 * SIP 注册流程 - 向运营商注册账号
 */
public class SipTrunkRegister {
    
    public void register() {
        // 1. 构造 REGISTER 请求
        SIPRequest registerRequest = createRegisterRequest(
            "sip:trunk001@sip.carrier.com",  // 运营商分配的账号
            "password123",                    // 密码
            "your-server.com",                // 你的服务器地址
            3600                              // 注册有效期（秒）
        );
        
        // 2. 发送 REGISTER
        sendRequest(registerRequest);
        
        // 3. 处理 401 Unauthorized（需要认证）
        // 运营商返回 challenge
        
        // 4. 使用 MD5 计算认证响应
        String response = calculateMD5Response(
            username, realm, password, nonce, uri, method
        );
        
        // 5. 重新发送带认证的 REGISTER
        registerRequest.addHeader("Authorization", response);
        sendRequest(registerRequest);
        
        // 6. 收到 200 OK，注册成功
    }
}
```

**B. 呼入处理（Inbound Call）**

```java
/**
 * 处理来自运营商的呼入
 */
public class InboundCallHandler {
    
    public void handleInvite(SIPRequest invite) {
        // 1. 解析 INVITE 请求
        String callId = invite.getCallId();           // 呼叫唯一标识
        String from = invite.getFrom();               // 主叫号码: 13912345678
        String to = invite.getTo();                   // 被叫号码: 400-888-8888
        String sdp = invite.getContent();             // 媒体协商信息
        
        // 2. 号码归属判断
        if (!isMyNumber(to)) {
            sendResponse(invite, 404, "Not Found");
            return;
        }
        
        // 3. 返回 180 Ringing（振铃中）
        sendResponse(invite, 180, "Ringing");
        
        // 4. 查询路由规则（IVR、排队、转人工等）
        RoutingRule rule = routingService.getRule(to);
        
        // 5. 分配媒体资源（RTP 端口）
        MediaSession media = mediaServer.allocateSession();
        
        // 6. 构造 SDP 应答
        String answerSdp = createAnswerSdp(
            media.getIp(),          // 媒体服务器IP
            media.getRtpPort(),     // RTP 端口
            media.getCodecs()       // 支持的编码格式
        );
        
        // 7. 返回 200 OK（接听）
        SIPResponse ok = createResponse(invite, 200, "OK");
        ok.setContent(answerSdp);
        sendResponse(ok);
        
        // 8. 创建通话状态机
        CallStateMachine csm = new CallStateMachine(callId, from, to);
        csm.start();
    }
}
```

**C. 呼出处理（Outbound Call）**

```java
/**
 * 外呼场景：坐席打电话给客户
 */
public class OutboundCallHandler {
    
    public void makeCall(String agentNumber, String customerNumber) {
        // 1. 构造 INVITE 请求
        SIPRequest invite = new SIPRequest("INVITE");
        invite.setRequestURI("sip:" + customerNumber + "@carrier.com");
        invite.setFrom("sip:" + agentNumber + "@your-domain.com");
        invite.setTo("sip:" + customerNumber + "@carrier.com");
        
        // 2. 添加 SDP（媒体协商）
        String sdp = createOfferSdp(
            mediaServer.getIp(),
            mediaServer.allocateRtpPort(),
            Arrays.asList("PCMU", "PCMA", "G729")  // 支持的编码
        );
        invite.setContent(sdp);
        
        // 3. 发送到运营商
        sendRequest(invite);
        
        // 4. 等待响应
        // 100 Trying（尝试中）
        // 180 Ringing（振铃）
        // 200 OK（接通）
        
        // 5. 发送 ACK 确认
        sendAck(invite);
        
        // 6. 进入通话状态
    }
}
```

---

### 2️⃣ **通话状态机（Call State Machine）**

#### 什么是通话状态机？
管理一通电话从开始到结束的完整生命周期，包括各种状态转换。

#### 状态机设计

```java
/**
 * 通话状态枚举
 */
public enum CallState {
    IDLE,           // 空闲
    RINGING,        // 振铃中
    CONNECTED,      // 已接通
    HOLD,           // 保持中
    TRANSFERRING,   // 转接中
    CONFERENCING,   // 会议中
    DISCONNECTING,  // 挂断中
    TERMINATED      // 已结束
}

/**
 * 通话状态机实现
 */
public class CallStateMachine {
    private String callId;
    private CallState currentState;
    private LocalDateTime startTime;
    private CallSession session;
    
    // 状态转换映射
    private static final Map<CallState, List<CallState>> ALLOWED_TRANSITIONS = 
        Map.of(
            CallState.IDLE, List.of(CallState.RINGING),
            CallState.RINGING, List.of(CallState.CONNECTED, CallState.TERMINATED),
            CallState.CONNECTED, List.of(CallState.HOLD, CallState.TRANSFERRING, 
                                        CallState.DISCONNECTING),
            CallState.HOLD, List.of(CallState.CONNECTED, CallState.DISCONNECTING),
            CallState.TRANSFERRING, List.of(CallState.CONNECTED, CallState.TERMINATED),
            CallState.DISCONNECTING, List.of(CallState.TERMINATED)
        );
    
    /**
     * 状态转换
     */
    public void transition(CallState targetState, String reason) {
        // 1. 检查转换是否合法
        if (!canTransitionTo(targetState)) {
            throw new IllegalStateException(
                String.format("不能从 %s 转换到 %s", currentState, targetState)
            );
        }
        
        // 2. 记录日志
        log.info("通话 {} 状态变更: {} -> {}, 原因: {}", 
                 callId, currentState, targetState, reason);
        
        // 3. 执行状态退出动作
        onExit(currentState);
        
        // 4. 更新状态
        CallState oldState = currentState;
        currentState = targetState;
        
        // 5. 执行状态进入动作
        onEnter(targetState);
        
        // 6. 触发事件
        eventPublisher.publish(new CallStateChangedEvent(
            callId, oldState, targetState, reason
        ));
        
        // 7. 持久化
        saveToDatabase();
    }
    
    /**
     * 状态进入时的操作
     */
    private void onEnter(CallState state) {
        switch (state) {
            case RINGING:
                // 播放回铃音
                mediaServer.playRingback(callId);
                // 设置振铃超时（30秒无人接听自动挂断）
                scheduleTimeout(30000, () -> {
                    if (currentState == CallState.RINGING) {
                        hangup("无人接听");
                    }
                });
                break;
                
            case CONNECTED:
                // 记录接通时间
                startTime = LocalDateTime.now();
                // 开始录音
                if (needRecording()) {
                    recordingService.startRecording(callId);
                }
                // 开始计费
                billingService.startBilling(callId);
                break;
                
            case HOLD:
                // 播放等待音乐
                mediaServer.playMusicOnHold(callId);
                break;
                
            case TERMINATED:
                // 停止录音
                recordingService.stopRecording(callId);
                // 计算通话时长
                Duration duration = Duration.between(startTime, LocalDateTime.now());
                // 释放资源
                mediaServer.releaseSession(callId);
                // 生成 CDR（通话详单）
                generateCDR(duration);
                break;
        }
    }
    
    /**
     * 处理 SIP 消息
     */
    public void handleSipMessage(SIPMessage message) {
        if (message instanceof SIPRequest) {
            SIPRequest request = (SIPRequest) message;
            
            switch (request.getMethod()) {
                case "INVITE":
                    transition(CallState.RINGING, "收到呼入");
                    break;
                    
                case "ACK":
                    transition(CallState.CONNECTED, "对方确认接通");
                    break;
                    
                case "BYE":
                    transition(CallState.DISCONNECTING, "对方挂断");
                    transition(CallState.TERMINATED, "挂断完成");
                    break;
                    
                case "REFER":
                    // 呼叫转移请求
                    transition(CallState.TRANSFERRING, "呼叫转移");
                    break;
            }
        }
    }
}
```

#### 复杂场景：呼叫转移

```java
/**
 * 呼叫转移流程
 * 场景：客户 → 坐席A → 转接 → 坐席B
 */
public class CallTransferHandler {
    
    public void blindTransfer(String callId, String targetNumber) {
        CallStateMachine csm = getCallStateMachine(callId);
        
        // 1. 状态切换到转接中
        csm.transition(CallState.TRANSFERRING, "盲转到 " + targetNumber);
        
        // 2. 向对方发送 REFER 请求
        SIPRequest refer = new SIPRequest("REFER");
        refer.setCallId(callId);
        refer.addHeader("Refer-To", "sip:" + targetNumber + "@domain.com");
        sendRequest(refer);
        
        // 3. 等待 202 Accepted
        // 对方会发起新的 INVITE 到目标号码
        
        // 4. 监听 NOTIFY（转移结果通知）
        // NOTIFY 200 表示转移成功
        // NOTIFY 4xx/5xx 表示转移失败
        
        // 5. 转移成功后，挂断原通话
        csm.transition(CallState.TERMINATED, "转移成功");
    }
    
    public void attendedTransfer(String callId1, String callId2) {
        // 咨询转：先和目标通话，确认后再转接
        // 1. 保持原通话
        // 2. 呼叫目标号码
        // 3. 确认后合并两路通话
    }
}
```

---

### 3️⃣ **录音落盘（Call Recording）**

#### 工作原理

```
┌──────────┐      RTP 流      ┌──────────────┐
│ 主叫方    │ ────────────────→│              │
└──────────┘                  │  媒体服务器   │
                              │  (录音模块)   │
┌──────────┐      RTP 流      │              │
│ 被叫方    │ ←────────────────│              │
└──────────┘                  └──────────────┘
                                     │
                                     ↓ 混音 + 编码
                              ┌──────────────┐
                              │  WAV/MP3文件  │
                              │  存储到OSS    │
                              └──────────────┘
```

#### 录音实现

```java
/**
 * 录音服务
 */
@Service
public class RecordingService {
    
    @Autowired
    private MediaServer mediaServer;
    
    @Autowired
    private OSSService ossService;
    
    /**
     * 开始录音
     */
    public void startRecording(String callId) {
        // 1. 获取通话的 RTP 流信息
        CallSession session = sessionManager.getSession(callId);
        
        // 2. 创建录音任务
        RecordingTask task = RecordingTask.builder()
            .callId(callId)
            .callerRtp(session.getCallerRtpPort())    // 主叫 RTP 端口
            .calleeRtp(session.getCalleeRtpPort())    // 被叫 RTP 端口
            .format("WAV")                            // 录音格式
            .sampleRate(8000)                         // 采样率 8kHz
            .channels(2)                              // 双声道（分别录制）
            .startTime(LocalDateTime.now())
            .build();
        
        // 3. 启动录音线程
        RecordingThread recorder = new RecordingThread(task);
        recorder.start();
        
        // 4. 保存任务信息
        recordingTaskMap.put(callId, recorder);
        
        log.info("开始录音: {}", callId);
    }
    
    /**
     * 停止录音
     */
    public void stopRecording(String callId) {
        RecordingThread recorder = recordingTaskMap.remove(callId);
        if (recorder != null) {
            // 1. 停止录音
            recorder.stop();
            
            // 2. 等待文件写入完成
            recorder.join();
            
            // 3. 获取录音文件路径
            File recordFile = recorder.getRecordFile();
            
            // 4. 上传到 OSS
            String ossUrl = ossService.upload(
                "recordings/" + callId + ".wav",
                recordFile
            );
            
            // 5. 保存录音元数据到数据库
            Recording recording = Recording.builder()
                .callId(callId)
                .fileUrl(ossUrl)
                .duration(recorder.getDuration())
                .fileSize(recordFile.length())
                .createTime(LocalDateTime.now())
                .build();
            recordingRepository.save(recording);
            
            // 6. 删除本地临时文件
            recordFile.delete();
            
            log.info("录音完成: {}, URL: {}", callId, ossUrl);
        }
    }
}

/**
 * 录音线程
 */
public class RecordingThread extends Thread {
    private RecordingTask task;
    private volatile boolean running = true;
    private FileOutputStream fos;
    
    @Override
    public void run() {
        try {
            // 1. 创建临时文件
            File tempFile = File.createTempFile("rec_" + task.getCallId(), ".wav");
            fos = new FileOutputStream(tempFile);
            
            // 2. 写入 WAV 文件头
            writeWavHeader(fos, task.getSampleRate(), task.getChannels());
            
            // 3. 循环接收 RTP 包并写入
            while (running) {
                // 接收主叫 RTP 包
                byte[] callerData = receiveRtp(task.getCallerRtp());
                
                // 接收被叫 RTP 包
                byte[] calleeData = receiveRtp(task.getCalleeRtp());
                
                // 混音（可选：也可以分开存储双声道）
                byte[] mixedData = mixAudio(callerData, calleeData);
                
                // 写入文件
                fos.write(mixedData);
            }
            
            // 4. 更新 WAV 文件头（写入实际长度）
            updateWavHeader(tempFile);
            
        } catch (IOException e) {
            log.error("录音失败", e);
        } finally {
            IOUtils.closeQuietly(fos);
        }
    }
    
    /**
     * 混音算法
     */
    private byte[] mixAudio(byte[] audio1, byte[] audio2) {
        byte[] mixed = new byte[Math.min(audio1.length, audio2.length)];
        for (int i = 0; i < mixed.length; i += 2) {
            // 将字节转换为 short（16位音频）
            short sample1 = (short) ((audio1[i + 1] << 8) | (audio1[i] & 0xFF));
            short sample2 = (short) ((audio2[i + 1] << 8) | (audio2[i] & 0xFF));
            
            // 混音公式：A + B - (A * B) / 32768
            int result = sample1 + sample2 - (sample1 * sample2 / 32768);
            
            // 防止溢出
            result = Math.max(-32768, Math.min(32767, result));
            
            // 转回字节
            mixed[i] = (byte) (result & 0xFF);
            mixed[i + 1] = (byte) ((result >> 8) & 0xFF);
        }
        return mixed;
    }
}
```

#### 录音格式转换

```java
/**
 * 录音后处理：WAV 转 MP3
 */
public class RecordingPostProcessor {
    
    public void convertToMp3(String callId, File wavFile) {
        // 使用 FFmpeg 转换
        String command = String.format(
            "ffmpeg -i %s -codec:a libmp3lame -b:a 64k %s",
            wavFile.getAbsolutePath(),
            wavFile.getAbsolutePath().replace(".wav", ".mp3")
        );
        
        Process process = Runtime.getRuntime().exec(command);
        process.waitFor();
        
        // 上传 MP3 文件
        File mp3File = new File(wavFile.getAbsolutePath().replace(".wav", ".mp3"));
        ossService.upload("recordings/" + callId + ".mp3", mp3File);
        
        // 删除 WAV 文件
        wavFile.delete();
        mp3File.delete();
    }
}
```

---

## 三、关键技术难点

### 1. **SIP 协议栈选型**

```java
// 常用的 Java SIP 协议栈

// A. JAIN-SIP（Oracle官方，最稳定）
SipFactory sipFactory = SipFactory.getInstance();
SipStack sipStack = sipFactory.createSipStack(properties);

// B. MJSIP（开源，轻量级）
SipProvider sipProvider = new SipProvider("0.0.0.0", 5060);

// C. 自研（大厂常见，可深度定制）
自己实现 SIP 消息解析和状态机
```

### 2. **媒体处理**

```java
/**
 * RTP 处理
 */
public class RtpHandler {
    
    // RTP 包结构
    // 0                   1                   2                   3
    // 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |V=2|P|X|  CC   |M|     PT      |       sequence number         |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |                           timestamp                           |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |           synchronization source (SSRC) identifier            |
    // +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
    // |            payload  ...                                       |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    
    public RtpPacket parseRtpPacket(byte[] data) {
        RtpPacket packet = new RtpPacket();
        
        // 解析 RTP 头
        packet.setVersion((data[0] >> 6) & 0x03);        // 版本号
        packet.setPadding((data[0] >> 5) & 0x01);        // 填充位
        packet.setExtension((data[0] >> 4) & 0x01);      // 扩展位
        packet.setCsrcCount(data[0] & 0x0F);             // CSRC 数量
        
        packet.setMarker((data[1] >> 7) & 0x01);         // 标记位
        packet.setPayloadType(data[1] & 0x7F);           // 负载类型
        
        packet.setSequenceNumber(                        // 序列号
            ((data[2] & 0xFF) << 8) | (data[3] & 0xFF)
        );
        
        packet.setTimestamp(                             // 时间戳
            ((data[4] & 0xFF) << 24) | ((data[5] & 0xFF) << 16) |
            ((data[6] & 0xFF) << 8) | (data[7] & 0xFF)
        );
        
        packet.setSsrc(                                  // SSRC
            ((data[8] & 0xFF) << 24) | ((data[9] & 0xFF) << 16) |
            ((data[10] & 0xFF) << 8) | (data[11] & 0xFF)
        );
        
        // 解析负载
        int headerLength = 12 + (packet.getCsrcCount() * 4);
        byte[] payload = Arrays.copyOfRange(data, headerLength, data.length);
        packet.setPayload(payload);
        
        return packet;
    }
}
```

### 3. **并发处理**

```java
/**
 * 高并发场景优化
 */
@Configuration
public class SipServerConfig {
    
    @Bean
    public ThreadPoolExecutor sipMessageExecutor() {
        return new ThreadPoolExecutor(
            100,                        // 核心线程数
            500,                        // 最大线程数
            60L, TimeUnit.SECONDS,      // 空闲线程存活时间
            new LinkedBlockingQueue<>(10000),  // 队列大小
            new ThreadFactoryBuilder()
                .setNameFormat("sip-handler-%d")
                .build(),
            new ThreadPoolExecutor.CallerRunsPolicy()  // 拒绝策略
        );
    }
    
    @Bean
    public Reactor rtpReactor() {
        // 使用 Netty 处理 RTP（UDP）
        return new NioEventLoopGroup(
            Runtime.getRuntime().availableProcessors() * 2
        );
    }
}
```

---

## 四、数据库设计

```sql
-- 通话详单表（CDR: Call Detail Record）
CREATE TABLE call_detail_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    call_id VARCHAR(64) NOT NULL UNIQUE COMMENT '通话ID',
    caller VARCHAR(32) NOT NULL COMMENT '主叫号码',
    callee VARCHAR(32) NOT NULL COMMENT '被叫号码',
    start_time DATETIME NOT NULL COMMENT '开始时间',
    answer_time DATETIME COMMENT '接听时间',
    end_time DATETIME COMMENT '结束时间',
    duration INT COMMENT '通话时长（秒）',
    call_type TINYINT COMMENT '呼叫类型: 1-呼入 2-呼出',
    hangup_cause VARCHAR(32) COMMENT '挂断原因',
    recording_url VARCHAR(512) COMMENT '录音URL',
    trunk_id VARCHAR(32) COMMENT '中继ID',
    INDEX idx_caller (caller),
    INDEX idx_callee (callee),
    INDEX idx_start_time (start_time)
) COMMENT='通话详单表';

-- 中继配置表
CREATE TABLE trunk_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    trunk_id VARCHAR(32) NOT NULL UNIQUE,
    trunk_name VARCHAR(64) NOT NULL,
    carrier VARCHAR(64) COMMENT '运营商',
    sip_server VARCHAR(128) NOT NULL COMMENT 'SIP服务器地址',
    sip_port INT DEFAULT 5060,
    username VARCHAR(64),
    password VARCHAR(128),
    concurrent_calls INT DEFAULT 100 COMMENT '最大并发数',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-启用'
) COMMENT='中继配置表';

-- 录音元数据表
CREATE TABLE recording (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    call_id VARCHAR(64) NOT NULL,
    file_url VARCHAR(512) NOT NULL,
    file_size BIGINT COMMENT '文件大小（字节）',
    duration INT COMMENT '录音时长（秒）',
    format VARCHAR(16) COMMENT '文件格式: WAV/MP3',
    create_time DATETIME NOT NULL,
    INDEX idx_call_id (call_id)
) COMMENT='录音元数据表';
```

---

## 五、监控指标

```java
/**
 * 关键监控指标
 */
@Component
public class SipMetrics {
    
    @Autowired
    private MeterRegistry meterRegistry;
    
    public void recordMetrics() {
        // 1. 并发通话数
        Gauge.builder("sip.concurrent.calls", this::getCurrentCalls)
            .register(meterRegistry);
        
        // 2. 呼叫接通率
        Counter.builder("sip.call.success")
            .register(meterRegistry);
        Counter.builder("sip.call.failed")
            .register(meterRegistry);
        
        // 3. 平均通话时长
        Timer.builder("sip.call.duration")
            .register(meterRegistry);
        
        // 4. RTP 丢包率
        Gauge.builder("rtp.packet.loss.rate", this::getPacketLossRate)
            .register(meterRegistry);
        
        // 5. 中继健康度
        Gauge.builder("trunk.health.score", this::getTrunkHealthScore)
            .register(meterRegistry);
    }
}
```

---

## 六、面试要点总结

当面试官问这个项目时，你可以这样回答：

**1. 技术栈**：
- SIP 协议栈（JAIN-SIP / 自研）
- RTP/RTCP 媒体流处理
- Netty 处理高并发 UDP
- FFmpeg 音频编解码
- OSS 存储录音文件

**2. 核心难点**：
- SIP 协议的复杂性（NAT穿透、重传、状态机）
- 实时音频流处理（RTP 丢包、乱序、延迟）
- 高并发场景（万级并发通话）
- 录音同步和存储优化

**3. 业务价值**：
- 支撑公司呼叫中心系统
- 每天处理 X 万通电话
- 录音合规存储 X 年
- 接通率达到 99.X%

这个项目涉及**电信协议**、**实时音视频**、**高并发处理**，技术深度很高！