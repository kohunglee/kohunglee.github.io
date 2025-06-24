/**
 * 中心点插件
 * ========
 * 可以在屏幕中显示中心点儿，以颜色法，选中物体（最多支持 16777215 个物体）
 */

const globalVar = {};  // 用于指向 ccgxkObj

// 插件入口
export default function(ccgxkObj) {
    globalVar.ccgxkObj = ccgxkObj;
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
    ccgxkObj.isWarningRecovery = false;
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
    // console.log(thisObj.hotPoint);
    globalVar.indexHotCurr = thisObj.hotPoint + 0;  // 将 index 数字定格，防止被更改
    unlockPointer();  // 解锁鼠标
    myHUDModal.hidden = false;  // 显示模态框
    const textureEditorTG = document.getElementById('textureEditorTG');
    const textureEditorOffsetX = document.getElementById('textureEditorOffsetX');
    const textureEditorOffsetY = document.getElementById('textureEditorOffsetY');
    if(thisObj.currTextData.size === 0 && localStorage.getItem('TGTOOL-backup') !== null){
        const warnInfo = '浏览器里有上次的备份存档，推荐您【从浏览器恢复】！（数据无价）';
        document.getElementById('textureEditorInfo').innerText = warnInfo;
        textureEditorTG.placeholder = warnInfo;
    }
    textureEditorTG.value = thisObj.currTextData.get('T' + globalVar.indexHotCurr)?.content || '';  //+3 填充编辑框
    textureEditorOffsetX.value = thisObj.currTextData.get('T' + globalVar.indexHotCurr)?.offsetX || 0;
    textureEditorOffsetY.value = thisObj.currTextData.get('T' + globalVar.indexHotCurr)?.offsetY || 0;
}

// 用户操作完，然后单击 确认（写入） 按钮后
document.getElementById('textureEditorSave').addEventListener('click', function(){
    myHUDModal.hidden = true;  // 隐藏模态框
    lockPointer();  // 锁定鼠标
    const textureEditorTG = document.getElementById('textureEditorTG');
    const textureEditorOffsetX = document.getElementById('textureEditorOffsetX');
    const textureEditorOffsetY = document.getElementById('textureEditorOffsetY');
    const canvas = document.getElementById('centerPoint');  // 画板
    const modValue = {
        content: textureEditorTG.value,
        offsetX: Number(textureEditorOffsetX.value),
        offsetY: Number(textureEditorOffsetY.value),
    }
    modTextDemo(globalVar.indexHotCurr, modValue, globalVar.ccgxkObj);  // 修改文字
    textureEditorTG.value = '';  // 清空编辑框
    textureEditorOffsetX.value = 0;
    textureEditorOffsetY.value = 0;
    textureEditorTG.placeholder = '';
    document.getElementById('textureEditorInfo').innerText = '';
    globalVar.indexHotCurr = -1;
    drawCenterPoint(canvas, globalVar.ccgxkObj, true);  //+4 关闭小点
    clearInterval(globalVar.ccgxkObj.centerPointColorUpdatax);
    globalVar.ccgxkObj.centerPointColorUpdatax = null;
    globalVar.ccgxkObj.mainCamera.pos = {x: 0, y: 2, z: 4};
    const bookAsArray = [...globalVar.ccgxkObj.currTextData.entries()];  //+ 写入到浏览器的 localStorage 里
    const jsonScroll = JSON.stringify(bookAsArray, null, 2);
    localStorage.setItem('TGTOOL-backup', jsonScroll);
})

// 单击 CANCEL (取消)按钮后
document.getElementById('textureEditorCancel').addEventListener('click', function(){
    myHUDModal.hidden = true;  // 隐藏模态框
    lockPointer();  // 锁定鼠标
    const textureEditorTG = document.getElementById('textureEditorTG');
    const canvas = document.getElementById('centerPoint');
    textureEditorTG.value = '';  // 清空编辑框
    textureEditorOffsetX.value = 0;
    textureEditorOffsetY.value = 0;
    globalVar.indexHotCurr = -1;
    drawCenterPoint(canvas, globalVar.ccgxkObj, true);  //+4 关闭小点
    clearInterval(globalVar.ccgxkObj.centerPointColorUpdatax);
    globalVar.ccgxkObj.centerPointColorUpdatax = null;
    globalVar.ccgxkObj.mainCamera.pos = {x: 0, y: 2, z: 4};

});

// 单击 下载存档 按钮后
document.getElementById('textureEditorDownload').addEventListener('click', function(){
    // console.log('下载存档');
    const bookAsArray = [...globalVar.ccgxkObj.currTextData.entries()];
    const jsonScroll = JSON.stringify(bookAsArray, null, 2);
    const blob = new Blob([jsonScroll], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TGTool-backup-${new Date(Date.now()).toLocaleString('sv-SE').replace(/[-:T\s]/g, '')}.json`; // 给卷轴起个带时间戳的名字
    link.click();
    URL.revokeObjectURL(url); // 释放这个临时URL
});

// 单击 读取存档 按钮后
document.getElementById('textureEditorReadfile').addEventListener('change', function(event){
    // console.log('读取存档');
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const bookAsArray = JSON.parse(e.target.result);
            if (Array.isArray(bookAsArray)) {
                globalVar.ccgxkObj.currTextData = new Map(bookAsArray);
                // console.log(globalVar.ccgxkObj.currTextData);
                for (const item of globalVar.ccgxkObj.currTextData) {  // 改变所有已有数据的 Obj 的 texture 属性
                    // console.log(item[0]);
                    // console.log(item[0].substring(1));
                    globalVar.ccgxkObj.indexToArgs.get(Number(item[0].substring(1))).texture = item[0];
                }
                for (const item of globalVar.ccgxkObj.currentlyActiveIndices) {  // 遍历当前激活物体的 set 集合
                    const indexID = 'T' + item;  // 前面加上 'T'
                    if(globalVar.ccgxkObj.currTextData.has(indexID)){
                        globalVar.ccgxkObj.currentlyActiveIndices.delete(item);  // 让 dynaNodes 重新添加一次当前显示的物体
                        // console.log('更新' + indexID);
                    }
                }
                myHUDModal.hidden = true;  // 隐藏模态框
                lockPointer();  // 锁定鼠标
                const textureEditorTG = document.getElementById('textureEditorTG');
                textureEditorTG.value = '';  // 清空编辑框
                textureEditorOffsetX.value = 0;
                textureEditorOffsetY.value = 0;
                globalVar.indexHotCurr = -1;
                alert('读取完成！');
            } else {
                throw new Error('卷轴格式不正确。');
            }
        } catch (error) {
            alert('研读失败！这可能是一份损坏或格式错误的卷轴。\n' + error.message);
        }
    };
    reader.readAsText(file); // “阅读精灵”开始逐字阅读卷轴内容
    event.target.value = ''; // 清空选择，以便下次能上传同一个文件
});

// 从浏览器的 localStorage 里读取备份
document.getElementById('textureEditorRcover').addEventListener('click', function(){
    // console.log('从浏览器的 localStorage 里读取备份');
    const jsonScroll = localStorage.getItem('TGTOOL-backup');
    if (jsonScroll) {
        try {
            const bookAsArray = JSON.parse(jsonScroll);
            if (Array.isArray(bookAsArray)) {
                globalVar.ccgxkObj.currTextData = new Map(bookAsArray);
                // console.log(globalVar.ccgxkObj.currTextData);
                for (const item of globalVar.ccgxkObj.currTextData) {  // 改变所有已有数据的 Obj 的 texture 属性
                    // console.log(item[0]);
                    // console.log(item[0].substring(1));
                    globalVar.ccgxkObj.indexToArgs.get(Number(item[0].substring(1))).texture = item[0];
                }
                for (const item of globalVar.ccgxkObj.currentlyActiveIndices) {  // 遍历当前激活物体的 set 集合
                    const indexID = 'T' + item;  // 前面加上 'T'
                    if(globalVar.ccgxkObj.currTextData.has(indexID)){
                        globalVar.ccgxkObj.currentlyActiveIndices.delete(item);  // 让 dynaNodes 重新添加一次当前显示的物体
                        // console.log('更新' + indexID);
                    }
                }
                myHUDModal.hidden = true;  // 隐藏模态框
                lockPointer();  // 锁定鼠标
                const textureEditorTG = document.getElementById('textureEditorTG');
                textureEditorTG.value = '';  // 清空编辑框
                textureEditorOffsetX.value = 0;
                textureEditorOffsetY.value = 0;
                globalVar.indexHotCurr = -1;
                document.getElementById('textureEditorInfo').innerText = '';
                alert('恢复完成！');
                textureEditorTG.placeholder = '';
            }
        } catch (error) {
            alert('研读失败！这可能是一份损坏或格式错误的卷轴。\n' + error.message);
        }
    }
});

// 一个修改文字的 DEMO
function modTextDemo(indexID, value = {}, thisObj) {  // 待优雅化
    const nID = 'T' + indexID;

    if(!thisObj?.indexToArgs?.get(indexID)?.TGtoolText){ return 0 }  // 判断是否可编辑纹理

    thisObj.currTextData.set(nID, {
        content: value?.content || '',
        offsetX: value?.offsetX || 0,
        offsetY: value?.offsetY || 0,
    });  // 重新设置文本内容

    thisObj.textureMap.delete(nID);  // 删除纹理库里的该纹理（可能没用？？）
    window[nID] = undefined;  // 顺便删一下全局的该纹理
    thisObj.W.plane({
        n: 'T' + indexID,
        t: nID,
    });
    thisObj.indexToArgs.get(indexID).texture = nID;  // Obj 的 texture 属性重置
    thisObj.currentlyActiveIndices.delete(indexID);  // 让 dynaNodes 重新添加一次
}

// 解锁鼠标
function unlockPointer() {
  if ('pointerLockElement' in document || 
      'mozPointerLockElement' in document || 
      'webkitPointerLockElement' in document) {
    const exitLock = document.exitPointerLock || 
                    document.mozExitPointerLock || 
                    document.webkitExitPointerLock;
    if (exitLock) {
      exitLock.call(document);
    }
  }
}

// 锁定鼠标
function lockPointer(){
    const canvas = document.getElementById('c');
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
    canvas.requestPointerLock();
}