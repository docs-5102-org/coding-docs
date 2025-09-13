---
title: HandlerMethodReturnValueHandler接口应用
category:
  - Web框架
tag:
  - Spring Boot
  - HandlerMethodReturnValueHandler
---

# SpringBoot HandlerMethodReturnValueHandler接口应用

## 1. 背景

日常开发中，90 % 的接口都需要统一返回格式：

```json
{
  "code": 200,
  "data": "",
  "msg": "success"
}
```

最普遍的写法是：先写一个 `ResultData<T>`，然后在 **每个 Controller 方法里手动包一层**：

```java
@PostMapping("/hot-word/list")
public ResultData<List<HotWordVO>> queryHotWordList(@RequestBody HotWordRequest req){
    try{
        return ResultData.success(hotWordRedisService.queryHotWordList(req.getSearchKey()));
    }catch(Exception e){
        log.error("【/hot-word/list】异常", e);
        return ResultData.fail("获取热词失败");
    }
}
```

缺点显而易见：

- 每个方法都要 `try/catch` + `ResultData.success/fail`  
- 重复样板代码，违反 **DRY** 原则  
- 开发体验差，关注点偏离业务

---

## 2. 目标

让 Controller **直接返回业务对象**（或 `List`、`String` 等），由框架自动包成统一格式：

```java
@PostMapping("/hot-word/list")
public List<HotWordVO> queryHotWordList(@RequestBody HotWordRequest req){
    // 直接返回！
    return hotWordRedisService.queryHotWordList(req.getSearchKey());
}
```

---

## 3. 实现思路

利用 SpringMVC 提供的扩展点 `HandlerMethodReturnValueHandler`：

1. 自定义注解 `@ApiResult` 用于标记需要统一包装的返回值  
2. 实现 `ReturnValueHandler` 判断方法/类上是否有该注解  
3. 将原始返回值封装成 `ResultData`，再交由内置的 `RequestResponseBodyMethodProcessor` 序列化  
4. 注册到 `RequestMappingHandlerAdapter` 的 `returnValueHandlers` 首位

---

## 4. 代码落地

### 4.1 统一返回对象 `ResultData`

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ResultData<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    @Builder.Default
    private Integer code = 200;
    private String msg;
    private T data;

    /* ===== 静态工厂 ===== */
    public static <T> ResultData<T> success() { return success(null); }

    public static <T> ResultData<T> success(T data) {
        return ResultData.<T>builder().code(200).msg("success").data(data).build();
    }

    public static <T> ResultData<T> fail(String msg){
        return ResultData.<T>builder().code(500).msg(msg).build();
    }

    public String toJSONString(){
        return JSON.toJSONString(this);
    }
}
```

### 4.2 标识注解 `@ApiResult`

```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface ApiResult {}
```

- 打在类上：该类下所有方法生效  
- 打在方法上：仅当前方法生效

### 4.3 返回值处理器 `ApiResultReturnValueHandler`

```java
public class ApiResultReturnValueHandler implements HandlerMethodReturnValueHandler {

    private final HandlerMethodReturnValueHandler delegate;

    public ApiResultReturnValueHandler(HandlerMethodReturnValueHandler delegate){
        this.delegate = delegate;
    }

    @Override
    public boolean supportsReturnType(MethodParameter returnType) {
        // 只要类或方法上存在 @ApiResult 且返回非 ResultData 本身
        return (returnType.hasMethodAnnotation(ApiResult.class)
                || returnType.getDeclaringClass().isAnnotationPresent(ApiResult.class))
                && !ResultData.class.isAssignableFrom(returnType.getParameterType());
    }

    @Override
    public void handleReturnValue(Object returnValue, MethodParameter returnType,
                                  ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest) throws Exception {
        // 统一包装
        ResultData<?> result = ResultData.success(returnValue);
        // 继续走默认的 JSON 序列化
        delegate.handleReturnValue(result, returnType, mavContainer, webRequest);
    }
}
```

### 4.4 注册处理器

```java
@Configuration
public class WebMvcConfig {

    @PostConstruct
    public void init(){
        RequestMappingHandlerAdapter adapter = applicationContext.getBean(RequestMappingHandlerAdapter.class);
        List<HandlerMethodReturnValueHandler> newHandlers = new ArrayList<>(adapter.getReturnValueHandlers());

        // 找到默认的 RequestResponseBodyMethodProcessor
        HandlerMethodReturnValueHandler jackson = newHandlers.stream()
                .filter(h -> h instanceof RequestResponseBodyMethodProcessor)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("未找到 RequestResponseBodyMethodProcessor"));

        // 包装并放到首位
        newHandlers.add(0, new ApiResultReturnValueHandler(jackson));
        adapter.setReturnValueHandlers(newHandlers);
    }
}
```

> Spring Boot 2.x 也可实现 `WebMvcConfigurer`，重写 `addReturnValueHandlers`，但注意顺序。

---

## 5. 效果

Controller 变得异常清爽：

```java
@RestController
@RequestMapping("/hot-word")
@ApiResult   // 整个类统一返回
public class HotWordController {

    @PostMapping("/list")
    public List<HotWordVO> list(@RequestBody HotWordRequest req){
        return hotWordRedisService.queryHotWordList(req.getSearchKey());
    }

    @GetMapping("/{id}")
    public HotWordVO detail(@PathVariable Long id){
        return hotWordRedisService.findById(id);
    }
}
```

返回前端：

```json
{
  "code": 200,
  "data": [ { ... } ],
  "msg": "success"
}
```

---

## 6. 异常处理

配合 `@ControllerAdvice` 统一捕获业务异常，并返回 `ResultData.fail(...)`，前端同样收到一致格式。

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BizException.class)
    public ResultData<?> handleBiz(BizException e){
        return ResultData.fail(e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResultData<?> handle(Exception e){
        log.error("系统异常", e);
        return ResultData.fail("系统繁忙");
    }
}
```

---

## 7. 总结

| 维度       | 传统做法                     | HandlerMethodReturnValueHandler 方案 |
| ---------- | ---------------------------- | ------------------------------------ |
| 代码侵入   | 高：每个方法手动包           | 低：零侵入，专注业务                 |
| 可维护性   | 差：重复代码                 | 好：集中处理                         |
| 扩展性     | 差：新增逻辑需改 N 个方法    | 好：改一处即可                       |
| 开发体验   | 差                           | 极佳                                 |

利用 SpringMVC 的扩展点，我们可以把「统一返回格式」做成基础设施，让业务代码回归纯粹。

## 8. 参考资料

- [公众号教程](https://mp.weixin.qq.com/s/bW4Si-e0g9vOnF1OhnPSeQ?payreadticket=HGn6zoOlaur0zy-eKa3G7KEfbkFGosHR4gkshra7wxN6ZhyMHVjmYKMRhOUYtDTAfePb5kY)

