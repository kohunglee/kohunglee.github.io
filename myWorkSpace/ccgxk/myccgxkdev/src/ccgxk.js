"use strict";

import hooks from './common/hooks.js';
import tool from './utils/tool.js';
import wjs from './wjs/w_ins_lab.js';
import main from './core/main.js';
import texture from './obj/texture.js';
import control from './player/control.js';
import chunkManager from './obj/chunkManager.js';
import addobj from './obj/addobj.js';
import addcustobj from './obj/addcustobj.js';
import animate from './core/animate.js';

// 插件


// 开发使用的临时代码
// import webgpu from '../wjs/w_wgpu.js';  // 后续会更新成一个 webgpu 版本
// import babylon from '../babylon/babylon.js';  // 也会引入传说中的 babylon.js 以增强画质

// 主对象
const ccgxk ={
    hooks : hooks,        // JS 钩子，用于扩展
    W     : wjs,          // 三维模型 WebGL 渲染引擎
    ...tool,         // 工具函数
    ...main,         // 全局的配置、变量、初始化等
    ...texture,      // 纹理相关
    ...control,      // 第一视角的实现
    ...chunkManager, // 动态区块管理
    ...addobj,       // 添加新物体
    ...addcustobj,   // 添加自定义的模型（实验中）
    ...animate,      // 动画进程相关

    // 扩展
}

// 兼容浏览器平台
window.ccgxk = ccgxk;

// 导出
export default ccgxk;