// WebGL框架
// ===============

debug = 0; // 启用着色器/程序编译日志（可选）

W = {
  models: {},  // 模型列表

  // 初始化
  reset: canvas => {  // 参数为一个 canvas 元素
    
    // 全局变量
    W.canvas = canvas;    // 画布元素
    W.objs = 0;           // 目前的对象数量
    W.current = {};       // 每个对象 本帧 的长宽高等
    W.next = {};          // 每个对象 下一帧 的长宽高等
    W.textures = {};      // 纹理的列表
    W.viewLimit = 5000;   // 【自己添加的】视野
    W.gl = canvas.getContext('webgl2');  // 获取 gl
    W.gl.blendFunc(770 /* SRC_ALPHA */, 771 /* ONE_MINUS_SRC_ALPHA */);  // 默认混合方法
    W.gl.activeTexture(33984 /* TEXTURE0 */);  // 启用纹理0
    W.program = W.gl.createProgram();  // 启动一个 webgl
    W.gl.enable(2884 /* CULL_FACE */);  // 隐藏多边形的不可见的背面
    
    // 顶点着色器
    W.gl.shaderSource(
          t = W.gl.createShader(35633 /* VERTEX_SHADER */),
          `#version 300 es
          precision highp float;                        // 设置默认浮点精度 为 高精度
          in vec4 pos, col, uv, normal;                 // 顶点属性：位置、颜色、纹理坐标、法线（如果有的话）
          uniform mat4 pv, eye, m, im;                  // 矩阵：投影 * 视图、视线、模型、模型逆矩阵
          uniform vec4 bb;                              // 如果当前形状是广告牌：bb = [w, h, 1.0, 0.0]
          out vec4 v_pos, v_col, v_uv, v_normal;        // 传递给【片段着色器】的可变量：位置、颜色、纹理坐标、法线（如果有的话）
          void main() {                                 
            gl_Position = pv * (                        // 设置顶点位置：p * v * v_pos
              v_pos = bb.z > 0.                         // 设置v_pos可变量：
              ? m[3] + eye * (pos * bb)                 // 【广告牌部分】广告牌总是朝向相机：p * v * 距离 + 眼睛 * (位置 * [w, h, 1.0, 0.0])
              : m * pos                                 // 其他对象正常旋转：p * v * m * 位置
            );                     
            v_col = col;                                // 传给【片段着色器】的部分
            v_uv = uv;
            v_normal = transpose(inverse(m)) * normal;  // 重新计算法线以匹配模型变换
          }`
        );

        W.gl.compileShader(t);  // 编译顶点着色器并将其附加到程序
        W.gl.attachShader(W.program, t);
        if(debug) console.log('顶点着色器:', W.gl.getShaderInfoLog(t) || 'OK');
        
        // 创建片段着色器
        W.gl.shaderSource(
          t = W.gl.createShader(35632 /* FRAGMENT_SHADER */),
          `#version 300 es
          precision highp float;                  // 设置默认浮点精度
          in vec4 v_pos, v_col, v_uv, v_normal;   // 从顶点着色器接收的varyings：位置、颜色、纹理坐标、法线（如果有的话）
          uniform vec2 tiling;                    // 平铺矩阵，如 [3.0, 3.0]
          uniform vec3 light;                     // 统一变量：光源方向，启用平滑法线
          uniform vec4 o;                         // 选项 [平滑，启用光照，环境光，混合]
          uniform sampler2D sampler;              // 统一变量：2D纹理
          out vec4 c;                             // 输出：最终片段颜色

          // 下面的代码显示彩色/纹理/阴影片段
          void main() {
            c = mix(texture(sampler, v_uv.xy * tiling), v_col, o[3]); // 如果启用了平铺，则使用纹理坐标 * tiling
            if(o[1] > 0.){                                    // 如果启用了光照/阴影：【判断选项】
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
        
        W.gl.compileShader(t);  // 编译【片段着色器】并将其附加到程序
        W.gl.attachShader(W.program, t);
        if(debug) console.log('片段着色器:', W.gl.getShaderInfoLog(t) || 'OK');
        W.gl.linkProgram(W.program);  // 链接和编译
        W.gl.useProgram(W.program);
        if(debug) console.log('程序:', W.gl.getProgramInfoLog(W.program) || 'OK');
        W.clearColor = c => W.gl.clearColor(...W.col(c));  // 快捷函数设置清除颜色
        W.clearColor("fff");
        W.gl.enable(2929 /* DEPTH_TEST */);  // 深度排序
        W.light({y: -1});  // 设置默认光源/相机
        W.camera({fov: 30});
        setTimeout(W.draw, 16);  // 开始绘制
  },

  // 设置对象的状态
  setState: (state, type, texture, i, normal = [], A, B, C, Ai, Bi, Ci, AB, BC) => {
        state.n ||= 'o' + W.objs++;  // name 或默认名称（'o' + 自动递增）
        if(state.size) state.w = state.h = state.d = state.size;  // size 属性
        if(state.t && state.t.width && !W.textures[state.t.id]){  // 道具带了新纹理，画廊里还没有，那就收藏起来
          texture = W.gl.createTexture();  // 创建纹理
          W.gl.pixelStorei(37441 /* UNPACK_PREMULTIPLY_ALPHA_WEBGL */, true);  // 启用预乘透明度模式
          W.gl.bindTexture(3553 /* TEXTURE_2D */, texture);  // 绑定
          W.gl.pixelStorei(37440 /* UNPACK_FLIP_Y_WEBGL */, 1);  // Y轴翻转状态
          W.gl.texImage2D(3553 /* TEXTURE_2D */, 0, 6408 /* RGBA */, 6408 /* RGBA */, 5121 /* UNSIGNED_BYTE */, state.t);  // 从用户那里加载纹理
          W.gl.generateMipmap(3553 /* TEXTURE_2D */);  //生成 2D 纹理的 Mipmap 映射  // 日本图变小可能因为这里
          W.textures[state.t.id] = texture;
        }
        if(state.fov){  // 根据 fov 计算【投影矩阵】
          var viewLimit = W.viewLimit;
          W.projection =
            new DOMMatrix([  // 投影效果计算就此而来
              (1 / Math.tan(state.fov * Math.PI / 180)) / (W.canvas.width / W.canvas.height), 0, 0, 0, 
              0, (1 / Math.tan(state.fov * Math.PI / 180)), 0, 0, 
              0, 0, -(viewLimit + 1) / (viewLimit - 1), -1,
              0, 0, -(2 * viewLimit + 2) / (viewLimit - 1), 0
            ]);
        }
        state = {  // 保存对象的类型，清零计时器 f
          type,
          ...(W.current[state.n] = W.next[state.n]
                                   ||
                                   {w:1, h:1, d:1, x:0, y:0, z:0, rx:0, ry:0, rz:0, b:'888', mode:4, mix: 0}),  // 默认值
          ...state,
          f:0
        };
        if(W.models[state.type]?.vertices && !W.models?.[state.type].verticesBuffer){  // 构建模型顶点（如果不存在，下同）
          W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[state.type].verticesBuffer = W.gl.createBuffer());  // 选择柜子
          W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array(W.models[state.type].vertices), 35044 /*STATIC_DRAW*/);  // 装到这个柜子里
          if(!W.models[state.type].normals && W.smooth) W.smooth(state);  // 计算平滑法线
          if(W.models[state.type].normals){  // 从法线构建缓冲区
            W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[state.type].normalsBuffer = W.gl.createBuffer());
            W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array(W.models[state.type].normals.flat()), 35044 /*STATIC_DRAW*/); 
          }
        }
        if(W.models[state.type]?.uv && !W.models[state.type].uvBuffer){  // UV 加工厂
          W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[state.type].uvBuffer = W.gl.createBuffer());
          W.gl.bufferData(34962 /* ARRAY_BUFFER */, new Float32Array( W.models[state.type].uv), 35044 /*STATIC_DRAW*/);  // 可能是内置模型的 UV
          // .map(val => val === 1 ? 2 : val)
        }
        if(W.models[state.type]?.indices && !W.models[state.type].indicesBuffer){  // 索引 加工厂
          W.gl.bindBuffer(34963 /* ELEMENT_ARRAY_BUFFER */, W.models[state.type].indicesBuffer = W.gl.createBuffer());
          W.gl.bufferData(34963 /* ELEMENT_ARRAY_BUFFER */, new Uint16Array(W.models[state.type].indices), 35044 /* STATIC_DRAW */);
        }
        if(!state.t){  // 如果没有设置纹理，则将mix设置为1
          state.mix = 1;
        }
        else if(state.t && !state.mix){ // 如果设置了纹理且未设置mix，则默认将mix设置为0
          state.mix = 0;
        }
        W.next[state.n] = state;  // 下一帧的状态
  },
  
  // 绘制场景
  draw: (now, dt, v, i, transparent = []) => {
        dt = now - W.lastFrame;  // 循环并测量帧之间的时间差【原理还在研究】这样动画就能以稳定的速度播放，而不是受电脑性能影响。
        W.lastFrame = now;
        requestAnimationFrame(W.draw);  // 绘制下一帧
        if(W.next.camera.g){  // 如果相机的group存在
          W.render(W.next[W.next.camera.g], dt, 1);  // 渲染啥？？先渲染组的对象
        }
        v = W.animation('camera');  // 创建一个包含当前相机变换的矩阵v ，用于下面的各种变换操作
        if(W.next?.camera?.g){  // 如果相机在组中 // 如果摄影师（camera）在一个“组”（group）里，那我们得先算出这个组的整体变换。
          v.preMultiplySelf(W.next[W.next.camera.g].M || W.next[W.next.camera.g].m);  // 相机以组来计算矩阵
        }
        W.gl.uniformMatrix4fv(  // 将相机的矩阵发往 着色器，作为 eye 参数
          W.gl.getUniformLocation(W.program, 'eye'),
          false,
          v.toFloat32Array()
        );
        v.invertSelf();  // 视角反转
        v.preMultiplySelf(W.projection);  // 与透视矩阵自我相乘(该函数是 js 函数，表示自身与一个矩阵相乘)
        W.gl.uniformMatrix4fv(  // 作为透视矩阵 pv ，传给着色器
          W.gl.getUniformLocation(W.program, 'pv'),
          false,
          v.toFloat32Array()
        );
        W.gl.clear(16640 /* W.gl.COLOR_BUFFER_BIT | W.gl.DEPTH_BUFFER_BIT */);  // 画布清空
        for(i in W.next){  // 遍历所有已绘制的模型对象
          if(!W.next[i].t && W.col(W.next[i].b)[3] == 1){  // 渲染纯色物体
            W.render(W.next[i], dt);
          } else {
            transparent.push(W.next[i]);  // 把有透明颜色或有纹理的，先装到数组里
          }
        }
        transparent.sort((a, b) => {  // 从后向前排序透明对象（用以不明，还在研究）对于透明物体，为了正确的混合效果，我们通常需要从**远到近**绘制
          return W.dist(b) - W.dist(a);
        });
        W.gl.enable(3042 /* BLEND */);  // 启用alpha混合，以便渲染透明效果
        for(i of transparent){  // 遍历渲染透明对象
          if( ["plane","billboard"].includes(i.type) ) W.gl.depthMask(0);  // 如果是平面或广告牌，则禁用深度缓冲区写入（物体的远近），以更轻松地允许透明对象与平面相交
          W.render(i, dt);
          W.gl.depthMask(1);  // 开启深度缓冲区写入  (好像没有什么区别)
        }
        W.gl.disable(3042 /* BLEND */);  // 关闭透明颜色
        W.gl.uniform3f(  // 把过渡光源的方向，发送到着色器 light  // 最后绘制灯光
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
          W.gl.uniform2f(  // 将纹理的平铺和缩放发送到着色器
            W.gl.getUniformLocation(W.program, 'tiling'),
            object.tile?.[0] || 1,
            object.tile?.[1] || 1
          );
        }
        if(object.f < object.a) object.f += dt;  // 动画，f 是当前时间，a 是总时间
        if(object.f > object.a) object.f = object.a;
        W.next[object.n].m = W.animation(object.n);  // 计算过度项目的结果，给下一帧
        if(W.next[object.g]){  // 对象在组中
          W.next[object.n].m.preMultiplySelf(W.next[object.g].M || W.next[object.g].m);  // 组中的对象，以组来计算矩阵
        }
        W.gl.uniformMatrix4fv(  // 将 下一帧 的模型矩阵发生到着色器（m）
          W.gl.getUniformLocation(W.program, 'm'),
          false,
          (W.next[object.n].M || W.next[object.n].m).toFloat32Array()
        );
        W.gl.uniformMatrix4fv(  // 将 下一帧 的模型逆矩阵发生到着色器（im）(有啥用？)
          W.gl.getUniformLocation(W.program, 'im'),
          false,
          (new DOMMatrix(W.next[object.n].M || W.next[object.n].m)).invertSelf().toFloat32Array()
        );
        if(!just_compute){  // 可见项目，（相机、光源、组、相机的父级不可见）
          W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[object.type].verticesBuffer);  // 顶点信息
          W.gl.vertexAttribPointer(buffer = W.gl.getAttribLocation(W.program, 'pos'), 3, 5126 /* FLOAT */, false, 0, 0);  // 定义解析数据的办法
          W.gl.enableVertexAttribArray(buffer);
          if(W.models[object.type].uvBuffer){  
            W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[object.type].uvBuffer);  // 向纹理缓冲区传数据
            W.gl.vertexAttribPointer(buffer = W.gl.getAttribLocation(W.program, 'uv'), 2, 5126 /* FLOAT */, false, 0, 0);
            W.gl.enableVertexAttribArray(buffer);
          }
          if((object.s || W.models[object.type].customNormals) && W.models[object.type].normalsBuffer){  // 法线
            W.gl.bindBuffer(34962 /* ARRAY_BUFFER */, W.models[object.type].normalsBuffer);
            W.gl.vertexAttribPointer(buffer = W.gl.getAttribLocation(W.program, 'normal'), 3, 5126 /* FLOAT */, false, 0, 0);
            W.gl.enableVertexAttribArray(buffer);
          }
          W.gl.uniform4f(  // 其他选项：[平滑，启用阴影，环境光，纹理/颜色混合]
            W.gl.getUniformLocation(W.program, 'o'),
            object.s,  // 如果"s"为真，则启用平滑阴影
            ((object.mode > 3) || (W.gl[object.mode] > 3)) && !object.ns ? 1 : 0,  // 如果在TRIANGLE*模式下且object.ns未禁用，则启用阴影
            W.ambientLight || 0.2,  // 环境光
            object.mix  // 纹理/颜色混合（如果有纹理。0：完全纹理，1：完全彩色）
          );
          W.gl.uniform4f(
            W.gl.getUniformLocation(W.program, 'bb'),  // [宽度，高度，是广告牌 = 1，0]
            object.w,  // 尺寸
            object.h,
            object.type == 'billboard',  // 是广告牌
            0
          );
          if(W.models[object.type].indicesBuffer){  // 设置索引（如果有的话）
            W.gl.bindBuffer(34963 /* ELEMENT_ARRAY_BUFFER */, W.models[object.type].indicesBuffer);  // 索引放入缓冲区
          }
          W.gl.vertexAttrib4fv(  // 设置对象的颜色
            W.gl.getAttribLocation(W.program, 'col'),  // 着色器里的 col
            W.col(object.b)
          );
          if(W.models[object.type].indicesBuffer){  // 判断是否有索引数据
            W.gl.drawElements(+object.mode || W.gl[object.mode], W.models[object.type].indices.length, 5123 /* UNSIGNED_SHORT */, 0);  // 索引绘制法
          }
          else {
            W.gl.drawArrays(+object.mode || W.gl[object.mode], 0, W.models[object.type].vertices.length / 3);  // 非索引绘制法
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