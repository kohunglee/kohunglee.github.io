"use strict";

import main from './core/main.js';
import tool from './utils/tool.js';
import texture from './obj/texture.js';
import control from './player/control.js';
import chunkManager from './obj/chunkManager.js';
import addobj from './obj/addobj.js';
import addcustobj from './obj/addcustobj.js';
import animate from './core/animate.js';

// 主对象
const ccgxk ={
    ...main,         // 全局的配置、变量、初始化等
    ...tool,         // 工具函数
    ...texture,      // 纹理相关
    ...control,      // 第一视角的实现
    ...chunkManager, // 动态区块管理
    ...addobj,       // 添加新物体
    ...addcustobj,   // 添加自定义的模型（实验中）
    ...animate,      // 动画进程相关
}

// 导出
export default ccgxk;