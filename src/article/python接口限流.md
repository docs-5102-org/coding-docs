---
title: Python FastAPI 接口限流完全指南
category:
  - python
tag:
  - 接口限流
---

# Python FastAPI 接口限流完全指南

## 一、为什么需要接口限流

接口限流是保护服务器和应用程序的重要安全措施。如果没有实施接口限流，可能会面临以下风险：

- **服务器负载不平衡**：突发大量请求导致服务器资源分配不均
- **暴力破解攻击**：恶意用户尝试暴力破解密码或API密钥
- **恶意请求**：大量无效或恶意请求消耗系统资源
- **额外费用**：过多请求导致云服务成本增加
- **拒绝服务攻击（DoS/DDoS）**：恶意流量导致正常用户无法访问服务

## 二、常见限流算法

### 2.1 固定窗口计数器

**原理**：在固定时间窗口内限制请求次数，例如每小时最多10次请求。

**优点**：
- 实现简单
- 内存占用小

**缺点**：
- 存在流量突增问题，实际请求量可能达到限制的2倍
- 例如：8:50-9:00发送10个请求，9:00-9:10再发送10个请求，虽然都符合限制，但在8:50-9:10这20分钟内实际处理了20个请求

### 2.2 滑动窗口计数器

**原理**：将时间窗口细分为多个小区间，统计滑动时间窗口内的请求总数。

**优点**：
- 解决了固定窗口的流量突增问题
- 限流更加平滑准确

**缺点**：
- 时间区间划分越精细，所需存储空间越大
- 实现相对复杂

### 2.3 漏桶算法（Leaky Bucket）

**原理**：请求像水一样注入漏桶，服务器以固定速率从桶中取出请求处理。桶满后的请求被拒绝或排队。

**优点**：
- 请求处理速率恒定
- 能够平滑流量

**缺点**：
- 无法处理突发流量
- 即使服务器空闲，请求也需要排队等待

### 2.4 令牌桶算法（Token Bucket）

**原理**：令牌以固定速率生成并存入桶中，桶满则丢弃多余令牌。请求到达时需要获取令牌才能执行，令牌不足则拒绝请求。

**优点**：
- 既能平均分配请求速率
- 又能应对合理的突发流量
- 灵活性高

**推荐指数**：⭐⭐⭐⭐⭐

## 三、IP地址限流的注意事项

使用IP地址进行限流时需要考虑以下问题：

1. **集中存储需求**：在集群环境下，IP地址信息需要集中存储（如Redis），确保所有服务器节点共享限流状态

2. **误伤风险**：可能误伤正常用户请求，例如：
   - 企业局域网共享同一个出口IP
   - 公共WiFi环境下多个用户共享IP
   - NAT网络环境

**建议**：结合用户认证信息（如API Key、User ID）进行更精准的限流。

## 四、FastAPI 限流实现方案

### 4.1 slowapi（推荐⭐⭐⭐⭐⭐）

基于 flask-limiter 改写，是目前社区支持最好的方案。

**特点**：
- 计数器默认保存在内存中
- 支持装饰器方式限流
- GitHub星标数量最多

**安装**：
```bash
pip install slowapi
```

**基础用法**：

```python
from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# 初始化限流器
limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 方式1：装饰器限流
@app.get("/home")
@limiter.limit("5/minute")  # 每分钟最多5次请求
async def homepage(request: Request):
    return PlainTextResponse("success")

# 方式2：多个速率限制
@app.get("/api")
@limiter.limit("10/minute")
@limiter.limit("100/hour")  # 同时限制分钟和小时
async def api_endpoint(request: Request):
    return {"status": "ok"}
```

**高级配置**：

```python
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware

# 使用Redis存储（推荐生产环境）
from slowapi.extension import RedisBackend
from redis import Redis

redis_client = Redis(host='localhost', port=6379, db=0)
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=f"redis://{redis_client.connection_pool.connection_kwargs['host']}:{redis_client.connection_pool.connection_kwargs['port']}"
)

# 全局应用中间件
app.add_middleware(SlowAPIMiddleware)

# 自定义key函数（基于用户ID限流）
def get_user_id(request: Request):
    return request.headers.get("X-User-ID", get_remote_address(request))

@app.get("/user-api")
@limiter.limit("20/minute", key_func=get_user_id)
async def user_api(request: Request):
    return {"data": "user specific data"}
```

### 4.2 fastapi-limiter

需要Redis支持，适合分布式环境。

**安装**：
```bash
pip install fastapi-limiter aioredis
```

**基础用法**：

```python
import aioredis
import uvicorn
from fastapi import Depends, FastAPI
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

app = FastAPI()

@app.on_event("startup")
async def startup():
    # 连接Redis
    redis = await aioredis.create_redis_pool("redis://localhost:6379")
    await FastAPILimiter.init(redis)

@app.on_event("shutdown")
async def shutdown():
    await FastAPILimiter.close()

# 使用依赖注入方式限流
@app.get("/", dependencies=[Depends(RateLimiter(times=2, seconds=5))])
async def index():
    return {"msg": "Hello World"}

# 动态限流
@app.get("/dynamic")
async def dynamic_limit(
    response: Response = Depends(RateLimiter(times=5, seconds=60))
):
    return {"msg": "Limited endpoint"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
```

**自定义回调函数**：

```python
from fastapi_limiter.depends import RateLimiter

async def custom_callback(request: Request, response: Response, pexpire: int):
    """
    限流触发时的自定义回调
    :param pexpire: 距离下次可以请求的毫秒数
    """
    expire = pexpire / 1000
    raise HTTPException(
        status_code=429,
        detail=f"Too many requests. Retry after {expire:.0f} seconds"
    )

@app.get("/custom")
async def custom_endpoint(
    response: Response = Depends(
        RateLimiter(times=3, seconds=10, callback=custom_callback)
    )
):
    return {"status": "ok"}
```

### 4.3 asgi-ratelimit

支持更复杂的限流规则和阻止时间设置。

**安装**：
```bash
pip install asgi-ratelimit
```

**基础用法**：

```python
from fastapi import FastAPI
from asgi_ratelimit import RateLimitMiddleware, Rule
from asgi_ratelimit.backends import RedisBackend

app = FastAPI()

# 添加限流中间件
app.add_middleware(
    RateLimitMiddleware,
    authenticate=lambda request: request.headers.get("X-API-Key"),  # 认证函数
    backend=RedisBackend(),  # 使用Redis后端
    config={
        r"^/api/user": [Rule(second=5, block_time=60)],  # 5秒内超限则阻止60秒
        r"^/api/admin": [Rule(minute=10, block_time=300)],  # 每分钟10次
        r"^/public": [Rule(hour=100)],  # 每小时100次
    },
)

@app.get("/api/user")
async def user_endpoint():
    return {"message": "User API"}

@app.get("/api/admin")
async def admin_endpoint():
    return {"message": "Admin API"}
```

**高级配置**：

```python
from asgi_ratelimit import Rule
from asgi_ratelimit.backends import MemoryBackend

# 内存后端（适合单机测试）
app.add_middleware(
    RateLimitMiddleware,
    backend=MemoryBackend(),
    config={
        r"^/api/.*": [
            Rule(second=1, group="api"),  # 每秒1次
            Rule(minute=20, group="api"),  # 每分钟20次
            Rule(hour=500, group="api", block_time=3600),  # 每小时500次，超限阻止1小时
        ],
    },
)
```

## 五、方案对比与选择建议

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **slowapi** | • 使用简单<br>• 社区活跃<br>• 支持内存和Redis<br>• 装饰器语法优雅 | • 功能相对基础 | • 中小型项目<br>• 快速开发<br>• 单机或小集群 |
| **fastapi-limiter** | • 依赖注入方式<br>• 支持自定义回调<br>• 原生支持Redis | • 必须使用Redis<br>• 配置稍复杂 | • 分布式系统<br>• 需要精确限流<br>• 生产环境 |
| **asgi-ratelimit** | • 支持复杂规则<br>• 可设置阻止时间<br>• 中间件方式全局管理 | • 学习曲线较陡<br>• 文档较少 | • 复杂限流需求<br>• 需要阻止机制<br>• 大型应用 |

### 推荐选择

- **首选：slowapi** - GitHub星标最多，社区支持最好，适合大多数场景
- **次选：fastapi-limiter** - 如果已有Redis基础设施，且需要更精细的控制
- **特殊需求：asgi-ratelimit** - 需要复杂限流规则和阻止机制时使用

## 六、最佳实践

### 6.1 生产环境配置建议

```python
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

# 使用Redis存储（生产环境必备）
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379",
    strategy="moving-window",  # 使用滑动窗口算法
    headers_enabled=True,  # 在响应头中显示限流信息
)

app = FastAPI()
app.state.limiter = limiter

# 自定义错误响应
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "error": "Too Many Requests",
            "message": "Rate limit exceeded. Please try again later.",
            "retry_after": exc.detail
        },
        headers={"Retry-After": str(exc.detail)}
    )

# 不同端点不同限制
@app.get("/api/public")
@limiter.limit("100/hour")
async def public_api(request: Request):
    return {"data": "public"}

@app.post("/api/login")
@limiter.limit("5/minute")  # 登录接口严格限制
async def login(request: Request):
    return {"status": "ok"}

@app.get("/api/data")
@limiter.limit("1000/hour;50/minute")  # 多重限制
async def get_data(request: Request):
    return {"data": "sensitive"}
```

### 6.2 结合用户认证的限流

```python
from fastapi import Header, HTTPException

def get_api_key(request: Request):
    """基于API Key的限流"""
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        return get_remote_address(request)
    return f"api_key:{api_key}"

@app.get("/api/premium")
@limiter.limit("1000/hour", key_func=get_api_key)
async def premium_api(request: Request):
    return {"tier": "premium"}
```

### 6.3 监控和日志

```python
import logging

logger = logging.getLogger(__name__)

@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    logger.warning(
        f"Rate limit exceeded for {request.client.host} on {request.url.path}"
    )
    return JSONResponse(
        status_code=429,
        content={"error": "Rate limit exceeded"}
    )
```

## 七、总结

接口限流是保护API服务的重要手段。对于FastAPI项目：

1. **快速开发**：选择 slowapi，简单易用
2. **生产环境**：使用 Redis 作为存储后端
3. **限流算法**：推荐滑动窗口或令牌桶算法
4. **组合策略**：结合IP和用户认证进行多维度限流
5. **监控告警**：记录限流事件，及时发现异常流量

通过合理的限流策略，可以有效保护服务器资源，提升系统稳定性和安全性。