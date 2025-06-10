// Sun, 01 Jun 2025 14:15:29 GMT

/*
 * 版权（C）2015 Cannon.js作者
 *
 * 特此免费获得任何人的许可
 * 获取此软件和相关文档的副本
 * 文件（“软件”），不得处理软件
 * 限制，包括不限制使用的权利，复制，
 * 修改，合并，发布，分发，分散和/或出售副本
 * 该软件的内容，并允许该软件的人
 * 符合以下条件的规定，可以这样做：
 *
 * 上述版权通知和此许可通知应为
 * 包含在软件的所有副本或大量部分中。
 *
 * 该软件是“原样”提供的，没有任何形式的保证，
 * 明示或暗示，包括但不限于
 * 适销性，适合特定目的的适合性和
 * 非侵扰。在任何情况下，作者或版权持有人都不会
 * 无论在诉讼中，是否应对任何索赔，损害赔偿或其他责任负责
 * 由合同，侵权或以其他方式出于侵权或其他方式。
 * 使用软件或软件中的使用或其他交易。
 */

!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&false)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.CANNON=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
    module.exports={
      "name": "cannon",
      "version": "0.6.2",
      "description": "A lightweight 3D physics engine written in JavaScript.",
      "homepage": "https://github.com/schteppe/cannon.js",
      "author": "Stefan Hedman <schteppe@gmail.com> (http://steffe.se)",
      "keywords": [
        "cannon.js",
        "cannon",
        "physics",
        "engine",
        "3d"
      ],
      "main": "./src/Cannon.js",
      "engines": {
        "node": "*"
      },
      "repository": {
        "type": "git",
        "url": "https://github.com/schteppe/cannon.js.git"
      },
      "bugs": {
        "url": "https://github.com/schteppe/cannon.js/issues"
      },
      "licenses": [
        {
          "type": "MIT"
        }
      ],
      "devDependencies": {
        "jshint": "latest",
        "uglify-js": "latest",
        "nodeunit": "^0.9.0",
        "grunt": "~0.4.0",
        "grunt-contrib-jshint": "~0.1.1",
        "grunt-contrib-nodeunit": "^0.4.1",
        "grunt-contrib-concat": "~0.1.3",
        "grunt-contrib-uglify": "^0.5.1",
        "grunt-browserify": "^2.1.4",
        "grunt-contrib-yuidoc": "^0.5.2",
        "browserify": "*"
      },
      "dependencies": {}
    }
    
    },{}],2:[function(_dereq_,module,exports){
    // 导出类
    module.exports = {
        version :                       _dereq_('../package.json').version,

        SAPBroadphase :                 _dereq_('./collision/SAPBroadphase'), // “SAP高效筛选器”：用更聪明的算法（Sweep and Prune）快速排除碰撞。
        Body :                          _dereq_('./objects/Body'), // "Physical Body": the basis of all objects that can move, collide, and be subject to stress.

    
        Box :                           _dereq_('./shapes/Box'), // "Box Shape": Simulate a cube.
        Sphere :                        _dereq_('./shapes/Sphere'), // "Sphere Shape": Simulate a sphere.
        
        ContactMaterial :               _dereq_('./material/ContactMaterial'), // "Contact surface material": Defines the friction and elasticity when two specific materials come into contact.
        Material :                      _dereq_('./material/Material'), // "Basic Material Sample": The basic properties of all object materials.
        
        Vec3 :                          _dereq_('./math/Vec3'), // "Three-dimensional vector": "small arrow" that represents the three-dimensional direction and size of position, velocity, force, etc.
        
        World :                         _dereq_('./world/World'), // "Physical World General Manager": the core object that manages all physical entities, constraints, forces and solutions, is the "central stage" of the entire simulation.
    };
    
    
    },{"../package.json":1,"./collision/SAPBroadphase":10,"./material/ContactMaterial":14,"./material/Material":15,"./math/Vec3":20,"./objects/Body":21,"./shapes/Box":22,"./shapes/Sphere":26,"./world/World":35}],3:[function(_dereq_,module,exports){
    var Vec3 = _dereq_('../math/Vec3');
    var Utils = _dereq_('../utils/Utils');
    
    module.exports = AABB;
    
    /**
     * 轴对齐边界框类。
     * @class AABB
     * @constructor
     * @param {Object} [options]
     * @param {Vec3}   [options.upperBound]
     * @param {Vec3}   [options.lowerBound]
     */
    function AABB(options){
        options = options || {};
    
        /**
         * 边界框的下限。
         * @property 下部
         * @type {Vec3}
         */
        this.lowerBound = new Vec3();
        if(options.lowerBound){
            this.lowerBound.copy(options.lowerBound);
        }
    
        /**
         * 边界框的上限。
         * @property 上行
         * @type {Vec3}
         */
        this.upperBound = new Vec3();
        if(options.upperBound){
            this.upperBound.copy(options.upperBound);
        }
    }
    
    var tmp = new Vec3();
    
    /**
     * 从一组点设置AABB边界。
     * @method setFromPoints
     * @param {Array} points VEC3的阵列。
     * @param {Vec3} position
     * @param {Quaternion} quaternion
     * @param {number} skinSize
     * @return {AABB} 自我对象
     */
    AABB.prototype.setFromPoints = function(points, position, quaternion, skinSize){
        var l = this.lowerBound,
            u = this.upperBound,
            q = quaternion;
    
        // 设置为第一点
        l.copy(points[0]);
        if(q){
            q.vmult(l, l);
        }
        u.copy(l);
    
        for(var i = 1; i<points.length; i++){
            var p = points[i];
    
            if(q){
                q.vmult(p, tmp);
                p = tmp;
            }
    
            if(p.x > u.x){ u.x = p.x; }
            if(p.x < l.x){ l.x = p.x; }
            if(p.y > u.y){ u.y = p.y; }
            if(p.y < l.y){ l.y = p.y; }
            if(p.z > u.z){ u.z = p.z; }
            if(p.z < l.z){ l.z = p.z; }
        }
    
        // 添加偏移
        if (position) {
            position.vadd(l, l);
            position.vadd(u, u);
        }
    
        if(skinSize){
            l.x -= skinSize;
            l.y -= skinSize;
            l.z -= skinSize;
            u.x += skinSize;
            u.y += skinSize;
            u.z += skinSize;
        }
    
        return this;
    };
    
    /**
     * 复制从AABB到此AABB的界限
     * @method copy
     * @param  {AABB} aabb 从中复制的来源
     * @return {AABB} 这个对象，可链性
     */
    AABB.prototype.copy = function(aabb){
        this.lowerBound.copy(aabb.lowerBound);
        this.upperBound.copy(aabb.upperBound);
        return this;
    };
    
    /**
     * 克隆一个AABB
     * @method clone
     */
    AABB.prototype.clone = function(){
        return new AABB().copy(this);
    };
    
    /**
     * 扩展此AABB，以便它也覆盖给定的AABB。
     * @method extend
     * @param  {AABB} aabb
     */
    AABB.prototype.extend = function(aabb){
        this.lowerBound.x = Math.min(this.lowerBound.x, aabb.lowerBound.x);
        this.upperBound.x = Math.max(this.upperBound.x, aabb.upperBound.x);
        this.lowerBound.y = Math.min(this.lowerBound.y, aabb.lowerBound.y);
        this.upperBound.y = Math.max(this.upperBound.y, aabb.upperBound.y);
        this.lowerBound.z = Math.min(this.lowerBound.z, aabb.lowerBound.z);
        this.upperBound.z = Math.max(this.upperBound.z, aabb.upperBound.z);
    };
    
    /**
     * 如果给定的AABB与此AABB重叠，则返回true。
     * @method overlaps
     * @param  {AABB} aabb
     * @return {Boolean}
     */
    AABB.prototype.overlaps = function(aabb){
        var l1 = this.lowerBound,
            u1 = this.upperBound,
            l2 = aabb.lowerBound,
            u2 = aabb.upperBound;
    
        //      不
        //      |---------|
        // |--------|
        // L1 U1
    
        var overlapsX = ((l2.x <= u1.x && u1.x <= u2.x) || (l1.x <= u2.x && u2.x <= u1.x));
        var overlapsY = ((l2.y <= u1.y && u1.y <= u2.y) || (l1.y <= u2.y && u2.y <= u1.y));
        var overlapsZ = ((l2.z <= u1.z && u1.z <= u2.z) || (l1.z <= u2.z && u2.z <= u1.z));
    
        return overlapsX && overlapsY && overlapsZ;
    };
    
    // // 主要用于调试
    // AABB.prototype.volume = function(){
    //     var l = this.lowerBound,
    //         u = this.upperBound;
    //     return (u.x - l.x) * (u.y - l.y) * (u.z - l.z);
    // };
    
    
    /**
     * 如果给定的AABB完全包含在此AABB中，则返回为true。
     * @method contains
     * @param {AABB} aabb
     * @return {Boolean}
     */
    AABB.prototype.contains = function(aabb){
        var l1 = this.lowerBound,
            u1 = this.upperBound,
            l2 = aabb.lowerBound,
            u2 = aabb.upperBound;
    
        //      不
        //      |---------|
        // |---------------|
        // L1 U1
    
        return (
            (l1.x <= l2.x && u1.x >= u2.x) &&
            (l1.y <= l2.y && u1.y >= u2.y) &&
            (l1.z <= l2.z && u1.z >= u2.z)
        );
    };
    
    /**
     * @method getCorners
     * @param {Vec3} a
     * @param {Vec3} b
     * @param {Vec3} c
     * @param {Vec3} d
     * @param {Vec3} e
     * @param {Vec3} f
     * @param {Vec3} g
     * @param {Vec3} h
     */
    // AABB.prototype.getCorners = function(a, b, c, d, e, f, g, h){
    //     var l = this.lowerBound,
    //         u = this.upperBound;
    
    //     a.copy(l);
    //     b.set( u.x, l.y, l.z );
    //     c.set( u.x, u.y, l.z );
    //     d.set( l.x, u.y, u.z );
    //     e.set( u.x, l.y, l.z );
    //     f.set( l.x, u.y, l.z );
    //     g.set( l.x, l.y, u.z );
    //     h.copy(u);
    // };
    
    var transformIntoFrame_corners = [
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3()
    ];
    
    /**
     * 在另一帧中获取AABB的表示。
     * @method toLocalFrame
     * @param  {Transform} frame
     * @param  {AABB} target
     * @return {AABB} “目标” AABB对象。
     */
    // AABB.prototype.toLocalFrame = function(frame, target){
    
    //     var corners = transformIntoFrame_corners;
    //     var a = corners[0];
    //     var b = corners[1];
    //     var c = corners[2];
    //     var d = corners[3];
    //     var e = corners[4];
    //     var f = corners[5];
    //     var g = corners[6];
    //     var h = corners[7];
    
    //     // 在当前框架
    //     // this.getCorners(a, b, c, d, e, f, g, h);
    
    //     // 将它们转换为新的本地框架
    //     for(var i=0; i !== 8; i++){
    //         var corner = corners[i];
    //         frame.pointToLocal(corner, corner);
    //     }
    
    //     return target.setFromPoints(corners);
    // };
    
    /**
     * 在全球框架中获取AABB的表示。
     * @method toWorldFrame
     * @param  {Transform} frame
     * @param  {AABB} target
     * @return {AABB} “目标” AABB对象。
     */
    // AABB.prototype.toWorldFrame = function(frame, target){
    
    //     var corners = transformIntoFrame_corners;
    //     var a = corners[0];
    //     var b = corners[1];
    //     var c = corners[2];
    //     var d = corners[3];
    //     var e = corners[4];
    //     var f = corners[5];
    //     var g = corners[6];
    //     var h = corners[7];
    
    //     // 在当前框架
    //     // this.getCorners(a, b, c, d, e, f, g, h);
    
    //     // 将它们转换为新的本地框架
    //     for(var i=0; i !== 8; i++){
    //         var corner = corners[i];
    //         frame.pointToWorld(corner, corner);
    //     }
    
    //     return target.setFromPoints(corners);
    // };
    
    /**
     * 检查AABB是否被射线击中。
     * @param  {Ray} ray
     * @return {number}
     */
    AABB.prototype.overlapsRay = function(ray){
        var t = 0;
    
        // 射线。方向是射线的单位方向向量
        var dirFracX = 1 / ray._direction.x;
        var dirFracY = 1 / ray._direction.y;
        var dirFracZ = 1 / ray._direction.z;
    
        // this.lowerbound是AABB的角落，坐标最小 -左下，RT是最大角落
        var t1 = (this.lowerBound.x - ray.from.x) * dirFracX;
        var t2 = (this.upperBound.x - ray.from.x) * dirFracX;
        var t3 = (this.lowerBound.y - ray.from.y) * dirFracY;
        var t4 = (this.upperBound.y - ray.from.y) * dirFracY;
        var t5 = (this.lowerBound.z - ray.from.z) * dirFracZ;
        var t6 = (this.upperBound.z - ray.from.z) * dirFracZ;
    
        // var tmin = Math.max（Math.max（Math.min（T1，T2），Math.min（T3，T4）））;
        // var tmax = math.min（Math.min（Math.max（T1，T2），Math.max（T3，T4）））;
        var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
        var tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
    
        // 如果tmax <0，ray（line）正在与AABB相交，但是整个AABB都在我们身后
        if (tmax < 0){
            //t = tmax;
            return false;
        }
    
        // 如果tmin> tmax，射线不会与AABB相交
        if (tmin > tmax){
            //t = tmax;
            return false;
        }
    
        return true;
    };
    },{"../math/Vec3":20,"../utils/Utils":32}],4:[function(_dereq_,module,exports){
    module.exports = ArrayCollisionMatrix;
    
    /**
     * 碰撞“矩阵”。实际上，这是两个尸体是否触摸此步骤的三角形阵列，以供下一步参考
     * @class ArrayCollisionMatrix
     * @constructor
     */
    function ArrayCollisionMatrix() {
    
        /**
         * 矩阵存储
         * @property 矩阵
         * @type {Array}
         */
        this.matrix = [];
    }
    
    /**
     * 得到一个元素
     * @method get
     * @param  {Number} i
     * @param  {Number} j
     * @return {Number}
     */
    // ArrayCollisionMatrix.prototype.get = function(i, j) {
    //     i = i.index;
    //     j = j.index;
    //     if (j > i) {
    //         var temp = j;
    //         j = i;
    //         i = temp;
    //     }
    //     return this.matrix[(i*(i + 1)>>1) + j-1];
    // };
    
    // /**
    //  * 设置一个元素
    //  * @method set
    //  * @param {Number} i
    //  * @param {Number} j
    //  * @param {Number} value
    //  */
    // ArrayCollisionMatrix.prototype.set = function(i, j, value) {
    //     i = i.index;
    //     j = j.index;
    //     if (j > i) {
    //         var temp = j;
    //         j = i;
    //         i = temp;
    //     }
    //     this.matrix[(i*(i + 1)>>1) + j-1] = value ? 1 : 0;
    // };
    
    // /**
    //  * 将所有元素设置为零
    //  * @method reset
    //  */
    // ArrayCollisionMatrix.prototype.reset = function() {
    //     for (var i=0, l=this.matrix.length; i!==l; i++) {
    //         this.matrix[i]=0;
    //     }
    // };
    
    // /**
    //  * 设置最大对象数
    //  * @method setNumObjects
    //  * @param {Number} n
    //  */
    // ArrayCollisionMatrix.prototype.setNumObjects = function(n) {
    //     this.matrix.length = n*(n-1)>>1;
    // };
    
    },{}],5:[function(_dereq_,module,exports){
    var Body = _dereq_('../objects/Body');
    var Vec3 = _dereq_('../math/Vec3');
    var Quaternion = _dereq_('../math/Quaternion');
    var Shape = _dereq_('../shapes/Shape');
    var Plane = _dereq_('../shapes/Plane');
    
    module.exports = Broadphase;
    
    /**
     * 扩展实施的基础类
     * @class 宽相
     * @constructor
     * @author schteppe
     */
    function Broadphase(){
        /**
        * 世界寻找冲突的世界。
        * @property 世界
        * @type {World}
        */
        this.world = null;
    
        /**
         * 如果设置为true，则Broadphase使用边界框进行交叉测试，否则它使用边界球体。
         * @property use -boundingbox
         * @type {Boolean}
         */
        this.useBoundingBoxes = false;
    
        /**
         * 如果世界上的对象移动，则设置为True。
         * @property {Boolean} dirty
         */
        this.dirty = true;
    }
    
    /**
     * 从世界上获得碰撞对
     * @method collisionPairs
     * @param {World} world 搜索的世界
     * @param {Array} p1 空阵列充满身体对象
     * @param {Array} p2 空阵列充满身体对象
     */
    Broadphase.prototype.collisionPairs = function(world,p1,p2){
        throw new Error("collisionPairs not implemented for this BroadPhase class!");
    };
    
    /**
     * 检查是否需要对身体对进行交点测试。
     * @method needBroadphaseCollision
     * @param {Body} bodyA
     * @param {Body} bodyB
     * @return {bool}
     */
    Broadphase.prototype.needBroadphaseCollision = function(bodyA,bodyB){
    
        // 检查碰撞过滤器口罩
        if( (bodyA.collisionFilterGroup & bodyB.collisionFilterMask)===0 || (bodyB.collisionFilterGroup & bodyA.collisionFilterMask)===0){
            return false;
        }
    
        // // 检查类型
        // if(((bodyA.type & Body.STATIC)!==0 || bodyA.sleepState === Body.SLEEPING) &&
        //    ((bodyB.type & Body.STATIC)!==0 || bodyB.sleepState === Body.SLEEPING)) {
        //     // 两具尸体都是静态的或睡觉的。跳过。
        //     return false;
        // }
    
        return true;
    };
    
    /**
     * 检查两个物体的边界量是否相交。
     * @method intersectionTest
     * @param {Body} bodyA
     * @param {Body} bodyB
     * @param {array} pairs1
     * @param {array} pairs2
      */
    Broadphase.prototype.intersectionTest = function(bodyA, bodyB, pairs1, pairs2){
        if(this.useBoundingBoxes){
            this.doBoundingBoxBroadphase(bodyA,bodyB,pairs1,pairs2);
        } else {
            this.doBoundingSphereBroadphase(bodyA,bodyB,pairs1,pairs2);
        }
    };
    
    /**
     * 检查两个物体的边界球是否相交。
     * @method doBoundingSphereBroadphase
     * @param {Body} bodyA
     * @param {Body} bodyB
     * @param {Array} pairs1 如果相交
     * @param {Array} pairs2 如果相交
     */
    var Broadphase_collisionPairs_r = new Vec3(), // 温度对象
        Broadphase_collisionPairs_normal =  new Vec3(),
        Broadphase_collisionPairs_quat =  new Quaternion(),
        Broadphase_collisionPairs_relpos  =  new Vec3();
    Broadphase.prototype.doBoundingSphereBroadphase = function(bodyA,bodyB,pairs1,pairs2){
        var r = Broadphase_collisionPairs_r;
        bodyB.position.vsub(bodyA.position,r);
        var boundingRadiusSum2 = Math.pow(bodyA.boundingRadius + bodyB.boundingRadius, 2);
        var norm2 = r.norm2();
        if(norm2 < boundingRadiusSum2){
            pairs1.push(bodyA);
            pairs2.push(bodyB);
        }
    };
    
    /**
     * 检查两个物体的边界框是否相交。
     * @method doBoundingBoxBroadphase
     * @param {Body} bodyA
     * @param {Body} bodyB
     * @param {Array} pairs1
     * @param {Array} pairs2
     */
    Broadphase.prototype.doBoundingBoxBroadphase = function(bodyA,bodyB,pairs1,pairs2){
        if(bodyA.aabbNeedsUpdate){
            bodyA.computeAABB();
        }
        if(bodyB.aabbNeedsUpdate){
            bodyB.computeAABB();
        }
    
        // 检查AABB /AABB
        if(bodyA.aabb.overlaps(bodyB.aabb)){
            pairs1.push(bodyA);
            pairs2.push(bodyB);
        }
    };
    
    /**
     * 从对阵列中删除重复对。
     * @method makePairsUnique
     * @param {Array} pairs1
     * @param {Array} pairs2
     */
    var Broadphase_makePairsUnique_temp = { keys:[] },
        Broadphase_makePairsUnique_p1 = [],
        Broadphase_makePairsUnique_p2 = [];
    Broadphase.prototype.makePairsUnique = function(pairs1,pairs2){
        // var t = Broadphase_makePairsUnique_temp,
        //     p1 = Broadphase_makePairsUnique_p1,
        //     p2 = Broadphase_makePairsUnique_p2,
        //     N = pairs1.length;
    
        // for(var i=0; i!==N; i++){
        //     p1[i] = pairs1[i];
        //     p2[i] = pairs2[i];
        // }
    
        // pairs1.length = 0;
        // pairs2.length = 0;
    
        // for(var i=0; i!==N; i++){
        //     var id1 = p1[i].id,
        //         id2 = p2[i].id;
        //     var key = id1 < id2 ? id1+","+id2 :  id2+","+id1;
        //     t[key] = i;
        //     t.keys.push(key);
        // }
    
        // for(var i=0; i!==t.keys.length; i++){
        //     var key = t.keys.pop(),
        //         pairIndex = t[key];
        //     pairs1.push(p1[pairIndex]);
        //     pairs2.push(p2[pairIndex]);
        //     delete t[key];
        // }
    };
    
    /**
     * 通过子量实施
     * @method setWorld
     * @param {World} world
     */
    Broadphase.prototype.setWorld = function(world){
    };
    
    /**
     * 检查两个物体的边界球是否重叠。
     * @method boundingSphereCheck
     * @param {Body} bodyA
     * @param {Body} bodyB
     * @return {boolean}
     */
    var bsc_dist = new Vec3();
    Broadphase.boundingSphereCheck = function(bodyA,bodyB){
        var dist = bsc_dist;
        bodyA.position.vsub(bodyB.position,dist);
        return Math.pow(bodyA.shape.boundingSphereRadius + bodyB.shape.boundingSphereRadius,2) > dist.norm2();
    };
    
    /**
     * 返回AABB内的所有尸体。
     * @method aabbQuery
     * @param  {World} world
     * @param  {AABB} aabb
     * @param  {array} result 将产生的尸体存储在阵列中。
     * @return {array}
     */
    Broadphase.prototype.aabbQuery = function(world, aabb, result){
        // console.warn('.aabbQuery is not implemented in this Broadphase subclass.');
        // return [];
    };
    },{"../math/Quaternion":18,"../math/Vec3":20,"../objects/Body":21,"../shapes/Plane":24,"../shapes/Shape":25}],6:[function(_dereq_,module,exports){
    module.exports = NaiveBroadphase;
    
    var Broadphase = _dereq_('./Broadphase');
    var AABB = _dereq_('./AABB');
    
    /**
     * 幼稚的宽相实施，用于缺乏更好的实施。
     * @class 幼稚的阶段
     * @constructor
     * @description 幼稚的宽相在所有可能的对上看不受限制，因此具有复杂性n^2（这是不好的）
     * @extends Broadphase
     */
    function NaiveBroadphase(){
        Broadphase.apply(this);
    }
    NaiveBroadphase.prototype = new Broadphase();
    NaiveBroadphase.prototype.constructor = NaiveBroadphase;
    
    /**
     * 在物理世界中获取所有碰撞对
     * @method collisionPairs
     * @param {World} world
     * @param {Array} pairs1
     * @param {Array} pairs2
     */
    NaiveBroadphase.prototype.collisionPairs = function(world,pairs1,pairs2){
        var bodies = world.bodies,
            n = bodies.length,
            i,j,bi,bj;
    
        // 天真的n^2 ftw！
        for(i=0; i!==n; i++){
            for(j=0; j!==i; j++){
    
                bi = bodies[i];
                bj = bodies[j];
    
                if(!this.needBroadphaseCollision(bi,bj)){
                    continue;
                }
    
                this.intersectionTest(bi,bj,pairs1,pairs2);
            }
        }
    };
    
    var tmpAABB = new AABB();
    
    /**
     * 返回AABB中的所有尸体。
     * @method aabbQuery
     * @param  {World} world
     * @param  {AABB} aabb
     * @param {array} result 将产生的尸体存储在阵列中。
     * @return {array}
     */
    NaiveBroadphase.prototype.aabbQuery = function(world, aabb, result){
        // result = result || [];
    
        // for(var i = 0; i < world.bodies.length; i++){
        //     var b = world.bodies[i];
    
        //     if(b.aabbNeedsUpdate){
        //         b.computeAABB();
        //     }
    
        //     // 丑陋的黑客直到身体得到AABB
        //     if(b.aabb.overlaps(aabb)){
        //         result.push(b);
        //     }
        // }
    
        // return result;
    };
    },{"./AABB":3,"./Broadphase":5}],7:[function(_dereq_,module,exports){
    module.exports = OverlapKeeper;
    
    /**
     * @class 重叠者
     * @constructor
     */
    function OverlapKeeper() {
        this.current = [];
        this.previous = [];
    }
    
    // OverlapKeeper.prototype.getKey = function(i, j) {
    //     if (j < i) {
    //         var temp = j;
    //         j = i;
    //         i = temp;
    //     }
    //     return (i << 16) | j;
    // };
    
    
    /**
     * @method set
     * @param {Number} i
     * @param {Number} j
     */
    OverlapKeeper.prototype.set = function(i, j) {
        // // 插入排序。这样，差异将具有线性复杂性。
        // var key = this.getKey(i, j);
        // var current = this.current;
        // var index = 0;
        // while(key > current[index]){
        //     index++;
        // }
        // if(key === current[index]){
        //     return; // 一对已经添加
        // }
        // for(var j=current.length-1; j>=index; j--){
        //     current[j + 1] = current[j];
        // }
        // current[index] = key;
    };
    
    /**
     * @method tick
     */
    OverlapKeeper.prototype.tick = function() {
        // var tmp = this.current;
        // this.current = this.previous;
        // this.previous = tmp;
        // this.current.length = 0;
    };
    
    function unpackAndPush(array, key){
        array.push((key & 0xFFFF0000) >> 16, key & 0x0000FFFF);
    }
    
    /**
     * @method getDiff
     * @param  {array} additions
     * @param  {array} removals
     */
    OverlapKeeper.prototype.getDiff = function(additions, removals) {
        // var a = this.current;
        // var b = this.previous;
        // var al = a.length;
        // var bl = b.length;
    
        // var j=0;
        // for (var i = 0; i < al; i++) {
        //     var found = false;
        //     var keyA = a[i];
        //     while(keyA > b[j]){
        //         j++;
        //     }
        //     found = keyA === b[j];
    
        //     if(!found){
        //         unpackAndPush(additions, keyA);
        //     }
        // }
        // j = 0;
        // for (var i = 0; i < bl; i++) {
        //     var found = false;
        //     var keyB = b[i];
        //     while(keyB > a[j]){
        //         j++;
        //     }
        //     found = a[j] === keyB;
    
        //     if(!found){
        //         unpackAndPush(removals, keyB);
        //     }
        // }
    };
    },{}],8:[function(_dereq_,module,exports){
    module.exports = Ray;
    
    var Vec3 = _dereq_('../math/Vec3');
    var Quaternion = _dereq_('../math/Quaternion');
    var Transform = _dereq_('../math/Transform');
    var ConvexPolyhedron = _dereq_('../shapes/ConvexPolyhedron');
    var Box = _dereq_('../shapes/Box');
    var RaycastResult = _dereq_('../collision/RaycastResult');
    var Shape = _dereq_('../shapes/Shape');
    var AABB = _dereq_('../collision/AABB');
    
    /**
     * 3D空间中的一条线与身体与返回点相交。
     * @class 射线
     * @constructor
     * @param {Vec3} from
     * @param {Vec3} to
     */
    function Ray(from, to){
        /**
         * @property {Vec3} from
         */
        this.from = from ? from.clone() : new Vec3();
    
        /**
         * @property {Vec3} to
         */
        this.to = to ? to.clone() : new Vec3();
    
        /**
         * @private
         * @property {Vec3} _direction
         */
        this._direction = new Vec3();
    
        /**
         * 射线的精度。检查并行性等时使用
         * @property {Number} precision
         */
        this.precision = 0.0001;
    
        /**
         * 如果您希望射线将.CollisionResponse标志在身体和形状上考虑到True。
         * @property {Boolean} checkCollisionResponse
         */
        this.checkCollisionResponse = true;
    
        /**
         * 如果设置为true，则射线会以normal.dot（rayDirection）<0跳过任何命中。
         * @property {Boolean} skipBackfaces
         */
        this.skipBackfaces = false;
    
        /**
         * @property {number} collisionFilterMask
         * @default -1
         */
        this.collisionFilterMask = -1;
    
        /**
         * @property {number} collisionFilterGroup
         * @default -1
         */
        this.collisionFilterGroup = -1;
    
        /**
         * 交叉模式。应该是雷。
         * @property {number} mode
         */
        this.mode = Ray.ANY;
    
        /**
         * 当前结果对象。
         * @property {RaycastResult} result
         */
        this.result = new RaycastResult();
    
        /**
         * 如果射线击中任何东西，将在Intersectworld（）期间设置为true。
         * @property {Boolean} hasHit
         */
        this.hasHit = false;
    
        /**
         * 当前，用户提供的结果回调。如果模式为ray.All，将使用。
         * @property {Function} callback
         */
        this.callback = function(result){};
    }
    // Ray.prototype.constructor = Ray;
    
    // Ray.CLOSEST = 1;
    // Ray.ANY = 2;
    // Ray.ALL = 4;
    
    // var tmpAABB = new AABB();
    // var tmpArray = [];
    
    // /**
    //  * 对特定世界中的所有身体进行迭代。
    //  * @method intersectWorld
    //  * @param  {World} world
    //  * @param  {object} options
    //  * @return {Boolean} 如果射线击中任何东西，则是真的。
    //  */
    // Ray.prototype.intersectWorld = function (world, options) {
    //     return;  // 【测试删除】
    //     this.mode = options.mode || Ray.ANY;
    //     this.result = options.result || new RaycastResult();
    //     this.skipBackfaces = !!options.skipBackfaces;
    //     this.collisionFilterMask = typeof(options.collisionFilterMask) !== 'undefined' ? options.collisionFilterMask : -1;
    //     this.collisionFilterGroup = typeof(options.collisionFilterGroup) !== 'undefined' ? options.collisionFilterGroup : -1;
    //     if(options.from){
    //         this.from.copy(options.from);
    //     }
    //     if(options.to){
    //         this.to.copy(options.to);
    //     }
    //     this.callback = options.callback || function(){};
    //     this.hasHit = false;
    
    //     this.result.reset();
    //     this._updateDirection();
    
    //     this.getAABB(tmpAABB);
    //     tmpArray.length = 0;
    //     world.broadphase.aabbQuery(world, tmpAABB, tmpArray);
    //     this.intersectBodies(tmpArray);
    
    //     return this.hasHit;
    // };
    
    // var v1 = new Vec3(),
    //     v2 = new Vec3();
    
    // /*
    //  * 根据此处命名的“ Barycentric Technique”
    //  */
    // Ray.pointInTriangle = pointInTriangle;
    // function pointInTriangle(p, a, b, c) {
    //     c.vsub(a,v0);
    //     b.vsub(a,v1);
    //     p.vsub(a,v2);
    
    //     var dot00 = v0.dot( v0 );
    //     var dot01 = v0.dot( v1 );
    //     var dot02 = v0.dot( v2 );
    //     var dot11 = v1.dot( v1 );
    //     var dot12 = v1.dot( v2 );
    
    //     var u,v;
    
    //     return  ( (u = dot11 * dot02 - dot01 * dot12) >= 0 ) &&
    //             ( (v = dot00 * dot12 - dot01 * dot02) >= 0 ) &&
    //             ( u + v < ( dot00 * dot11 - dot01 * dot01 ) );
    // }
    
    // /**
    //  * 在身体上射射线，取回有关命中的信息。
    //  * @method intersectBody
    //  * @private
    //  * @param {Body} body
    //  * @param {RaycastResult} [result] 弃用 -设置射线的结果属性。
    //  */
    // var intersectBody_xi = new Vec3();
    // var intersectBody_qi = new Quaternion();
    // Ray.prototype.intersectBody = function (body, result) {
    //     return;  // 【测试删除】
    //     if(result){
    //         this.result = result;
    //         this._updateDirection();
    //     }
    //     var checkCollisionResponse = this.checkCollisionResponse;
    
    //     if(checkCollisionResponse && !body.collisionResponse){
    //         return;
    //     }
    
    //     if((this.collisionFilterGroup & body.collisionFilterMask)===0 || (body.collisionFilterGroup & this.collisionFilterMask)===0){
    //         return;
    //     }
    
    //     var xi = intersectBody_xi;
    //     var qi = intersectBody_qi;
    
    //     for (var i = 0, N = body.shapes.length; i < N; i++) {
    //         var shape = body.shapes[i];
    
    //         if(checkCollisionResponse && !shape.collisionResponse){
    //             continue; // 跳过
    //         }
    
    //         body.quaternion.mult(body.shapeOrientations[i], qi);
    //         body.quaternion.vmult(body.shapeOffsets[i], xi);
    //         xi.vadd(body.position, xi);
    
    //         this.intersectShape(
    //             shape,
    //             qi,
    //             xi,
    //             body
    //         );
    
    //         if(this.result._shouldStop){
    //             break;
    //         }
    //     }
    // };
    
    // /**
    //  * @method intersectBodies
    //  * @param {Array} bodies 一系列身体对象。
    //  * @param {RaycastResult} [result] 弃用
    //  */
    // Ray.prototype.intersectBodies = function (bodies, result) {
    //     return;  // 【测试删除】
    //     if(result){
    //         this.result = result;
    //         this._updateDirection();
    //     }
    
    //     for ( var i = 0, l = bodies.length; !this.result._shouldStop && i < l; i ++ ) {
    //         this.intersectBody(bodies[i]);
    //     }
    // };
    
    // /**
    //  * 更新_方向向量。
    //  * @private
    //  * @method _updateDirection
    //  */
    // Ray.prototype._updateDirection = function(){
    //     return;  // 【测试删除】
    //     this.to.vsub(this.from, this._direction);
    //     this._direction.normalize();
    // };
    
    // /**
    //  * @method intersectShape
    //  * @private
    //  * @param {Shape} shape
    //  * @param {Quaternion} quat
    //  * @param {Vec3} position
    //  * @param {Body} body
    //  */
    // Ray.prototype.intersectShape = function(shape, quat, position, body){
    //     var from = this.from;
    
    
    //     // 检查界限
    //     var distance = distanceFromIntersection(from, this._direction, position);
    //     if ( distance > shape.boundingSphereRadius ) {
    //         return;
    //     }
    
    //     var intersectMethod = this[shape.type];
    //     if(intersectMethod){
    //         intersectMethod.call(this, shape, quat, position, body, shape);
    //     }
    // };
    
    // var vector = new Vec3();
    // var normal = new Vec3();
    // var intersectPoint = new Vec3();
    
    // var a = new Vec3();
    // var b = new Vec3();
    // var c = new Vec3();
    // var d = new Vec3();
    
    // var tmpRaycastResult = new RaycastResult();
    
    // /**
    //  * @method intersectBox
    //  * @private
    //  * @param  {Shape} shape
    //  * @param  {Quaternion} quat
    //  * @param  {Vec3} position
    //  * @param  {Body} body
    //  */
    // Ray.prototype.intersectBox = function(shape, quat, position, body, reportedShape){
    //     return this.intersectConvex(shape.convexPolyhedronRepresentation, quat, position, body, reportedShape);
    // };
    // Ray.prototype[Shape.types.BOX] = Ray.prototype.intersectBox;
    
    // /**
    //  * @method intersectPlane
    //  * @private
    //  * @param  {Shape} shape
    //  * @param  {Quaternion} quat
    //  * @param  {Vec3} position
    //  * @param  {Body} body
    //  */
    // Ray.prototype.intersectPlane = function(shape, quat, position, body, reportedShape){
    //     var from = this.from;
    //     var to = this.to;
    //     var direction = this._direction;
    
    //     // 使平面正常
    //     var worldNormal = new Vec3(0, 0, 1);
    //     quat.vmult(worldNormal, worldNormal);
    
    //     var len = new Vec3();
    //     from.vsub(position, len);
    //     var planeToFrom = len.dot(worldNormal);
    //     to.vsub(position, len);
    //     var planeToTo = len.dot(worldNormal);
    
    //     if(planeToFrom * planeToTo > 0){
    //         // “从”和“”在飞机的同一侧...纾困
    //         return;
    //     }
    
    //     if(from.distanceTo(to) < planeToFrom){
    //         return;
    //     }
    
    //     var n_dot_dir = worldNormal.dot(direction);
    
    //     if (Math.abs(n_dot_dir) < this.precision) {
    //         // 没有十字路口
    //         return;
    //     }
    
    //     var planePointToFrom = new Vec3();
    //     var dir_scaled_with_t = new Vec3();
    //     var hitPointWorld = new Vec3();
    
    //     from.vsub(position, planePointToFrom);
    //     var t = -worldNormal.dot(planePointToFrom) / n_dot_dir;
    //     direction.scale(t, dir_scaled_with_t);
    //     from.vadd(dir_scaled_with_t, hitPointWorld);
    
    //     this.reportIntersection(worldNormal, hitPointWorld, reportedShape, body, -1);
    // };
    // Ray.prototype[Shape.types.PLANE] = Ray.prototype.intersectPlane;
    
    // /**
    //  * 获取射线的世界。
    //  * @method getAABB
    //  * @param  {AABB} aabb
    //  */
    // Ray.prototype.getAABB = function(result){
    //     var to = this.to;
    //     var from = this.from;
    //     result.lowerBound.x = Math.min(to.x, from.x);
    //     result.lowerBound.y = Math.min(to.y, from.y);
    //     result.lowerBound.z = Math.min(to.z, from.z);
    //     result.upperBound.x = Math.max(to.x, from.x);
    //     result.upperBound.y = Math.max(to.y, from.y);
    //     result.upperBound.z = Math.max(to.z, from.z);
    // };
    
    // var intersectConvexOptions = {
    //     faceList: [0]
    // };
    // var worldPillarOffset = new Vec3();
    // var intersectHeightfield_localRay = new Ray();
    // var intersectHeightfield_index = [];
    // var intersectHeightfield_minMax = [];
    
    // /**
    //  * @method intersectHeightfield
    //  * @private
    //  * @param  {Shape} shape
    //  * @param  {Quaternion} quat
    //  * @param  {Vec3} position
    //  * @param  {Body} body
    //  */
    // Ray.prototype.intersectHeightfield = function(shape, quat, position, body, reportedShape){
    //     var data = shape.data,
    //         w = shape.elementSize;
    
    //     // 将射线转换为当地高地坐标
    //     var localRay = intersectHeightfield_localRay; //新射线（this.from，this.to）;
    //     localRay.from.copy(this.from);
    //     localRay.to.copy(this.to);
    //     Transform.pointToLocalFrame(position, quat, localRay.from, localRay.from);
    //     Transform.pointToLocalFrame(position, quat, localRay.to, localRay.to);
    //     localRay._updateDirection();
    
    //     // 获取数据点的索引以测试
    //     var index = intersectHeightfield_index;
    //     var iMinX, iMinY, iMaxX, iMaxY;
    
    //     // 设置为最大
    //     iMinX = iMinY = 0;
    //     iMaxX = iMaxY = shape.data.length - 1;
    
    //     var aabb = new AABB();
    //     localRay.getAABB(aabb);
    
    //     shape.getIndexOfPosition(aabb.lowerBound.x, aabb.lowerBound.y, index, true);
    //     iMinX = Math.max(iMinX, index[0]);
    //     iMinY = Math.max(iMinY, index[1]);
    //     shape.getIndexOfPosition(aabb.upperBound.x, aabb.upperBound.y, index, true);
    //     iMaxX = Math.min(iMaxX, index[0] + 1);
    //     iMaxY = Math.min(iMaxY, index[1] + 1);
    
    //     for(var i = iMinX; i < iMaxX; i++){
    //         for(var j = iMinY; j < iMaxY; j++){
    
    //             if(this.result._shouldStop){
    //                 return;
    //             }
    
    //             shape.getAabbAtIndex(i, j, aabb);
    //             if(!aabb.overlapsRay(localRay)){
    //                 continue;
    //             }
    
    //             // 下三角
    //             shape.getConvexTrianglePillar(i, j, false);
    //             Transform.pointToWorldFrame(position, quat, shape.pillarOffset, worldPillarOffset);
    //             this.intersectConvex(shape.pillarConvex, quat, worldPillarOffset, body, reportedShape, intersectConvexOptions);
    
    //             if(this.result._shouldStop){
    //                 return;
    //             }
    
    //             // 上三角
    //             shape.getConvexTrianglePillar(i, j, true);
    //             Transform.pointToWorldFrame(position, quat, shape.pillarOffset, worldPillarOffset);
    //             this.intersectConvex(shape.pillarConvex, quat, worldPillarOffset, body, reportedShape, intersectConvexOptions);
    //         }
    //     }
    // };
    // Ray.prototype[Shape.types.HEIGHTFIELD] = Ray.prototype.intersectHeightfield;
    
    // var Ray_intersectSphere_intersectionPoint = new Vec3();
    // var Ray_intersectSphere_normal = new Vec3();
    
    // /**
    //  * @method intersectSphere
    //  * @private
    //  * @param  {Shape} shape
    //  * @param  {Quaternion} quat
    //  * @param  {Vec3} position
    //  * @param  {Body} body
    //  */
    // Ray.prototype.intersectSphere = function(shape, quat, position, body, reportedShape){
    //     var from = this.from,
    //         to = this.to,
    //         r = shape.radius;
    
    //     var a = Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2) + Math.pow(to.z - from.z, 2);
    //     var b = 2 * ((to.x - from.x) * (from.x - position.x) + (to.y - from.y) * (from.y - position.y) + (to.z - from.z) * (from.z - position.z));
    //     var c = Math.pow(from.x - position.x, 2) + Math.pow(from.y - position.y, 2) + Math.pow(from.z - position.z, 2) - Math.pow(r, 2);
    
    //     var delta = Math.pow(b, 2) - 4 * a * c;
    
    //     var intersectionPoint = Ray_intersectSphere_intersectionPoint;
    //     var normal = Ray_intersectSphere_normal;
    
    //     if(delta < 0){
    //         // 没有十字路口
    //         return;
    
    //     } else if(delta === 0){
    //         // 单一相交点
    //         from.lerp(to, delta, intersectionPoint);
    
    //         intersectionPoint.vsub(position, normal);
    //         normal.normalize();
    
    //         this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
    
    //     } else {
    //         var d1 = (- b - Math.sqrt(delta)) / (2 * a);
    //         var d2 = (- b + Math.sqrt(delta)) / (2 * a);
    
    //         if(d1 >= 0 && d1 <= 1){
    //             from.lerp(to, d1, intersectionPoint);
    //             intersectionPoint.vsub(position, normal);
    //             normal.normalize();
    //             this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
    //         }
    
    //         if(this.result._shouldStop){
    //             return;
    //         }
    
    //         if(d2 >= 0 && d2 <= 1){
    //             from.lerp(to, d2, intersectionPoint);
    //             intersectionPoint.vsub(position, normal);
    //             normal.normalize();
    //             this.reportIntersection(normal, intersectionPoint, reportedShape, body, -1);
    //         }
    //     }
    // };
    // Ray.prototype[Shape.types.SPHERE] = Ray.prototype.intersectSphere;
    
    
    // var intersectConvex_normal = new Vec3();
    // var intersectConvex_minDistNormal = new Vec3();
    // var intersectConvex_minDistIntersect = new Vec3();
    // var intersectConvex_vector = new Vec3();
    
    // /**
    //  * @method intersectConvex
    //  * @private
    //  * @param  {Shape} shape
    //  * @param  {Quaternion} quat
    //  * @param  {Vec3} position
    //  * @param  {Body} body
    //  * @param {object} [options]
    //  * @param {array} [options.faceList]
    //  */
    // Ray.prototype.intersectConvex = function intersectConvex(
    //     shape,
    //     quat,
    //     position,
    //     body,
    //     reportedShape,
    //     options
    // ){
    //     var minDistNormal = intersectConvex_minDistNormal;
    //     var normal = intersectConvex_normal;
    //     var vector = intersectConvex_vector;
    //     var minDistIntersect = intersectConvex_minDistIntersect;
    //     var faceList = (options && options.faceList) || null;
    
    //     // 检查面
    //     var faces = shape.faces,
    //         vertices = shape.vertices,
    //         normals = shape.faceNormals;
    //     var direction = this._direction;
    
    //     var from = this.from;
    //     var to = this.to;
    //     var fromToDistance = from.distanceTo(to);
    
    //     var minDist = -1;
    //     var Nfaces = faceList ? faceList.length : faces.length;
    //     var result = this.result;
    
    //     for (var j = 0; !result._shouldStop && j < Nfaces; j++) {
    //         var fi = faceList ? faceList[j] : j;
    
    //         var face = faces[fi];
    //         var faceNormal = normals[fi];
    //         var q = quat;
    //         var x = position;
    
    //         // 确定射线是否相交
    //         // 注意：无论面部正常方向如何
    
    //         // 获取世界坐标的飞机点...
    //         vector.copy(vertices[face[0]]);
    //         q.vmult(vector,vector);
    //         vector.vadd(x,vector);
    
    //         // ...但是使其与射线相对。我们稍后再解决。
    //         vector.vsub(from,vector);
    
    //         // 使平面正常
    //         q.vmult(faceNormal,normal);
    
    //         // 如果该点产品为负，我们会有一些有趣的东西
    //         var dot = direction.dot(normal);
    
    //         // 如果射线和飞机是平行的，请救出
    //         if ( Math.abs( dot ) < this.precision ){
    //             continue;
    //         }
    
    //         // 计算距离飞机
    //         var scalar = normal.dot(vector) / dot;
    
    //         // 如果负距离，则平面在射线后面
    //         if (scalar < 0){
    //             continue;
    //         }
    
    //         // if（dot <0）{
    
    //         // 交点是从 +方向 *标量
    //         direction.mult(scalar,intersectPoint);
    //         intersectPoint.vadd(from,intersectPoint);
    
    //         // A是我们将点B和C与点B和C进行比较的点。
    //         a.copy(vertices[face[0]]);
    //         q.vmult(a,a);
    //         x.vadd(a,a);
    
    //         for(var i = 1; !result._shouldStop && i < face.length - 1; i++){
    //             // 将3个顶点转换为世界协调
    //             b.copy(vertices[face[i]]);
    //             c.copy(vertices[face[i+1]]);
    //             q.vmult(b,b);
    //             q.vmult(c,c);
    //             x.vadd(b,b);
    //             x.vadd(c,c);
    
    //             var distance = intersectPoint.distanceTo(from);
    
    //             if(!(pointInTriangle(intersectPoint, a, b, c) || pointInTriangle(intersectPoint, b, a, c)) || distance > fromToDistance){
    //                 continue;
    //             }
    
    //             this.reportIntersection(normal, intersectPoint, reportedShape, body, fi);
    //         }
    //         // }
    //     }
    // };
    // Ray.prototype[Shape.types.CONVEXPOLYHEDRON] = Ray.prototype.intersectConvex;
    
    // var intersectTrimesh_normal = new Vec3();
    // var intersectTrimesh_localDirection = new Vec3();
    // var intersectTrimesh_localFrom = new Vec3();
    // var intersectTrimesh_localTo = new Vec3();
    // var intersectTrimesh_worldNormal = new Vec3();
    // var intersectTrimesh_worldIntersectPoint = new Vec3();
    // var intersectTrimesh_localAABB = new AABB();
    // var intersectTrimesh_triangles = [];
    // var intersectTrimesh_treeTransform = new Transform();
    
    // /**
    //  * @method intersectTrimesh
    //  * @private
    //  * @param  {Shape} shape
    //  * @param  {Quaternion} quat
    //  * @param  {Vec3} position
    //  * @param  {Body} body
    //  * @param {object} [options]
    //  * @todo 通过将世界转变为本地空间来优化。
    //  * @todo 使用Octree查找
    //  */
    // Ray.prototype.intersectTrimesh = function intersectTrimesh(
    //     mesh,
    //     quat,
    //     position,
    //     body,
    //     reportedShape,
    //     options
    // ){
    //     var normal = intersectTrimesh_normal;
    //     var triangles = intersectTrimesh_triangles;
    //     var treeTransform = intersectTrimesh_treeTransform;
    //     var minDistNormal = intersectConvex_minDistNormal;
    //     var vector = intersectConvex_vector;
    //     var minDistIntersect = intersectConvex_minDistIntersect;
    //     var localAABB = intersectTrimesh_localAABB;
    //     var localDirection = intersectTrimesh_localDirection;
    //     var localFrom = intersectTrimesh_localFrom;
    //     var localTo = intersectTrimesh_localTo;
    //     var worldIntersectPoint = intersectTrimesh_worldIntersectPoint;
    //     var worldNormal = intersectTrimesh_worldNormal;
    //     var faceList = (options && options.faceList) || null;
    
    //     // 检查面
    //     var indices = mesh.indices,
    //         vertices = mesh.vertices,
    //         normals = mesh.faceNormals;
    
    //     var from = this.from;
    //     var to = this.to;
    //     var direction = this._direction;
    
    //     var minDist = -1;
    //     treeTransform.position.copy(position);
    //     treeTransform.quaternion.copy(quat);
    
    //     // 将射线转换为本地空间！
    //     Transform.vectorToLocalFrame(position, quat, direction, localDirection);
    //     Transform.pointToLocalFrame(position, quat, from, localFrom);
    //     Transform.pointToLocalFrame(position, quat, to, localTo);
    
    //     localTo.x *= mesh.scale.x;
    //     localTo.y *= mesh.scale.y;
    //     localTo.z *= mesh.scale.z;
    //     localFrom.x *= mesh.scale.x;
    //     localFrom.y *= mesh.scale.y;
    //     localFrom.z *= mesh.scale.z;
    
    //     localTo.vsub(localFrom, localDirection);
    //     localDirection.normalize();
    
    //     var fromToDistanceSquared = localFrom.distanceSquared(localTo);
    
    //     mesh.tree.rayQuery(this, treeTransform, triangles);
    
    //     for (var i = 0, N = triangles.length; !this.result._shouldStop && i !== N; i++) {
    //         var trianglesIndex = triangles[i];
    
    //         mesh.getNormal(trianglesIndex, normal);
    
    //         // 确定射线是否相交
    //         // 注意：无论面部正常方向如何
    
    //         // 获取世界坐标的飞机点...
    //         mesh.getVertex(indices[trianglesIndex * 3], a);
    
    //         // ...但是使其与射线相对。我们稍后再解决。
    //         a.vsub(localFrom,vector);
    
    //         // 如果该点产品为负，我们会有一些有趣的东西
    //         var dot = localDirection.dot(normal);
    
    //         // 如果射线和飞机是平行的，请救出
    //         // if（Math.abs（dot）<this.precision）{
    //         //     继续;
    //         // }
    
    //         // 计算距离飞机
    //         var scalar = normal.dot(vector) / dot;
    
    //         // 如果负距离，则平面在射线后面
    //         if (scalar < 0){
    //             continue;
    //         }
    
    //         // 交点是从 +方向 *标量
    //         localDirection.scale(scalar,intersectPoint);
    //         intersectPoint.vadd(localFrom,intersectPoint);
    
    //         // 获取三角顶点
    //         mesh.getVertex(indices[trianglesIndex * 3 + 1], b);
    //         mesh.getVertex(indices[trianglesIndex * 3 + 2], c);
    
    //         var squaredDistance = intersectPoint.distanceSquared(localFrom);
    
    //         if(!(pointInTriangle(intersectPoint, b, a, c) || pointInTriangle(intersectPoint, a, b, c)) || squaredDistance > fromToDistanceSquared){
    //             continue;
    //         }
    
    //         // 转变Internectpoint并正常变成世界
    //         Transform.vectorToWorldFrame(quat, normal, worldNormal);
    //         Transform.pointToWorldFrame(position, quat, intersectPoint, worldIntersectPoint);
    //         this.reportIntersection(worldNormal, worldIntersectPoint, reportedShape, body, trianglesIndex);
    //     }
    //     triangles.length = 0;
    // };
    // Ray.prototype[Shape.types.TRIMESH] = Ray.prototype.intersectTrimesh;
    
    
    // /**
    //  * @method reportIntersection
    //  * @private
    //  * @param  {Vec3} normal
    //  * @param  {Vec3} hitPointWorld
    //  * @param  {Shape} shape
    //  * @param  {Body} body
    //  * @return {boolean} 如果要继续
    //  */
    // Ray.prototype.reportIntersection = function(normal, hitPointWorld, shape, body, hitFaceIndex){
    //     var from = this.from;
    //     var to = this.to;
    //     var distance = from.distanceTo(hitPointWorld);
    //     var result = this.result;
    
    //     // 跳过后面？
    //     if(this.skipBackfaces && normal.dot(this._direction) > 0){
    //         return;
    //     }
    
    //     result.hitFaceIndex = typeof(hitFaceIndex) !== 'undefined' ? hitFaceIndex : -1;
    
    //     switch(this.mode){
    //     case Ray.ALL:
    //         this.hasHit = true;
    //         result.set(
    //             from,
    //             to,
    //             normal,
    //             hitPointWorld,
    //             shape,
    //             body,
    //             distance
    //         );
    //         result.hasHit = true;
    //         this.callback(result);
    //         break;
    
    //     case Ray.CLOSEST:
    
    //         // 存储如果比最接近的近距离
    //         if(distance < result.distance || !result.hasHit){
    //             this.hasHit = true;
    //             result.hasHit = true;
    //             result.set(
    //                 from,
    //                 to,
    //                 normal,
    //                 hitPointWorld,
    //                 shape,
    //                 body,
    //                 distance
    //             );
    //         }
    //         break;
    
    //     case Ray.ANY:
    
    //         // 报告并停止。
    //         this.hasHit = true;
    //         result.hasHit = true;
    //         result.set(
    //             from,
    //             to,
    //             normal,
    //             hitPointWorld,
    //             shape,
    //             body,
    //             distance
    //         );
    //         result._shouldStop = true;
    //         break;
    //     }
    // };
    
    var v0 = new Vec3(),
        intersect = new Vec3();
    function distanceFromIntersection(from, direction, position) {
    
        // V0是从到位置的向量
        position.vsub(from,v0);
        var dot = v0.dot(direction);
    
        // 相交=方向*点 +来自
        direction.mult(dot,intersect);
        intersect.vadd(from,intersect);
    
        var distance = position.distanceTo(intersect);
    
        return distance;
    }
    
    
    },{"../collision/AABB":3,"../collision/RaycastResult":9,"../math/Quaternion":18,"../math/Transform":19,"../math/Vec3":20,"../shapes/Box":22,"../shapes/ConvexPolyhedron":23,"../shapes/Shape":25}],9:[function(_dereq_,module,exports){
    var Vec3 = _dereq_('../math/Vec3');
    
    module.exports = RaycastResult;
    
    /**
     * 射线铸造数据的存储。
     * @class raycastresult
     * @constructor
     */
    function RaycastResult(){
    
        /**
         * @property {Vec3} rayFromWorld
         */
        this.rayFromWorld = new Vec3();
    
        /**
         * @property {Vec3} rayToWorld
         */
        this.rayToWorld = new Vec3();
    
        /**
         * @property {Vec3} hitNormalWorld
         */
        this.hitNormalWorld = new Vec3();
    
        /**
         * @property {Vec3} hitPointWorld
         */
        this.hitPointWorld = new Vec3();
    
        /**
         * @property {boolean} hasHit
         */
        this.hasHit = false;
    
        /**
         * 命中形状或无效。
         * @property {Shape} shape
         */
        this.shape = null;
    
        /**
         * 命中的身体或无效。
         * @property {Body} body
         */
        this.body = null;
    
        /**
         * 如果命中形状是Trimeh，则热门三角形的索引。
         * @property {number} hitFaceIndex
         * @default -1
         */
        this.hitFaceIndex = -1;
    
        /**
         * 距离击球的距离。如果没有命中，将设置为-1。
         * @property {number} distance
         * @default -1
         */
        this.distance = -1;
    
        /**
         * 如果射线应该停止穿越身体。
         * @private
         * @property {Boolean} _shouldStop
         * @default false
         */
        this._shouldStop = false;
    }
    
    /**
     * 重置所有结果数据。
     * @method reset
     */
    RaycastResult.prototype.reset = function () {
        this.rayFromWorld.setZero();
        this.rayToWorld.setZero();
        this.hitNormalWorld.setZero();
        this.hitPointWorld.setZero();
        this.hasHit = false;
        this.shape = null;
        this.body = null;
        this.hitFaceIndex = -1;
        this.distance = -1;
        this._shouldStop = false;
    };
    
    /**
     * @method abort
     */
    RaycastResult.prototype.abort = function(){
        this._shouldStop = true;
    };
    
    /**
     * @method set
     * @param {Vec3} rayFromWorld
     * @param {Vec3} rayToWorld
     * @param {Vec3} hitNormalWorld
     * @param {Vec3} hitPointWorld
     * @param {Shape} shape
     * @param {Body} body
     * @param {number} distance
     */
    RaycastResult.prototype.set = function(
        rayFromWorld,
        rayToWorld,
        hitNormalWorld,
        hitPointWorld,
        shape,
        body,
        distance
    ){
        this.rayFromWorld.copy(rayFromWorld);
        this.rayToWorld.copy(rayToWorld);
        this.hitNormalWorld.copy(hitNormalWorld);
        this.hitPointWorld.copy(hitPointWorld);
        this.shape = shape;
        this.body = body;
        this.distance = distance;
    };
    },{"../math/Vec3":20}],10:[function(_dereq_,module,exports){
    var Shape = _dereq_('../shapes/Shape');
    var Broadphase = _dereq_('../collision/Broadphase');
    
    module.exports = SAPBroadphase;
    
    /**
     * 沿着一个轴扫和修剪宽阔的斑点。
     *
     * @class Sapbroadphase
     * @constructor
     * @param {World} [world]
     * @extends Broadphase
     */
    function SAPBroadphase(world){
        Broadphase.apply(this);
    
        /**
         * 目前在宽泛的尸体清单。
         * @property Axislist
         * @type {Array}
         */
        this.axisList = [];
    
        /**
         * 世界要搜索。
         * @property 世界
         * @type {World}
         */
        this.world = null;
    
        /**
         * 轴以对身体进行分类。设置为x轴的0，y轴设置为1。为了获得最佳性能，请选择一个轴，使身体散布得更多。
         * @property AxisIndex
         * @type {Number}
         */
        this.axisIndex = 0;
    
        var axisList = this.axisList;
    
        this._addBodyHandler = function(e){
            axisList.push(e.body);
        };
    
        this._removeBodyHandler = function(e){
            var idx = axisList.indexOf(e.body);
            if(idx !== -1){
                axisList.splice(idx,1);
            }
        };
    
        if(world){
            this.setWorld(world);
        }
    }
    SAPBroadphase.prototype = new Broadphase();
    
    /**
     * 改变世界
     * @method setWorld
     * @param  {World} world
     */
    SAPBroadphase.prototype.setWorld = function(world){
        // 清除旧轴阵列
        this.axisList.length = 0;
    
        // 加入新世界的所有身体
        for(var i=0; i<world.bodies.length; i++){
            this.axisList.push(world.bodies[i]);
        }
    
        // 卸下旧处理程序，如果有的话
        world.removeEventListener("addBody", this._addBodyHandler);
        world.removeEventListener("removeBody", this._removeBodyHandler);
    
        // 添加处理程序以更新尸体列表。
        world.addEventListener("addBody", this._addBodyHandler);
        world.addEventListener("removeBody", this._removeBodyHandler);
    
        this.world = world;
        this.dirty = true;
    };
    
    /**
     * @static
     * @method insertionSortX
     * @param  {Array} a
     * @return {Array}
     */
    SAPBroadphase.insertionSortX = function(a) {
        for(var i=1,l=a.length;i<l;i++) {
            var v = a[i];
            for(var j=i - 1;j>=0;j--) {
                if(a[j].aabb.lowerBound.x <= v.aabb.lowerBound.x){
                    break;
                }
                a[j+1] = a[j];
            }
            a[j+1] = v;
        }
        return a;
    };
    
    /**
     * @static
     * @method insertionSortY
     * @param  {Array} a
     * @return {Array}
     */
    SAPBroadphase.insertionSortY = function(a) {
        for(var i=1,l=a.length;i<l;i++) {
            var v = a[i];
            for(var j=i - 1;j>=0;j--) {
                if(a[j].aabb.lowerBound.y <= v.aabb.lowerBound.y){
                    break;
                }
                a[j+1] = a[j];
            }
            a[j+1] = v;
        }
        return a;
    };
    
    /**
     * @static
     * @method insertionSortZ
     * @param  {Array} a
     * @return {Array}
     */
    SAPBroadphase.insertionSortZ = function(a) {
        for(var i=1,l=a.length;i<l;i++) {
            var v = a[i];
            for(var j=i - 1;j>=0;j--) {
                if(a[j].aabb.lowerBound.z <= v.aabb.lowerBound.z){
                    break;
                }
                a[j+1] = a[j];
            }
            a[j+1] = v;
        }
        return a;
    };
    
    /**
     * 收集所有碰撞对
     * @method collisionPairs
     * @param  {World} world
     * @param  {Array} p1
     * @param  {Array} p2
     */
    SAPBroadphase.prototype.collisionPairs = function(world,p1,p2){
        var bodies = this.axisList,
            N = bodies.length,
            axisIndex = this.axisIndex,
            i, j;
    
        if(this.dirty){
            this.sortList();
            this.dirty = false;
        }
    
        // 浏览清单
        for(i=0; i !== N; i++){
            var bi = bodies[i];
    
            for(j=i+1; j < N; j++){
                var bj = bodies[j];
    
                if(!this.needBroadphaseCollision(bi,bj)){
                    continue;
                }
    
                if(!SAPBroadphase.checkBounds(bi,bj,axisIndex)){
                    break;
                }
    
                this.intersectionTest(bi,bj,p1,p2);
            }
        }
    };
    
    SAPBroadphase.prototype.sortList = function(){
        var axisList = this.axisList;
        var axisIndex = this.axisIndex;
        var N = axisList.length;
    
        // 更新AABBS
        for(var i = 0; i!==N; i++){
            var bi = axisList[i];
            if(bi.aabbNeedsUpdate){
                bi.computeAABB();
            }
        }
    
        // 对列表进行排序
        if(axisIndex === 0){
            SAPBroadphase.insertionSortX(axisList);
        } else if(axisIndex === 1){
            SAPBroadphase.insertionSortY(axisList);
        } else if(axisIndex === 2){
            SAPBroadphase.insertionSortZ(axisList);
        }
    };
    
    /**
     * 检查两个物体的边界是否沿给定的SAP轴重叠。
     * @static
     * @method checkBounds
     * @param  {Body} bi
     * @param  {Body} bj
     * @param  {Number} axisIndex
     * @return {Boolean}
     */
    SAPBroadphase.checkBounds = function(bi, bj, axisIndex){
        var biPos;
        var bjPos;
    
        if(axisIndex === 0){
            biPos = bi.position.x;
            bjPos = bj.position.x;
        } else if(axisIndex === 1){
            biPos = bi.position.y;
            bjPos = bj.position.y;
        } else if(axisIndex === 2){
            biPos = bi.position.z;
            bjPos = bj.position.z;
        }
    
        var ri = bi.boundingRadius,
            rj = bj.boundingRadius,
            boundA1 = biPos - ri,
            boundA2 = biPos + ri,
            boundB1 = bjPos - rj,
            boundB2 = bjPos + rj;
    
        return boundB1 < boundA2;
    };
    
    /**
     * 计算身体位置的差异，并估算最佳
     * 使用的轴。将自动设置属性.xisindex。
     * @method autoDetectAxis
     */
    // SAPBroadphase.prototype.autoDetectAxis = function(){
    //     var sumX=0,
    //         sumX2=0,
    //         sumY=0,
    //         sumY2=0,
    //         sumZ=0,
    //         sumZ2=0,
    //         bodies = this.axisList,
    //         N = bodies.length,
    //         invN=1/N;
    
    //     for(var i=0; i!==N; i++){
    //         var b = bodies[i];
    
    //         var centerX = b.position.x;
    //         sumX += centerX;
    //         sumX2 += centerX*centerX;
    
    //         var centerY = b.position.y;
    //         sumY += centerY;
    //         sumY2 += centerY*centerY;
    
    //         var centerZ = b.position.z;
    //         sumZ += centerZ;
    //         sumZ2 += centerZ*centerZ;
    //     }
    
    //     var varianceX = sumX2 - sumX*sumX*invN,
    //         varianceY = sumY2 - sumY*sumY*invN,
    //         varianceZ = sumZ2 - sumZ*sumZ*invN;
    
    //     if(varianceX > varianceY){
    //         if(varianceX > varianceZ){
    //             this.axisIndex = 0;
    //         } else{
    //             this.axisIndex = 2;
    //         }
    //     } else if(varianceY > varianceZ){
    //         this.axisIndex = 1;
    //     } else{
    //         this.axisIndex = 2;
    //     }
    // };
    
    /**
     * 返回AABB中的所有尸体。
     * @method aabbQuery
     * @param  {World} world
     * @param  {AABB} aabb
     * @param {array} result 将产生的尸体存储在阵列中。
     * @return {array}
     */
    SAPBroadphase.prototype.aabbQuery = function(world, aabb, result){
        // result = result || [];
    
        // if(this.dirty){
        //     this.sortList();
        //     this.dirty = false;
        // }
    
        // var axisIndex = this.axisIndex, axis = 'x';
        // if(axisIndex === 1){ axis = 'y'; }
        // if(axisIndex === 2){ axis = 'z'; }
    
        // var axisList = this.axisList;
        // var lower = aabb.lowerBound[axis];
        // var upper = aabb.upperBound[axis];
        // for(var i = 0; i < axisList.length; i++){
        //     var b = axisList[i];
    
        //     if(b.aabbNeedsUpdate){
        //         b.computeAABB();
        //     }
    
        //     if(b.aabb.overlaps(aabb)){
        //         result.push(b);
        //     }
        // }
    
        // return result;
    };
    },{"../collision/Broadphase":5,"../shapes/Shape":25}],11:[function(_dereq_,module,exports){
    module.exports = ContactEquation;
    
    var Equation = _dereq_('./Equation');
    var Vec3 = _dereq_('../math/Vec3');
    var Mat3 = _dereq_('../math/Mat3');
    
    /**
     * 接触/非渗透约束方程
     * @class 接触式
     * @constructor
     * @author schteppe
     * @param {Body} bodyA
     * @param {Body} bodyB
     * @extends Equation
     */
    function ContactEquation(bodyA, bodyB, maxForce){
        maxForce = typeof(maxForce) !== 'undefined' ? maxForce : 1e6;
        Equation.call(this, bodyA, bodyB, 0, maxForce);
    
        /**
         * @property 归还
         * @type {Number}
         */
        this.restitution = 0.0; // “ Bounciness”：u1 = -e*u0
    
        /**
         * 面向世界的向量从BI的中心到接触点。
         * @property {Vec3} ri
         */
        this.ri = new Vec3();
    
        /**
         * 以世界为导向的向量从身体J位置开始，然后转到接触点。
         * @property {Vec3} rj
         */
        this.rj = new Vec3();
    
        /**
         * 联系正常，指出体内i。
         * @property {Vec3} ni
         */
        this.ni = new Vec3();
    }
    
    ContactEquation.prototype = new Equation();
    ContactEquation.prototype.constructor = ContactEquation;
    
    var ContactEquation_computeB_temp1 = new Vec3(); // 温度向量
    var ContactEquation_computeB_temp2 = new Vec3();
    var ContactEquation_computeB_temp3 = new Vec3();
    ContactEquation.prototype.computeB = function(h){
        var a = this.a,
            b = this.b,
            bi = this.bi,
            bj = this.bj,
            ri = this.ri,
            rj = this.rj,
            rixn = ContactEquation_computeB_temp1,
            rjxn = ContactEquation_computeB_temp2,
    
            vi = bi.velocity,
            wi = bi.angularVelocity,
            fi = bi.force,
            taui = bi.torque,
    
            vj = bj.velocity,
            wj = bj.angularVelocity,
            fj = bj.force,
            tauj = bj.torque,
    
            penetrationVec = ContactEquation_computeB_temp3,
    
            GA = this.jacobianElementA,
            GB = this.jacobianElementB,
    
            n = this.ni;
    
        // 计算跨产品
        ri.cross(n,rixn);
        rj.cross(n,rjxn);
    
        // g = xjj+rj-（xi+ri）
        // g = [-nixnn n ni rxn n rrxn]
        n.negate(GA.spatial);
        rixn.negate(GA.rotational);
        GB.spatial.copy(n);
        GB.rotational.copy(rjxn);
    
        // 计算渗透载体
        penetrationVec.copy(bj.position);
        penetrationVec.vadd(rj,penetrationVec);
        penetrationVec.vsub(bi.position,penetrationVec);
        penetrationVec.vsub(ri,penetrationVec);
    
        var g = n.dot(penetrationVec);
    
        // 计算迭代
        var ePlusOne = this.restitution + 1;
        var GW = ePlusOne * vj.dot(n) - ePlusOne * vi.dot(n) + wj.dot(rjxn) - wi.dot(rixn);
        var GiMf = this.computeGiMf();
    
        var B = - g * a - GW * b - h*GiMf;
    
        return B;
    };
    
    var ContactEquation_getImpactVelocityAlongNormal_vi = new Vec3();
    var ContactEquation_getImpactVelocityAlongNormal_vj = new Vec3();
    var ContactEquation_getImpactVelocityAlongNormal_xi = new Vec3();
    var ContactEquation_getImpactVelocityAlongNormal_xj = new Vec3();
    var ContactEquation_getImpactVelocityAlongNormal_relVel = new Vec3();
    
    /**
     * 在接触点中获取当前的相对速度。
     * @method getImpactVelocityAlongNormal
     * @return {number}
     */
    ContactEquation.prototype.getImpactVelocityAlongNormal = function(){
        var vi = ContactEquation_getImpactVelocityAlongNormal_vi;
        var vj = ContactEquation_getImpactVelocityAlongNormal_vj;
        var xi = ContactEquation_getImpactVelocityAlongNormal_xi;
        var xj = ContactEquation_getImpactVelocityAlongNormal_xj;
        var relVel = ContactEquation_getImpactVelocityAlongNormal_relVel;
    
        this.bi.position.vadd(this.ri, xi);
        this.bj.position.vadd(this.rj, xj);
    
        this.bi.getVelocityAtWorldPoint(xi, vi);
        this.bj.getVelocityAtWorldPoint(xj, vj);
    
        vi.vsub(vj, relVel);
    
        return this.ni.dot(relVel);
    };
    
    
    },{"../math/Mat3":17,"../math/Vec3":20,"./Equation":12}],12:[function(_dereq_,module,exports){
    module.exports = Equation;
    
    var JacobianElement = _dereq_('../math/JacobianElement'),
        Vec3 = _dereq_('../math/Vec3');
    
    /**
     * 方程式基类
     * @class 方程
     * @constructor
     * @author schteppe
     * @param {Body} bi
     * @param {Body} bj
     * @param {Number} minForce 最小值（读：负）将通过约束施加的力。
     * @param {Number} maxForce 最大（读取：正）力将由约束施加。
     */
    function Equation(bi,bj,minForce,maxForce){
        this.id = Equation.id++;
    
        /**
         * @property {number} minForce
         */
        this.minForce = typeof(minForce)==="undefined" ? -1e6 : minForce;
    
        /**
         * @property {number} maxForce
         */
        this.maxForce = typeof(maxForce)==="undefined" ? 1e6 : maxForce;
    
        /**
         * @property 与
         * @type {Body}
         */
        this.bi = bi;
    
        /**
         * @property BJ
         * @type {Body}
         */
        this.bj = bj;
    
        /**
         * 怪异参数
         * @property {number} a
         */
        this.a = 0.0;
    
        /**
         * 怪异参数
         * @property {number} b
         */
        this.b = 0.0;
    
        /**
         * 怪异参数
         * @property {number} eps
         */
        this.eps = 0.0;
    
        /**
         * @property {JacobianElement} jacobianElementA
         */
        this.jacobianElementA = new JacobianElement();
    
        /**
         * @property {JacobianElement} jacobianElementB
         */
        this.jacobianElementB = new JacobianElement();
    
        /**
         * @property {boolean} enabled
         * @default true
         */
        this.enabled = true;
    
        /**
         * 一个与添加到身体的力成正比的数字。
         * @property {number} multiplier
         * @readonly
         */
        this.multiplier = 0;
    
        // 设置典型的螺旋参数
        this.setSpookParams(1e7,4,1/60);
    }
    Equation.prototype.constructor = Equation;
    
    Equation.id = 0;
    
    /**
     * 重新计算A，B，EPS。
     * @method setSpookParams
     */
    Equation.prototype.setSpookParams = function(stiffness,relaxation,timeStep){
        var d = relaxation,
            k = stiffness,
            h = timeStep;
        this.a = 4.0 / (h * (1 + 4 * d));
        this.b = (4.0 * d) / (1 + 4 * d);
        this.eps = 4.0 / (h * h * k * (1 + 4 * d));
    };
    
    /**
     * 计算怪异方程的RHS
     * @method computeB
     * @return {Number}
     */
    Equation.prototype.computeB = function(a,b,h){
        var GW = this.computeGW(),
            Gq = this.computeGq(),
            GiMf = this.computeGiMf();
        return - Gq * a - GW * b - GiMf*h;
    };
    
    /**
     * 计算g*q，其中q是广义的身体坐标
     * @method computeGq
     * @return {Number}
     */
    Equation.prototype.computeGq = function(){
        var GA = this.jacobianElementA,
            GB = this.jacobianElementB,
            bi = this.bi,
            bj = this.bj,
            xi = bi.position,
            xj = bj.position;
        return GA.spatial.dot(xi) + GB.spatial.dot(xj);
    };
    
    var zero = new Vec3();
    
    /**
     * 计算g*w，其中w是身体速度
     * @method computeGW
     * @return {Number}
     */
    Equation.prototype.computeGW = function(){
        var GA = this.jacobianElementA,
            GB = this.jacobianElementB,
            bi = this.bi,
            bj = this.bj,
            vi = bi.velocity,
            vj = bj.velocity,
            wi = bi.angularVelocity,
            wj = bj.angularVelocity;
        return GA.multiplyVectors(vi,wi) + GB.multiplyVectors(vj,wj);
    };
    
    
    /**
     * 计算g*wlambda，其中w是身体速度
     * @method computeGWlambda
     * @return {Number}
     */
    Equation.prototype.computeGWlambda = function(){
        var GA = this.jacobianElementA,
            GB = this.jacobianElementB,
            bi = this.bi,
            bj = this.bj,
            vi = bi.vlambda,
            vj = bj.vlambda,
            wi = bi.wlambda,
            wj = bj.wlambda;
        return GA.multiplyVectors(vi,wi) + GB.multiplyVectors(vj,wj);
    };
    
    /**
     * 计算G*Inv（M）*F，其中M是每个身体的质量基质，而F是身体上的力。
     * @method computeGiMf
     * @return {Number}
     */
    var iMfi = new Vec3(),
        iMfj = new Vec3(),
        invIi_vmult_taui = new Vec3(),
        invIj_vmult_tauj = new Vec3();
    Equation.prototype.computeGiMf = function(){
        var GA = this.jacobianElementA,
            GB = this.jacobianElementB,
            bi = this.bi,
            bj = this.bj,
            fi = bi.force,
            ti = bi.torque,
            fj = bj.force,
            tj = bj.torque,
            invMassi = bi.invMassSolve,
            invMassj = bj.invMassSolve;
    
        fi.scale(invMassi,iMfi);
        fj.scale(invMassj,iMfj);
    
        bi.invInertiaWorldSolve.vmult(ti,invIi_vmult_taui);
        bj.invInertiaWorldSolve.vmult(tj,invIj_vmult_tauj);
    
        return GA.multiplyVectors(iMfi,invIi_vmult_taui) + GB.multiplyVectors(iMfj,invIj_vmult_tauj);
    };
    
    /**
     * 计算G*Inv（M）*G'
     * @method computeGiMGt
     * @return {Number}
     */
    var tmp = new Vec3();
    Equation.prototype.computeGiMGt = function(){
        var GA = this.jacobianElementA,
            GB = this.jacobianElementB,
            bi = this.bi,
            bj = this.bj,
            invMassi = bi.invMassSolve,
            invMassj = bj.invMassSolve,
            invIi = bi.invInertiaWorldSolve,
            invIj = bj.invInertiaWorldSolve,
            result = invMassi + invMassj;
    
        invIi.vmult(GA.rotational,tmp);
        result += tmp.dot(GA.rotational);
    
        invIj.vmult(GB.rotational,tmp);
        result += tmp.dot(GB.rotational);
    
        return  result;
    };
    
    var addToWlambda_temp = new Vec3(),
        addToWlambda_Gi = new Vec3(),
        addToWlambda_Gj = new Vec3(),
        addToWlambda_ri = new Vec3(),
        addToWlambda_rj = new Vec3(),
        addToWlambda_Mdiag = new Vec3();
    
    /**
     * 向身体增加约束速度。
     * @method addToWlambda
     * @param {Number} deltalambda
     */
    Equation.prototype.addToWlambda = function(deltalambda){
        var GA = this.jacobianElementA,
            GB = this.jacobianElementB,
            bi = this.bi,
            bj = this.bj,
            temp = addToWlambda_temp;
    
        // 添加到线性速度
        // v_lambda += inv（m） *delta_lamba *g
        bi.vlambda.addScaledVector(bi.invMassSolve * deltalambda, GA.spatial, bi.vlambda);
        bj.vlambda.addScaledVector(bj.invMassSolve * deltalambda, GB.spatial, bj.vlambda);
    
        // 添加到角速度
        bi.invInertiaWorldSolve.vmult(GA.rotational,temp);
        bi.wlambda.addScaledVector(deltalambda, temp, bi.wlambda);
    
        bj.invInertiaWorldSolve.vmult(GB.rotational,temp);
        bj.wlambda.addScaledVector(deltalambda, temp, bj.wlambda);
    };
    
    /**
     * 计算螺旋方程的分母部分：C = G*Inv（M）*G' + EPS
     * @method computeInvC
     * @param  {Number} eps
     * @return {Number}
     */
    Equation.prototype.computeC = function(){
        return this.computeGiMGt() + this.eps;
    };
    
    },{"../math/JacobianElement":16,"../math/Vec3":20}],13:[function(_dereq_,module,exports){
    module.exports = FrictionEquation;
    
    var Equation = _dereq_('./Equation');
    var Vec3 = _dereq_('../math/Vec3');
    var Mat3 = _dereq_('../math/Mat3');
    
    /**
     * 沿切线约束触点的滑动
     * @class 摩擦等
     * @constructor
     * @author schteppe
     * @param {Body} bodyA
     * @param {Body} bodyB
     * @param {Number} slipForce 应该为 +-f_friction = +-mu *f_normal = +-mu *m *g
     * @extends Equation
     */
    function FrictionEquation(bodyA, bodyB, slipForce){
        Equation.call(this,bodyA, bodyB, -slipForce, slipForce);
        this.ri = new Vec3();
        this.rj = new Vec3();
        this.t = new Vec3(); // 切线
    }
    
    FrictionEquation.prototype = new Equation();
    FrictionEquation.prototype.constructor = FrictionEquation;
    
    var FrictionEquation_computeB_temp1 = new Vec3();
    var FrictionEquation_computeB_temp2 = new Vec3();
    FrictionEquation.prototype.computeB = function(h){
        var a = this.a,
            b = this.b,
            bi = this.bi,
            bj = this.bj,
            ri = this.ri,
            rj = this.rj,
            rixt = FrictionEquation_computeB_temp1,
            rjxt = FrictionEquation_computeB_temp2,
            t = this.t;
    
        // 计算跨产品
        ri.cross(t,rixt);
        rj.cross(t,rjxt);
    
        // g = [-t -rixt t rjxt]
        // 请记住，这是纯粹的速度约束，G总是零！
        var GA = this.jacobianElementA,
            GB = this.jacobianElementB;
        t.negate(GA.spatial);
        rixt.negate(GA.rotational);
        GB.spatial.copy(t);
        GB.rotational.copy(rjxt);
    
        var GW = this.computeGW();
        var GiMf = this.computeGiMf();
    
        var B = - GW * b - h * GiMf;
    
        return B;
    };
    
    },{"../math/Mat3":17,"../math/Vec3":20,"./Equation":12}],14:[function(_dereq_,module,exports){
    var Utils = _dereq_('../utils/Utils');
    
    module.exports = ContactMaterial;
    
    /**
     * 定义两种材料相遇时会发生什么。
     * @class 联系人材料
     * @constructor
     * @param {Material} m1
     * @param {Material} m2
     * @param {object} [options]
     * @param {Number} [options.friction=0.3]
     * @param {Number} [options.restitution=0.3]
     * @param {number} [options.contactEquationStiffness=1e7]
     * @param {number} [options.contactEquationRelaxation=3]
     * @param {number} [options.frictionEquationStiffness=1e7]
     * @param {Number} [options.frictionEquationRelaxation=3]
     */
    function ContactMaterial(m1, m2, options){
        options = Utils.defaults(options, {
            friction: 0.3,
            restitution: 0.3,
            contactEquationStiffness: 1e7,
            contactEquationRelaxation: 3,
            frictionEquationStiffness: 1e7,
            frictionEquationRelaxation: 3
        });
    
        /**
         * 该材料的标识符
         * @property {Number} id
         */
        this.id = ContactMaterial.idCounter++;
    
        /**
         * 参与材料
         * @property {Array} materials
         * @todo  应该是。材料和材料
         */
        this.materials = [m1, m2];
    
        /**
         * 摩擦系数
         * @property {Number} friction
         */
        this.friction = options.friction;
    
        /**
         * 恢复系数
         * @property {Number} restitution
         */
        this.restitution = options.restitution;
    
        /**
         * 产生的接触方程的刚度
         * @property {Number} contactEquationStiffness
         */
        this.contactEquationStiffness = options.contactEquationStiffness;
    
        /**
         * 产生的接触方程的放松时间
         * @property {Number} contactEquationRelaxation
         */
        this.contactEquationRelaxation = options.contactEquationRelaxation;
    
        /**
         * 产生的摩擦方程的刚度
         * @property {Number} frictionEquationStiffness
         */
        this.frictionEquationStiffness = options.frictionEquationStiffness;
    
        /**
         * 产生摩擦方程的放松时间
         * @property {Number} frictionEquationRelaxation
         */
        this.frictionEquationRelaxation = options.frictionEquationRelaxation;
    }
    
    ContactMaterial.idCounter = 0;
    
    },{"../utils/Utils":32}],15:[function(_dereq_,module,exports){
    module.exports = Material;
    
    /**
     * 定义物理材料。
     * @class 材料
     * @constructor
     * @param {object} [options]
     * @author schteppe
     */
    function Material(options){
        var name = '';
        options = options || {};
    
        // 向后兼容性修复
        if(typeof(options) === 'string'){
            name = options;
            options = {};
        } else if(typeof(options) === 'object') {
            name = '';
        }
    
        /**
         * @property 姓名
         * @type {String}
         */
        this.name = name;
    
        /**
         * 材料ID。
         * @property ID
         * @type {number}
         */
        this.id = Material.idCounter++;
    
        /**
         * 这种材料的摩擦。如果非负数，则将使用它代替接触材料给出的摩擦。如果没有匹配的接触式材料，则将使用来自.defaultContactMaterial的价值。
         * @property {number} friction
         */
        this.friction = typeof(options.friction) !== 'undefined' ? options.friction : -1;
    
        /**
         * 对此材料的恢复原状。如果不负，则将使用它代替接触材料给出的恢复原状。如果没有匹配的接触式材料，则将使用来自.defaultContactMaterial的价值。
         * @property {number} restitution
         */
        this.restitution = typeof(options.restitution) !== 'undefined' ? options.restitution : -1;
    }
    
    Material.idCounter = 0;
    
    },{}],16:[function(_dereq_,module,exports){
    module.exports = JacobianElement;
    
    var Vec3 = _dereq_('./Vec3');
    
    /**
     * 一个包含6个条目的元素，3个空间和3个旋转自由度。
     * @class 雅各布元素
     * @constructor
     */
    function JacobianElement(){
    
        /**
         * @property {Vec3} spatial
         */
        this.spatial = new Vec3();
    
        /**
         * @property {Vec3} rotational
         */
        this.rotational = new Vec3();
    }
    
    /**
     * 与其他Jacobianlement倍增
     * @method multiplyElement
     * @param  {JacobianElement} element
     * @return {Number}
     */
    JacobianElement.prototype.multiplyElement = function(element){
        return element.spatial.dot(this.spatial) + element.rotational.dot(this.rotational);
    };
    
    /**
     * 乘以两个向量
     * @method multiplyVectors
     * @param  {Vec3} spatial
     * @param  {Vec3} rotational
     * @return {Number}
     */
    JacobianElement.prototype.multiplyVectors = function(spatial,rotational){
        return spatial.dot(this.spatial) + rotational.dot(this.rotational);
    };
    
    },{"./Vec3":20}],17:[function(_dereq_,module,exports){
    module.exports = Mat3;
    
    var Vec3 = _dereq_('./Vec3');
    
    /**
     * 一个3x3矩阵。
     * @class MAT3
     * @constructor
     * @param array 九个元素的元素阵列。选修的。
     * @author schteppe /http://github.com/schteppe
     */
    function Mat3(elements){
        /**
         * 长度9的向量，包含所有矩阵元素
         * @property {Array} elements
         */
        if(elements){
            this.elements = elements;
        } else {
            this.elements = [0,0,0,0,0,0,0,0,0];
        }
    }
    
    /**
     * 将矩阵设置为身份
     * @method identity
     * @todo 也许应该将其重命名为SetIdentity（），以便更清楚。
     * @todo 创建另一个立即创建身份矩阵的函数。眼睛（）
     */
    Mat3.prototype.identity = function(){
        var e = this.elements;
        e[0] = 1;
        e[1] = 0;
        e[2] = 0;
    
        e[3] = 0;
        e[4] = 1;
        e[5] = 0;
    
        e[6] = 0;
        e[7] = 0;
        e[8] = 1;
    };
    
    /**
     * 将所有元素设置为零
     * @method setZero
     */
    Mat3.prototype.setZero = function(){
        var e = this.elements;
        e[0] = 0;
        e[1] = 0;
        e[2] = 0;
        e[3] = 0;
        e[4] = 0;
        e[5] = 0;
        e[6] = 0;
        e[7] = 0;
        e[8] = 0;
    };
    
    /**
     * 从VEC3设置矩阵对角线元素
     * @method setTrace
     * @param {Vec3} vec3
     */
    Mat3.prototype.setTrace = function(vec3){
        var e = this.elements;
        e[0] = vec3.x;
        e[4] = vec3.y;
        e[8] = vec3.z;
    };
    
    /**
     * 获取矩阵对角线元素
     * @method getTrace
     * @return {Vec3}
     */
    Mat3.prototype.getTrace = function(target){
        var target = target || new Vec3();
        var e = this.elements;
        target.x = e[0];
        target.y = e[4];
        target.z = e[8];
    };
    
    /**
     * 矩阵矢量乘法
     * @method vmult
     * @param {Vec3} v 向量乘以
     * @param {Vec3} target 可选的，目标以节省结果。
     */
    Mat3.prototype.vmult = function(v,target){
        target = target || new Vec3();
    
        var e = this.elements,
            x = v.x,
            y = v.y,
            z = v.z;
        target.x = e[0]*x + e[1]*y + e[2]*z;
        target.y = e[3]*x + e[4]*y + e[5]*z;
        target.z = e[6]*x + e[7]*y + e[8]*z;
    
        return target;
    };
    
    /**
     * 矩阵量表乘法
     * @method smult
     * @param {Number} s
     */
    Mat3.prototype.smult = function(s){
        for(var i=0; i<this.elements.length; i++){
            this.elements[i] *= s;
        }
    };
    
    /**
     * 矩阵乘法
     * @method mmult
     * @param {Mat3} m 矩阵从左侧乘以。
     * @return {Mat3} 结果。
     */
    Mat3.prototype.mmult = function(m,target){
        var r = target || new Mat3();
        for(var i=0; i<3; i++){
            for(var j=0; j<3; j++){
                var sum = 0.0;
                for(var k=0; k<3; k++){
                    sum += m.elements[i+k*3] * this.elements[k+j*3];
                }
                r.elements[i+j*3] = sum;
            }
        }
        return r;
    };
    
    /**
     * 缩放矩阵的每一列
     * @method scale
     * @param {Vec3} v
     * @return {Mat3} 结果。
     */
    Mat3.prototype.scale = function(v,target){
        target = target || new Mat3();
        var e = this.elements,
            t = target.elements;
        for(var i=0; i!==3; i++){
            t[3*i + 0] = v.x * e[3*i + 0];
            t[3*i + 1] = v.y * e[3*i + 1];
            t[3*i + 2] = v.z * e[3*i + 2];
        }
        return target;
    };
    
    /**
     * 解决ax = b
     * @method solve
     * @param {Vec3} b 右侧
     * @param {Vec3} target 选修的。目标向量可以节省。
     * @return {Vec3} 解决方案x
     * @todo 应该重复使用阵列
     */
    Mat3.prototype.solve = function(b,target){
        target = target || new Vec3();
    
        // 构建方程
        var nr = 3; // num行
        var nc = 4; // 数字
        var eqns = [];
        for(var i=0; i<nr*nc; i++){
            eqns.push(0);
        }
        var i,j;
        for(i=0; i<3; i++){
            for(j=0; j<3; j++){
                eqns[i+nc*j] = this.elements[i+3*j];
            }
        }
        eqns[3+4*0] = b.x;
        eqns[3+4*1] = b.y;
        eqns[3+4*2] = b.z;
    
        // 计算矩阵的右上三角版本 -高斯消除
        var n = 3, k = n, np;
        var kp = 4; // num行
        var p, els;
        do {
            i = k - n;
            if (eqns[i+nc*i] === 0) {
                // 枢轴为null，交换线
                for (j = i + 1; j < k; j++) {
                    if (eqns[i+nc*j] !== 0) {
                        np = kp;
                        do {  // 线（i）=线（i） +线（k）
                            p = kp - np;
                            eqns[p+nc*i] += eqns[p+nc*j];
                        } while (--np);
                        break;
                    }
                }
            }
            if (eqns[i+nc*i] !== 0) {
                for (j = i + 1; j < k; j++) {
                    var multiplier = eqns[i+nc*j] / eqns[i+nc*i];
                    np = kp;
                    do {  // 线（k）= line（k） -乘 *线（i）
                        p = kp - np;
                        eqns[p+nc*j] = p <= i ? 0 : eqns[p+nc*j] - eqns[p+nc*i] * multiplier ;
                    } while (--np);
                }
            }
        } while (--n);
    
        // 获取解决方案
        target.z = eqns[2*nc+3] / eqns[2*nc+2];
        target.y = (eqns[1*nc+3] - eqns[1*nc+2]*target.z) / eqns[1*nc+1];
        target.x = (eqns[0*nc+3] - eqns[0*nc+2]*target.z - eqns[0*nc+1]*target.y) / eqns[0*nc+0];
    
        if(isNaN(target.x) || isNaN(target.y) || isNaN(target.z) || target.x===Infinity || target.y===Infinity || target.z===Infinity){
            throw "Could not solve equation! Got x=["+target.toString()+"], b=["+b.toString()+"], A=["+this.toString()+"]";
        }
    
        return target;
    };
    
    /**
     * 通过索引在矩阵中获取一个元素。索引从0开始，不是1 ！！！
     * @method e
     * @param {Number} row
     * @param {Number} column
     * @param {Number} value 选修的。如果提供，矩阵元素将设置为此值。
     * @return {Number}
     */
    Mat3.prototype.e = function( row , column ,value){
        if(value===undefined){
            return this.elements[column+3*row];
        } else {
            // 设定值
            this.elements[column+3*row] = value;
        }
    };
    
    /**
     * 将另一个矩阵复制到此矩阵对象中。
     * @method copy
     * @param {Mat3} source
     * @return {Mat3} 这
     */
    Mat3.prototype.copy = function(source){
        for(var i=0; i < source.elements.length; i++){
            this.elements[i] = source.elements[i];
        }
        return this;
    };
    
    /**
     * 返回矩阵的字符串表示。
     * @method toString
     * @return 细绳
     */
    Mat3.prototype.toString = function(){
        var r = "";
        var sep = ",";
        for(var i=0; i<9; i++){
            r += this.elements[i] + sep;
        }
        return r;
    };
    
    /**
     * 反向矩阵
     * @method reverse
     * @param {Mat3} target 选修的。目标矩阵保存。
     * @return {Mat3} 解决方案x
     */
    Mat3.prototype.reverse = function(target){
    
        target = target || new Mat3();
    
        // 构建方程
        var nr = 3; // num行
        var nc = 6; // 数字
        var eqns = [];
        for(var i=0; i<nr*nc; i++){
            eqns.push(0);
        }
        var i,j;
        for(i=0; i<3; i++){
            for(j=0; j<3; j++){
                eqns[i+nc*j] = this.elements[i+3*j];
            }
        }
        eqns[3+6*0] = 1;
        eqns[3+6*1] = 0;
        eqns[3+6*2] = 0;
        eqns[4+6*0] = 0;
        eqns[4+6*1] = 1;
        eqns[4+6*2] = 0;
        eqns[5+6*0] = 0;
        eqns[5+6*1] = 0;
        eqns[5+6*2] = 1;
    
        // 计算矩阵的右上三角版本 -高斯消除
        var n = 3, k = n, np;
        var kp = nc; // num行
        var p;
        do {
            i = k - n;
            if (eqns[i+nc*i] === 0) {
                // 枢轴为null，交换线
                for (j = i + 1; j < k; j++) {
                    if (eqns[i+nc*j] !== 0) {
                        np = kp;
                        do { // 做线（i）=线（i） +线（k）
                            p = kp - np;
                            eqns[p+nc*i] += eqns[p+nc*j];
                        } while (--np);
                        break;
                    }
                }
            }
            if (eqns[i+nc*i] !== 0) {
                for (j = i + 1; j < k; j++) {
                    var multiplier = eqns[i+nc*j] / eqns[i+nc*i];
                    np = kp;
                    do { // do line（k）= line（k） -乘数 *线（i）
                        p = kp - np;
                        eqns[p+nc*j] = p <= i ? 0 : eqns[p+nc*j] - eqns[p+nc*i] * multiplier ;
                    } while (--np);
                }
            }
        } while (--n);
    
        // 消除矩阵的左上三角
        i = 2;
        do {
            j = i-1;
            do {
                var multiplier = eqns[i+nc*j] / eqns[i+nc*i];
                np = nc;
                do {
                    p = nc - np;
                    eqns[p+nc*j] =  eqns[p+nc*j] - eqns[p+nc*i] * multiplier ;
                } while (--np);
            } while (j--);
        } while (--i);
    
        // 对角线的操作
        i = 2;
        do {
            var multiplier = 1 / eqns[i+nc*i];
            np = nc;
            do {
                p = nc - np;
                eqns[p+nc*i] = eqns[p+nc*i] * multiplier ;
            } while (--np);
        } while (i--);
    
        i = 2;
        do {
            j = 2;
            do {
                p = eqns[nr+j+nc*i];
                if( isNaN( p ) || p ===Infinity ){
                    throw "Could not reverse! A=["+this.toString()+"]";
                }
                target.e( i , j , p );
            } while (j--);
        } while (i--);
    
        return target;
    };
    
    /**
     * 将矩阵从四元组设置
     * @method setRotationFromQuaternion
     * @param {Quaternion} q
     */
    Mat3.prototype.setRotationFromQuaternion = function( q ) {
        var x = q.x, y = q.y, z = q.z, w = q.w,
            x2 = x + x, y2 = y + y, z2 = z + z,
            xx = x * x2, xy = x * y2, xz = x * z2,
            yy = y * y2, yz = y * z2, zz = z * z2,
            wx = w * x2, wy = w * y2, wz = w * z2,
            e = this.elements;
    
        e[3*0 + 0] = 1 - ( yy + zz );
        e[3*0 + 1] = xy - wz;
        e[3*0 + 2] = xz + wy;
    
        e[3*1 + 0] = xy + wz;
        e[3*1 + 1] = 1 - ( xx + zz );
        e[3*1 + 2] = yz - wx;
    
        e[3*2 + 0] = xz - wy;
        e[3*2 + 1] = yz + wx;
        e[3*2 + 2] = 1 - ( xx + yy );
    
        return this;
    };
    
    /**
     * 转置矩阵
     * @method transpose
     * @param  {Mat3} target 在哪里存储结果。
     * @return {Mat3} 目标MAT3或新MAT3如果省略了目标。
     */
    Mat3.prototype.transpose = function( target ) {
        target = target || new Mat3();
    
        var Mt = target.elements,
            M = this.elements;
    
        for(var i=0; i!==3; i++){
            for(var j=0; j!==3; j++){
                Mt[3*i + j] = M[3*j + i];
            }
        }
    
        return target;
    };
    
    },{"./Vec3":20}],18:[function(_dereq_,module,exports){
    module.exports = Quaternion;
    
    var Vec3 = _dereq_('./Vec3');
    
    /**
     * 四元建筑描述了3D空间中的旋转。四元组在数学上定义为q = x*i + y*j + z*k + w，其中（i，j，k）是虚构的基础向量。 （x，y，z）可以看作是与旋转轴相关的向量，而真实的乘数W与旋转量有关。
     * @class 季节
     * @constructor
     * @param {Number} x 虚构基础向量i的乘数。
     * @param {Number} y 假想基矢量的乘数j。
     * @param {Number} z 假想基矢量k的乘数。
     * @param {Number} w 真实部分的乘数。
     * @see http://en.wikipedia.org/wiki/Quaternion
     */
    function Quaternion(x,y,z,w){
        /**
         * @property {Number} x
         */
        this.x = x!==undefined ? x : 0;
    
        /**
         * @property {Number} y
         */
        this.y = y!==undefined ? y : 0;
    
        /**
         * @property {Number} z
         */
        this.z = z!==undefined ? z : 0;
    
        /**
         * 实际四个基础矢量的乘数。
         * @property {Number} w
         */
        this.w = w!==undefined ? w : 1;
    }
    
    /**
     * 设置四合一的值。
     * @method set
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @param {Number} w
     */
    Quaternion.prototype.set = function(x,y,z,w){
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    };
    
    /**
     * 转换为可读格式
     * @method toString
     * @return 细绳
     */
    Quaternion.prototype.toString = function(){
        return this.x+","+this.y+","+this.z+","+this.w;
    };
    
    /**
     * 转换为阵列
     * @method toArray
     * @return 大批
     */
    Quaternion.prototype.toArray = function(){
        return [this.x, this.y, this.z, this.w];
    };
    
    /**
     * 设置给定轴和角度的四元组件。
     * @method setFromAxisAngle
     * @param {Vec3} axis
     * @param {Number} angle 在弧度
     */
    Quaternion.prototype.setFromAxisAngle = function(axis,angle){
        var s = Math.sin(angle*0.5);
        this.x = axis.x * s;
        this.y = axis.y * s;
        this.z = axis.z * s;
        this.w = Math.cos(angle*0.5);
        return this;
    };
    
    /**
     * 将四个转换为轴/角度表示。
     * @method toAxisAngle
     * @param {Vec3} [targetAxis] 重复使用轴的向量对象。
     * @return {Array} 阵列，第一个Elemnt是轴，第二个是弧度的角度。
     */
    Quaternion.prototype.toAxisAngle = function(targetAxis){
        targetAxis = targetAxis || new Vec3();
        this.normalize(); // 如果w> 1 ACO和SQRT会产生错误，则如果将Quaternion归一化，则不会发生这种错误
        var angle = 2 * Math.acos(this.w);
        var s = Math.sqrt(1-this.w*this.w); // 假设四元建立归一化，则w小于1，因此术语始终为正。
        if (s < 0.001) { // 测试避免除以零，因此S始终是阳性的。
            // 如果s接近零，则轴方向不重要
            targetAxis.x = this.x; // 如果将轴标准化很重要，则替换为x = 1; y = z = 0;
            targetAxis.y = this.y;
            targetAxis.z = this.z;
        } else {
            targetAxis.x = this.x / s; // 标准化轴
            targetAxis.y = this.y / s;
            targetAxis.z = this.z / s;
        }
        return [targetAxis,angle];
    };
    
    var sfv_t1 = new Vec3(),
        sfv_t2 = new Vec3();
    
    /**
     * 设置给定两个向量的四元价值。由此产生的旋转将是将U旋转到V所需的旋转。
     * @method setFromVectors
     * @param {Vec3} u
     * @param {Vec3} v
     */
    Quaternion.prototype.setFromVectors = function(u,v){
        if(u.isAntiparallelTo(v)){
            var t1 = sfv_t1;
            var t2 = sfv_t2;
    
            u.tangents(t1,t2);
            this.setFromAxisAngle(t1,Math.PI);
        } else {
            var a = u.cross(v);
            this.x = a.x;
            this.y = a.y;
            this.z = a.z;
            this.w = Math.sqrt(Math.pow(u.norm(),2) * Math.pow(v.norm(),2)) + u.dot(v);
            this.normalize();
        }
        return this;
    };
    
    /**
     * 四元乘积
     * @method mult
     * @param {Quaternion} q
     * @param {Quaternion} target 选修的。
     * @return {Quaternion}
     */
    var Quaternion_mult_va = new Vec3();
    var Quaternion_mult_vb = new Vec3();
    var Quaternion_mult_vaxvb = new Vec3();
    Quaternion.prototype.mult = function(q,target){
        target = target || new Quaternion();
    
        var ax = this.x, ay = this.y, az = this.z, aw = this.w,
            bx = q.x, by = q.y, bz = q.z, bw = q.w;
    
        target.x = ax * bw + aw * bx + ay * bz - az * by;
        target.y = ay * bw + aw * by + az * bx - ax * bz;
        target.z = az * bw + aw * bz + ax * by - ay * bx;
        target.w = aw * bw - ax * bx - ay * by - az * bz;
    
        return target;
    };
    
    /**
     * 获取逆四元旋转。
     * @method inverse
     * @param {Quaternion} target
     * @return {Quaternion}
     */
    Quaternion.prototype.inverse = function(target){
        var x = this.x, y = this.y, z = this.z, w = this.w;
        target = target || new Quaternion();
    
        this.conjugate(target);
        var inorm2 = 1/(x*x + y*y + z*z + w*w);
        target.x *= inorm2;
        target.y *= inorm2;
        target.z *= inorm2;
        target.w *= inorm2;
    
        return target;
    };
    
    /**
     * 获取四合一结合
     * @method conjugate
     * @param {Quaternion} target
     * @return {Quaternion}
     */
    Quaternion.prototype.conjugate = function(target){
        target = target || new Quaternion();
    
        target.x = -this.x;
        target.y = -this.y;
        target.z = -this.z;
        target.w = this.w;
    
        return target;
    };
    
    /**
     * 标准化四合一。请注意，这会改变四元组的值。
     * @method normalize
     */
    Quaternion.prototype.normalize = function(){
        var l = Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w);
        if ( l === 0 ) {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 0;
        } else {
            l = 1 / l;
            this.x *= l;
            this.y *= l;
            this.z *= l;
            this.w *= l;
        }
        return this;
    };
    
    /**
     * 四合一归一化的近似。当Quat几乎完全归一化时，效果最好。
     * @method normalizeFast
     * @see http://jsperf.com/fast-quaternion-normalization
     * @author unphased, https://github.com/unphased
     */
    Quaternion.prototype.normalizeFast = function () {
        var f = (3.0-(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w))/2.0;
        if ( f === 0 ) {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 0;
        } else {
            this.x *= f;
            this.y *= f;
            this.z *= f;
            this.w *= f;
        }
        return this;
    };
    
    /**
     * 将四元组乘以矢量
     * @method vmult
     * @param {Vec3} v
     * @param {Vec3} target 选修的
     * @return {Vec3}
     */
    Quaternion.prototype.vmult = function(v,target){
        target = target || new Vec3();
    
        var x = v.x,
            y = v.y,
            z = v.z;
    
        var qx = this.x,
            qy = this.y,
            qz = this.z,
            qw = this.w;
    
        // Q*v
        var ix =  qw * x + qy * z - qz * y,
        iy =  qw * y + qz * x - qx * z,
        iz =  qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;
    
        target.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        target.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        target.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    
        return target;
    };
    
    /**
     * 将源的副本副本复制到该四基因。
     * @method copy
     * @param {Quaternion} source
     * @return {Quaternion} 这
     */
    Quaternion.prototype.copy = function(source){
        this.x = source.x;
        this.y = source.y;
        this.z = source.z;
        this.w = source.w;
        return this;
    };
    
    /**
     * 转数转换为Euler角度表示。订单：YZX，如本页面所述：http：//www.euclideanspace.com/maths/standards/index.htm
     * @method toEuler
     * @param {Vec3} target
     * @param string 订购三个字符字符串，例如“ YZX”，也是默认的。
     */
    Quaternion.prototype.toEuler = function(target,order){
        order = order || "YZX";
    
        var heading, attitude, bank;
        var x = this.x, y = this.y, z = this.z, w = this.w;
    
        switch(order){
        case "YZX":
            var test = x*y + z*w;
            if (test > 0.499) { // 北极的奇异性
                heading = 2 * Math.atan2(x,w);
                attitude = Math.PI/2;
                bank = 0;
            }
            if (test < -0.499) { // 南极的奇异性
                heading = -2 * Math.atan2(x,w);
                attitude = - Math.PI/2;
                bank = 0;
            }
            if(isNaN(heading)){
                var sqx = x*x;
                var sqy = y*y;
                var sqz = z*z;
                heading = Math.atan2(2*y*w - 2*x*z , 1 - 2*sqy - 2*sqz); // 标题
                attitude = Math.asin(2*test); // 态度
                bank = Math.atan2(2*x*w - 2*y*z , 1 - 2*sqx - 2*sqz); // 银行
            }
            break;
        default:
            throw new Error("Euler order "+order+" not supported yet.");
        }
    
        target.y = heading;
        target.z = attitude;
        target.x = bank;
    };
    
    /**
     * 请参阅http://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-contervent-to-convert-dcm-euler--euler--euler-quaternions-quaternions-and-eulnions-and-euler-vectors/content/content/content/spincalc.m
     * @method setFromEuler
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @param {String} order 应用角度的顺序：“ xyz”或“ YXZ”或任何其他组合
     */
    Quaternion.prototype.setFromEuler = function ( x, y, z, order ) {
        order = order || "XYZ";
    
        var c1 = Math.cos( x / 2 );
        var c2 = Math.cos( y / 2 );
        var c3 = Math.cos( z / 2 );
        var s1 = Math.sin( x / 2 );
        var s2 = Math.sin( y / 2 );
        var s3 = Math.sin( z / 2 );
    
        if ( order === 'XYZ' ) {
    
            this.x = s1 * c2 * c3 + c1 * s2 * s3;
            this.y = c1 * s2 * c3 - s1 * c2 * s3;
            this.z = c1 * c2 * s3 + s1 * s2 * c3;
            this.w = c1 * c2 * c3 - s1 * s2 * s3;
    
        } else if ( order === 'YXZ' ) {
    
            this.x = s1 * c2 * c3 + c1 * s2 * s3;
            this.y = c1 * s2 * c3 - s1 * c2 * s3;
            this.z = c1 * c2 * s3 - s1 * s2 * c3;
            this.w = c1 * c2 * c3 + s1 * s2 * s3;
    
        } else if ( order === 'ZXY' ) {
    
            this.x = s1 * c2 * c3 - c1 * s2 * s3;
            this.y = c1 * s2 * c3 + s1 * c2 * s3;
            this.z = c1 * c2 * s3 + s1 * s2 * c3;
            this.w = c1 * c2 * c3 - s1 * s2 * s3;
    
        } else if ( order === 'ZYX' ) {
    
            this.x = s1 * c2 * c3 - c1 * s2 * s3;
            this.y = c1 * s2 * c3 + s1 * c2 * s3;
            this.z = c1 * c2 * s3 - s1 * s2 * c3;
            this.w = c1 * c2 * c3 + s1 * s2 * s3;
    
        } else if ( order === 'YZX' ) {
    
            this.x = s1 * c2 * c3 + c1 * s2 * s3;
            this.y = c1 * s2 * c3 + s1 * c2 * s3;
            this.z = c1 * c2 * s3 - s1 * s2 * c3;
            this.w = c1 * c2 * c3 - s1 * s2 * s3;
    
        } else if ( order === 'XZY' ) {
    
            this.x = s1 * c2 * c3 - c1 * s2 * s3;
            this.y = c1 * s2 * c3 - s1 * c2 * s3;
            this.z = c1 * c2 * s3 + s1 * s2 * c3;
            this.w = c1 * c2 * c3 + s1 * s2 * s3;
    
        }
    
        return this;
    };
    
    /**
     * @method clone
     * @return {Quaternion}
     */
    Quaternion.prototype.clone = function(){
        return new Quaternion(this.x, this.y, this.z, this.w);
    };
    
    /**
     * 在两个Quat之间执行球形线性插值
     *
     * @method slerp
     * @param {Quaternion} toQuat 第二操作数
     * @param {Number} t 自季节和偶数之间的插值数量
     * @param {Quaternion} [target] 将结果存储在中的四元基因。如果未提供，将创建一个新的。
     * @returns {Quaternion} “目标”对象
     */
    Quaternion.prototype.slerp = function (toQuat, t, target) {
        target = target || new Quaternion();
    
        var ax = this.x,
            ay = this.y,
            az = this.z,
            aw = this.w,
            bx = toQuat.x,
            by = toQuat.y,
            bz = toQuat.z,
            bw = toQuat.w;
    
        var omega, cosom, sinom, scale0, scale1;
    
        // 钙余弦
        cosom = ax * bx + ay * by + az * bz + aw * bw;
    
        // 调整标志（如有必要）
        if ( cosom < 0.0 ) {
            cosom = -cosom;
            bx = - bx;
            by = - by;
            bz = - bz;
            bw = - bw;
        }
    
        // 计算系数
        if ( (1.0 - cosom) > 0.000001 ) {
            // 标准案例（SLERP）
            omega  = Math.acos(cosom);
            sinom  = Math.sin(omega);
            scale0 = Math.sin((1.0 - t) * omega) / sinom;
            scale1 = Math.sin(t * omega) / sinom;
        } else {
            // “从”和“四个四元组很近
            //  ...因此我们可以进行线性插值
            scale0 = 1.0 - t;
            scale1 = t;
        }
    
        // 计算最终值
        target.x = scale0 * ax + scale1 * bx;
        target.y = scale0 * ay + scale1 * by;
        target.z = scale0 * az + scale1 * bz;
        target.w = scale0 * aw + scale1 * bw;
    
        return target;
    };
    
    /**
     * 给定角速度和时间步骤，旋转绝对取向四基因。
     * @param  {Vec3} angularVelocity
     * @param  {number} dt
     * @param  {Vec3} angularFactor
     * @param  {Quaternion} target
     * @return {Quaternion} “目标”对象
     */
    Quaternion.prototype.integrate = function(angularVelocity, dt, angularFactor, target){
        target = target || new Quaternion();
    
        var ax = angularVelocity.x * angularFactor.x,
            ay = angularVelocity.y * angularFactor.y,
            az = angularVelocity.z * angularFactor.z,
            bx = this.x,
            by = this.y,
            bz = this.z,
            bw = this.w;
    
        var half_dt = dt * 0.5;
    
        target.x += half_dt * (ax * bw + ay * bz - az * by);
        target.y += half_dt * (ay * bw + az * bx - ax * bz);
        target.z += half_dt * (az * bw + ax * by - ay * bx);
        target.w += half_dt * (- ax * bx - ay * by - az * bz);
    
        return target;
    };
    },{"./Vec3":20}],19:[function(_dereq_,module,exports){
    var Vec3 = _dereq_('./Vec3');
    var Quaternion = _dereq_('./Quaternion');
    
    module.exports = Transform;
    
    /**
     * @class 转换
     * @constructor
     */
    function Transform(options) {
        options = options || {};
    
        /**
         * @property {Vec3} position
         */
        this.position = new Vec3();
        if(options.position){
            this.position.copy(options.position);
        }
    
        /**
         * @property {Quaternion} quaternion
         */
        this.quaternion = new Quaternion();
        if(options.quaternion){
            this.quaternion.copy(options.quaternion);
        }
    }
    
    var tmpQuat = new Quaternion();
    
    /**
     * @static
     * @method pointToLocaFrame
     * @param {Vec3} position
     * @param {Quaternion} quaternion
     * @param {Vec3} worldPoint
     * @param {Vec3} result
     */
    Transform.pointToLocalFrame = function(position, quaternion, worldPoint, result){
        var result = result || new Vec3();
        worldPoint.vsub(position, result);
        quaternion.conjugate(tmpQuat);
        tmpQuat.vmult(result, result);
        return result;
    };
    
    /**
     * 在本地变换坐标中获得全球观点。
     * @method pointToLocal
     * @param  {Vec3} point
     * @param  {Vec3} result
     * @return {Vec3} “结果”向量对象
     */
    // Transform.prototype.pointToLocal = function(worldPoint, result){
    //     return Transform.pointToLocalFrame(this.position, this.quaternion, worldPoint, result);
    // };
    
    /**
     * @static
     * @method pointToWorldFrame
     * @param {Vec3} position
     * @param {Vec3} quaternion
     * @param {Vec3} localPoint
     * @param {Vec3} result
     */
    Transform.pointToWorldFrame = function(position, quaternion, localPoint, result){
        var result = result || new Vec3();
        quaternion.vmult(localPoint, result);
        result.vadd(position, result);
        return result;
    };
    
    /**
     * 在全球变换坐标中获得本地观点。
     * @method pointToWorld
     * @param  {Vec3} point
     * @param  {Vec3} result
     * @return {Vec3} “结果”向量对象
     */
    // Transform.prototype.pointToWorld = function(localPoint, result){
    //     return Transform.pointToWorldFrame(this.position, this.quaternion, localPoint, result);
    // };
    
    
    // Transform.prototype.vectorToWorldFrame = function(localVector, result){
    //     var result = result || new Vec3();
    //     this.quaternion.vmult(localVector, result);
    //     return result;
    // };
    
    Transform.vectorToWorldFrame = function(quaternion, localVector, result){
        quaternion.vmult(localVector, result);
        return result;
    };
    
    Transform.vectorToLocalFrame = function(position, quaternion, worldVector, result){
        var result = result || new Vec3();
        quaternion.w *= -1;
        quaternion.vmult(worldVector, result);
        quaternion.w *= -1;
        return result;
    };
    
    },{"./Quaternion":18,"./Vec3":20}],20:[function(_dereq_,module,exports){
    module.exports = Vec3;
    
    var Mat3 = _dereq_('./Mat3');
    
    /**
     * 3维矢量
     * @class VEC3
     * @constructor
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @author schteppe
     * @example
     *     var v = new Vec3(1, 2, 3);
     *     console.log('x=' + v.x); // x=1
     */
    function Vec3(x,y,z){
        /**
         * @property x
         * @type {Number}
         */
        this.x = x||0.0;
    
        /**
         * @property 和
         * @type {Number}
         */
        this.y = y||0.0;
    
        /**
         * @property 和
         * @type {Number}
         */
        this.z = z||0.0;
    }
    
    /**
     * @static
     * @property {Vec3} ZERO
     */
    Vec3.ZERO = new Vec3(0, 0, 0);
    
    /**
     * @static
     * @property {Vec3} UNIT_X
     */
    Vec3.UNIT_X = new Vec3(1, 0, 0);
    
    /**
     * @static
     * @property {Vec3} UNIT_Y
     */
    Vec3.UNIT_Y = new Vec3(0, 1, 0);
    
    /**
     * @static
     * @property {Vec3} UNIT_Z
     */
    Vec3.UNIT_Z = new Vec3(0, 0, 1);
    
    /**
     * 向量跨产品
     * @method cross
     * @param {Vec3} v
     * @param {Vec3} target 选修的。目标保存。
     * @return {Vec3}
     */
    Vec3.prototype.cross = function(v,target){
        var vx=v.x, vy=v.y, vz=v.z, x=this.x, y=this.y, z=this.z;
        target = target || new Vec3();
    
        target.x = (y * vz) - (z * vy);
        target.y = (z * vx) - (x * vz);
        target.z = (x * vy) - (y * vx);
    
        return target;
    };
    
    /**
     * 设置向量的3个元素
     * @method set
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @return VEC3
     */
    Vec3.prototype.set = function(x,y,z){
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    };
    
    /**
     * 将向量的所有组件设置为零。
     * @method setZero
     */
    Vec3.prototype.setZero = function(){
        this.x = this.y = this.z = 0;
    };
    
    /**
     * 向量增加
     * @method vadd
     * @param {Vec3} v
     * @param {Vec3} target 选修的。
     * @return {Vec3}
     */
    Vec3.prototype.vadd = function(v,target){
        if(target){
            target.x = v.x + this.x;
            target.y = v.y + this.y;
            target.z = v.z + this.z;
        } else {
            return new Vec3(this.x + v.x,
                                   this.y + v.y,
                                   this.z + v.z);
        }
    };
    
    /**
     * 向量减法
     * @method vsub
     * @param {Vec3} v
     * @param {Vec3} target 选修的。目标保存。
     * @return {Vec3}
     */
    Vec3.prototype.vsub = function(v,target){
        if(target){
            target.x = this.x - v.x;
            target.y = this.y - v.y;
            target.z = this.z - v.z;
        } else {
            return new Vec3(this.x-v.x,
                                   this.y-v.y,
                                   this.z-v.z);
        }
    };
    
    /**
     * 从矢量获取跨产品矩阵A_Cross，以便a x b = a_cross *b = c
     * @method crossmat
     * @see http://www8.cs.umu.se/kurser/TDBD24/VT06/lectures/Lecture6.pdf
     * @return {Mat3}
     */
    Vec3.prototype.crossmat = function(){
        return new Mat3([     0,  -this.z,   this.y,
                                this.z,        0,  -this.x,
                               -this.y,   this.x,        0]);
    };
    
    /**
     * 使矢量归一化。请注意，这会改变向量中的值。
     * @method normalize
     * @return {Number} 返回向量的规范
     */
    Vec3.prototype.normalize = function(){
        var x=this.x, y=this.y, z=this.z;
        var n = Math.sqrt(x*x + y*y + z*z);
        if(n>0.0){
            var invN = 1/n;
            this.x *= invN;
            this.y *= invN;
            this.z *= invN;
        } else {
            // 弥补一些东西
            this.x = 0;
            this.y = 0;
            this.z = 0;
        }
        return n;
    };
    
    /**
     * 获取该向量的版本，该版本的长度为1。
     * @method unit
     * @param {Vec3} target 可选的目标以节省
     * @return {Vec3} 返回单位矢量
     */
    Vec3.prototype.unit = function(target){
        target = target || new Vec3();
        var x=this.x, y=this.y, z=this.z;
        var ninv = Math.sqrt(x*x + y*y + z*z);
        if(ninv>0.0){
            ninv = 1.0/ninv;
            target.x = x * ninv;
            target.y = y * ninv;
            target.z = z * ninv;
        } else {
            target.x = 1;
            target.y = 0;
            target.z = 0;
        }
        return target;
    };
    
    /**
     * 获取向量的长度
     * @method norm
     * @return {Number}
     * @deprecated 代替使用.length（）
     */
    Vec3.prototype.norm = function(){
        var x=this.x, y=this.y, z=this.z;
        return Math.sqrt(x*x + y*y + z*z);
    };
    
    /**
     * 获取向量的长度
     * @method length
     * @return {Number}
     */
    Vec3.prototype.length = Vec3.prototype.norm;
    
    /**
     * 获取矢量的平方长度
     * @method norm2
     * @return {Number}
     * @deprecated 而是使用.lengthsquared（）。
     */
    Vec3.prototype.norm2 = function(){
        return this.dot(this);
    };
    
    /**
     * 获取向量的平方长度。
     * @method lengthSquared
     * @return {Number}
     */
    Vec3.prototype.lengthSquared = Vec3.prototype.norm2;
    
    /**
     * 从这一点到另一点距离
     * @method distanceTo
     * @param  {Vec3} p
     * @return {Number}
     */
    Vec3.prototype.distanceTo = function(p){
        var x=this.x, y=this.y, z=this.z;
        var px=p.x, py=p.y, pz=p.z;
        return Math.sqrt((px-x)*(px-x)+
                         (py-y)*(py-y)+
                         (pz-z)*(pz-z));
    };
    
    /**
     * 从这个点到另一点的平方距离
     * @method distanceSquared
     * @param  {Vec3} p
     * @return {Number}
     */
    Vec3.prototype.distanceSquared = function(p){
        var x=this.x, y=this.y, z=this.z;
        var px=p.x, py=p.y, pz=p.z;
        return (px-x)*(px-x) + (py-y)*(py-y) + (pz-z)*(pz-z);
    };
    
    /**
     * 将矢量的所有组件乘以标量。
     * @deprecated 使用.scale
     * @method mult
     * @param {Number} scalar
     * @param {Vec3} target 向量保存结果。
     * @return {Vec3}
     * @deprecated 代替使用.scale（）
     */
    Vec3.prototype.mult = function(scalar,target){
        target = target || new Vec3();
        var x = this.x,
            y = this.y,
            z = this.z;
        target.x = scalar * x;
        target.y = scalar * y;
        target.z = scalar * z;
        return target;
    };
    
    /**
     * 将向量乘以其他向量的部件。
     * @method mult
     * @param {Number} vector
     * @param {Vec3} target 向量保存结果。
     * @return {Vec3}
     */
    Vec3.prototype.vmul = function(vector, target){
        target = target || new Vec3();
        target.x = vector.x * this.x;
        target.y = vector.y * this.y;
        target.z = vector.z * this.z;
        return target;
    };
    
    /**
     * 将向量乘以标量。
     * @method scale
     * @param {Number} scalar
     * @param {Vec3} target
     * @return {Vec3}
     */
    Vec3.prototype.scale = Vec3.prototype.mult;
    
    /**
     * 扩展向量并将其添加到该向量中。将结果保存在“目标”中。 （target = this +向量 *标量）
     * @method addScaledVector
     * @param {Number} scalar
     * @param {Vec3} vector
     * @param {Vec3} target 向量保存结果。
     * @return {Vec3}
     */
    Vec3.prototype.addScaledVector = function(scalar, vector, target){
        target = target || new Vec3();
        target.x = this.x + scalar * vector.x;
        target.y = this.y + scalar * vector.y;
        target.z = this.z + scalar * vector.z;
        return target;
    };
    
    /**
     * 计算点产品
     * @method dot
     * @param {Vec3} v
     * @return {Number}
     */
    Vec3.prototype.dot = function(v){
        return this.x * v.x + this.y * v.y + this.z * v.z;
    };
    
    /**
     * @method isZero
     * @return 布尔
     */
    Vec3.prototype.isZero = function(){
        return this.x===0 && this.y===0 && this.z===0;
    };
    
    /**
     * 使矢量朝相反的方向。
     * @method negate
     * @param {Vec3} target 可选的目标以节省
     * @return {Vec3}
     */
    Vec3.prototype.negate = function(target){
        target = target || new Vec3();
        target.x = -this.x;
        target.y = -this.y;
        target.z = -this.z;
        return target;
    };
    
    /**
     * 计算两个人工切线到矢量
     * @method tangents
     * @param {Vec3} t1 向量对象保存第一个切线
     * @param {Vec3} t2 向量对象保存第二个切线
     */
    var Vec3_tangents_n = new Vec3();
    var Vec3_tangents_randVec = new Vec3();
    Vec3.prototype.tangents = function(t1,t2){
        var norm = this.norm();
        if(norm>0.0){
            var n = Vec3_tangents_n;
            var inorm = 1/norm;
            n.set(this.x*inorm,this.y*inorm,this.z*inorm);
            var randVec = Vec3_tangents_randVec;
            if(Math.abs(n.x) < 0.9){
                randVec.set(1,0,0);
                n.cross(randVec,t1);
            } else {
                randVec.set(0,1,0);
                n.cross(randVec,t1);
            }
            n.cross(t1,t2);
        } else {
            // 正常长度为零，构成一些
            t1.set(1, 0, 0);
            t2.set(0, 1, 0);
        }
    };
    
    /**
     * 转换为更可读的格式
     * @method toString
     * @return 细绳
     */
    Vec3.prototype.toString = function(){
        return this.x+","+this.y+","+this.z;
    };
    
    /**
     * 转换为阵列
     * @method toArray
     * @return 大批
     */
    Vec3.prototype.toArray = function(){
        return [this.x, this.y, this.z];
    };
    
    /**
     * 复制源为该向量的值。
     * @method copy
     * @param {Vec3} source
     * @return {Vec3} 这
     */
    Vec3.prototype.copy = function(source){
        this.x = source.x;
        this.y = source.y;
        this.z = source.z;
        return this;
    };
    
    
    /**
     * 在两个向量之间进行线性插值
     * @method lerp
     * @param {Vec3} v
     * @param {Number} t 0和1。0之间的数字将使此函数返回u，而1将使其返回v。之间的数字将在它们之间生成向量。
     * @param {Vec3} target
     */
    Vec3.prototype.lerp = function(v,t,target){
        var x=this.x, y=this.y, z=this.z;
        target.x = x + (v.x-x)*t;
        target.y = y + (v.y-y)*t;
        target.z = z + (v.z-z)*t;
    };
    
    /**
     * 检查向量是否等于另一个。
     * @method almostEquals
     * @param {Vec3} v
     * @param {Number} precision
     * @return 布尔
     */
    Vec3.prototype.almostEquals = function(v,precision){
        if(precision===undefined){
            precision = 1e-6;
        }
        if( Math.abs(this.x-v.x)>precision ||
            Math.abs(this.y-v.y)>precision ||
            Math.abs(this.z-v.z)>precision){
            return false;
        }
        return true;
    };
    
    /**
     * 检查向量是否几乎为零
     * @method almostZero
     * @param {Number} precision
     */
    Vec3.prototype.almostZero = function(precision){
        if(precision===undefined){
            precision = 1e-6;
        }
        if( Math.abs(this.x)>precision ||
            Math.abs(this.y)>precision ||
            Math.abs(this.z)>precision){
            return false;
        }
        return true;
    };
    
    var antip_neg = new Vec3();
    
    /**
     * 检查向量是否与另一个向量平行。
     * @method isAntiparallelTo
     * @param  {Vec3}  v
     * @param  {Number}  precision 设置为零以进行精确比较
     * @return {Boolean}
     */
    Vec3.prototype.isAntiparallelTo = function(v,precision){
        this.negate(antip_neg);
        return antip_neg.almostEquals(v,precision);
    };
    
    /**
     * 克隆矢量
     * @method clone
     * @return {Vec3}
     */
    Vec3.prototype.clone = function(){
        return new Vec3(this.x, this.y, this.z);
    };
    },{"./Mat3":17}],21:[function(_dereq_,module,exports){
    module.exports = Body;
    
    var EventTarget = _dereq_('../utils/EventTarget');
    var Shape = _dereq_('../shapes/Shape');
    var Vec3 = _dereq_('../math/Vec3');
    var Mat3 = _dereq_('../math/Mat3');
    var Quaternion = _dereq_('../math/Quaternion');
    var Material = _dereq_('../material/Material');
    var AABB = _dereq_('../collision/AABB');
    var Box = _dereq_('../shapes/Box');
    
    /**
     * 所有身体类型的基础类。
     * @class 身体
     * @constructor
     * @extends EventTarget
     * @param {object} [options]
     * @param {Vec3} [options.position]
     * @param {Vec3} [options.velocity]
     * @param {Vec3} [options.angularVelocity]
     * @param {Quaternion} [options.quaternion]
     * @param {number} [options.mass]
     * @param {Material} [options.material]
     * @param {number} [options.type]
     * @param {number} [options.linearDamping=0.01]
     * @param {number} [options.angularDamping=0.01]
     * @param {boolean} [options.allowSleep=true]
     * @param {number} [options.sleepSpeedLimit=0.1]
     * @param {number} [options.sleepTimeLimit=1]
     * @param {number} [options.collisionFilterGroup=1]
     * @param {number} [options.collisionFilterMask=-1]
     * @param {boolean} [options.fixedRotation=false]
     * @param {Vec3} [options.linearFactor]
     * @param {Vec3} [options.angularFactor]
     * @param {Shape} [options.shape]
     * @example
     *     var body = new Body({
     *         mass: 1
     *     });
     *     var shape = new Sphere(1);
     *     body.addShape(shape);
     *     world.addBody(body);
     */
    function Body(options){
        options = options || {};
    
        EventTarget.apply(this);
    
        this.id = Body.idCounter++;
    
        /**
         * 提到人体生活的世界
         * @property 世界
         * @type {World}
         */
        this.world = null;
    
        /**
         * 在步行系统之前使用的回调功能。例如，使用它施加力。在函数内部，“此”将指代这个身体对象。
         * @property Prestep
         * @type {Function}
         * @deprecated 改用世界活动
         */
        // this.preStep = null;
    
        /**
         * 步进系统后使用的回调函数。在函数内部，“此”将指代这个身体对象。
         * @property 邮政
         * @type {Function}
         * @deprecated 改用世界活动
         */
        // this.postStep = null;
    
        this.vlambda = new Vec3();
    
        /**
         * @property {Number} collisionFilterGroup
         */
        this.collisionFilterGroup = typeof(options.collisionFilterGroup) === 'number' ? options.collisionFilterGroup : 1;
    
        /**
         * @property {Number} collisionFilterMask
         */
        this.collisionFilterMask = typeof(options.collisionFilterMask) === 'number' ? options.collisionFilterMask : -1;
    
        /**
         * 是否在与其他物体接触时是否产生接触力。请注意，将生成联系人，但将被禁用。
         * @property {Number} collisionResponse
         */
        this.collisionResponse = true;
    
        /**
         * 身体的世界空间位置。
         * @property 位置
         * @type {Vec3}
         */
        this.position = new Vec3();
    
        /**
         * @property {Vec3} previousPosition
         */
        // this.previousPosition = new Vec3();
    
        /**
         * 身体的插值位置。
         * @property {Vec3} interpolatedPosition
         */
        // this.interpolatedPosition = new Vec3();
    
        /**
         * 身体的初始位置
         * @property initposition
         * @type {Vec3}
         */
        this.initPosition = new Vec3();
    
        if(options.position){
            this.position.copy(options.position);
            // this.previousPosition.copy(options.position);
            // this.interpolatedPosition.copy(options.position);
            this.initPosition.copy(options.position);
        }
    
        /**
         * 身体的世界太空速度。
         * @property 速度
         * @type {Vec3}
         */
        this.velocity = new Vec3();
    
        if(options.velocity){
            this.velocity.copy(options.velocity);
        }
    
        /**
         * @property 启动
         * @type {Vec3}
         */
        this.initVelocity = new Vec3();
    
        /**
         * 世界空间中身体的线性力。
         * @property 力量
         * @type {Vec3}
         */
        this.force = new Vec3();
    
        var mass = typeof(options.mass) === 'number' ? options.mass : 0;
    
        /**
         * @property 大量的
         * @type {Number}
         * @default 0
         */
        this.mass = mass;
    
        /**
         * @property invMass
         * @type {Number}
         */
        this.invMass = mass > 0 ? 1.0 / mass : 0;
    
        /**
         * @property 材料
         * @type {Material}
         */
        this.material = options.material || null;
    
        /**
         * @property 线性化
         * @type {Number}
         */
        this.linearDamping = typeof(options.linearDamping) === 'number' ? options.linearDamping : 0.01;
    
        /**
         * 一个：身体，身体。静态和身体。
         * @property 类型
         * @type {Number}
         */
        this.type = (mass <= 0.0 ? Body.STATIC : Body.DYNAMIC);
        if(typeof(options.type) === typeof(Body.STATIC)){
            this.type = options.type;
        }
    
        /**
         * 如果是真的，身体将自动入睡。
         * @property 允许
         * @type {Boolean}
         * @default true
         */
        this.allowSleep = typeof(options.allowSleep) !== 'undefined' ? options.allowSleep : true;
    
        /**
         * 当前的睡眠状态。
         * @property 睡觉
         * @type {Number}
         */
        // this.sleepState = 0;
    
        /**
         * 如果速度（速度的标准）小于该值，则将身体视为困倦。
         * @property Sleepspeedlimit
         * @type {Number}
         * @default 0.1
         */
        // this.sleepSpeedLimit = typeof(options.sleepSpeedLimit) !== 'undefined' ? options.sleepSpeedLimit : 0.1;
    
        /**
         * 如果在这个睡觉中的几秒钟内身体已经困了，则认为它被认为是睡觉的。
         * @property Sleeptimelimit
         * @type {Number}
         * @default 1
         */
        // this.sleepTimeLimit = typeof(options.sleepTimeLimit) !== 'undefined' ? options.sleepTimeLimit : 1;
    
        // this.timeLastSleepy = 0;
    
        // this._wakeUpAfterNarrowphase = false;
    
        /**
         * 世界上的世界太空旋转力在质量中心附近。
         * @property {Vec3} torque
         */
        this.torque = new Vec3();
    
        /**
         * 身体的世界空间取向。
         * @property 季节
         * @type {Quaternion}
         */
        this.quaternion = new Quaternion();
    
        /**
         * @property initquaternion
         * @type {Quaternion}
         */
        this.initQuaternion = new Quaternion();
    
        /**
         * @property {Quaternion} previousQuaternion
         */
        // this.previousQuaternion = new Quaternion();
    
        /**
         * 身体的插值方向。
         * @property {Quaternion} interpolatedQuaternion
         */
        // this.interpolatedQuaternion = new Quaternion();
    
        if(options.quaternion){
            this.quaternion.copy(options.quaternion);
            this.initQuaternion.copy(options.quaternion);
            // this.previousQuaternion.copy(options.quaternion);
            // this.interpolatedQuaternion.copy(options.quaternion);
        }
    
        /**
         * 人体的角速度，世界空间。将角速度视为人体周围旋转的向量。该矢量的长度决定了人体旋转的速度（每秒弧度）。
         * @property 角杆性
         * @type {Vec3}
         */
        this.angularVelocity = new Vec3();
    
        if(options.angularVelocity){
            this.angularVelocity.copy(options.angularVelocity);
        }
    
        /**
         * @property interangularvelocity
         * @type {Vec3}
         */
        this.initAngularVelocity = new Vec3();
    
        /**
         * @property 形状
         * @type {array}
         */
        this.shapes = [];
    
        /**
         * 在局部身体空间中给出的每个形状的位置。
         * @property ShapeOffsets
         * @type {array}
         */
        this.shapeOffsets = [];
    
        /**
         * 每种形状的方向，在局部身体空间中给出。
         * @property 形状方向
         * @type {array}
         */
        this.shapeOrientations = [];
    
        /**
         * @property 惯性
         * @type {Vec3}
         */
        this.inertia = new Vec3();
    
        /**
         * @property {Vec3} invInertia
         */
        this.invInertia = new Vec3();
    
        /**
         * @property {Mat3} invInertiaWorld
         */
        this.invInertiaWorld = new Mat3();
    
        this.invMassSolve = 0;
    
        /**
         * @property {Vec3} invInertiaSolve
         */
        this.invInertiaSolve = new Vec3();
    
        /**
         * @property {Mat3} invInertiaWorldSolve
         */
        this.invInertiaWorldSolve = new Mat3();
    
        /**
         * 如果您不希望身体旋转，则设置为True。更改此操作后，请确保运行.updatemassproperties（）。
         * @property {Boolean} fixedRotation
         * @default false
         */
        this.fixedRotation = typeof(options.fixedRotation) !== "undefined" ? options.fixedRotation : false;
    
        /**
         * @property {Number} angularDamping
         */
        this.angularDamping = typeof(options.angularDamping) !== 'undefined' ? options.angularDamping : 0.01;
    
        /**
         * 使用此属性限制沿任何世界轴的运动。 （1,1,1）将允许沿所有轴运动，而（0,0,0）允许不允许运动。
         * @property {Vec3} linearFactor
         */
        this.linearFactor = new Vec3(1,1,1);
        if(options.linearFactor){
            this.linearFactor.copy(options.linearFactor);
        }
    
        /**
         * 使用此属性限制沿任何世界轴的旋转运动。 （1,1,1）将允许沿所有轴旋转，而（0,0,0）允许不允许旋转。
         * @property {Vec3} angularFactor
         */
        this.angularFactor = new Vec3(1,1,1);
        if(options.angularFactor){
            this.angularFactor.copy(options.angularFactor);
        }
    
        /**
         * 世界空间框架及其形状的框。
         * @property AABB
         * @type {AABB}
         */
        this.aabb = new AABB();
    
        /**
         * 指示使用前是否需要更新AABB。
         * @property aabbneedsupdate
         * @type {Boolean}
         */
        this.aabbNeedsUpdate = true;
    
        /**
         * 人体的总界半径，包括其形状，相对于身体。位置。
         * @property 边界
         * @type {Number}
         */
        this.boundingRadius = 0;
    
        this.wlambda = new Vec3();
    
        if(options.shape){
            this.addShape(options.shape);
        }
    
        this.updateMassProperties();
    }
    Body.prototype = new EventTarget();
    Body.prototype.constructor = Body;
    
    /**
     * 两个尸体发生碰撞后派遣。此事件在每个事件上都派遣
     * 涉及碰撞的两个尸体。
     * @event collide
     * @param {Body} body 涉及碰撞的身体。
     * @param {ContactEquation} contact 碰撞的细节。
     */
    Body.COLLIDE_EVENT_NAME = "collide";
    
    /**
     * 动态主体完全模拟。用户可以手动移动，但通常它们会根据力移动。动态的身体会与所有身体类型碰撞。动态体始终具有有限的非零质量。
     * @static
     * @property 动态的
     * @type {Number}
     */
    Body.DYNAMIC = 1;
    
    /**
     * 静态体在模拟过程中不会移动，并且表现得好像具有无限的质量。可以通过设置身体位置手动移动静态物体。静态体的速度始终为零。静态物体不会与其他静态或运动学物体碰撞。
     * @static
     * @property 静止的
     * @type {Number}
     */
    Body.STATIC = 2;
    
    /**
     * 运动体根据其速度在模拟下移动。他们不回应力量。它们可以手动移动，但通常通过设定速度来移动运动体。运动体的表现，好像它具有无限的质量。运动体不会与其他静态或运动学物体碰撞。
     * @static
     * @property 运动学
     * @type {Number}
     */
    Body.KINEMATIC = 4;
    
    
    
    /**
     * @static
     * @property 醒
     * @type {number}
     */
    Body.AWAKE = 0;
    
    /**
     * @static
     * @property 困
     * @type {number}
     */
    Body.SLEEPY = 1;
    
    /**
     * @static
     * @property 睡眠
     * @type {number}
     */
    Body.SLEEPING = 2;
    
    Body.idCounter = 0;
    
    /**
     * 睡眠身体醒来后派遣。
     * @event wakeup
     */
    Body.wakeupEvent = {
        type: "wakeup"
    };
    
    /**
     * 唤醒身体。
     * @method wakeUp
     */
    Body.prototype.wakeUp = function(){
        // var s = this.sleepState;
        // this.sleepState = 0;
        // this._wakeUpAfterNarrowphase = false;
        // if(s === Body.SLEEPING){
        //     this.dispatchEvent(Body.wakeupEvent);
        // }
    };
    
    /**
     * 强迫身体睡觉
     * @method sleep
     */
    Body.prototype.sleep = function(){
        // this.sleepState = Body.SLEEPING;
        this.velocity.set(0,0,0);
        this.angularVelocity.set(0,0,0);
        // this._wakeUpAfterNarrowphase = false;
    };
    
    /**
     * 尸体进入昏昏欲睡状态后，派遣了。
     * @event sleepy
    //  */
    // Body.sleepyEvent = {
    //     type: "sleepy"
    // };
    
    /**
     * 身体入睡后派遣。
     * @event sleep
    //  */
    // Body.sleepEvent = {
    //     type: "sleep"
    // };
    
    /**
     * 打电话给每个时间段以更新内部睡眠计时器并在需要时更改睡眠状态。
     * @method sleepTick
     * @param {Number} time 几秒钟内的世界时间
    //  */
    // Body.prototype.sleepTick = function(time){
    //     // if(this.allowSleep){
    //     //     var sleepState = this.sleepState;
    //     //     var speedSquared = this.velocity.norm2() + this.angularVelocity.norm2();
    //     //     var speedLimitSquared = Math.pow(this.sleepSpeedLimit,2);
    //     //     if(sleepState===Body.AWAKE && speedSquared < speedLimitSquared){
    //     //         this.sleepState = Body.SLEEPY; // 困
    //     //         this.timeLastSleepy = time;
    //     //         this.dispatchEvent(Body.sleepyEvent);
    //     //     } else if(sleepState===Body.SLEEPY && speedSquared > speedLimitSquared){
    //     //         this.wakeUp(); // 醒来
    //     //     } else if(sleepState===Body.SLEEPY && (time - this.timeLastSleepy ) > this.sleepTimeLimit){
    //     //         this.sleep(); // 睡眠
    //     //         this.dispatchEvent(Body.sleepEvent);
    //     //     }
    //     // }
    // };
    
    /**
     * 如果身体在睡觉，则应该在求解过程中不可移动 /具有无限的质量。我们通过拥有单独的“解决质量”来解决它。
     * @method updateSolveMassProperties
     */
    Body.prototype.updateSolveMassProperties = function(){
        if(this.type === Body.KINEMATIC){
            this.invMassSolve = 0;
            this.invInertiaSolve.setZero();
            this.invInertiaWorldSolve.setZero();
        } else {
            this.invMassSolve = this.invMass;
            this.invInertiaSolve.copy(this.invInertia);
            this.invInertiaWorldSolve.copy(this.invInertiaWorld);
        }
    };
    
    /**
     * 将世界点转换为当地的身体框架。
     * @method pointToLocalFrame
     * @param  {Vec3} worldPoint
     * @param  {Vec3} result
     * @return {Vec3}
     */
    Body.prototype.pointToLocalFrame = function(worldPoint,result){
        var result = result || new Vec3();
        worldPoint.vsub(this.position,result);
        this.quaternion.conjugate().vmult(result,result);
        return result;
    };
    
    /**
     * 将世界向量转换为当地的身体框架。
     * @method vectorToLocalFrame
     * @param  {Vec3} worldPoint
     * @param  {Vec3} result
     * @return {Vec3}
     */
    Body.prototype.vectorToLocalFrame = function(worldVector, result){
        var result = result || new Vec3();
        this.quaternion.conjugate().vmult(worldVector,result);
        return result;
    };
    
    /**
     * 将当地的身体指向转换为世界框架。
     * @method pointToWorldFrame
     * @param  {Vec3} localPoint
     * @param  {Vec3} result
     * @return {Vec3}
     */
    Body.prototype.pointToWorldFrame = function(localPoint,result){
        var result = result || new Vec3();
        this.quaternion.vmult(localPoint,result);
        result.vadd(this.position,result);
        return result;
    };
    
    /**
     * 将当地的身体指向转换为世界框架。
     * @method vectorToWorldFrame
     * @param  {Vec3} localVector
     * @param  {Vec3} result
     * @return {Vec3}
     */
    Body.prototype.vectorToWorldFrame = function(localVector, result){
        var result = result || new Vec3();
        this.quaternion.vmult(localVector, result);
        return result;
    };
    
    var tmpVec = new Vec3();
    var tmpQuat = new Quaternion();
    
    /**
     * 通过局部偏移和方向为身体增添形状。
     * @method addShape
     * @param {Shape} shape
     * @param {Vec3} [_offset]
     * @param {Quaternion} [_orientation]
     * @return {Body} 身体对象，可链性。
     */
    Body.prototype.addShape = function(shape, _offset, _orientation){
        var offset = new Vec3();
        var orientation = new Quaternion();
    
        if(_offset){
            offset.copy(_offset);
        }
        if(_orientation){
            orientation.copy(_orientation);
        }
    
        this.shapes.push(shape);
        this.shapeOffsets.push(offset);
        this.shapeOrientations.push(orientation);
        this.updateMassProperties();
        this.updateBoundingRadius();
    
        this.aabbNeedsUpdate = true;
    
        shape.body = this;
    
        return this;
    };
    
    /**
     * 更新身体的边界半径。如果任何形状更改，则应完成。
     * @method updateBoundingRadius
     */
    Body.prototype.updateBoundingRadius = function(){
        var shapes = this.shapes,
            shapeOffsets = this.shapeOffsets,
            N = shapes.length,
            radius = 0;
    
        for(var i=0; i!==N; i++){
            var shape = shapes[i];
            shape.updateBoundingSphereRadius();
            var offset = shapeOffsets[i].norm(),
                r = shape.boundingSphereRadius;
            if(offset + r > radius){
                radius = offset + r;
            }
        }
    
        this.boundingRadius = radius;
    };
    
    var computeAABB_shapeAABB = new AABB();
    
    /**
     * 更新.AABB
     * @method computeAABB
     * @todo 重命名为updateaabb（）
     */
    Body.prototype.computeAABB = function(){
        var shapes = this.shapes,
            shapeOffsets = this.shapeOffsets,
            shapeOrientations = this.shapeOrientations,
            N = shapes.length,
            offset = tmpVec,
            orientation = tmpQuat,
            bodyQuat = this.quaternion,
            aabb = this.aabb,
            shapeAABB = computeAABB_shapeAABB;
    
        for(var i=0; i!==N; i++){
            var shape = shapes[i];
    
            // 获得形状世界位置
            bodyQuat.vmult(shapeOffsets[i], offset);
            offset.vadd(this.position, offset);
    
            // 获得形状世界四元成
            shapeOrientations[i].mult(bodyQuat, orientation);
    
            // 获取AABB
            shape.calculateWorldAABB(offset, orientation, shapeAABB.lowerBound, shapeAABB.upperBound);
    
            if(i === 0){
                aabb.copy(shapeAABB);
            } else {
                aabb.extend(shapeAABB);
            }
        }
    
        this.aabbNeedsUpdate = false;
    };
    
    var uiw_m1 = new Mat3(),
        uiw_m2 = new Mat3(),
        uiw_m3 = new Mat3();
    
    /**
     * 更新.inertiaworld和.invinertiaworld
     * @method updateInertiaWorld
     */
    Body.prototype.updateInertiaWorld = function(force){
        var I = this.invInertia;
        if (I.x === I.y && I.y === I.z && !force) {
            // 如果惯性m = s*i，我是身份和标量的，则
            //    r*m*r'= r*（s*i）*r'= s*r*i*r'= s*r*r*r'= s*i = m
            // 其中r是旋转矩阵。
            // 换句话说，如果全部，我们不必改变惯性
            // 对角惯性条目相等。
        } else {
            var m1 = uiw_m1,
                m2 = uiw_m2,
                m3 = uiw_m3;
            m1.setRotationFromQuaternion(this.quaternion);
            m1.transpose(m2);
            m1.scale(I,m1);
            m1.mmult(m2,this.invInertiaWorld);
        }
    };
    
    /**
     * 将武力施加到世界点。例如，这可能是身体表面上的一个点。以这种方式施加力会增加身体。fo​​rce和body.torque。
     * @method applyForce
     * @param  {Vec3} force 要添加的力量。
     * @param  {Vec3} relativePoint 相对于质量中心的点以施加力。
     */
    var Body_applyForce_r = new Vec3();
    var Body_applyForce_rotForce = new Vec3();
    Body.prototype.applyForce = function(force,relativePoint){
        if(this.type !== Body.DYNAMIC){ // 需要？
            return;
        }
    
        // 计算产生的旋转力
        var rotForce = Body_applyForce_rotForce;
        relativePoint.cross(force,rotForce);
    
        // 添加线性力
        this.force.vadd(force,this.force);
    
        // 添加旋转力
        this.torque.vadd(rotForce,this.torque);
    };
    
    /**
     * 将力施加到体内的局部点。
     * @method applyLocalForce
     * @param  {Vec3} force 力量施加，在身体框架中局部定义。
     * @param  {Vec3} localPoint 体内施加力的局部点。
     */
    var Body_applyLocalForce_worldForce = new Vec3();
    var Body_applyLocalForce_relativePointWorld = new Vec3();
    Body.prototype.applyLocalForce = function(localForce, localPoint){
        if(this.type !== Body.DYNAMIC){
            return;
        }
    
        var worldForce = Body_applyLocalForce_worldForce;
        var relativePointWorld = Body_applyLocalForce_relativePointWorld;
    
        // 将力量向量转换为世界空间
        this.vectorToWorldFrame(localForce, worldForce);
        this.vectorToWorldFrame(localPoint, relativePointWorld);
    
        this.applyForce(worldForce, relativePointWorld);
    };
    
    /**
     * 将冲动应用到世界点。例如，这可能是身体表面上的一个点。冲动是在短时间内添加到身体中的力（脉冲=力 *时间）。冲动将被添加到身体。固定性和身体。
     * @method applyImpulse
     * @param  {Vec3} impulse 要添加的冲动量。
     * @param  {Vec3} relativePoint 相对于质量中心的点以施加力。
     */
    var Body_applyImpulse_r = new Vec3();
    var Body_applyImpulse_velo = new Vec3();
    var Body_applyImpulse_rotVelo = new Vec3();
    Body.prototype.applyImpulse = function(impulse, relativePoint){
        if(this.type !== Body.DYNAMIC){
            return;
        }
    
        // 计算相对于身体中心的位置
        var r = relativePoint;
    
        // 计算产生的中央冲动速度
        var velo = Body_applyImpulse_velo;
        velo.copy(impulse);
        velo.mult(this.invMass,velo);
    
        // 添加线性冲动
        this.velocity.vadd(velo, this.velocity);
    
        // 计算产生的旋转冲动速度
        var rotVelo = Body_applyImpulse_rotVelo;
        r.cross(impulse,rotVelo);
    
        /*
        rotvelo.x *= this.invinertia.x;
        rotvelo.y *= this.invinertia.y;
        rotvelo.z *= this.invinertia.z;
        */
        this.invInertiaWorld.vmult(rotVelo,rotVelo);
    
        // 添加旋转冲动
        this.angularVelocity.vadd(rotVelo, this.angularVelocity);
    };
    
    /**
     * 将局部定义的冲动应用到体内的局部点。
     * @method applyLocalImpulse
     * @param  {Vec3} force 力量施加，在身体框架中局部定义。
     * @param  {Vec3} localPoint 体内施加力的局部点。
     */
    var Body_applyLocalImpulse_worldImpulse = new Vec3();
    var Body_applyLocalImpulse_relativePoint = new Vec3();
    Body.prototype.applyLocalImpulse = function(localImpulse, localPoint){
        if(this.type !== Body.DYNAMIC){
            return;
        }
    
        var worldImpulse = Body_applyLocalImpulse_worldImpulse;
        var relativePointWorld = Body_applyLocalImpulse_relativePoint;
    
        // 将力量向量转换为世界空间
        this.vectorToWorldFrame(localImpulse, worldImpulse);
        this.vectorToWorldFrame(localPoint, relativePointWorld);
    
        this.applyImpulse(worldImpulse, relativePointWorld);
    };
    
    var Body_updateMassProperties_halfExtents = new Vec3();
    
    /**
     * 每当您改变身体形状或质量时，都应被称为。
     * @method updateMassProperties
     */
    Body.prototype.updateMassProperties = function(){
        var halfExtents = Body_updateMassProperties_halfExtents;
    
        this.invMass = this.mass > 0 ? 1.0 / this.mass : 0;
        var I = this.inertia;
        var fixed = this.fixedRotation;
    
        // 大约用AABB盒子
        this.computeAABB();
        halfExtents.set(
            (this.aabb.upperBound.x-this.aabb.lowerBound.x) / 2,
            (this.aabb.upperBound.y-this.aabb.lowerBound.y) / 2,
            (this.aabb.upperBound.z-this.aabb.lowerBound.z) / 2
        );
        Box.calculateInertia(halfExtents, this.mass, I);
    
        this.invInertia.set(
            I.x > 0 && !fixed ? 1.0 / I.x : 0,
            I.y > 0 && !fixed ? 1.0 / I.y : 0,
            I.z > 0 && !fixed ? 1.0 / I.z : 0
        );
        this.updateInertiaWorld(true);
    };
    
    /**
     * 获得体内点的世界速度。
     * @method getVelocityAtWorldPoint
     * @param  {Vec3} worldPoint
     * @param  {Vec3} result
     * @return {Vec3} 结果向量。
     */
    Body.prototype.getVelocityAtWorldPoint = function(worldPoint, result){
        var r = new Vec3();
        worldPoint.vsub(this.position, r);
        this.angularVelocity.cross(r, result);
        this.velocity.vadd(result, result);
        return result;
    };
    
    var torque = new Vec3();
    var invI_tau_dt = new Vec3();
    var w = new Quaternion();
    var wq = new Quaternion();
    
    /**
     * 及时向前移动身体。
     * @param {number} dt 时间步骤
     * @param {boolean} quatNormalize 设置为正确使身体四分法归一化
     * @param {boolean} quatNormalizeFast 如果应使用“快速”四个四基金归一化将四元化标准化
     */
    Body.prototype.integrate = function(dt, quatNormalize, quatNormalizeFast){
    
        // 保存先前的位置
        // this.previousPosition.copy(this.position);
        // this.previousQuaternion.copy(this.quaternion);
    
        if(!(this.type === Body.DYNAMIC || this.type === Body.KINEMATIC)){ // 仅用于动态
            return;
        }
    
        var velo = this.velocity,
            angularVelo = this.angularVelocity,
            pos = this.position,
            force = this.force,
            torque = this.torque,
            quat = this.quaternion,
            invMass = this.invMass,
            invInertia = this.invInertiaWorld,
            linearFactor = this.linearFactor;
    
        var iMdt = invMass * dt;
        velo.x += force.x * iMdt * linearFactor.x;
        velo.y += force.y * iMdt * linearFactor.y;
        velo.z += force.z * iMdt * linearFactor.z;
    
        var e = invInertia.elements;
        var angularFactor = this.angularFactor;
        var tx = torque.x * angularFactor.x;
        var ty = torque.y * angularFactor.y;
        var tz = torque.z * angularFactor.z;
        angularVelo.x += dt * (e[0] * tx + e[1] * ty + e[2] * tz);
        angularVelo.y += dt * (e[3] * tx + e[4] * ty + e[5] * tz);
        angularVelo.z += dt * (e[6] * tx + e[7] * ty + e[8] * tz);
    
        // 使用新速度 -跳蛙
        pos.x += velo.x * dt;
        pos.y += velo.y * dt;
        pos.z += velo.z * dt;
    
        quat.integrate(this.angularVelocity, dt, this.angularFactor, quat);
    
        if(quatNormalize){
            if(quatNormalizeFast){
                quat.normalizeFast();
            } else {
                quat.normalize();
            }
        }
    
        this.aabbNeedsUpdate = true;
    
        // 更新世界惯性
        this.updateInertiaWorld();
    };
    
    },{"../collision/AABB":3,"../material/Material":15,"../math/Mat3":17,"../math/Quaternion":18,"../math/Vec3":20,"../shapes/Box":22,"../shapes/Shape":25,"../utils/EventTarget":29}],22:[function(_dereq_,module,exports){
    module.exports = Box;
    
    var Shape = _dereq_('./Shape');
    var Vec3 = _dereq_('../math/Vec3');
    var ConvexPolyhedron = _dereq_('./ConvexPolyhedron');
    
    /**
     * 3D盒形。
     * @class 盒子
     * @constructor
     * @param {Vec3} halfExtents
     * @author schteppe
     * @extends Shape
     */
    function Box(halfExtents){
        Shape.call(this, {
            type: Shape.types.BOX
        });
    
        /**
         * @property 半雕刻
         * @type {Vec3}
         */
        this.halfExtents = halfExtents;
    
        /**
         * 触点发生器用来与其他凸多面体进行联系
         * @property 凸多体陈述
         * @type {ConvexPolyhedron}
         */
        this.convexPolyhedronRepresentation = null;
    
        this.updateConvexPolyhedronRepresentation();
        this.updateBoundingSphereRadius();
    }
    Box.prototype = new Shape();
    Box.prototype.constructor = Box;
    
    /**
     * 更新用于某些碰撞的本地凸多面体表示。
     * @method updateConvexPolyhedronRepresentation
     */
    Box.prototype.updateConvexPolyhedronRepresentation = function(){
        var sx = this.halfExtents.x;
        var sy = this.halfExtents.y;
        var sz = this.halfExtents.z;
        var V = Vec3;
    
        var vertices = [
            new V(-sx,-sy,-sz),
            new V( sx,-sy,-sz),
            new V( sx, sy,-sz),
            new V(-sx, sy,-sz),
            new V(-sx,-sy, sz),
            new V( sx,-sy, sz),
            new V( sx, sy, sz),
            new V(-sx, sy, sz)
        ];
    
        var indices = [
            [3,2,1,0], // 和
            [4,5,6,7], // +z
            [5,4,0,1], // 和
            [2,3,7,6], // +和
            [0,4,7,3], // x
            [1,2,6,5], // +x
        ];
    
        var axes = [
            new V(0, 0, 1),
            new V(0, 1, 0),
            new V(1, 0, 0)
        ];
    
        var h = new ConvexPolyhedron(vertices, indices);
        this.convexPolyhedronRepresentation = h;
        h.material = this.material;
    };
    
    /**
     * @method calculateLocalInertia
     * @param  {Number} mass
     * @param  {Vec3} target
     * @return {Vec3}
     */
    Box.prototype.calculateLocalInertia = function(mass,target){
        target = target || new Vec3();
        Box.calculateInertia(this.halfExtents, mass, target);
        return target;
    };
    
    Box.calculateInertia = function(halfExtents,mass,target){
        var e = halfExtents;
        target.x = 1.0 / 12.0 * mass * (   2*e.y*2*e.y + 2*e.z*2*e.z );
        target.y = 1.0 / 12.0 * mass * (   2*e.x*2*e.x + 2*e.z*2*e.z );
        target.z = 1.0 / 12.0 * mass * (   2*e.y*2*e.y + 2*e.x*2*e.x );
    };
    
    /**
     * 获取盒子6侧正常
     * @method getSideNormals
     * @param {array}      sixTargetVectors 一个6个向量的阵列，以存储由此产生的侧面正态。
     * @param {Quaternion} quat             适用于正常向量的方向。如果没有提供，则向量将与本地框架有关。
     * @return {array}
     */
    Box.prototype.getSideNormals = function(sixTargetVectors,quat){
        var sides = sixTargetVectors;
        var ex = this.halfExtents;
        sides[0].set(  ex.x,     0,     0);
        sides[1].set(     0,  ex.y,     0);
        sides[2].set(     0,     0,  ex.z);
        sides[3].set( -ex.x,     0,     0);
        sides[4].set(     0, -ex.y,     0);
        sides[5].set(     0,     0, -ex.z);
    
        if(quat!==undefined){
            for(var i=0; i!==sides.length; i++){
                quat.vmult(sides[i],sides[i]);
            }
        }
    
        return sides;
    };
    
    Box.prototype.volume = function(){
        return 8.0 * this.halfExtents.x * this.halfExtents.y * this.halfExtents.z;
    };
    
    Box.prototype.updateBoundingSphereRadius = function(){
        this.boundingSphereRadius = this.halfExtents.norm();
    };
    
    var worldCornerTempPos = new Vec3();
    var worldCornerTempNeg = new Vec3();
    // Box.prototype.forEachWorldCorner = function(pos,quat,callback){
    
    //     var e = this.halfExtents;
    //     var corners = [[  e.x,  e.y,  e.z],
    //                    [ -e.x,  e.y,  e.z],
    //                    [ -e.x, -e.y,  e.z],
    //                    [ -e.x, -e.y, -e.z],
    //                    [  e.x, -e.y, -e.z],
    //                    [  e.x,  e.y, -e.z],
    //                    [ -e.x,  e.y, -e.z],
    //                    [  e.x, -e.y,  e.z]];
    //     for(var i=0; i<corners.length; i++){
    //         worldCornerTempPos.set(corners[i][0],corners[i][1],corners[i][2]);
    //         quat.vmult(worldCornerTempPos,worldCornerTempPos);
    //         pos.vadd(worldCornerTempPos,worldCornerTempPos);
    //         callback(worldCornerTempPos.x,
    //                  worldCornerTempPos.y,
    //                  worldCornerTempPos.z);
    //     }
    // };
    
    var worldCornersTemp = [
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3()
    ];
    Box.prototype.calculateWorldAABB = function(pos,quat,min,max){
    
        var e = this.halfExtents;
        worldCornersTemp[0].set(e.x, e.y, e.z);
        worldCornersTemp[1].set(-e.x,  e.y, e.z);
        worldCornersTemp[2].set(-e.x, -e.y, e.z);
        worldCornersTemp[3].set(-e.x, -e.y, -e.z);
        worldCornersTemp[4].set(e.x, -e.y, -e.z);
        worldCornersTemp[5].set(e.x,  e.y, -e.z);
        worldCornersTemp[6].set(-e.x,  e.y, -e.z);
        worldCornersTemp[7].set(e.x, -e.y,  e.z);
    
        var wc = worldCornersTemp[0];
        quat.vmult(wc, wc);
        pos.vadd(wc, wc);
        max.copy(wc);
        min.copy(wc);
        for(var i=1; i<8; i++){
            var wc = worldCornersTemp[i];
            quat.vmult(wc, wc);
            pos.vadd(wc, wc);
            var x = wc.x;
            var y = wc.y;
            var z = wc.z;
            if(x > max.x){
                max.x = x;
            }
            if(y > max.y){
                max.y = y;
            }
            if(z > max.z){
                max.z = z;
            }
    
            if(x < min.x){
                min.x = x;
            }
            if(y < min.y){
                min.y = y;
            }
            if(z < min.z){
                min.z = z;
            }
        }
    
        // 获取每个轴最大
        // Min.set（无穷大，无限，无穷大）；
        // max.set（-infinity，-infinity，-infinity）;
        // this.foreachworldcorner（pos，quat，function（x，y，z）{
        //     如果（x> max.x）{
        //         max.x = x;
        //     }
        //     如果（y> max.y）{
        //         max.y = y;
        //     }
        //     如果（z> max.z）{
        //         max.z = z;
        //     }
    
        //     如果（x <min.x）{
        //         min.x = x;
        //     }
        //     如果（y <min.y）{
        //         min.y = y;
        //     }
        //     如果（z <min.z）{
        //         min.z = z;
        //     }
        // }）;
    };
    
    },{"../math/Vec3":20,"./ConvexPolyhedron":23,"./Shape":25}],23:[function(_dereq_,module,exports){
    module.exports = ConvexPolyhedron;
    
    var Shape = _dereq_('./Shape');
    var Vec3 = _dereq_('../math/Vec3');
    var Quaternion = _dereq_('../math/Quaternion');
    var Transform = _dereq_('../math/Transform');
    
    /**
     * 一组描述凸形的多边形。
     * @class 凸多角体
     * @constructor
     * @extends Shape
     * @description 形状必须是凸的才能使代码正常工作。没有多边形可以是共面（包含
     * 在同一3D平面中），应该将它们合并为一个多边形。
     *
     * @param {array} points 一系列VEC3
     * @param {array} faces 整数阵列数组，描述每个脸部包含的哪些顶点。
     *
     * @author qiao /https://github.com/qiao（原始作者，请参见https://github.com/qiao/qiao/three.js/commit/85026f0c769e4000148a67d45a9e9b9b9c5108836f）
     * @author schteppe /https://github.com/schteppe
     * @see http://www.altdevblogaday.com/2011/05/13/contact-generation-between-3d-convex-meshes/
     * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
     *
     * @todo 将剪辑功能移动到Contactgenerator？
     * @todo 自动合并构造函数中的共面多边形。
     */
    function ConvexPolyhedron(points, faces, uniqueAxes) {
        Shape.call(this, {
            type: Shape.types.CONVEXPOLYHEDRON
        });
    
        /**
         * VEC3的数组
         * @property 顶点
         * @type {Array}
         */
        this.vertices = points||[];
    
        this.worldVertices = []; // 世界变换版本的vertices
        this.worldVerticesNeedsUpdate = true;
    
        /**
         * 整数阵列数组，指示每个脸部哪个顶点由
         * @property 面孔
         * @type {Array}
         */
        this.faces = faces||[];
    
        /**
         * VEC3的数组
         * @property 面部
         * @type {Array}
         */
        this.faceNormals = [];
        this.computeNormals();
    
        this.worldFaceNormalsNeedsUpdate = true;
        this.worldFaceNormals = []; // 世界转化的版本。
    
        /**
         * VEC3的数组
         * @property 独立
         * @type {Array}
         */
        this.uniqueEdges = [];
    
        /**
         * 如果给出，这些局部定义的，归一化的轴是进行分离轴检查时唯一被检查的轴。
         * @property {Array} uniqueAxes
         */
        this.uniqueAxes = uniqueAxes ? uniqueAxes.slice() : null;
    
        this.computeEdges();
        this.updateBoundingSphereRadius();
    }
    ConvexPolyhedron.prototype = new Shape();
    ConvexPolyhedron.prototype.constructor = ConvexPolyhedron;
    
    var computeEdges_tmpEdge = new Vec3();
    /**
     * 计算独立性
     * @method computeEdges
     */
    ConvexPolyhedron.prototype.computeEdges = function(){
        var faces = this.faces;
        var vertices = this.vertices;
        var nv = vertices.length;
        var edges = this.uniqueEdges;
    
        edges.length = 0;
    
        var edge = computeEdges_tmpEdge;
    
        for(var i=0; i !== faces.length; i++){
            var face = faces[i];
            var numVertices = face.length;
            for(var j = 0; j !== numVertices; j++){
                var k = ( j+1 ) % numVertices;
                vertices[face[j]].vsub(vertices[face[k]], edge);
                edge.normalize();
                var found = false;
                for(var p=0; p !== edges.length; p++){
                    if (edges[p].almostEquals(edge) || edges[p].almostEquals(edge)){
                        found = true;
                        break;
                    }
                }
    
                if (!found){
                    edges.push(edge.clone());
                }
            }
        }
    };
    
    /**
     * 计算脸的正常。如果存在，将重复使用.facenormals数组中的现有VEC3对象。
     * @method computeNormals
     */
    ConvexPolyhedron.prototype.computeNormals = function(){
        this.faceNormals.length = this.faces.length;
    
        // 产生正常
        for(var i=0; i<this.faces.length; i++){
    
            // 检查所有顶点都存在于此面孔
            for(var j=0; j<this.faces[i].length; j++){
                if(!this.vertices[this.faces[i][j]]){
                    throw new Error("Vertex "+this.faces[i][j]+" not found!");
                }
            }
    
            var n = this.faceNormals[i] || new Vec3();
            this.getFaceNormal(i,n);
            n.negate(n);
            this.faceNormals[i] = n;
            var vertex = this.vertices[this.faces[i][0]];
            if(n.dot(vertex) < 0){
                console.error(".faceNormals[" + i + "] = Vec3("+n.toString()+") looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule.");
                for(var j=0; j<this.faces[i].length; j++){
                    console.warn(".vertices["+this.faces[i][j]+"] = Vec3("+this.vertices[this.faces[i][j]].toString()+")");
                }
            }
        }
    };
    
    /**
     * 给出3个顶点的面对正常
     * @static
     * @method getFaceNormal
     * @param {Vec3} va
     * @param {Vec3} vb
     * @param {Vec3} vc
     * @param {Vec3} target
     */
    var cb = new Vec3();
    var ab = new Vec3();
    ConvexPolyhedron.computeNormal = function ( va, vb, vc, target ) {
        vb.vsub(va,ab);
        vc.vsub(vb,cb);
        cb.cross(ab,target);
        if ( !target.isZero() ) {
            target.normalize();
        }
    };
    
    /**
     * 从其顶点计算脸部的正常
     * @method getFaceNormal
     * @param  {Number} i
     * @param  {Vec3} target
     */
    ConvexPolyhedron.prototype.getFaceNormal = function(i,target){
        var f = this.faces[i];
        var va = this.vertices[f[0]];
        var vb = this.vertices[f[1]];
        var vc = this.vertices[f[2]];
        return ConvexPolyhedron.computeNormal(va,vb,vc,target);
    };
    
    /**
     * @method clipAgainstHull
     * @param {Vec3} posA
     * @param {Quaternion} quatA
     * @param {ConvexPolyhedron} hullB
     * @param {Vec3} posB
     * @param {Quaternion} quatB
     * @param {Vec3} separatingNormal
     * @param {Number} minDist 夹具距离
     * @param {Number} maxDist
     * @param {array} result 接触点对象的数组，请参阅clipfaceagainsthull
     * @see http://bullet.googlecode.com/svn/trunk/src/BulletCollision/NarrowPhaseCollision/btPolyhedralContactClipping.cpp
     */
    var cah_WorldNormal = new Vec3();
    ConvexPolyhedron.prototype.clipAgainstHull = function(posA,quatA,hullB,posB,quatB,separatingNormal,minDist,maxDist,result){
        var WorldNormal = cah_WorldNormal;
        var hullA = this;
        var curMaxDist = maxDist;
        var closestFaceB = -1;
        var dmax = -Number.MAX_VALUE;
        for(var face=0; face < hullB.faces.length; face++){
            WorldNormal.copy(hullB.faceNormals[face]);
            quatB.vmult(WorldNormal,WorldNormal);
            //POS B.VADD（世界正常，世界正常）；
            var d = WorldNormal.dot(separatingNormal);
            if (d > dmax){
                dmax = d;
                closestFaceB = face;
            }
        }
        var worldVertsB1 = [];
        var polyB = hullB.faces[closestFaceB];
        var numVertices = polyB.length;
        for(var e0=0; e0<numVertices; e0++){
            var b = hullB.vertices[polyB[e0]];
            var worldb = new Vec3();
            worldb.copy(b);
            quatB.vmult(worldb,worldb);
            posB.vadd(worldb,worldb);
            worldVertsB1.push(worldb);
        }
    
        if (closestFaceB>=0){
            this.clipFaceAgainstHull(separatingNormal,
                                     posA,
                                     quatA,
                                     worldVertsB1,
                                     minDist,
                                     maxDist,
                                     result);
        }
    };
    
    /**
     * 找到该船体和另一个船体之间的分离轴
     * @method findSeparatingAxis
     * @param {ConvexPolyhedron} hullB
     * @param {Vec3} posA
     * @param {Quaternion} quatA
     * @param {Vec3} posB
     * @param {Quaternion} quatB
     * @param {Vec3} target 目标向量保存轴
     * @return {bool} 如果找到分离，则返回false，否则
     */
    var fsa_faceANormalWS3 = new Vec3(),
        fsa_Worldnormal1 = new Vec3(),
        fsa_deltaC = new Vec3(),
        fsa_worldEdge0 = new Vec3(),
        fsa_worldEdge1 = new Vec3(),
        fsa_Cross = new Vec3();
    ConvexPolyhedron.prototype.findSeparatingAxis = function(hullB,posA,quatA,posB,quatB,target, faceListA, faceListB){
        var faceANormalWS3 = fsa_faceANormalWS3,
            Worldnormal1 = fsa_Worldnormal1,
            deltaC = fsa_deltaC,
            worldEdge0 = fsa_worldEdge0,
            worldEdge1 = fsa_worldEdge1,
            Cross = fsa_Cross;
    
        var dmin = Number.MAX_VALUE;
        var hullA = this;
        var curPlaneTests=0;
    
        if(!hullA.uniqueAxes){
    
            var numFacesA = faceListA ? faceListA.length : hullA.faces.length;
    
            // 来自Hulla的测试脸正常
            for(var i=0; i<numFacesA; i++){
                var fi = faceListA ? faceListA[i] : i;
    
                // 使世界面对正常
                faceANormalWS3.copy(hullA.faceNormals[fi]);
                quatA.vmult(faceANormalWS3,faceANormalWS3);
    
                var d = hullA.testSepAxis(faceANormalWS3, hullB, posA, quatA, posB, quatB);
                if(d===false){
                    return false;
                }
    
                if(d<dmin){
                    dmin = d;
                    target.copy(faceANormalWS3);
                }
            }
    
        } else {
    
            // 测试独特的轴
            for(var i = 0; i !== hullA.uniqueAxes.length; i++){
    
                // 获取世界轴
                quatA.vmult(hullA.uniqueAxes[i],faceANormalWS3);
    
                var d = hullA.testSepAxis(faceANormalWS3, hullB, posA, quatA, posB, quatB);
                if(d===false){
                    return false;
                }
    
                if(d<dmin){
                    dmin = d;
                    target.copy(faceANormalWS3);
                }
            }
        }
    
        if(!hullB.uniqueAxes){
    
            // 来自赫尔布的测试脸正常
            var numFacesB = faceListB ? faceListB.length : hullB.faces.length;
            for(var i=0;i<numFacesB;i++){
    
                var fi = faceListB ? faceListB[i] : i;
    
                Worldnormal1.copy(hullB.faceNormals[fi]);
                quatB.vmult(Worldnormal1,Worldnormal1);
                curPlaneTests++;
                var d = hullA.testSepAxis(Worldnormal1, hullB,posA,quatA,posB,quatB);
                if(d===false){
                    return false;
                }
    
                if(d<dmin){
                    dmin = d;
                    target.copy(Worldnormal1);
                }
            }
        } else {
    
            // 测试B中的独特轴
            for(var i = 0; i !== hullB.uniqueAxes.length; i++){
                quatB.vmult(hullB.uniqueAxes[i],Worldnormal1);
    
                curPlaneTests++;
                var d = hullA.testSepAxis(Worldnormal1, hullB,posA,quatA,posB,quatB);
                if(d===false){
                    return false;
                }
    
                if(d<dmin){
                    dmin = d;
                    target.copy(Worldnormal1);
                }
            }
        }
    
        // 测试边缘
        for(var e0=0; e0 !== hullA.uniqueEdges.length; e0++){
    
            // 获得世界优势
            quatA.vmult(hullA.uniqueEdges[e0],worldEdge0);
    
            for(var e1=0; e1 !== hullB.uniqueEdges.length; e1++){
    
                // 获得世界边缘2
                quatB.vmult(hullB.uniqueEdges[e1], worldEdge1);
                worldEdge0.cross(worldEdge1,Cross);
    
                if(!Cross.almostZero()){
                    Cross.normalize();
                    var dist = hullA.testSepAxis(Cross, hullB, posA, quatA, posB, quatB);
                    if(dist === false){
                        return false;
                    }
                    if(dist < dmin){
                        dmin = dist;
                        target.copy(Cross);
                    }
                }
            }
        }
    
        posB.vsub(posA,deltaC);
        if((deltaC.dot(target))>0.0){
            target.negate(target);
        }
    
        return true;
    };
    
    var maxminA=[], maxminB=[];
    
    /**
     * 测试将轴与两个船体分开。两个船体都投射到轴上，如果有一个船体，则返回重叠尺寸。
     * @method testSepAxis
     * @param {Vec3} axis
     * @param {ConvexPolyhedron} hullB
     * @param {Vec3} posA
     * @param {Quaternion} quatA
     * @param {Vec3} posB
     * @param {Quaternion} quatB
     * @return {number} 重叠的深度，或者如果没有穿透，则是错误的。
     */
    ConvexPolyhedron.prototype.testSepAxis = function(axis, hullB, posA, quatA, posB, quatB){
        var hullA=this;
        ConvexPolyhedron.project(hullA, axis, posA, quatA, maxminA);
        ConvexPolyhedron.project(hullB, axis, posB, quatB, maxminB);
        var maxA = maxminA[0];
        var minA = maxminA[1];
        var maxB = maxminB[0];
        var minB = maxminB[1];
        if(maxA<minB || maxB<minA){
            return false; // 分开
        }
        var d0 = maxA - minB;
        var d1 = maxB - minA;
        var depth = d0<d1 ? d0:d1;
        return depth;
    };
    
    var cli_aabbmin = new Vec3(),
        cli_aabbmax = new Vec3();
    
    /**
     * @method calculateLocalInertia
     * @param  {Number} mass
     * @param  {Vec3} target
     */
    ConvexPolyhedron.prototype.calculateLocalInertia = function(mass,target){
        // 大约有盒子惯性
        // 确切的惯性计算过大，但请参见http://geometrictools.com/documentation/polyhedralmassproperties.pdf有关正确的方法
        this.computeLocalAABB(cli_aabbmin,cli_aabbmax);
        var x = cli_aabbmax.x - cli_aabbmin.x,
            y = cli_aabbmax.y - cli_aabbmin.y,
            z = cli_aabbmax.z - cli_aabbmin.z;
        target.x = 1.0 / 12.0 * mass * ( 2*y*2*y + 2*z*2*z );
        target.y = 1.0 / 12.0 * mass * ( 2*x*2*x + 2*z*2*z );
        target.z = 1.0 / 12.0 * mass * ( 2*y*2*y + 2*x*2*x );
    };
    
    /**
     * @method getPlaneConstantOfFace
     * @param  {Number} face_i ind
     * @return {Number}
     */
    ConvexPolyhedron.prototype.getPlaneConstantOfFace = function(face_i){
        var f = this.faces[face_i];
        var n = this.faceNormals[face_i];
        var v = this.vertices[f[0]];
        var c = -n.dot(v);
        return c;
    };
    
    /**
     * 将脸夹在船体上。
     * @method clipFaceAgainstHull
     * @param {Vec3} separatingNormal
     * @param {Vec3} posA
     * @param {Quaternion} quatA
     * @param {Array} worldVertsB1 世界框架中有顶点的VEC3阵列。
     * @param {Number} minDist 距离夹具
     * @param {Number} maxDist
     * @param Array 结果阵列存储所产生的接触点。将是具有属性的对象：点，深度，正常。这些在世界坐标中代表。
     */
    var cfah_faceANormalWS = new Vec3(),
        cfah_edge0 = new Vec3(),
        cfah_WorldEdge0 = new Vec3(),
        cfah_worldPlaneAnormal1 = new Vec3(),
        cfah_planeNormalWS1 = new Vec3(),
        cfah_worldA1 = new Vec3(),
        cfah_localPlaneNormal = new Vec3(),
        cfah_planeNormalWS = new Vec3();
    ConvexPolyhedron.prototype.clipFaceAgainstHull = function(separatingNormal, posA, quatA, worldVertsB1, minDist, maxDist,result){
        var faceANormalWS = cfah_faceANormalWS,
            edge0 = cfah_edge0,
            WorldEdge0 = cfah_WorldEdge0,
            worldPlaneAnormal1 = cfah_worldPlaneAnormal1,
            planeNormalWS1 = cfah_planeNormalWS1,
            worldA1 = cfah_worldA1,
            localPlaneNormal = cfah_localPlaneNormal,
            planeNormalWS = cfah_planeNormalWS;
    
        var hullA = this;
        var worldVertsB2 = [];
        var pVtxIn = worldVertsB1;
        var pVtxOut = worldVertsB2;
        // 找到最接近分离轴的面部
        var closestFaceA = -1;
        var dmin = Number.MAX_VALUE;
        for(var face=0; face<hullA.faces.length; face++){
            faceANormalWS.copy(hullA.faceNormals[face]);
            quatA.vmult(faceANormalWS,faceANormalWS);
            //pos a.vadd（面对正常WS，面对正常WS）；
            var d = faceANormalWS.dot(separatingNormal);
            if (d < dmin){
                dmin = d;
                closestFaceA = face;
            }
        }
        if (closestFaceA < 0){
            // console.log（“ ---没有找到最接近的脸... ---”）;
            return;
        }
        //console.log（“最接近的A：”，ClosestFacea）;
        // 取得脸并构造相连的面孔
        var polyA = hullA.faces[closestFaceA];
        polyA.connectedFaces = [];
        for(var i=0; i<hullA.faces.length; i++){
            for(var j=0; j<hullA.faces[i].length; j++){
                if(polyA.indexOf(hullA.faces[i][j])!==-1 /* 共享一个顶点*/ && i!==closestFaceA /* 不是我们正在寻找连接的人 */ && polyA.connectedFaces.indexOf(i)===-1 /* 尚未添加 */ ){
                    polyA.connectedFaces.push(i);
                }
            }
        }
        // 将多边形夹在赫尔A脸的所有脸部的飞机后部，与见证人的脸相邻
        var numContacts = pVtxIn.length;
        var numVerticesA = polyA.length;
        var res = [];
        for(var e0=0; e0<numVerticesA; e0++){
            var a = hullA.vertices[polyA[e0]];
            var b = hullA.vertices[polyA[(e0+1)%numVerticesA]];
            a.vsub(b,edge0);
            WorldEdge0.copy(edge0);
            quatA.vmult(WorldEdge0,WorldEdge0);
            posA.vadd(WorldEdge0,WorldEdge0);
            worldPlaneAnormal1.copy(this.faceNormals[closestFaceA]);//Transa。 gutvasis（）*bvestor3（字段。M_计划，fields.m_ plan，fields.m_计划2）;
            quatA.vmult(worldPlaneAnormal1,worldPlaneAnormal1);
            posA.vadd(worldPlaneAnormal1,worldPlaneAnormal1);
            WorldEdge0.cross(worldPlaneAnormal1,planeNormalWS1);
            planeNormalWS1.negate(planeNormalWS1);
            worldA1.copy(a);
            quatA.vmult(worldA1,worldA1);
            posA.vadd(worldA1,worldA1);
            var planeEqWS1 = -worldA1.dot(planeNormalWS1);
            var planeEqWS;
            if(true){
                var otherFace = polyA.connectedFaces[e0];
                localPlaneNormal.copy(this.faceNormals[otherFace]);
                var localPlaneEq = this.getPlaneConstantOfFace(otherFace);
    
                planeNormalWS.copy(localPlaneNormal);
                quatA.vmult(planeNormalWS,planeNormalWS);
                //POS A.VADD（平面正常WS，平面正常ws）；
                var planeEqWS = localPlaneEq - planeNormalWS.dot(posA);
            } else  {
                planeNormalWS.copy(planeNormalWS1);
                planeEqWS = planeEqWS1;
            }
    
            // 夹子靠在我们建造的飞机上
            this.clipFaceAgainstPlane(pVtxIn, pVtxOut, planeNormalWS, planeEqWS);
    
            // 扔掉所有夹得的点，但保存剩余直到下一个剪辑
            while(pVtxIn.length){
                pVtxIn.shift();
            }
            while(pVtxOut.length){
                pVtxIn.push(pVtxOut.shift());
            }
        }
    
        //console.log（“剪辑后的结果点：”，pvtxin）;
    
        // 仅保留在证人脸后面的联系点
        localPlaneNormal.copy(this.faceNormals[closestFaceA]);
    
        var localPlaneEq = this.getPlaneConstantOfFace(closestFaceA);
        planeNormalWS.copy(localPlaneNormal);
        quatA.vmult(planeNormalWS,planeNormalWS);
    
        var planeEqWS = localPlaneEq - planeNormalWS.dot(posA);
        for (var i=0; i<pVtxIn.length; i++){
            var depth = planeNormalWS.dot(pVtxIn[i]) + planeEqWS; //???
            /*console.log（“ from normal =”的深度计算，planenormalws.tostring（），和常数“+planeeqws+” and vertex“，pvtxin [i] .toString（），给予“+depth）”+depth）;*/
            if (depth <=minDist){
                console.log("clamped: depth="+depth+" to minDist="+(minDist+""));
                depth = minDist;
            }
    
            if (depth <=maxDist){
                var point = pVtxIn[i];
                if(depth<=0){
                    /*console.log（“ Get Contact Point”，Point.ToString（），
                      “，depth =”，深度，
                      “接触normal =”，分离normal.tostring（），
                      “飞机”，planenormalws.tostring（），
                      "planeconstant”，planeeqws）;*/
                    var p = {
                        point:point,
                        normal:planeNormalWS,
                        depth: depth,
                    };
                    result.push(p);
                }
            }
        }
    };
    
    /**
     * 将脸夹在船体上的脸上。
     * @method clipFaceAgainstPlane
     * @param {Array} inVertices
     * @param {Array} outVertices
     * @param {Vec3} planeNormal
     * @param {Number} planeConstant 数学平面方程中的常数
     */
    ConvexPolyhedron.prototype.clipFaceAgainstPlane = function(inVertices,outVertices, planeNormal, planeConstant){
        var n_dot_first, n_dot_last;
        var numVerts = inVertices.length;
    
        if(numVerts < 2){
            return outVertices;
        }
    
        var firstVertex = inVertices[inVertices.length-1],
            lastVertex =   inVertices[0];
    
        n_dot_first = planeNormal.dot(firstVertex) + planeConstant;
    
        for(var vi = 0; vi < numVerts; vi++){
            lastVertex = inVertices[vi];
            n_dot_last = planeNormal.dot(lastVertex) + planeConstant;
            if(n_dot_first < 0){
                if(n_dot_last < 0){
                    // 启动<0，结束<0，因此输出LastVertex
                    var newv = new Vec3();
                    newv.copy(lastVertex);
                    outVertices.push(newv);
                } else {
                    // 开始<0，end> = 0，因此输出交集
                    var newv = new Vec3();
                    firstVertex.lerp(lastVertex,
                                     n_dot_first / (n_dot_first - n_dot_last),
                                     newv);
                    outVertices.push(newv);
                }
            } else {
                if(n_dot_last<0){
                    // 开始> = 0，结束<0，因此输出交集和结束
                    var newv = new Vec3();
                    firstVertex.lerp(lastVertex,
                                     n_dot_first / (n_dot_first - n_dot_last),
                                     newv);
                    outVertices.push(newv);
                    outVertices.push(lastVertex);
                }
            }
            firstVertex = lastVertex;
            n_dot_first = n_dot_last;
        }
        return outVertices;
    };
    
    // 更新.worldvertices和设置.worldverticesneedsupdate to false。
    ConvexPolyhedron.prototype.computeWorldVertices = function(position,quat){
        var N = this.vertices.length;
        while(this.worldVertices.length < N){
            this.worldVertices.push( new Vec3() );
        }
    
        var verts = this.vertices,
            worldVerts = this.worldVertices;
        for(var i=0; i!==N; i++){
            quat.vmult( verts[i] , worldVerts[i] );
            position.vadd( worldVerts[i] , worldVerts[i] );
        }
    
        this.worldVerticesNeedsUpdate = false;
    };
    
    var computeLocalAABB_worldVert = new Vec3();
    ConvexPolyhedron.prototype.computeLocalAABB = function(aabbmin,aabbmax){
        var n = this.vertices.length,
            vertices = this.vertices,
            worldVert = computeLocalAABB_worldVert;
    
        aabbmin.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        aabbmax.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    
        for(var i=0; i<n; i++){
            var v = vertices[i];
            if     (v.x < aabbmin.x){
                aabbmin.x = v.x;
            } else if(v.x > aabbmax.x){
                aabbmax.x = v.x;
            }
            if     (v.y < aabbmin.y){
                aabbmin.y = v.y;
            } else if(v.y > aabbmax.y){
                aabbmax.y = v.y;
            }
            if     (v.z < aabbmin.z){
                aabbmin.z = v.z;
            } else if(v.z > aabbmax.z){
                aabbmax.z = v.z;
            }
        }
    };
    
    /**
     * 更新.worldvertices和设置.worldverticesneedsupdate to false。
     * @method computeWorldFaceNormals
     * @param  {Quaternion} quat
     */
    ConvexPolyhedron.prototype.computeWorldFaceNormals = function(quat){
        var N = this.faceNormals.length;
        while(this.worldFaceNormals.length < N){
            this.worldFaceNormals.push( new Vec3() );
        }
    
        var normals = this.faceNormals,
            worldNormals = this.worldFaceNormals;
        for(var i=0; i!==N; i++){
            quat.vmult( normals[i] , worldNormals[i] );
        }
    
        this.worldFaceNormalsNeedsUpdate = false;
    };
    
    /**
     * @method updateBoundingSphereRadius
     */
    ConvexPolyhedron.prototype.updateBoundingSphereRadius = function(){
        // 假设点分布在本地（0,0,0）作为中心
        var max2 = 0;
        var verts = this.vertices;
        for(var i=0, N=verts.length; i!==N; i++) {
            var norm2 = verts[i].norm2();
            if(norm2 > max2){
                max2 = norm2;
            }
        }
        this.boundingSphereRadius = Math.sqrt(max2);
    };
    
    var tempWorldVertex = new Vec3();
    
    /**
     * @method calculateWorldAABB
     * @param {Vec3}        pos
     * @param {Quaternion}  quat
     * @param {Vec3}        min
     * @param {Vec3}        max
     */
    ConvexPolyhedron.prototype.calculateWorldAABB = function(pos,quat,min,max){
        var n = this.vertices.length, verts = this.vertices;
        var minx,miny,minz,maxx,maxy,maxz;
        for(var i=0; i<n; i++){
            tempWorldVertex.copy(verts[i]);
            quat.vmult(tempWorldVertex,tempWorldVertex);
            pos.vadd(tempWorldVertex,tempWorldVertex);
            var v = tempWorldVertex;
            if     (v.x < minx || minx===undefined){
                minx = v.x;
            } else if(v.x > maxx || maxx===undefined){
                maxx = v.x;
            }
    
            if     (v.y < miny || miny===undefined){
                miny = v.y;
            } else if(v.y > maxy || maxy===undefined){
                maxy = v.y;
            }
    
            if     (v.z < minz || minz===undefined){
                minz = v.z;
            } else if(v.z > maxz || maxz===undefined){
                maxz = v.z;
            }
        }
        min.set(minx,miny,minz);
        max.set(maxx,maxy,maxz);
    };
    
    /**
     * 获取大约凸量
     * @method volume
     * @return {Number}
     */
    // ConvexPolyhedron.prototype.volume = function(){
    //     return 4.0 * Math.PI * this.boundingSphereRadius / 3.0;
    // };
    
    /**
     * 平均获得所有顶点位置
     * @method getAveragePointLocal
     * @param  {Vec3} target
     * @return {Vec3}
     */
    // ConvexPolyhedron.prototype.getAveragePointLocal = function(target){
    //     target = target || new Vec3();
    //     var n = this.vertices.length,
    //         verts = this.vertices;
    //     for(var i=0; i<n; i++){
    //         target.vadd(verts[i],target);
    //     }
    //     target.mult(1/n,target);
    //     return target;
    // };
    
    /**
     * 转换所有本地点。将更改.vertices
     * @method transformAllPoints
     * @param  {Vec3} offset
     * @param  {Quaternion} quat
     */
    // ConvexPolyhedron.prototype.transformAllPoints = function(offset,quat){
    //     var n = this.vertices.length,
    //         verts = this.vertices;
    
    //     // 施加旋转
    //     if(quat){
    //         // 旋转顶点
    //         for(var i=0; i<n; i++){
    //             var v = verts[i];
    //             quat.vmult(v,v);
    //         }
    //         // 旋转脸部正常
    //         for(var i=0; i<this.faceNormals.length; i++){
    //             var v = this.faceNormals[i];
    //             quat.vmult(v,v);
    //         }
    //         /*
    //         //旋转边缘
    //         for（var i = 0; i <this.uniqueedges.length; i ++）{
    //             var v = this.iniqueedges [i];
    //             quat.vmult（v，v）;
    //         }*/
    //     }
    
    //     // 申请偏移
    //     if(offset){
    //         for(var i=0; i<n; i++){
    //             var v = verts[i];
    //             v.vadd(offset,v);
    //         }
    //     }
    // };
    
    /**
     * 检查P是否在Polyhedra内部。必须在本地坐标中。当且仅当从中所有向量到其他点的方向不到周围的一半的一半时，该点就在其他点的凸面外面。
     * @method pointIsInside
     * @param  {Vec3} p      本地坐标给出的点
     * @return {Boolean}
     */
    // var ConvexPolyhedron_pointIsInside = new Vec3();
    // var ConvexPolyhedron_vToP = new Vec3();
    // var ConvexPolyhedron_vToPointInside = new Vec3();
    // ConvexPolyhedron.prototype.pointIsInside = function(p){
    //     var n = this.vertices.length,
    //         verts = this.vertices,
    //         faces = this.faces,
    //         normals = this.faceNormals;
    //     var positiveResult = null;
    //     var N = this.faces.length;
    //     var pointInside = ConvexPolyhedron_pointIsInside;
    //     this.getAveragePointLocal(pointInside);
    //     for(var i=0; i<N; i++){
    //         var numVertices = this.faces[i].length;
    //         var n = normals[i];
    //         var v = verts[faces[i][0]]; // 我们只需要一个点
    
    //         // 该点产品确定点的边缘是
    //         var vToP = ConvexPolyhedron_vToP;
    //         p.vsub(v,vToP);
    //         var r1 = n.dot(vToP);
    
    //         var vToPointInside = ConvexPolyhedron_vToPointInside;
    //         pointInside.vsub(v,vToPointInside);
    //         var r2 = n.dot(vToPointInside);
    
    //         if((r1<0 && r2>0) || (r1>0 && r2<0)){
    //             return false; // 遇到了其他一些迹象。出口。
    //         } else {
    //         }
    //     }
    
    //     // 如果我们到达这里，所有点产品都有相同的迹象。
    //     return positiveResult ? 1 : -1;
    // };
    
    /**
     * 获取投影到轴上的位置（POS，quat）处的凸船体的最大和最小点产物。结果保存在阵列maxmin中。
     * @static
     * @method project
     * @param {ConvexPolyhedron} hull
     * @param {Vec3} axis
     * @param {Vec3} pos
     * @param {Quaternion} quat
     * @param {array} result 结果[0]和结果[1]将分别设置为最大和最小值。
     */
    var project_worldVertex = new Vec3();
    var project_localAxis = new Vec3();
    var project_localOrigin = new Vec3();
    ConvexPolyhedron.project = function(hull, axis, pos, quat, result){
        var n = hull.vertices.length,
            worldVertex = project_worldVertex,
            localAxis = project_localAxis,
            max = 0,
            min = 0,
            localOrigin = project_localOrigin,
            vs = hull.vertices;
    
        localOrigin.setZero();
    
        // 将轴转换为本地
        Transform.vectorToLocalFrame(pos, quat, axis, localAxis);
        Transform.pointToLocalFrame(pos, quat, localOrigin, localOrigin);
        var add = localOrigin.dot(localAxis);
    
        min = max = vs[0].dot(localAxis);
    
        for(var i = 1; i < n; i++){
            var val = vs[i].dot(localAxis);
    
            if(val > max){
                max = val;
            }
    
            if(val < min){
                min = val;
            }
        }
    
        min -= add;
        max -= add;
    
        if(min > max){
            // 不一致 -交换
            var temp = min;
            min = max;
            max = temp;
        }
        // 输出
        result[0] = max;
        result[1] = min;
    };
    
    },{"../math/Quaternion":18,"../math/Transform":19,"../math/Vec3":20,"./Shape":25}],24:[function(_dereq_,module,exports){
    module.exports = Plane;
    
    var Shape = _dereq_('./Shape');
    var Vec3 = _dereq_('../math/Vec3');
    
    /**
     * 朝z方向朝向的飞机。该平面的表面在z = 0处，而z = 0以下的一切都假定为实心平面。要使平面朝以外的其他方向朝着Z以外的其他方向，您必须将其放在身体内并旋转该身体。看到演示。
     * @class 飞机
     * @constructor
     * @extends Shape
     * @author schteppe
     */
    function Plane(){
        Shape.call(this, {
            type: Shape.types.PLANE
        });
    
        // 面向世界的正常
        this.worldNormal = new Vec3();
        this.worldNormalNeedsUpdate = true;
    
        this.boundingSphereRadius = Number.MAX_VALUE;
    }
    Plane.prototype = new Shape();
    Plane.prototype.constructor = Plane;
    
    Plane.prototype.computeWorldNormal = function(quat){
        var n = this.worldNormal;
        n.set(0,0,1);
        quat.vmult(n,n);
        this.worldNormalNeedsUpdate = false;
    };
    
    Plane.prototype.calculateLocalInertia = function(mass,target){
        target = target || new Vec3();
        return target;
    };
    
    Plane.prototype.volume = function(){
        return Number.MAX_VALUE; // 飞机是无限的...
    };
    
    var tempNormal = new Vec3();
    Plane.prototype.calculateWorldAABB = function(pos, quat, min, max){
        // 平面AABB是无限的，除非正常沿任何轴指向
        tempNormal.set(0,0,1); // 默认平面正常为z
        quat.vmult(tempNormal,tempNormal);
        var maxVal = Number.MAX_VALUE;
        min.set(-maxVal, -maxVal, -maxVal);
        max.set(maxVal, maxVal, maxVal);
    
        if(tempNormal.x === 1){ max.x = pos.x; }
        if(tempNormal.y === 1){ max.y = pos.y; }
        if(tempNormal.z === 1){ max.z = pos.z; }
    
        if(tempNormal.x === -1){ min.x = pos.x; }
        if(tempNormal.y === -1){ min.y = pos.y; }
        if(tempNormal.z === -1){ min.z = pos.z; }
    };
    
    Plane.prototype.updateBoundingSphereRadius = function(){
        this.boundingSphereRadius = Number.MAX_VALUE;
    };
    },{"../math/Vec3":20,"./Shape":25}],25:[function(_dereq_,module,exports){
    module.exports = Shape;
    
    var Shape = _dereq_('./Shape');
    var Vec3 = _dereq_('../math/Vec3');
    var Quaternion = _dereq_('../math/Quaternion');
    var Material = _dereq_('../material/Material');
    
    /**
     * 形状的基础
     * @class 形状
     * @constructor
     * @param {object} [options]
     * @param {number} [options.collisionFilterGroup=1]
     * @param {number} [options.collisionFilterMask=-1]
     * @param {number} [options.collisionResponse=true]
     * @param {number} [options.material=null]
     * @author schteppe
     */
    function Shape(options){
        options = options || {};
    
        /**
         * 形状的标识符。
         * @property {number} id
         */
        this.id = Shape.idCounter++;
    
        /**
         * 这种形状的类型。必须通过子类设置为INT> 0。
         * @property 类型
         * @type {Number}
         * @see Shape.types
         */
        this.type = options.type || 0;
    
        /**
         * 该形状的局部边界球半径。
         * @property {Number} boundingSphereRadius
         */
        this.boundingSphereRadius = 0;
    
        /**
         * 是否在与其他物体接触时是否产生接触力。请注意，将生成联系人，但将被禁用。
         * @property {boolean} collisionResponse
         */
        this.collisionResponse = options.collisionResponse ? options.collisionResponse : true;
    
        /**
         * @property {Number} collisionFilterGroup
         */
        this.collisionFilterGroup = options.collisionFilterGroup !== undefined ? options.collisionFilterGroup : 1;
    
        /**
         * @property {Number} collisionFilterMask
         */
        this.collisionFilterMask = options.collisionFilterMask !== undefined ? options.collisionFilterMask : -1;
    
        /**
         * @property {Material} material
         */
        this.material = options.material ? options.material : null;
    
        /**
         * @property {Body} body
         */
        this.body = null;
    }
    Shape.prototype.constructor = Shape;
    
    /**
     * 计算边界球半径。结果存储在属性中.boundingspheraradius
     * @method updateBoundingSphereRadius
     */
    Shape.prototype.updateBoundingSphereRadius = function(){
        throw "computeBoundingSphereRadius() not implemented for shape type "+this.type;
    };
    
    /**
     * 获取这种形状的音量
     * @method volume
     * @return {Number}
     */
    Shape.prototype.volume = function(){
        throw "volume() not implemented for shape type "+this.type;
    };
    
    /**
     * 为此形状计算本地框架中的惯性。
     * @method calculateLocalInertia
     * @param {Number} mass
     * @param {Vec3} target
     * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
     */
    Shape.prototype.calculateLocalInertia = function(mass,target){
        throw "calculateLocalInertia() not implemented for shape type "+this.type;
    };
    
    Shape.idCounter = 0;
    
    /**
     * 可用的形状类型。
     * @static
     * @property 类型
     * @type {Object}
     */
    Shape.types = {
        SPHERE:1,
        PLANE:2,
        BOX:4,
        COMPOUND:8,
        CONVEXPOLYHEDRON:16,
        HEIGHTFIELD:32,
        PARTICLE:64,
        CYLINDER:128,
        TRIMESH:256
    };
    
    
    },{"../material/Material":15,"../math/Quaternion":18,"../math/Vec3":20,"./Shape":25}],26:[function(_dereq_,module,exports){
    module.exports = Sphere;
    
    var Shape = _dereq_('./Shape');
    var Vec3 = _dereq_('../math/Vec3');
    
    /**
     * 球形形状
     * @class 领域
     * @constructor
     * @extends Shape
     * @param {Number} radius 球的半径，一个非负数。
     * @author schteppe /http://github.com/schteppe
     */
    function Sphere(radius){
        Shape.call(this, {
            type: Shape.types.SPHERE
        });
    
        /**
         * @property {Number} radius
         */
        this.radius = radius !== undefined ? radius : 1.0;
    
        if(this.radius < 0){
            throw new Error('The sphere radius cannot be negative.');
        }
    
        this.updateBoundingSphereRadius();
    }
    Sphere.prototype = new Shape();
    Sphere.prototype.constructor = Sphere;
    
    Sphere.prototype.calculateLocalInertia = function(mass,target){
        target = target || new Vec3();
        var I = 2.0*mass*this.radius*this.radius/5.0;
        target.x = I;
        target.y = I;
        target.z = I;
        return target;
    };
    
    Sphere.prototype.volume = function(){
        return 4.0 * Math.PI * this.radius / 3.0;
    };
    
    Sphere.prototype.updateBoundingSphereRadius = function(){
        this.boundingSphereRadius = this.radius;
    };
    
    Sphere.prototype.calculateWorldAABB = function(pos,quat,min,max){
        var r = this.radius;
        var axes = ['x','y','z'];
        for(var i=0; i<axes.length; i++){
            var ax = axes[i];
            min[ax] = pos[ax] - r;
            max[ax] = pos[ax] + r;
        }
    };
    
    },{"../math/Vec3":20,"./Shape":25}],27:[function(_dereq_,module,exports){
    module.exports = GSSolver;
    
    var Vec3 = _dereq_('../math/Vec3');
    var Quaternion = _dereq_('../math/Quaternion');
    var Solver = _dereq_('./Solver');
    
    /**
     * 约束方程式高斯 -西德求解器。
     * @class GSSOLVER
     * @constructor
     * @todo 应针对每个约束，而不是全球指定怪异参数。
     * @author schteppe /https://github.com/schteppe
     * @see https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf
     * @extends Solver
     */
    function GSSolver(){
        Solver.call(this);
    
        /**
         * 求解器迭代的数量决定了世界上约束的质量。迭代越多，模拟越正确。不过，更多的迭代需要更多的计算。如果您的世界中有很大的重力力量，则需要更多的迭代。
         * @property 迭代
         * @type {Number}
         * @todo 在Wiki中写更多有关求解器和迭代的信息
         */
        this.iterations = 10;
    
        /**
         * 当达到公差时，假定系统会收敛。
         * @property 宽容
         * @type {Number}
         */
        this.tolerance = 1e-7;
    }
    GSSolver.prototype = new Solver();
    
    var GSSolver_solve_lambda = []; // 只是我们要重复使用每个求解的临时数字持有人。
    var GSSolver_solve_invCs = [];
    var GSSolver_solve_Bs = [];
    GSSolver.prototype.solve = function(dt,world){
        var iter = 0,
            maxIter = this.iterations,
            tolSquared = this.tolerance*this.tolerance,
            equations = this.equations,
            Neq = equations.length,
            bodies = world.bodies,
            Nbodies = bodies.length,
            h = dt,
            q, B, invC, deltalambda, deltalambdaTot, GWlambda, lambdaj;
    
        // 更新解决质量
        if(Neq !== 0){
            for(var i=0; i!==Nbodies; i++){
                bodies[i].updateSolveMassProperties();
            }
        }
    
        // 可以在迭代期间不变的事情一次计算一次
        var invCs = GSSolver_solve_invCs,
            Bs = GSSolver_solve_Bs,
            lambda = GSSolver_solve_lambda;
        invCs.length = Neq;
        Bs.length = Neq;
        lambda.length = Neq;
        for(var i=0; i!==Neq; i++){
            var c = equations[i];
            lambda[i] = 0.0;
            Bs[i] = c.computeB(h);
            invCs[i] = 1.0 / c.computeC();
        }
    
        if(Neq !== 0){
    
            // 重置Vlambda
            for(var i=0; i!==Nbodies; i++){
                var b=bodies[i],
                    vlambda=b.vlambda,
                    wlambda=b.wlambda;
                vlambda.set(0,0,0);
                wlambda.set(0,0,0);
            }
    
            // 迭代方程式
            for(iter=0; iter!==maxIter; iter++){
    
                // 累积每次迭代的总误差。
                deltalambdaTot = 0.0;
    
                for(var j=0; j!==Neq; j++){
    
                    var c = equations[j];
    
                    // 计算迭代
                    B = Bs[j];
                    invC = invCs[j];
                    lambdaj = lambda[j];
                    GWlambda = c.computeGWlambda();
                    deltalambda = invC * ( B - GWlambda - c.eps * lambdaj );
    
                    // 夹具如果我们不在最小/最大间隔内
                    if(lambdaj + deltalambda < c.minForce){
                        deltalambda = c.minForce - lambdaj;
                    } else if(lambdaj + deltalambda > c.maxForce){
                        deltalambda = c.maxForce - lambdaj;
                    }
                    lambda[j] += deltalambda;
    
                    deltalambdaTot += deltalambda > 0.0 ? deltalambda : -deltalambda; // ABS（Deltalambda）
    
                    c.addToWlambda(deltalambda);
                }
    
                // 如果总错误足够小 -停止迭代
                if(deltalambdaTot*deltalambdaTot < tolSquared){
                    break;
                }
            }
    
            // 将结果添加到速度
            for(var i=0; i!==Nbodies; i++){
                var b=bodies[i],
                    v=b.velocity,
                    w=b.angularVelocity;
    
                b.vlambda.vmul(b.linearFactor, b.vlambda);
                v.vadd(b.vlambda, v);
    
                b.wlambda.vmul(b.angularFactor, b.wlambda);
                w.vadd(b.wlambda, w);
            }
    
            // 设置每个方程的.Multiplier属性
            var l = equations.length;
            var invDt = 1 / h;
            while(l--){
                equations[l].multiplier = lambda[l] * invDt;
            }
        }
    
        return iter;
    };
    
    },{"../math/Quaternion":18,"../math/Vec3":20,"./Solver":28}],28:[function(_dereq_,module,exports){
    module.exports = Solver;
    
    /**
     * 约束方程求解器基类。
     * @class 求解器
     * @constructor
     * @author schteppe /https://github.com/schteppe
     */
    function Solver(){
        /**
         * 所有要解决的方程式
         * @property {Array} equations
         */
        this.equations = [];
    }
    
    /**
     * 应该在子类中实施！
     * @method solve
     * @param  {Number} dt
     * @param  {World} world
     */
    Solver.prototype.solve = function(dt,world){
        // 应该返回迭代次数！
        return 0;
    };
    
    /**
     * 添加一个方程
     * @method addEquation
     * @param {Equation} eq
     */
    Solver.prototype.addEquation = function(eq){
        if (eq.enabled) {
            this.equations.push(eq);
        }
    };
    
    /**
     * 删除方程
     * @method removeEquation
     * @param {Equation} eq
     */
    Solver.prototype.removeEquation = function(eq){
        var eqs = this.equations;
        var i = eqs.indexOf(eq);
        if(i !== -1){
            eqs.splice(i,1);
        }
    };
    
    /**
     * 添加所有方程
     * @method removeAllEquations
     */
    Solver.prototype.removeAllEquations = function(){
        this.equations.length = 0;
    };
    
    
    },{}],29:[function(_dereq_,module,exports){
    /**
     * 用于调度事件的对象的基类。
     * @class EventTarget
     * @constructor
     */
    var EventTarget = function () {
    
    };
    
    module.exports = EventTarget;
    
    EventTarget.prototype = {
        constructor: EventTarget,
    
        /**
         * 添加活动听众
         * @method addEventListener
         * @param  {String} type
         * @param  {Function} listener
         * @return {EventTarget} 自我对象，用于链性。
         */
        addEventListener: function ( type, listener ) {
            if ( this._listeners === undefined ){ this._listeners = {}; }
            var listeners = this._listeners;
            if ( listeners[ type ] === undefined ) {
                listeners[ type ] = [];
            }
            if ( listeners[ type ].indexOf( listener ) === - 1 ) {
                listeners[ type ].push( listener );
            }
            return this;
        },
    
        /**
         * 检查是否添加了事件听众
         * @method hasEventListener
         * @param  {String} type
         * @param  {Function} listener
         * @return {Boolean}
         */
        hasEventListener: function ( type, listener ) {
            if ( this._listeners === undefined ){ return false; }
            var listeners = this._listeners;
            if ( listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1 ) {
                return true;
            }
            return false;
        },
    
        /**
         * 检查是否添加了给定类型的任何事件侦听器
         * @method hasAnyEventListener
         * @param  {String} type
         * @return {Boolean}
         */
        hasAnyEventListener: function ( type ) {
            if ( this._listeners === undefined ){ return false; }
            var listeners = this._listeners;
            return ( listeners[ type ] !== undefined );
        },
    
        /**
         * 删除活动听众
         * @method removeEventListener
         * @param  {String} type
         * @param  {Function} listener
         * @return {EventTarget} 自我对象，用于链性。
         */
        removeEventListener: function ( type, listener ) {
            if ( this._listeners === undefined ){ return this; }
            var listeners = this._listeners;
            if ( listeners[type] === undefined ){ return this; }
            var index = listeners[ type ].indexOf( listener );
            if ( index !== - 1 ) {
                listeners[ type ].splice( index, 1 );
            }
            return this;
        },
    
        /**
         * 发出活动。
         * @method dispatchEvent
         * @param  {Object} event
         * @param  {String} event.type
         * @return {EventTarget} 自我对象，用于链性。
         */
        dispatchEvent: function ( event ) {
            if ( this._listeners === undefined ){ return this; }
            var listeners = this._listeners;
            var listenerArray = listeners[ event.type ];
            if ( listenerArray !== undefined ) {
                event.target = this;
                for ( var i = 0, l = listenerArray.length; i < l; i ++ ) {
                    listenerArray[ i ].call( this, event );
                }
            }
            return this;
        }
    };
    
    },{}],30:[function(_dereq_,module,exports){
    module.exports = Pool;
    
    /**
     * 用于合并可以重复使用的对象。
     * @class 水池
     * @constructor
     */
    function Pool(){
        /**
         * 汇总对象
         * @property {Array} objects
         */
        this.objects = [];
    
        /**
         * 对象的构造函数
         * @property {mixed} type
         */
        this.type = Object;
    }
    
    /**
     * 使用后释放对象
     * @method release
     * @param {Object} obj
     */
    Pool.prototype.release = function(){
        var Nargs = arguments.length;
        for(var i=0; i!==Nargs; i++){
            this.objects.push(arguments[i]);
        }
        return this;
    };
    
    /**
     * 获取一个对象
     * @method get
     * @return {mixed}
     */
    Pool.prototype.get = function(){
        if(this.objects.length===0){
            return this.constructObject();
        } else {
            return this.objects.pop();
        }
    };
    
    /**
     * 构建一个对象。应在每个子类中实现。
     * @method constructObject
     * @return {mixed}
     */
    Pool.prototype.constructObject = function(){
        throw new Error("constructObject() not implemented in this Pool subclass yet!");
    };
    
    /**
     * @method resize
     * @param {number} size
     * @return {Pool} 自我，用于束缚
     */
    Pool.prototype.resize = function (size) {
        var objects = this.objects;
    
        while (objects.length > size) {
            objects.pop();
        }
    
        while (objects.length < size) {
            objects.push(this.constructObject());
        }
    
        return this;
    };
    
    
    },{}],31:[function(_dereq_,module,exports){
    module.exports = TupleDictionary;
    
    /**
     * @class 图片
     * @constructor
     */
    function TupleDictionary() {
    
        /**
         * 数据存储
         * @property 数据
         * @type {Object}
         */
        this.data = { keys:[] };
    }
    
    /**
     * @method get
     * @param  {Number} i
     * @param  {Number} j
     * @return {Number}
     */
    TupleDictionary.prototype.get = function(i, j) {
        if (i > j) {
            // 交换
            var temp = j;
            j = i;
            i = temp;
        }
        return this.data[i+'-'+j];
    };
    
    /**
     * @method set
     * @param  {Number} i
     * @param  {Number} j
     * @param {Number} value
     */
    TupleDictionary.prototype.set = function(i, j, value) {
        if (i > j) {
            var temp = j;
            j = i;
            i = temp;
        }
        var key = i+'-'+j;
    
        // 检查密钥是否已经存在
        if(!this.get(i,j)){
            this.data.keys.push(key);
        }
    
        this.data[key] = value;
    };
    
    /**
     * @method reset
     */
    TupleDictionary.prototype.reset = function() {
        var data = this.data,
            keys = data.keys;
        while(keys.length > 0){
            var key = keys.pop();
            delete data[key];
        }
    };
    
    },{}],32:[function(_dereq_,module,exports){
    function Utils(){}
    
    module.exports = Utils;
    
    /**
     * 扩展具有默认值的选项对象。
     * @static
     * @method defaults
     * @param  {object} options 选项对象。可能是虚假的：在这种情况下，将创建并返回一个新对象。
     * @param  {object} defaults 包含默认值的对象。
     * @return {object} 修改后的选项对象。
     */
    Utils.defaults = function(options, defaults){
        options = options || {};
    
        for(var key in defaults){
            if(!(key in options)){
                options[key] = defaults[key];
            }
        }
    
        return options;
    };
    
    },{}],33:[function(_dereq_,module,exports){
    module.exports = Vec3Pool;
    
    var Vec3 = _dereq_('../math/Vec3');
    var Pool = _dereq_('./Pool');
    
    /**
     * @class VEC3POOL
     * @constructor
     * @extends Pool
     */
    function Vec3Pool(){
        Pool.call(this);
        this.type = Vec3;
    }
    Vec3Pool.prototype = new Pool();
    
    /**
     * 构建矢量
     * @method constructObject
     * @return {Vec3}
     */
    Vec3Pool.prototype.constructObject = function(){
        return new Vec3();
    };
    
    },{"../math/Vec3":20,"./Pool":30}],34:[function(_dereq_,module,exports){
    module.exports = Narrowphase;
    
    var AABB = _dereq_('../collision/AABB');
    var Body = _dereq_('../objects/Body');
    var Shape = _dereq_('../shapes/Shape');
    var Ray = _dereq_('../collision/Ray');
    var Vec3 = _dereq_('../math/Vec3');
    var Transform = _dereq_('../math/Transform');
    var ConvexPolyhedron = _dereq_('../shapes/ConvexPolyhedron');
    var Quaternion = _dereq_('../math/Quaternion');
    var Solver = _dereq_('../solver/Solver');
    var Vec3Pool = _dereq_('../utils/Vec3Pool');
    var ContactEquation = _dereq_('../equations/ContactEquation');
    var FrictionEquation = _dereq_('../equations/FrictionEquation');
    
    /**
     * 世界的助手课。生成联系人方程。
     * @class 狭窄
     * @constructor
     * @todo 球体 -串联体触点
     * @todo 接触减少
     * @todo  应该将方法移至原型
     */
    function Narrowphase(world){
    
        /**
         * 集合联系点的内部存储。
         * @property {Array} contactPointPool
         */
        this.contactPointPool = [];
    
        this.frictionEquationPool = [];
    
        this.result = [];
        this.frictionResult = [];
    
        /**
         * 汇总的向量。
         * @property {Vec3Pool} v3pool
         */
        this.v3pool = new Vec3Pool();
    
        this.world = world;
        this.currentContactMaterial = null;
    
        /**
         * @property {Boolean} enableFrictionReduction
         */
        this.enableFrictionReduction = false;
    }
    
    /**
     * 通过使用内部池或创建新的池进行联系对象。
     * @method createContactEquation
     * @param {Body} bi
     * @param {Body} bj
     * @param {Shape} si
     * @param {Shape} sj
     * @param {Shape} overrideShapeA
     * @param {Shape} overrideShapeB
     * @return {ContactEquation}
     */
    Narrowphase.prototype.createContactEquation = function(bi, bj, si, sj, overrideShapeA, overrideShapeB){
        var c;
        if(this.contactPointPool.length){
            c = this.contactPointPool.pop();
            c.bi = bi;
            c.bj = bj;
        } else {
            c = new ContactEquation(bi, bj);
        }
    
        c.enabled = bi.collisionResponse && bj.collisionResponse && si.collisionResponse && sj.collisionResponse;
    
        var cm = this.currentContactMaterial;
    
        c.restitution = cm.restitution;
    
        c.setSpookParams(
            cm.contactEquationStiffness,
            cm.contactEquationRelaxation,
            this.world.dt
        );
    
        var matA = si.material || bi.material;
        var matB = sj.material || bj.material;
        if(matA && matB && matA.restitution >= 0 && matB.restitution >= 0){
            c.restitution = matA.restitution * matB.restitution;
        }
    
        c.si = overrideShapeA || si;
        c.sj = overrideShapeB || sj;
    
        return c;
    };
    
    Narrowphase.prototype.createFrictionEquationsFromContact = function(contactEquation, outArray){
        var bodyA = contactEquation.bi;
        var bodyB = contactEquation.bj;
        var shapeA = contactEquation.si;
        var shapeB = contactEquation.sj;
    
        var world = this.world;
        var cm = this.currentContactMaterial;
    
        // 如果材料中指定了摩擦或恢复原状，请使用它们
        var friction = cm.friction;
        var matA = shapeA.material || bodyA.material;
        var matB = shapeB.material || bodyB.material;
        if(matA && matB && matA.friction >= 0 && matB.friction >= 0){
            friction = matA.friction * matB.friction;
        }
    
        if(friction > 0){
    
            // 创建2个切线方程
            var mug = friction * world.gravity.length();
            var reducedMass = (bodyA.invMass + bodyB.invMass);
            if(reducedMass > 0){
                reducedMass = 1/reducedMass;
            }
            var pool = this.frictionEquationPool;
            var c1 = pool.length ? pool.pop() : new FrictionEquation(bodyA,bodyB,mug*reducedMass);
            var c2 = pool.length ? pool.pop() : new FrictionEquation(bodyA,bodyB,mug*reducedMass);
    
            c1.bi = c2.bi = bodyA;
            c1.bj = c2.bj = bodyB;
            c1.minForce = c2.minForce = -mug*reducedMass;
            c1.maxForce = c2.maxForce = mug*reducedMass;
    
            // 复制相对向量
            c1.ri.copy(contactEquation.ri);
            c1.rj.copy(contactEquation.rj);
            c2.ri.copy(contactEquation.ri);
            c2.rj.copy(contactEquation.rj);
    
            // 构建切线
            contactEquation.ni.tangents(c1.t, c2.t);
    
            // 设置Spook参数
            c1.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, world.dt);
            c2.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, world.dt);
    
            c1.enabled = c2.enabled = contactEquation.enabled;
    
            outArray.push(c1, c2);
    
            return true;
        }
    
        return false;
    };
    
    var averageNormal = new Vec3();
    var averageContactPointA = new Vec3();
    var averageContactPointB = new Vec3();
    
    // 以飞机上的平均N最新联系点。
    Narrowphase.prototype.createFrictionFromAverage = function(numContacts){
        // // 最后一个联系方程
        // var c = this.result[this.result.length - 1];
    
        // // 创建结果：两个“平均”摩擦方程
        // if (!this.createFrictionEquationsFromContact(c, this.frictionResult) || numContacts === 1) {
        //     return;
        // }
    
        // var f1 = this.frictionResult[this.frictionResult.length - 2];
        // var f2 = this.frictionResult[this.frictionResult.length - 1];
    
        // averageNormal.setZero();
        // averageContactPointA.setZero();
        // averageContactPointB.setZero();
    
        // var bodyA = c.bi;
        // var bodyB = c.bj;
        // for(var i=0; i!==numContacts; i++){
        //     c = this.result[this.result.length - 1 - i];
        //     if(c.bodyA !== bodyA){
        //         averageNormal.vadd(c.ni, averageNormal);
        //         averageContactPointA.vadd(c.ri, averageContactPointA);
        //         averageContactPointB.vadd(c.rj, averageContactPointB);
        //     } else {
        //         averageNormal.vsub(c.ni, averageNormal);
        //         averageContactPointA.vadd(c.rj, averageContactPointA);
        //         averageContactPointB.vadd(c.ri, averageContactPointB);
        //     }
        // }
    
        // var invNumContacts = 1 / numContacts;
        // averageContactPointA.scale(invNumContacts, f1.ri);
        // averageContactPointB.scale(invNumContacts, f1.rj);
        // f2.ri.copy(f1.ri); // 应该一样
        // f2.rj.copy(f1.rj);
        // averageNormal.normalize();
        // averageNormal.tangents(f1.t, f2.t);
        // 返回等式;
    };
    
    
    var tmpVec1 = new Vec3();
    var tmpVec2 = new Vec3();
    var tmpQuat1 = new Quaternion();
    var tmpQuat2 = new Quaternion();
    
    /**
     * 在身体对列表之间产生所有联系
     * @method getContacts
     * @param {array} p1 身体指标阵列
     * @param {array} p2 身体指标阵列
     * @param {World} world
     * @param {array} result 存储生成的联系人的阵列
     * @param {array} oldcontacts 选修的。可重复使用的接触对象阵列
     */
    Narrowphase.prototype.getContacts = function(p1, p2, world, result, oldcontacts, frictionResult, frictionPool){
        // 保存旧的联系人对象
        this.contactPointPool = oldcontacts;
        this.frictionEquationPool = frictionPool;
        this.result = result;
        this.frictionResult = frictionResult;
    
        var qi = tmpQuat1;
        var qj = tmpQuat2;
        var xi = tmpVec1;
        var xj = tmpVec2;
    
        for(var k=0, N=p1.length; k!==N; k++){
    
            // 获取当前的碰撞机构
            var bi = p1[k],
                bj = p2[k];
    
            // 获取联系材料
            var bodyContactMaterial = null;
            if(bi.material && bj.material){
                bodyContactMaterial = world.getContactMaterial(bi.material,bj.material) || null;
            }
    
            var justTest = (
                (
                    (bi.type & Body.KINEMATIC) && (bj.type & Body.STATIC)
                ) || (
                    (bi.type & Body.STATIC) && (bj.type & Body.KINEMATIC)
                ) || (
                    (bi.type & Body.KINEMATIC) && (bj.type & Body.KINEMATIC)
                )
            );
    
            for (var i = 0; i < bi.shapes.length; i++) {
                bi.quaternion.mult(bi.shapeOrientations[i], qi);
                bi.quaternion.vmult(bi.shapeOffsets[i], xi);
                xi.vadd(bi.position, xi);
                var si = bi.shapes[i];
    
                for (var j = 0; j < bj.shapes.length; j++) {
    
                    // 计算形状的世界变换
                    bj.quaternion.mult(bj.shapeOrientations[j], qj);
                    bj.quaternion.vmult(bj.shapeOffsets[j], xj);
                    xj.vadd(bj.position, xj);
                    var sj = bj.shapes[j];
    
                    if(!((si.collisionFilterMask & sj.collisionFilterGroup) && (sj.collisionFilterMask & si.collisionFilterGroup))){
                        continue;
                    }
    
                    if(xi.distanceTo(xj) > si.boundingSphereRadius + sj.boundingSphereRadius){
                        continue;
                    }
    
                    // 获取碰撞材料
                    var shapeContactMaterial = null;
                    if(si.material && sj.material){
                        shapeContactMaterial = world.getContactMaterial(si.material,sj.material) || null;
                    }
    
                    this.currentContactMaterial = shapeContactMaterial || bodyContactMaterial || world.defaultContactMaterial;
    
                    // 获得联系
                    var resolver = this[si.type | sj.type];
                    if(resolver){
                        var retval = false;
                        if (si.type < sj.type) {
                            retval = resolver.call(this, si, sj, xi, xj, qi, qj, bi, bj, si, sj, justTest);
                        } else {
                            retval = resolver.call(this, sj, si, xj, xi, qj, qi, bj, bi, si, sj, justTest);
                        }
    
                        if(retval && justTest){
                            // 注册重叠
                            world.shapeOverlapKeeper.set(si.id, sj.id);
                            world.bodyOverlapKeeper.set(bi.id, bj.id);
                        }
                    }
                }
            }
        }
    };
    
    var numWarnings = 0;
    var maxWarnings = 10;
    
    function warn(msg){
        if(numWarnings > maxWarnings){
            return;
        }
    
        numWarnings++;
    
        console.warn(msg);
    }
    
    Narrowphase.prototype[Shape.types.BOX | Shape.types.BOX] =
    Narrowphase.prototype.boxBox = function(si,sj,xi,xj,qi,qj,bi,bj,rsi,rsj,justTest){
        si.convexPolyhedronRepresentation.material = si.material;
        sj.convexPolyhedronRepresentation.material = sj.material;
        si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
        sj.convexPolyhedronRepresentation.collisionResponse = sj.collisionResponse;
        return this.convexConvex(si.convexPolyhedronRepresentation,sj.convexPolyhedronRepresentation,xi,xj,qi,qj,bi,bj,si,sj,justTest);
    };
    
    Narrowphase.prototype[Shape.types.BOX | Shape.types.CONVEXPOLYHEDRON] =
    Narrowphase.prototype.boxConvex = function(si,sj,xi,xj,qi,qj,bi,bj,rsi,rsj,justTest){
        si.convexPolyhedronRepresentation.material = si.material;
        si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
        return this.convexConvex(si.convexPolyhedronRepresentation,sj,xi,xj,qi,qj,bi,bj,si,sj,justTest);
    };
    
    Narrowphase.prototype[Shape.types.BOX | Shape.types.PARTICLE] =
    // Narrowphase.prototype.boxParticle = function(si,sj,xi,xj,qi,qj,bi,bj,rsi,rsj,justTest){
    //     si.convexPolyhedronRepresentation.material = si.material;
    //     si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
    //     return this.convexParticle(si.convexPolyhedronRepresentation,sj,xi,xj,qi,qj,bi,bj,si,sj,justTest);
    // };
    
    /**
     * @method sphereSphere
     * @param  {Shape}      si
     * @param  {Shape}      sj
     * @param  {Vec3}       xi
     * @param  {Vec3}       xj
     * @param  {Quaternion} qi
     * @param  {Quaternion} qj
     * @param  {Body}       bi
     * @param  {Body}       bj
     */
    Narrowphase.prototype[Shape.types.SPHERE] =
    Narrowphase.prototype.sphereSphere = function(si,sj,xi,xj,qi,qj,bi,bj,rsi,rsj,justTest){
        if(justTest){
            return xi.distanceSquared(xj) < Math.pow(si.radius + sj.radius, 2);
        }
    
        // 在这种情况下，我们只有一个联系
        var r = this.createContactEquation(bi,bj,si,sj,rsi,rsj);
    
        // 联系正常
        xj.vsub(xi, r.ni);
        r.ni.normalize();
    
        // 联系点位置
        r.ri.copy(r.ni);
        r.rj.copy(r.ni);
        r.ri.mult(si.radius, r.ri);
        r.rj.mult(-sj.radius, r.rj);
    
        r.ri.vadd(xi, r.ri);
        r.ri.vsub(bi.position, r.ri);
    
        r.rj.vadd(xj, r.rj);
        r.rj.vsub(bj.position, r.rj);
    
        this.result.push(r);
    
        this.createFrictionEquationsFromContact(r, this.frictionResult);
    };
    
    /**
     * @method planeTrimesh
     * @param  {Shape}      si
     * @param  {Shape}      sj
     * @param  {Vec3}       xi
     * @param  {Vec3}       xj
     * @param  {Quaternion} qi
     * @param  {Quaternion} qj
     * @param  {Body}       bi
     * @param  {Body}       bj
     */
    // var planeTrimesh_normal = new Vec3();
    // var planeTrimesh_relpos = new Vec3();
    // var planeTrimesh_projected = new Vec3();
    // Narrowphase.prototype[Shape.types.PLANE | Shape.types.TRIMESH] =
    // Narrowphase.prototype.planeTrimesh = function(
    //     planeShape,
    //     trimeshShape,
    //     planePos,
    //     trimeshPos,
    //     planeQuat,
    //     trimeshQuat,
    //     planeBody,
    //     trimeshBody,
    //     rsi,
    //     rsj,
    //     justTest
    // ){
    //     // 联系！
    //     var v = new Vec3();
    
    //     var normal = planeTrimesh_normal;
    //     normal.set(0,0,1);
    //     planeQuat.vmult(normal,normal); // 根据平面转动正常
    
    //     for(var i=0; i<trimeshShape.vertices.length / 3; i++){
    
    //         // 从trimeh获取世界顶点
    //         trimeshShape.getVertex(i, v);
    
    //         // 安全
    //         var v2 = new Vec3();
    //         v2.copy(v);
    //         Transform.pointToWorldFrame(trimeshPos, trimeshQuat, v2, v);
    
    //         // 检查平面侧
    //         var relpos = planeTrimesh_relpos;
    //         v.vsub(planePos, relpos);
    //         var dot = normal.dot(relpos);
    
    //         if(dot <= 0.0){
    //             if(justTest){
    //                 return true;
    //             }
    
    //             var r = this.createContactEquation(planeBody,trimeshBody,planeShape,trimeshShape,rsi,rsj);
    
    //             r.ni.copy(normal); // 接触正常是正常的平面
    
    //             // 在飞机上投射出顶点位置
    //             var projected = planeTrimesh_projected;
    //             normal.scale(relpos.dot(normal), projected);
    //             v.vsub(projected,projected);
    
    //             // RI是预计世界位置减去飞机位置
    //             r.ri.copy(projected);
    //             r.ri.vsub(planeBody.position, r.ri);
    
    //             r.rj.copy(v);
    //             r.rj.vsub(trimeshBody.position, r.rj);
    
    //             // 存储结果
    //             this.result.push(r);
    //             this.createFrictionEquationsFromContact(r, this.frictionResult);
    //         }
    //     }
    // };
    
    /**
     * @method sphereTrimesh
     * @param  {Shape}      sphereShape
     * @param  {Shape}      trimeshShape
     * @param  {Vec3}       spherePos
     * @param  {Vec3}       trimeshPos
     * @param  {Quaternion} sphereQuat
     * @param  {Quaternion} trimeshQuat
     * @param  {Body}       sphereBody
     * @param  {Body}       trimeshBody
     */
    // var sphereTrimesh_normal = new Vec3();
    // var sphereTrimesh_relpos = new Vec3();
    // var sphereTrimesh_projected = new Vec3();
    // var sphereTrimesh_v = new Vec3();
    // var sphereTrimesh_v2 = new Vec3();
    // var sphereTrimesh_edgeVertexA = new Vec3();
    // var sphereTrimesh_edgeVertexB = new Vec3();
    // var sphereTrimesh_edgeVector = new Vec3();
    // var sphereTrimesh_edgeVectorUnit = new Vec3();
    // var sphereTrimesh_localSpherePos = new Vec3();
    // var sphereTrimesh_tmp = new Vec3();
    // var sphereTrimesh_va = new Vec3();
    // var sphereTrimesh_vb = new Vec3();
    // var sphereTrimesh_vc = new Vec3();
    // var sphereTrimesh_localSphereAABB = new AABB();
    // var sphereTrimesh_triangles = [];
    // Narrowphase.prototype[Shape.types.SPHERE | Shape.types.TRIMESH] =
    // Narrowphase.prototype.sphereTrimesh = function (
    //     sphereShape,
    //     trimeshShape,
    //     spherePos,
    //     trimeshPos,
    //     sphereQuat,
    //     trimeshQuat,
    //     sphereBody,
    //     trimeshBody,
    //     rsi,
    //     rsj,
    //     justTest
    // ) {
    
    //     var edgeVertexA = sphereTrimesh_edgeVertexA;
    //     var edgeVertexB = sphereTrimesh_edgeVertexB;
    //     var edgeVector = sphereTrimesh_edgeVector;
    //     var edgeVectorUnit = sphereTrimesh_edgeVectorUnit;
    //     var localSpherePos = sphereTrimesh_localSpherePos;
    //     var tmp = sphereTrimesh_tmp;
    //     var localSphereAABB = sphereTrimesh_localSphereAABB;
    //     var v2 = sphereTrimesh_v2;
    //     var relpos = sphereTrimesh_relpos;
    //     var triangles = sphereTrimesh_triangles;
    
    //     // 将球体位置转换为trimeh中的本地位置
    //     Transform.pointToLocalFrame(trimeshPos, trimeshQuat, spherePos, localSpherePos);
    
    //     // 在trimeh中获得本地球体的AABB
    //     var sphereRadius = sphereShape.radius;
    //     localSphereAABB.lowerBound.set(
    //         localSpherePos.x - sphereRadius,
    //         localSpherePos.y - sphereRadius,
    //         localSpherePos.z - sphereRadius
    //     );
    //     localSphereAABB.upperBound.set(
    //         localSpherePos.x + sphereRadius,
    //         localSpherePos.y + sphereRadius,
    //         localSpherePos.z + sphereRadius
    //     );
    
    //     trimeshShape.getTrianglesInAABB(localSphereAABB, triangles);
    //     //for（var i = 0; i <trimeshshape.indices.length /3; i ++）triangles.push（i）; //全部
    
    //     // 顶点
    //     var v = sphereTrimesh_v;
    //     var radiusSquared = sphereShape.radius * sphereShape.radius;
    //     for(var i=0; i<triangles.length; i++){
    //         for (var j = 0; j < 3; j++) {
    
    //             trimeshShape.getVertex(trimeshShape.indices[triangles[i] * 3 + j], v);
    
    //             // 检查球体中的顶点重叠
    //             v.vsub(localSpherePos, relpos);
    
    //             if(relpos.norm2() <= radiusSquared){
    
    //                 // 安全
    //                 v2.copy(v);
    //                 Transform.pointToWorldFrame(trimeshPos, trimeshQuat, v2, v);
    
    //                 v.vsub(spherePos, relpos);
    
    //                 if(justTest){
    //                     return true;
    //                 }
    
    //                 var r = this.createContactEquation(sphereBody,trimeshBody,sphereShape,trimeshShape,rsi,rsj);
    //                 r.ni.copy(relpos);
    //                 r.ni.normalize();
    
    //                 // RI是从球体中心到球体表面的向量
    //                 r.ri.copy(r.ni);
    //                 r.ri.scale(sphereShape.radius, r.ri);
    //                 r.ri.vadd(spherePos, r.ri);
    //                 r.ri.vsub(sphereBody.position, r.ri);
    
    //                 r.rj.copy(v);
    //                 r.rj.vsub(trimeshBody.position, r.rj);
    
    //                 // 存储结果
    //                 this.result.push(r);
    //                 this.createFrictionEquationsFromContact(r, this.frictionResult);
    //             }
    //         }
    //     }
    
    //     // 检查所有边缘
    //     for(var i=0; i<triangles.length; i++){
    //         for (var j = 0; j < 3; j++) {
    
    //             trimeshShape.getVertex(trimeshShape.indices[triangles[i] * 3 + j], edgeVertexA);
    //             trimeshShape.getVertex(trimeshShape.indices[triangles[i] * 3 + ((j+1)%3)], edgeVertexB);
    //             edgeVertexB.vsub(edgeVertexA, edgeVector);
    
    //             // 项目球位置到边缘
    //             localSpherePos.vsub(edgeVertexB, tmp);
    //             var positionAlongEdgeB = tmp.dot(edgeVector);
    
    //             localSpherePos.vsub(edgeVertexA, tmp);
    //             var positionAlongEdgeA = tmp.dot(edgeVector);
    
    //             if(positionAlongEdgeA > 0 && positionAlongEdgeB < 0){
    
    //                 // 现在检查从边缘到球体中心的正交距离
    //                 localSpherePos.vsub(edgeVertexA, tmp);
    
    //                 edgeVectorUnit.copy(edgeVector);
    //                 edgeVectorUnit.normalize();
    //                 positionAlongEdgeA = tmp.dot(edgeVectorUnit);
    
    //                 edgeVectorUnit.scale(positionAlongEdgeA, tmp);
    //                 tmp.vadd(edgeVertexA, tmp);
    
    //                 // TMP现在是投射到边缘的球体中心位置，在Trimeh框架中本地定义
    //                 var dist = tmp.distanceTo(localSpherePos);
    //                 if(dist < sphereShape.radius){
    
    //                     if(justTest){
    //                         return true;
    //                     }
    
    //                     var r = this.createContactEquation(sphereBody, trimeshBody, sphereShape, trimeshShape,rsi,rsj);
    
    //                     tmp.vsub(localSpherePos, r.ni);
    //                     r.ni.normalize();
    //                     r.ni.scale(sphereShape.radius, r.ri);
    
    //                     Transform.pointToWorldFrame(trimeshPos, trimeshQuat, tmp, tmp);
    //                     tmp.vsub(trimeshBody.position, r.rj);
    
    //                     Transform.vectorToWorldFrame(trimeshQuat, r.ni, r.ni);
    //                     Transform.vectorToWorldFrame(trimeshQuat, r.ri, r.ri);
    
    //                     this.result.push(r);
    //                     this.createFrictionEquationsFromContact(r, this.frictionResult);
    //                 }
    //             }
    //         }
    //     }
    
    //     // 三角面
    //     var va = sphereTrimesh_va;
    //     var vb = sphereTrimesh_vb;
    //     var vc = sphereTrimesh_vc;
    //     var normal = sphereTrimesh_normal;
    //     for(var i=0, N = triangles.length; i !== N; i++){
    //         trimeshShape.getTriangleVertices(triangles[i], va, vb, vc);
    //         trimeshShape.getNormal(triangles[i], normal);
    //         localSpherePos.vsub(va, tmp);
    //         var dist = tmp.dot(normal);
    //         normal.scale(dist, tmp);
    //         localSpherePos.vsub(tmp, tmp);
    
    //         // TMP现在是投射到三角形飞机的球体位置
    //         dist = tmp.distanceTo(localSpherePos);
    //         if(Ray.pointInTriangle(tmp, va, vb, vc) && dist < sphereShape.radius){
    //             if(justTest){
    //                 return true;
    //             }
    //             var r = this.createContactEquation(sphereBody, trimeshBody, sphereShape, trimeshShape,rsi,rsj);
    
    //             tmp.vsub(localSpherePos, r.ni);
    //             r.ni.normalize();
    //             r.ni.scale(sphereShape.radius, r.ri);
    
    //             Transform.pointToWorldFrame(trimeshPos, trimeshQuat, tmp, tmp);
    //             tmp.vsub(trimeshBody.position, r.rj);
    
    //             Transform.vectorToWorldFrame(trimeshQuat, r.ni, r.ni);
    //             Transform.vectorToWorldFrame(trimeshQuat, r.ri, r.ri);
    
    //             this.result.push(r);
    //             this.createFrictionEquationsFromContact(r, this.frictionResult);
    //         }
    //     }
    
    //     triangles.length = 0;
    // };
    
    var point_on_plane_to_sphere = new Vec3();
    var plane_to_sphere_ortho = new Vec3();
    
    /**
     * @method spherePlane
     * @param  {Shape}      si
     * @param  {Shape}      sj
     * @param  {Vec3}       xi
     * @param  {Vec3}       xj
     * @param  {Quaternion} qi
     * @param  {Quaternion} qj
     * @param  {Body}       bi
     * @param  {Body}       bj
     */
    Narrowphase.prototype[Shape.types.SPHERE | Shape.types.PLANE] =
    Narrowphase.prototype.spherePlane = function(si,sj,xi,xj,qi,qj,bi,bj,rsi,rsj,justTest){
        // 在这种情况下，我们将有一个联系
        var r = this.createContactEquation(bi,bj,si,sj,rsi,rsj);
    
        // 联系正常
        r.ni.set(0,0,1);
        qj.vmult(r.ni, r.ni);
        r.ni.negate(r.ni); // 身体我是球体，正常翻转
        r.ni.normalize(); // 需要？
    
        // 从球体中心到接触点的向量
        r.ni.mult(si.radius, r.ri);
    
        // 在飞机上投射范围
        xi.vsub(xj, point_on_plane_to_sphere);
        r.ni.mult(r.ni.dot(point_on_plane_to_sphere), plane_to_sphere_ortho);
        point_on_plane_to_sphere.vsub(plane_to_sphere_ortho,r.rj); // 球体位置投影到飞机上
    
        if(-point_on_plane_to_sphere.dot(r.ni) <= si.radius){
    
            if(justTest){
                return true;
            }
    
            // 使它与身体相对
            var ri = r.ri;
            var rj = r.rj;
            ri.vadd(xi, ri);
            ri.vsub(bi.position, ri);
            rj.vadd(xj, rj);
            rj.vsub(bj.position, rj);
    
            this.result.push(r);
            this.createFrictionEquationsFromContact(r, this.frictionResult);
        }
    };
    
    // 请参阅http://bulletphysics.com/bullet/bulletfull/spheretriangledetector_8cpp_source.html
    var pointInPolygon_edge = new Vec3();
    var pointInPolygon_edge_x_normal = new Vec3();
    var pointInPolygon_vtp = new Vec3();
    function pointInPolygon(verts, normal, p){
        var positiveResult = null;
        var N = verts.length;
        for(var i=0; i!==N; i++){
            var v = verts[i];
    
            // 到达下一个顶点
            var edge = pointInPolygon_edge;
            verts[(i+1) % (N)].vsub(v,edge);
    
            // 在Polygon正常和边缘之间获得交叉产品
            var edge_x_normal = pointInPolygon_edge_x_normal;
            //var edge_x_normal = new Vec3（）;
            edge.cross(normal,edge_x_normal);
    
            // 在点和当前顶点之间获取向量
            var vertex_to_p = pointInPolygon_vtp;
            p.vsub(v,vertex_to_p);
    
            // 该点产品确定点的边缘是
            var r = edge_x_normal.dot(vertex_to_p);
    
            // 如果所有这些点产品都有相同的符号，那么我们就在多边形内。
            if(positiveResult===null || (r>0 && positiveResult===true) || (r<=0 && positiveResult===false)){
                if(positiveResult===null){
                    positiveResult = r>0;
                }
                continue;
            } else {
                return false; // 遇到了其他一些迹象。出口。
            }
        }
    
        // 如果我们到达这里，所有点产品都有相同的迹象。
        return true;
    }
    
    var box_to_sphere = new Vec3();
    var sphereBox_ns = new Vec3();
    var sphereBox_ns1 = new Vec3();
    var sphereBox_ns2 = new Vec3();
    var sphereBox_sides = [new Vec3(),new Vec3(),new Vec3(),new Vec3(),new Vec3(),new Vec3()];
    var sphereBox_sphere_to_corner = new Vec3();
    var sphereBox_side_ns = new Vec3();
    var sphereBox_side_ns1 = new Vec3();
    var sphereBox_side_ns2 = new Vec3();
    
    /**
     * @method sphereBox
     * @param  {Shape}      si
     * @param  {Shape}      sj
     * @param  {Vec3}       xi
     * @param  {Vec3}       xj
     * @param  {Quaternion} qi
     * @param  {Quaternion} qj
     * @param  {Body}       bi
     * @param  {Body}       bj
     */
    Narrowphase.prototype[Shape.types.SPHERE | Shape.types.BOX] =
    Narrowphase.prototype.sphereBox = function(si,sj,xi,xj,qi,qj,bi,bj,rsi,rsj,justTest){
        var v3pool = this.v3pool;
    
        // 我们将盒子称为身体J
        var sides = sphereBox_sides;
        xi.vsub(xj,box_to_sphere);
        sj.getSideNormals(sides,qj);
        var R =     si.radius;
        var penetrating_sides = [];
    
        // 检查侧（平面）交叉点
        var found = false;
    
        // 存储由此产生的侧渗透信息
        var side_ns = sphereBox_side_ns;
        var side_ns1 = sphereBox_side_ns1;
        var side_ns2 = sphereBox_side_ns2;
        var side_h = null;
        var side_penetrations = 0;
        var side_dot1 = 0;
        var side_dot2 = 0;
        var side_distance = null;
        for(var idx=0,nsides=sides.length; idx!==nsides && found===false; idx++){
            // 使飞机侧正常（NS）
            var ns = sphereBox_ns;
            ns.copy(sides[idx]);
    
            var h = ns.norm();
            ns.normalize();
    
            // 正常/距离点产品告诉我们飞机的哪一侧
            var dot = box_to_sphere.dot(ns);
    
            if(dot<h+R && dot>0){
                // 相交平面。现在检查其他两个维度
                var ns1 = sphereBox_ns1;
                var ns2 = sphereBox_ns2;
                ns1.copy(sides[(idx+1)%3]);
                ns2.copy(sides[(idx+2)%3]);
                var h1 = ns1.norm();
                var h2 = ns2.norm();
                ns1.normalize();
                ns2.normalize();
                var dot1 = box_to_sphere.dot(ns1);
                var dot2 = box_to_sphere.dot(ns2);
                if(dot1<h1 && dot1>-h1 && dot2<h2 && dot2>-h2){
                    var dist = Math.abs(dot-h-R);
                    if(side_distance===null || dist < side_distance){
                        side_distance = dist;
                        side_dot1 = dot1;
                        side_dot2 = dot2;
                        side_h = h;
                        side_ns.copy(ns);
                        side_ns1.copy(ns1);
                        side_ns2.copy(ns2);
                        side_penetrations++;
    
                        if(justTest){
                            return true;
                        }
                    }
                }
            }
        }
        if(side_penetrations){
            found = true;
            var r = this.createContactEquation(bi,bj,si,sj,rsi,rsj);
            side_ns.mult(-R,r.ri); // 球r
            r.ni.copy(side_ns);
            r.ni.negate(r.ni); // 正常应该脱离球
            side_ns.mult(side_h,side_ns);
            side_ns1.mult(side_dot1,side_ns1);
            side_ns.vadd(side_ns1,side_ns);
            side_ns2.mult(side_dot2,side_ns2);
            side_ns.vadd(side_ns2,r.rj);
    
            // 相对于身体
            r.ri.vadd(xi, r.ri);
            r.ri.vsub(bi.position, r.ri);
            r.rj.vadd(xj, r.rj);
            r.rj.vsub(bj.position, r.rj);
    
            this.result.push(r);
            this.createFrictionEquationsFromContact(r, this.frictionResult);
        }
    
        // 检查拐角
        var rj = v3pool.get();
        var sphere_to_corner = sphereBox_sphere_to_corner;
        for(var j=0; j!==2 && !found; j++){
            for(var k=0; k!==2 && !found; k++){
                for(var l=0; l!==2 && !found; l++){
                    rj.set(0,0,0);
                    if(j){
                        rj.vadd(sides[0],rj);
                    } else {
                        rj.vsub(sides[0],rj);
                    }
                    if(k){
                        rj.vadd(sides[1],rj);
                    } else {
                        rj.vsub(sides[1],rj);
                    }
                    if(l){
                        rj.vadd(sides[2],rj);
                    } else {
                        rj.vsub(sides[2],rj);
                    }
    
                    // 世界角落
                    xj.vadd(rj,sphere_to_corner);
                    sphere_to_corner.vsub(xi,sphere_to_corner);
    
                    if(sphere_to_corner.norm2() < R*R){
                        if(justTest){
                            return true;
                        }
                        found = true;
                        var r = this.createContactEquation(bi,bj,si,sj,rsi,rsj);
                        r.ri.copy(sphere_to_corner);
                        r.ri.normalize();
                        r.ni.copy(r.ri);
                        r.ri.mult(R,r.ri);
                        r.rj.copy(rj);
    
                        // 相对于身体
                        r.ri.vadd(xi, r.ri);
                        r.ri.vsub(bi.position, r.ri);
                        r.rj.vadd(xj, r.rj);
                        r.rj.vsub(bj.position, r.rj);
    
                        this.result.push(r);
                        this.createFrictionEquationsFromContact(r, this.frictionResult);
                    }
                }
            }
        }
        v3pool.release(rj);
        rj = null;
    
        // 检查边缘
        var edgeTangent = v3pool.get();
        var edgeCenter = v3pool.get();
        var r = v3pool.get(); // R =边缘中心的边缘中心
        var orthogonal = v3pool.get();
        var dist = v3pool.get();
        var Nsides = sides.length;
        for(var j=0; j!==Nsides && !found; j++){
            for(var k=0; k!==Nsides && !found; k++){
                if(j%3 !== k%3){
                    // 获得边缘切线
                    sides[k].cross(sides[j],edgeTangent);
                    edgeTangent.normalize();
                    sides[j].vadd(sides[k], edgeCenter);
                    r.copy(xi);
                    r.vsub(edgeCenter,r);
                    r.vsub(xj,r);
                    var orthonorm = r.dot(edgeTangent); // 从边缘中心到球体中心的距离
                    edgeTangent.mult(orthonorm,orthogonal); // 从边缘中心到球形中心的向量沿切线方向
    
                    // 找到与此的第三侧正交
                    var l = 0;
                    while(l===j%3 || l===k%3){
                        l++;
                    }
    
                    // 从边缘中心到投影到飞机正交到边缘的球形的VEC
                    dist.copy(xi);
                    dist.vsub(orthogonal,dist);
                    dist.vsub(edgeCenter,dist);
                    dist.vsub(xj,dist);
    
                    // 沿线的切线和距离距离正交的距离
                    var tdist = Math.abs(orthonorm);
                    var ndist = dist.norm();
    
                    if(tdist < sides[l].norm() && ndist<R){
                        if(justTest){
                            return true;
                        }
                        found = true;
                        var res = this.createContactEquation(bi,bj,si,sj,rsi,rsj);
                        edgeCenter.vadd(orthogonal,res.rj); // Box RJ
                        res.rj.copy(res.rj);
                        dist.negate(res.ni);
                        res.ni.normalize();
    
                        res.ri.copy(res.rj);
                        res.ri.vadd(xj,res.ri);
                        res.ri.vsub(xi,res.ri);
                        res.ri.normalize();
                        res.ri.mult(R,res.ri);
    
                        // 相对于身体
                        res.ri.vadd(xi, res.ri);
                        res.ri.vsub(bi.position, res.ri);
                        res.rj.vadd(xj, res.rj);
                        res.rj.vsub(bj.position, res.rj);
    
                        this.result.push(res);
                        this.createFrictionEquationsFromContact(res, this.frictionResult);
                    }
                }
            }
        }
        v3pool.release(edgeTangent,edgeCenter,r,orthogonal,dist);
    };
    
    var convex_to_sphere = new Vec3();
    var sphereConvex_edge = new Vec3();
    var sphereConvex_edgeUnit = new Vec3();
    var sphereConvex_sphereToCorner = new Vec3();
    var sphereConvex_worldCorner = new Vec3();
    var sphereConvex_worldNormal = new Vec3();
    var sphereConvex_worldPoint = new Vec3();
    var sphereConvex_worldSpherePointClosestToPlane = new Vec3();
    var sphereConvex_penetrationVec = new Vec3();
    var sphereConvex_sphereToWorldPoint = new Vec3();
    
    /**
     * @method sphereConvex
     * @param  {Shape}      si
     * @param  {Shape}      sj
     * @param  {Vec3}       xi
     * @param  {Vec3}       xj
     * @param  {Quaternion} qi
     * @param  {Quaternion} qj
     * @param  {Body}       bi
     * @param  {Body}       bj
     */
    Narrowphase.prototype[Shape.types.SPHERE | Shape.types.CONVEXPOLYHEDRON] =
    Narrowphase.prototype.sphereConvex = function(si,sj,xi,xj,qi,qj,bi,bj,rsi,rsj,justTest){
        var v3pool = this.v3pool;
        xi.vsub(xj,convex_to_sphere);
        var normals = sj.faceNormals;
        var faces = sj.faces;
        var verts = sj.vertices;
        var R =     si.radius;
        var penetrating_sides = [];
    
        // if（convex_to_sphere.norm2（）> si.boundingspheraradius + sj.boundingspheradius）{
        //     返回;
        // }
    
        // 检查拐角
        for(var i=0; i!==verts.length; i++){
            var v = verts[i];
    
            // 世界角落
            var worldCorner = sphereConvex_worldCorner;
            qj.vmult(v,worldCorner);
            xj.vadd(worldCorner,worldCorner);
            var sphere_to_corner = sphereConvex_sphereToCorner;
            worldCorner.vsub(xi, sphere_to_corner);
            if(sphere_to_corner.norm2() < R * R){
                if(justTest){
                    return true;
                }
                found = true;
                var r = this.createContactEquation(bi,bj,si,sj,rsi,rsj);
                r.ri.copy(sphere_to_corner);
                r.ri.normalize();
                r.ni.copy(r.ri);
                r.ri.mult(R,r.ri);
                worldCorner.vsub(xj,r.rj);
    
                // 应该相对于身体。
                r.ri.vadd(xi, r.ri);
                r.ri.vsub(bi.position, r.ri);
    
                // 应该相对于身体。
                r.rj.vadd(xj, r.rj);
                r.rj.vsub(bj.position, r.rj);
    
                this.result.push(r);
                this.createFrictionEquationsFromContact(r, this.frictionResult);
                return;
            }
        }
    
        // 检查侧（平面）交叉点
        var found = false;
        for(var i=0, nfaces=faces.length; i!==nfaces && found===false; i++){
            var normal = normals[i];
            var face = faces[i];
    
            // 获得世界转变的脸部正常
            var worldNormal = sphereConvex_worldNormal;
            qj.vmult(normal,worldNormal);
    
            // 从脸上得到世界顶点
            var worldPoint = sphereConvex_worldPoint;
            qj.vmult(verts[face[0]],worldPoint);
            worldPoint.vadd(xj,worldPoint);
    
            // 在球体上得到一个点，最接近面部正常
            var worldSpherePointClosestToPlane = sphereConvex_worldSpherePointClosestToPlane;
            worldNormal.mult(-R, worldSpherePointClosestToPlane);
            xi.vadd(worldSpherePointClosestToPlane, worldSpherePointClosestToPlane);
    
            // 从脸部到球的最接近点的向量
            var penetrationVec = sphereConvex_penetrationVec;
            worldSpherePointClosestToPlane.vsub(worldPoint,penetrationVec);
    
            // 穿透。负值表示重叠。
            var penetration = penetrationVec.dot(worldNormal);
    
            var worldPointToSphere = sphereConvex_sphereToWorldPoint;
            xi.vsub(worldPoint, worldPointToSphere);
    
            if(penetration < 0 && worldPointToSphere.dot(worldNormal)>0){
                // 相交平面。现在检查球体是否在脸部多边形
                var faceVerts = []; // 面对世界坐标
                for(var j=0, Nverts=face.length; j!==Nverts; j++){
                    var worldVertex = v3pool.get();
                    qj.vmult(verts[face[j]], worldVertex);
                    xj.vadd(worldVertex,worldVertex);
                    faceVerts.push(worldVertex);
                }
    
                if(pointInPolygon(faceVerts,worldNormal,xi)){ // 球体中心是脸部多边形吗？
                    if(justTest){
                        return true;
                    }
                    found = true;
                    var r = this.createContactEquation(bi,bj,si,sj,rsi,rsj);
    
                    worldNormal.mult(-R, r.ri); // 接触偏移，从球体中心到接触
                    worldNormal.negate(r.ni); // 正常指出球体
    
                    var penetrationVec2 = v3pool.get();
                    worldNormal.mult(-penetration, penetrationVec2);
                    var penetrationSpherePoint = v3pool.get();
                    worldNormal.mult(-R, penetrationSpherePoint);
    
                    //xi.vsub（xj）.vad（渗透球点）.VADD（渗透vec2，r.rj）;
                    xi.vsub(xj,r.rj);
                    r.rj.vadd(penetrationSpherePoint,r.rj);
                    r.rj.vadd(penetrationVec2 , r.rj);
    
                    // 应该相对于身体。
                    r.rj.vadd(xj, r.rj);
                    r.rj.vsub(bj.position, r.rj);
    
                    // 应该相对于身体。
                    r.ri.vadd(xi, r.ri);
                    r.ri.vsub(bi.position, r.ri);
    
                    v3pool.release(penetrationVec2);
                    v3pool.release(penetrationSpherePoint);
    
                    this.result.push(r);
                    this.createFrictionEquationsFromContact(r, this.frictionResult);
    
                    // 释放世界顶点
                    for(var j=0, Nfaceverts=faceVerts.length; j!==Nfaceverts; j++){
                        v3pool.release(faceVerts[j]);
                    }
    
                    return; // 我们只期望 *一个 *脸接触
                } else {
                    // 边缘？
                    for(var j=0; j!==face.length; j++){
    
                        // 获取两个世界转变的顶点
                        var v1 = v3pool.get();
                        var v2 = v3pool.get();
                        qj.vmult(verts[face[(j+1)%face.length]], v1);
                        qj.vmult(verts[face[(j+2)%face.length]], v2);
                        xj.vadd(v1, v1);
                        xj.vadd(v2, v2);
    
                        // 构造边缘向量
                        var edge = sphereConvex_edge;
                        v2.vsub(v1,edge);
    
                        // 构建相同的向量，但标准化
                        var edgeUnit = sphereConvex_edgeUnit;
                        edge.unit(edgeUnit);
    
                        // P被投射到边缘
                        var p = v3pool.get();
                        var v1_to_xi = v3pool.get();
                        xi.vsub(v1, v1_to_xi);
                        var dot = v1_to_xi.dot(edgeUnit);
                        edgeUnit.mult(dot, p);
                        p.vadd(v1, p);
    
                        // 计算从P到球体中心的向量
                        var xi_to_p = v3pool.get();
                        p.vsub(xi, xi_to_p);
    
                        // 碰撞如果边缘距离小于半径
                        // 如果p在v1和v2之间
                        if(dot > 0 && dot*dot<edge.norm2() && xi_to_p.norm2() < R*R){ // 碰撞如果边缘距离小于半径
                            // 边缘接触！
                            if(justTest){
                                return true;
                            }
                            var r = this.createContactEquation(bi,bj,si,sj,rsi,rsj);
                            p.vsub(xj,r.rj);
    
                            p.vsub(xi,r.ni);
                            r.ni.normalize();
    
                            r.ni.mult(R,r.ri);
    
                            // 应该相对于身体。
                            r.rj.vadd(xj, r.rj);
                            r.rj.vsub(bj.position, r.rj);
    
                            // 应该相对于身体。
                            r.ri.vadd(xi, r.ri);
                            r.ri.vsub(bi.position, r.ri);
    
                            this.result.push(r);
                            this.createFrictionEquationsFromContact(r, this.frictionResult);
    
                            // 释放世界顶点
                            for(var j=0, Nfaceverts=faceVerts.length; j!==Nfaceverts; j++){
                                v3pool.release(faceVerts[j]);
                            }
    
                            v3pool.release(v1);
                            v3pool.release(v2);
                            v3pool.release(p);
                            v3pool.release(xi_to_p);
                            v3pool.release(v1_to_xi);
    
                            return;
                        }
    
                        v3pool.release(v1);
                        v3pool.release(v2);
                        v3pool.release(p);
                        v3pool.release(xi_to_p);
                        v3pool.release(v1_to_xi);
                    }
                }
    
                // 释放世界顶点
                for(var j=0, Nfaceverts=faceVerts.length; j!==Nfaceverts; j++){
                    v3pool.release(faceVerts[j]);
                }
            }
        }
    };
    
    var planeBox_normal = new Vec3();
    var plane_to_corner = new Vec3();
    
    /**
     * @method planeBox
     * @param  {Array}      result
     * @param  {Shape}      si
     * @param  {Shape}      sj
     * @param  {Vec3}       xi
     * @param  {Vec3}       xj
     * @param  {Quaternion} qi
     * @param  {Quaternion} qj
     * @param  {Body}       bi
     * @param  {Body}       bj
     */
    Narrowphase.prototype[Shape.types.PLANE | Shape.types.BOX] =
    Narrowphase.prototype.planeBox = function(si,sj,xi,xj,qi,qj,bi,bj,rsi,rsj,justTest){
        sj.convexPolyhedronRepresentation.material = sj.material;
        sj.convexPolyhedronRepresentation.collisionResponse = sj.collisionResponse;
        sj.convexPolyhedronRepresentation.id = sj.id;
        return this.planeConvex(si,sj.convexPolyhedronRepresentation,xi,xj,qi,qj,bi,bj,si,sj,justTest);
    };
    
    var planeConvex_v = new Vec3();
    var planeConvex_normal = new Vec3();
    var planeConvex_relpos = new Vec3();
    var planeConvex_projected = new Vec3();
    
    /**
     * @method planeConvex
     * @param  {Shape}      si
     * @param  {Shape}      sj
     * @param  {Vec3}       xi
     * @param  {Vec3}       xj
     * @param  {Quaternion} qi
     * @param  {Quaternion} qj
     * @param  {Body}       bi
     * @param  {Body}       bj
     */
    Narrowphase.prototype[Shape.types.PLANE | Shape.types.CONVEXPOLYHEDRON] =
    Narrowphase.prototype.planeConvex = function(
        planeShape,
        convexShape,
        planePosition,
        convexPosition,
        planeQuat,
        convexQuat,
        planeBody,
        convexBody,
        si,
        sj,
        justTest
    ){
        // 只需返回飞机后面的点即可。
        var worldVertex = planeConvex_v,
            worldNormal = planeConvex_normal;
        worldNormal.set(0,0,1);
        planeQuat.vmult(worldNormal,worldNormal); // 根据平面方向转动正常
    
        var numContacts = 0;
        var relpos = planeConvex_relpos;
        for(var i = 0; i !== convexShape.vertices.length; i++){
    
            // 获取世界凸顶点
            worldVertex.copy(convexShape.vertices[i]);
            convexQuat.vmult(worldVertex, worldVertex);
            convexPosition.vadd(worldVertex, worldVertex);
            worldVertex.vsub(planePosition, relpos);
    
            var dot = worldNormal.dot(relpos);
            if(dot <= 0.0){
                if(justTest){
                    return true;
                }
    
                var r = this.createContactEquation(planeBody, convexBody, planeShape, convexShape, si, sj);
    
                // 在飞机上投射出顶点位置
                var projected = planeConvex_projected;
                worldNormal.mult(worldNormal.dot(relpos),projected);
                worldVertex.vsub(projected, projected);
                projected.vsub(planePosition, r.ri); // 从飞机上投射到飞机上的顶点
    
                r.ni.copy(worldNormal); // 接触正常是飞机正常的平面
    
                // RJ现在只是从凸中心到顶点的向量
                worldVertex.vsub(convexPosition, r.rj);
    
                // 使它与身体相对
                r.ri.vadd(planePosition, r.ri);
                r.ri.vsub(planeBody.position, r.ri);
                r.rj.vadd(convexPosition, r.rj);
                r.rj.vsub(convexBody.position, r.rj);
    
                this.result.push(r);
                numContacts++;
                if(!this.enableFrictionReduction){
                    this.createFrictionEquationsFromContact(r, this.frictionResult);
                }
            }
        }
    
        if(this.enableFrictionReduction && numContacts){
            this.createFrictionFromAverage(numContacts);
        }
    };
    
    var convexConvex_sepAxis = new Vec3();
    var convexConvex_q = new Vec3();
    
    /**
     * @method convexConvex
     * @param  {Shape}      si
     * @param  {Shape}      sj
     * @param  {Vec3}       xi
     * @param  {Vec3}       xj
     * @param  {Quaternion} qi
     * @param  {Quaternion} qj
     * @param  {Body}       bi
     * @param  {Body}       bj
     */
    Narrowphase.prototype[Shape.types.CONVEXPOLYHEDRON] =
    Narrowphase.prototype.convexConvex = function(si,sj,xi,xj,qi,qj,bi,bj,rsi,rsj,justTest,faceListA,faceListB){
        var sepAxis = convexConvex_sepAxis;
    
        if(xi.distanceTo(xj) > si.boundingSphereRadius + sj.boundingSphereRadius){
            return;
        }
    
        if(si.findSeparatingAxis(sj,xi,qi,xj,qj,sepAxis,faceListA,faceListB)){
            var res = [];
            var q = convexConvex_q;
            si.clipAgainstHull(xi,qi,sj,xj,qj,sepAxis,-100,100,res);
            var numContacts = 0;
            for(var j = 0; j !== res.length; j++){
                if(justTest){
                    return true;
                }
                var r = this.createContactEquation(bi,bj,si,sj,rsi,rsj),
                    ri = r.ri,
                    rj = r.rj;
                sepAxis.negate(r.ni);
                res[j].normal.negate(q);
                q.mult(res[j].depth, q);
                res[j].point.vadd(q, ri);
                rj.copy(res[j].point);
    
                // 联系点在世界坐标中。转变为亲戚
                ri.vsub(xi,ri);
                rj.vsub(xj,rj);
    
                // 相对于身体
                ri.vadd(xi, ri);
                ri.vsub(bi.position, ri);
                rj.vadd(xj, rj);
                rj.vsub(bj.position, rj);
    
                this.result.push(r);
                numContacts++;
                if(!this.enableFrictionReduction){
                    this.createFrictionEquationsFromContact(r, this.frictionResult);
                }
            }
            if(this.enableFrictionReduction && numContacts){
                this.createFrictionFromAverage(numContacts);
            }
        }
    };
    
    
    /**
     * @method convexTrimesh
     * @param  {Array}      result
     * @param  {Shape}      si
     * @param  {Shape}      sj
     * @param  {Vec3}       xi
     * @param  {Vec3}       xj
     * @param  {Quaternion} qi
     * @param  {Quaternion} qj
     * @param  {Body}       bi
     * @param  {Body}       bj
     */
    // nrarkpase.prototype [shape.types.convexpolyhedron | shape.types.trimeh] =
    // nrarkphase.prototype.convextrimesh = function（si，sj，xi，xj，qi，qj，bi，bi，bj，rsi，rsj，rsj，facelista，facelistb）{
    //     var sepaxis = convexConvex_sepaxis;
    
    //     if（xu.xictancet（xj）> ni.boundingspheradius + sj.bodingspherradius）{
    //         返回;
    //     }
    
    //     //为每个三角形构建一个温度船体
    //     var hullb = new convexpolyhedron（）;
    
    //     hullb.faces = [[0.1,2]];
    //     var va = new vec3（）;
    //     var vb = new vec3（）;
    //     var vc = new vec3（）;
    //     hullb.vertices = [
    //         将要，
    //         VB，
    //         VC
    //     ];
    
    //     for（var i = 0; i <sj.indices.length /3; i ++）{
    
    //         var trianglenormal = new Vec3（）;
    //         sj.getnormal（i，三角形）;
    //         hullb.faceNormals = [三角晶型药物];
    
    //         sj.gettrianglevertices（i，va，vb，vc）;
    
    //         var d = si.testsepaxis（thinglewnormal，xilb，x，x，q，qj，qj）;
    //         f（！d）{
    //             三角形等级。Scale（-1，三角形正常）;
    //             d = si.estsepaxis（trialnormal，xillb，xi，xi，q，qj，qj）;
    
    //             如果（！d）{
    //                 继续;
    //             }
    //         }
    
    //         ber res = [];
    //         var q q q q q = contexConvex_q;
    //         s。 Clipagarinsthull（XI，Xillb，XJ，J，Rij X，XtriangingNormal，-100,100,100，Res）;
    //         for（v ve = 0; j！= res.length; j ++）{
    //             var r = this.cretecontactequation（BI，BJ，SJ，SJ，RSJ，RSJ，RSJ），
    //                 r。 = r.ri，
    //                 rh = r.rrrj;
    //             r.ni.copy（thanornormoral）;
    //             r.ni.ni.negaate（r.ni）;
    //             res [j] normal.negate（q）;
    //             q.mult（res [j] [j] [j] [j] [j] [j]，[j]，q）;
    //             res [j] point.vadd（q，ri）;
    //             rj.opy（res [j] [d]）;
    
    //             //联系点在世界坐标中。转变为亲戚
    //             ri.vsub（xi，ri）;
    //             rj.vsub（xj，rj）;
    
    //             //与身体相对
    //             ri.vadd（xii，r）;
    //             ri.vsub（bi.position，r）;
    //             rj.vadd（xj，rj）;
    //             rr.vsub（B.Position，rj）;
    
    //             result.push（r）;
    //         }
    //     }
    // };
    
    // var particlePlane_normal = new Vec3();
    // var particlePlane_relpos = new Vec3();
    // var particlePlane_projected = new Vec3();
    
    // /**
    //  * @method particlePlane
    //  * @param  {Array}      result
    //  * @param  {Shape}      si
    //  * @param  {Shape}      sj
    //  * @param  {Vec3}       xi
    //  * @param  {Vec3}       xj
    //  * @param  {Quaternion} qi
    //  * @param  {Quaternion} qj
    //  * @param  {Body}       bi
    //  * @param  {Body}       bj
    //  */
    // Narrowphase.prototype[Shape.types.PLANE | Shape.types.PARTICLE] =
    // Narrowphase.prototype.planeParticle = function(sj,si,xj,xi,qj,qi,bj,bi,rsi,rsj,justTest){
    //     var normal = particlePlane_normal;
    //     normal.set(0,0,1);
    //     bj.quaternion.vmult(normal,normal); // 根据平面方向转动正常
    //     var relpos = particlePlane_relpos;
    //     xi.vsub(bj.position,relpos);
    //     var dot = normal.dot(relpos);
    //     if(dot <= 0.0){
    
    //         if(justTest){
    //             return true;
    //         }
    
    //         var r = this.createContactEquation(bi,bj,si,sj,rsi,rsj);
    //         r.ni.copy(normal); // 接触正常是正常的平面
    //         r.ni.negate(r.ni);
    //         r.ri.set(0,0,0); // 粒子中心
    
    //         // 在飞机上投射粒子位置
    //         var projected = particlePlane_projected;
    //         normal.mult(normal.dot(xi),projected);
    //         xi.vsub(projected,projected);
    //         //Projected.VADD（BJ.Position，预计）；
    
    //         // RJ现在是预计的世界位置减去飞机位置
    //         r.rj.copy(projected);
    //         this.result.push(r);
    //         this.createFrictionEquationsFromContact(r, this.frictionResult);
    //     }
    // };
    
    // var particleSphere_normal = new Vec3();
    
    /**
     * @method particleSphere
     * @param  {Array}      result
     * @param  {Shape}      si
     * @param  {Shape}      sj
     * @param  {Vec3}       xi
     * @param  {Vec3}       xj
     * @param  {Quaternion} qi
     * @param  {Quaternion} qj
     * @param  {Body}       bi
     * @param  {Body}       bj
     */
    // Narrowphase.prototype[Shape.types.PARTICLE | Shape.types.SPHERE] =
    // Narrowphase.prototype.sphereParticle = function(sj,si,xj,xi,qj,qi,bj,bi,rsi,rsj,justTest){
    //     // 正常是从球体中心到粒子中心的单位矢量
    //     var normal = particleSphere_normal;
    //     normal.set(0,0,1);
    //     xi.vsub(xj,normal);
    //     var lengthSquared = normal.norm2();
    
    //     if(lengthSquared <= sj.radius * sj.radius){
    //         if(justTest){
    //             return true;
    //         }
    //         var r = this.createContactEquation(bi,bj,si,sj,rsi,rsj);
    //         normal.normalize();
    //         r.rj.copy(normal);
    //         r.rj.mult(sj.radius,r.rj);
    //         r.ni.copy(normal); // 联系正常
    //         r.ni.negate(r.ni);
    //         r.ri.set(0,0,0); // 粒子中心
    //         this.result.push(r);
    //         this.createFrictionEquationsFromContact(r, this.frictionResult);
    //     }
    // };
    
    // WIP
    // var cqj = new Quaternion();
    // var convexParticle_local = new Vec3();
    // var convexParticle_normal = new Vec3();
    // var convexParticle_penetratedFaceNormal = new Vec3();
    // var convexParticle_vertexToParticle = new Vec3();
    // var convexParticle_worldPenetrationVec = new Vec3();
    
    /**
     * @method convexParticle
     * @param  {Array}      result
     * @param  {Shape}      si
     * @param  {Shape}      sj
     * @param  {Vec3}       xi
     * @param  {Vec3}       xj
     * @param  {Quaternion} qi
     * @param  {Quaternion} qj
     * @param  {Body}       bi
     * @param  {Body}       bj
     */
    // Narrowphase.prototype[Shape.types.PARTICLE | Shape.types.CONVEXPOLYHEDRON] =
    // Narrowphase.prototype.convexParticle = function(sj,si,xj,xi,qj,qi,bj,bi,rsi,rsj,justTest){
    //     var penetratedFaceIndex = -1;
    //     var penetratedFaceNormal = convexParticle_penetratedFaceNormal;
    //     var worldPenetrationVec = convexParticle_worldPenetrationVec;
    //     var minPenetration = null;
    //     var numDetectedFaces = 0;
    
    //     // 将粒子位置XI转换为凸的本地坐标
    //     var local = convexParticle_local;
    //     local.copy(xi);
    //     local.vsub(xj,local); // 将位置转换为相对凸起的位置
    //     qj.conjugate(cqj);
    //     cqj.vmult(local,local);
    
    //     // if(false){
    
    //     //     if(sj.worldVerticesNeedsUpdate){
    //     //         sj.computeWorldVertices(xj,qj);
    //     //     }
    //     //     if(sj.worldFaceNormalsNeedsUpdate){
    //     //         sj.computeWorldFaceNormals(qj);
    //     //     }
    
    //     //     // 对于多面体中的每个世界多边形
    //     //     for(var i=0,nfaces=sj.faces.length; i!==nfaces; i++){
    
    //     //         // 构建世界面向顶点
    //     //         var verts = [ sj.worldVertices[ sj.faces[i][0] ] ];
    //     //         var normal = sj.worldFaceNormals[i];
    
    //     //         // 检查粒子穿透多边形平面的程度。
    //     //         xi.vsub(verts[0],convexParticle_vertexToParticle);
    //     //         var penetration = -normal.dot(convexParticle_vertexToParticle);
    //     //         if(minPenetration===null || Math.abs(penetration)<Math.abs(minPenetration)){
    
    //     //             if(justTest){
    //     //                 return true;
    //     //             }
    
    //     //             minPenetration = penetration;
    //     //             penetratedFaceIndex = i;
    //     //             penetratedFaceNormal.copy(normal);
    //     //             numDetectedFaces++;
    //     //         }
    //     //     }
    
    //     //     if(penetratedFaceIndex!==-1){
    //     //         // 设置联系人
    //     //         var r = this.createContactEquation(bi,bj,si,sj,rsi,rsj);
    //     //         penetratedFaceNormal.mult(minPenetration, worldPenetrationVec);
    
    //     //         // RJ是投射到脸部的粒子位置
    //     //         worldPenetrationVec.vadd(xi,worldPenetrationVec);
    //     //         worldPenetrationVec.vsub(xj,worldPenetrationVec);
    //     //         r.rj.copy(worldPenetrationVec);
    //     //         //var projectedToface = xi.vsub（xj）.vadd（worldpenetrationvec）;
    //     //         //ProjectedToface.Copy（R.RJ）;
    
    //     //         //QJ.Vmult（R.RJ，R.RJ）;
    //     //         penetratedFaceNormal.negate( r.ni ); // 联系正常
    //     //         r.ri.set(0,0,0); // 粒子中心
    
    //     //         var ri = r.ri,
    //     //             rj = r.rj;
    
    //     //         // 相对于身体
    //     //         ri.vadd(xi, ri);
    //     //         ri.vsub(bi.position, ri);
    //     //         rj.vadd(xj, rj);
    //     //         rj.vsub(bj.position, rj);
    
    //     //         this.result.push(r);
    //     //         this.createFrictionEquationsFromContact(r, this.frictionResult);
    //     //     } else {
    //     //         console.warn("Point found inside convex, but did not find penetrating face!");
    //     //     }
    //     // }
    // };
    
    // Narrowphase.prototype[Shape.types.BOX | Shape.types.HEIGHTFIELD] =
    // Narrowphase.prototype.boxHeightfield = function (si,sj,xi,xj,qi,qj,bi,bj,rsi,rsj,justTest){
    //     si.convexPolyhedronRepresentation.material = si.material;
    //     si.convexPolyhedronRepresentation.collisionResponse = si.collisionResponse;
    //     return this.convexHeightfield(si.convexPolyhedronRepresentation,sj,xi,xj,qi,qj,bi,bj,si,sj,justTest);
    // };
    
    // var convexHeightfield_tmp1 = new Vec3();
    // var convexHeightfield_tmp2 = new Vec3();
    // var convexHeightfield_faceList = [0];
    
    // /**
    //  * @method convexHeightfield
    //  */
    // Narrowphase.prototype[Shape.types.CONVEXPOLYHEDRON | Shape.types.HEIGHTFIELD] =
    // Narrowphase.prototype.convexHeightfield = function (
    //     convexShape,
    //     hfShape,
    //     convexPos,
    //     hfPos,
    //     convexQuat,
    //     hfQuat,
    //     convexBody,
    //     hfBody,
    //     rsi,
    //     rsj,
    //     justTest
    // ){
    //     var data = hfShape.data,
    //         w = hfShape.elementSize,
    //         radius = convexShape.boundingSphereRadius,
    //         worldPillarOffset = convexHeightfield_tmp2,
    //         faceList = convexHeightfield_faceList;
    
    //     // 获取球体位置到当地高地！
    //     var localConvexPos = convexHeightfield_tmp1;
    //     Transform.pointToLocalFrame(hfPos, hfQuat, convexPos, localConvexPos);
    
    //     // 获取数据点的索引以测试
    //     var iMinX = Math.floor((localConvexPos.x - radius) / w) - 1,
    //         iMaxX = Math.ceil((localConvexPos.x + radius) / w) + 1,
    //         iMinY = Math.floor((localConvexPos.y - radius) / w) - 1,
    //         iMaxY = Math.ceil((localConvexPos.y + radius) / w) + 1;
    
    //     // 如果我们不在地形之外，请救出
    //     if(iMaxX < 0 || iMaxY < 0 || iMinX > data.length || iMinY > data[0].length){
    //         return;
    //     }
    
    //     // 夹具索引到边缘
    //     if(iMinX < 0){ iMinX = 0; }
    //     if(iMaxX < 0){ iMaxX = 0; }
    //     if(iMinY < 0){ iMinY = 0; }
    //     if(iMaxY < 0){ iMaxY = 0; }
    //     if(iMinX >= data.length){ iMinX = data.length - 1; }
    //     if(iMaxX >= data.length){ iMaxX = data.length - 1; }
    //     if(iMaxY >= data[0].length){ iMaxY = data[0].length - 1; }
    //     if(iMinY >= data[0].length){ iMinY = data[0].length - 1; }
    
    //     var minMax = [];
    //     hfShape.getRectMinMax(iMinX, iMinY, iMaxX, iMaxY, minMax);
    //     var min = minMax[0];
    //     var max = minMax[1];
    
    //     // 如果我们不能触摸边界的高度框，请救出
    //     if(localConvexPos.z - radius > max || localConvexPos.z + radius < min){
    //         return;
    //     }
    
    //     for(var i = iMinX; i < iMaxX; i++){
    //         for(var j = iMinY; j < iMaxY; j++){
    
    //             var intersecting = false;
    
    //             // 下三角
    //             hfShape.getConvexTrianglePillar(i, j, false);
    //             Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
    //             if (convexPos.distanceTo(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + convexShape.boundingSphereRadius) {
    //                 intersecting = this.convexConvex(convexShape, hfShape.pillarConvex, convexPos, worldPillarOffset, convexQuat, hfQuat, convexBody, hfBody, null, null, justTest, faceList, null);
    //             }
    
    //             if(justTest && intersecting){
    //                 return true;
    //             }
    
    //             // 上三角
    //             hfShape.getConvexTrianglePillar(i, j, true);
    //             Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
    //             if (convexPos.distanceTo(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + convexShape.boundingSphereRadius) {
    //                 intersecting = this.convexConvex(convexShape, hfShape.pillarConvex, convexPos, worldPillarOffset, convexQuat, hfQuat, convexBody, hfBody, null, null, justTest, faceList, null);
    //             }
    
    //             if(justTest && intersecting){
    //                 return true;
    //             }
    //         }
    //     }
    // };
    
    // var sphereHeightfield_tmp1 = new Vec3();
    // var sphereHeightfield_tmp2 = new Vec3();
    
    /**
     * @method sphereHeightfield
     */
    // Narrowphase.prototype[Shape.types.SPHERE | Shape.types.HEIGHTFIELD] =
    // Narrowphase.prototype.sphereHeightfield = function (
    //     sphereShape,
    //     hfShape,
    //     spherePos,
    //     hfPos,
    //     sphereQuat,
    //     hfQuat,
    //     sphereBody,
    //     hfBody,
    //     rsi,
    //     rsj,
    //     justTest
    // ){
    //     var data = hfShape.data,
    //         radius = sphereShape.radius,
    //         w = hfShape.elementSize,
    //         worldPillarOffset = sphereHeightfield_tmp2;
    
    //     // 获取球体位置到当地高地！
    //     var localSpherePos = sphereHeightfield_tmp1;
    //     Transform.pointToLocalFrame(hfPos, hfQuat, spherePos, localSpherePos);
    
    //     // 获取数据点的索引以测试
    //     var iMinX = Math.floor((localSpherePos.x - radius) / w) - 1,
    //         iMaxX = Math.ceil((localSpherePos.x + radius) / w) + 1,
    //         iMinY = Math.floor((localSpherePos.y - radius) / w) - 1,
    //         iMaxY = Math.ceil((localSpherePos.y + radius) / w) + 1;
    
    //     // 如果我们不在地形之外，请救出
    //     if(iMaxX < 0 || iMaxY < 0 || iMinX > data.length || iMaxY > data[0].length){
    //         return;
    //     }
    
    //     // 夹具索引到边缘
    //     if(iMinX < 0){ iMinX = 0; }
    //     if(iMaxX < 0){ iMaxX = 0; }
    //     if(iMinY < 0){ iMinY = 0; }
    //     if(iMaxY < 0){ iMaxY = 0; }
    //     if(iMinX >= data.length){ iMinX = data.length - 1; }
    //     if(iMaxX >= data.length){ iMaxX = data.length - 1; }
    //     if(iMaxY >= data[0].length){ iMaxY = data[0].length - 1; }
    //     if(iMinY >= data[0].length){ iMinY = data[0].length - 1; }
    
    //     var minMax = [];
    //     hfShape.getRectMinMax(iMinX, iMinY, iMaxX, iMaxY, minMax);
    //     var min = minMax[0];
    //     var max = minMax[1];
    
    //     // 如果我们不能触摸边界的高度框，请救出
    //     if(localSpherePos.z - radius > max || localSpherePos.z + radius < min){
    //         return;
    //     }
    
    //     var result = this.result;
    //     for(var i = iMinX; i < iMaxX; i++){
    //         for(var j = iMinY; j < iMaxY; j++){
    
    //             var numContactsBefore = result.length;
    
    //             var intersecting = false;
    
    //             // 下三角
    //             hfShape.getConvexTrianglePillar(i, j, false);
    //             Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
    //             if (spherePos.distanceTo(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + sphereShape.boundingSphereRadius) {
    //                 intersecting = this.sphereConvex(sphereShape, hfShape.pillarConvex, spherePos, worldPillarOffset, sphereQuat, hfQuat, sphereBody, hfBody, sphereShape, hfShape, justTest);
    //             }
    
    //             if(justTest && intersecting){
    //                 return true;
    //             }
    
    //             // 上三角
    //             hfShape.getConvexTrianglePillar(i, j, true);
    //             Transform.pointToWorldFrame(hfPos, hfQuat, hfShape.pillarOffset, worldPillarOffset);
    //             if (spherePos.distanceTo(worldPillarOffset) < hfShape.pillarConvex.boundingSphereRadius + sphereShape.boundingSphereRadius) {
    //                 intersecting = this.sphereConvex(sphereShape, hfShape.pillarConvex, spherePos, worldPillarOffset, sphereQuat, hfQuat, sphereBody, hfBody, sphereShape, hfShape, justTest);
    //             }
    
    //             if(justTest && intersecting){
    //                 return true;
    //             }
    
    //             var numContacts = result.length - numContactsBefore;
    
    //             if(numContacts > 2){
    //                 return;
    //             }
    //             /*
    //             //跳过除1外
    //             for（var k = 0; k <numcontacts -1; k ++）{
    //                 result.pop（）;
    //             }
    //             */
    //         }
    //     }
    // };
    
    },{"../collision/AABB":3,"../collision/Ray":8,"../equations/ContactEquation":11,"../equations/FrictionEquation":13,"../math/Quaternion":18,"../math/Transform":19,"../math/Vec3":20,"../objects/Body":21,"../shapes/ConvexPolyhedron":23,"../shapes/Shape":25,"../solver/Solver":28,"../utils/Vec3Pool":33}],35:[function(_dereq_,module,exports){
    /* 全球性能 */
    
    module.exports = World;
    
    var Shape = _dereq_('../shapes/Shape');
    var Vec3 = _dereq_('../math/Vec3');
    var Quaternion = _dereq_('../math/Quaternion');
    var GSSolver = _dereq_('../solver/GSSolver');
    var ContactEquation = _dereq_('../equations/ContactEquation');
    var FrictionEquation = _dereq_('../equations/FrictionEquation');
    var Narrowphase = _dereq_('./Narrowphase');
    var EventTarget = _dereq_('../utils/EventTarget');
    var ArrayCollisionMatrix = _dereq_('../collision/ArrayCollisionMatrix');
    var OverlapKeeper = _dereq_('../collision/OverlapKeeper');
    var Material = _dereq_('../material/Material');
    var ContactMaterial = _dereq_('../material/ContactMaterial');
    var Body = _dereq_('../objects/Body');
    var TupleDictionary = _dereq_('../utils/TupleDictionary');
    var RaycastResult = _dereq_('../collision/RaycastResult');
    var AABB = _dereq_('../collision/AABB');
    var Ray = _dereq_('../collision/Ray');
    var NaiveBroadphase = _dereq_('../collision/NaiveBroadphase');
    
    /**
     * 物理世界
     * @class 世界
     * @constructor
     * @extends EventTarget
     * @param {object} [options]
     * @param {Vec3} [options.gravity]
     * @param {boolean} [options.allowSleep]
     * @param {Broadphase} [options.broadphase]
     * @param {Solver} [options.solver]
     * @param {boolean} [options.quatNormalizeFast]
     * @param {number} [options.quatNormalizeSkip]
     */
    function World(options){
        options = options || {};
        EventTarget.apply(this);
    
        /**
         * 当前 /最后使用的时间段。如果不可用，则设置为-1。此值在每个内部步骤之前进行更新，这意味着它是内部事件回调的“新鲜”。
         * @property {Number} dt
         */
        this.dt = -1;
    
        /**
         * 让身体不活跃时就睡觉了
         * @property 允许
         * @type {Boolean}
         * @default false
         */
        // this.allowSleep = !!options.allowSleep;
    
        /**
         * 世界上所有当前的联系人（接触式实例）。
         * @property 联系人
         * @type {Array}
         */
        this.contacts = [];
        this.frictionEquations = [];
    
        /**
         * 频繁一次将四元正常化。设置为每个步骤的0，每秒1等。更大的值会提高性能。如果身体倾向于爆炸，则将其设置为较小的值（零以确保没有任何问题）。
         * @property quatnoralizeskip
         * @type {Number}
         * @default 0
         */
        this.quatNormalizeSkip = options.quatNormalizeSkip !== undefined ? options.quatNormalizeSkip : 0;
    
        /**
         * 设置为TRUE使用快速的四元素归一化。它通常足够准确地使用。如果身体倾向于爆炸，请设置为假。
         * @property quatnoralizefast
         * @type {Boolean}
         * @see Quaternion.normalizeFast
         * @see Quaternion.normalize
         * @default false
         */
        this.quatNormalizeFast = options.quatNormalizeFast !== undefined ? options.quatNormalizeFast : false;
    
        /**
         * 自模拟开始以来的墙壁锁定时间
         * @property 时间
         * @type {Number}
         */
        this.time = 0.0;
    
        /**
         * 开始自开始的时间段数量
         * @property 继数
         * @type {Number}
         */
        this.stepnumber = 0;
    
        ///默认和最后时间段尺寸
        this.default_dt = 1/60;
    
        this.nextId = 0;
        /**
         * @property 重力
         * @type {Vec3}
         */
        this.gravity = new Vec3();
        if(options.gravity){
            this.gravity.copy(options.gravity);
        }
    
        /**
         * 用于使用的Broadphase算法。默认值是幼稚的
         * @property 宽相
         * @type {Broadphase}
         */
        this.broadphase = options.broadphase !== undefined ? options.broadphase : new NaiveBroadphase();
    
        /**
         * @property 身体
         * @type {Array}
         */
        this.bodies = [];
    
        /**
         * 求解器算法要使用。默认值为GSSOLVER
         * @property 求解器
         * @type {Solver}
         */
        this.solver = options.solver !== undefined ? options.solver : new GSSolver();
    
        /**
         * @property 约束
         * @type {Array}
         */
        this.constraints = [];
    
        /**
         * @property 狭窄
         * @type {Narrowphase}
         */
        this.narrowphase = new Narrowphase(this);
    
        /**
         * @property {ArrayCollisionMatrix} collisionMatrix
         * @type {ArrayCollisionMatrix}
         */
        this.collisionMatrix = new ArrayCollisionMatrix();
    
        /**
         * 从上一个步骤进行CollisionMatrix。
         * @property {ArrayCollisionMatrix} collisionMatrixPrevious
         * @type {ArrayCollisionMatrix}
         */
        this.collisionMatrixPrevious = new ArrayCollisionMatrix();
    
        this.bodyOverlapKeeper = new OverlapKeeper();
        this.shapeOverlapKeeper = new OverlapKeeper();
    
        /**
         * 所有添加的材料
         * @property 材料
         * @type {Array}
         */
        this.materials = [];
    
        /**
         * @property 接触材料
         * @type {Array}
         */
        this.contactmaterials = [];
    
        /**
         * 给定两个材料实例，用于查找接触材料。
         * @property {TupleDictionary} contactMaterialTable
         */
        this.contactMaterialTable = new TupleDictionary();
    
        this.defaultMaterial = new Material("default");
    
        /**
         * 如果找不到合适的接触式接触，则使用此接触材料。
         * @property DefaultContactMaterial
         * @type {ContactMaterial}
         */
        this.defaultContactMaterial = new ContactMaterial(this.defaultMaterial, this.defaultMaterial, { friction: 0.3, restitution: 0.0 });
    
        // /**
        //  * @property 专门化
        //  * @type {Boolean}
        //  */
        // this.doProfiling = false;
    
        // /**
        //  * @property 轮廓
        //  * @type {Object}
        //  */
        // this.profile = {
        //     solve:0,
        //     makeContactConstraints:0,
        //     broadphase:0,
        //     integrate:0,
        //     narrowphase:0,
        // };
    
        /**
         * 用于插值的时间累加器。请参阅http://gafferongames.com/game-physics/fix-your-timestep/
         * @property {Number} accumulator
         */
        // this.accumulator = 0;
    
        // /**
        //  * @property 子系统
        //  * @type {Array}
        //  */
        // this.subsystems = [];
    
        /**
         * 在将尸体添加到世界后派遣。
         * @event addBody
         * @param {Body} body 已添加到世界的身体。
         */
        this.addBodyEvent = {
            type:"addBody",
            body : null
        };
    
        /**
         * 尸体已从世界上移走后被派往。
         * @event removeBody
         * @param {Body} body 已经从世界上移走的身体。
         */
        this.removeBodyEvent = {
            type:"removeBody",
            body : null
        };
    
        this.idToBodyMap = {};
    
        this.broadphase.setWorld(this);
    }
    World.prototype = new EventTarget();
    
    // 临时东西
    var tmpAABB1 = new AABB();
    var tmpArray1 = [];
    var tmpRay = new Ray();
    
    /**
     * 获取材料M1和M2之间的接触材料
     * @method getContactMaterial
     * @param {Material} m1
     * @param {Material} m2
     * @return {ContactMaterial} 如果找到了接触材料。
     */
    World.prototype.getContactMaterial = function(m1,m2){
        return this.contactMaterialTable.get(m1.id,m2.id); //this.contactmaterials [this.mats2cmat [i+j*this.materials.length]];
    };
    
    /**
     * 获取世界上的对象数量。
     * @method numObjects
     * @return {Number}
     * @deprecated
     */
    World.prototype.numObjects = function(){
        return this.bodies.length;
    };
    
    /**
     * 存储旧的碰撞状态信息
     * @method collisionMatrixTick
     */
    World.prototype.collisionMatrixTick = function(){
        // var temp = this.collisionMatrixPrevious;
        // this.collisionMatrixPrevious = this.collisionMatrix;
        // this.collisionMatrix = temp;
        // // this.collisionMatrix.reset();
    
        // this.bodyOverlapKeeper.tick();
        // this.shapeOverlapKeeper.tick();
    };
    
    /**
     * 在模拟中添加一个刚性的身体。
     * @method add
     * @param {Body} body
     * @todo 如果模拟尚未启动，为什么要为每个身体重新编写和复制阵列？在这种情况下，积聚在动态阵列中。
     * @todo 应该可以添加一系列物体。这也可以节省一些循环
     * @deprecated 改用.addbody
     */
    World.prototype.add = World.prototype.addBody = function(body){
        if(this.bodies.indexOf(body) !== -1){
            return;
        }
        body.index = this.bodies.length;
        this.bodies.push(body);
        body.world = this;
        body.initPosition.copy(body.position);
        body.initVelocity.copy(body.velocity);
        // body.timeLastSleepy = this.time;
        if(body instanceof Body){
            body.initAngularVelocity.copy(body.angularVelocity);
            body.initQuaternion.copy(body.quaternion);
        }
        // this.collisionMatrix.setNumObjects(this.bodies.length);
        this.addBodyEvent.body = body;
        this.idToBodyMap[body.id] = body;
        this.dispatchEvent(this.addBodyEvent);
    };
    
    /**
     * 在模拟中添加约束。
     * @method addConstraint
     * @param {Constraint} c
     */
    World.prototype.addConstraint = function(c){
        this.constraints.push(c);
    };
    
    /**
     * 删除约束
     * @method removeConstraint
     * @param {Constraint} c
     */
    World.prototype.removeConstraint = function(c){
        var idx = this.constraints.indexOf(c);
        if(idx!==-1){
            this.constraints.splice(idx,1);
        }
    };
    
    // /**
    //  * Raycast测试
    //  * @method rayTest
    //  * @param {Vec3} from
    //  * @param {Vec3} to
    //  * @param {RaycastResult} result
    //  * @deprecated 使用.Raycastall，.RaycastClosest或.Raycastany。
    //  */
    // World.prototype.rayTest = function(from, to, result){
    //     if(result instanceof RaycastResult){
    //         // 做RaycastClosest
    //         this.raycastClosest(from, to, {
    //             skipBackfaces: true
    //         }, result);
    //     } else {
    //         // 做Raycastall
    //         this.raycastAll(from, to, {
    //             skipBackfaces: true
    //         }, result);
    //     }
    // };
    
    // /**
    //  * 雷对所有身体施放。所提供的回调将以raycastresult作为单个参数执行每个命中。
    //  * @method raycastAll
    //  * @param  {Vec3} from
    //  * @param  {Vec3} to
    //  * @param  {Object} options
    //  * @param  {number} [options.collisionFilterMask=-1]
    //  * @param  {number} [options.collisionFilterGroup=-1]
    //  * @param  {boolean} [options.skipBackfaces=false]
    //  * @param  {boolean} [options.checkCollisionResponse=true]
    //  * @param  {Function} callback
    //  * @return {boolean} 如果有任何尸体被击中，则是真的。
    //  */
    // World.prototype.raycastAll = function(from, to, options, callback){
    //     options.mode = Ray.ALL;
    //     options.from = from;
    //     options.to = to;
    //     options.callback = callback;
    //     return tmpRay.intersectWorld(this, options);
    // };
    
    // /**
    //  * 雷（Ray）铸造，并在第一个结果停止。请注意，该顺序是随机的 -但是该方法很快。
    //  * @method raycastAny
    //  * @param  {Vec3} from
    //  * @param  {Vec3} to
    //  * @param  {Object} options
    //  * @param  {number} [options.collisionFilterMask=-1]
    //  * @param  {number} [options.collisionFilterGroup=-1]
    //  * @param  {boolean} [options.skipBackfaces=false]
    //  * @param  {boolean} [options.checkCollisionResponse=true]
    //  * @param  {RaycastResult} result
    //  * @return {boolean} 如果有任何尸体被击中，则是真的。
    //  */
    // World.prototype.raycastAny = function(from, to, options, result){
    //     options.mode = Ray.ANY;
    //     options.from = from;
    //     options.to = to;
    //     options.result = result;
    //     return tmpRay.intersectWorld(this, options);
    // };
    
    // /**
    //  * 雷（Ray）铸造并返回最接近的命中信息。
    //  * @method raycastClosest
    //  * @param  {Vec3} from
    //  * @param  {Vec3} to
    //  * @param  {Object} options
    //  * @param  {number} [options.collisionFilterMask=-1]
    //  * @param  {number} [options.collisionFilterGroup=-1]
    //  * @param  {boolean} [options.skipBackfaces=false]
    //  * @param  {boolean} [options.checkCollisionResponse=true]
    //  * @param  {RaycastResult} result
    //  * @return {boolean} 如果有任何尸体被击中，则是真的。
    //  */
    // World.prototype.raycastClosest = function(from, to, options, result){
    //     options.mode = Ray.CLOSEST;
    //     options.from = from;
    //     options.to = to;
    //     options.result = result;
    //     return tmpRay.intersectWorld(this, options);
    // };
    
    /**
     * 从模拟中卸下刚体。
     * @method remove
     * @param {Body} body
     * @deprecated 改用.emoveBody
     */
    World.prototype.remove = function(body){
        body.world = null;
        var n = this.bodies.length - 1,
            bodies = this.bodies,
            idx = bodies.indexOf(body);
        if(idx !== -1){
            bodies.splice(idx, 1); // 托多：应该使用免费垃圾的方法
    
            // 重新计算索引
            for(var i=0; i!==bodies.length; i++){
                bodies[i].index = i;
            }
    
            // this.collisionMatrix.setNumObjects(n);
            this.removeBodyEvent.body = body;
            delete this.idToBodyMap[body.id];
            this.dispatchEvent(this.removeBodyEvent);
        }
    };
    
    /**
     * 从模拟中卸下刚体。
     * @method removeBody
     * @param {Body} body
     */
    World.prototype.removeBody = World.prototype.remove;
    
    World.prototype.getBodyById = function(id){
        return this.idToBodyMap[id];
    };
    
    // 托多（Todo）制作更快的地图
    World.prototype.getShapeById = function(id){
        // var bodies = this.bodies;
        // for(var i=0, bl = bodies.length; i<bl; i++){
        //     var shapes = bodies[i].shapes;
        //     for (var j = 0, sl = shapes.length; j < sl; j++) {
        //         var shape = shapes[j];
        //         if(shape.id === id){
        //             return shape;
        //         }
        //     }
        // }
    };
    
    /**
     * 为世界添加了一种材料。
     * @method addMaterial
     * @param {Material} m
     * @todo 必要的？
     */
    World.prototype.addMaterial = function(m){
        this.materials.push(m);
    };
    
    /**
     * 向世界添加联系材料
     * @method addContactMaterial
     * @param {ContactMaterial} cmat
     */
    World.prototype.addContactMaterial = function(cmat) {
    
        // 添加联系人材料
        this.contactmaterials.push(cmat);
    
        // 将当前的接触材料添加到材料表中
        this.contactMaterialTable.set(cmat.materials[0].id,cmat.materials[1].id,cmat);
    };
    
    // Performance.now()
    if(typeof performance === 'undefined'){
        performance = {};
    }
    if(!performance.now){
        var nowOffset = Date.now();
        if (performance.timing && performance.timing.navigationStart){
            nowOffset = performance.timing.navigationStart;
        }
        performance.now = function(){
            return Date.now() - nowOffset;
        };
    }
    
    var step_tmp1 = new Vec3();
    
    /**
     * 及时地将物理世界前进。
     *
     * 有两种模式。简单的模式是固定的时间播放而无需插值。在这种情况下，您仅使用第一个参数。第二种情况使用插值。因为您还提供了自上次使用该功能以及最大固定时间段的时间。
     *
     * @method step
     * @param {Number} dt                       固定的时间步长要使用。
     * @param {Number} [timeSinceLastCalled]    自函数上一次调用以来的时间。
     * @param {Number} [maxSubSteps=10]         每个功能调用的固定步骤的最大数量。
     *
     * @example
     *     // fixed timestepping without interpolation
     *     world.step(1/60);
     *
     * @see http://bulletphysics.org/mediawiki-1.5.8/index.php/Stepping_The_World
     */
    World.prototype.step = function(dt, timeSinceLastCalled, maxSubSteps){
        maxSubSteps = maxSubSteps || 10;
        timeSinceLastCalled = timeSinceLastCalled || 0;
    
        if(timeSinceLastCalled === 0){ // 固定，简单的步进
    
            this.internalStep(dt);
    
            // 增加时间
            this.time += dt;
    
        } else {
    
            // this.accumulator += timeSinceLastCalled;
            // var substeps = 0;
            // while (this.accumulator >= dt && substeps < maxSubSteps) {
            //     // 做固定的步骤以赶上
            //     this.internalStep(dt);
            //     this.accumulator -= dt;
            //     substeps++;
            // }
    
            // var t = (this.accumulator % dt) / dt;
            for(var j=0; j !== this.bodies.length; j++){
                var b = this.bodies[j];
                // b.previousPosition.lerp(b.position, t, b.interpolatedPosition);
                // b.previousQuaternion.slerp(b.quaternion, t, b.interpolatedQuaternion);
                // b.previousQuaternion.normalize();
            }
            this.time += timeSinceLastCalled;
        }
    };
    
    var
        /**
         * 全世界及时地向前迈进之后。
         * @event postStep
         */
        World_step_postStepEvent = {type:"postStep"}, // 可重复使用的事件对象来保存内存
        /**
         * 在世界前进之前派遣。
         * @event preStep
         */
        World_step_preStepEvent = {type:"preStep"},
        World_step_collideEvent = {type:Body.COLLIDE_EVENT_NAME, body:null, contact:null },
        World_step_oldContacts = [], // 未使用对象的池
        World_step_frictionEquationPool = [],
        World_step_p1 = [], // 可重复使用的碰撞对阵列
        World_step_p2 = [];
        // World_step_gvec = new Vec3(), // 临时向量和Quats
        // World_step_vi = new Vec3(),
        // World_step_vj = new Vec3(),
        // World_step_wi = new Vec3(),
        // World_step_wj = new Vec3(),
        // World_step_t1 = new Vec3(),
        // World_step_t2 = new Vec3(),
        // World_step_rixn = new Vec3(),
        // World_step_rjxn = new Vec3(),
        // World_step_step_q = new Quaternion(),
        // World_step_step_w = new Quaternion(),
        // World_step_step_wq = new Quaternion(),
        // invI_tau_dt = new Vec3();
    World.prototype.internalStep = function(dt){
        this.dt = dt;
    
        var world = this,
            that = this,
            contacts = this.contacts,
            p1 = World_step_p1,
            p2 = World_step_p2,
            N = this.numObjects(),
            bodies = this.bodies,
            solver = this.solver,
            gravity = this.gravity,
            // doProfiling = this.doProfiling,
            // profile = this.profile,
            DYNAMIC = Body.DYNAMIC,
            profilingStart,
            constraints = this.constraints,
            frictionEquationPool = World_step_frictionEquationPool,
            gnorm = gravity.norm(),
            gx = gravity.x,
            gy = gravity.y,
            gz = gravity.z,
            i=0;
    
        // if(doProfiling){
        //     profilingStart = performance.now();
        // }
    
        // 将重力添加到所有对象
        for(i=0; i!==N; i++){
            var bi = bodies[i];
            if(bi.type === DYNAMIC){ // 仅用于动态身体
                var f = bi.force, m = bi.mass;
                f.x += m*gx;
                f.y += m*gy;
                f.z += m*gz;
            }
        }
    
        // // 更新子系统
        // for(var i=0, Nsubsystems=this.subsystems.length; i!==Nsubsystems; i++){
        //     this.subsystems[i].update();
        // }
    
        // 碰撞检测
        // if(doProfiling){ profilingStart = performance.now(); }
        p1.length = 0; // 清除最后一步的对阵列
        p2.length = 0;
        this.broadphase.collisionPairs(this,p1,p2);
        // if(doProfiling){ profile.broadphase = performance.now() - profilingStart; }
    
        // 用collideconnected == false删除约束对
        var Nconstraints = constraints.length;
        for(i=0; i!==Nconstraints; i++){
            var c = constraints[i];
            if(!c.collideConnected){
                for(var j = p1.length-1; j>=0; j-=1){
                    if( (c.bodyA === p1[j] && c.bodyB === p2[j]) ||
                        (c.bodyB === p1[j] && c.bodyA === p2[j])){
                        p1.splice(j, 1);
                        p2.splice(j, 1);
                    }
                }
            }
        }
    
        this.collisionMatrixTick();
    
        // 产生联系人
        // if(doProfiling){ profilingStart = performance.now(); }
        var oldcontacts = World_step_oldContacts;
        var NoldContacts = contacts.length;
    
        for(i=0; i!==NoldContacts; i++){
            oldcontacts.push(contacts[i]);
        }
        contacts.length = 0;
    
        // 将摩擦等式从当前列表转移到池以进行重复使用
        var NoldFrictionEquations = this.frictionEquations.length;
        for(i=0; i!==NoldFrictionEquations; i++){
            frictionEquationPool.push(this.frictionEquations[i]);
        }
        this.frictionEquations.length = 0;
    
        this.narrowphase.getContacts(
            p1,
            p2,
            this,
            contacts,
            oldcontacts, // 重复使用
            this.frictionEquations,
            frictionEquationPool
        );
    
        // if(doProfiling){
        //     profile.narrowphase = performance.now() - profilingStart;
        // }
    
        // // 循环在所有碰撞
        // if(doProfiling){
        //     profilingStart = performance.now();
        // }
    
        // 添加所有摩擦等式
        for (var i = 0; i < this.frictionEquations.length; i++) {
            solver.addEquation(this.frictionEquations[i]);
        }
    
        var ncontacts = contacts.length;
        for(var k=0; k!==ncontacts; k++){
    
            // 当前联系
            var c = contacts[k];
    
            // 获取当前的碰撞指数
            var bi = c.bi,
                bj = c.bj,
                si = c.si,
                sj = c.sj;
    
            // 获取碰撞属性
            var cm;
            if(bi.material && bj.material){
                cm = this.getContactMaterial(bi.material,bj.material) || this.defaultContactMaterial;
            } else {
                cm = this.defaultContactMaterial;
            }
    
            // c.enabled = bi.collisionResponse && bj.collisionResponse && si.collisionResponse && sj.collisionResponse;
    
            var mu = cm.friction;
            // c。
    
            // 如果材料中指定了摩擦或恢复原状，请使用它们
            if(bi.material && bj.material){
                if(bi.material.friction >= 0 && bj.material.friction >= 0){
                    mu = bi.material.friction * bj.material.friction;
                }
    
                if(bi.material.restitution >= 0 && bj.material.restitution >= 0){
                    c.restitution = bi.material.restitution * bj.material.restitution;
                }
            }
    
            // c.setspookparams（
      //           cm.contactequationstiffness，
      //           cm.contactequationRelaxation，
      //           DT
      //       ）；
    
            solver.addEquation(c);
    
            // //添加摩擦约束方程
            // 如果（MU> 0）{
    
            // 	//创建2个切线方程
            // 	var mug = mu *gnorm;
            // 	var降低mass =（bi.invmass + bj.invmass）;
            // 	if（yousedmass> 0）{
            // 		减少症= 1/还原剂量；
            // 	}
            // 	var pool = MrifictionEquationPool;
            // 	var c1 = pool.length？ poop.pop（）：新的摩擦等式（BI，BJ，Mug*Redudedmass）;
            // 	var c2 = pool.length？ poop.pop（）：新的摩擦等式（BI，BJ，Mug*Redudedmass）;
            // 	this.frictionequations.push（c1，c2）;
    
            // 	c1.bi = c2.bi = bi;
            // 	c1.bj = c2.bj = bj;
            // 	c1.minforce = c2.minforce = -mug*yousedmass;
            // 	c1.maxforce = c2.maxforce = mug*redusedmass;
    
            // 	//复制相对向量
            // 	c1.ri.copy（c.ri）;
            // 	c1.rj.copy（c.rj）;
            // 	c2.ri.copy（c.ri）;
            // 	c2.rj.copy（c.rj）;
    
            // 	//构造切线
            // 	c.ni.tangents（C1.T，C2.T）;
    
      //           //设置Spook参数
      //           c1.setspookparams（cm.FrictionEquationStiffness，cm.FrictionEquationRelaxation，dt）;
      //           c2.setspookparams（cm.frictionequationstiffness，cm.frictionEquationRelaxation，dt）;
    
      //           c1.enabled = c2.enabled = c.enabled;
    
            // 	//将方程式添加到求解器
            // 	solver.Addequation（C1）;
            // 	solver.Addequation（C2）;
            // }
    
            if( bi.allowSleep &&
                bi.type === Body.DYNAMIC &&
                // bi.sleepState  === Body.SLEEPING &&
                // bj.sleepState  === Body.AWAKE &&
                bj.type !== Body.STATIC
            ){
                var speedSquaredB = bj.velocity.norm2() + bj.angularVelocity.norm2();
                // var speedLimitSquaredB = Math.pow(bj.sleepSpeedLimit,2);
                // if(speedSquaredB >= speedLimitSquaredB*2){
                //     bi._wakeUpAfterNarrowphase = true;
                // }
            }
    
            if( bj.allowSleep &&
                bj.type === Body.DYNAMIC &&
                // bj.sleepState  === Body.SLEEPING &&
                // bi.sleepState  === Body.AWAKE &&
                bi.type !== Body.STATIC
            ){
                var speedSquaredA = bi.velocity.norm2() + bi.angularVelocity.norm2();
                // var speedLimitSquaredA = Math.pow(bi.sleepSpeedLimit,2);
                // if(speedSquaredA >= speedLimitSquaredA*2){
                //     bj._wakeUpAfterNarrowphase = true;
                // }
            }
    
            // 现在我们知道我和J正在联系。设置碰撞矩阵状态
            // this.collisionMatrix.set(bi, bj, true);
    
            // if (!this.collisionMatrixPrevious.get(bi, bj)) {
            //     // 第一次联系！
            //     // 我们重复使用CollideEvent对象，否则我们最终将为每个新联系人创建新对象，即使没有事件侦听器。
            //     World_step_collideEvent.body = bj;
            //     World_step_collideEvent.contact = c;
            //     bi.dispatchEvent(World_step_collideEvent);
    
            //     World_step_collideEvent.body = bi;
            //     bj.dispatchEvent(World_step_collideEvent);
            // }
    
            this.bodyOverlapKeeper.set(bi.id, bj.id);
            this.shapeOverlapKeeper.set(si.id, sj.id);
        }
    
        // this.emitContactEvents();
    
        // if(doProfiling){
        //     profile.makeContactConstraints = performance.now() - profilingStart;
        //     profilingStart = performance.now();
        // }
    
        // 醒来的身体
        for(i=0; i!==N; i++){
            var bi = bodies[i];
            // if(bi._wakeUpAfterNarrowphase){
            //     bi.wakeUp();
            //     bi._wakeUpAfterNarrowphase = false;
            // }
        }
    
        // 添加用户添加的约束
        var Nconstraints = constraints.length;
        for(i=0; i!==Nconstraints; i++){
            var c = constraints[i];
            c.update();
            for(var j=0, Neq=c.equations.length; j!==Neq; j++){
                var eq = c.equations[j];
                solver.addEquation(eq);
            }
        }
    
        // 解决约束系统
        solver.solve(dt,this);
    
        // if(doProfiling){
        //     profile.solve = performance.now() - profilingStart;
        // }
    
        // 从求解器中删除所有触点
        solver.removeAllEquations();
    
        // 有关详细信息
        var pow = Math.pow;
        for(i=0; i!==N; i++){
            var bi = bodies[i];
            if(bi.type & DYNAMIC){ // 仅用于动态身体
                var ld = pow(1.0 - bi.linearDamping,dt);
                var v = bi.velocity;
                v.mult(ld,v);
                var av = bi.angularVelocity;
                if(av){
                    var ad = pow(1.0 - bi.angularDamping,dt);
                    av.mult(ad,av);
                }
            }
        }
    
        this.dispatchEvent(World_step_preStepEvent);
    
        // 调用预步回来
        for(i=0; i!==N; i++){
            var bi = bodies[i];
            // if(bi.preStep){
            //     bi.preStep.call(bi);
            // }
        }
    
        // 跳蛙
        // new = v + h*f/m
        // x new = x +高清新
        // if(doProfiling){
        //     profilingStart = performance.now();
        // }
        var stepnumber = this.stepnumber;
        var quatNormalize = stepnumber % (this.quatNormalizeSkip + 1) === 0;
        var quatNormalizeFast = this.quatNormalizeFast;
    
        for(i=0; i!==N; i++){
            bodies[i].integrate(dt, quatNormalize, quatNormalizeFast);
        }
        this.clearForces();
    
        this.broadphase.dirty = true;
    
        // if(doProfiling){
        //     profile.integrate = performance.now() - profilingStart;
        // }
    
        // 更新世界时间
        this.time += dt;
        this.stepnumber += 1;
    
        this.dispatchEvent(World_step_postStepEvent);
    
        // // 调用步骤后回调
        // for(i=0; i!==N; i++){
        //     var bi = bodies[i];
        //     var postStep = bi.postStep;
        //     if(postStep){
        //         postStep.call(bi);
        //     }
        // }
    
        // // 睡眠更新
        // if(this.allowSleep){
        //     for(i=0; i!==N; i++){
        //         bodies[i].sleepTick(this.time);
        //     }
        // }
    };
    
    World.prototype.emitContactEvents = (function(){
        // var additions = [];
        // var removals = [];
        // var beginContactEvent = {
        //     type: 'beginContact',
        //     bodyA: null,
        //     bodyB: null
        // };
        // var endContactEvent = {
        //     type: 'endContact',
        //     bodyA: null,
        //     bodyB: null
        // };
        // var beginShapeContactEvent = {
        //     type: 'beginShapeContact',
        //     bodyA: null,
        //     bodyB: null,
        //     shapeA: null,
        //     shapeB: null
        // };
        // var endShapeContactEvent = {
        //     type: 'endShapeContact',
        //     bodyA: null,
        //     bodyB: null,
        //     shapeA: null,
        //     shapeB: null
        // };
        // return function(){
        //     var hasBeginContact = this.hasAnyEventListener('beginContact');
        //     var hasEndContact = this.hasAnyEventListener('endContact');
    
        //     if(hasBeginContact || hasEndContact){
        //         this.bodyOverlapKeeper.getDiff(additions, removals);
        //     }
    
        //     if(hasBeginContact){
        //         for (var i = 0, l = additions.length; i < l; i += 2) {
        //             beginContactEvent.bodyA = this.getBodyById(additions[i]);
        //             beginContactEvent.bodyB = this.getBodyById(additions[i+1]);
        //             this.dispatchEvent(beginContactEvent);
        //         }
        //         beginContactEvent.bodyA = beginContactEvent.bodyB = null;
        //     }
    
        //     if(hasEndContact){
        //         for (var i = 0, l = removals.length; i < l; i += 2) {
        //             endContactEvent.bodyA = this.getBodyById(removals[i]);
        //             endContactEvent.bodyB = this.getBodyById(removals[i+1]);
        //             this.dispatchEvent(endContactEvent);
        //         }
        //         endContactEvent.bodyA = endContactEvent.bodyB = null;
        //     }
    
        //     additions.length = removals.length = 0;
    
        //     var hasBeginShapeContact = this.hasAnyEventListener('beginShapeContact');
        //     var hasEndShapeContact = this.hasAnyEventListener('endShapeContact');
    
        //     if(hasBeginShapeContact || hasEndShapeContact){
        //         this.shapeOverlapKeeper.getDiff(additions, removals);
        //     }
    
        //     if(hasBeginShapeContact){
        //         for (var i = 0, l = additions.length; i < l; i += 2) {
        //             var shapeA = this.getShapeById(additions[i]);
        //             var shapeB = this.getShapeById(additions[i+1]);
        //             beginShapeContactEvent.shapeA = shapeA;
        //             beginShapeContactEvent.shapeB = shapeB;
        //             beginShapeContactEvent.bodyA = shapeA.body;
        //             beginShapeContactEvent.bodyB = shapeB.body;
        //             this.dispatchEvent(beginShapeContactEvent);
        //         }
        //         beginShapeContactEvent.bodyA = beginShapeContactEvent.bodyB = beginShapeContactEvent.shapeA = beginShapeContactEvent.shapeB = null;
        //     }
    
        //     if(hasEndShapeContact){
        //         for (var i = 0, l = removals.length; i < l; i += 2) {
        //             var shapeA = this.getShapeById(removals[i]);
        //             var shapeB = this.getShapeById(removals[i+1]);
        //             endShapeContactEvent.shapeA = shapeA;
        //             endShapeContactEvent.shapeB = shapeB;
        //             endShapeContactEvent.bodyA = shapeA.body;
        //             endShapeContactEvent.bodyB = shapeB.body;
        //             this.dispatchEvent(endShapeContactEvent);
        //         }
        //         endShapeContactEvent.bodyA = endShapeContactEvent.bodyB = endShapeContactEvent.shapeA = endShapeContactEvent.shapeB = null;
        //     }
    
        // };
    })();
    
    /**
     * 将世界上的所有身体力量设置为零。
     * @method clearForces
     */
    World.prototype.clearForces = function(){
        var bodies = this.bodies;
        var N = bodies.length;
        for(var i=0; i !== N; i++){
            var b = bodies[i],
                force = b.force,
                tau = b.torque;
    
            b.force.set(0,0,0);
            b.torque.set(0,0,0);
        }
    };
    
    },{"../collision/AABB":3,"../collision/ArrayCollisionMatrix":4,"../collision/NaiveBroadphase":6,"../collision/OverlapKeeper":7,"../collision/Ray":8,"../collision/RaycastResult":9,"../equations/ContactEquation":11,"../equations/FrictionEquation":13,"../material/ContactMaterial":14,"../material/Material":15,"../math/Quaternion":18,"../math/Vec3":20,"../objects/Body":21,"../shapes/Shape":25,"../solver/GSSolver":27,"../utils/EventTarget":29,"../utils/TupleDictionary":31,"./Narrowphase":34}]},{},[2])
    (2)
    });