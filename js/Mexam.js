/**
 * @name     Mexam
 * @desc     移动端题库做题插件，只支持，单选题，多选题，判断题
 * @depend   Zepto
 * @author   M.J
 * @date     2015-07-09
 * @URL      http://webjyh.com
 * @reutn    {Mexam}
 * @version  1.0.0
 * @license  MIT
 *
 * @PS If you have any questions, please don't look for me, I don't know anything. thank you.
 */
(function(root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        //AMD.
        define(['zepto'], factory);
    } else if (typeof exports === 'object') {
        //CMD.
        module.exports = factory(require('zepto'));
    } else {
        // Browser globals (root is window)
        root.Mexam = factory(root.Zepto);
    }
}(this, function($) {

    "use strict";

    var scaleReg = /scale(?:3d)?\(([^\)]+)\)/,
        translateReg = /translate(?:3d)?\(([^\)]+)\)/,
        letter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
        config = {
            title: '',
            data: null,
            wrap: 'body',
            send: function() {},
            init: null,
            close: null
        },
        innerHTML = ['<div class="ui-Mexam-wrapper">',
        '    <header>',
        '        <div class="ui-Mexam-back"><a href="javascript:;" class="Mexam-icon ">〈</a></div>',
        '        <h1 class="ui-Mexam-time"><i class="Mexam-icon Mexam-shijian"></i> <span>00:00</span></h1>',
        '        <div class="ui-Mexam-preview"><a href="javascript:;" class="Mexam-icon Mexam-liebiao"></a></div>',
        '    </header>',
        '    <div class="ui-Mexam-title">',
        '        <span><em>01</em>/<i>{{pageCoumt}}</i></span>',
        '        <h3>{{title}}</h3>',
        '    </div>',
        '    <div class="ui-Mexam-main">',
        '        <div class="ui-Mexam-view"><ul class="ui-Mexam-list"></ul></div>',
        '        <div class="ui-Mexam-card">',
        '        <ul class="ui-Mexam-cardList"></ul>',
        '        <div class="ui-Mexam-buttom"><a href="javascript:;" title="提交">提交</a></div>',
        '        </div>',
        '    </div>',
        '    <div class="ui-Mexam-loading ui-Mexam-show"><span class="Mexam-icon Mexam-loading"></span></div>',
        '</div>'].join("");

    /**
     * 构造函数
     * @param       用户配置项
     * @returns     {Mexam}
     * @constructor {Mexam}
     */
    var Mexam = function(options) {
        return new Mexam.fn.init(options);
    };

    Mexam.fn = Mexam.prototype = {
        constructor: Mexam,
        init: function(options) {
            if (!options.data || !options.data.length) return;

            this.config = $.extend(config, options);  //默认配置项
            this.index = 0;                           //当前题目
            this.DOM = {};                            //组件DOM
            this.topics = {};                         //存放当前订阅内容
            this.titleHeight = null;                 //存放当前Title高度
            this.next = false;                        //是否为 next 预加载下一题
            this.time = 0;                            //记录当前做题时间
            this.answer = new Array(this.config.data.length);   //已答题的题目
            this.resize =  typeof window.orientation == 'number' ? 'orientationchange.mexam' : 'resize.mexam';  //支持旋转的事件名
            this.screen = {
                width: window.innerWidth,
                height: window.innerHeight
            };

            if ($.isFunction(this.config.init)) {
                this.config.init();
            }

            //载入订阅
            this.loadTopics()
                .publish('init')
                .publish('touch')
                .publish('answer')
                .publish('topicJump')
                .publish('events')
                .publish('time');
        },

        /**
         * @name      格式化当前页的数字
         * @param     val     {Number}     默认用户的参数
         * @return    {String}
         */
        formatNumber: function(val) {
            return val.toString().length < 2 ? '0' + val : val;
        },

        /**
         * @name    订阅发布
         * @type    {Function}
         * @parmas  {key}   订阅的名称
         * @params  {val}   订阅的内容
         * @return  this
         */
        subscribe: function(key, val) {
            if (!this.topics[key]) {
                this.topics[key] = [];
            }
            this.topics[key].push(val);
            return this;
        },

        /**
         * @name    退订发布
         * @type    {Function}
         * @params  {key}    要退订的名称
         * @return  this
         */
        unsubscribe: function(key) {
            if (this.topics[key]) {
                delete this.topics[key];
            }
            return this;
        },

        /**
         * @name    发布订阅的
         * @type    {Function}
         * @return  this
         */
        publish: function(key) {
            if (!this.topics[key]) {
                return false;
            }

            var subscribers = this.topics[key],
                len = subscribers ? subscribers.length : 0,
                args = [].slice.call(arguments);

            args.shift();
            for (var i = 0; i < len; i++) {
                subscribers[i].apply(this, args);
            }

            return this;
        },

        /**
         * 创建 HTML
         * @params   {Number}   start    从当前第几个开始创建，包含 start
         * @params   {length}   len      要创建的个数
         * @returns  {string}
         */
        create: function(start, len) {
            var html = '',
                tpl = '<li style="width: ' + this.screen.width + 'px; height: '+ this.screen.height +'px;"><div><h2>{{title}}</h2>',
                olStart = '<ol>',
                list = '<li class="{{active}}" data-answer="{{key}}"><span>{{key}}</span><p><span>{{item}}</span></p></li>',
                olEnd = '</ol>',
                button = '<div class="ui-Mexam-buttom"><a href="javascript:;" title="下一题">下一题</a></div>';

            for (var i = 0; i < len; i++) {
                var answer = this.answer[start + i] || [],
                    data = this.config.data[start + i];
                if (!data.content) break;

                var temp = tpl.replace('{{title}}', data.title) + olStart;
                $.each(data.content, function (index, item) {
                    var active = '', key = letter[index];
                    if ($.inArray(key, answer) > -1) active = 'active';
                    temp += list.replace(/{{key}}/g, key).replace('{{item}}', item).replace('{{active}}', active);
                });
                temp += olEnd;
                if (data.type == 2) temp += button;
                html += temp + '</div></li>';
            }

            return html;
        },

        /**
         * 获取当前元素 CSS3 属性值
         * @param  {Elements} elem
         * @param  {String} name
         * @return {Object}
         */
        getTransform: function(e, name) {
            e = $(e);

            var val = e.css("transform") || e.css("-webkit-transform"),
                has = val === 'none',
                arr, x, y, reg;

            if (name === 'translate') {
                reg = translateReg;
                if (has || !val || val.indexOf(name) == -1) {
                    has = true;
                    x = y = 0;
                }
            } else if(name === "scale") {
                reg = scaleReg;
                if (has || !val || val.indexOf(name) == -1) {
                    has = true;
                    x = y = 1;
                }
            }

            if (!has) {
                arr = val.match(reg);
                arr = arr[1].split(',');
                x = parseFloat(arr[0]);
                y = parseFloat(arr[1]);
            }

            return {
                x: x,
                y: y
            };
        },

        /**
         * 设置当前元素 CSS3 属性值
         * @param  {Elements} elem
         * @param  {Object} val
         * @return this;
         */
        setTransform: function(elem, val) {
            if (!elem) return;

            var css = '',
                style = elem.style,
                key,
                value;

            for (key in val) {
                value = val[key];
                if (key === 'translate') {
                    css += " translate3d(" + value.x + "px, " + value.y + "px, 0)";
                } else if (key === 'scale') {
                    css += " scale3d(" + value.x + ", " + value.y + ", 1)";
                } else {
                    css += value;
                }
            }

            style.transform = style.webkitTransform = $.trim(css);
        },

        /**
         * 设置当前元素 CSS3 属性值
         * @param  {Elements} elem
         * @param  {Object} val
         * @return this;
         */
        setTransition: function(elem, val) {
            if (!elem) return;
            var style = elem.style,
                key,
                value;
            for (key in val) {
                value = val[key];
                value.easing = value.easing || "ease";
                if (key === 'transform') {
                    style.transition = style.webkitTransition = '-webkit-' + key + ' ' + value.duration + ' ' + value.easing;
                }
                style.transition = style.webkitTransition = key + ' ' + value.duration + ' ' + value.easing;
            }
        },

        /**
         * 销毁组件并执行关闭毁掉
         * @return null
         */
        destroy: function() {
            if ($.isFunction(this.config.close)) {
                var has = this.config.close.apply(this);
                if (has === false) return false;
            }

            $(this.config.wrap).empty();
            $(document).off('touchstart.mexam');
            $(window).off(this.resize);
        },
        /**
         * 默认载入已订阅的主题
         * @return null
         */
        loadTopics: function() {

            // 创建DOM
            this.subscribe('init', function() {
                var _this = this,
                    $wrap = $(this.config.wrap),
                    html = innerHTML.replace('{{pageCoumt}}', this.formatNumber(this.config.data.length))
                                    .replace('{{title}}', this.config.title);
                // 写入元素
                $wrap.html(html);
                var $elem = $wrap.find('*');
                $elem.each(function(index, item) {
                    if (item.className.indexOf('ui-Mexam-') > -1) {
                        var key = $.trim(item.className.replace('ui-Mexam-', '').replace('ui-Mexam-show', ''));
                        _this.DOM[key] = $(item);
                    }
                });

                this.titleHeight = this.DOM.title.height() + this.DOM.time.height();
                $(document).on('touchstart.mexam', function(e) { e.preventDefault(); });
            });

            // 构建题库列表
            this.subscribe('init', function() {
                var DOM = this.DOM,
                    len = this.config.data.length > 2 ? 3 : this.config.data.length,
                    html = this.create(0, len);

                DOM.list.css({width: this.screen.width * len, left: 0}).html(html);
                this.setTransition(DOM.list[0], {transform: {duration: '0ms'}});
                this.setTransform(DOM.list[0], {translate: {x: 0, y: 0}});

                setTimeout(function() {
                    DOM.loading.removeClass('ui-Mexam-show');
                }, 200);
            });

            // 构建答题卡列表
            this.subscribe('init', function() {
                var DOM = this.DOM.cardList,
                    html = '',
                    tpl = '<li data-index="{{index}}"><a href="javascript:;">{{i}}</a></li>',
                    len = this.config.data.length;

                for (var i = 0; i < len; i++) {
                    html += tpl.replace('{{index}}', i).replace('{{i}}', i+1);
                }

                DOM.html(html);
            });

            // 加载当前题目的 上一题或下一题
            this.subscribe('preloading', function(direction) {
                var DOM = this.DOM,
                    MaxLen = this.config.data.length - 1,
                    index = direction == 'next' ? (this.index + 1) : (this.index - 1),
                    $elem = DOM.list.children();

                // 判断是否为头或尾
                if (index < 0 || index > MaxLen)  return;
                if (direction == 'next' && this.index === 1) return;
                if (direction == 'prev' && this.index === MaxLen - 1) return;

                // 移除DOM 创建DOM
                var html = this.create(index, 1);
                $elem[direction == 'next' ? 'first' : 'last']().remove();
                DOM.list[direction == 'next' ? 'append' : 'prepend'](html);
            });

            // 设置当前题目数
            this.subscribe('setPage', function() {
                this.DOM.title.find('em').text(this.formatNumber(this.index+1));
            });

            // 跳转到下一题
            this.subscribe('next', function() {
                var elem = this.DOM.list[0],
                    len = this.config.data.length - 1,
                    isShowCard = this.index === len,
                    index = (this.index + 1 > len) ? len : (this.index + 1),
                    scroll= -(index * this.screen.width);

                // 进行预加载下一题
                this.next = true;
                this.index = index;
                this.publish('setPage');

                // 到最后题提交完，跳转到答题卡;
                if (isShowCard) this.publish('showCard', true);

                // 下一题，
                this.setTransition(elem, {transform: {duration: '300ms', easing: 'ease-out'}});
                this.setTransform(elem, {translate: {x: scroll, y: 0}});
            });

            // 手势滑动 上一题，下一题
            this.subscribe('touch', function(){
                var _this = this,
                    DOM = this.DOM,
                    len = this.config.data.length - 1,
                    minTx = parseInt(this.screen.width / 3, 10),
                    $elem, startTx, startTy, defaultXY, listX, has, direction, height;

                // 滑动开始
                DOM.list.on('touchstart', function(e) {
                    e.preventDefault();
                    $elem = $(e.target).parents('li > div');
                    startTx = e.touches[0].clientX;
                    startTy = e.touches[0].clientY;
                    if ($elem.length) {
                        height = $elem.height() - _this.screen.height + _this.titleHeight;
                        defaultXY = _this.getTransform($elem[0], 'translate');
                        listX = _this.getTransform(this, 'translate').x;
                    }
                });
                // 滑动中
                DOM.list.on('touchmove', function(e) {
                    e.preventDefault();
                    var scroll,
                        currentTx = e.touches[0].clientX,
                        currentTy = e.touches[0].clientY,
                        diff = startTx - currentTx,
                        distanceX = startTx - currentTx,
                        distanceY = startTy - currentTy,
                        fix = _this.index * _this.screen.width;

                    //横向滚动 上一题下一题
                    if (Math.abs(distanceX) >= Math.abs(distanceY)) {
                        // 滚动差值
                        direction = diff > 0 ? true : false;
                        if (!direction && _this.index === 0) {
                            scroll = Math.abs(diff);
                        } else {
                            scroll = direction ? -(Math.abs(diff) + fix) : -(fix - Math.abs(diff));
                        }
                        // 拖动时滚动
                        _this.setTransition(this, {transform: {duration: '0ms'}});
                        _this.setTransform(this, {translate: {x: scroll, y: 0}});
                    } else {
                        if (!$elem.length || $elem.height() < (_this.screen.height - _this.titleHeight)) return;
                        diff = defaultXY.y - distanceY;
                        _this.setTransform(this, {translate: {x: listX, y: 0}});
                        _this.setTransition($elem[0], {transform: {duration: '0ms'}});
                        _this.setTransform($elem[0], {translate: {x: 0, y: diff}});
                    }
                });
                // 滑动结束
                DOM.list.on('touchend', function(e) {
                    e.preventDefault();
                    var endTx = e.changedTouches[0].clientX,
                        endTy = e.changedTouches[0].clientY,
                        distanceX = startTx - endTx,
                        distanceY = startTy - endTy;
                    has = Math.abs(startTx - endTx) > minTx;

                    if (Math.abs(distanceX) >= Math.abs(distanceY)) {
                        // 设置 _this.index
                        if (has) {
                            direction ? (_this.index++) : (_this.index--);
                        }
                        if (_this.index < 0) _this.index = 0;
                        if (_this.index > len) _this.index = len;

                        // 设置滚动
                        var scroll = -(_this.index * _this.screen.width);
                        _this.setTransition(this, {transform: {duration: '300ms', easing: 'ease-out'}});
                        _this.setTransform(this, {translate: {x: scroll, y: 0}});

                        if (has) _this.publish('setPage');
                    } else {
                        if (!$elem.length || $elem.height() < (_this.screen.height - _this.titleHeight)) return;
                        var y = _this.getTransform($elem[0], 'translate').y;
                        _this.setTransition($elem[0], {transform: {duration: '300ms', easing: 'ease-out'}});
                        if ( y > 0 && Math.abs(y) > 0) _this.setTransform($elem[0], {translate: {x: 0, y: 0}});
                        if (y < 0 && Math.abs(y) > height) _this.setTransform($elem[0], {translate: {x: 0, y: -height}});
                    }
                });

                // 动画结束回调
                DOM.list.on('webkitTransitionEnd transtionend', function() {
                    if (has || _this.next) {
                        if (_this.next) direction = 'next';
                        _this.publish('preloading', direction ? 'next' : 'prev');
                        var diff = _this.index * _this.screen.width - _this.screen.width;
                        if (_this.index === 0) diff = 0;
                        if (_this.index === _this.config.data.length - 1) diff = diff - _this.screen.width;
                        $(this).css('left', diff < 0 ? 0 : diff);
                        has = false;
                        _this.next = false;
                    }
                });
            });

            // 做题
            this.subscribe('answer', function() {
                var isExec = false,
                	isBtn = false,
                	DOM = this.DOM,
                    _this = this;

                // 答题事件
                DOM.list.on('tap', 'ol > li', function(e) {
                	e.preventDefault();
                    var $elem = $(this),
                        type = _this.config.data[_this.index].type;
                        
                    if (isExec) return;
					isExec = true;
                    
					setTimeout(function() { isExec = false; }, 100);
                    switch (type) {
                        case 1:
                        case 4: single($elem); break;
                        case 2: multi($elem); break;
                        default: single($elem); break;
                    }
                });

                // 下一题按钮事件
                DOM.list.on('tap', '.ui-Mexam-buttom > a', function(e) {
                    e.preventDefault();
                    if (isBtn) return;
                    
                    isBtn = true;
                    setTimeout(function() {
                    	isBtn = false;
                        _this.publish('next');
                    }, 200);
                });

                // 同步答题卡
                function setAnswerCard(val) {
                    DOM.cardList.find('li').eq(_this.index)[val ? 'addClass' : 'removeClass']('active');
                };

                // 单选题
                function single(elem) {	
                    var $elem = elem,
                        answer = $elem.attr('data-answer');
                        
                    // 设置答案，添加选中，设置答题卡
                    _this.answer[_this.index] = answer;
                    $elem.addClass('active').siblings().removeClass('active');
                    if (_this.answer) setAnswerCard(true);
					
                    setTimeout(function() {
                        _this.publish('next');
                    }, 200);
                }

                // 多选题
                function multi(elem) {
                    var $elem = elem,
                        select = _this.answer[_this.index] || [],
                        answer = $elem.attr('data-answer'),
                        index = $.inArray(answer, select);
					
                    index > -1 ?
                        (select.splice(index, 1))
                        :
                        (select.push(answer));

                    // 设置答案，添加选中，设置答题卡
                    select.sort(); //按字母排序
                    _this.answer[_this.index] = select;
                    $elem[index > -1 ? 'removeClass' : 'addClass']('active');
                    setAnswerCard(select.length ? true : false);
                }
            });

            // 答题卡跳转
            this.subscribe('topicJump', function() {
                var DOM = this.DOM,
                    _this = this,
                    isExec = false,
                    len = this.config.data.length;

                DOM.cardList.on('tap', 'li', function(e) {
                    e.preventDefault();
                    var html, scroll, left, length = len < 3 ? len : 3,
                        $elem = $(this),
                        defaultIndex = parseInt($elem.text(), 10),
                        index = defaultIndex;

                    if (isExec) return;

                    if (len <= 3) {
                        index = 0;
                    } else {
                        index = index - 2;
                        if (index < 1 || len === 1) index = 0;
                        if (index >= len-2) index = (len-1) - 2;
                    }

                    // 获取TPL
                    html = _this.create(index, length);
                    _this.index = defaultIndex - 1;
                    left = _this.index * _this.screen.width - _this.screen.width;
                    scroll= -(_this.index * _this.screen.width);
                    if (_this.index === 0) left = 0;
                    if (_this.index === len - 1) left = left - _this.screen.width;

                    //设置DOM
                    DOM.card.removeClass('ui-Mexam-show');
                    DOM.list.css('left', left < 0 ? 0 : left).html(html);
                    _this.setTransition(DOM.list[0], {transform: {duration: '300ms', easing: 'ease-out'}});
                    _this.setTransform(DOM.list[0], {translate: {x: scroll, y: 0}});
                    _this.publish('setPage');

                    setTimeout(function() { isExec = false; }, 100);
                });

            });

            // 显示答题卡
            this.subscribe('showCard', function(val) {
                var DOM = this.DOM;
                DOM.card[val ? 'addClass' : 'removeClass']('ui-Mexam-show');
            });

            // 组件事件
            this.subscribe('events', function() {
                var cle, DOM = this.DOM,
                    _this = this;

                // 展现答题卡
                DOM.preview.on('touchstart', function(e) {
                    e.preventDefault();
                    var has = DOM.card.hasClass('ui-Mexam-show');
                    DOM.card[has ? 'removeClass' : 'addClass']('ui-Mexam-show');
                });

                // 提交答题卡
                DOM.card.on('touchstart', '.ui-Mexam-buttom > a', function(e) {
                    e.preventDefault();

                    var answer = [];
                    $.each(_this.answer, function(i, item) {
                        answer.push({
                            id: _this.config.data[i].id,
                            answer: item
                        });
                    });

                    if ($.isFunction(_this.config.send)) {
                        var send = _this.config.send.apply(_this, [answer, _this.time]);
                        if (send === false) {
                            return false;
                        }
                        _this.destroy();
                    }
                });

                // 返回按钮事件
                DOM.back.on('touchstart', function(e) {
                    e.preventDefault();
                    _this.destroy();
                });

                $(window).on(this.resize, function() {
                    clearInterval(cle);
                    cle = setTimeout(function() {
                        _this.publish('resize');
                    }, 300);
                });
            });

            // 页面计时器
            this.subscribe('time', function() {
                var time, _this = this,
                    minute = 0,
                    second = 0,
                    DOM = this.DOM.time.find('span');
                var timing = function() {
                    second++;
                    if (second == 60) {
                        second = 0;
                        minute++;
                    }
                    _this.time = (minute * 60) + second;
                    DOM.text(_this.formatNumber(minute) + ':' + _this.formatNumber(second));
                };
                setInterval(timing, 1000);
            });

            // Resize
            this.subscribe('resize', function() {
                this.next = false;
                this.screen = {
                    width: window.innerWidth,
                    height: window.innerHeight
                };

                var DOM = this.DOM,
                    len = this.config.data.length > 2 ? 3 : this.config.data.length,
                    left = this.index * this.screen.width - this.screen.width,
                    translate = -(this.index * this.screen.width);
                if (this.index === 0) left = 0;
                if (this.index === len - 1) left = left - this.screen.width;

                this.setTransition(DOM.list[0], {transform: {duration: '0ms'}});
                this.setTransform(DOM.list[0], {translate: {x: translate, y: 0}});
                DOM.list.css({ width: this.screen.width * len, left: left })
                        .children()
                        .css({width: this.screen.width, height: this.screen.height})
                        .children()
                        .removeAttr('style');
            });

            return this;
        }
    };

    // 将 init.prototype 指向 Mexam.prototype
    Mexam.fn.init.prototype = Mexam.fn;

    // 扩展至全局
    return Mexam;
}));