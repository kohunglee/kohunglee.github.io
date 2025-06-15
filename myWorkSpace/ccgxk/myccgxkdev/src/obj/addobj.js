/**
 * 添加物体
 */
export default {
    
    // 碰撞计算组（cannon.js）
    allGroupNum : 1,  // 玩家、地面、小物件...
    stoneGroupNum : 2,  // 静止石头

    // 物体 name id（递增使用）
    bodyObjName : 0,

    // 初始化类型化数组（储存物体信息使用，TA = typeArray）
    positionsStatusTA : null,  //位置和状态
    identitiesTA : null,       // 身份和外观
    physicsPropsTA : null,     // 物理属性
    freeSlots : null,          // 空位表
    nameToIndexMap : null,     // name -> index 对应表
    spatialGrid : new Map(),   // 区块  -> index 对应表
    initBodyTypeArray : function(MAX_BODIES = 1_000_000){  // 根据最多物体数量，初始化
        this.positionsStatus = new Float32Array(MAX_BODIES * 8);  // [x, y, z, qx, qy, qz, qw, status]
        this.identities = new Uint32Array(MAX_BODIES * 4);  // [shapeID, textureID, color, DPZ_and_colliGroup]
        this.physicsProps = new Float32Array(MAX_BODIES * 4);  // [mass, width, height, depth]
        this.freeSlots = new Array(MAX_BODIES).fill(0).map((_, i) => MAX_BODIES - 1 - i); // 一个从大到小排列的空闲索引栈，如 [5,4,3,2,1]
        this.nameToIndexMap = new Map(); // name -> index 的快速查找表
    },

    // 最起初的添加物体，TA 物体
    addTABox : function({
                isPhysical = true,  // 是否被物理计算
                name = 'k'+ this.bodyObjName++,  // 如果没指认，则使用随机数生成 ID
                X = 5, Y = 5, Z = 5,
                quat = {x: 0, y: 0, z: 0, w: 1},
                mass = 0, width = 1, depth = 1, height = 1, size = 1,
            }){
        if(size !== 1){  // 处理体积大小
            width =  depth =  height = size;
        }
        if(isPhysical){  // 如果创建物理体，则将关键参数装载到 typeArray 中
            if (this.freeSlots.length === 0) return;  // 没有空位就退，否则占个位子
            const index = this.freeSlots.pop();
            this.nameToIndexMap.set(name, index);
            const p_offset = index * 8;  //+8 向 TA 传数据的起点，并传入数据
            this.positionsStatus[p_offset] = X;  //+ 这些数据要经常遍历，所以是精选的几个
            this.positionsStatus[p_offset + 1] = Y;
            this.positionsStatus[p_offset + 2] = Z;
            this.positionsStatus[p_offset + 3] = quat.x;
            this.positionsStatus[p_offset + 4] = quat.y;
            this.positionsStatus[p_offset + 5] = quat.z;
            this.positionsStatus[p_offset + 6] = quat.w;
            this.positionsStatus[p_offset + 7] = 1;  // 状态位（0=隐藏, 1=激活）
            this.physicsProps[p_offset] = mass;  //+ 这些不需要经常遍历
            this.physicsProps[p_offset + 1] = width;
            this.physicsProps[p_offset + 2] = height;
            this.physicsProps[p_offset + 3] = depth;
            const gridKey = `${Math.floor(X / 10)}_${Math.floor(Z / 10)}`;  // 计算区块 key
            let indicesInCell = this.spatialGrid.get(gridKey);
            if (!indicesInCell) {
                indicesInCell = []; 
            }
            indicesInCell.push(index);
            this.spatialGrid.set(gridKey, indicesInCell); // 把新数组放回地图
        }

    },

    // 激活 TA 物体
    activeTABox : function(index){
        const p_offset = index * 8;
        const posPara = this.positionsStatus.subarray(p_offset, p_offset + 7);  // 提取位置属性

        if(false){  // 添加物理体
            body = this.acquireBody();  // 从对象池里取对象
            body.mass = mass;
            body.type = mass === 0 ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC;
            body.shapes = [];
            body.addShape(boxShape);
            body.position.set(X, Y, Z);
            body.material = this.cannonDefaultContactMaterial;
            body.updateMassProperties();
            body.wakeUp();
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
        if(true){  // 添加渲染体
            this.W.cube({
                n: 'lab' + index,
                w: 2, d: 3, h: 0.1,
                x: posPara[0], y:posPara[1], z:posPara[2],
                t: marble, s: 0, tile: 1,
                rx: 0, ry: 0, rz: 0, b: '#faa', mix: 0.9,
            });
        }
        
    },

    // 隐藏 TA 物体
    hiddenTABox : function(index){
        this.W.delete('lab' + index);
    },

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

            // 对象池
            body = this.acquireBody();  // 从对象池里取对象
            body.mass = mass;
            body.type = mass === 0 ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC;
            body.shapes = [];
            body.addShape(boxShape);
            body.position.set(X, Y, Z);
            body.material = this.cannonDefaultContactMaterial;
            body.updateMassProperties();
            body.wakeUp();

            

            // body = new CANNON.Body({
            //     mass : mass,
            //     shape: boxShape,
            //     position: new CANNON.Vec3(X, Y, Z),
            //     material: this.cannonDefaultCantactMaterial,
            // });

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

            // /* ---------------------- 实验 ------------------------------ */
            // if (this.freeSlots.length === 0) return;  // 没有空位就退，否则占个位子
            // const index = this.freeSlots.pop();
            // this.nameToIndexMap.set(name, index);  // 暂时用不到，可能是个 API 吧，能用于控制是否渲染
            // const p_offset = index * 8;  //+8 向 TA 传数据的起点，并传入数据
            // this.positionsStatus[p_offset] = X;
            // this.positionsStatus[p_offset + 1] = Y;
            // this.positionsStatus[p_offset + 2] = Z;
            // this.positionsStatus[p_offset + 3] = quat.x;
            // this.positionsStatus[p_offset + 4] = quat.y;
            // this.positionsStatus[p_offset + 5] = quat.z;
            // this.positionsStatus[p_offset + 6] = quat.w;
            // this.positionsStatus[p_offset + 7] = 1;  // 状态位（0=隐藏, 1=激活, 2=待移除）
            // const gridKey = `${Math.floor(X / 10)}_${Math.floor(Z / 10)}`;  // 计算区块 key
            // let indicesInCell = this.spatialGrid.get(gridKey);
            // if (!indicesInCell) {
            //     indicesInCell = []; 
            // }
            // indicesInCell.push(index);
            // this.spatialGrid.set(gridKey, indicesInCell); // 把新数组放回地图
            // /* ----------------------------------------------------------- */
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