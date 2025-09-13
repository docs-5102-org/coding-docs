---
title: 反射机制
category:
  - Java
tag:
  - 反射机制
---

# Java 反射机制

## 目录

[[toc]]

---

## 什么是Java反射？

Java反射机制是在**编译时并不确定是哪个类被加载了**，而是在**程序运行的时候**才加载、探知、自审。使用的是在编译期并不知道的类。这样的编译特点就是Java反射。

要让Java程序能够运行，就得让Java类被Java虚拟机加载。Java类如果不被Java虚拟机加载就不能正常运行。正常情况下，我们运行的所有的程序在编译期时候就已经把那个类被加载了。

---

## Java反射的作用

### 实际应用场景

假如有两个程序员，一个程序员在写程序的时需要使用第二个程序员所写的类，但第二个程序员并没完成他所写的类。那么第一个程序员的代码是不能通过编译的。此时，利用Java反射的机制，就可以让第一个程序员在没有得到第二个程序员所写的类的时候，来完成自身代码的编译。

### 自审能力

Java的反射机制它知道类的基本结构，这种对Java类结构探知的能力，我们称为Java类的"自审"。

如Eclipse中，一按点，编译工具就会自动的把该对象能够使用的所有的方法和属性全部都列出来，供用户进行选择。这就是利用了Java反射的原理，是对我们创建对象的探知、自审。

---

## Class类详解

要正确使用Java反射机制就得使用`java.lang.Class`这个类。它是Java反射机制的起源。当一个类被加载以后，Java虚拟机就会自动产生一个Class对象。通过这个Class对象我们就能获得加载到虚拟机当中这个Class对象对应的方法、成员以及构造方法的声明和定义等信息。

---

## 反射API功能

反射API用于返回在当前Java虚拟机中的类、接口或者对象信息：

1. **获取一个对象的类信息**
2. **获取一个类的访问修饰符、成员、方法、构造方法以及超类的信息**
3. **检获属于一个接口的常量和方法声明**
4. **创建一个直到程序运行期间才知道名字的类的实例**
5. **获取并设置一个对象的成员，这个成员的名字是在程序运行期间才知道**
6. **检测一个在运行期间才知道名字的对象的方法**

利用Java反射机制可以很灵活的对已经加载到Java虚拟机当中的类信息进行检测。这种检测在对运行的性能上会有些削弱，所以什么时候使用反射，要靠业务的需求、大小，以及经验的积累来决定。

---

## 使用反射机制的步骤

### 基本步骤

1. **导入java.lang.reflect包**
2. **遵循三个步骤：**
   - 获得你想操作的类的`java.lang.Class`对象
   - 调用诸如`getDeclaredMethods`的方法
   - 使用反射API来操作这些信息

### 代码示例：探索类信息

```java
package com.reflection.classForName;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import javax.swing.JOptionPane;

/**
 * 本类用于测试反射API，利用用户输入类的全路径，
 * 找到该类所有的成员方法和成员属性
 */
public class ClassForName {
    
    /**
     * 构造方法
     */
    public ClassForName(){
        String classInfo = JOptionPane.showInputDialog(null,"输入类全路径");
        
        try {
            // 根据类的全路径进行类加载，返回该类的Class对象
            Class<?> cla = Class.forName(classInfo);
            
            // 利用得到的Class对象的自审，返回方法对象集合
            Method[] method = cla.getDeclaredMethods();
            System.out.println("forName:" + cla);
            
            // 遍历该类方法的集合
            for(Method me : method){
                System.out.println("方法有:" + me.toString());
            }
            
            System.out.println("***********************************************");
            
            // 利用得到的Class对象的自审，返回属性对象集合
            Field[] field = cla.getDeclaredFields();
            for(Field me : field){
                System.out.println("属性有:" + me.toString());
            }
            
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }
    
    public static void main(String[] args) {
        new ClassForName();
    }
}
```

当运行时输入`java.lang.String`，会输出String类的所有方法和属性信息。

---

## 获得Class对象的三种方法

### 方法一：已知对象实例
如果已经得到一个类的实例，可以使用如下方式来得到Class对象：

```java
Class c = 对象名.getClass();

// 例：
TextField t = new TextField();
Class c = t.getClass();
Class s = c.getSuperclass();
```

### 方法二：编译期已知类名
如果在编译期知道类的名字，可以使用如下方法：

```java
Class c = java.awt.Button.class;
// 或
Class c = Integer.TYPE;
```

### 方法三：运行期获得类名
如果类名在编译期不知道，但是在运行期可以获得，可以使用下面的方法：

```java
Class c = Class.forName(str);
// 注意：str是类的全路径
```

### 完整示例：

```java
package com.reflection.classForName;

public class GetClassTest {
    public static void main(String[] args) throws Exception {
        System.out.println("测试开始");
        
        GetClassTestObj gctObj = new GetClassTestObj();
        // 通过反射机制得到类的对象
        Class<? extends GetClassTestObj> clazzClass = gctObj.getClass();
        System.out.println("clazzClass:" + clazzClass);
        
        // 调用无参构造方法，创建一个对象
        GetClassTestObj gctObj2 = (GetClassTestObj)clazzClass.newInstance();
        System.out.println("gctObj==gctOb2 :" + (gctObj == gctObj2));
        System.out.println("gctObj.getClass() == gctOb2.getClass() :" 
                          + (gctObj.getClass() == gctObj2.getClass()));
        gctObj2.print();
    }
}

class GetClassTestObj {
    static { // 静态代码块，只执行一次
        System.out.println("静态代码块运行");
    }
    
    private String name = "chen";
    public String address = "chengdu";
    
    public void print(){
        System.out.println("name:" + name + " ,address:" + address);
    }
}
```

---

## 通过反射获取构造器

反射机制不但可以例出该类对象所拥有的方法和属性，还可以获得该类的构造方法并通过构造方法获得实例。也可以动态的调用这个实例的成员方法。

### 代码示例：

```java
package com.reflection.constructor;

import java.lang.reflect.Constructor;

/**
 * 本类测试反射获得类的构造器对象，
 * 并通过类构造器对象生成该类的实例
 */
public class ConstructorTest {
    public static void main(String[] args) {
        try {
            /**
             * 第一步:加载类对象
             * 第二步：设置Class对象数组用于指定构造方法
             * 第三步:获得Constructor构造器对象
             */
            // 加载指定字符串类的对象
            Class clazz = Class.forName("com.reflection.constructor.Tests");
            // 设置Class对象数组，用于指定构造方法类型
            Class[] cl = new Class[]{int.class, int.class};
            // 获得Constructor构造器对象。并指定构造方法类型
            Constructor con = clazz.getConstructor(cl);
            
            // 通过构造器创建对象实例
            Object object = con.newInstance(33, 66);
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

class Tests {
    public Tests(int x, int y) {
        System.out.println(x + " ," + y);
    }
}
```

运行结果是"33, 66"，说明我们已经生成了Tests这个类的一个对象。

---

## 通过反射执行类的方法

### 代码示例：

```java
package com.reflection.MethodInvoke;

import java.lang.reflect.Method;

/**
 * 本类测试反射获得类的方法对象，
 * 并通过类对象和类方法对象，运行该方法
 */
public class MethodInvoke {
    public static void main(String[] args) {
        try {
            // 获得窗体类的Class对象
            Class cla = Class.forName("javax.swing.JFrame");
            // 生成窗体类的无参实例
            Object obj = cla.newInstance();
            
            // 获得窗体类的setSize方法对象，并指定该方法参数类型为int,int
            Class[] classes = new Class[]{int.class, int.class};
            Method methodSize = cla.getMethod("setSize", classes);
            
            /*
             * 执行setSize()方法，并传入一个Object[]数组对象，
             * 作为该方法参数，等同于  窗体对象.setSize(600,300);
             * 参数1:obj是类加载的一个实例对象
             * 参数2:是一个指定的参数对象
             */
            methodSize.invoke(obj, new Object[]{new Integer(600), new Integer(300)});
            
            // 获得窗体类的setVisible方法对象，并指定该方法参数类型为boolean
            Method methodVisible = cla.getMethod("setVisible", new Class[]{boolean.class});
            
            /*
             * 执行setVisible()方法，并传入一个Object[]数组对象，
             * 作为该方法参数。等同于  窗体对象.setVisible(true);
             */
            methodVisible.invoke(obj, new Object[]{new Boolean(true)});
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

---

## 设计模式中的反射应用

反射技术大量用于Java设计模式和框架技术，最常见的设计模式就是工厂模式(Factory)和单例模式(Singleton)。

### 单例模式 (Singleton)

保证在Java应用程序中，一个类Class只有一个实例存在。

#### 目的
节省内存空间，保证我们所访问到的都是同一个对象。

#### 第一种形式：

```java
package reflect;

public class Singleton {
    /*
     * 注意这是private私有的构造方法，只供内部调用
     * 外部不能通过new的方式来生成该类的实例
     */
    private Singleton() {
    }
    
    /*
     * 在自己内部定义自己一个实例，是不是很奇怪？
     * 定义一个静态的实例，保证其唯一性
     */
    private static Singleton instance = new Singleton();
    
    // 这里提供了一个供外部访问本class的静态方法，可以直接访问
    public static Singleton getInstance() {
        return instance;
    }
}

/**
 * 测试单例模式
 */
class SingRun {
    public static void main(String[] args) {
        // 得到一个Singleton类实例
        Singleton x = Singleton.getInstance();
        // 得到另一个Singleton类实例
        Singleton y = Singleton.getInstance();
        // 比较x和y的地址，结果为true。说明两次获得的是同一个对象
        System.out.println(x == y);
    }
}
```

#### 第二种形式：

```java
public class Singleton {
    // 先申明该类静态对象
    private static Singleton instance = null;
    
    // 创建一个静态访问器，获得该类实例。加上同步机制，防止两个线程同时进行对对象的创建
    public static synchronized Singleton getInstance() {
        // 如果为空，则生成一个该类实例
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
```

### 工厂模式 (Factory)

工厂模式利用Java反射机制和Java多态的特性可以让我们的程序更加具有灵活性。

#### 为什么工厂模式如此常用？

因为工厂模式利用Java反射机制和Java多态的特性可以让我们的程序更加具有灵活性。用工厂模式进行大型项目的开发，可以很好的进行项目并行开发。

#### 实现步骤：

1. **定义接口**

```java
package com.reflection.Factory;

/**
 * 声明一个测试接口
 */
public interface InterfaceTest {
    public void getName(); // 定义获得名字的方法
}
```

2. **实现接口**

```java
// 实现类1
package com.reflection.Factory;

public class Test1 implements InterfaceTest {
    @Override
    public void getName() {
        System.out.println("test1");
    }
}

// 实现类2
package com.reflection.Factory;

public class Test2 implements InterfaceTest {
    @Override
    public void getName() {
        System.out.println("test2");
    }
}
```

3. **工厂类**

```java
package com.reflection.Factory;

import java.io.InputStream;
import java.util.Properties;

public class Factory {
    // 创建私有的静态的Properties对象
    private static Properties prop = new Properties();
    
    static { // 静态代码块,在创建这个类的实例之前执行，且只执行一次，用来加载配置文件
        try {
            // 加载配置文件
            InputStream ips = Factory.class.getClassLoader()
                    .getResourceAsStream("file.properties");
            prop.load(ips);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * 单例模式，保证该类只有一个Factory对象
     */
    private static Factory factory = new Factory();
    private Factory() {} // 构建一个私有构造方法
    
    public static Factory getFactory() { // 返回工厂对象的方法
        return factory;
    }
    
    /**
     * 本方法为公有方法，用于生产接口对象
     * @return：InterfaceTest接口对象
     */
    public InterfaceTest getInterface() {
        InterfaceTest interfaceTest = null; // 定义接口对象
        try {
            // 根据键，获得值，这里的值是类的全路径
            String classInfo = prop.getProperty("test");
            // 利用反射，生成Class对象
            Class<?> c = Class.forName(classInfo);
            // 获得该Class对象的实例
            Object obj = c.newInstance();
            // 将Object对象强转为接口对象
            interfaceTest = (InterfaceTest) obj;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return interfaceTest; // 返回接口对象
    }
}
```

4. **配置文件 (file.properties)**

```properties
test=com.reflection.Factory.Test1
```

5. **调用方**

```java
package com.reflection.Factory;

public class FactoryTest {
    public static void main(String[] args) {
        // 获得工厂类的实例
        Factory factory = Factory.getFactory();
        // 调用获得接口对象的方法，获得接口对象
        InterfaceTest interObj = factory.getInterface();
        // 调用接口定义的方法
        interObj.getName();
    }
}
```

#### 工厂模式的优势

通过这个例子可以发现，在调用的时候，得到的是个接口对象。而一个接口变量可以指向实现了这个接口的类对象。在利用反射的时候，我们并没有直接把类的全路径写出来，而是通过键获得值。这样的话，就有很大的灵活性，只要改变配置文件里的内容，就可以改变我们调用的接口实现类，而代码不需做任何改变。

---

## 总结

### 反射机制的核心价值

反射机制是框架技术的原理和核心部分。通过反射机制我们可以动态的通过改变配置文件(以后是XML文件)的方式来加载类、调用类方法，以及使用类属性。这样的话，对于编码和维护带来相当大的便利。在程序进行改动的时候，也只会改动相应的功能就行了，调用的方法是不用改的。更不会一改就改全身。

### 适用场景

1. **框架开发**：Spring、Hibernate等框架大量使用反射
2. **插件系统**：动态加载插件类
3. **序列化/反序列化**：JSON、XML处理
4. **单元测试**：测试私有方法和属性
5. **IDE功能**：代码提示、自动完成

### 注意事项

1. **性能影响**：反射操作比直接调用慢
2. **安全限制**：可能破坏封装性
3. **运行时错误**：编译期无法检查类型安全
4. **代码可读性**：降低代码的直观性

### 最佳实践

1. **缓存Class对象**：避免重复调用`Class.forName()`
2. **缓存Method和Field对象**：避免重复查找
3. **异常处理**：合理处理反射相关异常
4. **安全检查**：在必要时进行权限检查
5. **性能测试**：在性能敏感场景下谨慎使用

反射是Java语言的强大特性，正确使用可以大大提高程序的灵活性和可扩展性，但也需要权衡其带来的复杂性和性能开销。