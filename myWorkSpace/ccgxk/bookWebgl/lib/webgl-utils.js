/*
 * 版权所有2010，Google Inc.
 * 版权所有。
 *
 * 在源和二进制形式中重新分配和使用，有或没有
 * 如果以下条件为
 * 大都会：
 *
 *     * 源代码的再分配必须保留上述版权
 * 请注意，此条件列表和以下免责声明。
 *     * 以二进制形式重新分配必须复制上述
 * 版权通知，此条件列表和以下免责声明
 * 在文档和/或其他材料中
 * 分配。
 *     * Google Inc.的名称也不是其名称
 * 贡献者可用于认可或推广从
 * 该软件未经特定事先书面许可。
 *
 * 该软件由版权所有者和贡献者提供
 * “按原样”以及任何明示或暗示的保证，包括但不
 * 仅限于适销性和健身的隐含保证
 * 特定目的被否决。在任何情况下都不会版权
 * 所有者或贡献者对任何直接，间接，偶然的责任负责
 * 特殊，示例性或结果损失（包括但不包括
 * 仅限于替代商品或服务的采购；失去使用，
 * 数据或利润；或业务中断）但是
 * 责任理论，无论是合同，严格的责任还是侵权理论
 * （包括疏忽或其他）以任何方式出现
 * 即使告知这种损坏的可能性，该软件也是如此。
 */


/**
 * @fileoverview 该文件包含每个WebGL程序都需要的功能
 * 一种或另一种方式的版本。
 *
 * 而不是手动设置上下文，建议
 * 使用。这将检查成功或失败。关于失败
 * 将尝试向用户介绍一条学术消息。
 *
 *       gl = webglutils.setupwebgl（canvas）;
 *
 * 用于动画WebGL应用程序的使用Settimeout或SetInterval是
 * 灰心。建议您构建渲染
 * 这样的循环。
 *
 *       函数渲染（）{
 *         window.requestanimationframe（渲染，画布）;
 *
 *         //渲染
 *         ...
 *       }
 *       使成为（）;
 *
 * 这将使您的渲染功能达到刷新率
 * 您的显示的内容，但如果您的应用不是
 * 可见的。
 */

WebGLUtils = function() {

/**
 * 为故障消息创建HTML
 * @param {string} canvasContainerId 容器的ID
 *        帆布。
 * @return {string} HTML。
 */
var makeFailHTML = function(msg) {
  return '' +
        '<div style="margin: auto; width:500px;z-index:10000;margin-top:20em;text-align:center;">' + msg + '</div>';
  return '' +
    '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
    '<td align="center">' +
    '<div style="display: table-cell; vertical-align: middle;">' +
    '<div style="">' + msg + '</div>' +
    '</div>' +
    '</td></tr></table>';
};

/**
 * 获取WebGL浏览器的消息
 * @type {string}
 */
var GET_A_WEBGL_BROWSER = '' +
  'This page requires a browser that supports WebGL.<br/>' +
  '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';

/**
 * Mesasge for need better hardware
 * @type {string}
 */
var OTHER_PROBLEM = '' +
  "It doesn't appear your computer can support WebGL.<br/>" +
  '<a href="http://get.webgl.org">Click here for more information.</a>';

/**
 * 创建一个WebGL上下文。如果创建失败，它将
 * 更改<canvas>容器的内容物
 * 标记到具有WebGL的正确链接的错误消息。
 * @param {Element} canvas. 帆布元素创建一个
 *     上下文。
 * @param {WebGLContextCreationAttirbutes} opt_attribs 任何
 *     您要传递的创建属性。
 * @param {function:(msg)} opt_onError 致电的功能
 *     如果创建过程中存在错误。
 * @return {WebGLRenderingContext} 创建的上下文。
 */
var setupWebGL = function(canvas, opt_attribs, opt_onError) {
  function handleCreationError(msg) {
      var container = document.getElementsByTagName("body")[0];
    //var container = canvas.parentNode;
    if (container) {
      var str = window.WebGLRenderingContext ?
           OTHER_PROBLEM :
           GET_A_WEBGL_BROWSER;
      if (msg) {
        str += "<br/><br/>Status: " + msg;
      }
      container.innerHTML = makeFailHTML(str);
    }
  };

  opt_onError = opt_onError || handleCreationError;

  if (canvas.addEventListener) {
    canvas.addEventListener("webglcontextcreationerror", function(event) {
          opt_onError(event.statusMessage);
        }, false);
  }
  var context = create3DContext(canvas, opt_attribs);
  if (!context) {
    if (!window.WebGLRenderingContext) {
      opt_onError("");
    } else {
      opt_onError("");
    }
  }

  return context;
};

/**
 * 创建一个WebGL上下文。
 * @param {!Canvas} canvas 帆布标签以获取上下文
 *     从。如果未传递，将创建一个。
 * @return {!WebGLContext} 创建的上下文。
 */
var create3DContext = function(canvas, opt_attribs) {
  var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
  var context = null;
  for (var ii = 0; ii < names.length; ++ii) {
    try {
      context = canvas.getContext(names[ii], opt_attribs);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  return context;
}

return {
  create3DContext: create3DContext,
  setupWebGL: setupWebGL
};
}();

/**
 * 在交叉浏览器中提供requestAnimationFrame
 * 方式。
 */
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           window.oRequestAnimationFrame ||
           window.msRequestAnimationFrame ||
           function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
             window.setTimeout(callback, 1000/60);
           };
  })();
}

/** * Errata：“ CancelRequestanimationFrame”重命名为“ UccutAnimationFrame”，以反映W3C动画定时规格的更新。 
 * 
 * 取消动画框架请求。 
 * 检查跨浏览器支持，返回到ClearTimeout。 
 * @param {number}  Animation 框架请求。 */
if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = (window.cancelRequestAnimationFrame ||
                                 window.webkitCancelAnimationFrame || window.webkitCancelRequestAnimationFrame ||
                                 window.mozCancelAnimationFrame || window.mozCancelRequestAnimationFrame ||
                                 window.msCancelAnimationFrame || window.msCancelRequestAnimationFrame ||
                                 window.oCancelAnimationFrame || window.oCancelRequestAnimationFrame ||
                                 window.clearTimeout);
}