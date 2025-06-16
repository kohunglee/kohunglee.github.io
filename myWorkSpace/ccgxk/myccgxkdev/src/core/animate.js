/**
 * 动画进程相关
 */
export default {
    // 按照列表将 物理体 逐个 物理计算可视化 更新
    gridKeyCurrentTime : 0,  // 辅助计算 gridKey 的时间值
    updataBodylist : function(){
        this.dynaNodes_lab();  // 一帧计算区块一次

        for (let i = 0; i < this.bodylist.length; i++) {
            let indexItem = this.bodylist[i];
            if(indexItem.body !== null){
                let pos = indexItem.body.position;
                const dx = pos.x - indexItem.X;
                const dy = pos.y - indexItem.Y;
                var disten = Math.sqrt(dx*dx + dy*dy);  // 计算与自身上次的距离（必须大于 某个值 才能被可视化）

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
                (indexItem.isVisualMode && this.W.next[indexItem.name] && disten > 0.00001)  // 运动幅度大于这个值，才更新
                ||
                indexItem.name === 'mainPlayer'
            ){
                this.W.move({
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

        var gridKeyCurrentTime = 0;
        /* -----------------------------[ 实验 ]--------------------------------------- */
        for (const index of this.currentlyActiveIndices) {  // 暂时选择遍历吧，反正也显示不了几个，也兼容后续的 mass 改变
            const p_offset = index * 8;
            if(this.positionsStatus[p_offset + 7] > 0){  // 选择 状态码/mass 大于 0 的物体
                const gridKey_orige = `${Math.floor(this.positionsStatus[p_offset] / this.gridsize)}_${Math.floor(this.positionsStatus[p_offset + 2] / this.gridsize)}`;
                const indexItem = this.indexToArgs.get(index);
                const canBody = indexItem.cannonBody;
                const disxX = canBody.position.x - this.positionsStatus[p_offset];
                const disyY = canBody.position.y - this.positionsStatus[p_offset + 1];
                const diszZ = canBody.position.z - this.positionsStatus[p_offset + 2];
                const disten = Math.sqrt(disxX*disxX + disyY*disyY + diszZ*diszZ);  // 计算与自身上次的距离（必须大于 某个值 才能被可视化）
                this.positionsStatus[p_offset] = canBody.position.x;  //+7 位置储存到变量里
                this.positionsStatus[p_offset + 1] = canBody.position.y;
                this.positionsStatus[p_offset + 2] = canBody.position.z;
                this.positionsStatus[p_offset + 3] = canBody.quaternion.x;
                this.positionsStatus[p_offset + 4] = canBody.quaternion.y;
                this.positionsStatus[p_offset + 5] = canBody.quaternion.z;
                this.positionsStatus[p_offset + 6] = canBody.quaternion.w;
                if(indexItem.isVisualMode !== false && this.W.next['T' + index] && disten > 0.0001){  // 可视化
                    const eulerQuat = this.quaternionToEuler(canBody.quaternion);
                    this.W.move({
                        n: 'T' + index,
                        x: this.positionsStatus[p_offset],
                        y: this.positionsStatus[p_offset + 1],
                        z: this.positionsStatus[p_offset + 2],
                        rx: eulerQuat.rX,
                        ry: eulerQuat.rY,
                        rz: eulerQuat.rZ,
                    });
                    if(disten > 0.01 && (performance.now() - this.gridKeyCurrentTime > 500)){  // 略大一点的距离更改，500ms 间隔以上，计算区块 key，更新表
                        const orginGridKey = indexItem.gridkey || 0;
                        const currentGridKey = `${Math.floor(this.positionsStatus[p_offset] / this.gridsize)}_${Math.floor(this.positionsStatus[p_offset + 2] / this.gridsize)}`;
                        if(orginGridKey) {
                            if(currentGridKey !== orginGridKey){
                                var indicesInCell_orige = this.spatialGrid.get(orginGridKey);  //+8 删去已失效的 key
                                if(indicesInCell_orige){
                                    const indexInCell = indicesInCell_orige.indexOf(index);
                                    if(indexInCell > -1){
                                        indicesInCell_orige.splice(indexInCell, 1);
                                        this.spatialGrid.set(orginGridKey, indicesInCell_orige);
                                    }
                                }
                                var indicesInCell = this.spatialGrid.get(currentGridKey);  //+4 添加新的 key
                                if (!indicesInCell) { indicesInCell = [] }
                                indicesInCell.push(index);
                                this.spatialGrid.set(currentGridKey, indicesInCell);
                            }
                        }
                        indexItem.gridkey = currentGridKey;
                        this.gridKeyCurrentTime = performance.now();
                    }
                }
            }
        }
        /* ---------------------------------------------------------------------- */

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
            fpsInfo.textContent = ('FPS：' + fps.toFixed(1) + '  ，渲染：' + this.W.drawTime );  // 一秒显示一次 FPS
            modListCount.textContent = ('当前模型数：' + this.bodylist.length +
                                        ' - ❀' + this.bodylistNotPys.length +
                                        ' - 口' + this.bodylistMass0.length +
                                        ' - ⚠️' +this.hiddenBodylist.length +
                                        ' - ⚡️ ' +this.currentlyActiveIndices.size +
                                                        ' |');  // 一秒显示一次模型数
            this.dynaNodes_lab();  // 一秒计算区块一次
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