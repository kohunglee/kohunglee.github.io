
// 阴影顶点着色器
var SHADOW_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'void main() {\n' +  
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '}\n';                         

// 阴影片元着色器
var SHADOW_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'void main() {\n' +
  '  const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);\n' +
  '  const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);\n' +
  '  vec4 rgbaDepth = fract(gl_FragCoord.z * bitShift);\n' + 
  '  rgbaDepth -= rgbaDepth.gbaa * bitMask;\n' + 
  '  gl_FragColor = rgbaDepth;\n' +
  '}\n';

// 场景顶点着色器
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +       
  'attribute vec4 a_Color;\n' +          
  'uniform mat4 u_MvpMatrix;\n' +        
  'uniform mat4 u_MvpMatrixFromLight;\n' + 
  'varying vec4 v_PositionFromLight;\n' + 
  'varying vec4 v_Color;\n' +            
  'void main() {\n' +                    
  '  gl_Position = u_MvpMatrix * a_Position;\n' + 
  '  v_PositionFromLight = u_MvpMatrixFromLight * a_Position;\n' + 
  '  v_Color = a_Color;\n' +             
  '}\n';                                  

// 场景片元着色器
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +             
  'precision mediump float;\n' + 
  '#endif\n' +                   
  'uniform sampler2D u_ShadowMap;\n' +     
  'varying vec4 v_PositionFromLight;\n' + 
  'varying vec4 v_Color;\n' +            
  'void main() {\n' +                    
   
  
  
  '  vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;\n' +
  '  vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);\n' + 
  '  float depth = rgbaDepth.r;\n' +     
  '  float visibility = (shadowCoord.z > depth + 0.005) ? 0.7 : 1.0;\n' + 
  '  gl_FragColor = vec4(v_Color.rgb * visibility, v_Color.a);\n' + 
  '}\n';                                                               

var OFFSCREEN_WIDTH = OFFSCREEN_HEIGHT = 2**10; 
var LIGHT_X = 0, LIGHT_Y = 40, LIGHT_Z = 2; 

function main() { 
  
  var canvas = document.getElementById('webgl');

  
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL'); 
    return;
  }

  
  var shadowProgram = createProgram(gl, SHADOW_VSHADER_SOURCE, SHADOW_FSHADER_SOURCE); 
  shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');       
  shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');     
  if (shadowProgram.a_Position < 0 || !shadowProgram.u_MvpMatrix) { 
    console.log('Failed to get the storage location of attribute or uniform variable from shadowProgram');
    return;
  }

  
  var normalProgram = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE); 
  normalProgram.a_Position = gl.getAttribLocation(normalProgram, 'a_Position');       
  normalProgram.a_Color = gl.getAttribLocation(normalProgram, 'a_Color');             
  normalProgram.u_MvpMatrix = gl.getUniformLocation(normalProgram, 'u_MvpMatrix');     
  normalProgram.u_MvpMatrixFromLight = gl.getUniformLocation(normalProgram, 'u_MvpMatrixFromLight'); 
  normalProgram.u_ShadowMap = gl.getUniformLocation(normalProgram, 'u_ShadowMap');     
  if (normalProgram.a_Position < 0 || normalProgram.a_Color < 0 || !normalProgram.u_MvpMatrix || 
      !normalProgram.u_MvpMatrixFromLight || !normalProgram.u_ShadowMap) {
    console.log('Failed to get the storage location of attribute or uniform variable from normalProgram');
    return;
  }

  
  var triangle = initVertexBuffersForTriangle(gl); 
  var plane = initVertexBuffersForPlane(gl);       
  if (!triangle || !plane) {                       
    console.log('Failed to set the vertex information');
    return;
  }

  
  var fbo = initFramebufferObject(gl);
  if (!fbo) {
    console.log('Failed to initialize frame buffer object'); 
    return;
  }
  gl.activeTexture(gl.TEXTURE0); 
  gl.bindTexture(gl.TEXTURE_2D, fbo.texture); 

  
  gl.clearColor(0, 0, 0, 1); 
  gl.enable(gl.DEPTH_TEST);  

  var viewProjMatrixFromLight = new Matrix4(); 
  viewProjMatrixFromLight.setPerspective(70.0, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1.0, 100.0); 
  viewProjMatrixFromLight.lookAt(LIGHT_X, LIGHT_Y, LIGHT_Z, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0); 

  var viewProjMatrix = new Matrix4();          
  viewProjMatrix.setPerspective(45, canvas.width/canvas.height, 1.0, 100.0); 
  viewProjMatrix.lookAt(0.0, 7.0, 9.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);       

  var currentAngle = 0.0; 
  var mvpMatrixFromLight_t = new Matrix4(); 
  var mvpMatrixFromLight_p = new Matrix4(); 
  var tick = function() { 
    currentAngle = animate(currentAngle); 

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);               
    gl.viewport(0, 0, OFFSCREEN_HEIGHT, OFFSCREEN_HEIGHT); 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);   

    gl.useProgram(shadowProgram); 
    
    drawTriangle(gl, shadowProgram, triangle, currentAngle, viewProjMatrixFromLight); 
    mvpMatrixFromLight_t.set(g_mvpMatrix); 
    drawPlane(gl, shadowProgram, plane, viewProjMatrixFromLight); 
    mvpMatrixFromLight_p.set(g_mvpMatrix); 

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);               
    gl.viewport(0, 0, canvas.width, canvas.height);         
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    

    gl.useProgram(normalProgram); 
    gl.uniform1i(normalProgram.u_ShadowMap, 0);  
    
    gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_t.elements); 
    drawTriangle(gl, normalProgram, triangle, currentAngle, viewProjMatrix); 
    gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements); 
    drawPlane(gl, normalProgram, plane, viewProjMatrix); 

    window.requestAnimationFrame(tick, canvas); 
  };
  tick(); 
}




var g_modelMatrix = new Matrix4(); 
var g_mvpMatrix = new Matrix4();   
function drawTriangle(gl, program, triangle, angle, viewProjMatrix) {
  
  g_modelMatrix.setRotate(angle, 0, 1, 0); 
  draw(gl, program, triangle, viewProjMatrix); 
}

function drawPlane(gl, program, plane, viewProjMatrix) {
  
  g_modelMatrix.setRotate(-45, 0, 1, 1); 
  draw(gl, program, plane, viewProjMatrix); 
}

function draw(gl, program, o, viewProjMatrix) { 
  initAttributeVariable(gl, program.a_Position, o.vertexBuffer); 
  if (program.a_Color != undefined) 
    initAttributeVariable(gl, program.a_Color, o.colorBuffer); 

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer); 

  
  g_mvpMatrix.set(viewProjMatrix); 
  g_mvpMatrix.multiply(g_modelMatrix); 
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements); 

  gl.drawElements(gl.TRIANGLES, o.numIndices, gl.UNSIGNED_BYTE, 0); 
}


function initAttributeVariable(gl, a_attribute, buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer); 
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0); 
  gl.enableVertexAttribArray(a_attribute); 
}

function initVertexBuffersForPlane(gl) { 
  
  
  
  
  
  

  
  var vertices = new Float32Array([
    3.0, -1.7, 2.5,  -3.0, -1.7, 2.5,  -3.0, -1.7, -2.5,   3.0, -1.7, -2.5    
  ]);

  
  var colors = new Float32Array([
    1.0, 1.0, 1.0,    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,   1.0, 1.0, 1.0
  ]);

  
  var indices = new Uint8Array([0, 1, 2,   0, 2, 3]);

  var o = new Object(); 

  
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT); 
  o.colorBuffer = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);   
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE); 
  if (!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) return null; 

  o.numIndices = indices.length; 

  
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o; 
}

function initVertexBuffersForTriangle(gl) { 
  
  
  
  
  
  

  
  var vertices = new Float32Array([-0.8, 3.5, 0.0,  0.8, 3.5, 0.0,  0.0, 3.5, 1.8]);
  
  var colors = new Float32Array([1.0, 0.5, 0.0,  1.0, 0.5, 0.0,  1.0, 0.0, 0.0]);
  
  var indices = new Uint8Array([0, 1, 2]);

  var o = new Object();  

  
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
  o.colorBuffer = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
  if (!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) return null;

  o.numIndices = indices.length; 

  
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o; 
}

function initArrayBufferForLaterUse(gl, data, num, type) { 
  
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object'); 
    return null;
  }
  
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer); 
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); 

  
  buffer.num = num;     
  buffer.type = type;   

  return buffer; 
}

function initElementArrayBufferForLaterUse(gl, data, type) { 
  
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object'); 
    return null;
  }
  
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer); 
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW); 

  buffer.type = type; 

  return buffer; 
}

function initFramebufferObject(gl) { 
  var framebuffer, texture, depthBuffer; 

  
  var error = function() {
    if (framebuffer) gl.deleteFramebuffer(framebuffer); 
    if (texture) gl.deleteTexture(texture);             
    if (depthBuffer) gl.deleteRenderbuffer(depthBuffer); 
    return null; 
  }

  
  framebuffer = gl.createFramebuffer();
  if (!framebuffer) {
    console.log('Failed to create frame buffer object');
    return error();
  }

  
  texture = gl.createTexture(); 
  if (!texture) {
    console.log('Failed to create texture object');
    return error();
  }
  gl.bindTexture(gl.TEXTURE_2D, texture); 
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); 

  
  depthBuffer = gl.createRenderbuffer(); 
  if (!depthBuffer) {
    console.log('Failed to create renderbuffer object');
    return error();
  }
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); 
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT); 

  
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); 
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0); 
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer); 

  
  var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER); 
  if (gl.FRAMEBUFFER_COMPLETE !== e) { 
    console.log('Frame buffer object is incomplete: ' + e.toString()); 
    return error(); 
  }

  framebuffer.texture = texture; 

  
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);

  return framebuffer; 
}

var ANGLE_STEP = 40;   

var last = Date.now(); 
function animate(angle) { 
  var now = Date.now();   
  var elapsed = now - last; 
  last = now;             
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0; 
  return newAngle % 360; 
}

/*

**核心原理，让你一小时内彻底搞懂：**

这个代码实现了WebGLES中经典的**阴影贴图（Shadow Map）**技术。它的核心思想就是“**从光源看世界，然后把这个世界的深度信息拍下来，最后用这张深度照片来判断谁在阴影里**”。

1.  **“光影摄影师”的工作（生成阴影贴图）**
    *   **视点切换：** 我们不是从摄像机（你的眼睛）来看场景，而是将“摄像机”移动到**光源**的位置（`LIGHT_X, LIGHT_Y, LIGHT_Z`），让它面向场景中心。
    *   **只记录深度：** 此时，我们不渲染物体的颜色，只渲染它们离光源有多远（`gl_FragCoord.z`）。这个距离值被存储在一张特殊的图片（`fbo.texture`，即`u_ShadowMap`）的**红色通道**里。这张图片就是“深度贴图”或“阴影贴图”。
    *   **离屏渲染：** 这张“深度照片”不是直接显示在屏幕上，而是偷偷地拍在了一个“秘密暗房”（`Framebuffer Object, FBO`）里的“照片纸”上。

2.  **“主摄影师”的工作（渲染最终场景并应用阴影）**
    *   **视点恢复：** 摄像机回到我们观众的正常视角。
    *   **查询深度：** 当渲染屏幕上的每一个像素点时，着色器会做两件事：
        1.  **计算当前像素点在光源眼中的位置：** 这通过 `v_PositionFromLight = u_MvpMatrixFromLight * a_Position;` 实现。
        2.  **用这个位置去查“深度照片”：** 它会把这个光源眼中的三维位置转换成2D坐标（`shadowCoord.xy`），然后用这个2D坐标去查询之前拍好的`u_ShadowMap`。查询到的值，就是**从光源看过去，在那个方向上，第一个挡住光线的物体有多远**（`float depth = rgbaDepth.r;`）。
    *   **判断阴影：** 最后，它会将“当前像素点离光源有多远”（`shadowCoord.z`）与“深度照片上记录的第一个物体有多远”（`depth`）进行比较：
        *   如果 `当前像素离光更远 > 深度照片记录的物体离光`，就说明这个像素点被挡住了，它在阴影里。
        *   反之，则说明它被光线直接照亮。
    *   **应用颜色：** 根据判断结果，给像素点施加一个“可见度”因子（`visibility`），如果在阴影里就让颜色变暗（`0.7`），否则保持原色（`1.0`）。

**关键点：**

*   **两次绘制：** 场景中的物体必须先从光源视角绘制一次（生成深度图），再从摄像机视角绘制一次（应用阴影）。
*   **深度图是核心：** 阴影效果完全依赖于这张从光源角度拍下的“深度照片”。
*   **“阴影痤疮”：** `+ 0.005` 是一个小的偏移量，用来防止“阴影痤疮”（Shadow Acne）。由于浮点精度问题，物体表面可能错误地被自身判断为在阴影中。加一个微小的偏移量可以“抬高”深度图上的表面，避免这种自遮挡问题。

希望这个拟人化的注释和解释能帮助你在1小时内掌握这个原理！*/