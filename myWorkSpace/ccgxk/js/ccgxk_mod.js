
"use strict";

function draw_W(){
    
}

// setInterval(() => {
//     var startTime = performance.now();
//     draw_W();
//     console.log("t:" + (performance.now() - startTime));
//   }, 1000); 

// 一些数学函数
var wMath = {
    quaternionToEuler: function(q){  // 四元数转化为欧拉数
        const { x, y,  z,  w } = q;
        const roll = Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)); // Roll (X轴)
        const sinPitch = 2 * (w * y - z * x);
        const pitch = Math.asin(Math.max(-1, Math.min(1, sinPitch))); // Pitch (Y轴)
        const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)); // Yaw (Z轴)
        const toDeg = angle => angle * (180 / Math.PI); // 转为度数
        return { rX: toDeg(roll), rY: toDeg(pitch), rZ: toDeg(yaw)};
    },

    eulerToQuaternion: function(roll, pitch, yaw){  // 欧拉数转化为四元数（目前用不到）
        const rollRad = roll * (Math.PI / 180);
        const pitchRad = pitch * (Math.PI / 180);
        const yawRad = yaw * (Math.PI / 180);
        const cr = Math.cos(rollRad * 0.5);
        const sr = Math.sin(rollRad * 0.5);
        const cp = Math.cos(pitchRad * 0.5);
        const sp = Math.sin(pitchRad * 0.5);
    },
}

// 项目对象
var ccgxk = {
    // ccgxk 的 cannon.js 物理世界
    world : null,

    // 初始化物理世界
    initWorld : function(){
        W.camera({n:'camera'});  // 初始化相机
        W.camera({fov: 40});  // 相机视野为 40
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // 地球重力9.82m/s²
        this.world.broadphase = new CANNON.NaiveBroadphase(); // 碰撞检测（所有刚体件都进行碰撞）
        this.world.solver.iterations = 20; // 物理迭代
        this.world.addContactMaterial(this.cannonDefaultCantactMaterial);  // 默认材质关联
        this.eventListener();  // 事件监听
        this.animate(); // 动画
        shiftInfo.innerHTML = '速度:' + 0 + ' | ' // 【测试，临时】
    },

    // 默认材质关联材质
    cannonDefaultCantactMaterial : new CANNON.ContactMaterial( // 默认材质关联材质
        new CANNON.Material(),
        new CANNON.Material(), {
            friction: 0.1, // 摩擦力
            restitution: 0.1, // 弹性系数
    }),

    // 物体列表
    bodylist : new Array(),

    // 隐藏的物体列表
    hiddenBodylist : new Array(),

    // 添加 box 物理体
    addPhysicalBox : function({ 
                isPhysical = true, isVisualMode = true, name = 'k'+(Math.random()*10**9|0),  // 如果没指认，则使用随机数生成 ID
                X = 5, Y = 5, Z = 5,
                mass = 0, width = 1, depth = 1, height = 1, size = 1,
                texture = null, smooth = 0,  // 因为 W.js 版本问题， smooth 暂时为 0
                background = '#888', mixValue = 0.71, rX = 0, rY = 0, rZ = 0 } = {}){
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
            this.world.addBody(body);
        }
        if(isVisualMode){  // 是否可视化
            W.cube({
                n: name,
                w: width, d: depth, h: height,
                x: X, y:Y, z:Z, t: texture, s: smooth,
                rx: rX, ry: rY, rz: rZ, b: background, mix: mixValue
            });
        }
        var myargs = Array.from(arguments);
        var result = { name, body, X, Y, Z, rX, rY, rZ, isVisualMode, myargs,};
        this.bodylist.push(result);
        return result;
    },

    // 根据 name 删除（暂时隐藏）某个物体
    removeBody : function(name){
        for (let index = 0; index < this.bodylist.length; index++) {
            let indexItem = this.bodylist[index];
            if(indexItem.name === name){
                console.log(name);
                this.world.removeBody(indexItem.body);  // 删除物理计算体
                W.delete({n:name});  // 删除可视化物体
                this.hiddenBodylist.push(indexItem);  // 将删除的物体放入隐藏列表
                this.bodylist.splice(index, 1);  // 删除物体列表中的物体
                break;
            }
        }
    },

    // 按照列表将 物理体 逐个 物理计算 和 可视化 更新
    updataBodylist : function(){
        for (let i = 0; i < this.bodylist.length; i++) {
            let indexItem = this.bodylist[i];
            if(indexItem.body !== null){ 
                let pos = indexItem.body.position;
                let quat = indexItem.body.quaternion;
                let indexItemEuler = wMath.quaternionToEuler(quat);
                indexItem.rX = indexItemEuler.rX;
                indexItem.rY = indexItemEuler.rY;
                indexItem.rZ = indexItemEuler.rZ;
                indexItem.X = pos.x;
                indexItem.Y = pos.y;
                indexItem.Z = pos.z;
            }
            if(indexItem.isVisualMode && W.next[indexItem.name]){
                W.move({
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
    },

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

    displayPOS : function(){
        var posInfo = document.getElementById('posInfo');
        if(this.mainVPlayer !== null){
            posInfo.innerHTML = (
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
            var speed = (this.isShiftPress) ? Math.max(0.2,4-(this.forwardAcc+=0.01)) :4+0*(this.forwardAcc=0.01);  // 加速度
            shiftInfo.innerHTML = '速度:' + Math.round((100 / speed)) + ' | ';
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
    mainVPlayerMove : function(mainVPlayerObj){
        if(mainVPlayerObj === null){return};
        var cam = this.mainCamera;
        var vplayerBodyPos = mainVPlayerObj.body.position;
        var vplayerBodyQua = mainVPlayerObj.body.quaternion;
        var vplayerAct = this.calMovePara(  // 获取按键和鼠标事件处理后的移动参数
            vplayerBodyPos.x, vplayerBodyPos.y, vplayerBodyPos.z,
            cam.qua.rx, cam.qua.ry, cam.qua.rz
        );
        mainVPlayerObj.body.position.x = vplayerAct.x;
        mainVPlayerObj.body.position.y = vplayerAct.y;
        mainVPlayerObj.body.position.z = vplayerAct.z;
        cam.qua = vplayerAct;
        vplayerBodyQua.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 180 * vplayerAct.ry);  // 主角只旋转 Y 轴
        W.camera({g:mainVPlayerObj.name, x:cam.pos.x, y:cam.pos.y, z:cam.pos.z, rx: cam.qua.rx, rz: cam.qua.rz})  // 摄像机只旋转 X 和 Z 轴
        cam.groupName = mainVPlayerObj.name;
        return 0;
    },

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

    // 添加自定义顶点数据的物体
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

    // 计算一次物理世界
    cannonAni : function(){
        this.world.step(1 / 60); // 时间步长 1/60，用于更新物理世界
    },

    // FPS 计算的辅助值
    fpsFrameCount : 0,
    lastTime : performance.now(),

    // 显示 FPS 和 内存 等...
    isFirstShowFPS : true,
    showFPS : function(){
        var currentTime = performance.now();
        var deltaTime = currentTime - this.lastTime;
        this.fpsFrameCount++;
        if(deltaTime > 4000 || this.isFirstShowFPS){
            this.isFirstShowFPS = false;
            var fps = this.fpsFrameCount / (deltaTime / 1000);
            fpsInfo.innerHTML = ('<br>FPS: ' + fps.toFixed(2));
            modListCount.innerHTML = ('当前模型数：' + this.bodylist.length + ' |');
            this.fpsFrameCount = 0;
            this.lastTime = currentTime;
            this._showMemory();  // 一秒显示一次内存，写在这里吧
            this.displayPOS();  // 显示主角坐标
        }
    },

    // 显示内存占用情况
    _showMemory : function(){
        var output = document.getElementById('metrics');
        if (performance.memory) {
            const mem = performance.memory;
            output.innerHTML = `内存: ${(mem.usedJSHeapSize/1048576).toFixed(1)}MB/` +
                    `${(mem.jsHeapSizeLimit/1048576).toFixed(1)}MB`  + ' | ';
        }
    },

    // 动画循环
    animate : function(){
        var _this = this;
        const viewAnimate = function() {
            _this.showFPS(); // 显示 FPS
            _this.cannonAni(); // 物理世界计算
            _this.updataBodylist(); // 更新物体列表
            _this.mainVPlayerMove(_this.mainVPlayer); // 摄像机和主角的移动和旋转
            requestAnimationFrame(viewAnimate);
        }
        viewAnimate();
    },
}