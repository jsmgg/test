(function(){

function Chart(options){
    options = options || {};
    var view = options.view;
    var clickDom = options.clickDom;
    var scale = 2*window.devicePixelRatio;
    var width = (document.documentElement.clientWidth-30)*scale;//610
    var height = (width/610*200)|0;

    this.view = options.view;
    this.ctx = null;
    this.clickCtx = null;
    this.click = false;
    this.height = height;
    this.width = width;
    this.scale = scale;
    this.clickDom = options.clickDom;//供点击的canvas
    this.data1 = options.data1;//折线数据 帮助人数
    this.data2 = options.data2;//柱状图数据  有效反馈数
    this.leftTextWidth = 0;//20*scale;//左边文字宽度
    this.bottomTextHeight = 20*scale;//下面文字高度
    this.topCutHeight = 6*scale;//坐标轴最上面留白高度
    this.pieWidth = 15*scale;//柱状图宽度
    this.Xleft = 10*scale;//左边间距
    this.Xright = 15*scale;//右边间距
    this.systemWidth = width - this.leftTextWidth;//坐标轴水平宽度
    this.systemHeight = height - this.topCutHeight - this.bottomTextHeight;//坐标轴垂直方向高度
    this.pointX = [];
    this.pix = 1;//数据像素比
    this.init();
}
Chart.prototype = {
    constructor : Chart,
    init : function(){
        this.init_view();
        this.translate(this.ctx);
        this.click && this.translate(this.clickCtx);
        var min_max1 = this.get_min_max( this.data1 );
        var min_max2 = this.get_min_max( this.data2 );
        this.pix = this.draw_line(Math.max(min_max1.max,min_max2.max));
        this.pointX = this.get_x(this.data2.length);
        this.draw_pie();
        this.draw_ploy(min_max1.max);
        this.click && this.draw_click({x:this.pointX[this.pointX.length-1],y:this.topCutHeight});
    },
    init_view : function(){
        var view = this.view;
        var width = this.width;
        var height = this.height;
        var clickDom = this.clickDom;
        var _scale = (1/this.scale).toFixed(6);
        view.width = width;
        view.height = height;
        view.parentNode.style.height = height/this.scale+'px';
        if( clickDom ){
            this.click = true;
            clickDom.width = width;
            clickDom.height = height;
            clickDom.style.webkitTransform = 'scale('+_scale+','+_scale+') translateZ(0)';
            this.clickCtx = clickDom.getContext('2d');
        }
        view.style.webkitTransform = 'scale('+_scale+','+_scale+') translateZ(0)';
        this.ctx = view.getContext('2d');
        
    },
    handle_click : function( e ){
        var self = this;
        self.click && self.draw_click(self.get_canvasPosition(e));
    },
    get_canvasPosition : function( e ){
        var scrollY = document.documentElement.scrollTop||document.body.scrollTop;
        var clientY = e.clientY;
        var clientX = e.clientX;
        var y = clientY + scrollY - this.clickDom.parentNode.offsetTop;
        var x = clientX - this.clickDom.parentNode.offsetLeft;
        x = x*this.scale;
        y = y*this.scale;
        return {x: x|0, y: y|0};
    },
    translate : function( ctx ){
        ctx.scale(1,-1);
        ctx.translate(this.leftTextWidth,-(this.height-this.bottomTextHeight));//左边空了40留着写字，下面空了40写字
        ctx.save();
    },
    /*
        获取数组最小与最大值
    */
    get_min_max : function( arr ){
        arr = arr.concat([]);
        arr.sort(function(a,b){
            return a.num-b.num;
        });
        return {min:arr[0].num,max:arr[arr.length-1].num};
    },
    //画横线
    draw_line : function( max ){
        var one = (this.systemHeight/3)|0;//每个间距实际高度
        var num = 4;
        var ctx = this.ctx;
        max= parseInt(max*1.1);//
        var pix = max/this.systemHeight;//一个像素对应实际大小
        var one_tmp = (pix*one)|0;
        ctx.beginPath();
        ctx.strokeStyle = '#eeeeee';
        ctx.lineWidth = this.scale;
        ctx.moveTo(0,0);
        ctx.lineTo(0,this.systemHeight);
        while(num--){
            ctx.moveTo(0,num*one);
            ctx.lineTo(this.systemWidth,num*one);
        }
        ctx.moveTo(this.systemWidth,0);
        ctx.lineTo(this.systemWidth,this.systemHeight);
        ctx.stroke();
        ctx.closePath();
        return pix;
    },
    /*
        获取x坐标
    */
    get_x : function( num ){
        var len = this.systemWidth-this.Xleft-this.Xright-this.pieWidth;
        var count = (len/(num-1))|0;//每一个柱状图平均分配的宽度
        var pointX=[];
        var pieCenter = (this.pieWidth/2)|0;
        for(var i = 0; i < num; i++){
            pointX.push(this.Xleft+pieCenter+count*i);
        }
        return pointX;
    },
    /*
        画柱状图
    */
    draw_pie : function(){
        var ctx = this.ctx;
        var pointX = this.pointX;
        var pointY = this.data2;
        var pix = this.pix;
        var pieWidth = this.pieWidth;
        ctx.beginPath();
        ctx.strokeStyle='#9cc4f6';
        ctx.lineWidth = pieWidth;//这里用线条代替柱状图
        pointY.forEach(function( item, i ){
            ctx.moveTo(pointX[i],0);
            ctx.lineTo(pointX[i],(item.num/pix)|0);
        });
        ctx.stroke();
        ctx.closePath();
        ctx.save();
        ctx.scale(1,-1);
        ctx.beginPath();
        ctx.fillStyle = '#333333';
        ctx.font = 'lighter '+(11*this.scale)+'px  sans-serif';
        ctx.textAlign = 'center';
        pointY.forEach(function( item, i ){
            ctx.fillText(item.month+'月', pointX[i],pieWidth);
             
        });
        ctx.closePath();
        ctx.restore();
    },
    /*
        画折线
    */
    draw_ploy : function( max ){
        var ctx = this.ctx;
        var pointX = this.pointX;
        var pointY = this.data1;
        var pix = this.pix;
        var points = [];
        var scale = this.scale;
        var maxArc = 4 * scale;//大圆半径
        var minArc = 2 * scale;//小圆半径
        ctx.beginPath();
        ctx.strokeStyle = '#fdc2c4';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2*scale;
        ctx.moveTo(pointX[0],(pointY[0].num/pix)|0);
        points.push({x:pointX[0],y:(pointY[0].num/pix)|0});
        pointY.forEach(function( item , i){
            if( i > 0 ){
                ctx.lineTo(pointX[i],(item.num/pix)|0);
                ctx.stroke();
                points.push({x:pointX[i],y:(item.num/pix)|0});
            }
        });
        ctx.lineTo(pointX[pointX.length-1],0);
        ctx.lineTo(pointX[0],0);
        ctx.lineTo(pointX[0],0);
        pointX[0],(pointY[0].num/pix)|0
        ctx.closePath();
        points.forEach(function( point ){
            ctx.beginPath();//画小红圈
            ctx.fillStyle = '#ffe6df';
            ctx.arc(point.x,point.y,maxArc,0,Math.PI*2);
            ctx.fill();
            ctx.closePath();
            ctx.beginPath();//画小红圈
            ctx.fillStyle = '#ffa0a2';
            ctx.arc(point.x,point.y,minArc,0,Math.PI*2);
            ctx.fill();
            ctx.closePath();
        });
        
    },
    /*
        画点击区域
    */
    draw_click : function(point){
        var self = this;
        var ctx = self.clickCtx;
        var pointX = self.pointX;
        var clickWidth = self.pieWidth * 2;//把可点击区域做大点
        var index = -1;
        ctx.clearRect(-self.leftTextWidth,-self.bottomTextHeight,self.width,self.height);
        pointX.forEach(function(item, i){
            ctx.beginPath();
            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.rect(item-clickWidth/2, 0,clickWidth,self.systemHeight);
            ctx.fill();
            ctx.closePath();
            if( point && ctx.isPointInPath(point.x, point.y)){
                index = i;
            }
        });
        index != -1 && self.draw_tips( index, point.y );
        return index;
    },
    draw_tips : function( index,y ){
        var self = this;
        var ctx = self.clickCtx;
        var num1 = self.data1[index].num;
        var num2 = self.data2[index].num;
        var x = this.pointX[index];
        var _max = Math.max(num1,num2);
        var max = (Math.max(num1,num2)/self.pix)|0;
        var scale = this.scale;
        var minWidth = 45*scale;//大矩形最小宽度
        var fontSize = 10*scale;
        var boxWidth = (minWidth+(_max+'').length*fontSize)|0;
        var maxRectHeight = 35 * scale;//大矩形高度
        var minRectHeight = 12 * scale;//小矩形高度
        var maxArc = 4 * scale;//大圆半径
        var minArc = 2 * scale;//小圆半径
        var point = {x:x-this.pieWidth/2,y:this.systemHeight-y};//小矩形宽度跟 柱状图一致  min+parseInt((max-min)/2)
        var cutX = 0;
        if( point.x+boxWidth+2*scale > this.systemWidth ){//最右边
            cutX = point.x+boxWidth - this.systemWidth+2*scale;
        }
        if( point.y < 10 ){//最小为10
            point.y = 10;
        }
        if( point.y > max ){
            point.y = max;
        }
        if( point.y+minRectHeight+maxRectHeight > this.systemHeight ){
            point.y-= (point.y+minRectHeight+maxRectHeight - this.systemHeight);
        }
        ctx.beginPath();
        ctx.strokeStyle='#d3d3d3';
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = scale;
        ctx.lineJoin = 'round';
        ctx.moveTo(point.x,point.y);//左下角
        ctx.lineTo(point.x,point.y + minRectHeight);
        if( cutX ){
            ctx.lineTo(point.x-cutX,point.y + minRectHeight);
        }
        var leftPoint = {x:point.x-cutX, y:point.y+minRectHeight+maxRectHeight};//左上角, 文案位置需要改点
        ctx.lineTo(leftPoint.x,leftPoint.y);//左上角
        ctx.lineTo(point.x+boxWidth-cutX,point.y+minRectHeight+maxRectHeight);//右上角
        ctx.lineTo(point.x+boxWidth-cutX,point.y+minRectHeight);//右下角
        ctx.lineTo(point.x+this.pieWidth,point.y+minRectHeight);
        ctx.lineTo(point.x+this.pieWidth,point.y);
        ctx.lineTo(point.x,point.y);
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
        ctx.beginPath();//画小红圈
        ctx.fillStyle = '#ffe6df';
        ctx.arc(x,point.y+ minRectHeight-maxArc,maxArc,0,Math.PI*2);
        ctx.fill();
        ctx.closePath();
        ctx.beginPath();//画小红圈
        ctx.fillStyle = '#ffa0a2';
        ctx.arc(x,point.y+ minRectHeight-maxArc,minArc,0,Math.PI*2);
        ctx.fill();
        ctx.closePath();
        this.draw_tipsText(leftPoint,fontSize,index);
    },
    /*
        tips文字
    */
    draw_tipsText : function(leftPoint,fontSize,index){
        var ctx = this.clickCtx;
        var num1 = this.data1[index].num;
        var num2 = this.data2[index].num;
        var text1 = '帮助人数';
        var text2 = '有效反馈';
        var scale = this.scale;
        ctx.save();
        ctx.scale(1,-1);
        ctx.beginPath();
        ctx.fillStyle = '#666';
        ctx.font = 'lighter '+fontSize+'px  sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(text1, leftPoint.x+4*scale, -leftPoint.y+5*scale);
        ctx.fillText(text2, leftPoint.x+4*scale, -leftPoint.y+5*scale+4*scale+fontSize);
        ctx.fillStyle = '#ffa0a2';
        ctx.fillText(num1, leftPoint.x+4*scale+text1.length*fontSize+4*scale,-leftPoint.y+5*scale);
        ctx.fillStyle = '#9cc4f6';
        ctx.fillText(num2, leftPoint.x+4*scale+text1.length*fontSize+4*scale, -leftPoint.y+5*scale+4*scale+fontSize);
        ctx.closePath();
        ctx.restore();
    }
}


/*
ctx.beginPath();
ctx.moveTo(0,0);
ctx.lineTo(510,0);
ctx.lineTo(510,100);
ctx.lineTo(0,100);
ctx.lineTo(0,0);
//ctx.stroke();
ctx.fill();
ctx.closePath();
*/
var chart = new Chart({
    view:document.getElementById('js_chart'),
    clickDom:document.getElementById('js_click_view'),
    data1 : [{month:1,num:55},{month:2,num:60},{month:3,num:45},{month:4,num:65},{month:5,num:50},{month:6,num:40}],
    data2 : [{month:1,num:20},{month:2,num:40},{month:3,num:30},{month:4,num:35},{month:5,num:42},{month:6,num:25}]
});
document.getElementById('js_click_view').addEventListener('click', function( e ){
    chart.handle_click( e );
}, false);

})();