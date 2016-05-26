;(function(POI,$) {
    function ScrollPage(options) {
        options = options || {};
        this.id = 'js_scrollPage'+(Math.random()*10000|0)
        this.header_tpl = options.defaultHeader ? '<div class="default_header"><div class="top"><i js_handle="js_close_scrollPage"></i><h2>'+options.defaultHeader+'</h2></div></div>' : (options.header||'');//头部html
        this.content_tpl = options.content;//中间滑动内容html
        this.tpl = '';
        this.wrap = $( '#js_pagebody' );
        this.titlebar_height = (POI.util||{}).getTitleBarHeight ? POI.util.getTitleBarHeight() : 44;//titlebar高度
        this.box = null;//弹层
        this.page_y = 0;//scrollPage_page当前移动位置
        this.content_y = 0;//页面内容scroller当前移动位置
        this.point_y = 0;//当前位置
        this.box_top = -($(window).height()*0.1|0);//弹层吸顶位置
        this.move = false;//是否可移动
        this.scroller = null;//滚动元素
        this.scroller_height = 0;//滑动区域可视高度 
        this.list_height = 0;//列表高度
        this.page = null;//整个页面
        this.time = 0;
        this.tmp_y = 0;//用于计算平均速度的
        this.up_scroll = 50;//向下拉动超过了该值，切换上方提示语
        this.top_text_default = '下拉关闭页面';
        this.top_text_tips = '松开关闭页面';
        this.tips = null;
        this.loading = null;
        this.loading_text = '加载中...';
        this.loading_end_text = '没有更多数据了';
        this.loadinged = false;//标志是否加载完了
        this.move_time = 0;//计算开始移动的时间
        this.timer = null;
        this.more = function(){};
        this.clear = function(){};
        this.init();
    }
    ScrollPage.prototype = {
        constructor : ScrollPage,
        init : function() {
            var self = this;
            self.init_tpl();
            self.init_view();
        },
        init_tpl : function() {
            this.tpl = '<div class="scrollPage" id="'+this.id+'" style="padding-top:'+(this.titlebar_height===44?-this.box_top:(-this.box_top+20))+'px;">'+
                        '<div class="scrollPage_mask" js_handle="js_close_scrollPage"></div>'+
                        '<p class="titlebar_hack"></p>'+
                        '<div class="scrollPage_page">'+
                        '<div class="scrollPage_header">'+
                        this.header_tpl+
                        '</div>'+//end .scrollPage_header
                        '<div class="scrollPage_content">'+
                        '<p class="scrollPage_top_tips">'+ this.top_text_default +'</p>'+
                        '<div class="scrollPage_scroller">'+
                        this.content_tpl+
                        '</div>'+//end .scrollPage_scroller
                        '<p class="scrollPage_loading">'+ this.loading_text +'</p>'+
                        '</div>'+//end .scrollPage_content
                        '</div>'+//end .scrollPage_page
                        '</div>';//end .scrollPage
        },
        init_view : function() {
            var self = this;
            self.wrap.append( self.tpl );
            self.box = $('#'+self.id);
            self.scroller = $( '.scrollPage_scroller' , self.box );
            self.page = $( '.scrollPage_page' , self.box );
            self.tips = $( '.scrollPage_top_tips' , self.box );
            self.loading = $( '.scrollPage_loading' , self.box );
            setTimeout(function(){
                $( '.scrollPage_mask' , self.box ).addClass( 'show' );
                $( '.scrollPage_page' , self.box ).addClass( 'up' );
                self.scroller_height = $(window).height() - $( '.scrollPage_header' , self.box).height() - (self.titlebar_height - 44);
                $( '.scrollPage_content' , self.box ).height( self.scroller_height );
                setTimeout(function(){
                    self.init_event();
                    self.moveFn();
                },300);
            },50);
        },
        init_event : function() {
            var self = this;
            self.page.bind( 'touchstart', function( e ){
                self._start( e );
            } ).bind( 'touchmove', function( e ) {
                self._move( e );
            } ).bind( 'touchend', function( e ) {
                self._end( e );
            } ).bind( 'touchcancel', function( e ) {
                self._end( e );
            } );
            $('.scrollPage_mask', self.box).bind('touchmove',function( e ){
                e.preventDefault();
                e.stopPropagation();
            });
            $('.default_header h2').bind('touchend',function(e){
                self._end(e);
                e.preventDefault();
                e.stopPropagation();
            })
        },
        _start : function( e ) {
            this.index++;
            if( e.touches.length > 1 ){
                return ;
            }
            this.move = true;
            this.list_height = this.scroller.height();
            this.scroller.unbind( 'webkitTransitionEnd' );
            this.point_y = e.touches[0].pageY;
            this.tmp_y = this.content_y = Math.round(this.getComputedPosition(this.scroller[0]).y);
            this.move_time  = this.time = Date.now();
            this.move_to(this.content_y,this.scroller);
        },
        _move : function( e ) {
            var nowY = e.touches[0].pageY;
            var cut = nowY - this.point_y;
            e.preventDefault();
            e.stopPropagation();
            if( e.touches.length > 1 ){
                return ;
            }
            if( this.page_y == this.box_top ){//判断整个弹层是否已经盖住了页面,盖住了就可以滑动里面的内容区域了
                if( this.content_y > 0 || (-this.content_y + this.scroller_height > this.list_height) ) {
                    cut/=2;
                }
                this.content_y+=cut;
                /*if( this.scroller_height >= this.list_height ){
                    this.content_y = Math.max(0,this.content_y);
                }*/
                this.move_to(this.content_y, this.scroller);
                this.change_status();
                var now_time = Date.now();
                if( now_time - this.time >= 300 && Math.abs(this.content_y - this.tmp_y) > 10) {
                    this.tmp_y = this.content_y;
                    this.time = now_time;
                }
            } else {
                this.page_y+=cut;
                this.page_y = Math.max(this.page_y,this.box_top);
                this.move_to(this.page_y, this.page);
                if( this.page_y == this.box_top && this.titlebar_height == 64 ){
                    $( '.titlebar_hack' , this.box ).addClass( 'show' );
                }
            }
            this.point_y = nowY;
            this.moveFn();
        },
        _end : function( e ) {
            this.move = false;
            if( this.page_y == this.box_top ) {
                if( this.is_out() ) {
                    if( this.content_y >= this.up_scroll && Date.now() - this.move_time > 150 ){
                        this.destroy();
                    } else {
                        this.reset_scroller();
                    }
                } else {
                    this.scroller_end( this.list_height );
                }
            } else {
                if( this.page_y > -this.box_top ) {//往下拉超过了临界值就直接收起所有
                    this.destroy();
                } else {
                    this.reset_page( this.page_y )
                }
            }
            this.moveFn();
        },
        is_out : function() {
            return this.content_y > 0 || (-this.content_y + this.scroller_height > this.list_height)
        },
        getComputedPosition : function(el) {
            var matrix = window.getComputedStyle(el, null);
            matrix = (matrix.webkitTransform||'').split(')')[0].split(',');
            return {x:matrix[4]||0, y:matrix[5]||0};
        },
        scroller_end : function( list_height ) {//惯性阶段
            var self = this;
            var cut_time = Date.now() - this.time;
            if( cut_time <= 300 && Math.abs(this.content_y - this.tmp_y) > 10 && cut_time>25 ) {
                var momentumPos = this.momentum( this.content_y , this.tmp_y , cut_time , this.scroller_height - list_height, this.scroller_height , 0.003 );
                this.content_y = momentumPos.destination;// content_y  这里还未滑动就修改了该值
                if( self.is_out() ){
                    this.scroller.unbind( 'webkitTransitionEnd' ).bind( 'webkitTransitionEnd', function(){
                        self.scroller.unbind( 'webkitTransitionEnd' );
                        if( !self.move ){
                            self.change_status();
                            self.reset_scroller();
                        }
                        self.moveFn();
                    } );
                } else {
                    this.scroller.unbind( 'webkitTransitionEnd' ).bind('webkitTransitionEnd',function(){
                        self.scroller.unbind( 'webkitTransitionEnd' );
                        self.moveFn();
                    });
                }
                this.move_to( this.content_y , this.scroller , (Math.max(momentumPos.duration || 0,20)|0)+'ms cubic-bezier(0.1, 0.57, 0.1, 1)');
            } else if( this.is_out() ){
                this.reset_scroller();
            }
        },
        reset_scroller : function() {
            var time = 300;
            if( this.content_y > 0 || this.scroller_height >= this.list_height ) {
                this.content_y = 0;
            } else {
                this.content_y = this.scroller_height - (this.list_height);
            }
            this.move_to(this.content_y, this.scroller, time + 'ms ease-out');
            return time;
        },
        change_status : function() {//监控tips和 loading 状态
            var self = this;
            var content_y = self.content_y;
            var opacity = 0;
            if( Date.now() - this.move_time > 150 ) {
                var text = content_y >= self.up_scroll ? self.top_text_tips : this.top_text_default;
                if( self.tips._text != text){
                    self.tips.text( text )[content_y >= self.up_scroll?'addClass':'removeClass']( 'up' );
                    self.tips._text = text;
                }
            }
            opacity = Math.max(Math.min(1,content_y/self.up_scroll),0);
            self.tips.css('opacity', opacity);
            if( content_y < 0 && self.is_out() && self.scroller_height < self.list_height) {//这里触发加载更多
                self.loading.show().addClass( 'show' );
                if( self.loadinged ) {
                    self.loading.text( self.loading_end_text );
                    clearTimeout( self.timer );
                    self.timer = setTimeout( function() {
                        self.loading.removeClass( 'show' );
                        self.timer = setTimeout(function(){
                            self.loading.hide();
                        },600);
                    }, 1000);
                } else {
                    self.loading.text( self.loading_text );
                    self.more.call(null, self.box );
                }
            }
        },
        reset_page : function( page_y ) {//只滑动了一点点，就根据滑动的位置重置位置
            var time = 300;
            if( page_y >= 0 ) {
                this.page_y = 0;
            } else {
                this.page_y = this.box_top;
                if( this.titlebar_height == 64 ){
                    $( '.titlebar_hack' , this.box ).addClass( 'show' );
                }
            }
            this.move_to(this.page_y, this.page, time+'ms ease-out');
            return time;
        },
        move_to : function( y , obj , transition ) {
            var style = obj[0].style;
            style.transition = style.webkitTransition = transition ? transition : 'none';
            style.transform = style.webkitTransform = 'translate(0px, ' + y + 'px) translateZ(0px)';
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
        },
        destroy : function( fn ) {
            var self = this;
            var time = 400;
            if( fn ){
                self.clear = fn;
                return;
            }
            self.tpl = self.header_tpl = self.content_tpl = null;
            $('.default_header h2').unbind();
            self.page.unbind().bind('touchstart',function( e ){
                e.preventDefault();
                e.stopPropagation();
            }).bind( 'touchend' , function(e) {
                e.preventDefault();
                e.stopPropagation();
            } );
            $( '.scrollPage_mask', self.box).removeClass( 'show' );
            $( '.titlebar_hack' , self.box ).removeClass( 'show' );
            self.move_to( self.scroller_height, self.page, time+'ms ease-out');
            setTimeout(function(){
                self.page.unbind();
                $('.scrollPage_mask', self.box).unbind();
                self.box.remove();
                self.page = self.box = self.scroller = null;
            },time+50);
            self.clear.call(null,self.box);
        },
        refresh : function( reset ) {
            this.list_height = this.scroller.height();
            reset && this.move_to(0,this.scroller);
            reset && ( this.content_y = 0 );
            reset && ( this.loadinged = false );
            this.loading.removeClass( 'show' );
        },
        load_end : function() {//加载完了调用
            this.loadinged = true;
        },
        load_more : function( fn ) {
            if( typeof fn === 'function' ) {
                this.more = fn;
            }
        },
        moveFn : function(){
            $(window).trigger('scroll',{'from':'scrollPage'});
        }//滑动时调用
    };
    var scrollPage;
    $.extend(POI,{
        /*
            options:
                    defaultHeader:@string 默认头部样式，只需要传入文字即可，优先去默认头部字段
                    header ： @string 头部模板字段，一般是在默认头部基础上增加了其他模块
                    content ：@string 列表数据模板
                    
        */
        scrollPage : function( options ){
            scrollPage = new ScrollPage( options );
            return {
                /*
                    reset表示是否重置到初始位置,
                    列表中任何涉及dom尺寸的修改后都需要调用改方法
                */
                refresh : function( reset ) {
                    scrollPage && scrollPage.refresh( reset );
                },
                /*
                    加载完后需要通知插件已经加载完了
                */
                load_end : function() {
                    scrollPage && scrollPage.load_end();
                },
                /*
                    滑到底部时候出发fn 方法
                */
                load_more : function( fn ){
                    scrollPage && scrollPage.load_more( fn );
                },
                /*
                    有fn参数为注册关闭弹层的时候调用的方法
                    没有时为关闭弹层
                */
                destroy : function( fn ) {
                    if( typeof fn == 'function' && scrollPage ) {
                        scrollPage.destroy( fn );
                    } else {
                        scrollPage && scrollPage.destroy();
                        scrollPage = null;
                    }
                },
                adjust : function(){
                    var self = this;
                    self.scroller_height = $(window).height() - $( '.scrollPage_header' , self.box).height() - (self.titlebar_height - 44);
                    $( '.scrollPage_content' , self.box ).height( self.scroller_height );
                }
            }
        },
        /*
            弹层关闭按钮、蒙层点击出发事件
        */
        js_close_scrollPage : function(){
            scrollPage && scrollPage.destroy();
            scrollPage = null;
        }
    });
})(POI,Zepto)