/*
    滑动公用代码
    目前：导览图、地铁线路滑动、电影票滑动在使用
*/
(function(global) {
'use strict';
var utils = {
    addEvent : function(el, type, context) {
        el.addEventListener(type, context, false);
    },
    removeEvent : function(el, type, context) {
        el.removeEventListener(type, context, false);
    },
    getComputedPosition : function(el) {
        var matrix = global.getComputedStyle(el, null);
        matrix = (matrix.webkitTransform||'').split(')')[0].split(',');
        return {x:matrix[4]||0, y:matrix[5]||0};
    },
    now : function() {
        return (Date.now || Date.getTime)();
    },
    trim : function(str){
        return str===null?'':(str+'').replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,'');
    },
    removeClass : function( ele, className) {
        var old = ' ' + this.trim( ele.className ).replace(/[\t\r\n\f]/g,'') + ' ';
        old = old.replace(' ' + className + ' ', '');
        ele.className = old;
    },
    /*
        current : 当前位置
        start ： 起始位置
        time ：滑动时间
        lowerMargin ： 最小边界值[一般都未负数]
        wrapperSize : 外层box的尺寸
        deceleration ：加速度, 默认为 0.0006
    */
    momentum : function(current, start, time, lowerMargin, wrapperSize, deceleration) {//减速函数【复制的Iscroll的】
        var distance = current - start,
            speed = Math.abs(distance) / time,
            destination,
            duration;
        deceleration = deceleration === undefined ? 0.0006 : deceleration;
        destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 ); // s + v^2/2a
        duration = speed / deceleration;// v / a = time
        if ( destination < lowerMargin ) {
            destination = wrapperSize ? lowerMargin - ( wrapperSize / 2.5 * ( speed / 8 ) ) : lowerMargin;
            distance = Math.abs(destination - current);
            duration = distance / speed;
        } else if ( destination > 0 ) {
            destination = wrapperSize ? wrapperSize / 2.5 * ( speed / 8 ) : 0;
            distance = Math.abs(current) + destination;
            duration = distance / speed;
        }
        return {
            destination: Math.round(destination),
            duration: duration
        };
    }
},
Scroll = function(el, options) {
    options = options||{};
    this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
    if(!this.wrapper)throw el+' :is not found!';
    this.scroller = this.wrapper.children[0];
    if(!this.scroller)throw this.wrapper+' :not find child!';
    this.moveing = false;//是否在手动移动
    this.move_align = '';//记录手势滑动方向
    this.startPoint = 0;//记录上次手势位置
    this.x = 0;//上次移动x坐标
    this.y = 0;//上次移动y坐标
    this.nowPos = 0;//记录当前滚动到的位置
    this.startTime = 0;//记录滚动开始时间，用于计算平均速度
    this.startPos = 0;//缓动速度计算开始位置
    this.max = 0;//最大边界值
    this.scrollStyle = this.scroller.style;//换乘style引用
    this.align = options.align == 'x' ? 'x' : 'y';//滚动方向，x水平，y垂直
    this.preventDefault = options.preventDefault===undefined;
    this.move_callback = options.move_callback || function(){};//移动回调
    this.snap = options.snap === true;//是否停在子元素上
    this.snap_callback = options.snap_callback || function(){};//移动一页回调,必须配置了 snap 才回调
    this.currentSnap = null;
    this.movepx = 0;//每次统计时候移动的距离
    this.childs = this.snap ? [].slice.call(this.scroller.children, 0) : [];
    this.backTime = 600;//反弹时间
    this.timer = null;
    this.refresh();
    if( 'moveto' in options ) {
        this.moveto(options.moveto > this.max ? this.max : options.moveto < this.min ? this.min : options.moveto);
    }
    this._init();
};
Scroll.prototype = {
    _init : function(){
        utils.addEvent(this.wrapper, 'touchstart', this);
        utils.addEvent(this.wrapper, 'touchmove', this);
        utils.addEvent(this.wrapper, 'touchend', this);
        utils.addEvent(this.wrapper, 'touchcancel', this);
        utils.addEvent(this.scroller, 'webkitTransitionEnd', this);
    },
    refresh : function( fig ) {//dom结构发生变化调用该方法重新计算相关大小
        var self = this, sum = 0,
            align = self.align;
        self.wrapperSize = align== 'x' ? self.wrapper.clientWidth : self.wrapper.clientHeight;
        self.min = self.wrapperSize - (align== 'x' ? self.scroller.offsetWidth : self.scroller.offsetHeight);//最小边界值
        self.min = Math.min(self.max, self.min);
        self.childs = self.snap ? [].slice.call(self.scroller.children, 0) : [];
        self.childs.forEach( function( item , i) {//缓存滚动到节点的边界值
            item._scroll = sum;
            item._center = sum + ( align == 'x' ? item.offsetWidth : item.offsetHeight ) / 2 ;
            sum += align == 'x' ? item.offsetWidth : item.offsetHeight;
        } );
        if( fig ) {//fig标志是否重置到开始位置
            self.moveto(0);
        } else {// 表示重置到最大最小区间就行
            self.resetPos();
        }
    },
    destroy : function() {//销毁对象
        utils.removeEvent(this.wrapper, 'touchstart', this);
        utils.removeEvent(this.wrapper, 'touchmove', this);
        utils.removeEvent(this.wrapper, 'touchend', this);
        utils.removeEvent(this.wrapper, 'touchcancel', this);
        utils.removeEvent(this.scroller, 'webkitTransitionEnd', this);
        this.scroller = null, this.wrapper = null, this.childs = null;
        this.refresh = null, this.destroy = null;
        if( this.currentSnap ) {
            utils.removeClass( this.currentSnap , 'selected');
            this.currentSnap = null;
        }
    },
    handleEvent : function(e) {
        switch( e.type ) {
            case 'touchstart' :
                this._start(e);
                break;
            case 'touchmove' :
                this._move(e);
                break;
            case 'touchend' :
            case 'touchcancel' :
                this._end(e);
                break;
            case 'webkitTransitionEnd' :
                this._transitionEnd(e);
                break;
        }
    },
    _start : function(e) {
        this.startPoint = this.align== 'x' ? e.touches[0].pageX : e.touches[0].pageY;
        this.x = e.touches[0].pageX;
        this.y = e.touches[0].pageY;
        this.startTime = utils.now();
        this.moveing = true;
        this.preventDefault && e.preventDefault();
        this.startPos = this.nowPos = Math.round(utils.getComputedPosition(this.scroller)[this.align]);
        this.moveto(this.nowPos);
        //this.scrollStyle.webkitTransitionTimingFunction = 'cubic-bezier(0.1, 0.57, 0.1, 1)';
        this.scrollStyle.webkitTransitionTimingFunction = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.move_align = '';
    },
    _move : function(e) {
        var nowPoint = this.align== 'x' ? e.touches[0].pageX : e.touches[0].pageY, nowTime,
            disPos = nowPoint - this.startPoint,
            x = e.touches[0].pageX, y = e.touches[0].pageY;
        if(!this.move_align){
            if( Math.abs(x - this.x) - Math.abs(y - this.y) > 5) {
                this.move_align = 'x';
            }else if(Math.abs(y - this.y) - Math.abs(x - this.x) >= 5) {
                this.move_align = 'y';
            }else{
                this.move_align = '';
            }
        }
        if(this.move_align == this.align || this.preventDefault){
            e.preventDefault();
            e.stopPropagation();
        }
        if(this.nowPos + disPos > this.max || this.nowPos + disPos < this.min){//如果超出可滑动区域则滑动减速
            this.nowPos += disPos/3;
        }else{
            this.nowPos += disPos;
        }
        this.startPoint = nowPoint;
        this.moveto(this.nowPos);
        nowTime = utils.now();
        if(nowTime - this.startTime > 300 && Math.abs(this.startPos - this.nowPos) > 10){//每300毫秒记录一次时间和位置，便于滑动结束后计算平均速度
            this.startTime = nowTime, this.startPos = this.nowPos;
        }
    },
    _end : function(e) {
        var duration = utils.now() - this.startTime, momentumPos,
            snapObj;
        this.moveing = false;
        if(this.preventDefault){
            e.preventDefault();
            e.stopPropagation();
        }
        if(this.nowPos > this.max || this.nowPos < this.min){
            this.resetPos();
        }else if(duration < 300){
            momentumPos = utils.momentum(this.nowPos, this.startPos, duration, this.min, this.wrapperSize);
            this.movepx = this.nowPos - this.startPos;
            this.nowPos = momentumPos.destination;
            duration = momentumPos.duration||0;
            if(this.nowPos < this.max && this.nowPos > this.min && this.snap){
                this.nowPos = this._getSnapPos( this.nowPos ).pos;
            }
            this.moveto(this.nowPos, duration);
        }else{
            if( this.snap ) {
                snapObj = this._getSnapPos( this.nowPos );
                if( snapObj.pos != this.nowPos ) {
                    this.moveto(snapObj.pos, 300);
                }
            } else {
                this.resetPos();
            }
        }
    },
    _transitionEnd : function() {//动画结束
        var duration, momentumPos, snapObj;
        if( this.moveing )return;
        this._transitionDuration(0);
        if(this.nowPos > this.max || this.nowPos < this.min){
            this.resetPos();
        }else{
            if( this.snap ) {
                snapObj = this._getSnapPos( this.nowPos );
                if( this.nowPos != snapObj.pos) {
                    duration = this.movepx ? ( snapObj.pos - this.nowPos ) * 300 / this.movepx : 300;
                    momentumPos = utils.momentum(this.nowPos, snapObj.pos, duration, this.min, this.wrapperSize);
                    this.moveto( this.nowPos , momentumPos.duration||0);
                } else {
                    this._nearestSnap(this.nowPos);
                    this.move_callback(this.nowPos);
                }
            } else {
                this.move_callback(this.nowPos);
            }
        }
    },
    resetPos : function(){//回弹到可滑动区间
        var nowPos = this.nowPos, max = this.max, min = this.min;
        if(nowPos > max || nowPos < min) {
            nowPos = nowPos > max ? max : nowPos < min ? min : nowPos;
            this.moveto( nowPos, this.backTime);
        }
    },
    moveto : function(nowT, time) {//指定时间滚动到指定位置
        var self = this;
        self._transitionDuration(time);
        self._translate(nowT);
        if( !time && self.snap ) {
            clearTimeout( self.timer );
            self.timer = setTimeout( function() {
                self.snap && self._nearestSnap( nowT )
            } , 60);
        }
        time && clearTimeout( self.timer );
        self.move_callback(nowT);
    },
    _translate : function(pos) {
        var transform = {
            x : 'translate(' + pos +'px, 0px) translateZ(0px)',
            y : 'translate(0px, ' + pos + 'px) translateZ(0px)'
        }
        this.nowPos = pos;
        this.scrollStyle.webkitTransform = transform[this.align];
    },
    _transitionDuration : function(time) {
        time = time || 0;
        this.scrollStyle.webkitTransitionDuration = time == 0 ? '0s' : (time + 'ms');
    },
    _nearestSnap : function( num ) {//标志当前页标签
        var self = this, selected = self.scroller.querySelector('.selected'),
            snapObj = self._getSnapPos( num ), tmp;
        clearTimeout( self.timer );
        if( snapObj.current != selected) {
            tmp = utils.trim( snapObj.current.className );
            snapObj.current.className = tmp + ' selected';
            self.currentSnap != snapObj.current && self.snap_callback( snapObj.current );
            selected && utils.removeClass( selected , 'selected');
            self.currentSnap = snapObj.current;
        }
    },
    _getSnapPos : function( num ) {//获取需要滚动到的位置
        var self = this, pos = self.nowPos, current = null;
        num = num === undefined ? self.nowPos : num;
        num = -num;
        self.childs.forEach( function( item ) {
            if( num < item._center && !current) {
                current = item;
                pos = -item._scroll;
            }
        } );
        current =  current || self.childs[self.childs.length-1];
        return {pos : pos , current : current};
    }
};
/*
    el : 普通选择器或者原生dom对象
    options : {
            align : 'x'; //滚动方向，x水平，y垂直 默认垂直
            preventDefault : true;//是否阻止系统其它默认事件，默认值为true
            move_callback : function(x){};//滑动回调函数，参数x代表当前滑动的位置
            moveto : -150;// 设置初始滑动位置，默认为0；不能超过可滑动范围
    }
*/
global.easyScroll = function(el, options) {//对外提供的接口
    var scroll = new Scroll(el, options);
    return {
            refresh : function( fig ){
                scroll && scroll.refresh( fig );
            },
            destroy : function() {
                scroll && scroll.destroy();
                scroll = null;
            },
            moveto : function( obj , time ) {
                scroll && scroll.moveto( -obj._scroll , typeof time == 'number' ? time : 300);
            }
        };
};

})(window);