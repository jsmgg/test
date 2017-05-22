import $ from 'jquery';
import swiper from 'swiper';

var mySwiper;

$(function(){
  mySwiper = new Swiper ('.swiper-container', {
    direction: 'horizontal',
    autoplay: 2000,
    loop: true,
    // 如果需要分页器
    // pagination: '.swiper-pagination',
    
    // 如果需要前进后退按钮
    // nextButton: '.swiper-button-next',
    // prevButton: '.swiper-button-prev',

    pagination : '.banner .swiper-pagination',
    paginationType : 'bullets',
    // onSlideChangeStart(swiper){
    //     var paginations=$('.swiper-pagination').children();
    //     paginations.eq(swiper.realIndex).addClass('swiper-pagination-bullet-active').siblings().removeClass('swiper-pagination-bullet-active');
    // }
  })  
});

export default mySwiper;