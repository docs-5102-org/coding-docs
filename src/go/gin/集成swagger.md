---
title: 集成swagger
category:
  - Gin
  - swagger
---

# 集成swagger

## 快速入门

### 1. 安装依赖

```bash
# 安装 swag CLI 工具
go install github.com/swaggo/swag/cmd/swag@latest

# 安装 Gin 和 Swagger 集成包
go get github.com/gin-gonic/gin
go get github.com/swaggo/gin-swagger
go get github.com/swaggo/files
```

### 2. 生成 Swagger 文档

```bash
swag init
```
这会在项目根目录生成一个 `docs` 文件夹，包含 `docs.go`、`swagger.json` 和 `swagger.yaml`。

### 3. 创建一个简单基于gin api 示例

```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "gin-learn/docs" // 导入自动生成的 docs 包
)

// @title Gin Learn API
// @version 1.0
// @description 这是一个学习 Gin 的 API 文档
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @basePath /
// @schemes http https

// @securityDefinitions.basic BasicAuth

func main() {
	router := gin.Default()

	// 注册 Swagger 路由
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))

	// Ping 接口
	router.GET("/ping", Ping)

	// Hello 接口
	router.GET("/hello", Hello)

	// ASCII JSON 接口
	router.GET("/someJSON2", SomeJSON2)

	// API 分组
	apiGroup := router.Group("/api")
	{
		apiGroup.GET("/hello", APIHello)
	}

	router.Run(":8080")
}

// Ping 接口
// @Summary Ping 接口
// @Description 检查服务是否正常运行
// @Tags test
// @Produce json
// @Success 200 {object} map[string]string "成功"
// @Router /ping [get]
func Ping(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "pong",
	})
}

// Hello 接口
// @Summary 获取 Hello 消息
// @Description 返回 hello world 消息
// @Tags test
// @Produce json
// @Success 200 {object} map[string]string "成功"
// @Router /hello [get]
func Hello(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "hello world",
	})
}

// SomeJSON2 接口
// @Summary ASCII JSON 接口
// @Description 将非 ASCII 字符转换为 ASCII 编码
// @Tags test
// @Produce json
// @Success 200 {object} map[string]interface{} "成功"
// @Router /someJSON2 [get]
func SomeJSON2(c *gin.Context) {
	data := map[string]interface{}{
		"lang": "GO语言",
		"tag":  "<br>",
	}
	c.AsciiJSON(http.StatusOK, data)
}

// APIHello 接口
// @Summary API Hello 接口
// @Description API 分组下的 hello 接口
// @Tags api
// @Produce json
// @Success 200 {object} map[string]string "成功"
// @Router /api/hello [get]
func APIHello(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "hello world from api",
	})
}

```

### 4. 访问文档

启动项目后，访问：
```
http://localhost:8080/swagger/index.html
```

## 常用注解说明

**文件级注解（在 main 函数前）：**
- `@title` - API 标题
- `@version` - API 版本
- `@description` - API 描述
- `@host` - 服务器地址
- `@basePath` - API 基础路径
- `@schemes` - 支持的协议

**函数级注解（在每个处理函数前）：**
- `@Summary` - 简短摘要
- `@Description` - 详细描述
- `@Tags` - 分组标签
- `@Param` - 参数说明
- `@Success` - 成功响应
- `@Failure` - 失败响应
- `@Router` - 路由和 HTTP 方法

**@Param 参数格式：**
```
@Param 名称 位置 类型 是否必需 描述
```
位置可以是：path、query、header、body、formData

```go
// @Param request body FormA false "FormA 格式请求体"
```

- `@Param` — 定义参数
- `request` — 参数名
- `body` — 参数位置（body表示在请求体中）
- `FormA` — 参数类型（会自动解析结构体字段）
- `false` — 是否必需（false=可选）
- `"FormA 格式请求体"` — 参数描述

**生成Swagger文档后，你会看到：**

- 请求体的JSON输入框
- 显示 FormA 和 FormB 两种参数格式
- 自动展示字段的类型和验证规则（如 `binding:"required"`）


## 项目结构

```
project/
├── main.go          # 主程序文件
├── go.mod
├── go.sum
└── docs/            # swag init 自动生成
    ├── docs.go
    ├── swagger.json
    └── swagger.yaml
```

这样就完成了 Go 中 Swagger 文档的集成！生成的文档会根据代码中的注解自动更新。

## 配置air热重载

**方法1：配置 air 自动运行 swag init（推荐）**

编辑 `.air.toml`：
```toml
[build]
  cmd = "go build -o ./tmp/main ."
  bin = "./tmp/main"
  full_bin = "swag init && ./tmp/main"  # 添加这行
  # ...
```

这样每次热重载时都会先执行 `swag init` 重新生成Swagger文档。

**方法2：手动运行 swag init**

每次修改接口注解后，手动在终端运行：
```bash
swag init
```

然后刷新 Swagger UI 页面（`http://localhost:8080/swagger/index.html`）。

**方法3：使用watch工具**

开两个终端：
```bash
# 终端1：运行 air 热重载
air

# 终端2：监听注解文件变化，自动 swag init
swag init -g main.go --watch
```

**推荐用方法1**，最省事，改了代码自动重新生成文档。

## 常见问题

### docs\docs.go:30:2: unknown field LeftDelim in struct literal of type "github.com/swaggo/swag".Spec docs\docs.go:31:2: unknown field RightDelim in struct literal of type "github.com/swaggo/swag".Spec

#### 核心原因

LeftDelim 和 RightDelim 字段是旧版本 swag 才有的。新版本删除了这些字段，所以自动生成的 docs/docs.go 与你的 swag 版本不匹配。

#### 方法一、去掉即可

当你执行 swag init 初始化后，删除 `LeftDelim`、`RightDelim` 这两个字段

```go
var SwaggerInfo = &swag.Spec{
	Version:          "1.0",
	Host:             "localhost:8080",
	BasePath:         "/",
	Schemes:          []string{"http", "https"},
	Title:            "Gin Learn API",
	Description:      "这是一个学习 Gin 的 API 文档",
	InfoInstanceName: "swagger",
	SwaggerTemplate:  docTemplate
}
```

#### 方法二、更新新的版本

```bash
# 1. 清理旧的 docs 文件夹
rm -rf docs

# 2. 更新依赖到最新版本
go get -u github.com/swaggo/swag/cmd/swag@latest
go get -u github.com/swaggo/gin-swagger@latest
go get -u github.com/swaggo/files@latest

# 3. 清理 go.mod 和 go.sum
go mod tidy

# 4. 重新生成文档
swag init

# 5. 重新运行项目
go run main.go hello.go
```


#### 方法三、手动指定go.mod中的 `swag` 版本 为 `v1.16.6`

```
module gin-learn

go 1.25.3

require (
	github.com/gin-gonic/gin v1.11.0
	github.com/swaggo/files v1.0.1
	github.com/swaggo/gin-swagger v1.6.1
	github.com/swaggo/swag v1.16.6
)
```

```bash
go mod tidy
```

## 参考文档

https://juejin.cn/post/7126802030944878600