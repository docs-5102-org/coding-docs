---
title: 语言特性
category:
  - 面试题
tag:
  - Python
order: 1
date: 2025-11-28
---

# Python 语言特性

## 1 Python 的函数参数传递

看两个例子：

```python
a = 1
def fun(a):
    a = 2
fun(a)
print(a)  # 1
```

```python
a = []
def fun(a):
    a.append(1)
fun(a)
print(a)  # [1]
```

所有的变量都可以理解为内存中一个对象的"引用"。通过 `id` 来看引用 `a` 的内存地址可以更好地理解：

```python
a = 1
def fun(a):
    print("func_in", id(a))         # func_in 41322472
    a = 2
    print("re-point", id(a), id(2)) # re-point 41322448 41322448
print("func_out", id(a), id(1))     # func_out 41322472 41322472
fun(a)
print(a)  # 1
```

执行完 `a = 2` 之后，`a` 引用中保存的内存地址发生变化，由原来 `1` 对象的地址变成了 `2` 的地址。

而第 2 个例子 `a` 引用保存的内存值不会发生变化：

```python
a = []
def fun(a):
    print("func_in", id(a))  # func_in 53629256
    a.append(1)
print("func_out", id(a))     # func_out 53629256
fun(a)
print(a)  # [1]
```

**核心要点**：

**类型属于对象，不属于变量** 变量只是一个名称/标签，它指向某个对象。对象本身携带了类型信息。

对象分为两种：

**不可变对象（str、tuple、int、float、bool**）——一旦创建，对象的值就无法改变。"修改"时实际上是创建了一个新对象，让变量指向新对象。
**可变对象（list、dict、set**）——可以在原地修改对象内容，所有指向该对象的变量都会看到变化。

当一个引用传递给函数时，函数自动复制一份引用。对于不可变对象，函数内重新赋值不影响外部；对于可变对象，函数内直接修改（如 append）会影响外部，因为操作的是同一块内存地址。

---

## 2 Python 中的元类（metaclass）

元类是创建类的类。Python 中类本身也是对象，元类控制类的创建行为。

```python
class MyMeta(type):
    def __new__(mcs, name, bases, namespace):
        # 在类创建时可以修改类的属性
        namespace['greet'] = lambda self: f"Hello from {name}"
        return super().__new__(mcs, name, bases, namespace)

class MyClass(metaclass=MyMeta):
    pass

obj = MyClass()
print(obj.greet())  # Hello from MyClass
```

元类的典型应用场景：ORM 框架（如 Django ORM、SQLAlchemy）在定义 Model 时自动注册字段、Django 的 `ModelBase` 等。

---

## 3 @staticmethod 和 @classmethod

Python 有 3 种方法：实例方法、类方法（classmethod）和静态方法（staticmethod）。

```python
class A(object):
    def foo(self, x):
        print(f"executing foo({self}, {x})")

    @classmethod
    def class_foo(cls, x):
        print(f"executing class_foo({cls}, {x})")

    @staticmethod
    def static_foo(x):
        print(f"executing static_foo({x})")

a = A()
```

| 调用方式   | 实例方法       | 类方法             | 静态方法             |
| :------- | :----------- | :--------------- | :----------------- |
| `a = A()` | `a.foo(x)`   | `a.class_foo(x)` | `a.static_foo(x)` |
| `A`       | 不可用         | `A.class_foo(x)` | `A.static_foo(x)` |

**区别总结：**

- **实例方法**：第一个参数是 `self`，代表实例本身，可以访问实例属性和类属性。
- **类方法**：第一个参数是 `cls`，代表类本身，常用于工厂方法（替代构造函数）。
- **静态方法**：不需要绑定实例或类，逻辑上属于类但不依赖类或实例状态。

---

## 4 类变量和实例变量

- **类变量**：所有实例共享，定义在类体中、方法之外。
- **实例变量**：每个实例独有，通过 `self.xxx` 定义。

```python
class Test(object):
    num_of_instance = 0  # 类变量
    def __init__(self, name):
        self.name = name  # 实例变量
        Test.num_of_instance += 1

t1 = Test('jack')
t2 = Test('lucy')
print(t1.name, t1.num_of_instance)  # jack 2
print(t2.name, t2.num_of_instance)  # lucy 2
```

**注意**：当类变量是可变对象（list、dict）时，所有实例共享同一个对象，修改会相互影响：

```python
class Person:
    name = []

p1 = Person()
p2 = Person()
p1.name.append(1)
print(p1.name)     # [1]
print(p2.name)     # [1]  ← 受到影响
print(Person.name) # [1]
```

**最佳实践**：使用 `self` 定义实例变量，用类名或 `cls` 定义类变量，可变类变量慎用。

---

## 5 Python 自省

自省是指程序在运行时能够获取对象的类型和属性信息。常用方法：

```python
a = [1, 2, 3]
b = {'a': 1, 'b': 2}
c = True

print(type(a))         # <class 'list'>
print(isinstance(a, list))  # True
print(dir(a))          # 列出对象所有属性和方法
print(hasattr(a, 'append'))  # True
print(getattr(a, 'append'))  # <built-in method append ...>
```

| 方法           | 作用                           |
| :----------- | :--------------------------- |
| `type(obj)`  | 返回对象的类型                     |
| `isinstance(obj, cls)` | 判断对象是否是某类或其子类的实例 |
| `dir(obj)`   | 返回对象所有属性和方法列表               |
| `hasattr(obj, name)` | 判断对象是否有某个属性         |
| `getattr(obj, name)` | 获取对象的某个属性值           |

## Python是静态语言还是动态语言，和JAva的区别是什么？

| 语言 | 强/弱类型 | 静态/动态 |
|---|---|---|
| Java | 强类型 | 静态 |
| Python | 强类型 | 动态 |
| JavaScript | 弱类型 | 动态 |
| C | 弱类型 | 静态 |

---

## 6 字典推导式

Python 2.7+ 支持字典推导式（类似列表推导式）：

```python
# 基本用法
d = {key: value for key, value in iterable.items()}

# 示例：值乘以 2
d = {'a': 1, 'b': 2, 'c': 3}
doubled = {k: v * 2 for k, v in d.items()}
print(doubled)  # {'a': 2, 'b': 4, 'c': 6}

# 带条件过滤
filtered = {k: v for k, v in d.items() if v > 1}
print(filtered)  # {'b': 2, 'c': 3}
```

---

## 7 Python 中单下划线和双下划线

```python
class MyClass():
    def __init__(self):
        self.__superprivate = "Hello"   # 双下划线，名称改写
        self._semiprivate = ", world!"  # 单下划线，约定私有

mc = MyClass()
print(mc._semiprivate)         # , world!
print(mc.__dict__)             # {'_MyClass__superprivate': 'Hello', '_semiprivate': ', world!'}
# print(mc.__superprivate)     # AttributeError
print(mc._MyClass__superprivate)  # Hello（仍可通过改写后的名称访问）
```

| 命名方式      | 含义                                                  |
| :---------- | :-------------------------------------------------- |
| `__foo__`   | Python 内置魔法方法，如 `__init__`、`__str__`，不要自定义同名方法  |
| `_foo`      | 约定私有，不会被 `from module import *` 导入，但仍可直接访问       |
| `__foo`     | 名称改写（Name Mangling），解析器将其改为 `_ClassName__foo`，防止子类意外覆盖 |

---

## 8 字符串格式化：%、.format 和 f-string

Python 提供三种字符串格式化方式：

```python
name = "小明"
age = 20

# 方式一：% 格式化（较旧，不推荐）
print("姓名: %s, 年龄: %d" % (name, age))

# 方式二：str.format()（Python 2.6+）
print("姓名: {}, 年龄: {}".format(name, age))
print("姓名: {name}, 年龄: {age}".format(name=name, age=age))

# 方式三：f-string（Python 3.6+，推荐）
print(f"姓名: {name}, 年龄: {age}")
print(f"明年 {age + 1} 岁")  # 支持表达式
```

**`%` 格式化的坑**：当变量恰好是元组时会报错：

```python
name = (1, 2, 3)
# "hi %s" % name      # TypeError！
"hi %s" % (name,)     # 正确：包一层元组
```

**性能对比**（从快到慢）：

```
f-string > str.format() > % 格式化
```

**推荐使用 f-string**，可读性最好、性能最高、支持任意 Python 表达式。

---

## 9 迭代器和生成器

**迭代器**：实现了 `__iter__` 和 `__next__` 方法的对象。

**生成器**：用 `yield` 关键字创建的特殊迭代器，惰性计算，节省内存。

```python
# 列表推导式（立即创建，占内存）
L = [x * x for x in range(10)]

# 生成器表达式（惰性计算，节省内存）
g = (x * x for x in range(10))
print(g)  # <generator object <genexpr> at 0x...>
```

**yield 示例**：

```python
# 示例1
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

gen = fibonacci()
print([next(gen) for _ in range(8)])  # [0, 1, 1, 2, 3, 5, 8, 13]


# 示例2
def gen():
    print("第一段")
    yield 1          # ← 暂停①，交出 1
    print("第二段")
    yield 2          # ← 暂停②，交出 2
    print("第三段")
    # 函数结束，抛出 StopIteration

g = gen()

print(next(g))   # 打印"第一段"，返回 1，然后冻结在 yield 1 这行
print(next(g))   # 从冻结处醒来，打印"第二段"，返回 2，冻结在 yield 2
print(next(g))   # 从冻结处醒来，打印"第三段"，函数结束 → StopIteration
```

**生成器 vs 列表的选择**：
- 数据量大、只需遍历一次 → 用生成器
- 需要随机访问、多次遍历 → 用列表

---

## 10 `*args` 和 `**kwargs`

- `*args`：接收任意数量的位置参数，存为元组
- `**kwargs`：接收任意数量的关键字参数，存为字典

```python
def print_everything(*args):
    for count, thing in enumerate(args):
        print(f"{count}. {thing}")

print_everything('apple', 'banana', 'cabbage')
# 0. apple
# 1. banana
# 2. cabbage

def table_things(**kwargs):
    for name, value in kwargs.items():
        print(f"{name} = {value}")

table_things(apple='fruit', cabbage='vegetable')
# apple = fruit
# cabbage = vegetable
```

**混合使用的顺序规则**：

```python
def func(positional, *args, keyword_only, **kwargs):
    pass
```

顺序必须是：**普通参数 → `*args` → keyword-only 参数 → `**kwargs`**

**解包调用**：

```python
def print_three(a, b, c):
    print(f"a={a}, b={b}, c={c}")

# 序列解包（List Unpacking）：*mylist 使得列表中的每个元素对应到函数的参数
mylist = ['x', 'y', 'z']
print_three(*mylist)   # a=x, b=y, c=z

# 字典解包（Dictionary Unpacking）：**mydict 使得字典中的键值对对应到函数的参数
mydict = {'a': 1, 'b': 2, 'c': 3}
print_three(**mydict)  # a=1, b=2, c=3
```

---

## 11 面向切面编程（AOP）和装饰器

装饰器是一种设计模式，用于在不修改原函数代码的情况下，为函数添加额外功能。常见场景：日志、性能测试、权限校验、缓存。

```python
import time
import functools

def timer(func):
    @functools.wraps(func)  # 保留原函数的元信息
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} 耗时 {end - start:.4f}s")
        return result
    return wrapper

@timer
def slow_func():
    time.sleep(0.1)

slow_func()  # slow_func 耗时 0.1001s
```

**带参数的装饰器**：

```python
def repeat(n):  # 外层函数接外部 n 参数，必须包裹一层，不然无法传递参数
    def decorator(func):  # 装饰器本身接收 原 func 函数
        @functools.wraps(func)  # 保留原函数的元信息
        def wrapper(*args, **kwargs):  # 这个是包装函数，接收原函数的参数
            for _ in range(n):  # 根据传入的 n 控制执行次数
                func(*args, **kwargs)  # 执行原函数
        return wrapper  # 返回包装后的函数
    return decorator  # 返回一个装饰器

@repeat(3)
def say_hello():
    print("Hello!")

say_hello()  # 打印 3 次 Hello!
```

> 注意：务必使用 `@functools.wraps(func)`，否则装饰后函数的 `__name__`、`__doc__` 等元信息会丢失。

---

## 12 鸭子类型（Duck Typing）

> "当看到一只鸟走起来像鸭子、游泳起来像鸭子、叫起来也像鸭子，那么这只鸟就可以被称为鸭子。"

Python 不关心对象的具体类型，只关心它是否具有所需的方法或属性。

```python
class Duck:
    def quack(self):
        print("嘎嘎嘎")

class Person:
    def quack(self):
        print("我在模仿鸭子")

def make_it_quack(duck):
    duck.quack()  # 不关心类型，只关心有没有 quack 方法

make_it_quack(Duck())    # 嘎嘎嘎
make_it_quack(Person())  # 我在模仿鸭子
```

**典型应用**：`list.extend()` 接受任何可迭代对象（list/tuple/dict/字符串/生成器），不要求具体类型。

---

## 13 Python 中的重载

Python **不支持函数重载**，但通过以下方式解决同类问题：

1. **可变参数类型**：Python 动态类型天然支持，一个函数可接受多种类型参数。
2. **可变参数个数**：使用默认参数或 `*args` 解决。

```python
def add(a, b, c=0):
    return a + b + c

print(add(1, 2))    # 3
print(add(1, 2, 3)) # 6
```

Python 3.8+ 可以用 `functools.singledispatch` 实现类似重载的效果：

```python
from functools import singledispatch

@singledispatch
def process(arg):
    print(f"默认处理: {arg}")

@process.register(int)
def _(arg):
    print(f"整数处理: {arg * 2}")

@process.register(str)
def _(arg):
    print(f"字符串处理: {arg.upper()}")

process(10)      # 整数处理: 20
process("hello") # 字符串处理: HELLO
```

---

## 14 新式类和旧式类

- **Python 2**：不继承 `object` 的类是旧式类，继承 `object` 的是新式类。
- **Python 3**：所有类默认继承 `object`，全部是新式类。

**MRO（Method Resolution Order/方法解析顺序）的差异**：

- 旧式类：**深度优先、从左到右**
- 新式类：**C3 线性化算法**（并非简单的广度优先）

```python
# 旧式类（Python 2）深度优先的问题
class A:
    def foo(self): print("A")
class B(A):
    pass
class C(A):
    def foo(self): print("C")
class D(B, C):
    pass

d = D()
d.foo()
# 旧式类输出：A（深度优先：D→B→A，C的重写被绕过）
# 新式类输出：C（C3算法：D→B→C→A）
```

查看 MRO 顺序：

```python
print(D.__mro__)
# (<class '__main__.D'>, <class '__main__.B'>, <class '__main__.C'>, <class '__main__.A'>, <class 'object'>)
```

---

## 15 `__new__` 和 `__init__` 的区别

| 对比项   | `__new__`              | `__init__`         |
| :------ | :--------------------- | :----------------- |
| 类型     | 静态方法               | 实例方法           |
| 调用时机 | 创建实例时（先调用）   | 实例创建后初始化   |
| 返回值   | 返回新建的实例对象     | 无返回值（None）   |
| 用途     | 控制实例的创建过程     | 初始化实例属性     |

```python
class MyClass:
    def __new__(cls, *args, **kwargs):
        print("__new__ 被调用")
        instance = super().__new__(cls)
        return instance

    def __init__(self, value):
        print("__init__ 被调用")
        self.value = value

obj = MyClass(42)
# __new__ 被调用
# __init__ 被调用
```

> 只有当 `__new__` 返回 `cls` 的实例时，`__init__` 才会被调用。

:::tip

没有 `__new__` 的话，Python 会自动调用从 `object` 继承来的默认 `__new__`，行为完全一样，只是你看不到那行 print。

```python
class MyClass:
    def __init__(self, value):
        print("__init__ 被调用")
        self.value = value

obj = MyClass(42)
# __init__ 被调用
```

背后发生的事情：

```
MyClass(42)
    │
    ├─ 1. 调用 object.__new__(MyClass)   ← 隐式，分配内存，创建实例
    │
    └─ 2. 调用 MyClass.__init__(obj, 42) ← 显式定义，初始化属性
```

**总结：`__new__` 始终会被调用**，只是没有自定义时用的是 `object.__new__`，你感知不到而已。

通常只有在这几种情况下才需要自定义 `__new__`：
- 实现单例模式
- 继承不可变类型（如 `int`、`str`、`tuple`）
- 元类编程
- super().__new__(cls) 就是调用 object.__new__(cls)，作用是向操作系统申请内存，创建一个真正的空实例。

普通类直接写 `__init__` 就够了。

:::

---

## 16 单例模式

单例模式保证一个类只有一个实例。**面试高频手写题，至少记住 1~2 种写法。**

### 方式一：使用 `__new__`，线程不安全

```python
class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

s1 = Singleton()
s2 = Singleton()
print(s1 is s2)  # True
```

### 方式二：装饰器

```python
def singleton(cls):
    instances = {}
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    return get_instance

@singleton
class MyClass:
    pass
```

### 方式三：模块级别（最 Pythonic）

Python 模块天然是单例，模块在第一次导入时执行，之后都从缓存中取：

```python
# mysingleton.py
class _Singleton:
    def foo(self):
        pass

instance = _Singleton()

# 使用时
from mysingleton import instance
instance.foo()
```

:::tip

重点在于 **Python 的模块导入机制**：

```
第一次 import mysingleton
    │
    ├─ 执行整个 mysingleton.py 文件
    │   ├─ 定义 _Singleton 类
    │   └─ instance = _Singleton()  ← 只在这里创建了一次实例
    │
    └─ 把模块存入 sys.modules 缓存

第二次 import mysingleton
    │
    └─ 直接从 sys.modules 取，不再执行文件  ← 所以不会再创建新实例
```

---

举个具体例子验证：

```python
# mysingleton.py
class _Singleton:
    def foo(self):
        pass

instance = _Singleton()
print(f"模块被执行了，instance id = {id(instance)}")
```

```python
# a.py
from mysingleton import instance
print(f"a.py 拿到的 id = {id(instance)}")
```

```python
# b.py
from mysingleton import instance
print(f"b.py 拿到的 id = {id(instance)}")
```

```python
# main.py
import a
import b

# 输出：
# 模块被执行了，instance id = 140234567   ← 只打印一次！
# a.py 拿到的 id = 140234567
# b.py 拿到的 id = 140234567              ← 三个 id 完全相同
```

---

**所以"天然单例"的意思是：**

不需要任何特殊代码，`a.py` 和 `b.py` 拿到的 `instance` 就是同一个对象，因为模块文件永远只执行一次。

:::

### 方式四：线程安全的单例（双重检查锁）

```python
import threading

class Singleton:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
```

---

## 17 Python 中的作用域（LEGB 规则）

Python 变量查找顺序（LEGB）：

```
Local（本地）→ Enclosing（闭包外层）→ Global（全局/模块）→ Built-in（内置）
```

```python
x = "global"

def outer():
    x = "enclosing"
    def inner():
        x = "local"
        print(x)  # local
    inner()
    print(x)  # enclosing

outer()
print(x)  # global
```

**`global` 和 `nonlocal` 关键字**：

```python
count = 0
def increment():
    global count   # 声明使用全局变量
    count += 1

def outer():
    x = 0
    def inner():
        nonlocal x  # 声明使用外层函数变量
        x += 1
    inner()
    print(x)  # 1
```

---

## 18 GIL 线程全局锁

GIL（Global Interpreter Lock）是 CPython 解释器的一把互斥锁，保证同一时刻只有一个线程执行 Python 字节码。

**影响：**

- **IO 密集型任务**（网络请求、文件读写）：多线程有效，线程在 IO 等待时会释放 GIL。
- **CPU 密集型任务**（数值计算、图像处理）：多线程几乎无法提升性能，甚至因为锁竞争更慢。

**解决方案：**

| 场景         | 推荐方案               |
| :---------- | :------------------- |
| IO 密集型   | `threading` 或 `asyncio` |
| CPU 密集型  | `multiprocessing`（多进程，绕过 GIL） |
| 高性能计算  | `NumPy`（底层 C 实现，释放 GIL）、`Cython`、`C 扩展` |

> **Python 3.12+ 新进展**：引入了 per-interpreter GIL（PEP 684），每个子解释器可以有独立的 GIL，为真正的多核并行铺路。Python 3.13 开始实验性支持禁用 GIL（free-threaded 模式）。

---

## 19 协程

协程是用户态的轻量级并发，由程序自己控制切换时机，避免内核态/用户态切换的开销。

```python
import asyncio

async def fetch_data(name, delay):
    print(f"{name} 开始")
    await asyncio.sleep(delay)  # 模拟 IO 操作，释放控制权
    print(f"{name} 完成")
    return f"{name} 的结果"

async def main():
    # 并发执行多个协程
    results = await asyncio.gather(
        fetch_data("任务A", 2),
        fetch_data("任务B", 1),
    )
    print(results)

asyncio.run(main())
# 任务A 开始
# 任务B 开始
# 任务B 完成
# 任务A 完成
```

**协程 vs 线程 vs 进程：**

| 对比项   | 协程        | 线程         | 进程         |
| :------ | :--------- | :---------- | :---------- |
| 切换开销 | 极小（用户态）| 较小（内核态）| 大（内核态） |
| 适用场景 | IO 密集型   | IO 密集型    | CPU 密集型   |
| 数据共享 | 无需锁      | 需要锁        | 需要 IPC     |

---

## 20 闭包

闭包是指内嵌函数引用了外部函数的变量，且外部函数返回该内嵌函数后，被引用的变量不会被回收。

**创建闭包的三个条件：**

1. 存在内嵌函数
2. 内嵌函数引用了外部函数的变量
3. 外部函数返回内嵌函数

```python
def make_counter():
    count = 0
    def counter():
        nonlocal count
        count += 1
        return count
    return counter

c = make_counter()
print(c())  # 1
print(c())  # 2
print(c())  # 3
```

**闭包的典型应用——装饰器：**

```python
import time

def timer(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"耗时: {time.time() - start:.4f}s")
        return result
    return wrapper  # wrapper 就是一个闭包，引用了外层的 func
```

---

## 21 lambda 函数

lambda 是匿名函数，适合简单的一次性操作。

```python
f = lambda x: x * x
print(f(4))  # 16

g = lambda x, y: x + y
print(g(1, 2))  # 3

# 配合高阶函数使用
nums = [3, 1, 4, 1, 5, 9, 2, 6]
print(sorted(nums, key=lambda x: -x))  # 降序排列
print(sorted(nums, reverse=True))       # 等价写法
```

**lambda 的限制：**

- 只能有一个表达式，不能有语句（如 `if`/`for`/`return`）
- 调试困难（没有函数名）
- 不适合复杂逻辑，建议用具名函数

---

## 22 Python 函数式编程

Python 提供 `filter`、`map`、`reduce` 支持函数式编程。

```python
from functools import reduce

a = [1, 2, 3, 4, 5, 6, 7]

# filter：过滤
b = list(filter(lambda x: x > 5, a))
print(b)  # [6, 7]

# map：映射
c = list(map(lambda x: x * 2, a))
print(c)  # [2, 4, 6, 8, 10, 12, 14]

# reduce：累积
d = reduce(lambda x, y: x * y, range(1, 6))
print(d)  # 120（5的阶乘）
```

> **现代 Python 推荐**：列表推导式和生成器表达式往往比 `map`/`filter` 更具可读性。

```python
# map 的等价写法
c = [x * 2 for x in a]

# filter 的等价写法
b = [x for x in a if x > 5]
```

---

## 23 Python 里的拷贝

```python
import copy

a = [1, 2, 3, 4, ['x', 'y']]

b = a                  # 赋值：引用同一对象
c = copy.copy(a)       # 浅拷贝：新对象，但内部嵌套对象仍共享
d = copy.deepcopy(a)   # 深拷贝：完全独立的新对象

a.append(5)
a[4].append('z')

print('a =', a)  # [1, 2, 3, 4, ['x', 'y', 'z'], 5]
print('b =', b)  # [1, 2, 3, 4, ['x', 'y', 'z'], 5]  ← 与 a 完全同步
print('c =', c)  # [1, 2, 3, 4, ['x', 'y', 'z']]     ← 嵌套列表受影响，但 append(5) 没影响
print('d =', d)  # [1, 2, 3, 4, ['x', 'y']]           ← 完全独立
```

| 操作方式    | 说明                                       |
| :-------- | :---------------------------------------- |
| 赋值 `b=a` | 两个变量指向同一对象，完全同步              |
| 浅拷贝     | 新建外层对象，内部嵌套对象仍是引用（共享）   |
| 深拷贝     | 递归拷贝所有层次，完全独立                  |

---

## 24 Python 垃圾回收机制

Python GC 采用三种机制结合：

### 1 引用计数（主要机制，始终开启的）

每个对象维护一个 `ob_refcnt` 计数器，引用增加时 +1，引用删除时 -1，计数归零则立即回收。

**优点**：简单、实时性强。  
**缺点**：无法解决循环引用，且维护计数有额外开销。

### 2 标记-清除（解决循环引用）

针对容器对象（list、dict、set 等）可能产生的循环引用，定期从根对象出发遍历引用图，标记可达对象，清除不可达对象。

```python
# 循环引用示例
a = []
b = []
a.append(b)
b.append(a)
del a, b  # 引用计数不为 0，但实际已无法访问
# 标记-清除机制会处理这种情况
```

### 3 分代回收（提升效率）

将对象按存活时间分为 3 代（generation 0/1/2），新对象在第 0 代，存活越久升到越高代，高代的 GC 频率越低。


三个阈值的含义：

```
(700, 10, 10)
  │     │   └─ 第2代：第1代回收了10次，触发第2代回收
  │     └─── 第1代：第0代回收了10次，触发第1代回收
  └───────── 第0代：新分配对象数 - 回收对象数 > 700，触发第0代回收
```

常见配置：

```python
import gc

# 1. 调整阈值（对象多时可以调高，减少GC频率）
gc.set_threshold(1000, 15, 15)

# 2. 手动触发（在已知有大量垃圾时主动回收）
gc.collect()     # 回收所有代
gc.collect(0)    # 只回收第0代

# 3. 查看当前各代对象数量
print(gc.get_count())  # (234, 8, 3) ← 各代当前对象数

# 4. 完全关闭（高性能场景，自己保证无循环引用）
gc.disable()
gc.enable()
```

实际场景怎么选：

```
默认不动
    适合大多数场景，无需配置

gc.disable()
    适合：科学计算、游戏循环等对延迟敏感的场景
    前提：代码中没有循环引用

调高阈值 set_threshold(2000, 20, 20)
    适合：短生命周期对象很多（如 web 服务器每次请求创建大量对象）
    效果：减少 GC 打断频率

手动 gc.collect()
    适合：已知某个操作后产生大量垃圾（如处理完一个大文件）
    在合适时机主动回收，而不是让 GC 随机打断
```

查看 GC 详情（调试用）：

```python
import gc

gc.set_debug(gc.DEBUG_STATS)    # 打印每次GC统计
gc.set_debug(gc.DEBUG_LEAK)     # 打印内存泄漏对象
gc.collect()

# 输出类似：
# gc: collecting generation 2...
# gc: objects in each generation: 412 412 412
# gc: done, 0.0004s elapsed
```

---

## Python 的 List

Python list 是基于**动态数组**实现的，支持随机访问（O(1)），但插入/删除中间元素需要移动数据（O(n)）。

| 操作              | 时间复杂度 |
| :--------------- | :-------- |
| `append(x)`      | O(1) 均摊 |
| `insert(i, x)`   | O(n)      |
| `pop()`          | O(1)      |
| `pop(i)`         | O(n)      |
| `x in list`      | O(n)      |
| `list[i]`        | O(1)      |
| `len(list)`      | O(1)      |

**扩容机制**：当容量不足时，Python 会按大约 1.125 倍的比例扩容（并非每次 +1），以减少频繁内存分配。

---

## Python 的 `is` 和 `==`

- `==`：比较**值**是否相等（调用 `__eq__` 方法）
- `is`：比较**内存地址**（对象标识）是否相同

```python
a = [1, 2, 3]
b = [1, 2, 3]
c = a

print(a == b)  # True  （值相同）
print(a is b)  # False （不同对象）
print(a is c)  # True  （同一对象）
```

**注意小整数缓存**：Python 对 `-5 ~ 256` 的整数做了缓存，`is` 比较可能为 True，但不要依赖这个行为：

```python
x = 256
y = 256
print(x is y)  # True（缓存范围内）

x = 257
y = 257
print(x is y)  # False（超出缓存范围）
```

> **最佳实践**：比较值用 `==`，判断是否是 `None`/`True`/`False` 用 `is`（`if x is None`）。

---

## read、readline 和 readlines

```python
with open('file.txt', 'r') as f:
    content = f.read()       # 读取整个文件为字符串

with open('file.txt', 'r') as f:
    line = f.readline()      # 读取一行（含换行符）

with open('file.txt', 'r') as f:
    lines = f.readlines()    # 读取所有行，返回列表
```

| 方法          | 返回类型 | 适用场景                       |
| :----------- | :------- | :--------------------------- |
| `read()`     | str      | 小文件，需要整体处理           |
| `readline()` | str      | 逐行处理，内存敏感             |
| `readlines()`| list     | 需要随机访问行                 |

**大文件推荐**：直接迭代文件对象，内存最友好：

```python
with open('large_file.txt', 'r') as f:
    for line in f:  # 逐行读取，不会一次性加载到内存
        process(line)
```

> for line in f 能直接逐行读取，是因为文件对象本身就是一个迭代器，Python 自动帮你调用了 readline()。

---

## Python 2 和 Python 3 的主要区别

| 对比项         | Python 2                | Python 3                    |
| :------------ | :---------------------- | :-------------------------- |
| print         | `print "hello"`（语句）  | `print("hello")`（函数）    |
| 整除          | `5 / 2 = 2`             | `5 / 2 = 2.5`，`5 // 2 = 2` |
| 字符串        | 默认 ASCII，`unicode` 需声明 | 默认 Unicode（str 即 unicode） |
| range         | 返回列表                 | 返回惰性迭代器               |
| xrange        | 存在                    | 已删除（range 即 xrange）    |
| 异常语法      | `except E, e:`          | `except E as e:`            |
| super()       | `super(Class, self)`    | `super()`（无需参数）        |
| `__future__`  | 需要手动导入新特性       | 默认即新特性                 |

---

## super() 和 `__init__`

`super()` 用于调用父类方法，在多继承中尤为重要，配合 MRO 保证每个父类只初始化一次。

```python
class Animal:
    def __init__(self, name):
        self.name = name

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)  # 调用父类 __init__
        self.breed = breed

d = Dog("旺财", "柴犬")
print(d.name, d.breed)  # 旺财 柴犬
```

**多继承中的 super()**：

```python
class A:
    def __init__(self):
        print("A init")
        super().__init__()

class B(A):
    def __init__(self):
        print("B init")
        super().__init__()

class C(A):
    def __init__(self):
        print("C init")
        super().__init__()

class D(B, C):
    def __init__(self):
        print("D init")
        super().__init__()

D()
# D init → B init → C init → A init
# 每个父类只初始化一次（C3 MRO 保证）
```

---

## 30 range 和 xrange

- **Python 2**：`range()` 返回列表，`xrange()` 返回惰性迭代器（内存更优）。
- **Python 3**：`xrange()` 已删除，`range()` 直接返回惰性迭代器（等同于 Python 2 的 xrange）。

```python
# Python 3
r = range(0, 10)
print(type(r))   # <class 'range'>
print(r[5])      # 5（支持随机访问）
print(list(r))   # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# 大范围也不占内存
for i in range(1_000_000): # 1000000（一百万），下划线只是视觉分隔符，不影响数值
    pass
```

---

## `__slots__`

`__slots__` 用于限制实例可以拥有的属性，避免动态创建 `__dict__`，从而节省内存。

每个普通类的实例都带一个 `__dict__`，本质就是一个字典，存所有实例属性。

```python
class Normal:
    def __init__(self, x, y):
        self.x = x
        self.y = y

obj = Normal(1, 2)
print(obj.__dict__)  # {'x': 1, 'y': 2}  ← 就是个字典
```

---

所以普通类可以随意增删属性：

```python
obj.z = 3           # 动态添加
print(obj.__dict__) # {'x': 1, 'y': 2, 'z': 3}

del obj.x           # 动态删除
print(obj.__dict__) # {'y': 2, 'z': 3}
```

---

`__slots__` 则是放弃 `__dict__`，改用固定的内存槽：

```python
class WithSlots:
    __slots__ = ['x', 'y']
    def __init__(self, x, y):
        self.x = x
        self.y = y

obj = WithSlots(1, 2)
print(obj.__dict__)  # AttributeError ← 没有 __dict__

obj.z = 3            # AttributeError ← 不能动态添加属性
```

---

**两者对比：**

```
Normal（有 __dict__）          WithSlots（有 __slots__）
    │                               │
    ├─ 灵活，可动态增删属性            ├─ 固定，只能用声明的属性
    ├─ 每个实例多一个字典对象           ├─ 无字典，内存更小
    └─ 内存占用较大                   └─ 访问速度更快
```

**适用场景**：大量实例时（如百万级对象），需要创建大量实例且属性固定时（如游戏中的粒子对象），用 `__slots__` 能显著节省内存。

---

## 上下文管理器

通过 `with` 语句使用，确保资源被正确释放（文件关闭、锁释放等）。

**实现方式一：`__enter__` 和 `__exit__`**

```python
class ManagedFile:
    def __init__(self, filename):
        self.filename = filename

    def __enter__(self):
        self.file = open(self.filename, 'r')
        return self.file

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.file.close()
        return False  # 不压制异常

with ManagedFile('test.txt') as f:
    print(f.read())
```

**实现方式二：`contextlib.contextmanager`（推荐）**

```python
from contextlib import contextmanager

@contextmanager
def managed_file(filename):
    f = open(filename, 'r')
    try:
        yield f
    finally:
        f.close()

with managed_file('test.txt') as f:
    print(f.read())
```

---

## Python 异常处理

```python
try:
    result = 10 / 0
except ZeroDivisionError as e:
    print(f"捕获异常: {e}")
except (TypeError, ValueError) as e:
    print(f"类型或值错误: {e}")
else:
    print("没有异常时执行")
finally:
    print("无论如何都执行（常用于清理资源）")
```

**自定义异常**：

```python
class BusinessError(Exception):
    def __init__(self, message, code=None):
        super().__init__(message)
        self.code = code

try:
    raise BusinessError("余额不足", code=1001)
except BusinessError as e:
    print(f"业务错误: {e}, 错误码: {e.code}")
```

**异常链（Python 3）**：

```python
try:
    int("abc")
except ValueError as e:
    raise RuntimeError("转换失败") from e
```