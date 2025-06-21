/**
 * 中心点插件
 * ========
 * 可以在屏幕中显示中心点儿，以颜色法，选中物体（最多支持 16777215 个物体）
 */

// 插件入口
export default function(ccgxkObj) {
    const W = ccgxkObj.W;
    W.tempColor = new Uint8Array(4);  // 临时储存颜色，供本插件使用
    const canvas = document.getElementById('centerPoint');  // 画板
    W.makeFBO = () => {
        W.pickingFBO = W.gl.createFramebuffer();
        W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, W.pickingFBO);
        W.pickingTexture = W.gl.createTexture();  //+4 为FBO创建纹理附件（相当于排练室的“幕布”）
        W.gl.bindTexture(W.gl.TEXTURE_2D, W.pickingTexture);
        W.gl.texImage2D(W.gl.TEXTURE_2D, 0, W.gl.RGBA, W.canvas.width, W.canvas.height, 0, W.gl.RGBA, W.gl.UNSIGNED_BYTE, null);
        W.gl.framebufferTexture2D(W.gl.FRAMEBUFFER, W.gl.COLOR_ATTACHMENT0, W.gl.TEXTURE_2D, W.pickingTexture, 0);
        W.pickingRenderbuffer = W.gl.createRenderbuffer();  //+4 为FBO创建深度附件（相当于排练室的“地板”，保证3D效果正确）
        W.gl.bindRenderbuffer(W.gl.RENDERBUFFER, W.pickingRenderbuffer);
        W.gl.renderbufferStorage(W.gl.RENDERBUFFER, W.gl.DEPTH_COMPONENT16, W.canvas.width, W.canvas.height);
        W.gl.framebufferRenderbuffer(W.gl.FRAMEBUFFER, W.gl.DEPTH_ATTACHMENT, W.gl.RENDERBUFFER, W.pickingRenderbuffer);
        if (W.gl.checkFramebufferStatus(W.gl.FRAMEBUFFER) !== W.gl.FRAMEBUFFER_COMPLETE) {  //+3 检查FBO是否创建成功
            console.error("秘密排练室（FBO）创建失败！");
        } else { W.makeFBOSucess = true; }
        W.whiteTexture = W.gl.createTexture();  //+3 创建一个纯白图片，用于阴影贴图使用
        W.gl.bindTexture(W.gl.TEXTURE_2D, W.whiteTexture);
        W.gl.texImage2D(W.gl.TEXTURE_2D, 0, W.gl.RGBA, 1, 1, 0, W.gl.RGBA, W.gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
        W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, null);  // 解绑，让绘制回到主舞台
    }
    W.getColorPickObj = () => {  // 获取屏幕中心物体颜色值
        const player = W.next['mainPlayer'];
        if (!player) return;
        W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, W.pickingFBO);  // 切换到 FBO 里
        W.gl.clearColor(0.0, 0.0, 0.0, 1.0); // 黑背景
        W.gl.clear(W.gl.COLOR_BUFFER_BIT | W.gl.DEPTH_BUFFER_BIT); // 清空排练室
        for (const index of ccgxkObj.currentlyActiveIndices) {
            const obj = W.next['T' + index];
            if (!obj) continue;
            var obj_proxy = {...obj};  // 创建代理，想办法将代理显示成纯色
            obj_proxy.b = index.toString(16).padStart(6, '0');
            obj_proxy.ns = 1;
            obj_proxy.mix = 1;
            W.gl.activeTexture(W.gl.TEXTURE0);
            W.gl.bindTexture(W.gl.TEXTURE_2D, null);  // 清空纹理贴图
            W.gl.activeTexture(W.gl.TEXTURE0 + 3);
            W.gl.bindTexture(W.gl.TEXTURE_2D, W.whiteTexture);  // 使用 纯白 贴图代替阴影深度图（以便清除阴影）
            W.render(obj_proxy, 0);
        }
        var player_proxy = {...player};  // 创建代理，想办法将代理显示成纯色
        player_proxy.b = '#f00';
        player_proxy.ns = 1;
        player_proxy.mix = 1;
        W.gl.activeTexture(W.gl.TEXTURE0);
        W.gl.bindTexture(W.gl.TEXTURE_2D, null);  // 清空纹理贴图
        W.gl.activeTexture(W.gl.TEXTURE0 + 3);
        W.gl.bindTexture(W.gl.TEXTURE_2D, W.whiteTexture);  // 使用 纯白 贴图代替阴影深度图（以便清除阴影）
        W.render(player_proxy, 0);
        const pixels = new Uint8Array(4);  // 取点
        W.gl.readPixels(W.gl.canvas.width / 2, W.gl.canvas.height / 2, 1, 1, W.gl.RGBA, W.gl.UNSIGNED_BYTE, pixels);
        W.gl.bindFramebuffer(W.gl.FRAMEBUFFER, null);
        W.clearColor(ccgxkObj.colorClear); // 恢复主画布的背景色
        W.tempColor = pixels;
    }
    ccgxkObj.hooks.on('pointer_lock_click', function(obj, e){
        if(ccgxkObj.centerPointColorUpdatax || e.button === 2){  
            if(ccgxkObj.hotPoint && e.button !== 2) {  // 如果有热点，单击热点后
                hotAction(ccgxkObj);
            } else {
                drawCenterPoint(canvas, ccgxkObj, true);
                clearInterval(ccgxkObj.centerPointColorUpdatax);
                ccgxkObj.centerPointColorUpdatax = null;  // 避免重复清除
                ccgxkObj.mainCamera.pos = {x: 0, y: 2, z: 4};
            }
        } else {  // 开启小点
            if(W.makeFBOSucess !== true){ W.makeFBO() }
            drawCenterPoint(canvas, ccgxkObj);
            ccgxkObj.centerPointColorUpdatax = setInterval(() => { drawCenterPoint(canvas, ccgxkObj) }, 500);
            ccgxkObj.mainCamera.pos = {x:0, y:0.5, z:0};
        }
    });
}

// 绘制屏幕中心的点
function drawCenterPoint(canvas, thisObj, isClear){
    if(isClear) { canvas.width = 0; canvas.height = 0; return; }  // 清空
    if(canvas.width === 0 || canvas.width === 1){
        canvas.width = 20;
        canvas.height = 20;
    }
    const ctx = canvas.getContext('2d');
    thisObj.W.getColorPickObj();  // 拾取颜色一次
    const colorArray = thisObj.W.tempColor || [255, 0, 0, 255];  //+2 获取当前颜色值并转化
    const color = `rgba(${255 - colorArray[0]}, ${255 - colorArray[1]}, ${255 - colorArray[2]}, ${colorArray[3]/255})`;
    const objIndex = colorArray[0] * 256 ** 2 + colorArray[1] * 256 + colorArray[2];  // 根据颜色获取到了对应的 index 值
    document.getElementById('xStopDY').innerHTML = objIndex;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(objIndex !== 0){
        thisObj.hotPoint = objIndex;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.arc(
            canvas.width / 2,
            canvas.height / 2,
            9,                
            0,                
            Math.PI * 2       
        );
        ctx.lineWidth = 2;
        ctx.stroke(); 
    } else if (thisObj.hotPoint) {
        thisObj.hotPoint = false;
    }
    ctx.beginPath();
    ctx.arc(  
        canvas.width / 2,
        canvas.height / 2,
        5,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = color;
    ctx.fill();  // 绘制圆点
}

// 单击热点后的事件
function hotAction(thisObj){
    console.log(thisObj.hotPoint);
    modTextDemo(thisObj.hotPoint, '狗太憨了，肉都气刀！！！',thisObj);
}

// 一个修改文字的 DEMO
function modTextDemo(indexID, content = '狗精，肉不正经！！', thisObj) {
    if(thisObj.indexToArgs.get(indexID).forObjID === false){ return 0 }
    const forObjID = thisObj.indexToArgs.get(indexID).forObjID;
    thisObj.initTextData.set(forObjID, content);
    thisObj.textureMap.delete(forObjID);
    window[forObjID] = undefined;
    thisObj.W.cube({
        n: forObjID,
        t: thisObj.textureMap.get(forObjID),
    });
    thisObj.currentlyActiveIndices.delete(indexID)
}