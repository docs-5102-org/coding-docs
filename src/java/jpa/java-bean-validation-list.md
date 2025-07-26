---
title: Java Bean Validation List校验方式
category:
  - Validation
tag:
  - Validation
---

# Java Bean Validation List校验方式

## 问题背景

在Spring Boot项目中，当我们需要对Controller接收的List参数进行Bean Validation校验时，直接使用`@Valid List<Entity>`的方式无法正常触发List内部元素的校验。这是因为`@Valid`注解只能校验对象本身，而不能深入到集合内部的元素。

## 解决方案

通过创建一个包装类`ValidableList`来解决这个问题，该类实现了`List`接口，并在内部使用`@Valid`注解标记真正的List字段。

### 核心实现

```java
/**
 * 可被校验的List包装类
 * 
 * 用于解决Spring MVC中无法直接校验List<Entity>内部元素的问题
 * 通过包装模式，将List包装成一个可校验的对象
 *
 * @param <E> 列表元素类型
 * @author Deolin
 */
public class ValidableList<E> implements List<E> {

    /**
     * 实际存储数据的List，使用@Valid注解确保内部元素被校验
     */
    @Valid
    private List<E> list;

    /**
     * 默认构造函数，创建空的ArrayList
     */
    public ValidableList() {
        this.list = new ArrayList<>();
    }

    /**
     * 带参构造函数，使用现有List初始化
     * 
     * @param list 要包装的List
     */
    public ValidableList(List<E> list) {
        this.list = list == null ? new ArrayList<>() : list;
    }

    /**
     * 获取内部List的引用
     * 
     * @return 内部List对象
     */
    public List<E> getList() {
        return list;
    }

    /**
     * 设置内部List
     * 
     * @param list 新的List对象
     */
    public void setList(List<E> list) {
        this.list = list == null ? new ArrayList<>() : list;
    }

    // ==================== List接口实现 ====================
    
    @Override
    public int size() {
        return list.size();
    }

    @Override
    public boolean isEmpty() {
        return list.isEmpty();
    }

    @Override
    public boolean contains(Object o) {
        return list.contains(o);
    }

    @Override
    public Iterator<E> iterator() {
        return list.iterator();
    }

    @Override
    public Object[] toArray() {
        return list.toArray();
    }

    @Override
    public <T> T[] toArray(T[] a) {
        return list.toArray(a);
    }

    @Override
    public boolean add(E e) {
        return list.add(e);
    }

    @Override
    public boolean remove(Object o) {
        return list.remove(o);
    }

    @Override
    public boolean containsAll(Collection<?> c) {
        return list.containsAll(c);
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        return list.addAll(c);
    }

    @Override
    public boolean addAll(int index, Collection<? extends E> c) {
        return list.addAll(index, c);
    }

    @Override
    public boolean removeAll(Collection<?> c) {
        return list.removeAll(c);
    }

    @Override
    public boolean retainAll(Collection<?> c) {
        return list.retainAll(c);
    }

    @Override
    public void clear() {
        list.clear();
    }

    @Override
    public E get(int index) {
        return list.get(index);
    }

    @Override
    public E set(int index, E element) {
        return list.set(index, element);
    }

    @Override
    public void add(int index, E element) {
        list.add(index, element);
    }

    @Override
    public E remove(int index) {
        return list.remove(index);
    }

    @Override
    public int indexOf(Object o) {
        return list.indexOf(o);
    }

    @Override
    public int lastIndexOf(Object o) {
        return list.lastIndexOf(o);
    }

    @Override
    public ListIterator<E> listIterator() {
        return list.listIterator();
    }

    @Override
    public ListIterator<E> listIterator(int index) {
        return list.listIterator(index);
    }

    @Override
    public List<E> subList(int fromIndex, int toIndex) {
        return list.subList(fromIndex, toIndex);
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        ValidableList<?> that = (ValidableList<?>) obj;
        return Objects.equals(list, that.list);
    }

    @Override
    public int hashCode() {
        return Objects.hash(list);
    }

    @Override
    public String toString() {
        return list.toString();
    }
}
```

### Controller使用方式

```java
@RestController
public class UserController {

    /**
     * 批量创建用户
     * 
     * @param users 用户列表，会自动校验每个User对象的字段
     * @return 处理结果
     */
    @PostMapping("/users/batch")
    public ResponseEntity<String> createUsers(@RequestBody @Valid ValidableList<User> users) {
        // 可以直接当作List使用
        users.forEach(user -> {
            // 处理每个用户
            System.out.println("Processing user: " + user.getName());
        });
        
        // 或者获取内部List
        List<User> userList = users.getList();
        
        return ResponseEntity.ok("SUCCESS");
    }
}
```

### 实体类示例

```java
public class User {
    
    @NotBlank(message = "用户名不能为空")
    private String name;
    
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @Min(value = 1, message = "年龄必须大于0")
    @Max(value = 150, message = "年龄必须小于150")
    private Integer age;
    
    // getter and setter...
}
```

## 工作原理

1. **包装模式**: `ValidableList`实现了`List`接口，对外表现为一个普通的List
2. **校验触发**: 内部的`@Valid`注解确保Jackson反序列化时会触发对List内部元素的校验
3. **透明使用**: Controller方法可以像使用普通List一样使用`ValidableList`

## 优势

1. **完全兼容**: 实现了List接口，可以无缝替换原有的List使用方式
2. **校验生效**: 解决了直接使用`List<Entity>`无法校验内部元素的问题
3. **类型安全**: 保持泛型类型，编译时类型检查
4. **易于使用**: 对业务代码透明，无需额外的转换操作

## 注意事项

1. **性能考虑**: 由于多了一层包装，在大数据量场景下可能有轻微的性能影响
2. **序列化**: 如果需要将`ValidableList`序列化为JSON返回，建议直接返回内部的`list`字段
3. **空值处理**: 构造函数中已做空值保护，避免NPE

## 替代方案

如果不想创建包装类，也可以考虑以下方案：

```java
// 方案1: 使用DTO包装
public class UserListDto {
    @Valid
    private List<User> users;
    // getter and setter...
}

// 方案2: 自定义校验器
@PostMapping("/users")
public String createUsers(@RequestBody List<@Valid User> users) {
    // 需要Spring Boot 2.3+支持
}
```

但`ValidableList`方案在兼容性和使用便利性上更具优势。