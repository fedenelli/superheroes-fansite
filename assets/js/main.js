var wH=jQuery(window).height();jQuery(".breadcrumb-fullscreen").css("height",wH),jQuery(".breadcrumb:not(.breadcrumb-fullscreen)").each(function(){jQuery("header.header").addClass("no-breadcrumb-fullscreen")}),jQuery(".breadcrumb.breadcrumb-video-content").each(function(){jQuery("header.header").removeClass("no-breadcrumb-fullscreen")}),jQuery(function(){"use strict";function c(){jQuery("header.header").addClass("phone-menu-bg"),jQuery(".phone-menu-bg").affix({offset:{top:50}})}function d(){jQuery("header.header").removeClass("phone-menu-bg")}function e(){jQuery(".breadcrumb-fullscreen-parent").on("affix-top.bs.affix",function(){jQuery(".before-affix-breadcrumb").css("height",0),navigator.userAgent.indexOf("Safari")!=-1&&navigator.userAgent.indexOf("Chrome")==-1&&jQuery(this).css("bottom",0)}),jQuery(".breadcrumb-fullscreen-parent").on("affix.bs.affix",function(){jQuery(".before-affix-breadcrumb").css("height",a),navigator.userAgent.indexOf("Safari")!=-1&&navigator.userAgent.indexOf("Chrome")==-1&&jQuery(this).css("bottom",b-69)})}function f(){jQuery(".split-equal").each(function(){var a=jQuery(this).find(".big-image").outerHeight();jQuery(".padding-content > div").css("height",a-160)})}var a=jQuery(".breadcrumb").outerHeight();jQuery(window).width()>=1200&&jQuery(".breadcrumb-video-content").each(function(){a=jQuery(".breadcrumb").outerHeight()-250}),jQuery(".breadcrumb-video-content").each(function(){a=jQuery(".breadcrumb").outerHeight()-75}),jQuery(".breadcrumb-fullscreen-parent").after('<div class="before-affix-breadcrumb"></div>');var b=jQuery(window).height();jQuery(".starTitle > *").each(function(){var a=0,b=400,c=jQuery(this);jQuery(window).bind("scroll",function(){var d=jQuery(document).scrollTop(),e=0;d<=a?e=1:d<=b&&(e=1-d/b),c.css("opacity",e)})}),jQuery(window).width()<=768?c():jQuery(window).resize(function(){jQuery(window).width()<=768&&c()}),jQuery(window).width()>=768?d():jQuery(window).resize(function(){jQuery(window).width()>=768&&d()}),jQuery(".breadcrumb-fullscreen-parent").affix({offset:{top:function(){return this.top=a-75}}}),jQuery("header.header").affix({offset:{top:function(){return this.top=a-120}}}),jQuery("header.header").on("affix.bs.affix",function(){jQuery(".project-single").addClass("affix")}),jQuery("header.header").on("affix-top.bs.affix",function(){jQuery(".project-single").removeClass("affix")}),e(),jQuery(window).resize(function(){e(),f()})}),jQuery(document).ready(function(){"use strict";function a(){jQuery("#ava-slider").each(function(){var a=jQuery(window).height();jQuery(this).parent().css("height",a),jQuery(this).css("height",a),jQuery(this).royalSlider({arrowsNav:!0,loop:!1,keyboardNavEnabled:!0,controlsInside:!1,fadeinLoadedSlide:!0,imageScaleMode:"fill",arrowsNavAutoHide:!1,autoScaleSlider:!1,controlNavigation:!1,thumbsFitInViewport:!1,navigateByClick:!0,startSlideId:0,autoPlay:!0,transitionType:"move",globalCaption:!1,slidesSpacing:0,deeplinking:{enabled:!0,change:!1}})})}function b(){jQuery(".rsContent .rsImg").each(function(){jQuery(this).attr("src");jQuery(this).hide()}),jQuery(window).scroll(function(){var a=.5*jQuery(window).scrollTop();jQuery(".rsContent").css({"background-position":"50% "+a+"px"}),console.log(a)})}function c(){var a=jQuery(".aqura-filter-content ul");a.imagesLoaded(function(){a.isotope()}),a.isotope();var b=jQuery(".categories ul"),c=b.find("a");c.on("click",function(){var b=jQuery(this);if(b.hasClass("selected"))return!1;var c=b.parents(".categories ul");c.find(".selected").removeClass("selected"),b.addClass("selected");var d={},e=c.attr("data-option-key"),f=b.attr("data-option-value");return f="false"!==f&&f,d[e]=f,"layoutMode"===e&&"function"==typeof changeLayoutMode?changeLayoutMode(b,d):a.isotope(d),!1})}jQuery("html").fitVids({customSelector:"iframe"}),jQuery(".attachment").find("a > img:not(.attachment-thumbnail)").parent().attr("rel","gallery").fancybox({fitToView:!0,autoSize:!0,margin:30,autoScale:!0,width:"100%",height:"100%",showNavArrows:!0,showCloseButton:!0,helpers:{media:{}}}),jQuery(".page-loader").delay(800).fadeOut("slow"),jQuery(".lightbox").attr("rel","gallery").fancybox({fitToView:!0,autoSize:!0,margin:30,autoScale:!0,width:"100%",height:"100%",showNavArrows:!0,showCloseButton:!0,helpers:{media:{}}}),jQuery(".single-post-content").find("a > img").parent().attr("rel","gallery").fancybox({fitToView:!0,autoSize:!0,margin:30,autoScale:!0,width:"100%",height:"100%",showNavArrows:!0,showCloseButton:!0,helpers:{media:{}}}),jQuery(".star").each(function(){postars(jQuery(".cover").get(0)).init()}),jQuery(function(){jQuery(".player").YTPlayer()}),b(),a(),jQuery(window).resize(function(){b(),a()}),jQuery(".open-menu").on("click",function(){jQuery(this).toggleClass("active"),jQuery(".menu-fixed-container").toggleClass("open")}),jQuery(".x-filter").on("click",function(){jQuery(".open-menu").toggleClass("active"),jQuery(".menu-fixed-container").toggleClass("open")}),jQuery(".menu-fixed-container > nav > ul > li > a").on("click",function(){jQuery(this).parent().siblings().toggleClass("no-hovered"),jQuery(this).parent().toggleClass("click"),jQuery(this).parent().siblings().removeClass("click")}),jQuery(".menu-fixed-container > nav > ul > li > .sub-menu").parent().addClass("hover-sub-menu"),jQuery(".menu-fixed-container > nav > ul > li  > .sub-menu").on("click",function(){jQuery(this).parent().toggleClass("hovered-sub-menu ")}),jQuery(".menu-fixed-container nav ul li .sub-menu").parent().find("> a").on("click",function(a){a.preventDefault()}),$(".sm-countdown").length>0&&($(".sm-countdown").each(function(){var a=$(this),b=a.hasClass("sm-style1")?"val":"text";a.ccountdown(a.data("date"),b)}),$(".sm-countdown.sm-style1 .element").knob({draw:function(){var a=this.angle(this.cv),b=this.startAngle,c=b+a,d=!0,e=6,f=e/180*Math.PI;this.g.lineWidth=this.lineWidth,this.g.strokeStyle=d?this.o.fgColor:this.fgColor;var g=parseInt(b/Math.PI*180)%360,h=parseInt(c/Math.PI*180)%360;h<g&&(h+=360);for(var j=Math.round(h/e)*e,k=g;k<=j;k+=e){this.g.beginPath();var l=k/180*Math.PI;this.g.arc(this.xy,this.xy,this.radius,-(l-f/4),-(l+f/4),!0),this.g.stroke()}for(var m=j+e,k=m;k<g+360;k+=e){this.g.beginPath();var l=k/180*Math.PI;this.g.strokeStyle=this.o.bgColor,this.g.arc(this.xy,this.xy,this.radius,-(l-f/4),-(l+f/4),!0),this.g.stroke()}return!1}})),jQuery(window).scroll(function(){jQuery(document).scrollTop()>200?jQuery(".mb_YTPBar").css({display:"none"}):jQuery(".mb_YTPBar").css({display:"block"})}),c(),jQuery(window).resize(function(){c()}),jQuery(".owl-carousel").owlCarousel({items:1,nav:!0,navText:['<i class="fa fa-chevron-left"></i>','<i class="fa fa-chevron-right"></i>']}),jQuery(window).load(function(){jQuery(window).scroll(function(){jQuery(document).scrollTop()>300?jQuery(".goTop").css({bottom:"50px"}):jQuery(".goTop").css({bottom:"-80px"})}),jQuery("#overlay").fadeOut()}),jQuery(".goTop").on("click",function(){return jQuery("html, body").animate({scrollTop:0},"slow"),!1});var d=new Instafeed({get:"user",userId:3525630579,accessToken:"3525630579.1677ed0.97c989299c974ff79ded19ab4812f339",sortBy:"most-liked",template:'<li><a href="{{link}}" target="_blank"><img class="img-responsive" src="{{image}}" /></a></li>',target:"instagram-sidebar-widget",limit:9,resolution:"low_resolution"});$("#instagram-sidebar-widget").length>0&&d.run(),jQuery(".trak-item audio").each(function(){var a=jQuery(this)[0].duration,b=moment.duration(a,"seconds"),c="",d=b.hours();d>0&&(c=d+":"),c=c+b.minutes()+":"+b.seconds(),jQuery(this).parent().find(".trak-duration").text(c)}),jQuery(".jplayerButton").on("click",function(){jQuery(this).toggleClass("active"),jQuery(".playlist-wrapper").fadeToggle("open"),jQuery("body").toggleClass("opacityPlaylist")})});