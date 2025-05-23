"use strict";

// 项目对象
var ccgxk = {

    // 配置区
    speedH : 0.1,  // Q 键最高速度的反数

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


    /********************** 杂项：数学、列表... **********************/


    // ccgxk 的 cannon.js 物理世界
    world : null,

    // 默认材质关联材质
    cannonDefaultCantactMaterial : new CANNON.ContactMaterial( // 默认材质关联材质
        new CANNON.Material(),
        new CANNON.Material(), {
            friction: 0.1, // 摩擦力
            restitution: 0.1, // 弹性系数
    }),

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

    // 物体列表
    bodylist : new Array(),  // 有质量，有物理计算，可视化
    bodylistNotPys : new Array(),  // 纯模型，不进行物理计算
    bodylistMass0 : new Array(),  // 无质量的可视模型

    /********************** 添加物体 **********************/

    // 碰撞计算组
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
                shape = 'cube',  // 默认形状
                mass = 0, width = 1, depth = 1, height = 1, size = 1,
                texture = null, smooth = 0,  // smooth 暂时为 0，还在调试
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
        if(isVisualMode){  // 是否可视化
            W[shape]({
                n: name,
                w: width, d: depth, h: height,
                x: X, y:Y, z:Z, t: texture, s: smooth,
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


    /********************** 八方向模型计算 **********************/

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
                W.delete(name);  // 删除可视化物体
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
        if(foo === 0){ return 0; }
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

    /********************** 第一视角实现 **********************/


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
        W.camera({g:mVP.name, x:cam.pos.x, y:cam.pos.y, z:cam.pos.z, rx: cam.qua.rx, rz: cam.qua.rz})  // 摄像机只旋转 X 和 Z 轴
        cam.groupName = mVP.name;
        mVP.posID = this.calPosID(mVP.X, mVP.Y, mVP.Z, 2);
        return 0;
    },


    /********************** 纹理异步加载 **********************/


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
    dToBase64 : function(drawItem) {
        // 【之后优化】复用同一个 canvas 元素（清空并重绘），可以避免频繁创建和销毁 canvas 元素。
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


    /********************** 试验中，自定义模型 **********************/


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


    /********************** 动画进程相关 **********************/

    // 按照列表将 物理体 逐个 物理计算可视化 更新
    updataBodylist : function(){
        for (let i = 0; i < this.bodylist.length; i++) {
            let indexItem = this.bodylist[i];
            if(indexItem.body !== null){ 
                let pos = indexItem.body.position;
                const dx = pos.x - indexItem.X;
                const dy = pos.y - indexItem.Y;
                var disten = Math.sqrt(dx*dx + dy*dy);  // 计算与自身上次的距离（必须大于 0.001 才能被可视化）
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
                (indexItem.isVisualMode && W.next[indexItem.name] && disten > 0.001)
                ||
                indexItem.name === 'mainPlayer'
            ){
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
}