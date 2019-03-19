# Mexam.js
移动端在线做题组件，现只支持单选，多选，判断题类型。

## Demo 预览 (扫一扫)

![扫一扫](http://gitphoto.webjyh.com/qr_code_mexam.png)

## 插件说明
1. 插件依赖 [Zepto](https://github.com/madrobby/zepto)，需要以下模块`Core, event, touch, fx`；
2. 组件中的 `js/zepto.min.js` 已包含需要的模块，无需添加模块。
3. 组件支持 AMD, CMD，加载方式，模块名为 `Mexam`;
4. 兼容性  Android 4.4+, iOS 8.0+ 下的自带浏览器测试能过。 
5. 强调只支持单选，多选，判断题类型。
6. 增加答题卡页面。
7. 题目类型 `type` 字段说明 1为单选，2为多选，4为判断。

## 如何使用
```html
<!-- Load Mexam CSS && JS -->
<link rel="stylesheet" type="text/css" href="css/Mexam.css"/>
<script type="text/javascript" src="js/zepto.min.js"></script>
<script type="text/javascript" src="js/Mexam.js"></script>

<!-- 用于显示组件的容器 -->
<div class="overlay" id="overlay"></div>

<!-- 初始化 -->
<script type="text/javascript">
var data = [
    {
        id: "i88bac6k8yra-9bwr-04fq",
        title: "单选题题目",
        type: 1,
        content: [
            "选项A",
            "选项B",
            "选项C",
            "选项D",
        ]
    },
    {
        id: "i88bac6k8yra-9bwr-04fq",
        title: "多选题题目",
        type: 2,
        content: [
            "选项A",
            "选项B",
            "选项C",
            "选项D",
            "选项E",
            "选项F",
            "选项G",
            "选项H",
            "选项J",
        ]
    },
    {
        id: "i88bac6k8yra-9bwr-04fq",
        title: "判断题题目",
        type: 4,
        content: [
            "选项A",
            "选项B",
            "选项C",
            "选项D",
        ]
    },
];

Mexam({
    title: 'Mexam 移动端在线做题',
    data: data,
    wrap: '#overlay',
});
</script>
```

## API
```javascript
Mexam({options});
```
#### options  说明
参数名  | 默认值 | 类型 | 参数说明
------- | ------ | ---- | --------
title |  `空` | {String} | 显示于组件头部的标题内容
data | `null` | {Array} | 存放需要展示题目的数据，请参考下面代码格式
title | `【浏览】` | {String} | 显示于组件头部的标题内容
wrap | `body` | {String} | 指定在哪个容器下显示，支持 `document.querySelector` 的选择器。`如：.class, element, #id, ul > li`;
init | `null` | {Function} | 组件在初始化之前所调用的方法
close | `null` | {Function} | 关闭组件时的回调方法   `this`指向 Mexam；`return false` 可阻止销毁组件
send | `Function(data, time)` | {Function} | 用于答题卡中提交试卷的方法。`this`指向 Mexam；`return false` 可阻止销毁组件。  此方法接受两个参数 `data`，表示已答题的答案，`time` 表示当前做题用了多长时间，单位秒。data 返回的格式请参考下面代码格式

```javascript
//题目类型数据格式
[
    {
        id: "i88bac6k8yra-9bwr-04fq",  //题目ID
        title: "单选题题目",           //题目标题
        type: 1,                       //题目类型 1 单选，2 多选，4 判断
        content: [                     //ABCD选项，按数组排序，一一对应。
            "选项A",                   //数组第一位为 A，第二位为B，以此类推
            "选项B",
            "选项C",
            "选项D",
        ]
    }
]

//提交答题卡所返回的数据
//返回所有答题的ID，存于数组中
[
    { id: "i88bac6k8yra-9bwr-04fq" },                             //未答题则不返回 answer
    { id: "i88bac6k8yra-9bwr-04fq", answer: "A"},                   //单选，判断类型 返回的答案
    { id: "i88bac6ko5re9dzjeinwjg", answer: ['A', 'B', 'D', 'E'] }  // 多选返回的答案，按字母排序
    { id: "i88bac6ko5re9dzjeinwjg", answer: "" }                   //题目已答过，最后取消了回答案
]
```

#### 销毁组件
```javascript
var Mex = Mexam({
    title: 'Mexam 移动端在线做题',
    data: data,
    wrap: '#overlay',
});

//销毁
Mex.destroy();
```

### 代码演示
```javascript
var data = [
    {
        id: "i88bac6k8yra-9bwr-04fq",
        title: "单选题题目",
        type: 1,
        content: [
            "选项A",
            "选项B",
            "选项C",
            "选项D",
        ]
    }
];

Mexam({
    title: 'Mexam 移动端在线做题',
    data: data,
    init: function() {
        window.console && console.log('init');
    },
    close: function() {
        window.console && console.log('close');
    },
    send: function(data, time) {
        // 如果为 Ajax 提交 则默认设置 返回 false
        // 执行成功在手动销毁组件 this.destroy();
        // 以下代码演示
        
        var _this = this,
            conf = confirm('确认提交答题卡？');
        
        if (conf) {
            $.each(data, function(i, val) {
                if ($.isArray(val.answer)) {
                    data[i].answer = val.answer.join('；');
                }
            });
            $.post(url, {data: JSON.stringify(data), time: time}, function(data) {
                console.log(data);
                _this.destroy();
            });
        }
        return false;
    }
});
```

## 目录说明
```
Mexam/
├── css/
│   ├── normalize.css          (重置样式)
│   └── Mexam.css              (插件所需样式)
├── fonts/                     (插件所需的字体图标)
│   ├── Mexam.eot 
│   ├── Mexam.svg
│   ├── Mexam.ttf
│   └── Mexam.woff
├── js/
│   ├── zepto.min.js           (已包含组件所需的模块)
│   ├── MMexam.js              (组件未压缩源码)
│   └── Mexam.min.js           (组件压缩源码)
├── gulpfile.js                (gulp 打包文件)
└── index.html                 (Demo展示)
```

## 联系作者
Blog：<http://webjyh.com> 

Weibo：<http://weibo.com/webjyh/>
