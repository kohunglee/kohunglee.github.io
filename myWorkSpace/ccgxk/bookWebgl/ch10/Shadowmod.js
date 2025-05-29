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

// 变量区
var OFFSCREEN_WIDTH = OFFSCREEN_HEIGHT = 2**10; 
var LIGHT_X = 0, LIGHT_Y = 40, LIGHT_Z = 2; 

// 主函数
function main() { 
  var canvas = document.getElementById('webgl');
  var gl = getWebGLContext(canvas);

  var shadowProgram = createProgram(  // 初始化深度图着色器
                        gl,
                        SHADOW_VSHADER_SOURCE,
                        SHADOW_FSHADER_SOURCE); 
  shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');       
  shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');
  
  var normalProgram = createProgram(  // 初始化主着色器
                        gl,
                        VSHADER_SOURCE,
                        FSHADER_SOURCE);   
  normalProgram.a_Position = gl.getAttribLocation(normalProgram, 'a_Position');       
  normalProgram.a_Color = gl.getAttribLocation(normalProgram, 'a_Color');             
  normalProgram.u_MvpMatrix = gl.getUniformLocation(normalProgram, 'u_MvpMatrix');     
  normalProgram.u_MvpMatrixFromLight = gl.getUniformLocation(normalProgram, 'u_MvpMatrixFromLight'); 
  normalProgram.u_ShadowMap = gl.getUniformLocation(normalProgram, 'u_ShadowMap');     


  
  var triangle = initVertexBuffersForTriangle(gl);  // 两个道具的顶点
  var plane = initVertexBuffersForPlane(gl);       

  var fbo = initFramebufferObject(gl);  // 秘密暗房
  gl.activeTexture(gl.TEXTURE0);  // 初始化纹理
  gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

  gl.clearColor(0, 0, 0, 1);  // 初始化舞台
  gl.enable(gl.DEPTH_TEST); 

  var viewProjMatrixFromLight = new Matrix4();  // 光的矩阵
  viewProjMatrixFromLight.setPerspective(70.0, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1.0, 100.0); 
  viewProjMatrixFromLight.lookAt(LIGHT_X, LIGHT_Y, LIGHT_Z, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0); 

  var viewProjMatrix = new Matrix4();  // 主眼的矩阵
  viewProjMatrix.setPerspective(45, canvas.width/canvas.height, 1.0, 100.0); 
  viewProjMatrix.lookAt(0.0, 7.0, 9.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);       

  var currentAngle = 0.0;  //+ 三个动画使用的临时参数
  var mvpMatrixFromLight_t = new Matrix4();
  var mvpMatrixFromLight_p = new Matrix4(); 

  // 动画
  var tick = function() { 
    currentAngle = animate(currentAngle); 

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);  //+ 初始化深度图绘制
    gl.viewport(0, 0, OFFSCREEN_HEIGHT, OFFSCREEN_HEIGHT); 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);   

    gl.useProgram(shadowProgram);  //+ 绘制深度图
    drawTriangle(gl, shadowProgram, triangle, currentAngle, viewProjMatrixFromLight); 
    mvpMatrixFromLight_t.set(g_mvpMatrix); 
    drawPlane(gl, shadowProgram, plane, viewProjMatrixFromLight); 
    mvpMatrixFromLight_p.set(g_mvpMatrix); 

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);  //+ 初始化主眼绘制       
    gl.viewport(0, 0, canvas.width, canvas.height);         
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    

    gl.useProgram(normalProgram);  //+ 绘制主图
    gl.uniform1i(normalProgram.u_ShadowMap, 0);  
    gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_t.elements); 
    drawTriangle(gl, normalProgram, triangle, currentAngle, viewProjMatrix); 
    gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements); 
    drawPlane(gl, normalProgram, plane, viewProjMatrix); 

    window.requestAnimationFrame(tick, canvas); 
  };
  tick(); 
}



// 矩阵团队
var g_modelMatrix = new Matrix4(); 
var g_mvpMatrix = new Matrix4();

// 画三角
function drawTriangle(gl, program, triangle, angle, viewProjMatrix) {
  g_modelMatrix.setRotate(angle, 0, 1, 0); 
  draw(gl, program, triangle, viewProjMatrix); 
}

// 画平面
function drawPlane(gl, program, plane, viewProjMatrix) {
  g_modelMatrix.setRotate(-45, 0, 1, 1); 
  draw(gl, program, plane, viewProjMatrix); 
}

// 绘制动作
function draw(gl, program, o, viewProjMatrix) { 
  initAttributeVariable(gl, program.a_Position, o.vertexBuffer); 
  if (program.a_Color != undefined) {  // 不可删
    initAttributeVariable(gl, program.a_Color, o.colorBuffer); 
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer); 
  g_mvpMatrix.set(viewProjMatrix); 
  g_mvpMatrix.multiply(g_modelMatrix); 
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements); 
  gl.drawElements(gl.TRIANGLES, o.numIndices, gl.UNSIGNED_BYTE, 0); 
}

// 发送位置颜色小助手
function initAttributeVariable(gl, a_attribute, buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer); 
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0); 
  gl.enableVertexAttribArray(a_attribute); 
}

// 平面的顶点数据
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

// 三角的平面数据
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

// 选快递柜通用程序（顶点数据）
function initArrayBufferForLaterUse(gl, data, num, type) { 
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer); 
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); 
  buffer.num = num;     
  buffer.type = type;   
  return buffer; 
}

// 选快递柜通用程序（元素）
function initElementArrayBufferForLaterUse(gl, data, type) { 
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer); 
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW); 
  buffer.type = type; 
  return buffer; 
}

// 搭建秘密暗房的程序
function initFramebufferObject(gl) { 
  var framebuffer, texture, depthBuffer; 
  framebuffer = gl.createFramebuffer();
  texture = gl.createTexture(); 
  gl.bindTexture(gl.TEXTURE_2D, texture); 
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); 
  depthBuffer = gl.createRenderbuffer(); 
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); 
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT); 
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); 
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0); 
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer); 
  var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER); 
  framebuffer.texture = texture; 
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  return framebuffer; 
}

// 计算要转到的角度
var ANGLE_STEP = 40;   
var last = Date.now(); 
function animate(angle) { 
  var now = Date.now();   
  var elapsed = now - last; 
  last = now;             
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0; 
  return newAngle % 360; 
}

/*******************/

// 初始化并获取WebGL的渲染
function getWebGLContext(canvas, opt_debug) {
  var gl = WebGLUtils.setupWebGL(canvas);
  return gl;
}

// 创建链接程序对象
function createProgram(gl, vshader, fshader) {
  var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
  var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  return program;
}

// 创建着色器对象
function loadShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  return shader;
}


// 谷歌的组件
WebGLUtils = function() {

  // 创建一个WebGL上下文
  var setupWebGL = function(canvas, opt_attribs, opt_onError) {
    function handleCreationError(msg) {
        var container = document.getElementsByTagName("body")[0];
    };
    opt_onError = opt_onError || handleCreationError;
    var context = create3DContext(canvas, opt_attribs);
    return context;
  };
  
  // 也是创建一个上下文
  var create3DContext = function(canvas, opt_attribs) {
    var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    var context = null;
    for (var ii = 0; ii < names.length; ++ii) {
        context = canvas.getContext(names[ii], opt_attribs);
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
  


