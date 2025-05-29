/**
 * 纹理设置相关
 */
export default {

    // 一个异步函数，用于加载纹理
    loadTexture : function(drawFunclist) {
        return new Promise(resolve => {
            for(var i = 0; i < drawFunclist.length; i++){
                const img = new Image();
                img.onload = () => resolve(img);  // 或许可以直接传入 wjs，以后优化吧
                img.id = drawFunclist[i].id;
                img.src = this.dToBase64(drawFunclist[i]);
                window[img.id] = img;
            }
        });
    },

    // 给定 canvas 绘制程序，可以绘制纹理并返回 base64
    dToBase64 : function(drawItem) {  // 【之后优化】复用同一个 canvas 元素（清空并重绘），可以避免频繁创建和销毁 canvas 元素。
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 400;
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawItem.func(ctx, canvas.width, canvas.height);
        if(drawItem.type === 'png'){  // 为透明化作铺垫
            return canvas.toDataURL('image/png');
        } else {
            var quality = drawItem.quality || 0.7;
            return canvas.toDataURL('image/jpeg', quality);
        }
    },
};