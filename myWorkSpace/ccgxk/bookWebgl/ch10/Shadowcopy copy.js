
// 生成深度图
var SHADOW_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +  // 顶点数据
  'uniform mat4 u_MvpMatrix;\n' +  // 模型矩阵
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +  // 这个矩阵是光源看场景的
  '}\n';

// 片元，也是深度图
var SHADOW_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 0.0);\n' + // 红颜色的深度图
  '}\n';

// 常规顶点着色器
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +  // 顶点位置
  'attribute vec4 a_Color;\n' +     // 颜色
  'uniform mat4 u_MvpMatrix;\n' +   // 摄像机投影矩阵
  'uniform mat4 u_MvpMatrixFromLight;\n' +    // 光源投影矩阵
  'varying vec4 v_PositionFromLight;\n' +     // 顶点在光源视角下的位置
  'varying vec4 v_Color;\n' +    // 顶点颜色
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +   // 摄像机矩阵下的顶点位置
  '  v_PositionFromLight = u_MvpMatrixFromLight * a_Position;\n' +  // 顶点在光源下的位置
  '  v_Color = a_Color;\n' +  // 传递颜色
  '}\n';

// 常规片元着色器
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_ShadowMap;\n' +      // 接收深度图
  'varying vec4 v_PositionFromLight;\n' +   // 光源矩阵的顶点位置
  'varying vec4 v_Color;\n' + 
  'void main() {\n' +
  '  vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;\n' +  // 不懂，阴影贴图
  '  vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);\n' +
  '  float depth = rgbaDepth.r;\n' + // 取出深度值
  '  float visibility = (shadowCoord.z > depth + 0.005) ? 1.0 : 1.0;\n' +  // 阴影
  '  gl_FragColor = vec4(v_Color.rgb * visibility, v_Color.a);\n' +  // 计算最终的颜色
  '}\n';

var OFFSCREEN_WIDTH = 2048, OFFSCREEN_HEIGHT = 2048;  // 阴影贴图的宽度和高度
var LIGHT_X = 0, LIGHT_Y = 7, LIGHT_Z = 2; // 光源的坐标

function main() {  // 主函数
  var canvas = document.getElementById('webgl');

  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  var shadowProgram = createProgram(gl, SHADOW_VSHADER_SOURCE, SHADOW_FSHADER_SOURCE);  // 阴影着色器
  shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');
  shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');
  if (shadowProgram.a_Position < 0 || !shadowProgram.u_MvpMatrix) {
    console.log('Failed to get the storage location of attribute or uniform variable from shadowProgram'); 
    return;
  }

  // 初始化常规着色器
  var normalProgram = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);  // 常规渲染
  normalProgram.a_Position = gl.getAttribLocation(normalProgram, 'a_Position');
  normalProgram.a_Color = gl.getAttribLocation(normalProgram, 'a_Color');
  normalProgram.u_MvpMatrix = gl.getUniformLocation(normalProgram, 'u_MvpMatrix');
  normalProgram.u_MvpMatrixFromLight = gl.getUniformLocation(normalProgram, 'u_MvpMatrixFromLight');
  // 光源视角矩阵
  normalProgram.u_ShadowMap = gl.getUniformLocation(normalProgram, 'u_ShadowMap');
  if (normalProgram.a_Position < 0 || normalProgram.a_Color < 0 || !normalProgram.u_MvpMatrix ||
      !normalProgram.u_MvpMatrixFromLight || !normalProgram.u_ShadowMap) {
    console.log('Failed to get the storage location of attribute or uniform variable from normalProgram'); 
    return;
  }

  // 顶点三角形
  var triangle = initVertexBuffersForTriangle(gl);
  var plane = initVertexBuffersForPlane(gl);
  if (!triangle || !plane) {
    console.log('Failed to set the vertex information');
    return;
  }

  // 离屏渲染的阴影贴图的 (FBO)  
  var fbo = initFramebufferObject(gl);
  if (!fbo) {
    console.log('Failed to initialize frame buffer object');
    return;
  }
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

  // 清除颜色、深度测试
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);

  var viewProjMatrixFromLight = new Matrix4(); // 储存从光源看的矩阵
  // 设置该矩阵，70是视角场，近场1，远场100
  viewProjMatrixFromLight.setPerspective(70.0, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1.0, 100.0);
  viewProjMatrixFromLight.lookAt(LIGHT_X, LIGHT_Y, LIGHT_Z, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

  var viewProjMatrix = new Matrix4();   // 摄像机矩阵
  viewProjMatrix.setPerspective(45, canvas.width/canvas.height, 1.0, 100.0);
  viewProjMatrix.lookAt(0.0, 7.0, 9.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

  var currentAngle = 0.0; // 当前的旋转角度
  var mvpMatrixFromLight_t = new Matrix4(); // 矩阵，光源视角看三角
  var mvpMatrixFromLight_p = new Matrix4(); // 矩阵，光源视角看平面
  var tick = function() {  // 动画
    currentAngle = animate(currentAngle);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);               // 切换到离屏渲染 FBO
    gl.viewport(0, 0, OFFSCREEN_HEIGHT, OFFSCREEN_HEIGHT);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);   // 清除FBO    


    gl.useProgram(shadowProgram); // 阴影贴图着色器
    drawTriangle(gl, shadowProgram, triangle, currentAngle, viewProjMatrixFromLight); // 阴影画图形
    mvpMatrixFromLight_t.set(g_mvpMatrix); // 稍后使用 三角
    drawPlane(gl, shadowProgram, plane, viewProjMatrixFromLight);
    mvpMatrixFromLight_p.set(g_mvpMatrix); // 稍后使用 平面

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);   // gl 的绘图目标切换为默认
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    // Clear color and depth buffer

    gl.useProgram(normalProgram); // 常规绘制
    gl.uniform1i(normalProgram.u_ShadowMap, 0);  // Pass 0 because gl.TEXTURE0 is enabled
    // 常规绘制三角形和平面
    gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_t.elements);
    drawTriangle(gl, normalProgram, triangle, currentAngle, viewProjMatrix);  // 旋转的三角形
    gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements);
    drawPlane(gl, normalProgram, plane, viewProjMatrix);

    window.requestAnimationFrame(tick, canvas);
  };
  tick(); // 动画循环
}

// 坐标变换矩阵
var g_modelMatrix = new Matrix4();  // 全局模型
var g_mvpMatrix = new Matrix4();  // 全局投影
function drawTriangle(gl, program, triangle, angle, viewProjMatrix) {  // 画三角
  g_modelMatrix.setRotate(angle, 0, 1, 0);
  draw(gl, program, triangle, viewProjMatrix);
}

function drawPlane(gl, program, plane, viewProjMatrix) {  // 画平面
  g_modelMatrix.setRotate(-45, 0, 1, 1);  // 旋转 45 度
  draw(gl, program, plane, viewProjMatrix);
}

function draw(gl, program, o, viewProjMatrix) {  // 常规绘制
  initAttributeVariable(gl, program.a_Position, o.vertexBuffer);
  if (program.a_Color != undefined)
    initAttributeVariable(gl, program.a_Color, o.colorBuffer);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);

  // 计算模型投影矩阵，并将结果传递给 u_MvpMatrix
  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

  gl.drawElements(gl.TRIANGLES, o.numIndices, gl.UNSIGNED_BYTE, 0);
}

// 选快递盒子、放快递盒子
function initAttributeVariable(gl, a_attribute, buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}

function initVertexBuffersForPlane(gl) {
  // 一个平面
  //  v1------v0
  //  |        | 
  //  |        |
  //  |        |
  //  v2------v3

  // 顶点坐标
  var vertices = new Float32Array([
    3.0, -1.7, 2.5,  -3.0, -1.7, 2.5,  -3.0, -1.7, -2.5,   3.0, -1.7, -2.5    // v0-v1-v2-v3
  ]);

  // 颜色
  var colors = new Float32Array([
    1.0, 1.0, 1.0,    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,   1.0, 1.0, 1.0
  ]);

  // 索引
  var indices = new Uint8Array([0, 1, 2,   0, 2, 3]);

  var o = new Object(); // 用于封装并返回多个缓冲区对象

  // 将顶点信息写入缓冲区对象
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
  o.colorBuffer = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
  if (!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) return null; 

  o.numIndices = indices.length;  // 储存索引数量

  // 解绑这个缓存对象
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}

function initVertexBuffersForTriangle(gl) {
  // 生成一个三角形
  //       v2
  //      / | 
  //     /  |
  //    /   |
  //  v0----v1

  // 顶点坐标
  var vertices = new Float32Array([-0.8, 3.5, 0.0,  0.8, 3.5, 0.0,  0.0, 3.5, 1.8]);
  // 颜色
  var colors = new Float32Array([1.0, 0.5, 0.0,  1.0, 0.5, 0.0,  1.0, 0.0, 0.0]);    
  // 索引
  var indices = new Uint8Array([0, 1, 2]);

  var o = new Object();  // 同上

  // 写入缓冲对象
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
  o.colorBuffer = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
  if (!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) return null; 

  o.numIndices = indices.length;

  // 解绑这个缓存对象
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}



function initArrayBufferForLaterUse(gl, data, num, type) {
  // 创建一个缓冲区对象
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // 将数据写入缓冲区对象
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // 储存必要的信息，以便有序的数据分配给属性变量
  buffer.num = num;
  buffer.type = type;

  return buffer;
}

// 创建一个元素缓冲区对象？？
function initElementArrayBufferForLaterUse(gl, data, type) {
  // 创建一个缓冲区对象
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // 将数据写入缓冲区
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

  buffer.type = type;

  return buffer;
}

// 初始化帧缓冲区对象
function initFramebufferObject(gl) {
  var framebuffer, texture, depthBuffer;

  // 一个错误处理函数
  var error = function() {
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    if (texture) gl.deleteTexture(texture);
    if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
    return null;
  }

  // 一个帧缓冲区对象 (FBO)
  framebuffer = gl.createFramebuffer();
  if (!framebuffer) {
    console.log('Failed to create frame buffer object');
    return error();
  }

  // 一个纹理对象，设置其大小和参数
  texture = gl.createTexture(); // 一个储存深度图的对象
  if (!texture) {
    console.log('Failed to create texture object');
    return error();
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  // 一个渲染缓冲区对象，设置其大小和参数
  depthBuffer = gl.createRenderbuffer(); // 储存深度附件
  if (!depthBuffer) {
    console.log('Failed to create renderbuffer object');
    return error();
  }
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

  // 纹理和缓冲区对象，附加到 FBO
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

  // 检查 FBO 是否完整
  var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (gl.FRAMEBUFFER_COMPLETE !== e) {
    console.log('Frame buffer object is incomplete: ' + e.toString());
    return error();
  }

  framebuffer.texture = texture; // 将纹理对象存到 FBO，方便后续操作

  // 解绑
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);

  return framebuffer;
}

var ANGLE_STEP = 40;   // 旋转速度（度/秒）

var last = Date.now(); // 记录上次调用的时间
function animate(angle) {
  var now = Date.now();   // 记录当前的时间
  var elapsed = now - last;
  last = now;
  // 更新旋转的角度
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle % 360;
}
