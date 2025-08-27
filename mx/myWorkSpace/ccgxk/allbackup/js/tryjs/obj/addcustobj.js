/**
 * (实验中)添加自定义的物体
 */
export default {

    // 将顶点数据转化成 cannon.js 可用的格式
    returnVec3Data : function(verticesData, indicesData){
        const vertices = [];
        for (let i = 0; i < verticesData.length; i += 3) {
            vertices.push(new CANNON.Vec3(verticesData[i], verticesData[i + 1], verticesData[i + 2]));
        }
        const faces = [];
        for (let i = 0; i < indicesData.length; i += 3) {
            faces.push([indicesData[i], indicesData[i + 1], indicesData[i + 2]]);
        }
        const convexPolyhedron = new CANNON.ConvexPolyhedron(vertices, faces);
        return convexPolyhedron;
    },

    // 添加自定义顶点数据的物体（临近作废）
    addCustomDataObj : function({ 
                name = 'custom'+(Math.random()*10**9|0),  // 如果没指认，则使用随机数生成 ID
                modelName = null,  // 模型名
                X = 5, Y = 5, Z = 5,
                mass = 0, size = 1,
                verticesData = [], indicesData = [],
                texture = null, smooth = 0,  // 因为 W.js 版本问题， smooth 暂时为 0
                background = '#888', mixValue = 0.71, rX = 0, rY = 0, rZ = 0 } = {}){
        if(verticesData.length === 0 || indicesData.length === 0){ console.error('没有添加模型数据！');return; }
        const myshape = this.returnVec3Data(verticesData.map(v => v * size), indicesData);
        const tempBody = new CANNON.Body({
            mass: mass,
            shape: myshape,
            position: new CANNON.Vec3(X, Y, Z),
            material: this.cannonDefaultCantactMaterial,
        });
        this.world.addBody(tempBody);
        modelName = modelName || name;  // 指认了模型名，就使用模型
        if(W.modelName === undefined) {
            W.add(modelName, {  // W 引擎引入模型数据
                vertices: verticesData,
                indices: indicesData,
            });
        }
        W[modelName]({n:name,size: size, x:X, z:Z, y:Y});
        var result = {name: name, body: tempBody, rX: 0, rY: 0, rZ: 0};
        this.bodylist.push(result);  // 向 CCGXK 项目内追加
    },

}