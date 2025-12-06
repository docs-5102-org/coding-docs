---
title: range循环
category:
  - Go
---

# `range` 循环

## 1. `for range` 循环（推荐用于遍历）

```go
users := []User{{Name: "Alice"}, {Name: "Bob"}, {Name: "Charlie"}}

// 获取索引和值
for i, user := range users {
    fmt.Printf("Index: %d, Name: %s\n", i, user.Name)
}

// 只要值
for _, user := range users {
    fmt.Println(user.Name)
}

// 只要索引
for i := range users {
    fmt.Println(i)
}
```

**特点：**
- ✅ 简洁优雅
- ✅ 自动处理边界
- ✅ 可以遍历 slice、array、map、channel、string
- ⚠️ **`user` 是副本，不是原始元素的引用**

---

## 2. 传统 `for` 循环

```go
users := []User{{Name: "Alice"}, {Name: "Bob"}}

// 标准 C 风格循环
for i := 0; i < len(users); i++ {
    fmt.Printf("Index: %d, Name: %s\n", i, users[i].Name)
}
```

**特点：**
- ✅ 可以精确控制步长
- ✅ 可以修改索引（如 `i += 2`）
- ✅ 直接访问原始元素
- ❌ 需要手动管理边界

---

## 3. 关键区别对比

### 区别 1：值拷贝 vs 直接访问

```go
type User struct {
    Name string
    Age  int
}

users := []User{
    {Name: "Alice", Age: 20},
    {Name: "Bob", Age: 25},
}

// ❌ range 返回的是副本
for i, user := range users {
    user.Age = 30  // 修改的是副本，不影响原数组！
    fmt.Println(users[i].Age)  // 输出：20, 25（未改变）
}

// ✅ 如果要修改原元素，用索引访问
for i := range users {
    users[i].Age = 30  // 直接修改原数组
}

// ✅ 或者用指针遍历
for i := range users {
    user := &users[i]  // 获取指针
    user.Age = 30
}
```

### 区别 2：遍历类型

```go
// ✅ range 可以遍历多种类型
// 1. Slice/Array
for i, v := range []int{1, 2, 3} {}

// 2. Map
for key, value := range map[string]int{"a": 1} {}

// 3. String（按 rune 遍历，不是 byte）
for i, char := range "Hello世界" {
    fmt.Printf("%d: %c\n", i, char)  // 正确处理 UTF-8
}

// 4. Channel
ch := make(chan int)
for value := range ch {}  // 持续接收直到 channel 关闭

// ❌ 传统 for 只能遍历 slice/array
for i := 0; i < len([]int{1, 2, 3}); i++ {}
```

### 区别 3：性能差异

```go
users := make([]User, 1000000)

// 方式1：range（稍慢，因为有值拷贝）
for _, user := range users {
    _ = user.Name
}

// 方式2：传统循环（稍快）
for i := 0; i < len(users); i++ {
    _ = users[i].Name
}

// 方式3：range 只用索引（和传统循环性能相近）
for i := range users {
    _ = users[i].Name
}
```

**性能结论：**
- 小对象：性能差异可忽略
- 大结构体：`for i := range` + 索引访问更优
- 指针 slice：`for _, user := range` 没问题（拷贝的是指针）

---

## 4. 常见陷阱

### 陷阱 1：闭包中的循环变量

```go
users := []User{{Name: "Alice"}, {Name: "Bob"}}

// ❌ 错误：所有 goroutine 都打印 "Bob"
for _, user := range users {
    go func() {
        fmt.Println(user.Name)  // user 被所有 goroutine 共享！
    }()
}

// ✅ 方式1：传参
for _, user := range users {
    go func(u User) {
        fmt.Println(u.Name)
    }(user)  // 传入副本
}

// ✅ 方式2：创建新变量
for _, user := range users {
    user := user  // 创建新变量（Go 1.22+ 已修复，不需要这样）
    go func() {
        fmt.Println(user.Name)
    }()
}
```

### 陷阱 2：遍历时修改 slice

```go
users := []User{{Name: "Alice"}, {Name: "Bob"}, {Name: "Charlie"}}

// ❌ 危险：遍历时删除元素
for i, user := range users {
    if user.Name == "Bob" {
        users = append(users[:i], users[i+1:]...)  // 会跳过元素！
    }
}

// ✅ 方式1：倒序遍历
for i := len(users) - 1; i >= 0; i-- {
    if users[i].Name == "Bob" {
        users = append(users[:i], users[i+1:]...)
    }
}

// ✅ 方式2：创建新 slice
var filtered []User
for _, user := range users {
    if user.Name != "Bob" {
        filtered = append(filtered, user)
    }
}
```

### 陷阱 3：Map 遍历顺序

```go
m := map[string]int{"a": 1, "b": 2, "c": 3}

// ⚠️ Map 遍历顺序是随机的！
for key, value := range m {
    fmt.Println(key, value)  // 每次运行顺序可能不同
}

// ✅ 如需有序遍历，先排序 keys
keys := make([]string, 0, len(m))
for k := range m {
    keys = append(keys, k)
}
sort.Strings(keys)
for _, k := range keys {
    fmt.Println(k, m[k])
}
```

---

## 5. 最佳实践建议

### 推荐用法

```go
users := []User{{Name: "Alice"}, {Name: "Bob"}}

// ✅ 只读遍历：用 range
for _, user := range users {
    fmt.Println(user.Name)
}

// ✅ 需要索引：用 range
for i, user := range users {
    fmt.Printf("%d: %s\n", i, user.Name)
}

// ✅ 修改元素：用索引访问
for i := range users {
    users[i].Age += 1
}

// ✅ 需要指针：显式获取
for i := range users {
    user := &users[i]
    user.Age += 1
}

// ✅ 复杂循环控制：用传统 for
for i := 0; i < len(users); i += 2 {  // 每次跳2个
    fmt.Println(users[i])
}
```

---

## 6. 完整对比表

| 特性 | `for range` | 传统 `for` |
|------|------------|-----------|
| **简洁性** | ✅ 简洁 | ❌ 冗长 |
| **安全性** | ✅ 自动边界检查 | ⚠️ 需手动检查 |
| **值拷贝** | ⚠️ 返回副本 | ✅ 直接访问 |
| **遍历类型** | ✅ slice/array/map/channel/string | ❌ 仅 slice/array |
| **修改元素** | ❌ 需通过索引 | ✅ 直接修改 |
| **步长控制** | ❌ 固定步长 1 | ✅ 灵活控制 |
| **性能（小对象）** | ✅ 相近 | ✅ 相近 |
| **性能（大结构体）** | ⚠️ 略慢 | ✅ 略快 |

---

## 7. 选择建议

```go
// 场景1：只读遍历 → 用 range
for _, user := range users {
    fmt.Println(user.Name)
}

// 场景2：需要修改 → 用 range + 索引
for i := range users {
    users[i].Age++
}

// 场景3：遍历 map → 必须用 range
for key, value := range myMap {
    // ...
}

// 场景4：需要步长控制 → 用传统 for
for i := 0; i < len(users); i += 2 {
    // ...
}

// 场景5：无限循环 → 用 for {}
for {
    // ...
    if condition {
        break
    }
}
```

---

## 总结

**核心区别：**
1. `for range` 返回**副本**，传统 `for` 直接访问
2. `for range` 可遍历更多类型（map、channel、string）
3. `for range` 更安全简洁，传统 `for` 更灵活

**选择原则：**
- 默认用 `for range`（简洁安全）
- 需要修改元素时用 `for i := range` + 索引访问
- 需要特殊步长时用传统 `for`
