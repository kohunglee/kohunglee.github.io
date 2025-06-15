/**
 * 动画进程相关
 */
export default {
    // 按照列表将 物理体 逐个 物理计算可视化 更新
    updataBodylist : function(){
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
            var dynaNodesCon = _this.dynaNodes();  // 一秒显示一次主角位置编码
            _this.mainVPlayerMove(_this.mainVPlayer); // 摄像机和主角的移动和旋转
            requestAnimationFrame(viewAnimate);
        }
        viewAnimate();
    },
}