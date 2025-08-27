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
}