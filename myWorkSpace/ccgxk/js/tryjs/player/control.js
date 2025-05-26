/**
 * 主角的第一视角操控
 */
export default {

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
}