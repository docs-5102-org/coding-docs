---
title: Python 基础教程
category:
  - Python  
---

# Python 基础教程

## 目录

[[toc]]

---

## Python 简介

Python 是一种高级、解释型、通用的编程语言，由 Guido van Rossum 于 1991 年首次发布。

### 特点
- **简洁易读**：语法清晰，接近自然语言
- **跨平台**：支持 Windows、macOS、Linux 等系统
- **丰富的库**：拥有庞大的标准库和第三方库生态
- **多用途**：适用于 Web 开发、数据分析、人工智能、自动化等领域

### Python 应用领域
- Web 开发（Django、Flask）
- 数据科学（NumPy、Pandas、Matplotlib）
- 人工智能（TensorFlow、PyTorch）
- 自动化脚本
- 网络爬虫
- 游戏开发

---

## 环境搭建

### 1. 安装 Python

#### 官方安装方式
访问 [Python 官网](https://www.python.org/downloads/) 下载最新版本。

#### 包管理器安装
```bash
# macOS (使用 Homebrew)
brew install python

# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip

# CentOS/RHEL
sudo yum install python3 python3-pip
```

### 2. 验证安装
```bash
python3 --version
pip3 --version
```

### 3. 推荐开发环境
- **IDE**：PyCharm、VSCode
- **文本编辑器**：Sublime Text、Atom
- **在线环境**：Replit、Google Colab

---

## 基础语法

### Hello World
```python
print("Hello, World!")
```

### 注释
```python
# 单行注释

"""
多行注释
可以跨越多行
"""

'''
也可以使用单引号
'''
```

### 变量和赋值
```python
# 变量赋值
name = "Alice"
age = 25
height = 1.68
is_student = True

# 多重赋值
x, y, z = 1, 2, 3
a = b = c = 0
```

### 命名规则
- 变量名只能包含字母、数字和下划线
- 不能以数字开头
- 区分大小写
- 不能使用 Python 关键字

```python
# 正确的命名
user_name = "John"
age_2023 = 25
_private_var = "secret"

# 错误的命名（会报错）
# 2name = "error"
# class = "error"  # class 是关键字
```

---

## 数据类型

### 基本数据类型

#### 数字类型
```python
# 整数
integer_num = 42
negative_num = -10

# 浮点数
float_num = 3.14
scientific = 1.5e2  # 150.0

# 复数
complex_num = 3 + 4j
```

#### 字符串
```python
# 字符串定义
single_quote = 'Hello'
double_quote = "World"
triple_quote = """多行
字符串"""

# 字符串操作
name = "Python"
print(len(name))        # 长度：6
print(name[0])          # 索引：P
print(name[1:4])        # 切片：yth
print(name.upper())     # 大写：PYTHON
print(name.lower())     # 小写：python

# 字符串格式化
age = 25
message = f"我今年{age}岁"
print(message)

# format 方法
message2 = "我叫{name}，今年{age}岁".format(name="Alice", age=30)
print(message2)
```

#### 布尔类型
```python
is_true = True
is_false = False

# 布尔运算
print(True and False)   # False
print(True or False)    # True
print(not True)         # False
```

### 集合数据类型

#### 列表 (List)
```python
# 创建列表
fruits = ["apple", "banana", "orange"]
numbers = [1, 2, 3, 4, 5]
mixed = [1, "hello", 3.14, True]

# 列表操作
fruits.append("grape")      # 添加元素
fruits.insert(1, "kiwi")    # 插入元素
fruits.remove("banana")     # 删除元素
last_fruit = fruits.pop()   # 弹出最后元素

# 列表切片
print(numbers[1:4])         # [2, 3, 4]
print(numbers[:3])          # [1, 2, 3]
print(numbers[2:])          # [3, 4, 5]

# 列表推导式
squares = [x**2 for x in range(10)]
even_squares = [x**2 for x in range(10) if x % 2 == 0]
```

#### 元组 (Tuple)
```python
# 创建元组
point = (3, 4)
colors = ("red", "green", "blue")
single_tuple = (42,)  # 单元素元组需要逗号

# 元组解包
x, y = point
print(f"坐标：({x}, {y})")
```

#### 字典 (Dictionary)
```python
# 创建字典
person = {
    "name": "Alice",
    "age": 30,
    "city": "Beijing"
}

# 字典操作
person["email"] = "alice@email.com"     # 添加键值对
age = person.get("age", 0)              # 安全获取值
del person["city"]                      # 删除键值对

# 遍历字典
for key, value in person.items():
    print(f"{key}: {value}")

# 字典推导式
squares_dict = {x: x**2 for x in range(5)}
```

#### 集合 (Set)
```python
# 创建集合
colors = {"red", "green", "blue"}
numbers_set = set([1, 2, 3, 3, 4])  # 自动去重

# 集合操作
colors.add("yellow")
colors.remove("red")

# 集合运算
set1 = {1, 2, 3, 4}
set2 = {3, 4, 5, 6}
print(set1 & set2)  # 交集：{3, 4}
print(set1 | set2)  # 并集：{1, 2, 3, 4, 5, 6}
print(set1 - set2)  # 差集：{1, 2}
```

---

## 控制流程

### 条件语句
```python
# if-elif-else
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "D"

print(f"分数：{score}，等级：{grade}")

# 三元操作符
status = "通过" if score >= 60 else "不通过"
```

### 循环语句

#### for 循环
```python
# 遍历列表
fruits = ["apple", "banana", "orange"]
for fruit in fruits:
    print(fruit)

# 使用 range
for i in range(5):          # 0 到 4
    print(i)

for i in range(1, 6):       # 1 到 5
    print(i)

for i in range(0, 10, 2):   # 0, 2, 4, 6, 8
    print(i)

# enumerate 获取索引和值
for index, fruit in enumerate(fruits):
    print(f"{index}: {fruit}")
```

#### while 循环
```python
# while 循环
count = 0
while count < 5:
    print(f"计数：{count}")
    count += 1

# while-else
number = 10
while number > 0:
    if number == 5:
        break
    print(number)
    number -= 1
else:
    print("循环正常结束")
```

### 循环控制
```python
# break 和 continue
for i in range(10):
    if i == 3:
        continue    # 跳过当前迭代
    if i == 7:
        break       # 跳出循环
    print(i)
```

---

## 函数

### 函数定义
```python
def greet(name):
    """问候函数"""
    return f"Hello, {name}!"

# 调用函数
message = greet("Alice")
print(message)
```

### 参数类型
```python
# 默认参数
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

# 关键字参数
print(greet("Bob"))                    # Hello, Bob!
print(greet("Charlie", "Hi"))          # Hi, Charlie!
print(greet(greeting="Hey", name="David"))  # Hey, David!

# 可变参数
def sum_all(*numbers):
    return sum(numbers)

print(sum_all(1, 2, 3, 4))  # 10

# 关键字可变参数
def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=30, city="Beijing")
```

### Lambda 函数
```python
# lambda 函数
square = lambda x: x ** 2
print(square(5))  # 25

# 在高阶函数中使用
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x**2, numbers))
even_numbers = list(filter(lambda x: x % 2 == 0, numbers))
```

### 装饰器基础
```python
def timer(func):
    """简单的计时装饰器"""
    import time
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} 执行时间：{end - start:.4f}秒")
        return result
    return wrapper

@timer
def slow_function():
    import time
    time.sleep(1)
    return "完成"

slow_function()
```

---

## 模块和包

### 导入模块
```python
# 导入整个模块
import math
print(math.pi)

# 导入特定函数
from math import sqrt, pi
print(sqrt(16))

# 使用别名
import numpy as np
import matplotlib.pyplot as plt

# 导入所有（不推荐）
from math import *
```

### 创建模块
```python
# 文件：mymodule.py
def add(a, b):
    """加法函数"""
    return a + b

def multiply(a, b):
    """乘法函数"""
    return a * b

PI = 3.14159

if __name__ == "__main__":
    # 模块被直接运行时的代码
    print("模块测试")
    print(add(2, 3))
```

### 使用自定义模块
```python
# 在另一个文件中使用
import mymodule

result = mymodule.add(5, 3)
print(f"结果：{result}")
print(f"π的值：{mymodule.PI}")
```

---

## 面向对象编程

### 类和对象
```python
class Person:
    """人员类"""
    species = "Homo sapiens"  # 类变量
    
    def __init__(self, name, age):
        """构造方法"""
        self.name = name      # 实例变量
        self.age = age
    
    def introduce(self):
        """实例方法"""
        return f"我叫{self.name}，今年{self.age}岁"
    
    def have_birthday(self):
        """过生日"""
        self.age += 1
        return f"{self.name}现在{self.age}岁了"
    
    @classmethod
    def get_species(cls):
        """类方法"""
        return cls.species
    
    @staticmethod
    def is_adult(age):
        """静态方法"""
        return age >= 18

# 创建对象
person1 = Person("Alice", 25)
person2 = Person("Bob", 17)

# 使用对象
print(person1.introduce())
print(person1.have_birthday())
print(Person.is_adult(person2.age))
```

### 继承
```python
class Student(Person):
    """学生类，继承自Person"""
    
    def __init__(self, name, age, student_id):
        super().__init__(name, age)  # 调用父类构造方法
        self.student_id = student_id
    
    def introduce(self):
        """重写方法"""
        return f"我叫{self.name}，学号{self.student_id}，今年{self.age}岁"
    
    def study(self, subject):
        """学生特有方法"""
        return f"{self.name}正在学习{subject}"

# 使用继承
student = Student("Charlie", 20, "S001")
print(student.introduce())
print(student.study("Python"))
```

### 属性装饰器
```python
class Circle:
    def __init__(self, radius):
        self._radius = radius
    
    @property
    def radius(self):
        """获取半径"""
        return self._radius
    
    @radius.setter
    def radius(self, value):
        """设置半径"""
        if value < 0:
            raise ValueError("半径不能为负数")
        self._radius = value
    
    @property
    def area(self):
        """计算面积"""
        return 3.14159 * self._radius ** 2

# 使用属性
circle = Circle(5)
print(f"半径：{circle.radius}")
print(f"面积：{circle.area}")
circle.radius = 10  # 使用 setter
print(f"新面积：{circle.area}")
```

---

## 异常处理

### 基本异常处理
```python
try:
    number = int(input("请输入一个数字："))
    result = 10 / number
    print(f"结果：{result}")
except ValueError:
    print("请输入有效的数字！")
except ZeroDivisionError:
    print("不能除以零！")
except Exception as e:
    print(f"发生了未知错误：{e}")
else:
    print("计算成功完成")
finally:
    print("清理工作（无论是否出错都会执行）")
```

### 抛出异常
```python
def validate_age(age):
    if age < 0:
        raise ValueError("年龄不能为负数")
    if age > 150:
        raise ValueError("年龄不能超过150岁")
    return True

try:
    validate_age(-5)
except ValueError as e:
    print(f"验证失败：{e}")
```

### 自定义异常
```python
class CustomError(Exception):
    """自定义异常类"""
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)

def check_password(password):
    if len(password) < 8:
        raise CustomError("密码长度至少为8位")
    return True

try:
    check_password("123")
except CustomError as e:
    print(f"密码错误：{e}")
```

---

## 文件操作

### 读取文件
```python
# 方法1：使用 with 语句（推荐）
with open('example.txt', 'r', encoding='utf-8') as file:
    content = file.read()
    print(content)

# 逐行读取
with open('example.txt', 'r', encoding='utf-8') as file:
    for line in file:
        print(line.strip())

# 读取所有行到列表
with open('example.txt', 'r', encoding='utf-8') as file:
    lines = file.readlines()
```

### 写入文件
```python
# 写入文本
with open('output.txt', 'w', encoding='utf-8') as file:
    file.write("Hello, World!\n")
    file.write("Python 文件操作\n")

# 追加内容
with open('output.txt', 'a', encoding='utf-8') as file:
    file.write("追加的内容\n")

# 写入多行
lines = ["第一行\n", "第二行\n", "第三行\n"]
with open('output.txt', 'w', encoding='utf-8') as file:
    file.writelines(lines)
```

### JSON 文件操作
```python
import json

# 写入 JSON
data = {
    "name": "Alice",
    "age": 30,
    "hobbies": ["reading", "coding", "music"]
}

with open('data.json', 'w', encoding='utf-8') as file:
    json.dump(data, file, ensure_ascii=False, indent=2)

# 读取 JSON
with open('data.json', 'r', encoding='utf-8') as file:
    loaded_data = json.load(file)
    print(loaded_data)
```

---

## 常用标准库

### datetime - 日期时间处理
```python
from datetime import datetime, date, timedelta

# 当前时间
now = datetime.now()
today = date.today()

# 格式化时间
formatted = now.strftime("%Y-%m-%d %H:%M:%S")
print(f"当前时间：{formatted}")

# 时间计算
future = now + timedelta(days=7, hours=3)
print(f"一周后：{future}")

# 解析时间字符串
parsed = datetime.strptime("2023-12-25", "%Y-%m-%d")
print(parsed)
```

### os - 操作系统接口
```python
import os

# 获取当前目录
current_dir = os.getcwd()
print(f"当前目录：{current_dir}")

# 列出目录内容
files = os.listdir('.')
print("文件列表：", files)

# 路径操作
file_path = os.path.join('folder', 'file.txt')
print(f"文件路径：{file_path}")

# 检查文件/目录是否存在
if os.path.exists('example.txt'):
    print("文件存在")

# 创建目录
if not os.path.exists('new_folder'):
    os.makedirs('new_folder')
```

### random - 随机数生成
```python
import random

# 随机整数
rand_int = random.randint(1, 10)
print(f"随机整数：{rand_int}")

# 随机浮点数
rand_float = random.random()  # 0.0 到 1.0
print(f"随机浮点数：{rand_float}")

# 从列表中随机选择
colors = ["red", "green", "blue", "yellow"]
chosen = random.choice(colors)
print(f"随机选择：{chosen}")

# 打乱列表
numbers = [1, 2, 3, 4, 5]
random.shuffle(numbers)
print(f"打乱后：{numbers}")
```

### collections - 专用容器数据类型
```python
from collections import Counter, defaultdict, namedtuple

# Counter：计数器
text = "hello world"
counter = Counter(text)
print(counter)  # Counter({'l': 3, 'o': 2, 'h': 1, 'e': 1, ' ': 1, 'w': 1, 'r': 1, 'd': 1})

# defaultdict：默认字典
dd = defaultdict(list)
dd['colors'].append('red')
dd['colors'].append('blue')
print(dict(dd))

# namedtuple：命名元组
Point = namedtuple('Point', ['x', 'y'])
p = Point(3, 4)
print(f"坐标：x={p.x}, y={p.y}")
```

---

## 最佳实践

### 代码风格 (PEP 8)
```python
# 好的代码风格
def calculate_area(length, width):
    """计算矩形面积"""
    return length * width

class BankAccount:
    """银行账户类"""
    
    def __init__(self, account_number, initial_balance=0):
        self.account_number = account_number
        self.balance = initial_balance
    
    def deposit(self, amount):
        """存款"""
        if amount > 0:
            self.balance += amount
            return True
        return False

# 常量用大写
MAX_RETRY_COUNT = 3
DEFAULT_TIMEOUT = 30

# 使用有意义的变量名
user_age = 25
is_authenticated = True
shopping_cart_items = []
```

### 错误处理
```python
# 具体的异常处理
def safe_divide(a, b):
    """安全除法"""
    try:
        return a / b
    except ZeroDivisionError:
        print("除数不能为零")
        return None
    except TypeError:
        print("参数必须为数字")
        return None

# 使用上下文管理器
class DatabaseConnection:
    def __enter__(self):
        print("连接数据库")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        print("关闭数据库连接")

with DatabaseConnection() as db:
    print("执行数据库操作")
```

### 性能优化
```python
# 使用列表推导式
numbers = range(1000)

# 好的方式
squares = [x**2 for x in numbers if x % 2 == 0]

# 避免的方式
squares_bad = []
for x in numbers:
    if x % 2 == 0:
        squares_bad.append(x**2)

# 使用生成器处理大数据
def large_data_generator():
    for i in range(1000000):
        yield i ** 2

# 只在需要时计算
gen = large_data_generator()
first_100 = [next(gen) for _ in range(100)]
```

---

## 进阶学习资源

### 官方资源
- [Python 官方教程](https://docs.python.org/3/tutorial/)
- [Python 标准库文档](https://docs.python.org/3/library/)
- [PEP 8 风格指南](https://www.python.org/dev/peps/pep-0008/)

### 开源教程推荐
- [廖雪峰 Python 教程](https://www.liaoxuefeng.com/wiki/1016959663602400)
- [菜鸟教程 Python3](https://www.runoob.com/python3/python3-tutorial.html)
- [Real Python](https://realpython.com/) - 英文，内容深入
- [Python Tricks by Dan Bader](https://realpython.com/python-tricks/)

### 实践项目建议
1. **命令行工具**：文件管理器、计算器
2. **Web 应用**：使用 Flask 或 Django 创建博客
3. **数据分析**：分析 CSV 数据，制作图表
4. **自动化脚本**：文件批处理、邮件发送
5. **API 开发**：RESTful API 服务

### 进阶主题
- **异步编程**：asyncio、async/await
- **数据科学**：NumPy、Pandas、Matplotlib
- **Web 框架**：Django、Flask、FastAPI
- **测试**：unittest、pytest
- **打包分发**：setuptools、pip、poetry

### 开发工具推荐
- **IDE**：PyCharm Professional、VSCode
- **代码质量**：Black（格式化）、flake8（检查）
- **虚拟环境**：venv、conda、poetry
- **版本控制**：Git
- **部署**：Docker、云平台

---

## 总结

这份教程涵盖了 Python 的核心概念和基础知识，从基本语法到面向对象编程。学习编程是一个渐进的过程，建议：

1. **动手实践**：每个概念都要亲自编码验证
2. **项目驱动**：通过实际项目巩固知识
3. **阅读文档**：养成查阅官方文档的习惯
4. **社区参与**：加入 Python 社区，交流学习
5. **持续学习**：Python 生态丰富，保持学习热情

记住：编程能力的提升需要大量的实践，不要急于求成，稳步前进就是最好的策略。

---

*本教程整合了 Python 官方教程和多个优秀开源教程的内容，适合初学者系统学习 Python 编程语言。*