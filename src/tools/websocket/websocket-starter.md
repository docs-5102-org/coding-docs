---
title: WebSocket入门教程
category:
  - 网络协议与通信
tag:
  - WebSocket
---

# WebSocket入门教程

## 目录
1. [什么是WebSocket](#什么是websocket)
2. [WebSocket vs HTTP](#websocket-vs-http)
3. [WebSocket协议基础](#websocket协议基础)
4. [创建WebSocket连接](#创建websocket连接)
5. [WebSocket事件处理](#websocket事件处理)
6. [发送和接收数据](#发送和接收数据)
7. [错误处理和重连机制](#错误处理和重连机制)
8. [实战示例：聊天应用](#实战示例聊天应用)
9. [服务端实现](#服务端实现)
10. [最佳实践](#最佳实践)
11. [官方文档和第三方资源](#官方文档和第三方资源)

## 什么是WebSocket

WebSocket是一种在单个TCP连接上进行全双工通信的协议。它使得客户端和服务器之间的数据交换变得更加简单，允许服务端主动向客户端推送数据。在WebSocket API中，浏览器和服务器只需要完成一次握手，两者之间就直接可以创建持久性的连接，并进行双向数据传输。

![](https://javascript.info/article/websocket/websocket-handshake.svg)

### 主要特点：
- **全双工通信**：客户端和服务器可以同时发送数据
- **低延迟**：没有HTTP请求的开销
- **实时性**：支持实时数据推送
- **跨域支持**：可以跨域通信
- **协议切换**：从HTTP协议升级到WebSocket协议

## WebSocket vs HTTP

| 特性 | HTTP | WebSocket |
|------|------|-----------|
| 通信方式 | 请求-响应模式 | 全双工通信 |
| 连接 | 短连接（HTTP/1.1可保持连接） | 长连接 |
| 头部开销 | 每次请求都有较大头部 | 握手后头部很小 |
| 实时性 | 需要轮询 | 真正实时 |
| 服务器推送 | 不支持（需要长轮询等技术） | 原生支持 |

## WebSocket协议基础

WebSocket使用特殊的URL方案：
- `ws://` - 未加密的WebSocket连接
- `wss://` - 加密的WebSocket连接（类似HTTPS）

### 握手过程
1. 客户端发送HTTP升级请求
2. 服务器返回101状态码确认升级
3. 连接升级为WebSocket协议
4. 开始全双工通信

## 创建WebSocket连接

### 基本语法
```javascript
// 创建WebSocket连接
const socket = new WebSocket('ws://localhost:8080');

// 或者使用加密连接
const secureSocket = new WebSocket('wss://example.com/socket');
```

### 带协议的连接
```javascript
// 指定子协议
const socket = new WebSocket('ws://localhost:8080', 'chat');

// 多个协议选项
const socket = new WebSocket('ws://localhost:8080', ['chat', 'echo']);
```

## WebSocket事件处理

WebSocket对象有四个主要事件：

### 1. onopen - 连接建立
```javascript
socket.onopen = function(event) {
    console.log('WebSocket连接已建立');
    console.log('协议：', socket.protocol);
};

// 或使用addEventListener
socket.addEventListener('open', function(event) {
    console.log('连接已打开');
});
```

### 2. onmessage - 接收消息
```javascript
socket.onmessage = function(event) {
    console.log('收到消息：', event.data);
    
    // 处理不同类型的数据
    if (typeof event.data === 'string') {
        // 文本消息
        console.log('文本消息：', event.data);
    } else if (event.data instanceof Blob) {
        // 二进制数据（Blob）
        console.log('收到Blob数据');
    } else if (event.data instanceof ArrayBuffer) {
        // 二进制数据（ArrayBuffer）
        console.log('收到ArrayBuffer数据');
    }
};
```

### 3. onerror - 连接错误
```javascript
socket.onerror = function(error) {
    console.error('WebSocket错误：', error);
};
```

### 4. onclose - 连接关闭
```javascript
socket.onclose = function(event) {
    console.log('连接已关闭');
    console.log('关闭代码：', event.code);
    console.log('关闭原因：', event.reason);
    console.log('是否正常关闭：', event.wasClean);
};
```

## 发送和接收数据

### 发送文本数据
```javascript
// 检查连接状态
if (socket.readyState === WebSocket.OPEN) {
    socket.send('Hello WebSocket!');
    
    // 发送JSON数据
    const data = { type: 'message', content: 'Hello' };
    socket.send(JSON.stringify(data));
}
```

### 发送二进制数据
```javascript
// 发送ArrayBuffer
const buffer = new ArrayBuffer(8);
socket.send(buffer);

// 发送Blob
const blob = new Blob(['Hello'], { type: 'text/plain' });
socket.send(blob);
```

### 连接状态检查
```javascript
switch (socket.readyState) {
    case WebSocket.CONNECTING:
        console.log('正在连接...');
        break;
    case WebSocket.OPEN:
        console.log('连接已打开');
        break;
    case WebSocket.CLOSING:
        console.log('连接正在关闭...');
        break;
    case WebSocket.CLOSED:
        console.log('连接已关闭');
        break;
}
```

## 错误处理和重连机制

### 基本重连逻辑
```javascript
class WebSocketManager {
    constructor(url, protocols) {
        this.url = url;
        this.protocols = protocols;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 1000;
        this.connect();
    }
    
    connect() {
        try {
            this.socket = new WebSocket(this.url, this.protocols);
            this.setupEventListeners();
        } catch (error) {
            console.error('连接失败：', error);
            this.reconnect();
        }
    }
    
    setupEventListeners() {
        this.socket.onopen = (event) => {
            console.log('WebSocket连接成功');
            this.reconnectAttempts = 0; // 重置重连次数
        };
        
        this.socket.onmessage = (event) => {
            this.handleMessage(event.data);
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket错误：', error);
        };
        
        this.socket.onclose = (event) => {
            console.log('连接关闭，代码：', event.code);
            if (!event.wasClean) {
                this.reconnect();
            }
        };
    }
    
    reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`尝试重连 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectInterval * this.reconnectAttempts);
        } else {
            console.error('达到最大重连次数，停止重连');
        }
    }
    
    send(data) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(data);
        } else {
            console.warn('连接未就绪，消息未发送：', data);
        }
    }
    
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            console.log('收到消息：', message);
        } catch (error) {
            console.log('收到文本消息：', data);
        }
    }
    
    close() {
        if (this.socket) {
            this.socket.close(1000, '正常关闭');
        }
    }
}
```

## 实战示例：聊天应用

### 客户端实现
```javascript
class ChatClient {
    constructor(serverUrl, username) {
        this.serverUrl = serverUrl;
        this.username = username;
        this.messages = [];
        this.wsManager = new WebSocketManager(serverUrl);
        this.setupMessageHandler();
    }
    
    setupMessageHandler() {
        this.wsManager.handleMessage = (data) => {
            try {
                const message = JSON.parse(data);
                this.handleIncomingMessage(message);
            } catch (error) {
                console.error('消息解析错误：', error);
            }
        };
    }
    
    handleIncomingMessage(message) {
        switch (message.type) {
            case 'chat':
                this.displayMessage(message);
                break;
            case 'userJoined':
                this.displaySystemMessage(`${message.username} 加入了聊天`);
                break;
            case 'userLeft':
                this.displaySystemMessage(`${message.username} 离开了聊天`);
                break;
            case 'error':
                this.displayError(message.error);
                break;
        }
    }
    
    sendMessage(text) {
        const message = {
            type: 'chat',
            username: this.username,
            text: text,
            timestamp: new Date().toISOString()
        };
        
        this.wsManager.send(JSON.stringify(message));
    }
    
    displayMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.innerHTML = `
            <span class="username">${message.username}:</span>
            <span class="text">${message.text}</span>
            <span class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>
        `;
        
        document.getElementById('messages').appendChild(messageElement);
        this.scrollToBottom();
    }
    
    displaySystemMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'system-message';
        messageElement.textContent = text;
        
        document.getElementById('messages').appendChild(messageElement);
        this.scrollToBottom();
    }
    
    displayError(error) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = `错误: ${error}`;
        
        document.getElementById('messages').appendChild(errorElement);
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        const messagesContainer = document.getElementById('messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// 使用示例
const chat = new ChatClient('ws://localhost:8080', 'User123');

// 发送消息
document.getElementById('sendButton').addEventListener('click', () => {
    const input = document.getElementById('messageInput');
    if (input.value.trim()) {
        chat.sendMessage(input.value);
        input.value = '';
    }
});
```

### HTML结构
```html
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket聊天室</title>
    <style>
        #messages {
            height: 300px;
            overflow-y: auto;
            border: 1px solid #ccc;
            padding: 10px;
            margin-bottom: 10px;
        }
        .message {
            margin-bottom: 5px;
        }
        .username {
            font-weight: bold;
            color: #007bff;
        }
        .timestamp {
            font-size: 0.8em;
            color: #666;
            margin-left: 10px;
        }
        .system-message {
            color: #28a745;
            font-style: italic;
        }
        .error-message {
            color: #dc3545;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div id="messages"></div>
    <input type="text" id="messageInput" placeholder="输入消息..." style="width: 300px;">
    <button id="sendButton">发送</button>
</body>
</html>
```

## 服务端实现

### Node.js + ws库示例
```javascript
const WebSocket = require('ws');
const http = require('http');

// 创建HTTP服务器
const server = http.createServer();

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

// 存储连接的客户端
const clients = new Map();

wss.on('connection', (ws, request) => {
    console.log('新客户端连接');
    
    // 为每个连接分配ID
    const clientId = generateClientId();
    clients.set(clientId, {
        ws: ws,
        username: null
    });
    
    // 处理消息
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            handleMessage(clientId, message);
        } catch (error) {
            console.error('消息解析错误：', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: '消息格式错误'
            }));
        }
    });
    
    // 处理连接关闭
    ws.on('close', () => {
        const client = clients.get(clientId);
        if (client && client.username) {
            broadcast({
                type: 'userLeft',
                username: client.username
            }, clientId);
        }
        clients.delete(clientId);
        console.log('客户端断开连接');
    });
    
    // 处理错误
    ws.on('error', (error) => {
        console.error('WebSocket错误：', error);
    });
});

function handleMessage(clientId, message) {
    const client = clients.get(clientId);
    
    switch (message.type) {
        case 'chat':
            if (!client.username) {
                client.username = message.username;
                broadcast({
                    type: 'userJoined',
                    username: message.username
                }, clientId);
            }
            
            // 广播聊天消息
            broadcast({
                type: 'chat',
                username: message.username,
                text: message.text,
                timestamp: message.timestamp
            });
            break;
    }
}

function broadcast(message, excludeClientId = null) {
    const messageString = JSON.stringify(message);
    
    clients.forEach((client, clientId) => {
        if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(messageString);
        }
    });
}

function generateClientId() {
    return Math.random().toString(36).substring(2, 15);
}

// 启动服务器
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`WebSocket服务器运行在端口 ${PORT}`);
});
```

## 最佳实践

### 1. 连接管理
- 实现自动重连机制
- 使用心跳检测保持连接活跃
- 正确处理连接状态

### 2. 数据传输
- 使用JSON格式进行结构化数据传输
- 对大数据进行分片传输
- 实现消息确认机制

### 3. 错误处理
- 捕获并处理所有可能的错误
- 提供用户友好的错误信息
- 记录详细的错误日志

### 4. 性能优化
- 避免发送过于频繁的消息
- 使用二进制格式传输大量数据
- 实现消息队列机制

### 5. 安全考虑
- 使用wss://加密连接
- 验证消息来源和格式
- 实现适当的身份认证

## 官方文档和第三方资源

### 官方文档
1. **MDN WebSocket API文档**
   - [WebSocket API概述](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
   - [编写WebSocket客户端应用](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)  
   - [编写WebSocket服务器](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers)
   - [WebSocket构造函数](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket)

2. **W3C WebSocket规范**
   - [The WebSocket API (W3C)](https://www.w3.org/TR/websockets/)

3. **IETF RFC 6455**
   - [WebSocket Protocol规范](https://tools.ietf.org/html/rfc6455)

4. **tutorialspoint**
   - [tutorialspoint WebSocket](https://www.tutorialspoint.com/websockets/websockets_send_receive_messages.htm)
  


### 教程资源
1. **JavaScript.info WebSocket教程**
   - [WebSocket详细教程](https://javascript.info/websocket) - 提供了全面的WebSocket基础知识

### 优质第三方库和工具

#### JavaScript/Node.js
1. **ws** - Node.js WebSocket库
   - [GitHub: websockets/ws](https://github.com/websockets/ws)
   - 功能完整、性能优秀的WebSocket实现

2. **Socket.IO** - 实时通信库  
   - [官网](https://socket.io/)
   - 支持WebSocket和降级方案

#### Python
1. **websockets** - Python异步WebSocket库
   - [GitHub: python-websockets/websockets](https://github.com/python-websockets/websockets)

2. **websocket-client** - Python WebSocket客户端
   - [GitHub: websocket-client/websocket-client](https://github.com/websocket-client/websocket-client)

#### Go
1. **Gorilla WebSocket** - Go WebSocket实现
   - [GitHub: gorilla/websocket](https://github.com/gorilla/websocket)

### 工具和资源汇总
1. **Awesome WebSocket资源列表**
   - [GitHub: facundofarias/awesome-websockets](https://github.com/facundofarias/awesome-websockets)
   - 包含各种WebSocket库、工具和资源的精选列表

2. **WebSocket测试工具**
   - **claws** - 命令行WebSocket客户端测试工具
   - **websocat** - 类似netcat的WebSocket命令行工具

### 在线学习资源
1. **实时应用示例**
   - 在线聊天室
   - 实时游戏
   - 股票行情推送
   - 协作编辑器

2. **调试工具**
   - Chrome DevTools WebSocket调试
   - Postman WebSocket支持
   - WebSocket King等在线测试工具

通过这些官方文档和第三方资源，你可以深入学习WebSocket的各个方面，从基础概念到高级应用都能找到相应的材料和工具支持。