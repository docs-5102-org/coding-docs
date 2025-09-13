---
title: Django 基础教程
category:
  - Python
tag:
  - Django
---

# Django 基础教程

## 目录

[[toc]]

## Django简介

Django是一个高级的Python Web框架，遵循"快速开发"和"DRY（Don't Repeat Yourself）"原则。它由经验丰富的开发者设计，解决了Web开发中的许多麻烦，让你能够专注于编写应用程序而无需重新发明轮子。

### Django的核心特性

- **完整的Web框架**：内置ORM、模板引擎、用户认证等
- **安全性**：自动防护SQL注入、跨站脚本攻击等常见安全问题
- **可扩展性**：适合从小型到大型项目
- **丰富的生态系统**：大量第三方包和插件

## 环境准备与安装

### 系统要求

- Python 3.8或更高版本
- pip包管理器
- 虚拟环境工具（推荐）

### Django与Python版本兼容性对应表

| Django版本 | 支持的Python版本 | 发布时间 | LTS版本 |
|------------|------------------|----------|---------|
| Django 5.1 | Python 3.10, 3.11, 3.12, 3.13 | 2024年8月 | ❌ |
| Django 5.0 | Python 3.10, 3.11, 3.12 | 2023年12月 | ❌ |
| Django 4.2 | Python 3.8, 3.9, 3.10, 3.11, 3.12 | 2023年4月 | ✅ LTS |
| Django 4.1 | Python 3.8, 3.9, 3.10, 3.11 | 2022年8月 | ❌ |
| Django 4.0 | Python 3.8, 3.9, 3.10, 3.11 | 2021年12月 | ❌ |
| Django 3.2 | Python 3.6, 3.7, 3.8, 3.9, 3.10 | 2021年4月 | ✅ LTS |
| Django 3.1 | Python 3.6, 3.7, 3.8, 3.9 | 2020年8月 | ❌ |
| Django 3.0 | Python 3.6, 3.7, 3.8, 3.9 | 2019年12月 | ❌ |
| Django 2.2 | Python 3.5, 3.6, 3.7, 3.8, 3.9 | 2019年4月 | ✅ LTS |
| Django 2.1 | Python 3.5, 3.6, 3.7 | 2018年8月 | ❌ |
| Django 2.0 | Python 3.4, 3.5, 3.6, 3.7 | 2017年12月 | ❌ |

#### 推荐组合（2025年）

**生产环境推荐：**
- **Django 4.2 LTS + Python 3.11/3.12** - 长期支持，稳定可靠
- **Django 5.1 + Python 3.12** - 最新功能，适合新项目

**学习和开发：**
- **Django 5.1 + Python 3.12** - 体验最新特性
- **Django 4.2 + Python 3.11** - 平衡稳定性和新功能

#### 重要说明

1. **LTS版本**：Django 4.2是当前的LTS版本，支持到2026年4月
2. **Python版本选择**：建议使用Python 3.11或3.12，性能更好且功能完善
3. **升级路径**：从旧版本升级时需要注意兼容性变化
4. **EOL时间**：Django 3.2 LTS将在2024年4月结束支持


### 1. 检查Python版本

```bash
python --version
# 或
python3 --version
```

### 2. 创建虚拟环境

使用虚拟环境可以为项目创建独立的Python环境，避免包冲突：

```bash
# 创建虚拟环境
python -m venv django_env

# 在Windows上激活
django_env\Scripts\activate

# 在macOS/Linux上激活
source django_env/bin/activate
```

### 3. 安装Django

```bash
# 安装最新版本的Django
pip install django

# 或安装指定版本
pip install django==4.2.7

# 验证安装
python -m django --version
```

### 4. 安装数据库驱动（可选）

Django默认使用SQLite，但你也可以安装其他数据库驱动：

```bash
# PostgreSQL
pip install psycopg2-binary

# MySQL
pip install mysqlclient

# Oracle
pip install cx_Oracle
```

## 创建第一个Django项目

### 1. 创建项目

```bash
# 创建项目
django-admin startproject myproject

# 进入项目目录
cd myproject
```

### 2. 运行开发服务器

```bash
# 启动开发服务器
python manage.py runserver

# 指定端口（可选）
python manage.py runserver 8080
```

访问 `http://127.0.0.1:8000`，你应该能看到Django的欢迎页面。

## Django项目结构

```
myproject/
    manage.py           # 命令行工具
    myproject/
        __init__.py     # Python包标识文件
        settings.py     # 项目配置文件
        urls.py         # 根URL配置
        wsgi.py         # WSGI部署配置
        asgi.py         # ASGI部署配置
```

### 重要文件说明

- **manage.py**：Django的命令行管理工具
- **settings.py**：项目的所有设置和配置
- **urls.py**：URL路由配置
- **wsgi.py/asgi.py**：部署时使用的配置文件

## 创建应用程序

Django项目由多个应用程序组成，每个应用程序处理特定的功能。

### 1. 创建应用

```bash
# 创建名为blog的应用
python manage.py startapp blog
```

### 2. 注册应用

在 `settings.py` 中添加应用：

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'blog',  # 新添加的应用
]
```

### 3. 应用程序结构

```
blog/
    __init__.py
    admin.py        # 管理后台配置
    apps.py         # 应用配置
    models.py       # 数据模型
    tests.py        # 测试文件
    views.py        # 视图函数
    migrations/     # 数据库迁移文件
```

## 模型与数据库

### 1. 定义模型

在 `blog/models.py` 中定义数据模型：

```python
from django.db import models
from django.contrib.auth.models import User

class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
```

### 2. 创建和应用迁移

```bash
# 创建迁移文件
python manage.py makemigrations

# 应用迁移到数据库
python manage.py migrate
```

### 3. 创建超级用户

```bash
python manage.py createsuperuser
```

### 4. 在管理后台注册模型

在 `blog/admin.py` 中：

```python
from django.contrib import admin
from .models import Post

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'created_at', 'published']
    list_filter = ['published', 'created_at']
    search_fields = ['title', 'content']
```

## 视图与URL配置

### 1. 创建视图

在 `blog/views.py` 中：

```python
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from .models import Post

def post_list(request):
    posts = Post.objects.filter(published=True)
    return render(request, 'blog/post_list.html', {'posts': posts})

def post_detail(request, id):
    post = get_object_or_404(Post, id=id, published=True)
    return render(request, 'blog/post_detail.html', {'post': post})
```

### 2. 配置URL

创建 `blog/urls.py`：

```python
from django.urls import path
from . import views

app_name = 'blog'
urlpatterns = [
    path('', views.post_list, name='post_list'),
    path('post/<int:id>/', views.post_detail, name='post_detail'),
]
```

在主项目的 `urls.py` 中包含应用URL：

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('blog.urls')),
]
```

## 模板系统

### 1. 创建模板目录

```bash
mkdir -p blog/templates/blog
```

### 2. 基础模板

创建 `blog/templates/blog/base.html`：

```html
<!DOCTYPE html>
<html>
<head>
    <title>{% block title %}My Blog{% endblock %}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
    <nav>
        <a href="{% url 'blog:post_list' %}">首页</a>
    </nav>
    
    <main>
        {% block content %}
        {% endblock %}
    </main>
</body>
</html>
```

### 3. 文章列表模板

创建 `blog/templates/blog/post_list.html`：

```html
{% extends 'blog/base.html' %}

{% block title %}文章列表{% endblock %}

{% block content %}
    <h1>最新文章</h1>
    {% for post in posts %}
        <article>
            <h2>
                <a href="{% url 'blog:post_detail' post.id %}">
                    {{ post.title }}
                </a>
            </h2>
            <p>作者：{{ post.author.username }}</p>
            <p>发布时间：{{ post.created_at|date:"Y-m-d H:i" }}</p>
            <p>{{ post.content|truncatewords:30 }}</p>
        </article>
        <hr>
    {% empty %}
        <p>暂无文章。</p>
    {% endfor %}
{% endblock %}
```

### 4. 文章详情模板

创建 `blog/templates/blog/post_detail.html`：

```html
{% extends 'blog/base.html' %}

{% block title %}{{ post.title }}{% endblock %}

{% block content %}
    <article>
        <h1>{{ post.title }}</h1>
        <p>作者：{{ post.author.username }}</p>
        <p>发布时间：{{ post.created_at|date:"Y-m-d H:i" }}</p>
        <div>
            {{ post.content|linebreaks }}
        </div>
    </article>
    <a href="{% url 'blog:post_list' %}">返回列表</a>
{% endblock %}
```

## 表单处理

### 1. 创建表单类

创建 `blog/forms.py`：

```python
from django import forms
from .models import Post

class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['title', 'content']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'content': forms.Textarea(attrs={'class': 'form-control', 'rows': 10}),
        }
```

### 2. 创建表单视图

在 `blog/views.py` 中添加：

```python
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from .forms import PostForm

@login_required
def post_create(request):
    if request.method == 'POST':
        form = PostForm(request.POST)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user
            post.save()
            return redirect('blog:post_detail', id=post.id)
    else:
        form = PostForm()
    return render(request, 'blog/post_form.html', {'form': form})
```

### 3. 表单模板

创建 `blog/templates/blog/post_form.html`：

```html
{% extends 'blog/base.html' %}

{% block title %}创建文章{% endblock %}

{% block content %}
    <h1>创建新文章</h1>
    <form method="post">
        {% csrf_token %}
        {{ form.as_p }}
        <button type="submit">发布</button>
        <a href="{% url 'blog:post_list' %}">取消</a>
    </form>
{% endblock %}
```

## 静态文件管理

### 1. 配置静态文件

在 `settings.py` 中确保有以下配置：

```python
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / "static",
]
```

### 2. 创建静态文件目录

```bash
mkdir -p static/css
mkdir -p static/js
mkdir -p static/images
```

### 3. 创建CSS文件

创建 `static/css/style.css`：

```css
body {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

nav {
    background-color: #f8f9fa;
    padding: 10px;
    margin-bottom: 20px;
}

article {
    margin-bottom: 30px;
}

.form-control {
    width: 100%;
    padding: 8px;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
}
```

### 4. 在模板中使用静态文件

在 `base.html` 中：

```html
{% load static %}
<!DOCTYPE html>
<html>
<head>
    <title>{% block title %}My Blog{% endblock %}</title>
    <link rel="stylesheet" type="text/css" href="{% static 'css/style.css' %}">
</head>
<!-- ... -->
```

## 用户认证系统

### 1. 使用内置认证视图

在主项目的 `urls.py` 中：

```python
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('django.contrib.auth.urls')),
    path('', include('blog.urls')),
]
```

### 2. 创建登录模板

创建 `templates/registration/login.html`：

```html
{% extends 'blog/base.html' %}

{% block title %}登录{% endblock %}

{% block content %}
    <h2>登录</h2>
    <form method="post">
        {% csrf_token %}
        {{ form.as_p }}
        <button type="submit">登录</button>
    </form>
    <p><a href="{% url 'password_reset' %}">忘记密码？</a></p>
{% endblock %}
```

### 3. 配置认证相关设置

在 `settings.py` 中：

```python
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'
```

## 部署准备

### 1. 安装部署相关包

```bash
pip install gunicorn
pip freeze > requirements.txt
```

### 2. 配置生产环境设置

创建 `settings_prod.py`：

```python
from .settings import *

DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']

# 数据库配置（示例）
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'your_db_name',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# 静态文件配置
STATIC_ROOT = '/path/to/static/'
```

### 3. 收集静态文件

```bash
python manage.py collectstatic
```

## 常用Django命令

```bash
# 项目管理
django-admin startproject project_name
python manage.py startapp app_name

# 数据库相关
python manage.py makemigrations
python manage.py migrate
python manage.py showmigrations
python manage.py sqlmigrate app_name migration_name

# 用户管理
python manage.py createsuperuser
python manage.py changepassword username

# 开发服务器
python manage.py runserver
python manage.py runserver 0.0.0.0:8000

# 其他
python manage.py shell
python manage.py collectstatic
python manage.py test
```


## 总结

这个教程涵盖了Django开发的基础知识，包括：

- 环境搭建和项目创建
- 模型定义和数据库操作
- 视图和URL配置
- 模板系统的使用
- 表单处理
- 静态文件管理
- 用户认证
- 部署准备

通过这个教程，你应该能够创建一个基本的Django Web应用程序。随着经验的积累，你可以进一步学习Django的高级特性，如中间件、缓存、信号、REST API等。

## 进一步学习资源

- [Django官方文档](https://docs.djangoproject.com/)
- [Django Girls教程](https://tutorial.djangogirls.org/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Two Scoops of Django](https://www.feldroy.com/books/two-scoops-of-django-3-x)

祝你Django开发愉快！