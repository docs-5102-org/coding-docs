---
title: Go 项目 中 Cmd目录规范
category:
  - Go
---

# Go 项目 中 Cmd目录规范

Go 项目中的 `cmd` 目录是一个**约定俗成的目录结构**,用于存放项目的**可执行程序入口点**。让我详细解释一下:

## 主要作用

`cmd` 目录用于存放应用程序的 `main` 包,也就是程序的入口点。每个子目录通常代表一个独立的可执行程序。

## 目录结构示例

```
myproject/
├── cmd/
│   ├── server/          # Web 服务器程序
│   │   └── main.go
│   ├── cli/             # 命令行工具
│   │   └── main.go
│   └── worker/          # 后台任务处理程序
│       └── main.go
├── internal/            # 内部私有代码
├── pkg/                 # 可被外部使用的库代码
└── go.mod
```

## 为什么需要 cmd 目录?

**1. 多可执行文件支持**
- 一个项目可能需要多个可执行程序(服务端、客户端、管理工具等)
- 每个子目录对应一个独立的二进制文件

**2. 清晰的项目结构**
- 将程序入口与业务逻辑分离
- `main.go` 只负责初始化和启动,核心逻辑放在其他包中
- 便于代码复用和测试

**3. 编译约定**
- 执行 `go build ./cmd/server` 会生成 `server` 可执行文件
- 执行 `go build ./cmd/cli` 会生成 `cli` 可执行文件

## 实际使用示例

```go
// cmd/server/main.go
package main

import (
    "myproject/internal/api"
    "myproject/internal/database"
)

func main() {
    // 初始化数据库
    db := database.Init()
    
    // 启动 API 服务器
    api.Start(db)
}
```

```go
// cmd/cli/main.go
package main

import (
    "myproject/internal/commands"
)

func main() {
    // 执行命令行工具逻辑
    commands.Execute()
}
```

## 设计原则

**瘦 main 原则**: `cmd` 目录下的 `main.go` 应该尽可能简单,只做:
- 解析配置和命令行参数
- 初始化依赖
- 调用其他包的功能
- 处理程序退出

真正的业务逻辑应该放在 `internal` 或 `pkg` 目录中,这样便于测试和复用。

## 总结

`cmd` 目录是 Go 项目标准布局的一部分,它让项目结构更加清晰,特别适合需要构建多个可执行程序的项目。这种组织方式已经被 Go 社区广泛采用,包括许多知名的开源项目如 Kubernetes、Docker 等都使用这种结构。