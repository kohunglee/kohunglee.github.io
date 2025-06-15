/**
 * 动态区块管理
 * 
 * 将地图世界分区，以及 4 个优先级，动态加载和卸载模型
 */
export default {

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
                    this.releaseBody(indexItem.body);  // 对象池，回收该对象
                }
                this.W.delete(name);  // 删除可视化物体
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
        if(foo === 0){ return 0 }
        var dirctionA = (Math.sign(x) === -1) ? 'X' : 'D';
        var dirctionB = (Math.sign(z) === -1) ? 'B' : 'N';
        var numberA = Math.ceil(x / foo * Math.sign(x));
        var numberB = Math.ceil(z / foo * Math.sign(z));
        return zindex + dirctionA + numberA + dirctionB + numberB;
    },

    // 不同的 DPZ 优先级，它的探测距离
    distanceDPZ: [
                    { level: 2, len: 450 },
                    { level: 3, len: 45 },
                    { level: 4, len: 15 }
                ],

    // 根据主角的位置简码，动态增删物体
    dynaLock : false,  // 动态增删锁
    stopDynaNodes : false,  // 临时停止 dynaNodes 键
    dynaNodes : function(){
        if(this.mainVPlayer === null || this.stopDynaNodes) {return ''};
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
            this.distanceDPZ.forEach(({ level, len }) => {
                const posID = this.calPosID(mVP.X + offset.x * len, mVP.Y + offset.y * len, mVP.Z + offset.z * len, level);
                if (!this.legalPosID.includes(posID)) {
                    this.legalPosID.push(posID);
                }
            });
        });
        const removeIllegalBodies = (bodyArrList, isphysical = false) => {  // 删除函数，根据编码库，删除对应列表中的对象
            for (let i = bodyArrList.length - 1; i >= 0; i--) {  // 从后向前遍历，避免splice影响索引
                let indexItem = bodyArrList[i];
                if (!this.legalPosID.includes(indexItem.posID) && indexItem.DPZ !== 1) {
                    this.removeBody(indexItem.name, bodyArrList, isphysical);
                }
            }
        };
        removeIllegalBodies(this.bodylist, true);  // 检测增删 普通模型
        removeIllegalBodies(this.bodylistNotPys);  // .. 纯模型
        removeIllegalBodies(this.bodylistMass0, true); // .. 无质量物体
        for (let i = 0; i < this.hiddenBodylist.length; i++) {  // 恢复已经合法的隐藏物体
            let indexItem = this.hiddenBodylist[i];
            if(this.legalPosID.includes(indexItem.posID)){
                var myargs = indexItem.myargs[0];
                if(indexItem.X){
                    myargs.X = indexItem.X;
                    myargs.Y = indexItem.Y;
                    myargs.Z = indexItem.Z;
                    myargs.quat = indexItem.quat;
                    myargs.cannonBody = indexItem.body;
                }
                this.addBox(myargs);
                this.hiddenBodylist.splice(i, 1);
            }
        }
        this.dynaLock = false;
        return mainVPPosID;
    },


    // -------------------------【 实验 】-----------------------------
    // 新的 dynaNodes
    gridsize : 20,  // 单个区块大小
    currentlyActiveIndices : new Set(),  // 当前激活状态的物体。也可保存本次的激活物体列表，供下一次使用
    dynaNodes_lab : function(){
        if(this.mainVPlayer === null || this.stopDynaNodes) {return ''};
        var mVP = this.mainVPlayer;
        const playerGridX = Math.floor(mVP.X / this.gridsize);  //+8 计算主角周围 9 个格子的区块
        const playerGridZ = Math.floor(mVP.Z / this.gridsize);
        const activeGridKeys = [];  // 装 9 个格子的区块号
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                activeGridKeys.push(`${playerGridX + i}_${playerGridZ + j}`);
            }
        }
        const newActiveIndices = new Set();  // 待做出隐藏动作的物体的 index 列表
        const indicesToHide = new Set(this.currentlyActiveIndices);  // 待做出隐藏动作的物体的 index 列表
        for(const key of activeGridKeys){
            const indicesInGrid = this.spatialGrid.get(key);  // 取物体使用（spatialGrid，战地成员列表）
            if (indicesInGrid) {
                for (const index of indicesInGrid) {
                    newActiveIndices.add(index);
                }
            }
        }
        for (const index of newActiveIndices) {  // 剔除本次还应该是激活状态的
            indicesToHide.delete(index);
        }
        for (const index of newActiveIndices) {  // 执行激活动作
            if(!this.currentlyActiveIndices.has(index)){  // 上次被激活过，这次就不激活了
                const p_offset = index * 8;
                this.positionsStatus[p_offset + 7] = 1;
                this.activeTABox(index);
            }
        }
        for(const index of indicesToHide){  // 执行隐藏动作
            const p_offset = index * 8;
            this.positionsStatus[p_offset + 7] = 0;
            this.hiddenTABox(index);
        }
        this.currentlyActiveIndices = newActiveIndices;
    },

}