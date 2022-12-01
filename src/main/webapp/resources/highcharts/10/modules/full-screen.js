/*
 Highstock JS v10.2.1 (2022-08-29)

 Advanced Highcharts Stock tools

 (c) 2010-2021 Highsoft AS
 Author: Torstein Honsi

 License: www.highcharts.com/license
*/
(function(b){"object"===typeof module&&module.exports?(b["default"]=b,module.exports=b):"function"===typeof define&&define.amd?define("highcharts/modules/full-screen",["highcharts"],function(d){b(d);b.Highcharts=d;return b}):b("undefined"!==typeof Highcharts?Highcharts:void 0)})(function(b){function d(b,c,d,f){b.hasOwnProperty(c)||(b[c]=f.apply(null,d),"function"===typeof CustomEvent&&window.dispatchEvent(new CustomEvent("HighchartsModuleLoaded",{detail:{path:c,module:b[c]}})))}b=b?b._modules:{};
d(b,"Extensions/Exporting/Fullscreen.js",[b["Core/Renderer/HTML/AST.js"],b["Core/Utilities.js"]],function(b,c){function d(){this.fullscreen=new g(this)}var f=c.addEvent,e=c.fireEvent,h=[],g=function(){function c(a){this.chart=a;this.isOpen=!1;a=a.renderTo;this.browserProps||("function"===typeof a.requestFullscreen?this.browserProps={fullscreenChange:"fullscreenchange",requestFullscreen:"requestFullscreen",exitFullscreen:"exitFullscreen"}:a.mozRequestFullScreen?this.browserProps={fullscreenChange:"mozfullscreenchange",
requestFullscreen:"mozRequestFullScreen",exitFullscreen:"mozCancelFullScreen"}:a.webkitRequestFullScreen?this.browserProps={fullscreenChange:"webkitfullscreenchange",requestFullscreen:"webkitRequestFullScreen",exitFullscreen:"webkitExitFullscreen"}:a.msRequestFullscreen&&(this.browserProps={fullscreenChange:"MSFullscreenChange",requestFullscreen:"msRequestFullscreen",exitFullscreen:"msExitFullscreen"}))}c.compose=function(a){-1===h.indexOf(a)&&(h.push(a),f(a,"beforeRender",d))};c.prototype.close=
function(){var a=this,b=a.chart,c=b.options.chart;e(b,"fullscreenClose",null,function(){if(a.isOpen&&a.browserProps&&b.container.ownerDocument instanceof Document)b.container.ownerDocument[a.browserProps.exitFullscreen]();a.unbindFullscreenEvent&&(a.unbindFullscreenEvent=a.unbindFullscreenEvent());b.setSize(a.origWidth,a.origHeight,!1);a.origWidth=void 0;a.origHeight=void 0;c.width=a.origWidthOption;c.height=a.origHeightOption;a.origWidthOption=void 0;a.origHeightOption=void 0;a.isOpen=!1;a.setButtonText()})};
c.prototype.open=function(){var a=this,b=a.chart,c=b.options.chart;e(b,"fullscreenOpen",null,function(){c&&(a.origWidthOption=c.width,a.origHeightOption=c.height);a.origWidth=b.chartWidth;a.origHeight=b.chartHeight;if(a.browserProps){var d=f(b.container.ownerDocument,a.browserProps.fullscreenChange,function(){a.isOpen?(a.isOpen=!1,a.close()):(b.setSize(null,null,!1),a.isOpen=!0,a.setButtonText())}),k=f(b,"destroy",d);a.unbindFullscreenEvent=function(){d();k()};var e=b.renderTo[a.browserProps.requestFullscreen]();
if(e)e["catch"](function(){alert("Full screen is not supported inside a frame.")})}})};c.prototype.setButtonText=function(){var a=this.chart,c=a.exportDivElements,d=a.options.exporting,e=d&&d.buttons&&d.buttons.contextButton.menuItems;a=a.options.lang;d&&d.menuItemDefinitions&&a&&a.exitFullscreen&&a.viewFullscreen&&e&&c&&(c=c[e.indexOf("viewFullscreen")])&&b.setElementHTML(c,this.isOpen?a.exitFullscreen:d.menuItemDefinitions.viewFullscreen.text||a.viewFullscreen)};c.prototype.toggle=function(){this.isOpen?
this.close():this.open()};return c}();"";"";return g});d(b,"masters/modules/full-screen.src.js",[b["Core/Globals.js"],b["Extensions/Exporting/Fullscreen.js"]],function(b,c){b.Fullscreen=c;c.compose(b.Chart)})});
//# sourceMappingURL=full-screen.js.map