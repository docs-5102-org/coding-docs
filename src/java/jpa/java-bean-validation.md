---
title: Bean Validation 数据校验
category:
  - Validation
tag:
  - Validation
---

# Java Bean Validation完整指南

## 概述

Java Bean Validation 是一套基于注解的数据验证框架，提供了声明式的数据验证机制。通过在实体类属性上添加验证注解，可以轻松实现数据的完整性检查。

## 核心验证注解

### 基础验证注解 (JSR 303/380)

| 注解 | 作用范围 | 说明 | 示例 |
|------|----------|------|------|
| `@NotNull` | 任何类型 | 值不能为 null | `@NotNull private String name;` |
| `@Null` | 任何类型 | 值必须为 null | `@Null private String temp;` |
| `@AssertTrue` | Boolean | 值必须为 true | `@AssertTrue private boolean accepted;` |
| `@AssertFalse` | Boolean | 值必须为 false | `@AssertFalse private boolean deleted;` |

### 数值验证注解

| 注解 | 作用范围 | 说明 | 示例 |
|------|----------|------|------|
| `@Min(value)` | 数值类型 | 值必须 ≥ 指定最小值 | `@Min(18) private int age;` |
| `@Max(value)` | 数值类型 | 值必须 ≤ 指定最大值 | `@Max(100) private int score;` |
| `@DecimalMin(value)` | 数值类型 | 支持小数的最小值验证 | `@DecimalMin("0.01") private BigDecimal price;` |
| `@DecimalMax(value)` | 数值类型 | 支持小数的最大值验证 | `@DecimalMax("999.99") private BigDecimal amount;` |
| `@Digits(integer, fraction)` | 数值类型 | 限制整数位和小数位数量 | `@Digits(integer=3, fraction=2) private BigDecimal rate;` |

### 字符串和集合验证注解

| 注解 | 作用范围 | 说明 | 示例 |
|------|----------|------|------|
| `@Size(min, max)` | 字符串、集合、数组 | 长度或大小必须在指定范围内 | `@Size(min=2, max=50) private String username;` |
| `@Pattern(regex, flags)` | 字符串 | 必须符合正则表达式 | `@Pattern(regexp="^1[3-9]\\d{9}$") private String phone;` |

### 时间验证注解

| 注解 | 作用范围 | 说明 | 示例 |
|------|----------|------|------|
| `@Past` | 时间类型 | 必须是过去的时间 | `@Past private Date birthDate;` |
| `@Future` | 时间类型 | 必须是未来的时间 | `@Future private Date expiryDate;` |
| `@PastOrPresent` | 时间类型 | 过去或现在的时间 | `@PastOrPresent private LocalDate createDate;` |
| `@FutureOrPresent` | 时间类型 | 未来或现在的时间 | `@FutureOrPresent private LocalDate scheduleDate;` |

### Hibernate Validator 扩展注解

| 注解 | 作用范围 | 说明 | 示例 |
|------|----------|------|------|
| `@NotEmpty` | 字符串、集合 | 不能为 null 且不能为空 | `@NotEmpty private String title;` |
| `@NotBlank` | 字符串 | 不能为 null、空串或只含空格 | `@NotBlank private String content;` |
| `@Email` | 字符串 | 必须是有效的邮箱格式 | `@Email private String email;` |
| `@Length(min, max)` | 字符串 | 字符串长度必须在指定范围内 | `@Length(min=6, max=20) private String password;` |
| `@Range(min, max)` | 数值类型 | 数值必须在指定范围内 | `@Range(min=0, max=150) private int score;` |

## 实践示例

### 示例 1：基础实体类验证

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserForm {
    
    /**
     * 用户名：必填，长度2-30位
     */
    @NotBlank(message = "用户名不能为空")
    @Length(min = 2, max = 30, message = "用户名长度必须在2-30位之间")
    private String username;
    
    /**
     * 邮箱：必填，格式验证
     */
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
    
    /**
     * 手机号：格式验证
     */
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;
    
    /**
     * 年龄：18-100岁
     */
    @Min(value = 18, message = "年龄不能小于18岁")
    @Max(value = 100, message = "年龄不能超过100岁")
    private Integer age;
    
    /**
     * 出生日期：必须是过去时间
     */
    @Past(message = "出生日期必须是过去时间")
    private LocalDate birthDate;
    
    /**
     * 个人简介：最多500字符
     */
    @Length(max = 500, message = "个人简介不能超过500个字符")
    private String bio;
}
```

### 示例 2：控制器中的验证处理

通过 `@Valid` 声明接受参数来进行校验

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    /**
     * 创建或更新用户
     */
    @PostMapping("/save")
    public ResponseEntity<?> saveUser(
            @RequestBody @Valid UserForm userForm,
            BindingResult bindingResult) {
        
        // 检查验证结果
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = extractFieldErrors(bindingResult);
            return ResponseEntity.badRequest().body(
                new ErrorResponse("数据验证失败", errors)
            );
        }
        
        // 业务逻辑处理
        userService.saveUser(userForm);
        return ResponseEntity.ok(new SuccessResponse("用户保存成功"));
    }
    
    /**
     * 提取字段验证错误信息
     */
    private Map<String, String> extractFieldErrors(BindingResult bindingResult) {
        return bindingResult.getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                FieldError::getDefaultMessage,
                (existing, replacement) -> existing
            ));
    }
}
```

### 示例 3：嵌套对象验证

通过 `@Valid` 设置在属性中，进行关联校验

```java
@Data
public class OrderForm {
    
    /**
     * 订单基本信息
     */
    @NotBlank(message = "订单编号不能为空")
    @Length(max = 32, message = "订单编号长度不能超过32位")
    private String orderNo;
    
    @DecimalMin(value = "0.01", message = "订单金额必须大于0")
    private BigDecimal totalAmount;
    
    /**
     * 收货地址信息：嵌套验证
     */
    @NotNull(message = "收货地址不能为空")
    @Valid
    private AddressForm address;
    
    /**
     * 订单商品列表：集合验证
     */
    @NotEmpty(message = "订单商品不能为空")
    @Valid
    private List<OrderItemForm> items;
}

@Data
public class AddressForm {
    
    @NotBlank(message = "收货人姓名不能为空")
    @Length(max = 50, message = "收货人姓名长度不能超过50位")
    private String receiverName;
    
    @NotBlank(message = "收货地址不能为空")
    @Length(max = 200, message = "收货地址长度不能超过200位")
    private String detailAddress;
    
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;
}

@Data
public class OrderItemForm {
    
    @NotBlank(message = "商品编号不能为空")
    private String productId;
    
    @Min(value = 1, message = "商品数量必须大于0")
    private Integer quantity;
    
    @DecimalMin(value = "0.01", message = "商品价格必须大于0")
    private BigDecimal price;
}
```

### 示例 4：List校验

[Java Bean Validation List校验方式](./java-bean-validation-list.md)


## 自定义验证注解

### 创建自定义验证注解

```java
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = IdCardValidator.class)
@Documented
public @interface IdCard {
    String message() default "身份证号格式不正确";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
```

### 实现验证器

```java
public class IdCardValidator implements ConstraintValidator<IdCard, String> {
    
    private static final String ID_CARD_REGEX = 
        "^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx]$";
    
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return true; // 空值由 @NotBlank 等注解处理
        }
        return value.matches(ID_CARD_REGEX);
    }
}
```

## 验证组 (Validation Groups)

### 定义验证组

```java
public interface CreateGroup {}
public interface UpdateGroup {}

@Data
public class ProductForm {
    
    @NotNull(groups = UpdateGroup.class, message = "更新时ID不能为空")
    private Long id;
    
    @NotBlank(groups = {CreateGroup.class, UpdateGroup.class}, 
              message = "商品名称不能为空")
    @Length(max = 100, groups = {CreateGroup.class, UpdateGroup.class},
            message = "商品名称长度不能超过100位")
    private String name;
    
    @DecimalMin(value = "0.01", groups = {CreateGroup.class, UpdateGroup.class},
                message = "价格必须大于0")
    private BigDecimal price;
}
```

### 在控制器中使用验证组

```java
@PostMapping("/products")
public ResponseEntity<?> createProduct(
        @RequestBody @Validated(CreateGroup.class) ProductForm form,
        BindingResult bindingResult) {
    // 创建商品逻辑
}

@PutMapping("/products/{id}")
public ResponseEntity<?> updateProduct(
        @PathVariable Long id,
        @RequestBody @Validated(UpdateGroup.class) ProductForm form,
        BindingResult bindingResult) {
    // 更新商品逻辑
}
```

## 最佳实践

### 1. 错误信息国际化

在 `ValidationMessages.properties` 中定义错误信息：

```properties
user.username.notblank=用户名不能为空
user.username.length=用户名长度必须在{min}-{max}位之间
user.email.invalid=邮箱格式不正确
```

在注解中引用：

```java
@NotBlank(message = "{user.username.notblank}")
@Length(min = 2, max = 30, message = "{user.username.length}")
private String username;
```

### 2. 全局异常处理

```java
@RestControllerAdvice
public class ValidationExceptionHandler {
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationException(
            MethodArgumentNotValidException ex) {
        
        Map<String, String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                FieldError::getDefaultMessage
            ));
            
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("数据验证失败", errors));
    }
    
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<?> handleConstraintViolationException(
            ConstraintViolationException ex) {
        
        Map<String, String> errors = ex.getConstraintViolations()
            .stream()
            .collect(Collectors.toMap(
                violation -> violation.getPropertyPath().toString(),
                ConstraintViolation::getMessage
            ));
            
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("参数验证失败", errors));
    }
}
```

控制器就不需要，手动配置`BindingResult bindingResult参数`，交给全局处理

```java
@PutMapping("/products/{id}")
public ResponseEntity<?> updateProduct(
        @PathVariable Long id,
        @RequestBody @Validated(UpdateGroup.class) ProductForm form) {
    // 更新商品逻辑
}
```

### 3. 验证工具类（可选）

```java
// ========== 1. 验证结果封装类 ==========
public class ValidationResult<T> {
    private final boolean success;
    private final T data;
    private final Map<String, String> errors;
    
    private ValidationResult(boolean success, T data, Map<String, String> errors) {
        this.success = success;
        this.data = data;
        this.errors = errors;
    }
    
    public static <T> ValidationResult<T> success(T data) {
        return new ValidationResult<>(true, data, Collections.emptyMap());
    }
    
    public static <T> ValidationResult<T> failure(Map<String, String> errors) {
        return new ValidationResult<>(false, null, errors);
    }
    
    // getters
    public boolean isSuccess() { return success; }
    public T getData() { return data; }
    public Map<String, String> getErrors() { return errors; }
}

// ========== 2. 完整的验证工具类 ==========
@Component
public class ValidationUtils {
    
    private final Validator validator;
    
    public ValidationUtils(Validator validator) {
        this.validator = validator;
    }
    
    /**
     * 验证单个对象
     */
    public <T> ValidationResult<T> validate(T object, Class<?>... groups) {
        Set<ConstraintViolation<T>> violations = validator.validate(object, groups);
        
        if (violations.isEmpty()) {
            return ValidationResult.success(object);
        }
        
        Map<String, String> errors = violations.stream()
            .collect(Collectors.toMap(
                violation -> violation.getPropertyPath().toString(),
                ConstraintViolation::getMessage,
                (existing, replacement) -> existing
            ));
            
        return ValidationResult.failure(errors);
    }
    
    /**
     * 验证集合中的所有对象
     */
    public <T> List<ValidationResult<T>> validateList(List<T> objects, Class<?>... groups) {
        return objects.stream()
            .map(obj -> validate(obj, groups))
            .collect(Collectors.toList());
    }
    
    /**
     * 验证属性值
     */
    public <T> ValidationResult<T> validateProperty(T object, String propertyName, Class<?>... groups) {
        Set<ConstraintViolation<T>> violations = validator.validateProperty(object, propertyName, groups);
        
        if (violations.isEmpty()) {
            return ValidationResult.success(object);
        }
        
        Map<String, String> errors = violations.stream()
            .collect(Collectors.toMap(
                violation -> violation.getPropertyPath().toString(),
                ConstraintViolation::getMessage
            ));
            
        return ValidationResult.failure(errors);
    }
    
    /**
     * 验证属性值（不需要完整对象）
     */
    public ValidationResult<Object> validateValue(Class<?> beanType, String propertyName, Object value, Class<?>... groups) {
        Set<ConstraintViolation<Object>> violations = validator.validateValue(beanType, propertyName, value, groups);
        
        if (violations.isEmpty()) {
            return ValidationResult.success(value);
        }
        
        Map<String, String> errors = violations.stream()
            .collect(Collectors.toMap(
                violation -> violation.getPropertyPath().toString(),
                ConstraintViolation::getMessage
            ));
            
        return ValidationResult.failure(errors);
    }
    
    /**
     * 快速检查对象是否有效
     */
    public <T> boolean isValid(T object, Class<?>... groups) {
        return validator.validate(object, groups).isEmpty();
    }
    
    /**
     * 获取第一个验证错误信息
     */
    public <T> Optional<String> getFirstError(T object, Class<?>... groups) {
        Set<ConstraintViolation<T>> violations = validator.validate(object, groups);
        return violations.stream()
            .findFirst()
            .map(ConstraintViolation::getMessage);
    }
}

// ========== 3. 应用场景示例 ==========

// 场景1：服务层批量数据验证
@Service
public class UserService {
    
    @Autowired
    private ValidationUtils validationUtils;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * 批量导入用户
     */
    public ImportResult importUsers(List<UserForm> userForms) {
        List<UserForm> validUsers = new ArrayList<>();
        List<String> errorMessages = new ArrayList<>();
        
        for (int i = 0; i < userForms.size(); i++) {
            UserForm user = userForms.get(i);
            ValidationResult<UserForm> result = validationUtils.validate(user);
            
            if (result.isSuccess()) {
                validUsers.add(user);
            } else {
                String errorMsg = String.format("第%d行数据验证失败: %s", 
                    i + 1, String.join(", ", result.getErrors().values()));
                errorMessages.add(errorMsg);
            }
        }
        
        // 保存有效数据
        List<User> savedUsers = validUsers.stream()
            .map(this::convertToEntity)
            .map(userRepository::save)
            .collect(Collectors.toList());
            
        return new ImportResult(savedUsers.size(), errorMessages);
    }
    
    /**
     * 动态验证用户字段
     */
    public void validateUserField(String fieldName, Object fieldValue) {
        ValidationResult<Object> result = validationUtils.validateValue(
            UserForm.class, fieldName, fieldValue);
            
        if (!result.isSuccess()) {
            throw new ValidationException(
                String.join(", ", result.getErrors().values()));
        }
    }
}

// 场景2：控制器中的条件验证
@RestController
@RequestMapping("/api/products")
public class ProductController {
    
    @Autowired
    private ValidationUtils validationUtils;
    
    /**
     * 根据不同操作类型使用不同验证组
     */
    @PostMapping("/save")
    public ResponseEntity<?> saveProduct(@RequestBody ProductForm form, 
                                       @RequestParam String action) {
        Class<?>[] groups;
        
        switch (action) {
            case "create":
                groups = new Class[]{CreateGroup.class};
                break;
            case "update":
                groups = new Class[]{UpdateGroup.class};
                break;
            case "publish":
                groups = new Class[]{CreateGroup.class, PublishGroup.class};
                break;
            default:
                groups = new Class[]{Default.class};
        }
        
        ValidationResult<ProductForm> result = validationUtils.validate(form, groups);
        
        if (!result.isSuccess()) {
            return ResponseEntity.badRequest().body(
                new ErrorResponse("验证失败", result.getErrors()));
        }
        
        // 执行对应的业务逻辑
        productService.save(form, action);
        return ResponseEntity.ok("操作成功");
    }
    
    /**
     * 实时字段验证（前端AJAX调用）
     */
    @PostMapping("/validate-field")
    public ResponseEntity<?> validateField(@RequestParam String fieldName,
                                         @RequestParam String fieldValue) {
        ValidationResult<Object> result = validationUtils.validateValue(
            ProductForm.class, fieldName, fieldValue);
            
        if (result.isSuccess()) {
            return ResponseEntity.ok(Map.of("valid", true));
        } else {
            return ResponseEntity.ok(Map.of(
                "valid", false,
                "errors", result.getErrors()
            ));
        }
    }
}

// 场景3：定时任务中的数据清理验证
@Component
public class DataCleanupTask {
    
    @Autowired
    private ValidationUtils validationUtils;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * 清理无效用户数据
     */
    @Scheduled(cron = "0 0 2 * * ?") // 每天凌晨2点执行
    public void cleanupInvalidUsers() {
        List<User> allUsers = userRepository.findAll();
        List<Long> invalidUserIds = new ArrayList<>();
        
        for (User user : allUsers) {
            UserForm form = convertToForm(user);
            
            // 验证用户数据完整性
            if (!validationUtils.isValid(form)) {
                invalidUserIds.add(user.getId());
                
                // 记录详细错误信息
                Optional<String> firstError = validationUtils.getFirstError(form);
                log.warn("发现无效用户数据，ID: {}, 错误: {}", 
                    user.getId(), firstError.orElse("未知错误"));
            }
        }
        
        if (!invalidUserIds.isEmpty()) {
            // 标记或删除无效数据
            userRepository.markAsInvalid(invalidUserIds);
            log.info("标记了 {} 个无效用户", invalidUserIds.size());
        }
    }
}

// 场景4：自定义验证服务
@Service
public class CustomValidationService {
    
    @Autowired
    private ValidationUtils validationUtils;
    
    /**
     * 复合验证：先验证基础数据，再验证业务规则
     */
    public ValidationResult<OrderForm> validateOrder(OrderForm order) {
        // 1. 基础数据验证
        ValidationResult<OrderForm> basicResult = validationUtils.validate(order);
        if (!basicResult.isSuccess()) {
            return basicResult;
        }
        
        // 2. 业务规则验证
        Map<String, String> businessErrors = new HashMap<>();
        
        // 检查订单金额与商品总价是否一致
        BigDecimal calculatedTotal = order.getItems().stream()
            .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        if (!calculatedTotal.equals(order.getTotalAmount())) {
            businessErrors.put("totalAmount", "订单金额与商品总价不一致");
        }
        
        // 检查库存
        for (OrderItemForm item : order.getItems()) {
            if (!checkInventory(item.getProductId(), item.getQuantity())) {
                businessErrors.put("items[" + item.getProductId() + "]", "库存不足");
            }
        }
        
        if (!businessErrors.isEmpty()) {
            return ValidationResult.failure(businessErrors);
        }
        
        return ValidationResult.success(order);
    }
    
    /**
     * 分步验证：逐步验证表单的不同部分
     */
    public Map<String, ValidationResult<?>> validateOrderSteps(OrderForm order) {
        Map<String, ValidationResult<?>> results = new HashMap<>();
        
        // 步骤1：验证基本信息
        results.put("basic", validationUtils.validateProperty(order, "orderNo"));
        results.put("amount", validationUtils.validateProperty(order, "totalAmount"));
        
        // 步骤2：验证地址信息
        if (order.getAddress() != null) {
            results.put("address", validationUtils.validate(order.getAddress()));
        }
        
        // 步骤3：验证商品列表
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            List<ValidationResult<OrderItemForm>> itemResults = 
                validationUtils.validateList(order.getItems());
            results.put("items", ValidationResult.success(itemResults));
        }
        
        return results;
    }
    
    private boolean checkInventory(String productId, Integer quantity) {
        // 库存检查逻辑
        return true;
    }
}

// ========== 4. 配置类 ==========
@Configuration
public class ValidationConfig {
    
    /**
     * 配置验证器
     */
    @Bean
    public Validator validator() {
        return Validation.buildDefaultValidatorFactory().getValidator();
    }
    
    /**
     * 自定义验证器配置
     */
    @Bean
    public LocalValidatorFactoryBean localValidatorFactoryBean() {
        LocalValidatorFactoryBean bean = new LocalValidatorFactoryBean();
        bean.setValidationMessageSource(messageSource());
        return bean;
    }
    
    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("ValidationMessages");
        messageSource.setDefaultEncoding("UTF-8");
        return messageSource;
    }
}

// ========== 5. 辅助类 ==========
public class ImportResult {
    private final int successCount;
    private final List<String> errors;
    
    public ImportResult(int successCount, List<String> errors) {
        this.successCount = successCount;
        this.errors = errors;
    }
    
    // getters
    public int getSuccessCount() { return successCount; }
    public List<String> getErrors() { return errors; }
    public boolean hasErrors() { return !errors.isEmpty(); }
}

public class ErrorResponse {
    private final String message;
    private final Map<String, String> errors;
    
    public ErrorResponse(String message, Map<String, String> errors) {
        this.message = message;
        this.errors = errors;
    }
    
    // getters
    public String getMessage() { return message; }
    public Map<String, String> getErrors() { return errors; }
}
```

## 概念的区分

* [Validated 与 Valid 的区别](./validated-vs-valid.md)
* [Java Bean Validation 与 Hibernate Validator 的区别与联系](./jbv-vs-hv.md)


## 注意事项

1. **性能考虑**：验证注解会在运行时执行，对于大量数据处理时需要考虑性能影响
2. **验证顺序**：多个验证注解的执行顺序是不确定的
3. **空值处理**：大部分验证注解对 `null` 值是宽容的，需要配合 `@NotNull` 使用
4. **嵌套验证**：使用 `@Valid` 注解可以触发嵌套对象和集合元素的验证
5. **循环引用**：在双向关联的实体中使用验证时需要注意避免循环引用

通过合理使用 Java Bean Validation，可以大大简化数据验证的代码，提高开发效率和代码的可维护性。