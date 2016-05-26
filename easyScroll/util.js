;(function() {

'use strict';

POI.util = {
    /*
        事件代理
        parentNode 代理父元素zepto对象
        attr 监听属性
    */
    delegate : function(parentNode, attr) {
        var self = POI, type = 'click',target, timer, canClick = false,
        touchStart;
        attr = attr || 'js_handle';
        if (!parentNode || !parentNode.length) return;
        parentNode.bind('touchstart', function( e ) {
            if( e.touches && e.touches.length == 1){
                target = e.target;
                touchStart = e.touches[0]
                canClick = true;
                clearTimeout( timer );
                timer = setTimeout(function(){
                    reset();
                },450);
            }else{
                reset();
            }
        }).bind( 'touchmove', function( e ) {
            reset();
        } ).bind( 'touchend', function( e ) {
            if(e.target == target && canClick) {
                click( e );
            }
            reset();
        } );
        
        function reset(){
            clearTimeout( timer );
            target = touchStart = null;
            canClick = false;
        }
        function click(e){
            var target = e.target , val;
            while(target){
                val = $(target).attr(attr);
                if(val && /^js_/.test(val) && typeof self[val] === 'function'){//方法名以js_开头
                    if(self[val]($(target), e) === false){
                        break;
                    }else{
                        target = target.parentNode;
                    }
                }else if(target === parentNode[0]){
                    break;
                }else{
                    target = target.parentNode;
                }
            }
        }
    },
    get_arr : function( str ){
        return {
            p : function( s ){
                this.str +=s;
                return this;
            },
            str : str === undefined ? '' : (str+'')
        }
    },
    loadImg : function(src, success, error) {
        var img = new Image();
        img.onload = function(){
            img = img.onload = img.onerror = img.onabort = null;
            success();
        }
        img.onerror = img.onabort = function(){
            img = img.onload = img.onerror = img.onabort = null;
            error();
        }
        img.src= src;
    },
    //本地存储，一个参数(key)为取，两个参数(key,value)为存
    storage : function() {
        if (arguments.length==1){
            return localStorage.getItem(arguments[0]);
        }
        localStorage.setItem(arguments[0],arguments[1]);
    },
    // 模拟a标签跳转
    locationRedirect: function(url) {
        if(POI.browser.ios){
            var $lr = $("#locationRedirect"),
                ev = document.createEvent('HTMLEvents');
            ev.initEvent('click', false, true);
            if($lr.length) {
                $lr.attr("href", url);
            } else {
                $lr = $('<a id="locationRedirect" href="' + url + '" style="display:none;"></a>');
                $(document.body).append($lr);
            }
            $lr[0].dispatchEvent(ev);
        }else{
            window.location.href = url;
        }
    },
    /**
     * 获取url参数.
     * @param {String} [name] 参数名称，无此参数时返回所有参数
     * @return {String|Object} name存在时返回相应的值，否则返回所有参数
     */
    getUrlParam: function(name, str) {
        var url = str || window.location.search.substr(1);
        if (!url) {
            return null;
        }
        url = decodeURI(url);
        if (name) {
            var value = new RegExp('(?:^|&)' + name + '=([^&]*)(&|$)', 'g').exec(url);
            return value && window.decodeURIComponent(value[1]) || '';
        }
        var result = {};
        var reg = /(?:^|&)([^&=]+)=([^&]*)(?=(&|$))/g;
        var item;
        while (item = reg.exec(url)) {
            result[item[1]] = window.decodeURIComponent(item[2]);
        }
        return result;
    }
}

$(function() {
    $(window)
    .bind('touchstart mousedown', function(event) {
        //手指按下变色效果
        $(event.target).closest(".canTouch,.more,.more-bottom-blue").addClass('hover');
    }).bind('touchmove touchend mouseup', function() {
        // 取消手指按下样式
        $('.hover').removeClass('hover');
    });
    var agent = navigator.userAgent,
        os = agent.match(/iphone|ipad|ipod/i) ? "ios" : "android",
        version6 = /OS [1-6]/.test(agent);
    if(os=='ios' && !version6){
        document.body.className += 'ver7'
    }
});

})();