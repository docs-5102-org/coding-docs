---
title: Hibernate 分组校验
category:
  - 框架
tag:
  - Hibernate
  - GroupSequence
  - GroupSequenceProvider
---

# Hibernate 分组序列校验

## 概述

在实际开发中，我们经常遇到需要根据不同的业务场景对同一个对象执行不同校验规则的情况。Hibernate Validator 提供了分组序列校验功能，通过 `@GroupSequence` 和 `@GroupSequenceProvider` 注解来控制数据校验顺序，有效解决多字段联合逻辑校验问题。

## 核心概念

### 分组校验
- 将校验规则按照业务场景分组
- 不同场景下执行不同的校验逻辑
- 提高校验的灵活性和可维护性

### 分组序列
- 控制分组校验的执行顺序
- 支持动态决定使用哪些校验分组
- 避免不必要的校验执行

## 实现方式

### 1. 使用 @GroupSequenceProvider

`@GroupSequenceProvider` 允许我们动态地确定校验分组序列，根据对象的实际值来决定执行哪些校验组。

#### 自定义 GroupSequenceProvider

```java
public class LoginGroupSequenceProvider implements DefaultGroupSequenceProvider<LoginRequest> {

    @Override
    public List<Class<?>> getValidationGroups(LoginRequest bean) {
        List<Class<?>> defaultGroupSequence = new ArrayList<>();
        
        // 这一步不能省，否则Default分组都不会执行了，会抛错的
        defaultGroupSequence.add(LoginRequest.class);
        
        if (bean != null) { // 这块判空请务必要做
            String loginType = bean.getLoginType();
            
            if (loginType.equalsIgnoreCase(LoginTypeEnum.UNIVERIFY.getCode())) {
                // 只有在登录类型是一键登录时，才触发 VerifyLogin.class 组的校验
                defaultGroupSequence.add(LoginRequest.VerifyLogin.class);
            } else if (loginType.equalsIgnoreCase(LoginTypeEnum.SMS.getCode())) {
                // 只有在登录类型是短信登录时，才触发 SmsLogin.class 组的校验
                defaultGroupSequence.add(LoginRequest.SmsLogin.class);
            }
        }
        
        return defaultGroupSequence;
    }
}
```

#### 请求对象定义

```java
@GroupSequenceProvider(LoginGroupSequenceProvider.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    /**
     * 手机号
     */
    @NotBlank(message = "手机号不能为空", groups = { SmsLogin.class, VerifyLogin.class })
    private String phoneNumber;

    /**
     * 验证码
     */
    @NotBlank(message = "验证码不能为空", groups = { SmsLogin.class })
    private String verificationCode;

    /**
     * 设备号
     */
    @NotBlank(message = "设备号不能为空", groups = { SmsLogin.class, VerifyLogin.class })
    private String deviceNo;

    /**
     * 登录IP
     */
    private String ip;

    /**
     * 性别，默认参数男士
     */
    @Builder.Default
    private String gender = GenderEnum.MALE.getCode();

    /**
     * 注册来源，默认是安卓
     */
    @Builder.Default
    private String source = MemberRegisterSourceEnum.ANDROID.getCode();

    /**
     * 登录方式
     */
    @Builder.Default
    private String loginType = LoginTypeEnum.SMS.getCode();

    /**
     * 短信登录校验分组
     */
    public interface SmsLogin {
    }

    /**
     * 一键登录校验分组
     */
    public interface VerifyLogin {
    }
}
```

### 2. Controller 层使用

```java
/**
 * 登录（自动注册）
 * @param loginRequest 登录请求参数
 * @param bindingResult 校验结果
 * @return 登录结果
 */
@PostMapping(value = "/auth/login")
public ResultData<?> login(@RequestBody @Validated LoginRequest loginRequest, 
                          BindingResult bindingResult) {
    try {
        if (bindingResult.hasErrors()) {
            String errorMessages = bindingResult.getAllErrors()
                .stream()
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .collect(Collectors.joining(","));
            return ResultData.failMsg(errorMessages);
        }
        
        process(loginRequest);
        
        if(loginRequest.getLoginType().equalsIgnoreCase(LoginTypeEnum.SMS.getCode())){
            // 短信登录
            return smsService.sign(loginRequest);
        } else if(loginRequest.getLoginType().equalsIgnoreCase(LoginTypeEnum.UNIVERIFY.getCode())){
            // 一键登录
            return loginService.getLoginInfo(loginRequest);
        }
        
        return ResultData.failMsg("登录类型不匹配");
    } catch (Exception e) {
        log.error("【/auth/login】登录接口出现异常", e);
        return ResultData.failMsg("【/auth/login】登录接口出现异常");
    }
}
```

## 测试验证

```java
public static void main(String[] args) {
    // 模拟登录校验，查看输出结果
    
    // 测试一键登录场景
    LoginRequest loginRequest1 = new LoginRequest();
    loginRequest1.setLoginType("UNIVERIFY");
    System.out.println("loginRequest1 = " + loginRequest1);
    
    // 测试校验规则
    LoginRequest loginRequest = LoginRequest.builder()
        .deviceNo("sdf")
        .loginType("UNIVERIFY")
        .ip("192.168.102.11")
        .phoneNumber("1111")
        .verificationCode("")
        .build();
        
    System.out.println("loginRequest = " + loginRequest);
    
    Set<ConstraintViolation<LoginRequest>> result = Validation
        .buildDefaultValidatorFactory()
        .getValidator()
        .validate(loginRequest);
        
    // 对结果进行遍历输出
    result.stream().forEach(System.out::println);
}
```

## 关键要点

### 1. DefaultGroupSequenceProvider 实现要点
- **必须添加默认分组**：`defaultGroupSequence.add(LoginRequest.class)` 不能省略
- **空值检查**：对 bean 参数进行非空判断
- **动态分组**：根据对象属性值动态决定校验分组

### 2. 分组接口定义
- 在实体类内部定义校验分组接口
- 接口通常为空接口，仅作为标记使用
- 命名要有业务意义，便于理解和维护

### 3. 校验注解使用
- 在校验注解的 `groups` 属性中指定分组
- 同一字段可以属于多个分组
- 不指定 `groups` 的注解属于默认分组

## 优势

1. **业务逻辑清晰**：不同场景的校验规则分离明确
2. **性能优化**：只执行必要的校验规则，避免不必要的校验
3. **维护性好**：校验规则集中管理，便于修改和扩展
4. **灵活性高**：支持动态决定校验规则

## 适用场景

- 同一接口支持多种业务场景
- 不同用户类型有不同的校验要求
- 分阶段校验（如注册流程中的多步骤校验）
- 条件性校验（某些字段仅在特定条件下需要校验）

## 总结

Hibernate Validator 的分组序列校验功能为复杂业务场景下的数据校验提供了优雅的解决方案。通过合理使用 `@GroupSequenceProvider` 和分组接口，可以实现灵活、高效的多场景校验逻辑，提高代码的可维护性和系统的性能。