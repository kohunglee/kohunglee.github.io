
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _wjs_w_ins_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({

    // 配置
    speedH: 0.1,  // 最高速度的反数
    fov:35,       // 相机视野

    // ccgxk 的 cannon.js 物理世界
    world : null,

    // 物体列表
    bodylist : new Array(),  // 有质量，有物理计算，可视化
    bodylistNotPys : new Array(),  // 纯模型，不进行物理计算
    bodylistMass0 : new Array(),  // 无质量的可视模型

    // 初始化
    initWorld : function(canvas){
        this.initW(canvas);
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // 地球重力9.82m/s²
        this.world.broadphase = new CANNON.SAPBroadphase(this.world); // 宽相检测算法
        this.world.solver.iterations = 10; // 物理迭代
        this.world.addContactMaterial(this.cannonDefaultCantactMaterial);  // 默认材质关联
        this.eventListener();  // 事件监听
        this.animate(); // 动画
        shiftInfo.textContent = '速度:' + 0 + ' | ' // 【测试，临时】
    },

    // 初始化 W 引擎
    initW : function(c){
        const W = _wjs_w_ins_js__WEBPACK_IMPORTED_MODULE_0__["default"];
        c.width = window.innerWidth - 100;
        c.height = window.innerHeight - 100;
        W.reset(c);
        W.ambient(0.7);
        W.light({ x: 0.5, y: -0.3, z: -0.5});
        W.clearColor("#7A4141");
        W.camera({n:'camera', fov: this.fov});
        W.group({n:'posZero',x:0,y:1,z:0});  // 下面这几行，绘制原点坐标轴
        W.cube({g:'posZero',x:5,w:10,h:.5,d:.5,b:"f44"});
        W.cube({g:'posZero',y:5,h:10,w:.5,d:.5,b:"4f4"});
        W.cube({g:'posZero',z:5,d:10,w:.5,h:.5,b:"44f"});
        W.pyramid({g:'posZero',size:1,x:10,rz:-90,b:"f44"});
        W.pyramid({g:'posZero',size:1,y:10,b:"4f4"});
        W.pyramid({g:'posZero', n:'test0001' ,size:1,z:10,rx:90,b:"44f"});
        W.sphere({n:'posZeroSphere',x:0, y:0, z:0, size:5, s:1, b:"#FF145B"});
    },

    W : _wjs_w_ins_js__WEBPACK_IMPORTED_MODULE_0__["default"],
});

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// WebGL框架
// ===============

const W = {
  models: {},
  instanceMatrixBuffers: {}, // 实例化对象的矩阵数据

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
    
    var t;
    W.gl.shaderSource(
          // 顶点着色器
          t = W.gl.createShader(35633 ),
          `#version 300 es
          precision highp float;                        
          in vec4 pos, col, uv, normal;                 // 普通模型的 位置、颜色、纹理坐标、法线...
          in mat4 instanceModelMatrix;                  // 实例化模型的 模型
          uniform mat4 pv, eye, m, im;                  // 矩阵：投影 * 视图、视线、模型、模型逆矩阵
          uniform vec4 bb;                              // 广告牌：bb = [w, h, 1.0, 0.0]
          out vec4 v_pos, v_col, v_uv, v_normal;
          uniform bool isInstanced;              // 是不是实例化绘制
          void main() {
            mat4 currentModelMatrix;             // 当前的模型矩阵
            if (isInstanced) {
              currentModelMatrix = instanceModelMatrix;
            } else {
              currentModelMatrix = m;
            }
            gl_Position = pv * (                        // 设置顶点位置：p * v * v_pos
              v_pos = bb.z > 0.                         
              ? currentModelMatrix[3] + eye * (pos * bb) // 广告牌
              : currentModelMatrix * pos               
            );
            v_col = col;
            v_uv = uv;
            v_normal = transpose(inverse(currentModelMatrix)) * normal; // 使用实例矩阵
          }`
        );

        W.gl.compileShader(t);  // 编译
        W.gl.attachShader(W.program, t);
        
        // 创建片段着色器
        W.gl.shaderSource(
          t = W.gl.createShader(35632 ),
          `#version 300 es
          precision highp float;                  
          in vec4 v_pos, v_col, v_uv, v_normal;
          uniform vec3 light;
          uniform vec2 tiling;
          uniform vec4 o;
          uniform sampler2D sampler;
          out vec4 c;
          void main() {
            c = mix(texture(sampler, v_uv.xy * tiling), v_col, o[3]);
            if(o[1] > 0.){
              c = vec4(
                c.rgb * (max(0., dot(light, -normalize(
                  o[0] > 0.
                  ? vec3(v_normal.xyz)
                  : cross(dFdx(v_pos.xyz), dFdy(v_pos.xyz))
                )))
                + o[2]),
                c.a
              );
            }
          }`
        );
        
        W.gl.compileShader(t); 
        W.gl.attachShader(W.program, t);
        W.gl.linkProgram(W.program);
        W.gl.useProgram(W.program);
        W.clearColor = c => W.gl.clearColor(...W.col(c));
        W.clearColor("fff");
        W.gl.enable(2929 );
        W.light({y: -1});  
        W.camera({fov: 30});
        setTimeout(W.draw, 16);  // 开始绘制
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
          for (const instanceProps of state.instances) {
            const m = new DOMMatrix();
            m.translateSelf(instanceProps.x || 0, instanceProps.y || 0, instanceProps.z || 0)
            .rotateSelf(instanceProps.rx || 0, instanceProps.ry || 0, instanceProps.rz || 0)
            .scaleSelf(instanceProps.w || 1, instanceProps.h || 1, instanceProps.d || 1);
            instanceMatrices.push(...m.toFloat32Array());
          }
          const matrixData = new Float32Array(instanceMatrices);
          
          const buffer = W.gl.createBuffer();
          W.gl.bindBuffer(W.gl.ARRAY_BUFFER, buffer);
          W.gl.bufferData(W.gl.ARRAY_BUFFER, matrixData, W.gl.STATIC_DRAW);
          W.instanceMatrixBuffers[state.n] = buffer;
          state.instances = null;  // 清理，因为我们不再需要JS端的这个大数组
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
        }
        else if(state.t && !state.mix){ // 有纹理，mix 为 0
          state.mix = 0;
        }
        W.next[state.n] = state;  // 下一帧的状态
  },
  
  // 绘制场景
  draw: (now, dt, v, i, transparent = []) => {
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
        W.gl.clear(16640 );
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
          W.gl.vertexAttrib4fv(colorAttribLoc, W.col(object.b || '888'));  // 颜色->着色器（col）
          if (object.isInstanced) {
            W.gl.vertexAttribDivisor(colorAttribLoc, 0);  // 设置实例化对象颜色 Divisor
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (W);

/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 一些工具函数、杂项
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
    // 四元数转化为欧拉数
    quaternionToEuler: function(q){
        const { x, y,  z,  w } = q;
        const roll = Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)); // Roll (X轴)
        const sinPitch = 2 * (w * y - z * x);
        const pitch = Math.asin(Math.max(-1, Math.min(1, sinPitch))); // Pitch (Y轴)
        const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)); // Yaw (Z轴)
        const toDeg = angle => angle * (180 / Math.PI); // 转为度数
        return { rX: toDeg(roll), rY: toDeg(pitch), rZ: toDeg(yaw)};
    },

    // 给定种子，生成伪随机数（数组），genPseudoRandoms
    genPR : function (seed, count){
        let x = Math.abs(seed) || 1;
        x = (x * 1664525 + 1013904223) | 0;
        const result = new Float32Array(count);
        const invMaxUInt32 = 1.0 / 4294967296.0;
        for (let i = 0; i < count; i++) {
            x ^= x << 13;
            x ^= x >> 17;
            x ^= x << 5;
            result[i] = (x >>> 0) * invMaxUInt32;
        }
        return result;
    },

    // 默认 cannon js 材质关联材质
    cannonDefaultCantactMaterial : new CANNON.ContactMaterial( // 默认材质关联材质
        new CANNON.Material(),
        new CANNON.Material(), {
            friction: 0.1, // 摩擦力
            restitution: 0.1, // 弹性系数
    }),
});

/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 纹理设置相关
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({

    // 一个异步函数，用于加载纹理
    loadTexture : function(drawFunclist) {
        return new Promise(resolve => {
            for(var i = 0; i < drawFunclist.length; i++){
                const img = new Image();
                img.onload = () => resolve(img);  // 或许可以直接传入 wjs，以后优化吧
                img.id = drawFunclist[i].id;
                img.src = this.dToBase64(drawFunclist[i]);
                img.hidden = true;  // 一定要隐藏
                document.body.appendChild(img);
            }
        });
    },

    // 给定 canvas 绘制程序，可以绘制纹理并返回 base64
    dToBase64 : function(drawItem) {  // 【之后优化】复用同一个 canvas 元素（清空并重绘），可以避免频繁创建和销毁 canvas 元素。
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 400;
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawItem.func(ctx, canvas.width, canvas.height);
        if(drawItem.type === 'png'){  // 为透明化作铺垫
            return canvas.toDataURL('image/png');
        } else {
            var quality = drawItem.quality || 0.7;
            return canvas.toDataURL('image/jpeg', quality);
        }
    },
});

/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 主角的第一视角操控
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({

    // 主角被手动操纵的状态值
    keys : {
        viewForward: 0,  // 向前移动
        viewBackward: 0,
        turnRight: 0,
        turnLeft: 0,  // 向左旋转
        turnUp: 0,
        turnDown: 0,
        viewUp: 0,
        viewDown: 0,
        viewLeft: 0,  // 向左移动
        viewRight: 0,
        shiftKeyvalue: 0,
        jumping: 0,
    },

    // 键盘按键 与 操作状态值 的对应
    keyMap : {
        'w': 'viewForward',
        's': 'viewBackward',
        'a': 'viewLeft',
        'd': 'viewRight',
        'r': 'viewUp',
        'v': 'viewDown',
        'o': 'turnUp',
        'p': 'turnDown',
        'k': 'viewLeft',
        'l': 'viewRight',
        'arrowup': 'viewForward',
        'arrowdown': 'viewBackward',
        'arrowleft': 'turnLeft',
        'arrowright': 'turnRight',
    },

    // 是否按下了 shift 键
    isShiftPress : 0,

    // 事件监听
    eventListener : function(){
        var _this = this;
        var isMouseMove = false;
        document.addEventListener('keydown', function(e) {  // 按下键盘
            _this._handleKey(e, 1);
        });
        document.addEventListener('keyup', function(e) {  // 松开键盘
            _this._handleKey(e, 0);
        });
        document.addEventListener('mousemove', function(e) {  // 鼠标移动
            if (isMouseMove) {
                _this.keys.turnRight = e.movementX * 0.1;
                _this.keys.turnUp = e.movementY * 0.1;
            }
        });
        c.addEventListener('click', () => {  // 单击画布，开启虚拟鼠标
            c.requestPointerLock = c.requestPointerLock || c.mozRequestPointerLock || c.webkitRequestPointerLock;
            c.requestPointerLock();
            isMouseMove = true;
        });
        document.addEventListener('pointerlockchange', lockChangeAlert, false);
        document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
        document.addEventListener('webkitpointerlockchange', lockChangeAlert, false);
        function lockChangeAlert() {  // 单击 ESC 键后
            if (document.pointerLockElement === c || document.mozPointerLockElement === c || document.webkitPointerLockElement === c) {
                isMouseMove = true;
            } else {
                isMouseMove = false;
            }
        }
    },

    // 键盘事件处理逻辑
    _handleKey : function(e, value) {
        var action = this.keyMap[e.key.toLowerCase()];
        if (action) { this.keys[action] = value; }
        if (e.keyCode === 32 && this.mainVPlayer !== null) {  // 空格键
            var limit = this.mainVPlayer.body.position.y <= 10000;
            if (this.keys.jumping === 0 && limit) {
                this.mainVPlayer.body.velocity.y = 10;
            }
            this.keys.jumping = value;
        }
        if (e.keyCode === 16 || e.key.toLowerCase() === 'q') {  // shift键 或 q 开启加速
            this.isShiftPress = value;
        }
    },

    // 向前（后）移动的加速度辅助计算值
    forwardAcc : 0,

    // 显示主角的实时位置
    displayPOS : function(){
        var posInfo = document.getElementById('posInfo');
        if(this.mainVPlayer !== null){
            posInfo.textContent = (
                '位置: X:' + this.mainVPlayer.body.position.x.toFixed(2) +
                ', Y:' + this.mainVPlayer.body.position.y.toFixed(2) +
                ', Z:' + this.mainVPlayer.body.position.z.toFixed(2) + ', | '
            );
        }
    },

    // 计算物体（主要是相机和主角）的移动参数
    calMovePara : function(X, Y, Z, RX, RY, RZ){
        const keys = this.keys;
        if (keys.viewForward || keys.viewBackward) { // 前后平移
            var speed = (this.isShiftPress) ? Math.max(this.speedH,4-(this.forwardAcc+=0.01)) :4+0*(this.forwardAcc=0.01);  // 加速度
            shiftInfo.textContent = '速度:' + Math.round((100 / speed)) + ' | ';
            Z += (-keys.viewForward + keys.viewBackward) * Math.cos(RY * Math.PI / 180) / speed;
            X += (-keys.viewForward + keys.viewBackward) * Math.sin(RY * Math.PI / 180) / speed;
            this.displayPOS();
        }
        if (keys.viewLeft || keys.viewRight) { // 左右平移
            Z += (-keys.viewLeft + keys.viewRight) * Math.cos((RY + 90) * Math.PI / 180) / 10;
            X += (-keys.viewLeft + keys.viewRight) * Math.sin((RY + 90) * Math.PI / 180) / 10;
            this.displayPOS();
        }
        if (keys.viewUp || keys.viewDown) { // 上下平移
            var offset = (keys.viewUp - keys.viewDown) / 7;
            Y += offset;
        }
        if(keys.turnRight || keys.turnLeft) {  // 左右扭动
            var offset = (-keys.turnRight + keys.turnLeft);
            if(Math.abs(offset) > 0.1){
                RY += offset;
            }
        }
        if(keys.turnUp || keys.turnDown) {  // 上下扭动
            var offset = (-keys.turnUp + keys.turnDown);
            if(Math.abs(offset) > 0.5){
                RX += offset;
            }
        }
        return {  x: X,  y: Y,  z: Z,  rx: RX,  ry: RY,  rz: RZ  }
    },

    // 主角物理体
    mainVPlayer : null,

    // 摄像机的一些参数
    mainCamera : {
        groupName : null,
        pos : {  // 相对坐标系，相对于主角（下面 qua 也是）
            x: 0,
            y: 2,
            z: 4,
        },
        qua : {
            rx: 0,
            ry: 0,
            rz: 0,
        },
    },

    // 摄像机和主角的移动和旋转
    mainVPlayerMove : function(mVP){
        if(mVP === null){return};
        var cam = this.mainCamera;
        var vplayerBodyPos = mVP.body.position;
        var vplayerBodyQua = mVP.body.quaternion;
        var vplayerAct = this.calMovePara(  // 获取按键和鼠标事件处理后的移动参数
            vplayerBodyPos.x, vplayerBodyPos.y, vplayerBodyPos.z,
            cam.qua.rx, cam.qua.ry, cam.qua.rz
        );
        mVP.body.position.x = vplayerAct.x;
        mVP.body.position.y = vplayerAct.y;
        mVP.body.position.z = vplayerAct.z;
        cam.qua = vplayerAct;
        vplayerBodyQua.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 180 * vplayerAct.ry);  // 主角只旋转 Y 轴
        this.W.camera({g:mVP.name, x:cam.pos.x, y:cam.pos.y, z:cam.pos.z, rx: cam.qua.rx, rz: cam.qua.rz})  // 摄像机只旋转 X 和 Z 轴
        cam.groupName = mVP.name;
        mVP.posID = this.calPosID(mVP.X, mVP.Y, mVP.Z, 2);
        return 0;
    },
});

/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 动态区块管理
 * 
 * 将地图世界分区，以及 4 个优先级，动态加载和卸载模型
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({

    // 隐藏的物体列表
    hiddenBodylist : new Array(),

    // 实时存储合法的位置简码
    legalPosID : new Array(),

    // 根据 name 删除（暂时隐藏）某个物体
    removeBody : function(name, bodyArrlist, isPhysical = false){
        for (let index = 0; index < bodyArrlist.length; index++) {
            let indexItem = bodyArrlist[index];
            if(indexItem.name === name){
                if(isPhysical){
                    this.world.removeBody(indexItem.body);  // 删除物理计算体
                }
                this.W.delete(name);  // 删除可视化物体
                this.hiddenBodylist.push({  // 将删除的物体放入隐藏列表
                    posID : indexItem.posID,
                    quat : indexItem.quat,
                    X : indexItem.X,
                    Y : indexItem.Y,
                    Z : indexItem.Z,
                    myargs : indexItem.myargs,
                });
                bodyArrlist.splice(index, 1);  // 删除物体列表中的物体
                break;
            }
        }
    },

    // 预留函数位，每 10 秒将所有隐藏物体，坐标和旋转保留一位小数
    tofixedHiddenlist : null,

    // 计算位置的简码
    calPosID : function(x, y, z, zindex){
        const foo = {2: 1000, 3: 100, 4: 40}[zindex] || 0;
        if (zindex === 2) {zindex = ''};
        if(foo === 0){ return 0 }
        var dirctionA = (Math.sign(x) === -1) ? 'X' : 'D';
        var dirctionB = (Math.sign(z) === -1) ? 'B' : 'N';
        var numberA = Math.ceil(x / foo * Math.sign(x));
        var numberB = Math.ceil(z / foo * Math.sign(z));
        return zindex + dirctionA + numberA + dirctionB + numberB;
    },

    // 根据主角的位置简码，动态增删物体
    dynaLock : false,  // 动态增删锁
    dynaNodes : function(){
        if(this.mainVPlayer !== null) {
            var mVP = this.mainVPlayer;
            var mainVPPosID = this.calPosID(mVP.X, mVP.Y, mVP.Z, 2);
            if(this.dynaLock){  // 加锁，防止频繁增删导致 BUG
                return mainVPPosID;
            } else {
                this.dynaLock = true;
            }
            this.legalPosID.length = 0;
            const offsets = [  // 八个方向查找临近的区域编码
                { x: 1, y: 0, z: 0 },
                { x: -1, y: 0, z: 0 },
                { x: 0, y: 0, z: 1 },
                { x: 0, y: 0, z: -1 },
                { x: 1, y: 0, z: 1 },
                { x: -1, y: 0, z: -1 },
                { x: -1, y: 0, z: 1 },
                { x: 1, y: 0, z: -1 }
            ];
            offsets.forEach(offset => {  // 生成当前合法地址编码库
                const limits = [
                    { level: 2, len: 450 },
                    { level: 3, len: 45 },
                    { level: 4, len: 15 }
                ];
                limits.forEach(({ level, len }) => {
                    const posID = this.calPosID(mVP.X + offset.x * len, mVP.Y + offset.y * len, mVP.Z + offset.z * len, level);
                    if (!this.legalPosID.includes(posID)) {
                        this.legalPosID.push(posID);
                    }
                });
            });
            const removeIllegalBodies = (bodyArrList, isphysical = false) => {
                for (let i = bodyArrList.length - 1; i >= 0; i--) {  // 从后向前遍历，避免splice影响索引
                    let indexItem = bodyArrList[i];
                    if (!this.legalPosID.includes(indexItem.posID) && indexItem.DPZ !== 1) {
                        this.removeBody(indexItem.name, bodyArrList, isphysical);
                    }
                }
            };
            removeIllegalBodies(this.bodylist, true);  // 检测增删 普通模型
            removeIllegalBodies(this.bodylistNotPys);  // .. 纯模型
            removeIllegalBodies(this.bodylistMass0); // .. 无质量物体
            for (let i = 0; i < this.hiddenBodylist.length; i++) {  // 恢复已经合法的隐藏物体
                let indexItem = this.hiddenBodylist[i];
                if(this.legalPosID.includes(indexItem.posID)){
                    var myargs = indexItem.myargs[0];
                    if(indexItem.X){
                        myargs.X = indexItem.X;
                        myargs.Y = indexItem.Y;
                        myargs.Z = indexItem.Z;
                        myargs.quat = indexItem.quat;
                    }
                    this.addBox(myargs);
                    this.hiddenBodylist.splice(i, 1);
                }
            }
            this.dynaLock = false;
            return mainVPPosID;
        }
        return '';
    },
});

/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 添加物体
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
    
    // 碰撞计算组（cannon.js）
    allGroupNum : 1,  // 玩家、地面、小物件...
    stoneGroupNum : 2,  // 静止石头

    // 物体 name id（递增使用）
    bodyObjName : 0,

    // 添加 box 物体
    addBox : function({
                DPZ = 2,  // 显示优先级
                isPhysical = true,  // 是否被物理计算
                isVisualMode = true,  // 是否渲染
                colliGroup = 2,  // 碰撞组，全能为 1， 静止石头为 2
                name = 'k'+ this.bodyObjName++,  // 如果没指认，则使用随机数生成 ID
                X = 5, Y = 5, Z = 5,
                quat = null,
                tiling = [1, 1],  // 纹理平铺
                shape = 'cube',  // 默认形状
                mass = 0, width = 1, depth = 1, height = 1, size = 1,
                texture = null, smooth = 0,
                XNumber = 1,  // 重复平铺纵横数
                background = '#888', mixValue = 0.71, rX = 0, rY = 0, rZ = 0
            } = {}){
        var myargs = Array.from(arguments);  // 备份参数
        var posID = this.calPosID(X, Y, Z, DPZ);
        if(this.legalPosID.includes(posID) === false && DPZ !== 1){  // 位置编码和优先级不合法
            this.hiddenBodylist.push({posID, myargs});  // 放入隐藏列表
            return 0;
        }
        if(size !== 1){  // 处理体积大小
            width =  depth =  height = size;
        }
        var body = null;
        if(isPhysical){  // 是否创建物理计算体
            body = new CANNON.Body({
                mass : mass,
                shape: new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2)),
                position: new CANNON.Vec3(X, Y, Z),
                material: this.cannonDefaultCantactMaterial,
            });
            body.collisionFilterGroup = colliGroup;  // 这 6 行，为物理体分配碰撞组。只有玩家和地面与石头碰撞，石头间不会（小物件除外）
            const collisionFilterMaskMap = {
                1: this.stoneGroupNum | this.allGroupNum,
                2: this.allGroupNum,
            };
            body.collisionFilterMask = collisionFilterMaskMap[colliGroup];
            this.world.addBody(body);
            if(quat){
                body.quaternion.set(quat.x, quat.y, quat.z, quat.w);
            }
            quat = body.quaternion;
        }
        if(isVisualMode){  // 是否 W 渲染可视化
            if(typeof tiling === 'number'){ tiling = [tiling, tiling] }  // 处理平铺数
            this.W[shape]({
                n: name,
                w: width, d: depth, h: height,
                x: X, y:Y, z:Z,
                t: texture, s: smooth, tile: tiling,
                rx: rX, ry: rY, rz: rZ, b: background, mix: mixValue,
                xNumber: XNumber,  // 测试一下
            });
        }
        var result = { name, body, X, Y, Z, rX, rY, rZ, isVisualMode, myargs, posID, DPZ, quat};
        switch (true) {  // 看哪个数组接受它
            case isPhysical === false:
                this.bodylistNotPys.push(result);  // 纯模型
                break;
            case mass === 0:
                this.bodylistMass0.push(result);  // 无质量
                break;
            default:
                this.bodylist.push(result);
        }
        return result;
    },
});

/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * (实验中)添加自定义的物体
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({

    // 将顶点数据转化成 cannon.js 可用的格式
    returnVec3Data : function(verticesData, indicesData){
        const vertices = [];
        for (let i = 0; i < verticesData.length; i += 3) {
            vertices.push(new CANNON.Vec3(verticesData[i], verticesData[i + 1], verticesData[i + 2]));
        }
        const faces = [];
        for (let i = 0; i < indicesData.length; i += 3) {
            faces.push([indicesData[i], indicesData[i + 1], indicesData[i + 2]]);
        }
        const convexPolyhedron = new CANNON.ConvexPolyhedron(vertices, faces);
        return convexPolyhedron;
    },

    // 添加自定义顶点数据的物体（临近作废）
    addCustomDataObj : function({ 
                name = 'custom'+(Math.random()*10**9|0),  // 如果没指认，则使用随机数生成 ID
                modelName = null,  // 模型名
                X = 5, Y = 5, Z = 5,
                mass = 0, size = 1,
                verticesData = [], indicesData = [],
                texture = null, smooth = 0,  // 因为 W.js 版本问题， smooth 暂时为 0
                background = '#888', mixValue = 0.71, rX = 0, rY = 0, rZ = 0 } = {}){
        if(verticesData.length === 0 || indicesData.length === 0){ console.error('没有添加模型数据！');return; }
        const myshape = this.returnVec3Data(verticesData.map(v => v * size), indicesData);
        const tempBody = new CANNON.Body({
            mass: mass,
            shape: myshape,
            position: new CANNON.Vec3(X, Y, Z),
            material: this.cannonDefaultCantactMaterial,
        });
        this.world.addBody(tempBody);
        modelName = modelName || name;  // 指认了模型名，就使用模型
        if(W.modelName === undefined) {
            W.add(modelName, {  // W 引擎引入模型数据
                vertices: verticesData,
                indices: indicesData,
            });
        }
        W[modelName]({n:name,size: size, x:X, z:Z, y:Y});
        var result = {name: name, body: tempBody, rX: 0, rY: 0, rZ: 0};
        this.bodylist.push(result);  // 向 CCGXK 项目内追加
    },

});

/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * 动画进程相关
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
    // 按照列表将 物理体 逐个 物理计算可视化 更新
    updataBodylist : function(){
        for (let i = 0; i < this.bodylist.length; i++) {
            let indexItem = this.bodylist[i];
            if(indexItem.body !== null){ 
                let pos = indexItem.body.position;
                const dx = pos.x - indexItem.X;
                const dy = pos.y - indexItem.Y;
                var disten = Math.sqrt(dx*dx + dy*dy);  // 计算与自身上次的距离（必须大于 某个值 才能被可视化）
                let quat = indexItem.body.quaternion;
                let indexItemEuler = this.quaternionToEuler(quat);
                indexItem.quat = quat;
                indexItem.rX = indexItemEuler.rX;
                indexItem.rY = indexItemEuler.rY;
                indexItem.rZ = indexItemEuler.rZ;
                indexItem.X = pos.x;
                indexItem.Y = pos.y;
                indexItem.Z = pos.z;
            }
            if(
                (indexItem.isVisualMode && this.W.next[indexItem.name] && disten > 0.00001)  // 运动幅度大于这个值，才更新
                ||
                indexItem.name === 'mainPlayer'
            ){
                this.W.move({
                    n: indexItem.name,
                    x: indexItem.X,
                    y: indexItem.Y,
                    z: indexItem.Z,
                    rx: indexItem.rX,
                    ry: indexItem.rY,
                    rz: indexItem.rZ,
                });
            }
        }
        if(this.legalPosID.length < 1){ this.dynaNodes(); }  // 在启动程序后，要预热 legalPosID
    },

    // 计算一次物理世界
    cannonAni : function(){
        this.world.step(1 / 60); // 时间步长 1/60，用于更新物理世界
    },

    // FPS 计算的辅助值
    fpsFrameCount : 0,
    lastTime : performance.now(),

    // 显示 FPS 和 内存 等... (所有一秒一次的函数)
    isFirstShowFPS : true,
    showFPS1S : function(){
        var currentTime = performance.now();
        var deltaTime = currentTime - this.lastTime;
        this.fpsFrameCount++;
        if(deltaTime > 1000 || this.isFirstShowFPS){
            this.isFirstShowFPS = false;
            var fps = this.fpsFrameCount / (deltaTime / 1000);
            this.fpsFrameCount = 0;
            this.lastTime = currentTime;
            this._showMemory();  // 一秒显示一次内存
            this.displayPOS();  // 一秒显示一次显示主角坐标
            var dynaNodesCon = this.dynaNodes();  // 一秒显示一次主角位置编码
            posIDMVP.textContent = dynaNodesCon.replace(/[Dd]/g,'东').replace(/[Xx]/g,'西').replace(/[Nn]/g,'南').replace(/[Bb]/g,'北');  // 一秒显示一次主角位置编码
            fpsInfo.textContent = ('FPS: ' + fps.toFixed(2));  // 一秒显示一次 FPS
            modListCount.textContent = ('当前模型数：' + this.bodylist.length +
                                        ' - ❀' + this.bodylistNotPys.length +
                                        ' - 口' + this.bodylistMass0.length +
                                        ' - ⚠️' +this.hiddenBodylist.length +
                                                        ' |');  // 一秒显示一次模型数
        }
    },

    // 显示内存占用情况
    _showMemory : function(){
        var output = document.getElementById('metrics');
        if (performance.memory) {
            const mem = performance.memory;
            output.textContent = `内存: ${(mem.usedJSHeapSize/1048576).toFixed(1)}MB/` +
                    `${(mem.jsHeapSizeLimit/1048576).toFixed(1)}MB`  + ' | ';
        }
    },

    // 动画循环
    animate : function(){
        var _this = this;
        const viewAnimate = function() {
            _this.showFPS1S(); // 显示 FPS 和 一秒一次 的函数
            _this.cannonAni(); // 物理世界计算
            _this.updataBodylist(); // 更新物体列表
            _this.mainVPlayerMove(_this.mainVPlayer); // 摄像机和主角的移动和旋转
            requestAnimationFrame(viewAnimate);
        }
        viewAnimate();
    },
});

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _core_main_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _utils_tool_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3);
/* harmony import */ var _obj_texture_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4);
/* harmony import */ var _player_control_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5);
/* harmony import */ var _obj_chunkManager_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6);
/* harmony import */ var _obj_addobj_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(7);
/* harmony import */ var _obj_addcustobj_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(8);
/* harmony import */ var _core_animate_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(9);


// 主对象
const ccgxk ={
    ..._core_main_js__WEBPACK_IMPORTED_MODULE_0__["default"],         // 全局的配置、变量、初始化等
    ..._utils_tool_js__WEBPACK_IMPORTED_MODULE_1__["default"],         // 工具函数
    ..._obj_texture_js__WEBPACK_IMPORTED_MODULE_2__["default"],      // 纹理相关
    ..._player_control_js__WEBPACK_IMPORTED_MODULE_3__["default"],      // 第一视角的实现
    ..._obj_chunkManager_js__WEBPACK_IMPORTED_MODULE_4__["default"], // 动态区块管理
    ..._obj_addobj_js__WEBPACK_IMPORTED_MODULE_5__["default"],       // 添加新物体
    ..._obj_addcustobj_js__WEBPACK_IMPORTED_MODULE_6__["default"],   // 添加自定义的模型（实验中）
    ..._core_animate_js__WEBPACK_IMPORTED_MODULE_7__["default"],      // 动画进程相关
}

// 兼容 webpack
window.ccgxk = ccgxk;

// 导出
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ccgxk);
})();

/******/ })()
;