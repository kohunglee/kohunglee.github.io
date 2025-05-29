// WebGL框架
// ===============

const W = {
  models: {},
  instanceMatrixBuffers: {}, // 实例化对象的矩阵数据
  instanceColorBuffers: {},  // 实例化颜色数据

  // 初始化
  reset: canvas => {
    
    // 全局变量
    W.canvas = canvas;
    W.objs = 0;
    W.current = {};
    W.next = {};
    W.textures = {};
    W.viewLimit = 5000;   // 视野
    W.gl = canvas.getContext('webgl2');
    W.gl.blendFunc(770 , 771);
    W.gl.activeTexture(33984);
    W.program = W.gl.createProgram();
    W.gl.enable(2884);  // 隐藏不可见面
    W.instanceColorBuffers = {};  // 初始化颜色实例化数据
    W.lastFrame = 0;
    W.drawTime = 0;         // 初始化 绘制 时间
    W.lastReportTime = 0;   // 时间戳临时变量（用于确定一秒）
    
    var t;
    W.gl.shaderSource(
          // 顶点着色器
          t = W.gl.createShader(35633 ),
          `#version 300 es
          precision lowp float;                        
          in vec4 pos, col, uv, normal;                 // 普通模型的 位置、颜色、纹理坐标、法线...
          in mat4 instanceModelMatrix;                  // 实例化模型的 模型
          uniform mat4 pv, eye, m, im;                  // 矩阵：投影 * 视图、视线、模型、模型逆矩阵
          uniform vec4 bb;                              // 广告牌：bb = [w, h, 1.0, 0.0]
          out vec4 v_pos, v_col, v_uv, v_normal;
          uniform bool isInstanced;              // 是不是实例化绘制

          uniform mat4 u_MvpMatrixFromLight;       // 光源的 MVP 矩阵
          out vec4 v_PositionFromLight;            // 输出，顶点在光源眼中的位置

          void main() {
            mat4 currentModelMatrix;  // 当前的模型矩阵
            if (isInstanced) {
              currentModelMatrix = instanceModelMatrix;
            } else {
              currentModelMatrix = m;
            }
            gl_Position = pv * (    // 设置顶点位置：p * v * v_pos
              v_pos = bb.z > 0.                         
              ? currentModelMatrix[3] + eye * (pos * bb) // 广告牌
              : currentModelMatrix * pos               
            );
            v_col = col;
            v_uv = uv;
            v_normal = transpose(isInstanced ? inverse(currentModelMatrix) : im) * normal;  // 必要时使用实例矩阵
            v_PositionFromLight = u_MvpMatrixFromLight *  // 计算顶点在光源眼中的位置
                                 (isInstanced ? instanceModelMatrix * pos : m * pos);
          }`
        );

        W.gl.compileShader(t);  // 编译
        W.gl.attachShader(W.program, t);
        
        // 创建片段着色器
        W.gl.shaderSource(
          t = W.gl.createShader(35632 ),
          `#version 300 es
          precision lowp float;                  
          in vec4 v_pos, v_col, v_uv, v_normal;
          uniform vec3 light;
          uniform vec2 tiling;
          uniform vec4 o;
          uniform sampler2D sampler;
          out vec4 c;

          in vec4 v_PositionFromLight;   // 接收灯光视角的位置
          uniform sampler2D u_ShadowMap;  // 接收阴影深度图

          void main() {
            /* 阴影处理逻辑 */
            vec3 shadowCoord = (v_PositionFromLight.xyz    // 创建阴影映射
                                / v_PositionFromLight.w)
                                / 2.0 + 0.5;
            float shadowVisibility = 1.0;  // 非阴影部分亮度
            vec4 rgbaDepth = texture(u_ShadowMap, shadowCoord.xy);  // 解析深度
            const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
            float depth = dot(rgbaDepth, bitShift);  // 当前顶点的深度
            if (shadowCoord.z > depth + 0.005) {  // 计算有没有被遮挡
                shadowVisibility = 0.5;
            }

            c = mix(texture(sampler, v_uv.xy * tiling), v_col, o[3]);
            if(o[1] > 0.){
              c = vec4(
                c.rgb * (max(0., dot(light, -normalize(
                  o[0] > 0.
                  ? vec3(v_normal.xyz)
                  : cross(dFdx(v_pos.xyz), dFdy(v_pos.xyz))
                )))
                + o[2]) * shadowVisibility,
                c.a
              );
            } else {
              c.rgb *= shadowVisibility;
            }
          }`
        );
        
        W.gl.compileShader(t); 
        W.gl.attachShader(W.program, t);
        W.gl.linkProgram(W.program);
        W.gl.useProgram(W.program);
        W.clearColor = c => W.gl.clearColor(...W.col(c));
        W.clearColor("fff");
        W.gl.enable(2929);
        W.light({y: -1});  
        W.camera({fov: 30});
        setTimeout(W.draw, 16);  // 开始绘制
        W.shadowFunc001(W.gl);  // 初始化阴影
  },

  // 设置对象的状态
  setState: (state, type, texture, i, normal = [], A, B, C, Ai, Bi, Ci, AB, BC) => {
        state.n ||= 'o' + W.objs++;
        if(state.size) state.w = state.h = state.d = state.size;
        if(state.t && state.t.width && !W.textures[state.t.id]){  // 纹理
          texture = W.gl.createTexture();
          W.gl.pixelStorei(37441 , true);
          W.gl.bindTexture(3553 , texture);
          W.gl.pixelStorei(37440 , 1);
          W.gl.texImage2D(3553 , 0, 6408 , 6408 , 5121 , state.t);
          W.gl.generateMipmap(3553 );
          W.textures[state.t.id] = texture;
        }
        if (state.instances && Array.isArray(state.instances)) {  // 实例坐标传入缓冲区
          state.isInstanced = true;
          state.numInstances = state.instances.length;
          const instanceMatrices = [];
          const instanceColors = [];
          for (const instanceProps of state.instances) {  // 实例顶点
            const m = new DOMMatrix();
            m.translateSelf(instanceProps.x + (state.x|0) | 0,
                            instanceProps.y + (state.y|0) | 0,
                            instanceProps.z + (state.z|0) | 0)
            .rotateSelf(instanceProps.rx || 0, instanceProps.ry || 0, instanceProps.rz || 0)
            .scaleSelf(instanceProps.w || 1, instanceProps.h || 1, instanceProps.d || 1);
            instanceMatrices.push(...m.toFloat32Array());
          }
          for (const p of state.instances) {  // 实例颜色
            instanceColors.push(...W.col(p.b || '888'));
          }
          const matrixData = new Float32Array(instanceMatrices);
          const buffer = W.gl.createBuffer();
          W.gl.bindBuffer(W.gl.ARRAY_BUFFER, buffer);
          W.gl.bufferData(W.gl.ARRAY_BUFFER, matrixData, W.gl.STATIC_DRAW);
          W.instanceMatrixBuffers[state.n] = buffer;
          W.gl.bindBuffer(W.gl.ARRAY_BUFFER, W.instanceColorBuffers[state.n] = W.gl.createBuffer());
          W.gl.bufferData(W.gl.ARRAY_BUFFER, new Float32Array(instanceColors), W.gl.STATIC_DRAW);
          state.instances = null;  // 清理，因为我们不再需要 JS 端的这个大数组
        } else {
          state.isInstanced = false;
        }
        if(state.fov){  // 根据 fov 计算【投影矩阵】
          var viewLimit = W.viewLimit;
          W.projection =
            new DOMMatrix([
              (1 / Math.tan(state.fov * Math.PI / 180)) / (W.canvas.width / W.canvas.height), 0, 0, 0, 
              0, (1 / Math.tan(state.fov * Math.PI / 180)), 0, 0, 
              0, 0, -(viewLimit + 1) / (viewLimit - 1), -1,
              0, 0, -(2 * viewLimit + 2) / (viewLimit - 1), 0
            ]);
        }
        state = {  // 保存和初始化对象的类型
          type,
          ...(W.current[state.n] = W.next[state.n] || {w:1, h:1, d:1, x:0, y:0, z:0, rx:0, ry:0, rz:0, b:'888', mode:4, mix: 0}),
          ...state,
          f:0
        };
        if(W.models[state.type]?.vertices && !W.models?.[state.type].verticesBuffer){  // 构建顶点
          W.gl.bindBuffer(34962 , W.models[state.type].verticesBuffer = W.gl.createBuffer());
          W.gl.bufferData(34962 , new Float32Array(W.models[state.type].vertices), 35044 );
          if(!W.models[state.type].normals && W.smooth) W.smooth(state);
          if(W.models[state.type].normals){
            W.gl.bindBuffer(34962 , W.models[state.type].normalsBuffer = W.gl.createBuffer());
            W.gl.bufferData(34962 , new Float32Array(W.models[state.type].normals.flat()), 35044 ); 
          }
        }
        if(W.models[state.type]?.uv && !W.models[state.type].uvBuffer){  // 构建 UV
          W.gl.bindBuffer(34962 , W.models[state.type].uvBuffer = W.gl.createBuffer());
          W.gl.bufferData(34962 , new Float32Array( W.models[state.type].uv), 35044 );
        }
        if(W.models[state.type]?.indices && !W.models[state.type].indicesBuffer){  // 构建索引
          W.gl.bindBuffer(34963 , W.models[state.type].indicesBuffer = W.gl.createBuffer());
          W.gl.bufferData(34963 , new Uint16Array(W.models[state.type].indices), 35044 );
        }
        if(!state.t){  // mix 默认为 1
          state.mix = 1;
        } else if(state.t && !state.mix){ // 有纹理，mix 为 0
          state.mix = 0;
        }
        W.next[state.n] = state;  // 下一帧的状态
  },
  
  // 绘制场景
  draw: (now, dt, v, i, transparent = []) => {
        const frameRenderStart = performance.now();  // 记录开始的时间
        dt = now - W.lastFrame;
        W.lastFrame = now;
        requestAnimationFrame(W.draw);
        if(W.next.camera.g){  W.render(W.next[W.next.camera.g], dt, 1); }
        v = W.animation('camera');  //  获取相机的矩阵
        if(W.next?.camera?.g){
          v.preMultiplySelf(W.next[W.next.camera.g].M || W.next[W.next.camera.g].m);
        }
        W.gl.uniformMatrix4fv( W.gl.getUniformLocation(W.program, 'eye'), false, v.toFloat32Array());  // 相机矩阵发往着 eye 着色器
        v.invertSelf();
        v.preMultiplySelf(W.projection);
        W.gl.uniformMatrix4fv( W.gl.getUniformLocation(W.program, 'pv'), false, v.toFloat32Array());  // 处理好 pv ，传给着色器
        W.shadowFunc002(W.gl);  // 阴影的秘密摄影
        W.gl.useProgram(W.program);   // 阴影绘制完，激活主绘制器
        W.gl.clear(16640);
        for(i in W.next){  // 遍历渲染模型
          if(!W.next[i].t && W.col(W.next[i].b)[3] == 1){
            W.render(W.next[i], dt);
          } else {
            transparent.push(W.next[i]);  // 透明的先不渲染，存起来
          }
        }
        transparent.sort((a, b) => {return W.dist(b) - W.dist(a);});
        W.gl.enable(3042 );
        for(i of transparent){  // 遍历渲染透明对象
          if( ["plane","billboard"].includes(i.type)) { W.gl.depthMask(0) };  // 广告牌、屏幕特殊处理
          W.render(i, dt);
          W.gl.depthMask(1);
        }
        W.gl.disable(3042);
        W.gl.uniform3f(  // light 信息发往着色器
          W.gl.getUniformLocation(W.program, 'light'),
          W.lerp('light','x'), W.lerp('light','y'), W.lerp('light','z')
        );
        if (now - W.lastReportTime >= 1000) {  // 每秒执行一次，用于测量
            W.drawTime = (performance.now() - frameRenderStart).toFixed(2) + 'ms';  // 每帧的绘制时间
            W.lastReportTime = now;
        }
  },
  
  // 渲染对象
  render: (object, dt, just_compute = ['camera','light','group'].includes(object.type), buffer) => {
        if(object.t) {  // 设置纹理
          W.gl.bindTexture(3553 , W.textures[object.t.id]);
          W.gl.uniform1i(W.gl.getUniformLocation(W.program, 'sampler'), 0);
          W.gl.uniform2f(  // 纹理平铺->着色器（tiling）
            W.gl.getUniformLocation(W.program, 'tiling'),
            object.tile?.[0] || 1,
            object.tile?.[1] || 1
          );
        }
        if (!object.isInstanced) {  // 处理普通对象
            if(object.f < object.a) object.f += dt;
            if(object.f > object.a) object.f = object.a;
            W.next[object.n].m = W.animation(object.n);
            if(W.next[object.g]){  // 组 处理
              W.next[object.n].m.preMultiplySelf(W.next[object.g].M || W.next[object.g].m);
            }
            if(!just_compute){  // 可见物体
              W.gl.uniformMatrix4fv(  // 下一帧矩阵->着色器（m）
                W.gl.getUniformLocation(W.program, 'm'),
                false,
                (W.next[object.n].M || W.next[object.n].m).toFloat32Array()
              );
              W.gl.uniformMatrix4fv(  // 下一帧逆矩阵->着色器（im）
                W.gl.getUniformLocation(W.program, 'im'),
                false,
                (new DOMMatrix(W.next[object.n].M || W.next[object.n].m)).invertSelf().toFloat32Array()
              );
            }
        }
        if(!just_compute){  // 可见物体
          W.gl.bindBuffer(34962 , W.models[object.type].verticesBuffer);
          W.gl.vertexAttribPointer(buffer = W.gl.getAttribLocation(W.program, 'pos'), 3, 5126 , false, 0, 0);
          W.gl.enableVertexAttribArray(buffer);
          W.gl.vertexAttribDivisor(buffer, 0);
          if(W.models[object.type].uvBuffer){  // uv->着色器（uv）
            W.gl.bindBuffer(34962 , W.models[object.type].uvBuffer);
            W.gl.vertexAttribPointer(buffer = W.gl.getAttribLocation(W.program, 'uv'), 2, 5126 , false, 0, 0);
            W.gl.enableVertexAttribArray(buffer);
            W.gl.vertexAttribDivisor(buffer, 0);
          }
          if((object.s || W.models[object.type].customNormals) && W.models[object.type].normalsBuffer){  // 法线->着色器（normal）
            W.gl.bindBuffer(34962 , W.models[object.type].normalsBuffer);
            W.gl.vertexAttribPointer(buffer = W.gl.getAttribLocation(W.program, 'normal'), 3, 5126 , false, 0, 0);
            W.gl.enableVertexAttribArray(buffer);
            W.gl.vertexAttribDivisor(buffer, 0);
          }
          W.gl.uniform1i(W.gl.getUniformLocation(W.program, 'isInstanced'), object.isInstanced ? 1 : 0);  // 实例化布尔值->着色器
          if (object.isInstanced && W.instanceMatrixBuffers[object.n]) {  // 实例化对象的各种数据
            const instanceMatrixBuffer = W.instanceMatrixBuffers[object.n];
            W.gl.bindBuffer(W.gl.ARRAY_BUFFER, instanceMatrixBuffer);
            const loc = W.gl.getAttribLocation(W.program, 'instanceModelMatrix');  
            const bytesPerMatrix = 4 * 4 * Float32Array.BYTES_PER_ELEMENT;
            for (let i = 0; i < 4; ++i) {  // 分四次->着色器（instanceModelMatrix）
              const currentLoc = loc + i;
              W.gl.enableVertexAttribArray(currentLoc);
              W.gl.vertexAttribPointer(currentLoc, 4, W.gl.FLOAT, false, bytesPerMatrix, i * 4 * Float32Array.BYTES_PER_ELEMENT);
              W.gl.vertexAttribDivisor(currentLoc, 1);
            }
          }
          W.gl.uniform4f(  // o选项->着色器（o）
            W.gl.getUniformLocation(W.program, 'o'),
            object.s,
            ((object.mode > 3) || (W.gl[object.mode] > 3)) && !object.ns ? 1 : 0,
            W.ambientLight || 0.2,
            object.mix
          );
          W.gl.uniform4f(  // 广告牌->着色器（bb）
            W.gl.getUniformLocation(W.program, 'bb'),
            object.w,
            object.h,
            object.type == 'billboard',
            0
          );
          const colorAttribLoc = W.gl.getAttribLocation(W.program, 'col');
          
          if (object.isInstanced) {  // （实例化和普通）颜色->着色器（col）
            W.gl.enableVertexAttribArray(colorAttribLoc);
            W.gl.bindBuffer(W.gl.ARRAY_BUFFER, W.instanceColorBuffers[object.n]);
            W.gl.vertexAttribPointer(colorAttribLoc, 4, W.gl.FLOAT, false, 0, 0);
            W.gl.vertexAttribDivisor(colorAttribLoc, 1);
          } else {
            W.gl.vertexAttrib4fv(colorAttribLoc, W.col(object.b || '888'));
          }
          if(W.models[object.type].indicesBuffer){  // 存在索引的绘制
            W.gl.bindBuffer(34963 , W.models[object.type].indicesBuffer);
            if (object.isInstanced) { // 索引+实例化
              W.gl.drawElementsInstanced(
                +object.mode || W.gl[object.mode],W.models[object.type].indices.length,W.gl.UNSIGNED_SHORT,0,object.numInstances
              );
            } else { // 正常
              W.gl.drawElements(+object.mode || W.gl[object.mode], W.models[object.type].indices.length, 5123 , 0);
            }
          }
          else { // 不存在索引的绘制
            if (object.isInstanced) {  //无索引+实例化
              W.gl.drawArraysInstanced(+object.mode || W.gl[object.mode],0,W.models[object.type].vertices.length / 3,object.numInstances);
            } else {  // 正常
              W.gl.drawArrays(+object.mode || W.gl[object.mode], 0, W.models[object.type].vertices.length / 3);
            }
          }
          if (object.isInstanced) {  // 清理实例化对象状态，防止误伤普通对象
            const loc = W.gl.getAttribLocation(W.program, 'instanceModelMatrix');
            for (let i = 0; i < 4; ++i) {
              W.gl.vertexAttribDivisor(loc + i, 0);
              W.gl.disableVertexAttribArray(loc + i);
            }
            W.gl.vertexAttribDivisor(colorAttribLoc, 0);
            W.gl.disableVertexAttribArray(colorAttribLoc);
          }
        }
  },
  
  // 辅助函数
  // -------
  
  // 在两个值之间插值
  lerp: (item, property) => 
    W.next[item]?.a
    ? W.current[item][property] + (W.next[item][property] -  W.current[item][property]) * (W.next[item].f / W.next[item].a)
    : W.next[item][property],
  
  // 过渡一个项目
  animation: (item, m = new DOMMatrix) =>
    W.next[item]
    ? m
      .translateSelf(W.lerp(item, 'x'), W.lerp(item, 'y'), W.lerp(item, 'z'))
      .rotateSelf(W.lerp(item, 'rx'),W.lerp(item, 'ry'),W.lerp(item, 'rz'))
      .scaleSelf(W.lerp(item, 'w'),W.lerp(item, 'h'),W.lerp(item, 'd'))
    : m,
    
  // 计算两个对象之间的距离平方（用于排序透明项目）
  dist: (a, b = W.next.camera) => a?.m && b?.m ? (b.m.m41 - a.m.m41)**2 + (b.m.m42 - a.m.m42)**2 + (b.m.m43 - a.m.m43)**2 : 0,
  
  // 设置环境光级别（0到1）
  ambient: a => W.ambientLight = a,
  
  // 将rgb/rgba十六进制字符串转换为vec4
  col: c => [...c.replace("#","").match(c.length < 5 ? /./g : /../g).map(a => ('0x' + a) / (c.length < 5 ? 15 : 255)), 1], // rgb / rgba / rrggbb / rrggbbaa
  
  // 添加新的3D模型
  add: (name, objects) => {
    W.models[name] = objects;
    if(objects.normals){ W.models[name].customNormals = 1 }
    W[name] = settings => W.setState(settings, name);
  },

  // 根据新的 canvas 大小重置画面
  resetView : () => {
    W.gl.viewport(0, 0, W.gl.canvas.width, W.gl.canvas.height);
    W.setState({ n: 'camera', fov: W.next.camera.fov });
  },
  
  // 内置对象
  // ----------------
  group: t => W.setState(t, 'group'),
  move: (t, delay) => setTimeout(()=>{ W.setState(t) }, delay || 1),
  delete: (t, delay) => setTimeout(()=>{ delete W.next[t] }, delay || 1),
  camera: (t, delay) => setTimeout(()=>{ W.setState(t, t.n = 'camera') }, delay || 1),
  light: (t, delay) => delay ? setTimeout(()=>{ W.setState(t, t.n = 'light') }, delay) : W.setState(t, t.n = 'light'),
};

// 平滑法线计算插件（可选）
// =============================================
W.smooth = (state, dict = {}, vertices = [], iterate, iterateSwitch, i, j, A, B, C, Ai, Bi, Ci, normal) => {
  W.models[state.type].normals = [];
  for(i = 0; i < W.models[state.type].vertices.length; i+=3){vertices.push(W.models[state.type].vertices.slice(i, i+3))}
  if(iterate = W.models[state.type].indices) iterateSwitch = 1;
  else iterate = vertices, iterateSwitch = 0;
  for(i = 0; i < iterate.length * 2; i+=3){
    j = i % iterate.length;
    A = vertices[Ai = iterateSwitch ? W.models[state.type].indices[j] : j];
    B = vertices[Bi = iterateSwitch ? W.models[state.type].indices[j+1] : j+1];
    C = vertices[Ci = iterateSwitch ? W.models[state.type].indices[j+2] : j+2];
    var AB = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    var BC = [C[0] - B[0], C[1] - B[1], C[2] - B[2]];
    normal = i > j ? [0,0,0] : [AB[1] * BC[2] - AB[2] * BC[1], AB[2] * BC[0] - AB[0] * BC[2], AB[0] * BC[1] - AB[1] * BC[0]];
    dict[A[0]+"_"+A[1]+"_"+A[2]] ||= [0,0,0];
    dict[B[0]+"_"+B[1]+"_"+B[2]] ||= [0,0,0];
    dict[C[0]+"_"+C[1]+"_"+C[2]] ||= [0,0,0];
    W.models[state.type].normals[Ai] = dict[A[0]+"_"+A[1]+"_"+A[2]] = dict[A[0]+"_"+A[1]+"_"+A[2]].map((a,i) => a + normal[i]);
    W.models[state.type].normals[Bi] = dict[B[0]+"_"+B[1]+"_"+B[2]] = dict[B[0]+"_"+B[1]+"_"+B[2]].map((a,i) => a + normal[i]);
    W.models[state.type].normals[Ci] = dict[C[0]+"_"+C[1]+"_"+C[2]] = dict[C[0]+"_"+C[1]+"_"+C[2]].map((a,i) => a + normal[i]);
  }
}


// 3D模型
// ========

// 每个模型都有：
// - 一个顶点数组 [x, y, z, x, y, z...]
// - 一个uv数组 [u, v, u, v...]（可选。允许纹理贴图...如果不存在：则只使用RGBA颜色）
// - 一个索引数组（可选，启用drawElements渲染...如果不存在：则使用drawArrays）
// - 一个法线数组 [nx, ny, nz, nx, ny, nz...]（可选...如果不存在：框架在需要时计算硬/平滑法线）
// 当需要时，顶点、uv、索引缓冲区会自动构建
// 所有模型都是可选的，你可以移除不需要的模型以节省空间
// 可以从相同模型添加自定义模型，OBJ导入器可在 https://xem.github.io/WebGLFramework/obj2js/ 获取

// 平面/广告牌
//
//  v1------v0
//  |       |
//  |   x   |
//  |       |
//  v2------v3

W.add("plane", {
  vertices: [
    .5, .5, 0,    -.5, .5, 0,   -.5,-.5, 0,
    .5, .5, 0,    -.5,-.5, 0,    .5,-.5, 0
  ],
  
  uv: [
    1, 1,     0, 1,    0, 0,
    1, 1,     0, 0,    1, 0
  ],
});
W.add("billboard", W.models.plane);

// Cube
//
//    v6----- v5
//   /|      /|
//  v1------v0|
//  | |  x  | |
//  | |v7---|-|v4
//  |/      |/
//  v2------v3

W.add("cube", {
  vertices: [
    .5, .5, .5,  -.5, .5, .5,  -.5,-.5, .5, // front
    .5, .5, .5,  -.5,-.5, .5,   .5,-.5, .5,
    .5, .5,-.5,   .5, .5, .5,   .5,-.5, .5, // right
    .5, .5,-.5,   .5,-.5, .5,   .5,-.5,-.5,
    .5, .5,-.5,  -.5, .5,-.5,  -.5, .5, .5, // up
    .5, .5,-.5,  -.5, .5, .5,   .5, .5, .5,
   -.5, .5, .5,  -.5, .5,-.5,  -.5,-.5,-.5, // left
   -.5, .5, .5,  -.5,-.5,-.5,  -.5,-.5, .5,
   -.5, .5,-.5,   .5, .5,-.5,   .5,-.5,-.5, // back
   -.5, .5,-.5,   .5,-.5,-.5,  -.5,-.5,-.5,
    .5,-.5, .5,  -.5,-.5, .5,  -.5,-.5,-.5, // down
    .5,-.5, .5,  -.5,-.5,-.5,   .5,-.5,-.5
  ],
  uv: [
    1, 1,   0, 1,   0, 0, // front
    1, 1,   0, 0,   1, 0,            
    1, 1,   0, 1,   0, 0, // right
    1, 1,   0, 0,   1, 0, 
    1, 1,   0, 1,   0, 0, // up
    1, 1,   0, 0,   1, 0,
    1, 1,   0, 1,   0, 0, // left
    1, 1,   0, 0,   1, 0,
    1, 1,   0, 1,   0, 0, // back
    1, 1,   0, 0,   1, 0,
    1, 1,   0, 1,   0, 0, // down
    1, 1,   0, 0,   1, 0
  ]
});
W.cube = settings => W.setState(settings, 'cube');

// Pyramid
//
//      ^
//     /\\
//    // \ \
//   /+-x-\-+
//  //     \/
//  +------+

W.add("pyramid", {
  vertices: [
    -.5,-.5, .5,   .5,-.5, .5,    0, .5,  0,  // Front
     .5,-.5, .5,   .5,-.5,-.5,    0, .5,  0,  // Right
     .5,-.5,-.5,  -.5,-.5,-.5,    0, .5,  0,  // Back
    -.5,-.5,-.5,  -.5,-.5, .5,    0, .5,  0,  // Left
     .5,-.5, .5,  -.5,-.5, .5,  -.5,-.5,-.5, // down
     .5,-.5, .5,  -.5,-.5,-.5,   .5,-.5,-.5
  ],
  uv: [
    0, 0,   1, 0,  .5, 1,  // Front
    0, 0,   1, 0,  .5, 1,  // Right
    0, 0,   1, 0,  .5, 1,  // Back
    0, 0,   1, 0,  .5, 1,  // Left
    1, 1,   0, 1,   0, 0,  // down
    1, 1,   0, 0,   1, 0
  ]
});

// Sphere
//
//          =   =
//       =         =
//      =           =
//     =      x      =
//      =           =
//       =         =
//          =   =

((i, ai, j, aj, p1, p2, vertices = [], indices = [], uv = [], precision = 20) => {
  for(j = 0; j <= precision; j++){
    aj = j * Math.PI / precision;
    for(i = 0; i <= precision; i++){
      ai = i * 2 * Math.PI / precision;
      vertices.push(+(Math.sin(ai) * Math.sin(aj)/2).toFixed(6), +(Math.cos(aj)/2).toFixed(6), +(Math.cos(ai) * Math.sin(aj)/2).toFixed(6));
      uv.push((Math.sin((i/precision))) * 3.5, -Math.sin(j/precision))
      if(i < precision && j < precision){
        indices.push(p1 = j * (precision + 1) + i, p2 = p1 + (precision + 1), (p1 + 1), (p1 + 1), p2, (p2 + 1));
      }
    }
  }
  W.add("sphere", {vertices, uv, indices});
})();
















































var Matrix4 = function(opt_src) {
  var i, s, d;
  if (opt_src && typeof opt_src === 'object' && opt_src.hasOwnProperty('elements')) {
    s = opt_src.elements;
    d = new Float32Array(16);
    for (i = 0; i < 16; ++i) {
      d[i] = s[i];
    }
    this.elements = d;
  } else {
    this.elements = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  }
};

/**
 * Set the identity matrix.
 * @return this
 */
Matrix4.prototype.setIdentity = function() {
  var e = this.elements;
  e[0] = 1;   e[4] = 0;   e[8]  = 0;   e[12] = 0;
  e[1] = 0;   e[5] = 1;   e[9]  = 0;   e[13] = 0;
  e[2] = 0;   e[6] = 0;   e[10] = 1;   e[14] = 0;
  e[3] = 0;   e[7] = 0;   e[11] = 0;   e[15] = 1;
  return this;
};

/**
 * Copy matrix.
 * @param src source matrix
 * @return this
 */
Matrix4.prototype.set = function(src) {
  var i, s, d;

  s = src.elements;
  d = this.elements;

  if (s === d) {
    return;
  }
    
  for (i = 0; i < 16; ++i) {
    d[i] = s[i];
  }

  return this;
};

/**
 * Multiply the matrix from the right.
 * @param other The multiply matrix
 * @return this
 */
Matrix4.prototype.concat = function(other) {
  var i, e, a, b, ai0, ai1, ai2, ai3;
  
  // Calculate e = a * b
  e = this.elements;
  a = this.elements;
  b = other.elements;
  
  // If e equals b, copy b to temporary matrix.
  if (e === b) {
    b = new Float32Array(16);
    for (i = 0; i < 16; ++i) {
      b[i] = e[i];
    }
  }
  
  for (i = 0; i < 4; i++) {
    ai0=a[i];  ai1=a[i+4];  ai2=a[i+8];  ai3=a[i+12];
    e[i]    = ai0 * b[0]  + ai1 * b[1]  + ai2 * b[2]  + ai3 * b[3];
    e[i+4]  = ai0 * b[4]  + ai1 * b[5]  + ai2 * b[6]  + ai3 * b[7];
    e[i+8]  = ai0 * b[8]  + ai1 * b[9]  + ai2 * b[10] + ai3 * b[11];
    e[i+12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
  }
  
  return this;
};
Matrix4.prototype.multiply = Matrix4.prototype.concat;

/**
 * Multiply the three-dimensional vector.
 * @param pos  The multiply vector
 * @return The result of multiplication(Float32Array)
 */
Matrix4.prototype.multiplyVector3 = function(pos) {
  var e = this.elements;
  var p = pos.elements;
  var v = new Vector3();
  var result = v.elements;

  result[0] = p[0] * e[0] + p[1] * e[4] + p[2] * e[ 8] + e[12];
  result[1] = p[0] * e[1] + p[1] * e[5] + p[2] * e[ 9] + e[13];
  result[2] = p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + e[14];

  return v;
};

/**
 * Multiply the four-dimensional vector.
 * @param pos  The multiply vector
 * @return The result of multiplication(Float32Array)
 */
Matrix4.prototype.multiplyVector4 = function(pos) {
  var e = this.elements;
  var p = pos.elements;
  var v = new Vector4();
  var result = v.elements;

  result[0] = p[0] * e[0] + p[1] * e[4] + p[2] * e[ 8] + p[3] * e[12];
  result[1] = p[0] * e[1] + p[1] * e[5] + p[2] * e[ 9] + p[3] * e[13];
  result[2] = p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + p[3] * e[14];
  result[3] = p[0] * e[3] + p[1] * e[7] + p[2] * e[11] + p[3] * e[15];

  return v;
};

/**
 * Transpose the matrix.
 * @return this
 */
Matrix4.prototype.transpose = function() {
  var e, t;

  e = this.elements;

  t = e[ 1];  e[ 1] = e[ 4];  e[ 4] = t;
  t = e[ 2];  e[ 2] = e[ 8];  e[ 8] = t;
  t = e[ 3];  e[ 3] = e[12];  e[12] = t;
  t = e[ 6];  e[ 6] = e[ 9];  e[ 9] = t;
  t = e[ 7];  e[ 7] = e[13];  e[13] = t;
  t = e[11];  e[11] = e[14];  e[14] = t;

  return this;
};

/**
 * Calculate the inverse matrix of specified matrix, and set to this.
 * @param other The source matrix
 * @return this
 */
Matrix4.prototype.setInverseOf = function(other) {
  var i, s, d, inv, det;

  s = other.elements;
  d = this.elements;
  inv = new Float32Array(16);

  inv[0]  =   s[5]*s[10]*s[15] - s[5] *s[11]*s[14] - s[9] *s[6]*s[15]
            + s[9]*s[7] *s[14] + s[13]*s[6] *s[11] - s[13]*s[7]*s[10];
  inv[4]  = - s[4]*s[10]*s[15] + s[4] *s[11]*s[14] + s[8] *s[6]*s[15]
            - s[8]*s[7] *s[14] - s[12]*s[6] *s[11] + s[12]*s[7]*s[10];
  inv[8]  =   s[4]*s[9] *s[15] - s[4] *s[11]*s[13] - s[8] *s[5]*s[15]
            + s[8]*s[7] *s[13] + s[12]*s[5] *s[11] - s[12]*s[7]*s[9];
  inv[12] = - s[4]*s[9] *s[14] + s[4] *s[10]*s[13] + s[8] *s[5]*s[14]
            - s[8]*s[6] *s[13] - s[12]*s[5] *s[10] + s[12]*s[6]*s[9];

  inv[1]  = - s[1]*s[10]*s[15] + s[1] *s[11]*s[14] + s[9] *s[2]*s[15]
            - s[9]*s[3] *s[14] - s[13]*s[2] *s[11] + s[13]*s[3]*s[10];
  inv[5]  =   s[0]*s[10]*s[15] - s[0] *s[11]*s[14] - s[8] *s[2]*s[15]
            + s[8]*s[3] *s[14] + s[12]*s[2] *s[11] - s[12]*s[3]*s[10];
  inv[9]  = - s[0]*s[9] *s[15] + s[0] *s[11]*s[13] + s[8] *s[1]*s[15]
            - s[8]*s[3] *s[13] - s[12]*s[1] *s[11] + s[12]*s[3]*s[9];
  inv[13] =   s[0]*s[9] *s[14] - s[0] *s[10]*s[13] - s[8] *s[1]*s[14]
            + s[8]*s[2] *s[13] + s[12]*s[1] *s[10] - s[12]*s[2]*s[9];

  inv[2]  =   s[1]*s[6]*s[15] - s[1] *s[7]*s[14] - s[5] *s[2]*s[15]
            + s[5]*s[3]*s[14] + s[13]*s[2]*s[7]  - s[13]*s[3]*s[6];
  inv[6]  = - s[0]*s[6]*s[15] + s[0] *s[7]*s[14] + s[4] *s[2]*s[15]
            - s[4]*s[3]*s[14] - s[12]*s[2]*s[7]  + s[12]*s[3]*s[6];
  inv[10] =   s[0]*s[5]*s[15] - s[0] *s[7]*s[13] - s[4] *s[1]*s[15]
            + s[4]*s[3]*s[13] + s[12]*s[1]*s[7]  - s[12]*s[3]*s[5];
  inv[14] = - s[0]*s[5]*s[14] + s[0] *s[6]*s[13] + s[4] *s[1]*s[14]
            - s[4]*s[2]*s[13] - s[12]*s[1]*s[6]  + s[12]*s[2]*s[5];

  inv[3]  = - s[1]*s[6]*s[11] + s[1]*s[7]*s[10] + s[5]*s[2]*s[11]
            - s[5]*s[3]*s[10] - s[9]*s[2]*s[7]  + s[9]*s[3]*s[6];
  inv[7]  =   s[0]*s[6]*s[11] - s[0]*s[7]*s[10] - s[4]*s[2]*s[11]
            + s[4]*s[3]*s[10] + s[8]*s[2]*s[7]  - s[8]*s[3]*s[6];
  inv[11] = - s[0]*s[5]*s[11] + s[0]*s[7]*s[9]  + s[4]*s[1]*s[11]
            - s[4]*s[3]*s[9]  - s[8]*s[1]*s[7]  + s[8]*s[3]*s[5];
  inv[15] =   s[0]*s[5]*s[10] - s[0]*s[6]*s[9]  - s[4]*s[1]*s[10]
            + s[4]*s[2]*s[9]  + s[8]*s[1]*s[6]  - s[8]*s[2]*s[5];

  det = s[0]*inv[0] + s[1]*inv[4] + s[2]*inv[8] + s[3]*inv[12];
  if (det === 0) {
    return this;
  }

  det = 1 / det;
  for (i = 0; i < 16; i++) {
    d[i] = inv[i] * det;
  }

  return this;
};

/**
 * Calculate the inverse matrix of this, and set to this.
 * @return this
 */
Matrix4.prototype.invert = function() {
  return this.setInverseOf(this);
};

/**
 * Set the orthographic projection matrix.
 * @param left The coordinate of the left of clipping plane.
 * @param right The coordinate of the right of clipping plane.
 * @param bottom The coordinate of the bottom of clipping plane.
 * @param top The coordinate of the top top clipping plane.
 * @param near The distances to the nearer depth clipping plane. This value is minus if the plane is to be behind the viewer.
 * @param far The distances to the farther depth clipping plane. This value is minus if the plane is to be behind the viewer.
 * @return this
 */
Matrix4.prototype.setOrtho = function(left, right, bottom, top, near, far) {
  var e, rw, rh, rd;

  if (left === right || bottom === top || near === far) {
    throw 'null frustum';
  }

  rw = 1 / (right - left);
  rh = 1 / (top - bottom);
  rd = 1 / (far - near);

  e = this.elements;

  e[0]  = 2 * rw;
  e[1]  = 0;
  e[2]  = 0;
  e[3]  = 0;

  e[4]  = 0;
  e[5]  = 2 * rh;
  e[6]  = 0;
  e[7]  = 0;

  e[8]  = 0;
  e[9]  = 0;
  e[10] = -2 * rd;
  e[11] = 0;

  e[12] = -(right + left) * rw;
  e[13] = -(top + bottom) * rh;
  e[14] = -(far + near) * rd;
  e[15] = 1;

  return this;
};

/**
 * Multiply the orthographic projection matrix from the right.
 * @param left The coordinate of the left of clipping plane.
 * @param right The coordinate of the right of clipping plane.
 * @param bottom The coordinate of the bottom of clipping plane.
 * @param top The coordinate of the top top clipping plane.
 * @param near The distances to the nearer depth clipping plane. This value is minus if the plane is to be behind the viewer.
 * @param far The distances to the farther depth clipping plane. This value is minus if the plane is to be behind the viewer.
 * @return this
 */
Matrix4.prototype.ortho = function(left, right, bottom, top, near, far) {
  return this.concat(new Matrix4().setOrtho(left, right, bottom, top, near, far));
};

/**
 * Set the perspective projection matrix.
 * @param left The coordinate of the left of clipping plane.
 * @param right The coordinate of the right of clipping plane.
 * @param bottom The coordinate of the bottom of clipping plane.
 * @param top The coordinate of the top top clipping plane.
 * @param near The distances to the nearer depth clipping plane. This value must be plus value.
 * @param far The distances to the farther depth clipping plane. This value must be plus value.
 * @return this
 */
Matrix4.prototype.setFrustum = function(left, right, bottom, top, near, far) {
  var e, rw, rh, rd;

  if (left === right || top === bottom || near === far) {
    throw 'null frustum';
  }
  if (near <= 0) {
    throw 'near <= 0';
  }
  if (far <= 0) {
    throw 'far <= 0';
  }

  rw = 1 / (right - left);
  rh = 1 / (top - bottom);
  rd = 1 / (far - near);

  e = this.elements;

  e[ 0] = 2 * near * rw;
  e[ 1] = 0;
  e[ 2] = 0;
  e[ 3] = 0;

  e[ 4] = 0;
  e[ 5] = 2 * near * rh;
  e[ 6] = 0;
  e[ 7] = 0;

  e[ 8] = (right + left) * rw;
  e[ 9] = (top + bottom) * rh;
  e[10] = -(far + near) * rd;
  e[11] = -1;

  e[12] = 0;
  e[13] = 0;
  e[14] = -2 * near * far * rd;
  e[15] = 0;

  return this;
};

/**
 * Multiply the perspective projection matrix from the right.
 * @param left The coordinate of the left of clipping plane.
 * @param right The coordinate of the right of clipping plane.
 * @param bottom The coordinate of the bottom of clipping plane.
 * @param top The coordinate of the top top clipping plane.
 * @param near The distances to the nearer depth clipping plane. This value must be plus value.
 * @param far The distances to the farther depth clipping plane. This value must be plus value.
 * @return this
 */
Matrix4.prototype.frustum = function(left, right, bottom, top, near, far) {
  return this.concat(new Matrix4().setFrustum(left, right, bottom, top, near, far));
};

/**
 * Set the perspective projection matrix by fovy and aspect.
 * @param fovy The angle between the upper and lower sides of the frustum.
 * @param aspect The aspect ratio of the frustum. (width/height)
 * @param near The distances to the nearer depth clipping plane. This value must be plus value.
 * @param far The distances to the farther depth clipping plane. This value must be plus value.
 * @return this
 */
Matrix4.prototype.setPerspective = function(fovy, aspect, near, far) {
  var e, rd, s, ct;

  if (near === far || aspect === 0) {
    throw 'null frustum';
  }
  if (near <= 0) {
    throw 'near <= 0';
  }
  if (far <= 0) {
    throw 'far <= 0';
  }

  fovy = Math.PI * fovy / 180 / 2;
  s = Math.sin(fovy);
  if (s === 0) {
    throw 'null frustum';
  }

  rd = 1 / (far - near);
  ct = Math.cos(fovy) / s;

  e = this.elements;

  e[0]  = ct / aspect;
  e[1]  = 0;
  e[2]  = 0;
  e[3]  = 0;

  e[4]  = 0;
  e[5]  = ct;
  e[6]  = 0;
  e[7]  = 0;

  e[8]  = 0;
  e[9]  = 0;
  e[10] = -(far + near) * rd;
  e[11] = -1;

  e[12] = 0;
  e[13] = 0;
  e[14] = -2 * near * far * rd;
  e[15] = 0;

  return this;
};

/**
 * Multiply the perspective projection matrix from the right.
 * @param fovy The angle between the upper and lower sides of the frustum.
 * @param aspect The aspect ratio of the frustum. (width/height)
 * @param near The distances to the nearer depth clipping plane. This value must be plus value.
 * @param far The distances to the farther depth clipping plane. This value must be plus value.
 * @return this
 */
Matrix4.prototype.perspective = function(fovy, aspect, near, far) {
  return this.concat(new Matrix4().setPerspective(fovy, aspect, near, far));
};

/**
 * Set the matrix for scaling.
 * @param x The scale factor along the X axis
 * @param y The scale factor along the Y axis
 * @param z The scale factor along the Z axis
 * @return this
 */
Matrix4.prototype.setScale = function(x, y, z) {
  var e = this.elements;
  e[0] = x;  e[4] = 0;  e[8]  = 0;  e[12] = 0;
  e[1] = 0;  e[5] = y;  e[9]  = 0;  e[13] = 0;
  e[2] = 0;  e[6] = 0;  e[10] = z;  e[14] = 0;
  e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
  return this;
};

/**
 * Multiply the matrix for scaling from the right.
 * @param x The scale factor along the X axis
 * @param y The scale factor along the Y axis
 * @param z The scale factor along the Z axis
 * @return this
 */
Matrix4.prototype.scale = function(x, y, z) {
  var e = this.elements;
  e[0] *= x;  e[4] *= y;  e[8]  *= z;
  e[1] *= x;  e[5] *= y;  e[9]  *= z;
  e[2] *= x;  e[6] *= y;  e[10] *= z;
  e[3] *= x;  e[7] *= y;  e[11] *= z;
  return this;
};

/**
 * Set the matrix for translation.
 * @param x The X value of a translation.
 * @param y The Y value of a translation.
 * @param z The Z value of a translation.
 * @return this
 */
Matrix4.prototype.setTranslate = function(x, y, z) {
  var e = this.elements;
  e[0] = 1;  e[4] = 0;  e[8]  = 0;  e[12] = x;
  e[1] = 0;  e[5] = 1;  e[9]  = 0;  e[13] = y;
  e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = z;
  e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
  return this;
};

/**
 * Multiply the matrix for translation from the right.
 * @param x The X value of a translation.
 * @param y The Y value of a translation.
 * @param z The Z value of a translation.
 * @return this
 */
Matrix4.prototype.translate = function(x, y, z) {
  var e = this.elements;
  e[12] += e[0] * x + e[4] * y + e[8]  * z;
  e[13] += e[1] * x + e[5] * y + e[9]  * z;
  e[14] += e[2] * x + e[6] * y + e[10] * z;
  e[15] += e[3] * x + e[7] * y + e[11] * z;
  return this;
};

/**
 * Set the matrix for rotation.
 * The vector of rotation axis may not be normalized.
 * @param angle The angle of rotation (degrees)
 * @param x The X coordinate of vector of rotation axis.
 * @param y The Y coordinate of vector of rotation axis.
 * @param z The Z coordinate of vector of rotation axis.
 * @return this
 */
Matrix4.prototype.setRotate = function(angle, x, y, z) {
  var e, s, c, len, rlen, nc, xy, yz, zx, xs, ys, zs;

  angle = Math.PI * angle / 180;
  e = this.elements;

  s = Math.sin(angle);
  c = Math.cos(angle);

  if (0 !== x && 0 === y && 0 === z) {
    // Rotation around X axis
    if (x < 0) {
      s = -s;
    }
    e[0] = 1;  e[4] = 0;  e[ 8] = 0;  e[12] = 0;
    e[1] = 0;  e[5] = c;  e[ 9] =-s;  e[13] = 0;
    e[2] = 0;  e[6] = s;  e[10] = c;  e[14] = 0;
    e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
  } else if (0 === x && 0 !== y && 0 === z) {
    // Rotation around Y axis
    if (y < 0) {
      s = -s;
    }
    e[0] = c;  e[4] = 0;  e[ 8] = s;  e[12] = 0;
    e[1] = 0;  e[5] = 1;  e[ 9] = 0;  e[13] = 0;
    e[2] =-s;  e[6] = 0;  e[10] = c;  e[14] = 0;
    e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
  } else if (0 === x && 0 === y && 0 !== z) {
    // Rotation around Z axis
    if (z < 0) {
      s = -s;
    }
    e[0] = c;  e[4] =-s;  e[ 8] = 0;  e[12] = 0;
    e[1] = s;  e[5] = c;  e[ 9] = 0;  e[13] = 0;
    e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = 0;
    e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
  } else {
    // Rotation around another axis
    len = Math.sqrt(x*x + y*y + z*z);
    if (len !== 1) {
      rlen = 1 / len;
      x *= rlen;
      y *= rlen;
      z *= rlen;
    }
    nc = 1 - c;
    xy = x * y;
    yz = y * z;
    zx = z * x;
    xs = x * s;
    ys = y * s;
    zs = z * s;

    e[ 0] = x*x*nc +  c;
    e[ 1] = xy *nc + zs;
    e[ 2] = zx *nc - ys;
    e[ 3] = 0;

    e[ 4] = xy *nc - zs;
    e[ 5] = y*y*nc +  c;
    e[ 6] = yz *nc + xs;
    e[ 7] = 0;

    e[ 8] = zx *nc + ys;
    e[ 9] = yz *nc - xs;
    e[10] = z*z*nc +  c;
    e[11] = 0;

    e[12] = 0;
    e[13] = 0;
    e[14] = 0;
    e[15] = 1;
  }

  return this;
};

/**
 * Multiply the matrix for rotation from the right.
 * The vector of rotation axis may not be normalized.
 * @param angle The angle of rotation (degrees)
 * @param x The X coordinate of vector of rotation axis.
 * @param y The Y coordinate of vector of rotation axis.
 * @param z The Z coordinate of vector of rotation axis.
 * @return this
 */
Matrix4.prototype.rotate = function(angle, x, y, z) {
  return this.concat(new Matrix4().setRotate(angle, x, y, z));
};

/**
 * Set the viewing matrix.
 * @param eyeX, eyeY, eyeZ The position of the eye point.
 * @param centerX, centerY, centerZ The position of the reference point.
 * @param upX, upY, upZ The direction of the up vector.
 * @return this
 */
Matrix4.prototype.setLookAt = function(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
  var e, fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;

  fx = centerX - eyeX;
  fy = centerY - eyeY;
  fz = centerZ - eyeZ;

  // Normalize f.
  rlf = 1 / Math.sqrt(fx*fx + fy*fy + fz*fz);
  fx *= rlf;
  fy *= rlf;
  fz *= rlf;

  // Calculate cross product of f and up.
  sx = fy * upZ - fz * upY;
  sy = fz * upX - fx * upZ;
  sz = fx * upY - fy * upX;

  // Normalize s.
  rls = 1 / Math.sqrt(sx*sx + sy*sy + sz*sz);
  sx *= rls;
  sy *= rls;
  sz *= rls;

  // Calculate cross product of s and f.
  ux = sy * fz - sz * fy;
  uy = sz * fx - sx * fz;
  uz = sx * fy - sy * fx;

  // Set to this.
  e = this.elements;
  e[0] = sx;
  e[1] = ux;
  e[2] = -fx;
  e[3] = 0;

  e[4] = sy;
  e[5] = uy;
  e[6] = -fy;
  e[7] = 0;

  e[8] = sz;
  e[9] = uz;
  e[10] = -fz;
  e[11] = 0;

  e[12] = 0;
  e[13] = 0;
  e[14] = 0;
  e[15] = 1;

  // Translate.
  return this.translate(-eyeX, -eyeY, -eyeZ);
};

/**
 * Multiply the viewing matrix from the right.
 * @param eyeX, eyeY, eyeZ The position of the eye point.
 * @param centerX, centerY, centerZ The position of the reference point.
 * @param upX, upY, upZ The direction of the up vector.
 * @return this
 */
Matrix4.prototype.lookAt = function(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
  return this.concat(new Matrix4().setLookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ));
};

/**
 * Multiply the matrix for project vertex to plane from the right.
 * @param plane The array[A, B, C, D] of the equation of plane "Ax + By + Cz + D = 0".
 * @param light The array which stored coordinates of the light. if light[3]=0, treated as parallel light.
 * @return this
 */
Matrix4.prototype.dropShadow = function(plane, light) {
  var mat = new Matrix4();
  var e = mat.elements;

  var dot = plane[0] * light[0] + plane[1] * light[1] + plane[2] * light[2] + plane[3] * light[3];

  e[ 0] = dot - light[0] * plane[0];
  e[ 1] =     - light[1] * plane[0];
  e[ 2] =     - light[2] * plane[0];
  e[ 3] =     - light[3] * plane[0];

  e[ 4] =     - light[0] * plane[1];
  e[ 5] = dot - light[1] * plane[1];
  e[ 6] =     - light[2] * plane[1];
  e[ 7] =     - light[3] * plane[1];

  e[ 8] =     - light[0] * plane[2];
  e[ 9] =     - light[1] * plane[2];
  e[10] = dot - light[2] * plane[2];
  e[11] =     - light[3] * plane[2];

  e[12] =     - light[0] * plane[3];
  e[13] =     - light[1] * plane[3];
  e[14] =     - light[2] * plane[3];
  e[15] = dot - light[3] * plane[3];

  return this.concat(mat);
}

/**
 * Multiply the matrix for project vertex to plane from the right.(Projected by parallel light.)
 * @param normX, normY, normZ The normal vector of the plane.(Not necessary to be normalized.)
 * @param planeX, planeY, planeZ The coordinate of arbitrary points on a plane.
 * @param lightX, lightY, lightZ The vector of the direction of light.(Not necessary to be normalized.)
 * @return this
 */
Matrix4.prototype.dropShadowDirectionally = function(normX, normY, normZ, planeX, planeY, planeZ, lightX, lightY, lightZ) {
  var a = planeX * normX + planeY * normY + planeZ * normZ;
  return this.dropShadow([normX, normY, normZ, -a], [lightX, lightY, lightZ, 0]);
};

/**
 * Constructor of Vector3
 * If opt_src is specified, new vector is initialized by opt_src.
 * @param opt_src source vector(option)
 */
var Vector3 = function(opt_src) {
  var v = new Float32Array(3);
  if (opt_src && typeof opt_src === 'object') {
    v[0] = opt_src[0]; v[1] = opt_src[1]; v[2] = opt_src[2];
  } 
  this.elements = v;
}

/**
  * Normalize.
  * @return this
  */
Vector3.prototype.normalize = function() {
  var v = this.elements;
  var c = v[0], d = v[1], e = v[2], g = Math.sqrt(c*c+d*d+e*e);
  if(g){
    if(g == 1)
        return this;
   } else {
     v[0] = 0; v[1] = 0; v[2] = 0;
     return this;
   }
   g = 1/g;
   v[0] = c*g; v[1] = d*g; v[2] = e*g;
   return this;
};

/**
 * Constructor of Vector4
 * If opt_src is specified, new vector is initialized by opt_src.
 * @param opt_src source vector(option)
 */
var Vector4 = function(opt_src) {
  var v = new Float32Array(4);
  if (opt_src && typeof opt_src === 'object') {
    v[0] = opt_src[0]; v[1] = opt_src[1]; v[2] = opt_src[2]; v[3] = opt_src[3];
  } 
  this.elements = v;
}

// 阴影实验
// ========

// 阴影顶点着色器 (GLSL ES 3.0)
var SHADOW_VSHADER_SOURCE_300ES =
  '#version 300 es\n' +
  'in vec4 pos;\n' + // W库的顶点通常叫 'pos'，这里用 'a_Position' 为了通用性，后面会映射
  'uniform mat4 u_MvpMatrix;\n' +
  'void main() {\n' +  
  '  gl_Position = u_MvpMatrix * pos;\n' +
  '}\n';                         

// 阴影片元着色器 (GLSL ES 3.0)
var SHADOW_FSHADER_SOURCE_300ES =
  '#version 300 es\n' +
  'precision mediump float;\n' +
  'out vec4 FragColor;\n' + // GLSL ES 3.0 使用 out 声明输出变量
  'void main() {\n' +
  '  const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);\n' +
  '  const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);\n' +
  '  vec4 rgbaDepth = fract(gl_FragCoord.z * bitShift);\n' + 
  '  rgbaDepth -= rgbaDepth.gbaa * bitMask;\n' + 
  '  FragColor = rgbaDepth;\n' + // 将深度值编码为RGBA颜色输出
  '}\n';


// --- 新增: WebGL 工具函数（在 W.reset 和 main 之间找个合适的位置，或者也放末尾） ---
// 这是你原 Shadowmod.js 里 createProgram 和 loadShader 的简化版
function createProgram(gl, vshaderSource, fshaderSource) {
  const vShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vShader, vshaderSource);
  gl.compileShader(vShader);
  // 检查编译错误，这里省略，实际项目中应加上

  const fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fShader, fshaderSource);
  gl.compileShader(fShader);
  // 检查编译错误，这里省略，实际项目中应加上

  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);
  // 检查链接错误，这里省略，实际项目中应加上
  return program;
}

// 搭建秘密暗房的程序 (也放到文件末尾)
function initFramebufferObject(gl, width, height) { 
  var framebuffer, texture, depthRenderbuffer; 
  framebuffer = gl.createFramebuffer();

  // 纹理作为颜色附件
  texture = gl.createTexture(); 
  gl.bindTexture(gl.TEXTURE_2D, texture); 
  // 注意：WebGL2 可以使用 R32F 等格式存储深度，但 WebGL1 的 RGBA/UNSIGNED_BYTE 编码深度在这里更通用
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // 边界处理
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); // 边界处理

  // 渲染缓冲作为深度附件
  depthRenderbuffer = gl.createRenderbuffer(); 
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderbuffer); 
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height); 

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); 
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0); 
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderbuffer); 

  // 检查FBO状态
  var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer not complete:', status);
      return null;
  }

  framebuffer.texture = texture; 
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  return framebuffer; 
}

// --- 常量定义（在 W.reset 函数体外，或者文件末尾） ---
var OFFSCREEN_WIDTH = 1024; // 深度图分辨率
var OFFSCREEN_HEIGHT = 1024;
var SHADOW_MAP_TEXTURE_UNIT = 0; // 阴影贴图使用的纹理单元
var shadowProgram;  // 深度图渲染程序
var shadowFBO;  // 秘密暗房
var lightViewProjMatrix = new Matrix4(); // 光源的视口投影矩阵
var lightProjectionMatrix = new Matrix4(); // 光源的投影矩阵
var lightViewMatrix = new Matrix4(); // 光源的视图矩阵

// 初始化深度图渲染程序
W.shadowFunc001 = (gl) => {
  shadowProgram = createProgram(gl, SHADOW_VSHADER_SOURCE_300ES, SHADOW_FSHADER_SOURCE_300ES);  // 深度图着色器
  shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'pos');
  shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');
  shadowFBO = initFramebufferObject(gl, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);  // 深度图的秘密暗房
}

// 绘制深度图
W.shadowFunc002 = (gl) => {
  var lightPos = {x:10, y:8, z:0,};
  gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFBO);  // 绑定到秘密暗房
  gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT); // 设置分辨率
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(shadowProgram);  // 改着色器
  lightProjectionMatrix.setPerspective(70.0,  // 光的投影
                                      OFFSCREEN_WIDTH / OFFSCREEN_HEIGHT, 1, 1000);
  lightViewMatrix.setLookAt(lightPos.x, lightPos.y, lightPos.z,
                            0.0, 0.0, 0.0,   // 投射位置
                            0.0, 1.0, 0.0);  // 上的方向
  lightViewProjMatrix = lightProjectionMatrix.multiply(lightViewMatrix);  // 光的投影 m
  const posAttribLoc = gl.getAttribLocation(shadowProgram, 'pos');  //+ 找到 pos 并顶点属性
  gl.enableVertexAttribArray(posAttribLoc);

  /* 绘制 */
  for (k in W.next) {
    let object = W.next[k];
    
    if (object.n !== 'lighttest-cube' && object.n !== 'lighttest-plane') { continue;}
    if (object.type === 'camera' || object.type === 'light' || object.type === 'group' || !W.models[object.type]?.vertices) {
        continue;
    }
    let modelMatrix = W.animation(object.n);  // 当前模型的矩阵
    /* 有问题 */


    // 创建一个临时的 Matrix4 对象，并将 DOMMatrix 的数据“翻译”给它
    let modelMatrix4 = new Matrix4();
    const domMatrixElements = modelMatrix.toFloat32Array(); // 获取 DOMMatrix 的元素数组
    // 将元素逐个复制到 Matrix4 的内部元素数组中
    for (let i = 0; i < 16; i++) {
        modelMatrix4.elements[i] = domMatrixElements[i];
    }


    const mvpMatrixForObject = lightViewProjMatrix.multiply(modelMatrix4);  //+ 计算MVP并传递给深度图着色器
    gl.uniformMatrix4fv(
      shadowProgram.u_MvpMatrix,
      false,
      new DOMMatrix(mvpMatrixForObject.elements).toFloat32Array()
  );
    //gl.uniformMatrix4fv(shadowProgram.u_MvpMatrix, false, mvpMatrixForObject.toFloat32Array());
    gl.bindBuffer(gl.ARRAY_BUFFER, W.models[object.type].verticesBuffer);  //+ 顶点数据
    
    gl.vertexAttribPointer(posAttribLoc, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, W.models[object.type].indicesBuffer);  //+ 索引数据和绘制
    console.log(W.models[object.type]);
    gl.drawElements(gl.TRIANGLES, W.models[object.type].indices.length, gl.UNSIGNED_SHORT, 0);
    
    gl.disableVertexAttribArray(posAttribLoc); // 已绘制完，关闭
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); //+ 解绑，回默认画布
  gl.viewport(0, 0, W.canvas.width, W.canvas.height);


}
















export default W;