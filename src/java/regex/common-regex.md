---
title: 常用的正则表达式
category:
  - 正则表达式
---

# 常用的正则表达式

## 目录

[[toc]]

## 数字相关

### 整数和小数
- 整数或者小数（最多两位小数）：`^[0-9]+\.{0,1}[0-9]{0,2}$`
- 只能输入数字：`^[0-9]*$` 或 `/[^0-9]/g`
- 只能输入n位的数字：`^\d{n}$`
- 只能输入至少n位的数字：`^\d{n,}$`
- 只能输入m~n位的数字：`^\d{m,n}$`
- 零和非零开头的数字：`^(0|[1-9][0-9]*)$`

### 小数
- 两位小数的正实数：`^[0-9]+(\.[0-9]{2})?$`
- 1~3位小数的正实数：`^[0-9]+(\.[0-9]{1,3})?$`

### 正负数
- 非零的正整数：`^[+]?[1-9][0-9]*$`
- 非零的负整数：`^-[1-9][0-9]*$`
- 整数：`^-?\d+$`
- 浮点数：`^(-?\d+)(\.\d+)?$`
- 正浮点数：`^[1-9]\d*\.\d*|0\.\d*[1-9]\d*$`
- 负浮点数：`^-([1-9]\d*\.\d*|0\.\d*[1-9]\d*)$`

### 金额
- 金额（整数或最多两位小数）：`^(([1-9]\d{0,9})|0)(\.\d{1,2})?$`

## 字符串相关

### 字符长度
- 长度为3的字符：`^.{3}$`

### 英文字母
- 26个英文字母：`^[A-Za-z]+$`
- 26个大写英文字母：`^[A-Z]+$`
- 26个小写英文字母：`^[a-z]+$`
- 数字和26个英文字母：`^[A-Za-z0-9]+$`
- 数字、26个英文字母或者下划线：`^\w+$`

### 密码和特殊字符
- 用户密码(字母开头，6-18位，只含字母数字下划线)：`^[a-zA-Z]\w{5,17}$`
- 验证特殊字符：`[^%&',;=?$"]+`

### 中文字符
- 仅中文：`^[\u4e00-\u9fa5]{0,}$`
- 匹配中文字符：`[\u4e00-\u9fa5]`
- 匹配双字节字符(包括汉字)：`[^\x00-\xff]`

## 常用格式验证

### 邮箱和网址
- Email地址：`^\w+([-+.]\w+)*@\w+([-.]\\w+)*\.\w+([-.]\\w+)*$`
- Internet URL：`^http://([\w-]+\.)+[\w-]+(/[\w-./?%&=]*)?$`

### 电话和身份证
- 电话号码：`^(\(\d{3,4}-|\d{3,4}-)\d{7,8}$`
  - 支持格式：XXX-XXXXXXX、XXXX-XXXXXXXX、(XXX)XXXXXXX、(XXXX)XXXXXXXX
  - 示例：0511-4405222、021-87888822、(022)87341628
- 手机号码：`^1[3-9]\d{9}$`
- 身份证号(15位或18位)：`^\d{15}|\d{17}[\dXx]$`
  - 15位是老身份证
  - 18位是新身份证（末位可能为X）

### 日期相关
- 年份的12个月：`^(0?[1-9]|1[0-2])$`
  - 支持格式：01～09和1～12
- 月份的31天：`^((0?[1-9])|((1|2)[0-9])|30|31)$`
  - 支持格式：01～09和1～31

## 前端输入控制

### HTML输入控制

#### 基础输入限制
```html
<!-- 只能输入中文 -->
<input onkeyup="value=value.replace(/[^\\u4E00-\\u9FA5]/g,'')" 
       onbeforepaste="clipboardData.setData('text',clipboardData.getData('text').replace(/[^\\u4E00-\\u9FA5]/g,''))">

<!-- 只能输入数字 -->
<input onkeyup="value=value.replace(/[^\\d]/g,'')" 
       onbeforepaste="clipboardData.setData('text',clipboardData.getData('text').replace(/[^\\d]/g,''))">

<!-- 只能输入数字和英文 -->
<input onkeyup="value=value.replace(/[\\W]/g,'')" 
       onbeforepaste="clipboardData.setData('text',clipboardData.getData('text').replace(/[^\\d]/g,''))">
```

#### JavaScript输入控制函数
```javascript
// 只允许英文字符输入
function onlyEng() {
    if(!(event.keyCode >= 65 && event.keyCode <= 90))
        event.returnValue = false;
}

// 只允许数字输入（包括小键盘）
function onlyNum() {
    if(!((event.keyCode >= 48 && event.keyCode <= 57) || 
         (event.keyCode >= 96 && event.keyCode <= 105)))
        event.returnValue = false;
}

// 字符长度限制（支持中英文）
function maxLength(field, maxlimit) {
    var j = field.value.replace(/[^\\x00-\\xff]/g,"**").length;
    if(j > maxlimit) {
        var tempString = field.value;
        var tt = "";
        for(var i=0; i<maxlimit; i++) {
            if(tt.replace(/[^\\x00-\\xff]/g,"**").length < maxlimit)
                tt = tempString.substr(0,i+1);
            else
                break;
        }
        if(tt.replace(/[^\\x00-\\xff]/g,"**").length > maxlimit)
            tt = tt.substr(0,tt.length-1);
        field.value = tt;
    }
}

// Email格式验证
function isEmail(strEmail) {
    if (strEmail.search(/^\\w+((-\\w+)|(\.\\w+))*\\@[A-Za-z0-9]+((\\.|-)[A-Za-z0-9]+)*\\.[A-Za-z0-9]+$/) != -1)
        return true;
    return false;
}

// 敏感词过滤
function filterSensitiveWords(value) {
    if((value.indexOf("sex") == 0) || (value.indexOf("fuck") == 0)){
        alert("包含敏感词");
        return false;
    }
    return true;
}
```

#### 实际应用示例
```html
<!-- 英文输入限制 -->
<input onkeydown="onlyEng();">

<!-- 数字输入限制 -->
<input onkeydown="onlyNum();">

<!-- 字符长度限制 -->
<input type="text" onpropertychange="maxLength(this, 5)">
<textarea rows="14" cols="39" onpropertychange="maxLength(this, 15)"></textarea>

<!-- 表单验证示例 -->
<form name="testForm" onsubmit="return validateForm()">
    <input type="text" name="email" onblur="isEmail(this.value)">
    <textarea name="content" onkeyup="return filterSensitiveWords(this.value)"></textarea>
    <input type="submit" value="提交">
</form>

<!-- 非法字符过滤 -->
<input onkeyup="xz(this,1)" onPaste="xz(this,2)" value="">
```

### 其他实用正则
- 匹配空行：`\\n[\\s| ]*\\r`
- 匹配HTML标签：`<(.*)>(.*)<\\/(.*)>|<(.*)\\/>`
- 匹配首尾空格：`(^\\s*)|(\\s*$)`
- 腾讯QQ号（最少5位数）：`[1-9][0-9]{4,}`
- 中国邮政编码：`[1-9]\\d{5}(?!\\d)`
- IP地址：`\\d+\\.\\d+\\.\\d+\\.\\d+`

## 实用函数示例

### JavaScript字符串处理
```javascript
// 去除首尾空格
String.prototype.trim = function() {
    return this.replace(/(^\\s*)|(\\s*$)/g, "");
}

// 计算字符串长度（中文算2个字符）
String.prototype.len = function() {
    return this.replace(/[^\\x00-\\xff]/g,"aa").length;
}
```

### IP地址处理
```javascript
// IP地址验证和转换
function IP2V(ip) {
    const re = /(\\d+)\\.(\\d+)\\.(\\d+)\\.(\\d+)/g;
    if(re.test(ip)) {
        return RegExp.$1*Math.pow(255,3) + RegExp.$2*Math.pow(255,2) + RegExp.$3*255 + RegExp.$4*1;
    }
    throw new Error("Not a valid IP address!");
}

// 简化版IP转换
function simpleIP2V(ip) {
    const parts = ip.split(".");
    return parts[0]*255*255*255 + parts[1]*255*255 + parts[2]*255 + parts[3]*1;
}
```

## 注意事项

1. 正则表达式在不同语言中的使用：
   - Java：需要额外转义特殊字符，如 `\\d` 而不是 `\d`
   - JavaScript：直接使用 `\d` 即可
   - Python：建议使用原始字符串 r'pattern'，如 r'\d'
   - PHP：使用定界符包围，如 '/\d/'

2. 特殊字符的转义：
   - 在字符串中：`\` 需要写成 `\\`
   - 在正则中：`.` `*` `+` `?` `^` `$` `[` `]` `{` `}` `(` `)` `|` `\` 等特殊字符需要转义

3. 常见注意点：
   - 中文匹配在不同环境下可能需要调整编码
   - 邮箱验证建议采用宽松的规则，否则可能会拒绝有效地址
   - 手机号码等规则会随时间变化，需要定期更新
   - 在处理用户输入时，建议结合多种验证方式

4. 最佳实践：
   - 优先使用语言/框架提供的验证方法
   - 对复杂的验证逻辑进行拆分
   - 保持正则表达式的可读性和可维护性
   - 添加充分的注释说明
   - 对正则表达式进行充分的测试
   - 数据验证时建议结合多种验证方式，不要仅依赖正则表达式
   - 处理大量数据时注意正则表达式的性能影响
   - 在处理复杂HTML时，建议使用专门的解析库而不是正则表达式
