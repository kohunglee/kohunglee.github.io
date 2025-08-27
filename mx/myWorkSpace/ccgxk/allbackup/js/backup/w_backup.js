// WebGL框架
// ===============

debug = 0; // 启用着色器/程序编译日志（可选）

W = {
  
  // 框架可以渲染的3D模型列表
  // （参见文件末尾的内置模型：平面、广告牌、立方体、金字塔等）
  models: {},
  
  // 自定义渲染器列表
  //renderers: {},

  // 重置框架
  // 参数：一个<canvas>元素
  reset: canvas => {
    
    // 全局变量
    W.canvas = canvas;    // 画布元素
    W.objs = 0;           // 对象计数器
    W.current = {};       // 对象当前状态
    W.next = {};          // 对象下一状态
    W.textures = {};      // 纹理列表

    // WebGL上下文
    W.gl = canvas.getContext('webgl2');
    
    // 透明对象的默认混合方法
    W.gl.blendFunc(770 /* SRC_ALPHA */, 771 /* ONE_MINUS_SRC_ALPHA */);
    
    // 启用纹理0
    W.gl.activeTexture(33984 /* TEXTURE0 */);

    // 创建一个WebGL程序
    W.program = W.gl.createProgram();
    
    // 隐藏多边形的背面（可选）
    W.gl.enable(2884 /* CULL_FACE */);
    
    // 创建一个顶点着色器
    // （这个GLSL程序在场景的每个顶点处调用）
    W.gl.shaderSource(
      
      t = W.gl.createShader(35633 /* VERTEX_SHADER */),
      
      `#version 300 es
      precision highp float;                        // 设置默认浮点精度
      in vec4 pos, col, uv, normal;                 // 顶点属性：位置、颜色、纹理坐标、法线（如果有的话）
      uniform mat4 pv, eye, m, im;                  // 统一变换矩阵：投影 * 视图、视线、模型、模型逆矩阵
      uniform vec4 bb;                              // 如果当前形状是广告牌：bb = [w, h, 1.0, 0.0]
      out vec4 v_pos, v_col, v_uv, v_normal;        // 传递给片段着色器的可变量：位置、颜色、纹理坐标、法线（如果有的话）
      void main() {                                 
        gl_Position = pv * (                        // 设置顶点位置：p * v * v_pos
          v_pos = bb.z > 0.                         // 设置v_pos可变量：
          ? m[3] + eye * (pos * bb)                 // 广告牌总是朝向相机：p * v * 距离 + 眼睛 * (位置 * [w, h, 1.0, 0.0])
          : m * pos                                 // 其他对象正常旋转：p * v * m * 位置
        );                                          
        v_col = col;                                // 设置可变量
        v_uv = uv;
        v_normal = transpose(inverse(m)) * normal;  // 重新计算法线以匹配模型变换
      }`
    );
    
    // 编译顶点着色器并将其附加到程序
    W.gl.compileShader(t);
    W.gl.attachShader(W.program, t);
    if(debug) console.log('顶点着色器:', W.gl.getShaderInfoLog(t) || 'OK');
    
    // 创建片段着色器
    // （此GLSL程序在场景的每个片段（像素）处调用）
    W.gl.shaderSource(

      t = W.gl.createShader(35632 /* FRAGMENT_SHADER */),
      
      `#version 300 es
      precision highp float;                  // 设置默认浮点精度
      in vec4 v_pos, v_col, v_uv, v_normal;   // 从顶点着色器接收的varyings：位置、颜色、纹理坐标、法线（如果有的话）
      uniform vec3 light;                     // 统一变量：光源方向，启用平滑法线
      uniform vec4 o;                         // 选项 [平滑，启用光照，环境光，混合]
      uniform sampler2D sampler;              // 统一变量：2D纹理
      out vec4 c;                             // 输出：最终片段颜色

      // 下面的代码显示彩色/纹理/阴影片段
      void main() {
        c = mix(texture(sampler, v_uv.xy), v_col, o[3]);  // 基础颜色（纹理和rgba的混合）
        if(o[1] > 0.){                                    // 如果启用了光照/阴影：
          c = vec4(                                       // 输出 = vec4(基础颜色RGB * (方向阴影 + 环境光))，基础颜色Alpha
            c.rgb * (max(0., dot(light, -normalize(       // 方向阴影：计算光源方向和法线的点积（如果为负则取0）
              o[0] > 0.                                   // 如果启用了平滑阴影：
              ? vec3(v_normal.xyz)                        // 使用传递的平滑法线
              : cross(dFdx(v_pos.xyz), dFdy(v_pos.xyz))   // 否则，通过当前片段及其x/y邻居的叉积计算平面法线
            )))
            + o[2]),                                      // 添加传递的环境光
            c.a                                           // 使用基础颜色的Alpha
          );
        }
      }`
    );
    
    // 编译片段着色器并将其附加到程序
    W.gl.compileShader(t);
    W.gl.attachShader(W.program, t);
    if(debug) console.log('片段着色器:', W.gl.getShaderInfoLog(t) || 'OK');
    
    // 编译程序
    W.gl.linkProgram(W.program);
    W.gl.useProgram(W.program);
    if(debug) console.log('程序:', W.gl.getProgramInfoLog(W.program) || 'OK');
    
    // 设置场景的背景颜色（RGBA）
    W.gl.clearColor(1, 1, 1, 1);
    
    // 快捷方式设置清除颜色
    W.clearColor = c => W.gl.clearColor(...W.col(c));
    W.clearColor("fff");
    
    // 启用片段深度排序
    // （靠近物体的片段将自动覆盖远离物体的片段）
    W.gl.enable(2929 /* DEPTH_TEST */);
    
    // 当一切加载完毕后：设置默认光源/相机
    W.light({y: -1});
    W.camera({fov: 30});
    
    // 绘制场景。忽略第一帧，因为默认相机可能会被程序覆盖
    setTimeout(W.draw, 16);
  },

  // 设置对象的状态
  setState: (state, type, texture, i, normal = [], A, B, C, Ai, Bi, Ci, AB, BC) => {

    // 自定义名称或默认名称（'o' + 自动递增）
    state.n ||= 'o' + W.objs++;
    
    // Size同时设置w, h和d（可选）
    if(state.size) state.w = state.h = state.d = state.size;
    
    // 如果提供了新纹理，则构建并保存在W.textures中
    if(state.t && state.t.width && !W.textures[state.t.id]){
      texture = W.gl.createTexture();
      W.gl.pixelStorei(37441 /* UNPACK_PREMULTIPLY_ALPHA_WEBGL */, true);
      W.gl.bindTexture(3553 /* TEXTURE_2D */, texture);
      W.gl.pixelStorei(37440 /* UNPACK_FLIP_Y_WEBGL */, 1);
      W.gl.texImage2D(3553 /* TEXTURE_2D */, 0, 6408 /* RGBA */, 6408 /* RGBA */, 5121 /* UNSIGNED_BYTE */, state.t);
      W.gl.generateMipmap(3553 /* TEXTURE_2D */);
      W.textures[state.t.id] = texture;
    }
    
    // 如果设置了fov，则重新计算投影矩阵（近裁剪面：1，远裁剪面：1000，宽高比：画布比例）
    if(state.fov){
      W.projection =     
        new DOMMatrix([
          (1 / Math.tan(state.fov * Math.PI / 180)) / (W.canvas.width / W.canvas.height), 0, 0, 0, 
          0, (1 / Math.tan(state.fov * Math.PI / 180)), 0, 0, 
          0, 0, -1001 / 999, -1,
          0, 0, -2002 / 999, 0
        ]);
    }
    
    // 保存对象的类型，
    // 将之前的状态（或默认状态）与传入的新状态合并，
    // 并重置f（动画计时器）
    state = {type, ...(W.current[state.n] = W.next[state.n] || {w:1, h:1, d:1, x:0, y:0, z:0, rx:0, ry:0, rz:0, b:'888', mode:4, mix: 0}), ...state, f:0};
    
    // 如果模型顶点缓冲区不存在，则构建模型的顶点缓冲区
    if(W.models[state.type]?.vertices && !W.models?.[state.type].verticesBuffer){
      W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[state.type].verticesBuffer = W.gl.createBuffer());
      W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array(W.models[state.type].vertices), 35044 /*STATIC_DRAW*/);

      // 如果平滑法线不存在，则计算平滑法线（可选）
      if(!W.models[state.type].normals && W.smooth) W.smooth(state);
      
      // 从平滑/自定义法线（如果有的话）创建缓冲区
      if(W.models[state.type].normals){
        W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[state.type].normalsBuffer = W.gl.createBuffer());
        W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array(W.models[state.type].normals.flat()), 35044 /*STATIC_DRAW*/); 
      }      
    }
    
    // 如果模型的uv缓冲区不存在，则构建模型的uv缓冲区（如果有的话）
    if(W.models[state.type]?.uv && !W.models[state.type].uvBuffer){
      W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[state.type].uvBuffer = W.gl.createBuffer());
      W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array(W.models[state.type].uv), 35044 /*STATIC_DRAW*/); 
    }
    
    // 构建模型的索引缓冲区（如果有的话）并计算平滑法线（如果不存在）
    if(W.models[state.type]?.indices && !W.models[state.type].indicesBuffer){
      W.gl.bindBuffer(34963 /* ELEMENT_ARRAY_BUFFER */, W.models[state.type].indicesBuffer = W.gl.createBuffer());
      W.gl.bufferData(34963 /* ELEMENT_ARRAY_BUFFER */, new Uint16Array(W.models[state.type].indices), 35044 /* STATIC_DRAW */);
    }
    
    // 如果没有设置纹理，则将mix设置为1
    if(!state.t){
      state.mix = 1;
    }

    // 如果设置了纹理且未设置mix，则默认将mix设置为0
    else if(state.t && !state.mix){
      state.mix = 0;
    }
    
    // 保存新状态
    W.next[state.n] = state;
  },
  
  // 绘制场景
  draw: (now, dt, v, i, transparent = []) => {
    
    // 循环并测量帧之间的时间差
    dt = now - W.lastFrame;
    W.lastFrame = now;
    requestAnimationFrame(W.draw);
    
    if(W.next.camera.g){
      W.render(W.next[W.next.camera.g], dt, 1);
    }
    
    // 创建一个包含当前相机变换的矩阵v
    v = W.animation('camera');
    
    // 如果相机在组中
    if(W.next?.camera?.g){

      // 将相机矩阵预先乘以组的模型矩阵。
      v.preMultiplySelf(W.next[W.next.camera.g].M || W.next[W.next.camera.g].m);
    }
    
    // 将其发送到着色器作为Eye矩阵
    W.gl.uniformMatrix4fv(
      W.gl.getUniformLocation(W.program, 'eye'),
      false,
      v.toFloat32Array()
    );
    
    // 反转以获得View矩阵
    v.invertSelf();

    // 与透视矩阵预先相乘以获得Projection-View矩阵
    v.preMultiplySelf(W.projection);
    
    // 将其发送到着色器作为pv矩阵
    W.gl.uniformMatrix4fv(
      W.gl.getUniformLocation(W.program, 'pv'),
      false,
      v.toFloat32Array()
    );

    // 清除画布
    W.gl.clear(16640 /* W.gl.COLOR_BUFFER_BIT | W.gl.DEPTH_BUFFER_BIT */);
    
    // 渲染场景中的所有对象
    for(i in W.next){
      
      // 渲染没有纹理和没有透明度的形状（RGB1颜色）
      if(!W.next[i].t && W.col(W.next[i].b)[3] == 1){
        W.render(W.next[i], dt);
      }
      
      // 将具有透明度（RGBA或纹理）的对象添加到数组中
      else {
        transparent.push(W.next[i]);
      }
    }
    
    // 从后向前排序透明对象
    transparent.sort((a, b) => {
      // 如果b比a更接近相机，则返回值 > 0
      // 如果a比b更接近相机，则返回值 < 0
      return W.dist(b) - W.dist(a);
    });

    // 启用alpha混合
    W.gl.enable(3042 /* BLEND */);

    // 渲染所有透明对象
    for(i of transparent){

      // 如果是平面或广告牌，则禁用深度缓冲区写入，以更轻松地允许透明对象与平面相交
      if(["plane","billboard"].includes(i.type)) W.gl.depthMask(0);
    
      W.render(i, dt);
      
      W.gl.depthMask(1);
    }
    
    // 为下一帧禁用alpha混合
    W.gl.disable(3042 /* BLEND */);
    
    // 过渡光源方向并发送到着色器
    W.gl.uniform3f(
      W.gl.getUniformLocation(W.program, 'light'),
      W.lerp('light','x'), W.lerp('light','y'), W.lerp('light','z')
    );
  },
  
  // 渲染对象
  render: (object, dt, just_compute = ['camera','light','group'].includes(object.type), buffer) => {

    // 如果对象有纹理
    if(object.t) {

      // 设置纹理的目标（2D或立方图）
      W.gl.bindTexture(3553 /* TEXTURE_2D */, W.textures[object.t.id]);

      // 将纹理0传递给采样器
      W.gl.uniform1i(W.gl.getUniformLocation(W.program, 'sampler'), 0);
    }

    // 如果对象有动画，增加其计时器...
    if(object.f < object.a) object.f += dt;
    
    // ...但不要让它超过动画持续时间。
    if(object.f > object.a) object.f = object.a;

    // 从插值变换组合模型矩阵
    W.next[object.n].m = W.animation(object.n);

    // 如果对象在组中：
    if(W.next[object.g]){

      // 将模型矩阵预先乘以组的模型矩阵。
      W.next[object.n].m.preMultiplySelf(W.next[object.g].M || W.next[object.g].m);
    }

    // 将模型矩阵发送到顶点着色器
    W.gl.uniformMatrix4fv(
      W.gl.getUniformLocation(W.program, 'm'),
      false,
      (W.next[object.n].M || W.next[object.n].m).toFloat32Array()
    );
    
    // 将模型矩阵的逆矩阵发送到顶点着色器
    W.gl.uniformMatrix4fv(
      W.gl.getUniformLocation(W.program, 'im'),
      false,
      (new DOMMatrix(W.next[object.n].M || W.next[object.n].m)).invertSelf().toFloat32Array()
    );
    
    // 不渲染不可见的项目（相机、光源、组、相机的父级）
    if(!just_compute){
      
      // 设置位置缓冲区
      W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[object.type].verticesBuffer);
      W.gl.vertexAttribPointer(buffer = W.gl.getAttribLocation(W.program, 'pos'), 3, 5126 /* FLOAT */, false, 0, 0)
      W.gl.enableVertexAttribArray(buffer);
      
      // 设置纹理坐标缓冲区（如果有的话）
      if(W.models[object.type].uvBuffer){
        W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[object.type].uvBuffer);
        W.gl.vertexAttribPointer(buffer = W.gl.getAttribLocation(W.program, 'uv'), 2, 5126 /* FLOAT */, false, 0, 0);
        W.gl.enableVertexAttribArray(buffer);
      }
      
      // 设置法线缓冲区
      if((object.s || W.models[object.type].customNormals) && W.models[object.type].normalsBuffer){
        W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[object.type].normalsBuffer);
        W.gl.vertexAttribPointer(buffer = W.gl.getAttribLocation(W.program, 'normal'), 3, 5126 /* FLOAT */, false, 0, 0);
        W.gl.enableVertexAttribArray(buffer);
      }
      
      // 其他选项：[平滑，启用阴影，环境光，纹理/颜色混合]
      W.gl.uniform4f(

        W.gl.getUniformLocation(W.program, 'o'), 
        
        // 如果"s"为真，则启用平滑阴影
        object.s,
        
        // 如果在TRIANGLE*模式下且object.ns未禁用，则启用阴影
        ((object.mode > 3) || (W.gl[object.mode] > 3)) && !object.ns ? 1 : 0,
        
        // 环境光
        W.ambientLight || 0.2,
        
        // 纹理/颜色混合（如果有纹理。0：完全纹理，1：完全彩色）
        object.mix
      );
      
      // 如果对象是广告牌：向着色器发送特定统一变量：
      // [宽度，高度，是广告牌 = 1，0]
      W.gl.uniform4f(
        W.gl.getUniformLocation(W.program, 'bb'),
        
        // 尺寸
        object.w,
        object.h,               

        // 是广告牌
        object.type == 'billboard',
        
        // 保留
        0
      );
      
      // 设置索引（如果有的话）
      if(W.models[object.type].indicesBuffer){
        W.gl.bindBuffer(34963 /* ELEMENT_ARRAY_BUFFER */, W.models[object.type].indicesBuffer);
      }
        
      // 设置对象的颜色
      W.gl.vertexAttrib4fv(
        W.gl.getAttribLocation(W.program, 'col'),
        W.col(object.b)
      );

      // 绘制
      // 支持索引和非索引模型。
      // 如果所有模型都是索引的，可以只保留"drawElements"。
      if(W.models[object.type].indicesBuffer){
        W.gl.drawElements(+object.mode || W.gl[object.mode], W.models[object.type].indices.length, 5123 /* UNSIGNED_SHORT */, 0);
      }
      else {
        W.gl.drawArrays(+object.mode || W.gl[object.mode], 0, W.models[object.type].vertices.length / 3);
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
    if(objects.normals){
      W.models[name].customNormals = 1;
    }
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
  
  // 准备平滑法线数组
  W.models[state.type].normals = [];
  
  // 填充顶点数组：[[x,y,z],[x,y,z]...]
  for(i = 0; i < W.models[state.type].vertices.length; i+=3){
    vertices.push(W.models[state.type].vertices.slice(i, i+3));
  }
  
  // 迭代器
  if(iterate = W.models[state.type].indices) iterateSwitch = 1;
  else iterate = vertices, iterateSwitch = 0;
    
  // 迭代两次顶点
  // - 第一次遍历：计算每个三角形的法线并累积每个顶点的法线
  // - 第二次遍历：保存最终的平滑法线值
  for(i = 0; i < iterate.length * 2; i+=3){
    j = i % iterate.length;
    A = vertices[Ai = iterateSwitch ? W.models[state.type].indices[j] : j];
    B = vertices[Bi = iterateSwitch ? W.models[state.type].indices[j+1] : j+1];
    C = vertices[Ci = iterateSwitch ? W.models[state.type].indices[j+2] : j+2];
    AB = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    BC = [C[0] - B[0], C[1] - B[1], C[2] - B[2]];
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