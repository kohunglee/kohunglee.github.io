/**
 * 
 */
export default {

    // 配置
    speedH: 0.1,  // 最高速度的反数

    // ccgxk 的 cannon.js 物理世界
    world : null,

    // 物体列表
    bodylist : new Array(),  // 有质量，有物理计算，可视化
    bodylistNotPys : new Array(),  // 纯模型，不进行物理计算
    bodylistMass0 : new Array(),  // 无质量的可视模型

    // 初始化
    initWorld : function(){
        W.camera({n:'camera'});  // 初始化相机
        W.camera({fov: 35});  // 相机视野为 35
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // 地球重力9.82m/s²
        this.world.broadphase = new CANNON.SAPBroadphase(this.world); // 宽相检测算法
        this.world.solver.iterations = 10; // 物理迭代
        this.world.addContactMaterial(this.cannonDefaultCantactMaterial);  // 默认材质关联
        this.eventListener();  // 事件监听
        this.animate(); // 动画
        shiftInfo.textContent = '速度:' + 0 + ' | ' // 【测试，临时】
    },
}