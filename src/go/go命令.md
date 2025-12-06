---
title: Go 常用命令速览
category:
  - Go
---

## Go 常用命令速览

### 1. 项目初始化
```bash
# 初始化 Go modules（在项目根目录执行）
go mod init module-name

# 初始化示例
go mod init hello
go mod init github.com/username/project
```

### 2. 编译与运行

```bash
# 运行 Go 程序
go run main.go              # 运行单个文件
go run ./...               # 运行当前目录下的所有 main 包
go run ./cmd/main.go       # 运行指定路径的 main 包

# 编译成可执行文件
go build                   # 编译当前包，生成与包名相同的可执行文件
go build -o myapp          # 编译并指定输出文件名
go build ./cmd/main.go     # 编译指定路径
go build -o myapp ./cmd/   # 编译并指定输出文件名和路径

# 编译多个平台
go build -o app.exe        # Windows 
go build -o app            # Linux/Mac

# 交叉编译（在 Windows 上编译 Linux 可执行文件）
GOOS=linux GOARCH=amd64 go build -o app
GOOS=darwin GOARCH=amd64 go build -o app  # macOS
```

### 3. 依赖管理

```bash
# 查看依赖关系
go list -m all             # 列出所有依赖模块及其版本
go list ./...              # 列出当前目录下的所有包

# 添加/更新依赖
go get github.com/user/repo           # 添加或更新包
go get github.com/user/repo@v1.2.3    # 获取指定版本
go get -u github.com/user/repo        # 升级到最新版本
go get -u ./...                       # 升级当前项目的所有依赖

# 清理依赖
go mod tidy                # 移除未使用的依赖，添加缺失的依赖
go mod vendor              # 将依赖复制到 vendor 目录
go clean -modcache         # 清除模块缓存
```

### 4. 测试

```bash
# 运行测试（详见下面的测试命令详解）
go test                    # 运行当前包的所有测试
go test -v                 # 详细输出
go test ./...              # 运行当前目录及子目录的所有测试
```

### 5. 代码检查与格式化

```bash
# 代码格式化
go fmt ./...               # 格式化当前目录及子目录的所有 Go 文件
go fmt main.go             # 格式化指定文件

# 检查代码风格和常见错误
go vet ./...               # 检查潜在的代码错误
go vet ./package_name      # 检查指定包

# 导入优化
goimports -w ./           # 自动添加/移除导入并格式化（需安装）
```

### 6. 安装与部署

```bash
# 编译并安装到 $GOPATH/bin（开发工具常用）
go install ./...           # 安装当前包到 GOBIN
go install ./cmd/myapp     # 安装指定包

# 生成文档
godoc -h                   # 查看文档服务器选项
godoc -http=:6060         # 在本地 6060 端口启动文档服务器
```

### 7. 其他常用命令

```bash
# 显示 Go 的版本和环境信息
go version                 # 显示 Go 版本
go env                     # 显示所有环境变量
go env GOPATH             # 显示 GOPATH 环境变量

# 下载源码
go get -d github.com/user/repo   # 只下载，不编译

# 生成编译信息
go build -ldflags "-s -w"        # 编译并移除调试信息（减小文件大小）

# 显示包信息
go list -json ./...        # 以 JSON 格式显示包信息

# 查看 fmt 包中的 Println 函数
go doc fmt.Println

# 查看源代码
go doc -src fmt.Println

# 如果要查看本地 hello 包中的函数
go doc hello           # 显示 hello 包的文档
```

### 8. 常用命令组合

```bash
# 完整的开发流程
go mod init myapp          # 1. 初始化项目
go get some/package        # 2. 添加依赖
go run main.go             # 3. 运行开发版本
go test -v -race ./...     # 4. 运行测试
go build -o myapp          # 5. 构建发布版本

# 快速检查与格式化
go fmt ./... && go vet ./... && go test ./...

# 完整的代码质量检查
go mod tidy && go fmt ./... && go vet ./... && go test -v -race -cover ./...
```

---

## go run vs go build

### 1. **go run main.go**

```bash
# 开发时使用
go run main.go
# 或
go run ./cmd/server
```

**特点：**
- ✅ **开发阶段**快速测试
- ✅ 无需手动编译，直接运行
- ❌ 每次都会**重新编译**（较慢）
- ❌ 不生成可执行文件
- ❌ 需要 Go 环境支持

**实际执行过程：**
```bash
go run main.go
# 等价于：
# 1. 临时编译到 /tmp/go-build-xxx/
# 2. 执行临时文件
# 3. 运行结束后删除临时文件
```

### 2. **go build 编译部署**

```bash
# 编译
go build -o bin/server.exe ./cmd/server

# 部署时直接运行
./bin/server.exe
```

**特点：**
- ✅ **生产环境**标准做法
- ✅ 只编译一次，多次运行（快速）
- ✅ 可分发给**没有 Go 环境**的服务器
- ✅ 文件体积小（静态编译）
- ✅ 启动速度快

### 对比表格

| 特性 | go run | go build + 运行 |
|------|--------|----------------|
| **编译速度** | 每次都编译（慢） | 只编译一次 |
| **运行速度** | 较慢 | 快 |
| **是否需要 Go 环境** | ✅ 必需 | ❌ 不需要 |
| **适用场景** | 开发/调试 | 生产部署 |
| **文件大小** | 无文件 | 5-20MB（单个文件） |
| **依赖管理** | 需要源代码 | 无需源代码 |

### 实际场景示例

#### 场景 1：本地开发（用 go run）
```bash
# 开发时快速测试
cd myproject
go run ./cmd/server

# 带参数运行
go run ./cmd/server -port 8080

# 代码改动后，再次运行（自动重新编译）
go run ./cmd/server
```

#### 场景 2：生产部署（用 go build）

```bash
# ===== 开发机器 =====
# 1. 编译
go build -o server.exe ./cmd/server

# 2. 打包上传到服务器
scp server.exe user@server:/opt/myapp/

# ===== 生产服务器 =====
# 3. 直接运行（无需 Go 环境！）
cd /opt/myapp
./server.exe

# 4. 配置开机自启（systemd/Windows Service）
```

#### 场景 3：Docker 部署

**方式 1：使用 go run（不推荐）**
```dockerfile
FROM golang:1.21
WORKDIR /app
COPY . .
# ❌ 镜像体积大（包含整个 Go 环境 ~800MB）
CMD ["go", "run", "./cmd/server"]
```

**方式 2：多阶段构建（推荐）**
```dockerfile
# 构建阶段
FROM golang:1.21 AS builder
WORKDIR /app
COPY . .
RUN go build -o server ./cmd/server

# 运行阶段
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/server .
# ✅ 镜像体积小（只有可执行文件 ~20MB）
CMD ["./server"]
```

### 什么时候可以用 go run 部署？

#### ✅ 可以用的场景：
1. **临时测试环境**（有 Go 环境）
2. **开发服务器**（快速迭代）
3. **CI/CD 自动化测试**

```bash
# 测试环境快速部署
git pull
go run ./cmd/server
```

#### ❌ 不应该用的场景：
1. **生产环境**（性能、安全性要求高）
2. **客户服务器**（可能没有 Go 环境）
3. **容器化部署**（镜像体积考虑）
4. **长期运行的服务**（编译开销累积）

### 性能对比

```bash
# 测试脚本
time go run ./cmd/server &  # 首次启动: ~2-5秒
sleep 1
kill $!

time ./server.exe &         # 编译后启动: ~0.1秒
sleep 1
kill $!
```

**启动时间差异：**
- `go run`: 2-5 秒（包含编译）
- 编译后运行: 0.1 秒

### 最佳实践建议

```bash
# ===== 开发阶段 =====
# 使用 go run 快速迭代
go run ./cmd/server

# 或使用热重载工具（更方便）
# 安装：go install github.com/cosmtrek/air@latest
air  # 代码改动自动重新运行

# ===== 测试/预发布 =====
# 编译后运行，模拟生产环境
go build -o bin/server ./cmd/server
./bin/server

# ===== 生产部署 =====
# 编译优化版本
go build -ldflags="-s -w" -o server ./cmd/server
# -s: 去除符号表
# -w: 去除调试信息
# 可减小 30% 文件大小
```

### 总结

| 问题 | 答案 |
|------|------|
| **一定要编译才能部署吗？** | 不一定，但**强烈推荐** |
| **go run 能部署吗？** | 能，但仅限**开发/测试环境** |
| **生产环境怎么做？** | **必须编译**后部署 |
| **为什么要编译？** | 性能、独立性、安全性 |

**简单规则：开发用 `go run`，生产用 `go build`！** 🎯

---

## Go 测试命令详解

除了基本的 `go test` 命令，Go 还提供了许多其他测试选项，可以满足不同的测试需求。

### 1. 基本测试命令

```bash
# 运行所有测试
go test

# 运行当前包的测试
go test ./...

# 运行指定包的测试
go test ./package_name
```

### 2. 常用的测试标志

1. **`-v` 详细输出**
```bash
# 显示详细的测试输出，包括每个测试函数的通过/失败情况
go test -v
```

2. **`-run` 运行特定的测试**
```bash
# 运行名称匹配特定模式的测试
go test -run TestName
go test -run "TestHello|TestWorld"  # 使用正则表达式
```

3. **`-count` 重复执行测试**
```bash
# 运行测试10次
go test -count=10
```

4. **`-timeout` 设置超时时间**
```bash
# 设置测试超时为30秒
go test -timeout 30s
```

5. **`-race` 检测数据竞争**
```bash
# 启用竞争数据检测器，用于发现并发问题
go test -race
```

### 3. 覆盖率相关命令

```bash
# 显示测试覆盖率
go test -cover

# 生成覆盖率报告文件
go test -coverprofile=coverage.out

# 查看覆盖率报告
go tool cover -html=coverage.out
```

### 4. 性能测试

```bash
# 运行基准测试
go test -bench=.

# 运行基准测试并显示详细信息
go test -bench=. -benchmem
```

### 5. 组合使用示例

```bash
# 详细输出 + 覆盖率
go test -v -cover

# 详细输出 + 竞争检测 + 超时
go test -v -race -timeout 60s

# 运行特定测试 + 详细输出 + 覆盖率
go test -run TestHello -v -cover

# 运行测试10次并检测竞争
go test -count=10 -race
```

### 6. 最佳实践

1. **开发过程中**
```bash
go test -v        # 查看详细输出
go test -race      # 检测并发问题
```

2. **提交前**
```bash
go test -v -race -cover    # 详细、安全、覆盖率检查
```

3. **持续集成/CD**
```bash
go test -v -race -coverprofile=coverage.out -timeout 60s
```

### 7. 特定情况下的命令

```bash
# 跳过所有测试
go test -run ^$

# 运行所有子测试
go test -run TestHello/

# 禁用缓存
go test -count=1

# 显示详细日志和打印语句
go test -v -run TestName -print
```

## `:=` 和 `=` 的区别

在 Go 语言中，`:=` 和 `=` 有以下主要区别：

1. **`:=` 短变量声明**
   - 用于声明并初始化新变量
   - 只能在函数内部使用
   - 自动推断变量类型
   - 至少要声明一个新变量

2. **`=` 赋值运算符**
   - 只用于给已经声明的变量赋值
   - 可以在任何地方使用
   - 不能用于声明新变量

### 示例代码：

```go
func example() {
    // 使用 := 声明并初始化
    name := "Bob"    // 正确，声明新变量并赋值
    
    // 使用 = 赋值
    var age int      // 先声明
    age = 25        // 后赋值
    
    // 错误示例
    name := "Alice"  // 错误：不能重复声明
    newName = "Alice" // 错误：使用 = 前必须先声明变量
}
```

### 测试代码中的例子：

```go
got := Hello()    // 声明 got 变量并赋值
want := "Hello, world"    // 声明 want 变量并赋值
```

这里使用 `:=` 是因为 `got` 和 `want` 都是新变量，需要声明并初始化。这是 Go 中的一种简洁写法，避免了显式声明变量类型。


## 命名返回值参数（Named Return Values）

在 Go 中，函数可以有命名的返回值参数。以下面的代码为例：

```go
func greetingPrefix(language string) (prefix string) {
    switch language {
    case french:
        prefix = frenchHelloPrefix
    case spanish:
        prefix = spanishHelloPrefix
    default:
        prefix = englishHelloPrefix
    }
    return
}
```

这种写法有以下特点和优势：

1. **命名返回值**
   - 在函数声明时，返回值就被命名为 `prefix`
   - 这个变量在函数开始时就被隐式声明了
   - 可以直接使用 `return` 而不需要指定返回值，Go 会自动返回命名的返回值

2. **代码可读性**
   - 返回值的名称能清楚地表明返回值的用途
   - 特别适合有多个返回值的函数
   - 使文档更加清晰

3. **简化错误处理**
   - 在处理错误的场景中特别有用
   - 可以在函数开始就设置返回值的默认值

4. **空返回语句**
   - 可以使用裸返回（bare return）：即直接使用 `return` 而不用指定返回值
   - 但建议只在短函数中使用，以保持代码清晰

### 对比传统写法：
```go
// 传统写法
func greetingPrefix(language string) string {
    var prefix string
    switch language {
    case french:
        prefix = frenchHelloPrefix
    case spanish:
        prefix = spanishHelloPrefix
    default:
        prefix = englishHelloPrefix
    }
    return prefix
}
```

命名返回值参数的写法让代码更加简洁，特别是在处理多个返回值的情况下。但要注意，过度使用裸返回可能会降低代码的可读性，建议在简短的函数中使用。

## Go 测试中的 `testing.T` 类型

在 Go 的测试函数中，`t *testing.T` 是一个非常重要的参数。以下面的代码为例：

```go
func TestHello(t *testing.T) {
    t.Run("to a person", func(t *testing.T) {
        got := Hello("Chris", "")
        want := "Hello, Chris"
        assertCorrectMessage(t, got, want)
    })
}

func assertCorrectMessage(t testing.TB, got, want string) {
    t.Helper()
    if got != want {
        t.Errorf("got %q want %q", got, want)
    }
}
```

`testing.T` 的主要作用和特点：

1. **测试控制**
   - 用于控制测试流程
   - 报告测试失败
   - 记录测试日志
   - 标记测试跳过等

2. **常用方法**
   - `t.Error()` / `t.Errorf()`: 报告测试失败并继续执行
   - `t.Fatal()` / `t.Fatalf()`: 报告测试失败并立即停止
   - `t.Log()` / `t.Logf()`: 记录测试日志
   - `t.Skip()` / `t.Skipf()`: 跳过当前测试
   - `t.Run()`: 运行子测试，支持测试组织和并行执行

3. **辅助函数标记**
   - `t.Helper()`: 标记一个函数是辅助函数
   - 当测试失败时，错误会报告调用辅助函数的代码行，而不是辅助函数内部的行
   - 有助于更快地定位测试失败的位置

4. **子测试特性**
   - 通过 `t.Run()` 可以组织子测试
   - 支持测试的层次结构
   - 可以单独运行特定的子测试
   - 便于测试的组织和维护

### 使用示例：
```go
func TestSomething(t *testing.T) {
    // 运行子测试
    t.Run("case 1", func(t *testing.T) {
        result := someFunction()
        if result != expected {
            t.Errorf("got %v, want %v", result, expected)
        }
    })

    // 条件跳过测试
    if !someCondition {
        t.Skip("skipping test in certain conditions")
    }

    // 立即失败
    if criticalError {
        t.Fatal("critical error occurred")
    }
}
```

### 最佳实践：
1. 使用 `t.Helper()` 标记辅助函数
2. 使用 `t.Run()` 组织相关的测试用例
3. 提供清晰的错误信息
4. 适当使用子测试来组织测试结构

[官网完整教程](https://studygolang.gitbook.io/learn-go-with-tests/go-ji-chu/hello-world)
[官网hello源码](https://github.com/quii/learn-go-with-tests/tree/master/hello-world)

