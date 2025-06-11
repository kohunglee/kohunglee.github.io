/**
 * 一些工具函数、杂项
 */
export default {
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

    // 给定种子，生成伪随机数（数组），genPseudoRandoms
    genPR : function (seed, count){
        let x = Math.abs(seed) || 1;
        x = (x * 1664525 + 1013904223) | 0;
        const result = new Float32Array(count);
        const invMaxUInt32 = 1.0 / 4294967296.0;
        for (let i = 0; i < count; i++) {
            x ^= x << 13;
            x ^= x >> 17;
            x ^= x << 5;
            result[i] = (x >>> 0) * invMaxUInt32;
        }
        return result;
    },

    // 默认 cannon js 材质关联材质
    cannonDefaultCantactMaterial : new CANNON.ContactMaterial( // 默认材质关联材质
        new CANNON.Material(),
        new CANNON.Material(), {
            friction: 0.1, // 摩擦力
            restitution: 0.1, // 弹性系数
    }),

    // JS 钩子机制，用于扩展功能
    ccgxkhooks : {
        _hookQueues: new Map(), // 任务队列

        // 注册事件
        on(hookName, callbackFunction, priority = 100) {
            if (typeof callbackFunction !== 'function') throw new TypeError('Callback must be function');
            const queue = this._hookQueues.get(hookName) || [];
            queue.push({ func: callbackFunction, priority: priority });
            queue._isSorted = false;  //+1 标记队列为未排序，并加入【任务列表】
            this._hookQueues.set(hookName, queue);
        },

        // 注销事件
        off(hookName, callbackFunction) {
            const queue = this._hookQueues.get(hookName); if (!queue) return;
            const filteredQueue = queue.filter(item => item.func !== callbackFunction);  // 删掉指定任务
            if (filteredQueue.length === 0) this._hookQueues.delete(hookName); // 如果队列为空，直接删除这个 hookName，释放内存
            else if (filteredQueue.length < queue.length) { filteredQueue._isSorted = false; this._hookQueues.set(hookName, filteredQueue); } // 更新队列，标记为未排序
        },

        // 排序
        _getSortedCallbacks(hookName) {
            let queue = this._hookQueues.get(hookName); if (!queue) return [];
            if (!queue._isSorted) { queue.sort((a, b) => b.priority - a.priority); queue._isSorted = true; } // 排序后，标记为已排序（只排序一次）
            return [...queue];
        },

        // 异步触发
        async emit(hookName, ...args) {
            const callbacks = this._getSortedCallbacks(hookName).map(item => item.func);
            const promises = callbacks.map(async callback => { // 为每个“监听者”创建一个异步执行的Promise
                try { return await callback(...args); } catch (errorReason) {
                    console.error(`[Async]Hook ${hookName} error:`, errorReason);
                    throw errorReason; 
                } });
            return Promise.allSettled(promises);
        },

        // 同步触发
        emitSync(hookName, ...args) {
            const results = []; // 用于收集执行结果
            for (const { func } of this._getSortedCallbacks(hookName)) {
                try {
                    const returnValue = func(...args);
                    results.push({ status: 'fulfilled', value: returnValue });
                    if (returnValue === false) break;  // 返回假，中断
                }
                catch (errorReason) {
                    console.error(`[Sync]Hook ${hookName} error:`, errorReason);
                    results.push({ status: 'rejected', reason: errorReason }); 
                }
            }
            return results;
        },
    },
    
};