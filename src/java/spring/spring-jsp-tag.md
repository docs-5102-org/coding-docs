---
title: 自定义JSP标签
category:
  - Web框架
tag:
  - Spring MVC
  - JSP标签
---

# Spring 自定义JSP标签

## 概述

自定义JSP标签是Java Web开发中的一项重要技术，它允许开发者封装复杂的业务逻辑到标签中，提高代码的可重用性和可维护性。本文将详细介绍如何创建和使用自定义JSP标签，特别是在Spring框架中的应用。

## Scripting Variable 的概念

Scripting Variable是用于自定义标签与JSP页面之间沟通的变量。当您需要获取标签运算之后的值，以便在接下来的JSP页面中进行运算时，就需要使用Scripting Variable。例如，获取某个标签运算后的值，设定为另一个标签运算的属性值。

### 设定Scripting Variable的方法

有几种方式可以用于设定Scripting Variable，主要的概念都是在JSP页面转译为Servlet时，通过一个中介者让Container知道那些变量该转译为Scripting Variable，以便JSP页面与自定义标签可以共用这个变量。

设定Scripting Variable的基本方法是将变量设定给pageContext：

```java
pageContext.setAttribute("varname", vardata);
```

## 创建自定义标签

### 1. 创建标签处理类

首先创建一个标签处理类，继承自`TagSupport`：

```java
package onlyfun.caterpillar;

import javax.servlet.jsp.*;
import javax.servlet.jsp.tagext.*;

public class DecodeTag extends TagSupport {
    private String code;
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public int doStartTag() throws JspException {
        code = code + "-decoded";
        pageContext.setAttribute("decoded", code);
        return SKIP_BODY;
    }
}
```

这个类别模拟解码的过程，`decoded`是用来作为Scripting Variable的变量名称。

### 2. 创建TagExtraInfo类

接下来需要告知容器这个资讯，通过`TagExtraInfo`类别与`VariableInfo`类别：

```java
package onlyfun.caterpillar;

import javax.servlet.jsp.*;
import javax.servlet.jsp.tagext.*;

public class TagExtraDemo extends TagExtraInfo {
    public VariableInfo[] getVariableInfo(TagData data) {
        VariableInfo info = new VariableInfo("decoded", 
                       "String", true, VariableInfo.AT_END);
        return new VariableInfo[] {info};
    }
}
```

### VariableInfo构造参数说明

`VariableInfo`构造中传入四个参数：
1. **Scripting Variable名称**
2. **Scripting Variable型态**
3. **之前有无宣告过**：若设定为true，表示之前有宣告过，直接使用宣告过的变量；如果为false，则会生成新的实例
4. **作用范围**：分为三种
   - `VariableInfo.AT_BEGIN`：作用范围从标签开始至JSP页面结束
   - `VariableInfo.AT_END`：作用范围从标签结束至JSP页面结束
   - `VariableInfo.AT_NESTED`：作用范围从标签开始至标签结束

## 配置TLD文件

在tld档中告诉容器有关于自定义标签及TagExtraInfo类别的资讯：

```xml
<tag>
    <description>Decode</description>
    <name>decode</name>
    <tag-class>onlyfun.caterpillar.DecodeTag</tag-class>
    <tei-class>onlyfun.caterpillar.TagExtraDemo</tei-class>
    <body-content>empty</body-content>
    <attribute>
        <name>code</name>
        <required>true</required>
        <rtexprvalue>true</rtexprvalue>
    </attribute>
</tag>
```

其中`<tei-class>`标签用来告诉容器有关于TagExtraInfo类别的资讯。

## 在JSP中使用自定义标签

```jsp
<%@taglib prefix="caterpillar" uri="http://caterpillar.onlyfun.net/"%>
<html>
<body>
    解码前：${param.code}<br>
    <caterpillar:decode code="${param.code}"/>
    解码后：${decoded}
</body>
</html>
```

## 简化配置方式

除了使用TagExtraInfo类别的方法，还可以直接在tld档案中设定，不用通过TagExtraInfo类别：

```xml
<tag>
    <description>Decode</description>
    <name>decode</name>
    <tag-class>onlyfun.caterpillar.DecodeTag</tag-class>
    <body-content>empty</body-content>
    <attribute>
        <name>code</name>
        <required>true</required>
        <rtexprvalue>true</rtexprvalue>
    </attribute>
    <variable>
        <name-given>decoded</name-given>
        <variable-class>String</variable-class>
        <declare>true</declare>
        <scope>AT_END</scope>
    </variable>
</tag>
```

这次不需要通过`<tei-class>`的指定，使用的是`<name-given>`、`<variable-class>`、`<declare>`与`<scope>`四个标签，其意义与`VariableInfo`建构时的四个参数相同。

## 动态变量名称

可以让使用自定义标签的人员自行决定变量名称，方法是使用`<name-from-attribute>`：

```xml
<tag>
    <description>Decode</description>
    <name>decode</name>
    <tag-class>onlyfun.caterpillar.DecodeTag</tag-class>
    <body-content>empty</body-content>
    <attribute>
        <name>code</name>
        <required>true</required>
        <rtexprvalue>true</rtexprvalue>
    </attribute>
    <attribute>
        <name>varname</name>
        <required>true</required>
    </attribute>
    <variable>
        <name-from-attribute>varname</name-from-attribute>
        <variable-class>String</variable-class>
        <declare>true</declare>
        <scope>AT_END</scope>
    </variable>
</tag>
```

相应的标签处理类也需要修改：

```java
public class DecodeTag extends TagSupport {
    private String varname;
    private String code;
    
    public void setVarname(String varname) {
        this.varname = varname;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public int doStartTag() throws JspException {
        code = code + "-decoded";
        pageContext.setAttribute(varname, code);
        return SKIP_BODY;
    }
}
```

JSP中的使用方式：

```jsp
<%@taglib prefix="caterpillar" uri="http://caterpillar.onlyfun.net/"%>
<html>
<body>
    解码前：${param.code}<br>
    <caterpillar:decode varname="keyword" code="${param.code}"/>
    解码后：${keyword}
</body>
</html>
```

## 使用SimpleTagSupport

如果通过继承`SimpleTagSupport`类别来实作自定义标签，则在设定Scripting Variable时，可以简单的使用`JspContext`的`setAttribute()`方法来设定，而不需要额外的设定tld档案：

```java
package onlyfun.caterpillar;

import javax.servlet.jsp.*;
import javax.servlet.jsp.tagext.*;

public class SimpleDecodeTag extends SimpleTagSupport {
    private String code;
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public void doTag() throws JspException {
        code = code + "-decoded";
        getJspContext().setAttribute("decoded", code);
    }
}
```

## 总结

自定义JSP标签提供了一种强大的方式来封装复杂的业务逻辑，通过Scripting Variable机制，可以实现标签与JSP页面之间的数据交换。主要的实现方式包括：

1. **TagExtraInfo方式**：使用独立的类别集中管理标签的Scripting Variable，适合复杂的变量管理
2. **TLD配置方式**：直接在tld档案中配置变量信息，简单直接
3. **SimpleTagSupport方式**：更加简化的实现方式，适合简单的标签开发

选择适当的实现方式可以提高开发效率，同时保证代码的可维护性和重用性。