---
title: JWT 应用教程
category:
  - JWT
---

# JWT 应用教程

## 目录

[[toc]]

## 简介

JWT（JSON Web Token）是一种开放标准（RFC 7519），它定义了一种紧凑的、自包含的方式，用于作为 JSON 对象在各方之间安全地传输信息。这些信息可以被验证和信任，因为它是数字签名的。

## 官方资源

- **官方网站**: https://jwt.io/
- **RFC 7519 标准**: https://tools.ietf.org/html/rfc7519
- **官方文档**: https://jwt.io/introduction
- **在线调试工具**: https://jwt.io/#debugger-io

## JWT 结构

JWT 由三部分组成，用点（.）分隔：

```
Header.Payload.Signature
```

### Header（头部）
包含令牌的类型和使用的签名算法：
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload（载荷）
包含声明（claims），即关于实体和其他数据的声明：
```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022
}
```

### Signature（签名）
用于验证消息在传递过程中没有被更改，并且在使用私钥签名的令牌的情况下，它还可以验证 JWT 的发送者就是它所说的那个人。

## Java 实现

### 依赖引入

在 Maven 项目中添加以下依赖：

```xml
<dependencies>
    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt</artifactId>
        <version>0.9.1</version>
    </dependency>
    
    <!-- FastJSON -->
    <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>fastjson</artifactId>
        <version>1.2.83</version>
    </dependency>
    
    <!-- Apache Commons Codec -->
    <dependency>
        <groupId>commons-codec</groupId>
        <artifactId>commons-codec</artifactId>
        <version>1.15</version>
    </dependency>
</dependencies>
```

### Java 工具类实现

```java
package com.drunkr.api.config.jwt.utils;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.apache.commons.codec.binary.Base64;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Date;
import java.util.LinkedHashMap;

public class JwtUtils {

    /** jwt签发者 */
    private static final String JWT_ID = "*DpD9Ks@Qk7EEbY2";

    /** 签名算法 */
    static SignatureAlgorithm signatureAlgorithm = SignatureAlgorithm.HS256;

    /** 48位密匙 */
    private static final String JWT_SECRET = "858195902636309645765324632792538273443688242023";

    /**
     * 由字符串生成加密key
     *
     * @return SecretKey
     */
    public static SecretKey generalKey() {
        String stringKey = JWT_SECRET;
        byte[] encodedKey = Base64.decodeBase64(stringKey);
        SecretKey key = new SecretKeySpec(encodedKey, 0, encodedKey.length, signatureAlgorithm.getJcaName());
        return key;
    }

    /**
     * 创建jwt
     * @param id JWT ID
     * @param subject 主体信息
     * @param ttlMillis 过期的时间长度（毫秒）
     * @return JWT字符串
     * @throws Exception 异常
     */
    public static String createJWT(String id, String subject, long ttlMillis) throws Exception {
        long nowMillis = System.currentTimeMillis();
        Date now = new Date(nowMillis);
        SecretKey key = generalKey();
        
        JwtBuilder builder = Jwts.builder()
                .setHeaderParam("type", "JWT")
                .setId(id)                    // 设置jti(JWT ID)
                .setIssuedAt(now)            // iat: jwt的签发时间
                .setSubject(subject)         // sub(Subject)：代表这个JWT的主体
                .signWith(key, signatureAlgorithm);
                
        if (ttlMillis >= 0) {
            long expMillis = nowMillis + ttlMillis;
            Date exp = new Date(expMillis);
            builder.setExpiration(exp);        // 设置过期时间
        }
        return builder.compact();
    }

    /**
     * 解析jwt
     * @param jwt JWT字符串
     * @return Claims
     */
    public static Claims parseJWT(String jwt) {
        SecretKey key = generalKey();
        jwt = jwt.replace("Bearer ", "");
        return Jwts.parser().setSigningKey(key).parseClaimsJws(jwt).getBody();
    }

    /**
     * 生成subject信息
     * @param user 用户对象
     * @return JSON字符串
     */
    public static String generalSubject(Object user) {
        return JSON.toJSONString(user);
    }

    /**
     * 验证JWT是否有效
     * @param jwt JWT字符串
     * @return 是否有效
     */
    public static boolean validateJWT(String jwt) {
        try {
            Claims claims = parseJWT(jwt);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
```

### 使用示例

```java
public class JwtExample {
    public static void main(String[] args) throws Exception {
        // 创建用户信息
        JSONObject userInfo = new JSONObject();
        userInfo.put("id", 1);
        userInfo.put("accountId", "100000001");
        userInfo.put("nickname", "testuser");
        userInfo.put("tenantId", 1);
        
        // 设置过期时间为1天
        long ttlMillis = 24 * 60 * 60 * 1000L;
        
        // 生成JWT
        String token = JwtUtils.createJWT("100000001", JwtUtils.generalSubject(userInfo), ttlMillis);
        System.out.println("生成的Token: " + token);
        
        // 解析JWT
        Claims claims = JwtUtils.parseJWT(token);
        System.out.println("解析结果: " + JSON.toJSONString(claims));
        
        // 验证JWT
        boolean isValid = JwtUtils.validateJWT(token);
        System.out.println("Token是否有效: " + isValid);
    }
}
```

## Python 实现

### 依赖安装

```bash
pip install PyJWT cryptography
```

### Python 工具类实现

```python
import jwt
import json
import datetime
from typing import Dict, Any, Optional

class JWTUtils:
    """JWT 工具类"""
    
    # JWT 签发者
    JWT_ID = "*DpD9Ks@Qk7EEbY2"
    
    # 签名算法
    ALGORITHM = "HS256"
    
    # 密钥
    JWT_SECRET = "858195902636309645765324632792538273443688242023"
    
    @classmethod
    def create_jwt(cls, jti: str, subject: Dict[str, Any], ttl_seconds: int = 3600) -> str:
        """
        创建JWT
        
        Args:
            jti: JWT ID
            subject: 主体信息
            ttl_seconds: 过期时间（秒），默认1小时
            
        Returns:
            JWT字符串
        """
        now = datetime.datetime.utcnow()
        
        payload = {
            'jti': jti,
            'iat': now,  # 签发时间
            'sub': json.dumps(subject, ensure_ascii=False),  # 主体信息
        }
        
        if ttl_seconds > 0:
            payload['exp'] = now + datetime.timedelta(seconds=ttl_seconds)  # 过期时间
            
        # 添加自定义头部
        headers = {
            'type': 'JWT'
        }
        
        return jwt.encode(payload, cls.JWT_SECRET, algorithm=cls.ALGORITHM, headers=headers)
    
    @classmethod
    def parse_jwt(cls, token: str) -> Dict[str, Any]:
        """
        解析JWT
        
        Args:
            token: JWT字符串
            
        Returns:
            解析后的payload
            
        Raises:
            jwt.InvalidTokenError: Token无效
            jwt.ExpiredSignatureError: Token已过期
        """
        # 移除Bearer前缀
        if token.startswith('Bearer '):
            token = token[7:]
            
        return jwt.decode(token, cls.JWT_SECRET, algorithms=[cls.ALGORITHM])
    
    @classmethod
    def validate_jwt(cls, token: str) -> bool:
        """
        验证JWT是否有效
        
        Args:
            token: JWT字符串
            
        Returns:
            是否有效
        """
        try:
            cls.parse_jwt(token)
            return True
        except (jwt.InvalidTokenError, jwt.ExpiredSignatureError):
            return False
    
    @classmethod
    def get_user_info(cls, token: str) -> Optional[Dict[str, Any]]:
        """
        从JWT中获取用户信息
        
        Args:
            token: JWT字符串
            
        Returns:
            用户信息字典，如果解析失败返回None
        """
        try:
            payload = cls.parse_jwt(token)
            subject = payload.get('sub')
            if subject:
                return json.loads(subject)
            return None
        except (jwt.InvalidTokenError, jwt.ExpiredSignatureError, json.JSONDecodeError):
            return None
```

### Python 使用示例

```python
def main():
    # 创建用户信息
    user_info = {
        "id": 1,
        "accountId": "100000001",
        "nickname": "testuser",
        "tenantId": 1
    }
    
    # 生成JWT (有效期1天)
    ttl_seconds = 24 * 60 * 60
    token = JWTUtils.create_jwt("100000001", user_info, ttl_seconds)
    print(f"生成的Token: {token}")
    
    # 解析JWT
    try:
        payload = JWTUtils.parse_jwt(token)
        print(f"解析结果: {json.dumps(payload, indent=2, default=str, ensure_ascii=False)}")
    except Exception as e:
        print(f"解析失败: {e}")
    
    # 验证JWT
    is_valid = JWTUtils.validate_jwt(token)
    print(f"Token是否有效: {is_valid}")
    
    # 获取用户信息
    user_data = JWTUtils.get_user_info(token)
    print(f"用户信息: {json.dumps(user_data, indent=2, ensure_ascii=False)}")

if __name__ == "__main__":
    main()
```

## 最佳实践

### 1. 安全建议

- **密钥管理**: 使用强密钥，并将其存储在环境变量或配置文件中，不要硬编码在代码中
- **HTTPS**: 始终通过 HTTPS 传输 JWT
- **过期时间**: 设置合理的过期时间，通常访问令牌较短（15分钟-1小时），刷新令牌较长（7-30天）
- **敏感信息**: 不要在 payload 中存储敏感信息，因为 JWT 内容是可解码的

### 2. 存储建议

- **客户端存储**: 
  - 推荐存储在内存中或 HttpOnly Cookie 中
  - 避免存储在 localStorage 中（存在 XSS 风险）
- **服务端**: 可以维护一个黑名单来撤销特定的 JWT

### 3. 错误处理

```java
// Java 错误处理示例
public static boolean isTokenValid(String token) {
    try {
        Claims claims = parseJWT(token);
        return claims.getExpiration().after(new Date());
    } catch (ExpiredJwtException e) {
        System.out.println("Token已过期");
        return false;
    } catch (MalformedJwtException e) {
        System.out.println("Token格式错误");
        return false;
    } catch (SignatureException e) {
        System.out.println("Token签名验证失败");
        return false;
    } catch (Exception e) {
        System.out.println("Token验证失败: " + e.getMessage());
        return false;
    }
}
```

```python
# Python 错误处理示例
def validate_token_detailed(token: str) -> tuple[bool, str]:
    """
    详细验证Token
    
    Returns:
        (是否有效, 错误信息)
    """
    try:
        JWTUtils.parse_jwt(token)
        return True, "Token有效"
    except jwt.ExpiredSignatureError:
        return False, "Token已过期"
    except jwt.InvalidSignatureError:
        return False, "Token签名无效"
    except jwt.DecodeError:
        return False, "Token格式错误"
    except Exception as e:
        return False, f"Token验证失败: {str(e)}"
```

## 总结

JWT 是一种强大的认证和信息传递机制，具有以下优势：

1. **无状态**: 服务器不需要存储会话信息
2. **跨域友好**: 可以在不同域之间传递
3. **可扩展**: 可以在 payload 中包含自定义信息
4. **性能好**: 避免了数据库查询

但也需要注意安全性和最佳实践的实施，确保在生产环境中的安全使用。