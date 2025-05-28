// Shadow.js (c) 2012 matsuda and tanaka // 这是我们“光影魔术”电影的剧本文件，由两位大师创作。
// Vertex shader program for generating a shadow map // 这是电影的第一部分，由“光影摄影师”使用的“顶点着色器”剧本。
var SHADOW_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' + // 告诉GPU：“这是演员的‘站位’数据！”
  'uniform mat4 u_MvpMatrix;\n' +   // 告诉GPU：“这是光源摄像机（我们的‘太阳眼’）看世界的‘透视眼’！”
  'void main() {\n' +             // 顶点着色器小精灵的“表演开始”：
  '  gl_Position = u_MvpMatrix * a_Position;\n' + // “站位”经过“透视眼”的变换，算出它在光源眼中最终的“投影位置”。
  '}\n';                         // 小精灵“表演结束”。

// Fragment shader program for generating a shadow map // 这是电影的第一部分，由“光影摄影师”使用的“片元着色器”剧本。
var SHADOW_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'void main() {\n' +
  '  const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);\n' +
  '  const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);\n' +
  '  vec4 rgbaDepth = fract(gl_FragCoord.z * bitShift);\n' + // Calculate the value stored into each byte
  '  rgbaDepth -= rgbaDepth.gbaa * bitMask;\n' + // Cut off the value which do not fit in 8 bits
  '  gl_FragColor = rgbaDepth;\n' +
  '}\n';

// Vertex shader program for regular drawing // 这是电影的第二部分，由“主摄像师”使用的“顶点着色器”剧本。
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +       // 演员的“站位”数据。
  'attribute vec4 a_Color;\n' +          // 演员的“服装颜色”数据。
  'uniform mat4 u_MvpMatrix;\n' +        // 主摄像机（我们观众的眼睛）看世界的“透视眼”！
  'uniform mat4 u_MvpMatrixFromLight;\n' + // 光源摄像机（太阳眼）看世界的“透视眼”！
  'varying vec4 v_PositionFromLight;\n' + // 要传递给片元着色器小精灵的“从光源看的位置”。
  'varying vec4 v_Color;\n' +            // 要传递给片元着色器小精灵的“服装颜色”。
  'void main() {\n' +                    // 顶点着色器小精灵的“表演开始”：
  '  gl_Position = u_MvpMatrix * a_Position;\n' + // “站位”经过主摄像机的“透视眼”，算出它在屏幕上最终的“投影位置”。
  '  v_PositionFromLight = u_MvpMatrixFromLight * a_Position;\n' + // 同时，“站位”也经过光源摄像机的“透视眼”，算出它在光源眼中最终的“投影位置”，并传递给片元小精灵。
  '  v_Color = a_Color;\n' +             // 演员的“服装颜色”也传递给片元小精灵。
  '}\n';                                  // 小精灵“表演结束”。

// Fragment shader program for regular drawing // 这是电影的第二部分，由“主摄像师”使用的“片元着色器”剧本。
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +             // 魔法世界的规定：
  'precision mediump float;\n' + // 告诉GPU：“我只需要中等精度，别浪费墨水！”
  '#endif\n' +                   // 魔法规定结束。
  'uniform sampler2D u_ShadowMap;\n' +     // “深度照片”（阴影贴图）就在这里，片元着色器小精灵可以看它了。
  'varying vec4 v_PositionFromLight;\n' + // 接收从顶点着色器小精灵传来的“从光源看的位置”。
  'varying vec4 v_Color;\n' +            // 接收从顶点着色器小精灵传来的“服装颜色”。
  'void main() {\n' +                    // 片元着色器小精灵的“表演开始”：
   // 把从光源看的位置，转化成“深度照片”上的“查阅坐标”（UV）。
  // v_PositionFromLight.xyz/v_PositionFromLight.w 是透视校正，相当于把光源眼中的“三维空间”拍扁。
  // /2.0 + 0.5 是把 [-1, 1] 的坐标范围，映射到 [0, 1] 的纹理坐标范围，方便去查阅“深度照片”。
  '  vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;\n' +
  '  vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);\n' + // 从“深度照片”上，根据查阅坐标，找到那里的“记录深度”。
  '  float depth = rgbaDepth.r;\n' +     // 把记录的“深度”从红色通道里读出来。（因为光影摄影师只把深度写在R通道）。
  '  float visibility = (shadowCoord.z > depth + 0.005) ? 0.7 : 1.0;\n' + // 判断：如果“我”（当前片元）离光源比“深度照片”上记录的最近的物体还远一点点（+0.005是防止“阴影痤疮”，像皮肤病一样不均匀），那就说明我被挡住了（可见度0.7，变暗），否则我就是被照亮的（可见度1.0，原色）。
  '  gl_FragColor = vec4(v_Color.rgb * visibility, v_Color.a);\n' + // 最后，把我的“服装颜色”乘以“可见度”，就是我最终的颜色啦！
  '}\n';                                                               // 小精灵“表演结束”。

var OFFSCREEN_WIDTH = OFFSCREEN_HEIGHT = 2**10; // 光影摄影师的“照片”（阴影贴图）尺寸，越大越清晰，但越耗资源。
var LIGHT_X = 0, LIGHT_Y = 40, LIGHT_Z = 2; // 光源的“灯位”：我们的“太阳”在这个舞台的哪里？

function main() { // 导演的“大制作”开始了！
  // Retrieve <canvas> element // 找到我们的“大屏幕” (`canvas` 元素)。
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL // 召唤“魔法画家”来到“大屏幕”上工作。
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL'); // 魔法画家没来，电影就拍不成了。
    return;
  }

  // Initialize shaders for generating a shadow map // 初始化光影摄影师的“剧本”。
  var shadowProgram = createProgram(gl, SHADOW_VSHADER_SOURCE, SHADOW_FSHADER_SOURCE); // 给光影摄影师一套“特殊剧本”。
  shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');       // 在剧本里找到演员“站位”的记号（属性位置）。
  shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');     // 在剧本里找到“光源摄像机视野”的记号（统一变量位置）。
  if (shadowProgram.a_Position < 0 || !shadowProgram.u_MvpMatrix) { // 记号没找全，光影摄影师会迷路。
    console.log('Failed to get the storage location of attribute or uniform variable from shadowProgram');
    return;
  }

  // Initialize shaders for regular drawing // 初始化主摄影师的“剧本”。
  var normalProgram = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE); // 给主摄影师一套“普通剧本”。
  normalProgram.a_Position = gl.getAttribLocation(normalProgram, 'a_Position');       // 在剧本里找到演员“站位”的记号。
  normalProgram.a_Color = gl.getAttribLocation(normalProgram, 'a_Color');             // 在剧本里找到演员“服装颜色”的记号。
  normalProgram.u_MvpMatrix = gl.getUniformLocation(normalProgram, 'u_MvpMatrix');     // 在剧本里找到“主摄像机视野”的记号。
  normalProgram.u_MvpMatrixFromLight = gl.getUniformLocation(normalProgram, 'u_MvpMatrixFromLight'); // 在剧本里找到“光源摄像机视野”的记号。
  normalProgram.u_ShadowMap = gl.getUniformLocation(normalProgram, 'u_ShadowMap');     // 在剧本里找到“深度照片”的记号。
  if (normalProgram.a_Position < 0 || normalProgram.a_Color < 0 || !normalProgram.u_MvpMatrix || // 记号没找全，主摄影师也会迷路。
      !normalProgram.u_MvpMatrixFromLight || !normalProgram.u_ShadowMap) {
    console.log('Failed to get the storage location of attribute or uniform variable from normalProgram');
    return;
  }

  // Set the vertex information // 准备演员们（神秘金字塔和广阔舞台）的道具（顶点数据）。
  var triangle = initVertexBuffersForTriangle(gl); // 准备“神秘金字塔”演员的道具（顶点数据）。
  var plane = initVertexBuffersForPlane(gl);       // 准备“广阔舞台”演员的道具。
  if (!triangle || !plane) {                       // 道具没准备好，戏就演不了。
    console.log('Failed to set the vertex information');
    return;
  }

  // Initialize framebuffer object (FBO)  // 搭建光影摄影师的“秘密暗房”（帧缓冲区对象）。
  var fbo = initFramebufferObject(gl);
  if (!fbo) {
    console.log('Failed to initialize frame buffer object'); // 暗房没搭好，照片就拍不了。
    return;
  }
  gl.activeTexture(gl.TEXTURE0); // 魔法画家指定：“把道具放在‘0号工作台’！”（激活纹理单元0）。
  gl.bindTexture(gl.TEXTURE_2D, fbo.texture); // 将“秘密暗房”里拍好的“深度照片”（FBO的纹理附件）放到“0号工作台”上，待会儿主摄影师要参考。

  // Set the clear color and enable the depth test // 设置舞台背景色，并开启“深度比较模式”。
  gl.clearColor(0, 0, 0, 1); // 告诉魔法画家：“每次开始画画前，把画布背景涂成黑色！”
  gl.enable(gl.DEPTH_TEST);  // 告诉魔法画家：“开启‘深度比较模式’，让近的物体挡住远的！”

  var viewProjMatrixFromLight = new Matrix4(); // 光源摄像机的“世界观”（视图投影矩阵）矩阵。
  viewProjMatrixFromLight.setPerspective(70.0, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1.0, 100.0); // 设定光源摄像机的“透视广角”和“看远近”。
  viewProjMatrixFromLight.lookAt(LIGHT_X, LIGHT_Y, LIGHT_Z, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0); // 光源摄像机从哪里看（LIGHT_X,Y,Z），看向哪里（原点），头朝哪个方向（Y轴向上）。

  var viewProjMatrix = new Matrix4();          // 主摄像机的“世界观”（视图投影矩阵）矩阵。
  viewProjMatrix.setPerspective(45, canvas.width/canvas.height, 1.0, 100.0); // 设定主摄像机的“透视广角”和“看远近”。
  viewProjMatrix.lookAt(0.0, 7.0, 9.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);       // 主摄像机从哪里看（0,7,9），看向哪里（原点），头朝哪个方向（Y轴向上）。

  var currentAngle = 0.0; // “神秘金字塔”当前旋转的角度。
  var mvpMatrixFromLight_t = new Matrix4(); // 用于保存旋转的金字塔在光源眼中的“快照”（模型视图投影矩阵）。
  var mvpMatrixFromLight_p = new Matrix4(); // 用于保存舞台平面在光源眼中的“快照”（模型视图投影矩阵）。
  var tick = function() { // 导演的“动画循环”开始了，每一帧都要做的事。
    currentAngle = animate(currentAngle); // 更新“神秘金字塔”的旋转角度。

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);               // 魔法画家：“把画笔转移到‘秘密暗房’的画布上！”（切换到FBO进行绘制）。
    gl.viewport(0, 0, OFFSCREEN_HEIGHT, OFFSCREEN_HEIGHT); // 告诉魔法画家：“现在在暗房里，画框大小是照片尺寸！”（设置视口为FBO大小）。
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);   // 清空暗房里的画板和深度记录。

    gl.useProgram(shadowProgram); // 魔法画家：“现在请光影摄影师的‘剧本’来指导我！”
    // Draw the triangle and the plane (for generating a shadow map) // 绘制“神秘金字塔”和“广阔舞台”的深度信息，供光影摄影师拍摄。
    drawTriangle(gl, shadowProgram, triangle, currentAngle, viewProjMatrixFromLight); // 光影摄影师拍摄“神秘金字塔”，记录深度。
    mvpMatrixFromLight_t.set(g_mvpMatrix); // “金字塔”的“光源快照”（MVP矩阵）保存下来。
    drawPlane(gl, shadowProgram, plane, viewProjMatrixFromLight); // 光影摄影师拍摄“广阔舞台”，记录深度。
    mvpMatrixFromLight_p.set(g_mvpMatrix); // “舞台”的“光源快照”（MVP矩阵）保存下来。

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);               // 魔法画家：“好啦，从‘秘密暗房’出来，回到‘大屏幕’上！”（切换回默认帧缓冲区）。
    gl.viewport(0, 0, canvas.width, canvas.height);         // 告诉魔法画家：“现在在大屏幕上，画框是屏幕尺寸！”（设置视口为canvas大小）。
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    // 清空大屏幕上的画板和深度记录。

    gl.useProgram(normalProgram); // 魔法画家：“现在请主摄影师的‘剧本’来指导我！”
    gl.uniform1i(normalProgram.u_ShadowMap, 0);  // 告诉主摄影师：“你的‘深度照片’参考图就在‘0号工作台’上！”（将纹理单元0传递给`u_ShadowMap`）。
    // Draw the triangle and plane ( for regular drawing) // 主摄影师拍摄“神秘金字塔”和“广阔舞台”，并应用阴影。
    gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_t.elements); // 告诉主摄影师：“这是金字塔在光源眼中的样子（它的光源MVP），你对照着看！”
    drawTriangle(gl, normalProgram, triangle, currentAngle, viewProjMatrix); // 主摄影师拍摄“神秘金字塔”，并应用阴影。
    gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements); // 告诉主摄影师：“这是舞台在光源眼中的样子（它的光源MVP），你对照着看！”
    drawPlane(gl, normalProgram, plane, viewProjMatrix); // 主摄影师拍摄“广阔舞台”，并应用阴影。

    window.requestAnimationFrame(tick, canvas); // 导演喊：“下一帧，继续拍！”（请求浏览器在下一帧渲染时再次调用`tick`函数）。
  };
  tick(); // 动画开始，导演：“开拍！”
}



// Coordinate transformation matrix // 这是一个用于处理各种“姿态变化”的矩阵团队。
var g_modelMatrix = new Matrix4(); // 全局的“模型姿态”记录本，记录演员的平移、旋转、缩放。
var g_mvpMatrix = new Matrix4();   // 全局的“镜头最终效果”记录本，记录模型经过所有摄像机变换后的最终位置。
function drawTriangle(gl, program, triangle, angle, viewProjMatrix) {
  // Set rotate angle to model matrix and draw triangle // 让“神秘金字塔”演员表演旋转，并绘制它。
  g_modelMatrix.setRotate(angle, 0, 1, 0); // 让“神秘金字塔”绕Y轴旋转`angle`度。
  draw(gl, program, triangle, viewProjMatrix); // 统一的“表演指导”函数，去绘制金字塔。
}

function drawPlane(gl, program, plane, viewProjMatrix) {
  // Set rotate angle to model matrix and draw plane // 让“广阔舞台”演员表演（这里是固定姿态），并绘制它。
  g_modelMatrix.setRotate(-45, 0, 1, 1); // 广阔舞台有一个固定的倾斜角度（绕X和Y轴）。
  draw(gl, program, plane, viewProjMatrix); // 统一的“表演指导”函数，去绘制舞台。
}

function draw(gl, program, o, viewProjMatrix) { // 这是一个通用的“表演指导”函数，指导魔法画家如何绘制一个演员（`o`代表一个模型对象）。
  initAttributeVariable(gl, program.a_Position, o.vertexBuffer); // 告诉魔法画家：“把演员的‘站位’数据从`o.vertexBuffer`里取出来！”
  if (program.a_Color != undefined) // If a_Color is defined to attribute // 如果当前“剧本”（`program`）需要演员的“服装颜色”。
    initAttributeVariable(gl, program.a_Color, o.colorBuffer); // 告诉魔法画家：“把演员的‘服装颜色’数据从`o.colorBuffer`里取出来！”

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer); // 告诉魔法画家：“按照这张‘点名册’（索引缓冲区）来画！”

  // Calculate the model view project matrix and pass it to u_MvpMatrix // 计算演员最终在镜头里的“效果”（MVP矩阵），并告诉着色器。
  g_mvpMatrix.set(viewProjMatrix); // 把摄像机的“世界观”矩阵复制过来。
  g_mvpMatrix.multiply(g_modelMatrix); // 让“演员的姿态”和“摄像机的世界观”手牵手，得到最终的“镜头效果”。
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements); // 把这个“镜头效果”告诉着色器里的`u_MvpMatrix`。

  gl.drawElements(gl.TRIANGLES, o.numIndices, gl.UNSIGNED_BYTE, 0); // 魔法画家：“开始画画啦，按照‘点名册’，画出三角形！”
}

// Assign the buffer objects and enable the assignment // 魔法画家的小助手：把演员的“站位”和“颜色”数据，准确地送到着色器小精灵手里。
function initAttributeVariable(gl, a_attribute, buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer); // 告诉魔法画家：“我要操作这个‘行李箱’（缓冲区）了！”
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0); // 告诉魔法画家：“从这个‘行李箱’里，按这个格式（`num`个、`type`类型），把数据交给这个‘演员属性’（`a_attribute`）！”
  gl.enableVertexAttribArray(a_attribute); // 告诉魔法画家：“启用这个‘演员属性’，别忘了用它！”
}

function initVertexBuffersForPlane(gl) { // 准备“广阔舞台”演员的道具（顶点数据和缓冲区）。
  // Create a plane // 这是一个平面的草图：
  //  v1------v0
  //  |        |
  //  |        |
  //  |        |
  //  v2------v3

  // Vertex coordinates // 舞台的“站位”清单。
  var vertices = new Float32Array([
    3.0, -1.7, 2.5,  -3.0, -1.7, 2.5,  -3.0, -1.7, -2.5,   3.0, -1.7, -2.5    // v0-v1-v2-v3 顺时针定义了四个顶点。
  ]);

  // Colors // 舞台的“服装颜色”清单，都是白色。
  var colors = new Float32Array([
    1.0, 1.0, 1.0,    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,   1.0, 1.0, 1.0
  ]);

  // Indices of the vertices // 舞台的“点名册”（索引），用6个点画两个三角形拼成矩形。
  var indices = new Uint8Array([0, 1, 2,   0, 2, 3]);

  var o = new Object(); // Utilize Object object to return multiple buffer objects together // 用一个“大盒子”把演员的所有道具（缓冲区）装起来。

  // Write vertex information to buffer object // 把“站位”、“服装颜色”和“点名册”分别装进各自的“行李箱”里。
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT); // 站位行李箱，每个站位3个数字（x,y,z）。
  o.colorBuffer = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);   // 服装颜色行李箱，每种颜色3个数字（r,g,b）。
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE); // 点名册行李箱，每个点名是1个字节的无符号整数。
  if (!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) return null; // 任何一个行李箱没准备好，就说明道具不全。

  o.numIndices = indices.length; // 记录“点名册”上有多少个名字。

  // Unbind the buffer object // 整理好行李箱，先放回原位，解除绑定。
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o; // 把这个装满道具的“大盒子”交给导演。
}

function initVertexBuffersForTriangle(gl) { // 准备“神秘金字塔”演员的道具。
  // Create a triangle // 这是一个金字塔的草图：
  //       v2
  //      / |
  //     /  |
  //    /   |
  //  v0----v1

  // Vertex coordinates // 金字塔的“站位”清单。
  var vertices = new Float32Array([-0.8, 3.5, 0.0,  0.8, 3.5, 0.0,  0.0, 3.5, 1.8]);
  // Colors // 金字塔的“服装颜色”清单。
  var colors = new Float32Array([1.0, 0.5, 0.0,  1.0, 0.5, 0.0,  1.0, 0.0, 0.0]);
  // Indices of the vertices // 金字塔的“点名册”，只有3个名字。
  var indices = new Uint8Array([0, 1, 2]);

  var o = new Object();  // Utilize Object object to return multiple buffer objects together // 同样用一个“大盒子”装起来。

  // Write vertex information to buffer object // 把金字塔的站位、颜色和点名册分别装进行李箱。
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
  o.colorBuffer = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
  if (!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) return null;

  o.numIndices = indices.length; // 记录“点名册”上的名字数量。

  // Unbind the buffer object // 整理好行李箱，解除绑定。
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o; // 把“大盒子”交给导演。
}

function initArrayBufferForLaterUse(gl, data, num, type) { // 这是一个创建“普通数据行李箱”（数组缓冲区）的通用函数。
  // Create a buffer object // 创建一个空“行李箱”。
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object'); // 行李箱没造出来。
    return null;
  }
  // Write date into the buffer object // 把数据装进这个“行李箱”。
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer); // 告诉魔法画家：“这个是我的‘行李箱’（ARRAY_BUFFER类型的）。”
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); // 把数据“装好”，告诉魔法画家：“这些数据不常变动，你固定放着就行。”

  // Store the necessary information to assign the object to the attribute variable later // 记录这个行李箱的“说明书”，方便以后使用。
  buffer.num = num;     // 每次从行李箱里取多少个数字（比如xyz就是3个）。
  buffer.type = type;   // 每个数字是什么类型（比如gl.FLOAT浮点数）。

  return buffer; // 返回这个“行李箱”。
}

function initElementArrayBufferForLaterUse(gl, data, type) { // 这是一个创建“点名册行李箱”（元素数组缓冲区）的通用函数。
  // Create a buffer object // 创建一个空“行李箱”。
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object'); // 行李箱没造出来。
    return null;
  }
  // Write date into the buffer object // 把数据装进这个“行李箱”。
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer); // 告诉魔法画家：“这个是我的‘点名册行李箱’（ELEMENT_ARRAY_BUFFER类型的）。”
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW); // 把数据“装好”，告诉魔法画家：“这些数据不常变动，你固定放着就行。”

  buffer.type = type; // 记录点名册上每个名字的类型（比如gl.UNSIGNED_BYTE无符号字节）。

  return buffer; // 返回这个“行李箱”。
}

function initFramebufferObject(gl) { // 这是一个搭建“秘密暗房”（FBO）的函数。
  var framebuffer, texture, depthBuffer; // “暗房本体”、“要拍的照片”、“深度记录员”的宣言。

  // Define the error handling function // 定义一个“出错了怎么办”的紧急处理程序。
  var error = function() {
    if (framebuffer) gl.deleteFramebuffer(framebuffer); // 如果暗房搭了一半，就把它拆了。
    if (texture) gl.deleteTexture(texture);             // 如果照片纸拿出来了，就把它销毁。
    if (depthBuffer) gl.deleteRenderbuffer(depthBuffer); // 如果深度记录员的笔和纸准备了，就收起来。
    return null; // 返回空，表示没搭成功。
  }

  // Create a framebuffer object (FBO) // 创建“暗房本体”。
  framebuffer = gl.createFramebuffer();
  if (!framebuffer) {
    console.log('Failed to create frame buffer object');
    return error();
  }

  // Create a texture object and set its size and parameters // 创建一张“空白照片纸”（纹理），并准备好它的尺寸和特性。
  texture = gl.createTexture(); // 制造一张空白照片纸。
  if (!texture) {
    console.log('Failed to create texture object');
    return error();
  }
  gl.bindTexture(gl.TEXTURE_2D, texture); // 告诉魔法画家：“我现在要处理这张照片纸了！”
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); // 给照片纸分配“像素格子”（尺寸）和“颜色存储格式”。
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // 告诉魔法画家：“如果这张照片缩小时，用‘模糊处理’看起来更自然。”

  // Create a renderbuffer object and Set its size and parameters // 创建“深度记录员的笔和纸”（渲染缓冲区），并准备好它的尺寸和特性。
  depthBuffer = gl.createRenderbuffer(); // 制造一套笔和纸。
  if (!depthBuffer) {
    console.log('Failed to create renderbuffer object');
    return error();
  }
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // 告诉魔法画家：“我现在要处理这套笔和纸了！”
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT); // 给笔和纸分配“记录格子”（尺寸），并指定“记录深度”的精度是16位。

  // Attach the texture and the renderbuffer object to the FBO // 把“照片纸”和“深度记录员的笔和纸”都放到“暗房本体”里去。
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); // 告诉魔法画家：“现在我在操作这个‘暗房’！”
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0); // 告诉魔法画家：“把这张照片纸作为‘暗房’的‘颜色画布’！”
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer); // 告诉魔法画家：“把这套笔和纸作为‘暗房’的‘深度记录本’！”

  // Check if FBO is configured correctly // 检查这个“暗房”是否搭好，万无一失。
  var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER); // 问魔法画家：“暗房状态如何？”
  if (gl.FRAMEBUFFER_COMPLETE !== e) { // 如果魔法画家说“暗房没搭好”。
    console.log('Frame buffer object is incomplete: ' + e.toString()); // 打印错误信息。
    return error(); // 启动紧急处理程序。
  }

  framebuffer.texture = texture; // 为了方便以后使用，把“拍好的照片纸”也放到“暗房对象”里，方便导演直接拿到。

  // Unbind the buffer object // 离开“暗房”，解除所有绑定，恢复默认状态。
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);

  return framebuffer; // 把搭好的“秘密暗房”交给导演。
}

var ANGLE_STEP = 40;   // 演员每秒旋转多少度（度/秒）。

var last = Date.now(); // 动作指导员的秒表：记录上次报时的时间。
function animate(angle) { // 动作指导员：计算演员应该转到哪个角度。
  var now = Date.now();   // 动作指导员：“现在是几点？”
  var elapsed = now - last; // 动作指导员：“从上次报时到现在，过了多少毫秒？”
  last = now;             // 动作指导员：“更新秒表，现在是新的一次报时。”
  // Update the current rotation angle (adjusted by the elapsed time) // 更新当前演员的旋转角度（根据过去的时间来精确计算）。
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0; // 新角度 = 旧角度 + (每秒转的度数 * 过去的时间（秒）)。
  return newAngle % 360; // 确保角度在0到360度之间循环，就像时钟一样。
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