/**
 * 添加物体
 */
export default {
    
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
                isShadow = 0,
                tiling = [1, 1],  // 纹理平铺
                shape = 'cube',  // 默认形状
                mass = 0, width = 1, depth = 1, height = 1, size = 1,
                texture = null, smooth = 0,
                background = '#888', mixValue = 0.71, rX = 0, rY = 0, rZ = 0,
                cannonBody = null,  // cannon 的 body，避免频繁 new body() 造成卡顿【测试中】
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
            var boxShape;
            switch (shape) {
                case 'sphere':
                    boxShape =  new CANNON.Sphere(width/2); // 圆的直径以 width 参数值为准
                    break;
                default:
                    const boxSize = new CANNON.Vec3(width/2, height/2, depth/2);
                    boxShape = new CANNON.Box(boxSize);
                    break;
            }

            // 对象池，暂时不用
            // body = this.acquireBody();  // 从对象池里取对象
            // body.mass = mass;
            // body.type = mass === 0 ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC;
            // body.shapes = [];
            // body.addShape(boxShape);
            // body.position.set(X, Y, Z);
            // body.material = this.cannonDefaultContactMaterial;
            // body.updateMassProperties();
            // body.wakeUp();

            

            body = new CANNON.Body({
                mass : mass,
                shape: boxShape,
                position: new CANNON.Vec3(X, Y, Z),
                material: this.cannonDefaultCantactMaterial,
            });

            body.collisionFilterGroup = colliGroup;  // 这 6 行，为物理体分配碰撞组。只有玩家和地面与石头碰撞，石头间不会（小物件除外）
            const collisionFilterMaskMap = {
                1: this.stoneGroupNum | this.allGroupNum,
                2: this.allGroupNum,
            };
            body.collisionFilterMask = collisionFilterMaskMap[colliGroup];  // 碰撞组
        
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
                shadow: isShadow,  // 测试一下

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
                this.bodylist.push(result);  // 默认数组
        }
        // this.ccgxkhooks.emitSync('addObj_ok');  // 钩子使用示例
        return result;
    },

    // 初始化 cannon body 对象池【暂时不用】
    cannonBodyPool : [],  // cannon body 对象池
    createCannonBodyPool : function(size){
        for (let i = 0; i < size; i++) {
            const body = new CANNON.Body({ mass: 0 });
            this.cannonBodyPool.push(body);
        }
    },

    // 从对象池里取一个 cannon body 对象
    acquireBody : function() {
        if(this.cannonBodyPool && this.cannonBodyPool.length > 0){
            return this.cannonBodyPool.pop();
        } else {
            console.log('对象池已满，请扩容！');
            return null;
        }
    },

    // 回收 cannon body 对象
    releaseBody : function(body) {
        // console.log('回收');
        this.cannonBodyPool.push(body);
    }
}