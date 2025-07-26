---
title: Validated 与 Valid 的区别
category:
  - 数据校验
tag:
  - '@Validated'
  - '@Valid'
---


# @Validated 与 @Valid 的区别详解

在Spring Boot开发中，数据校验是确保系统稳定性和数据完整性的重要环节。`@Validated` 和 `@Valid` 是两个常用的校验注解，虽然功能相似，但在使用场景和实现机制上存在重要区别。本文将深入分析这两个注解的差异，帮助开发者在不同场景下做出正确选择。

## 1. 注解来源与规范

### @Valid
- **来源**：JSR-303/JSR-380 Bean Validation 标准注解
- **包路径**：`jakarta.validation.Valid`（Jakarta EE）或 `javax.validation.Valid`（Java EE）
- **性质**：Java标准规范，跨框架通用

### @Validated
- **来源**：Spring Framework 扩展注解
- **包路径**：`org.springframework.validation.annotation.Validated`
- **性质**：Spring框架特有，基于JSR-303扩展

## 2. 核心功能差异

### @Valid：对象属性校验
`@Valid` 主要用于**嵌套对象**和**对象属性**的递归校验：

```java
public class UserDto {
    @NotBlank(message = "用户名不能为空")
    private String username;
    
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @Valid  // 递归校验Address对象
    private Address address;
}

public class Address {
    @NotBlank(message = "街道地址不能为空")
    private String street;
    
    @NotBlank(message = "城市不能为空")
    private String city;
}
```

### @Validated：方法参数校验
`@Validated` 不仅支持对象校验，还能对**方法参数直接校验**：

```java
@RestController
@Validated  // 启用方法参数校验
public class UserController {
    
    @GetMapping("/user/{id}")
    public Result<User> getUser(
            @Min(value = 1, message = "ID必须大于0")
            @PathVariable Long id,
            @NotBlank(message = "类型不能为空")
            @RequestParam String type) {
        // 直接校验基本类型参数
        return userService.getUser(id, type);
    }
}
```

## 3. 使用场景对比

### 场景1：Controller参数校验

#### ❌ 错误用法
```java
@RestController
@Valid  // 错误：@Valid不能用于类级别启用参数校验
public class ProductController {
    
    @GetMapping("/product")
    public Result getProduct(
            @NotBlank(message = "产品ID不能为空")
            @RequestParam String productId) {
        // 校验不会生效
        return productService.getProduct(productId);
    }
}
```

#### ✅ 正确用法
```java
@RestController
@Validated  // 正确：使用@Validated启用参数校验
public class ProductController {
    
    @GetMapping("/product")
    public Result getProduct(
            @NotBlank(message = "产品ID不能为空")
            @RequestParam String productId) {
        // 校验生效
        return productService.getProduct(productId);
    }
}
```

### 场景2：RequestBody对象校验

#### 使用@Valid
```java
@RestController
public class UserController {
    
    @PostMapping("/user")
    public Result createUser(@Valid @RequestBody UserDto userDto) {
        // @Valid会校验UserDto内部的所有校验注解
        // 包括嵌套对象的递归校验
        return userService.createUser(userDto);
    }
}
```

#### 使用@Validated
```java
@RestController
public class UserController {
    
    @PostMapping("/user")
    public Result createUser(@Validated @RequestBody UserDto userDto) {
        // @Validated也可以校验对象，效果类似@Valid
        // 但支持校验分组功能
        return userService.createUser(userDto);
    }
}
```

## 4. 高级特性：校验分组

`@Validated` 支持校验分组，而 `@Valid` 不支持：

```java
// 定义校验分组接口
public interface CreateGroup {}
public interface UpdateGroup {}

// 实体类
public class UserDto {
    @NotNull(groups = UpdateGroup.class, message = "更新时ID不能为空")
    private Long id;
    
    @NotBlank(groups = {CreateGroup.class, UpdateGroup.class}, 
              message = "用户名不能为空")
    private String username;
    
    @Email(groups = {CreateGroup.class, UpdateGroup.class},
           message = "邮箱格式不正确")
    private String email;
}

// Controller使用分组校验
@RestController
public class UserController {
    
    @PostMapping("/user")
    public Result createUser(
            @Validated(CreateGroup.class) @RequestBody UserDto userDto) {
        // 只校验CreateGroup分组的规则，id字段不会校验
        return userService.createUser(userDto);
    }
    
    @PutMapping("/user")
    public Result updateUser(
            @Validated(UpdateGroup.class) @RequestBody UserDto userDto) {
        // 校验UpdateGroup分组的规则，包括id字段
        return userService.updateUser(userDto);
    }
}
```

## 5. 嵌套对象校验差异

### @Valid：自动递归校验
```java
public class OrderDto {
    @NotBlank
    private String orderNo;
    
    @Valid  // 自动校验UserDto内部的所有字段
    private UserDto user;
    
    @Valid  // 自动校验集合中每个Address对象
    private List<Address> addresses;
}
```

### @Validated：需要显式指定
```java
public class OrderDto {
    @NotBlank
    private String orderNo;
    
    @Validated  // 可以指定分组进行校验
    private UserDto user;
    
    // 注意：@Validated对集合的嵌套校验支持有限
    private List<Address> addresses;
}
```

## 6. 异常处理机制

### @Valid产生的异常
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    // 处理@Valid校验失败异常
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result handleValidException(MethodArgumentNotValidException ex) {
        BindingResult bindingResult = ex.getBindingResult();
        List<String> errors = bindingResult.getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.toList());
        return Result.error("参数校验失败", errors);
    }
}
```

### @Validated产生的异常
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    // 处理@Validated方法参数校验失败异常
    @ExceptionHandler(ConstraintViolationException.class)
    public Result handleConstraintViolationException(ConstraintViolationException ex) {
        List<String> errors = ex.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.toList());
        return Result.error("参数校验失败", errors);
    }
    
    // 处理@Validated对象校验失败异常（与@Valid相同）
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result handleValidException(MethodArgumentNotValidException ex) {
        // 处理逻辑同上
    }
}
```

## 7. 性能与实现原理

### @Valid
- **实现方式**：基于Hibernate Validator等JSR-303实现
- **处理时机**：在方法调用前进行校验
- **性能特点**：标准实现，性能稳定

### @Validated
- **实现方式**：Spring AOP代理机制
- **处理时机**：通过切面在方法调用前拦截校验
- **性能特点**：额外的AOP开销，但支持更灵活的校验场景

## 8. 最佳实践建议

### 选择原则

1. **Controller方法参数校验** → 使用 `@Validated`
```java
@RestController
@Validated
public class ApiController {
    @GetMapping("/data")
    public Result getData(@NotBlank @RequestParam String id) { }
}
```

2. **RequestBody对象校验** → 优先使用 `@Valid`
```java
@PostMapping("/user")
public Result createUser(@Valid @RequestBody UserDto user) { }
```

3. **需要校验分组功能** → 使用 `@Validated`
```java
@PostMapping("/user")
public Result createUser(@Validated(CreateGroup.class) @RequestBody UserDto user) { }
```

4. **嵌套对象递归校验** → 使用 `@Valid`
```java
public class OrderDto {
    @Valid
    private UserDto user;  // 递归校验用户信息
}
```

### 组合使用
在实际项目中，可以将两者结合使用：

```java
@RestController
@Validated  // 启用方法参数校验
public class OrderController {
    
    @PostMapping("/order")
    public Result createOrder(
            @NotBlank @RequestParam String merchantId,  // @Validated校验
            @Valid @RequestBody OrderDto orderDto) {     // @Valid校验对象
        return orderService.createOrder(merchantId, orderDto);
    }
}
```

## 9. 总结

| 特性 | @Valid | @Validated |
|------|--------|------------|
| **来源** | JSR-303标准 | Spring扩展 |
| **方法参数校验** | ❌ 不支持 | ✅ 支持 |
| **对象属性校验** | ✅ 支持 | ✅ 支持 |
| **嵌套对象校验** | ✅ 自动递归 | ⚠️ 有限支持 |
| **校验分组** | ❌ 不支持 | ✅ 支持 |
| **集合校验** | ✅ 完整支持 | ⚠️ 有限支持 |
| **跨框架兼容** | ✅ 标准规范 | ❌ Spring专用 |

**核心建议**：
- Controller参数校验使用 `@Validated`
- 对象属性校验使用 `@Valid`
- 需要分组校验时使用 `@Validated`
- 复杂嵌套场景优先考虑 `@Valid`

选择合适的校验注解不仅能确保数据的有效性，还能提升代码的可读性和维护性。在实际开发中，建议根据具体场景灵活选择，甚至可以在同一个项目中组合使用这两个注解，以发挥各自的优势。