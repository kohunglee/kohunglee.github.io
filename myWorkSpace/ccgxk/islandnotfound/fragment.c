#version 300 es
precision highp float;

#define MATERIAL_SKY 0  // 天空
#define MATERIAL_TERRAIN 1  // 大地
#define MATERIAL_BUILDINGS 2   // 建筑
#define MATERIAL_SCREEN 3  // 屏幕

// 材料的子材料
#define SUBMATERIAL_WOOD -1
#define SUBMATERIAL_CONCRETE 0  // 0及以下具有具体纹理。
#define SUBMATERIAL_METAL 1  //> 0很光滑，有镜面
#define SUBMATERIAL_BRIGHT_RED 2
#define SUBMATERIAL_DARK_RED 3
#define SUBMATERIAL_BLACK_PURPLE 4
#define SUBMATERIAL_YELLOW 5

const float PI = 3.14159265359;

// 噪音纹理的像素的大小
const float NOISE_TEXTURE_SIZE = 512.;
const float COLLISION_TEXTURE_SIZE = 128.;
const float PRERENDERED_TEXTURE_SIZE = 256.;
const int NOISE_TEXTURE_BITMASK = 0x1ff;

// 纵横比按设计固定为1.5
const float SCREEN_ASPECT_RATIO = 1.5;

// 视野，弧度
const float FIELD_OF_VIEW = radians(45.0);

// 投影矩阵
const float PROJECTION_LEN = 1. / tan(.5 * FIELD_OF_VIEW);

in vec2 FC;

uniform vec2 iR;  // 屏幕分辨率
uniform vec3 iP;  // 相机位置
uniform vec4 iD;  // 相机方向和距离
uniform vec4 iA;  // 动画制服
uniform vec4 iB;
uniform vec4 iC;
uniform vec4 iS;
uniform vec4 iX;
uniform mat3 iM;  // 相机旋转矩阵
uniform lowp int iF;  // 记录着手电筒是否打开、钥匙是否捡到等信息

///// h ///////

// 屏幕位置，以像素为单位。左下是（0，0），右上为（iresolution.x-1，irestolution.y-1）。
#define fragCoord FC

// 输出颜色
#define oColor oC
out vec4 oColor;

///// 核心制服//////

// 像素中的屏幕分辨率。
#define iResolution iR

// 相机位置
#define iCameraPos iP

// 方向相机
#define iCameraDir iD.xyz

// 几秒钟的时间
#define iTime iD.w

// 阳光方向
#define iSunDirection iS.xyz

// 当前的水
#define iWaterLevel iS.w

// 相机旋转矩阵
#define iCameraMat3 iM

///// 游戏对象制服/////////

// 手电筒打开
#define iFlashlightOn ((iF & 0x01) != 0)

// 监狱钥匙
#define iGOKeyVisible ((iF & 0x02) != 0)

// 手电筒
#define iGOFlashlightVisible ((iF & 0x04) != 0)

// 天线钥匙
#define iGOAntennaKeyVisible ((iF & 0x08) != 0)

// 软盘
#define iGOFloppyDiskVisible ((iF & 0x10) != 0)

///// 动画制服///////

// 监狱门0-关闭，1-开放
#define iAnimPrisonDoor iA.x

// 天线门0-1
#define iAnimAntennaDoor iA.y

// 纪念碑下降
#define iAnimMonumentDescend iA.z

// 石油钻机坡道（在天线室内杠杆以达到0-1）
#define iAnimOilrigRamp iA.w

// 钻机上的轮子
#define iAnimOilrigWheel iB.x

// 天线旋转
#define iAnimAntennaRotation iB.y

// 电梯高度
#define iAnimElevatorHeight iB.z

// 潜艇职位
#define iSubmarineHeight iB.w

// 内部坡道
#define iAnimOilrigInnerRamp iX.x

///// 纹理//////

// 噪声纹理
#define iNoise tN
uniform highp sampler2D iNoise;

// 高度图纹理
#define iHeightmap tH
uniform highp sampler2D iHeightmap;

// 预先质地
#define iPrerendered tP
uniform highp sampler2D iPrerendered;

// 屏幕纹理
#define iScreens tS
uniform highp sampler2D iScreens;

//===状态===

// 保持当前的Epsilon全球
float epsilon;

//===颜色===

const vec3 COLOR_SKY = vec3(.4, .8, 1);
const vec3 COLOR_SUN = vec3(1.065, .95, .85);

const vec3 TERRAIN_SIZE = vec3(120., 19., 78.);
const float TERRAIN_OFFSET = 3.;
const float UNDERGROUND_LEVEL = -TERRAIN_OFFSET + 0.0005;

// 最大值
const int MAX_ITERATIONS = 100;
const float MIN_DIST = 0.15;
const float MAX_DIST = 150.;
const float HORIZON_DIST = 500.;



/* 数字边界监护人 */
float clamp01(float v) {
  return clamp(v, 0., 1.);
}
vec2 clamp01(vec2 v) {
  return clamp(v, 0., 1.);
}

// 多项式平滑最小（k = 0.1）;
float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.) / k;
  return min(a, b) - h * h * k / 4.;
}

vec4 packFloat(float v) {
  vec4 enc = clamp01(v) * (vec4(1., 255., 65025., 160581375.) * .999998);
  enc = fract(enc);
  enc -= enc.yzww * vec4(1. / 255., 1. / 255., 1. / 255., 0.);
  return enc;
}

float unpackFloat(vec4 rgba) {
  return dot(rgba, vec4(1.0, 1. / 255., 1. / 65025., 1. / 160581375.));
}

/**
 返回3D值噪声（in .x）及其衍生物（in .yz）。
 基于https://www.iquilezles.org/www/articles/gradientnoise/gradientnoise.htm by iq
*/
vec3 noiseDxy(vec2 x) {
  vec4 T = texelFetch(iNoise, ivec2(floor(x)) & NOISE_TEXTURE_BITMASK, 0);
  float xba = T.y - T.x, xca = T.z - T.x;
  float abcd = T.w - xba - T.z;
  vec2 ffract = fract(x), fsquared = ffract * ffract;
  vec2 u = fsquared * (3. - 2. * ffract);
  return vec3((T.x + xba * u.x + xca * u.y + abcd * u.x * u.y),
      (30. * fsquared * (ffract * (ffract - 2.) + 1.)) * (vec2(xba, xca) + abcd * u.yx));
}

int subMaterial = SUBMATERIAL_CONCRETE;
float subMaterialDistance = MAX_DIST;

// 如果距离更低
void updateSubMaterial(int sm, float dist) {
  if (dist < epsilon && dist != subMaterialDistance) {
    subMaterial = sm;
    subMaterialDistance = dist;
  }
}

//===原始===
float sphere(vec3 p, float s) {
  return length(p) - s;
}

float cuboid(vec3 p, vec3 s) {
  vec3 d = abs(p) - s;
  return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float cube(vec3 p, float s) {
  vec3 d = abs(p) - s;
  return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float cylinder(vec3 p, float r, float l) {
  float d = length(p.xy) - r;
  return max(d, abs(p.z) - l);
}

float torus(vec3 p, vec2 t) {
  return length(vec2(length(p.xz) - t.x, p.y)) - t.y;
}

//===操作===
// hg_sdf：http：//mercury.sexy/hg_sdf/
// 将世界划分为极限
float pModInterval(float value, float size, float start, float stop) {
  float halfsize = size * .5;
  float c = floor((value + halfsize) / size);
  float p = mod(value + halfsize, size) - halfsize;
  return c > stop ? p + size * (c - stop) : c < start ? p + size * (c - start) : p;
}

// 多次重复来源
vec2 pModPolar2(vec2 xy, float repetitions) {
  float halfAngle = PI / repetitions;
  float a = mod(atan(xy.y, xy.x) + halfAngle, halfAngle * 2.) - halfAngle;
  return vec2(cos(a), sin(a)) * length(xy);
}

// 多次在原点上重复，也添加旋转
vec2 pModPolar2Rot(vec2 xy, float repetitions, float additionalRotation) {
  float halfAngle = PI / repetitions;
  float a = mod(atan(xy.y, xy.x) + halfAngle + additionalRotation, halfAngle * 2.) - halfAngle;
  return vec2(cos(a), sin(a)) * length(xy);
}

float opOnion(float sdf, float thickness) {
  return abs(sdf) - thickness;
}

#define ELONGATE(p, h) (p - clamp(p, -h, h))

// 动态角度旋转
mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, s, -s, c);
}

vec3 invZ(vec3 p) {
  return vec3(p.xy, -p.z);
}

// ===几何===
float gameObjectFlashlight(vec3 p) {
  float bounds = length(p) - .3;
  if (bounds > .3)
    return bounds;
  p.xz *= rot(-1.2);
  p.yz *= rot(-.2);
  return min(cylinder(p, .025, .1), max(sphere(p - vec3(0, 0, .12), .05), p.z - .12));
}

float gameObjectKey(vec3 p) {
  float bounds = length(p) - .3;
  if (bounds > .3)
    return bounds;
  float r = cylinder(p, .01, .06);  // 轴
  r = min(r, cylinder(p.yzx + vec3(0, .1, 0), .04, .005));  // 处理
  r = min(r, cuboid(p - vec3(0, -.01, .04), vec3(.002, .02, .02)));

  return r;
}

float gameObjectFloppy(vec3 p) {
  float clip = cuboid(p - vec3(.03, 0, 0), vec3(.03, .006, .03));
  updateSubMaterial(SUBMATERIAL_METAL, clip);
  return min(cuboid(p, vec3(.06, .005, .06)), clip);
}

// s是段的数量（*2 + 1，所以5 = 11个段）
float bridge(vec3 p, float s, float bend) {
  float bounds = length(p) - s * .6;
  if (bounds > 4.) {
    return bounds;
  }

  p.y += cos(p.z * bend / s);
  p.x = abs(p.x);
  float boards = cuboid(p - vec3(.2, 0, 0), vec3(.1, .03, s * .55));
  float ropes = cylinder(p - vec3(.5, 1., 0), .02, s * .55);
  p.z = pModInterval(p.z, .55, -s, s);
  ropes = min(ropes, cylinder(p.xzy - vec3(.5, 0, .5), .02, .5));
  updateSubMaterial(SUBMATERIAL_METAL, ropes);
  boards = min(boards, cuboid(p, vec3(.5, .05, .2)));
  updateSubMaterial(SUBMATERIAL_WOOD, boards);
  return min(boards, ropes);
}

float antennaConsole(vec3 p) {
  float bounds = length(p) - 2.;
  if (bounds > 1.)
    return bounds;
  vec3 q = p;
  q.xy *= rot(-.25);
  float r = cuboid(q + vec3(.2, .25, 0), vec3(.25, .5, .5)) - 0.01;
  q -= vec3(-.13, .25, 0);
  q.z = pModInterval(q.z, .04, -10., 10.);
  q.x = pModInterval(q.x, .04, -3., 3.);
  float keys = cube(q, .01) - .005;
  updateSubMaterial(SUBMATERIAL_METAL, keys);
  r = min(min(r, keys), cuboid(p - vec3(-.45, .2, 0), vec3(.2, .8, .5)) - 0.01);
  return r;
}

float antennaCable(vec3 p) {
  p.zy *= rot(.06);
  p.y += cos(p.z / 20.) * 3.;
  return cylinder(p, 0.01, 27.5);
}

float antennaDoor(vec3 p) {
  float bounds = length(p) - 3.;
  if (bounds > .5)
    return bounds;
  p.xz -= vec2(1., -.05);
  p.zx *= rot(iAnimAntennaDoor * -2.5);  // 门打开动画
  p.xz += vec2(1., -.05);
  float door = cylinder(p, .99, .05);  // 门本身
  vec3 rp = vec3(pModPolar2(p.xy, 8.), p.z);
  return max(door,
      -min(cuboid(rp - vec3(.5, 0, .1), vec3(.02, .1, .1)),  // 纪念碑风格的印象
          cylinder(rp - vec3(0, 0, .1), .02, .1)  // 中心的钥匙孔
          ));
}

/* 杠杆从0-1-0开始，1下降 */
float lever(vec3 p, float leverState) {
  float bounds = length(p) - 1.;
  if (bounds > 1.)
    return bounds;
  float r = cuboid(p, vec3(.2, .5, .05));
  r = max(r, -cuboid(p, vec3(.03, .2, 1)));
  p.yz *= rot(-PI / 2. * leverState + PI / 4.);
  p.z += .2;
  r = min(r, cylinder(p, .02, .2));
  p.z += .2;
  r = min(r, cylinder(p, .03, .05));
  return r;
}

// 旋转。x控制高程/高度，旋转。y控制方位角
float antenna(vec3 p) {
  const float size = 9.;
  float bounds = length(p) - size * 2.;
  if (bounds > 5.)
    return bounds;
  p.y -= size;

  vec3 q = p;
  q.xz *= rot(iAnimAntennaRotation);
  q.xy *= rot(0.5);
  q.y -= size;
  float dishSphere = sphere(q, size);
  float dish = max(opOnion(dishSphere, .01),
      q.y + size / 2.  // 切开球的一部分
  );
  dish = min(dish, cylinder(q.xzy + vec3(0, 0, size * .5), .1, size * .5));
  dish = min(dish, sphere(q, .3));
  p.y += size * .75;
  float structure = cuboid(p, size / vec3(4., 2.5, 2.));
  structure = min(structure,
      min(max(opOnion(cylinder(p.xzy - vec3(size / 4., 0, 0), size / 2. - .1, size / 2.5 - .1), .1),
              -min(cylinder(p.zyx - vec3(0, 1.8, 0), 1., 100.),  // hole
                  cylinder(p - vec3(4.5, 2.3, 0), .4, 100.)  // 窗户的孔
                  )),
          cylinder(p.xzy - vec3(size / 4., 0, -2.2), size / 2. - .1, size / 3. - .1)  // 内部房间的地板
          ));
  float console = antennaConsole(p - vec3(3, 1.5, 2));
  float door = antennaDoor(p.zyx - vec3(0, 1.8, 6.5));
  float oilrigLever = lever(invZ(p - vec3(3.7, 2, -4)), clamp(iAnimOilrigRamp, 0., 1.));

  p.y -= size * .25;
  structure = max(min(structure, cylinder(p.xzy, size * .05, size * .53)), -dishSphere);
  p -= vec3(7, -2.85, 0);
  p.xy *= rot(-.5);
  structure = min(structure, cuboid(p, vec3(1, 1, .8)) - .01);
  float metalThings = min(dish, door);
  updateSubMaterial(SUBMATERIAL_BRIGHT_RED, oilrigLever);
  updateSubMaterial(SUBMATERIAL_DARK_RED, console);
  updateSubMaterial(SUBMATERIAL_YELLOW, metalThings);

  return min(min(console, structure), min(metalThings, oilrigLever));
}

float monument(vec3 p) {
  float bounds = length(p.xz) - 2.;
  if (bounds > 3.) {
    return bounds;
  }

  float r = cylinder(p.xzy, .2, .5);  // 按钮安装

  float ph = p.y + iAnimMonumentDescend * 4.;
  if (iGOAntennaKeyVisible) {
    float key = gameObjectKey(vec3(p.x, ph, p.z) + vec3(1.05, -5.05, 1.05));
    if (key < r) {
      updateSubMaterial(SUBMATERIAL_BRIGHT_RED, key);
      r = key;
    }
  }

  float m = cuboid(vec3(pModPolar2(p.xz, 8.), ph).xzy - vec3(1.5, 0, 0), vec3(.1, 5, .2));  // 实际的纪念碑
  if (m < r) {
    updateSubMaterial(SUBMATERIAL_BLACK_PURPLE, m);
    r = m;
  }

  float b = cylinder(p.xzy + vec3(0, 0, clamp(iAnimMonumentDescend, 0., .02)), .05, .53);  // 按钮
  if (b < r) {
    updateSubMaterial(SUBMATERIAL_METAL, b);
    r = b;
  }

  return r;
}

float prison(vec3 ip) {
  vec3 p = ip.zyx - vec3(11, 1.25, -44);

  float bounds = length(p) - 8.;
  if (bounds > 5.)
    return bounds;
  p.y -= 2.;
  float cornerBox = cuboid(p - vec3(-2.7, -1, -1.3), vec3(0.35, .5, .5));
  float structure = max(opOnion(cuboid(p, vec3(4, 1.6, 2)), 0.23),  // 主盒
      -min(  // 切孔的孔：
          cylinder(p - vec3(0, .5, 0), .8, 100.),  // the windows
          cuboid(p - vec3(4, -.37, 1), vec3(2, 1, .53))  // 门
          ));

  // 门本身和动画
  vec3 q = p - vec3(4, -.77, .5);
  q.xz *= rot(-iAnimPrisonDoor * PI / 2.);
  float door = cuboid(q - vec3(0, .4, .5), vec3(.05, .99, .52));

  // 窗户上的条：
  p.x = pModInterval(p.x, .3, -10., 10.);  // 沿x重复
  p.z = abs(p.z);  // Z轴上的镜子
  float bars = cylinder(p.xzy - vec3(0, 2, .5), .01, 1.);  // 画一个酒吧
  float woodThings = min(cornerBox, door);
  updateSubMaterial(SUBMATERIAL_METAL, bars);
  updateSubMaterial(SUBMATERIAL_WOOD, woodThings);

  float nearest = min(bars, min(structure, woodThings));

  float gameObjects = MAX_DIST;

  if (iGOFlashlightVisible) {
    gameObjects = gameObjectFlashlight(ip - vec3(-42, 3, 11.2));
  }

  if (iGOKeyVisible) {
    gameObjects = min(gameObjects, gameObjectKey(ip.yzx - vec3(2., 7.4, -45.5)));
  }

  if (gameObjects < nearest) {
    updateSubMaterial(SUBMATERIAL_BRIGHT_RED, gameObjects);
    return gameObjects;
  }
  return nearest;
}

float submarine(vec3 p) {
  // 叮当响
  float bounds = length(p)-9.;
  if (bounds > 1.) {
    return bounds;
  }
  p.xz *= rot(-PI/4.);
  float dock = cuboid(p-vec3(-1.5,1,5), vec3(1,.2,3));
  p.y -= iSubmarineHeight;
  vec3 q = p.xzy - vec3(-2.,0,2.);
  float sub = smin(
    sphere(ELONGATE(p, vec3(6,0,0)), 1.7), //主体
    min(
      cylinder(ELONGATE(q, vec3(.5,0,0)), .4, .5), //顶部/潜望镜
      min(
        cuboid(p-vec3(7.5,0,0), vec3(0.3,2,.05)) - .05,
        cuboid(p-vec3(7.5,0,0), vec3(0.3,.05,2)) - .05
      )
    ),
    0.3
  );
  updateSubMaterial(SUBMATERIAL_DARK_RED, sub);
  return min(dock, sub);
  // 叮当声
}

float oilrig(vec3 p) {
  float bounds = length(p) - 13.;
  if (bounds > 3.) {
    return bounds;
  }

  vec3 absp = abs(p);  // 镜子
  vec3 q = vec3(absp.x, abs(p.y - 4.58), absp.z);  // X＆Z和Y的镜子，并翻译
  float yellow = lever(invZ(p.xzy - vec3(1.9, -1.5, .2)) * .5, min(1., (6. - iAnimOilrigInnerRamp) * .2)) / .5;
  float platforms =
      max(cuboid(vec3(p.x, abs(p.y - 3.5) - 3.5, p.z), vec3(6, .2, 6)) - .05,  // 平台（在y = 3.5左右镜像）
          max(-cube(p - vec3(2, 7, 2), 1.5),  // 上层平台的孔
              -cube(p - vec3(5.7, 0, 4), .52))  // 桥下平台的孔
      );

  vec3 u = p - vec3(5, 7.6, -2);
  u.xy *= rot(.3);  // 旋转控制台向播放器

  vec3 e = vec3(p.xy, abs(p.z + 2.));  // 镜像周围z = 2
  yellow = min(yellow,
      min(min(cylinder(e.xzy - vec3(-6, 1.1, 8.7), 1., 1.75),  // 坦克
              cylinder(e.xzy - vec3(-6.5, 1.1, 0), .2, 8.)),  // 管道从坦克到大海
          cylinder(vec3(p.z, abs(p.y - 7.6), p.x) - vec3(-3, .2, 0), .1, 5.)));  // 从控制台到坦克的管道

  float metal =
      min(min(min(cylinder(vec3(absp.xz, p.y) - vec3(5, 5, 0), .5, 8.3),  // 主平台缸
                  cylinder(q.zyx - vec3(5.3, 3.5, 0), .05, 5.3)),  // 防护轨
              max(cylinder(q - vec3(5.3, 3.5, 0), .05, 5.3),  // 防护轨
                  -cube(p - vec3(5, .7, 4), .8)  // 在桥将连接的后卫导轨上切一个孔
                  )),
          cuboid(u, vec3(.5, .6, 1.5)) - 0.05  // 安慰
      );

  updateSubMaterial(SUBMATERIAL_METAL, metal);

  vec3 r = p - vec3(2, 3.59, -.1);
  r.zy *= rot(-PI / 4.);
  r.y -= iAnimOilrigInnerRamp;
  yellow = min(yellow, cuboid(r, vec3(1, 5.1, .02)) - .05);  // 从下平台到上部的坡道
  updateSubMaterial(SUBMATERIAL_YELLOW, yellow);
  float result = min(min(platforms, yellow), metal);

  vec3 t = u - vec3(0, .8, 0);
  if (length(t) - 1. < 2.) {  // 车轮
    float wheel =
        min(min(torus(t, vec2(.5, .02)), cylinder(t.xzy + vec3(0, 0, .5), .02, .5)),  // 辐条的中央列
            cylinder(vec3(pModPolar2Rot(t.xz, 5., iAnimOilrigWheel), t.y).zyx - vec3(0, 0, .25), .01, .25));  // 辐条
    if (wheel < result) {
      updateSubMaterial(SUBMATERIAL_BRIGHT_RED, wheel);
      result = wheel;
    }
  }
  return result;
}

float oilrigBridge(vec3 p) {
  vec3 q = p.zyx - vec3(4, -1, 17);
  q.zy *= rot(-.19);
  q.z -= 19. - iAnimOilrigRamp;  // 0：略微伸出沙子，19与油钻机相连
  return min(bridge(q, 21., 0.), cylinder(q.xzy + vec3(0, 10.5, 6), 0.15, 5.));
}

float guardTower(vec3 ip) {
  vec3 p = ip - vec3(8.7, 9.3, 37);

  // 叮当响
  float bounds = length(p.xz) - 5.;
  if (bounds > 4.) {
    return bounds;
  }

  vec3 q = vec3(pModPolar2(p.xz, 6.), p.y).xzy;
  vec3 z = vec3(q.x, pModInterval(p.y, 1.5, -3., 7.), q.z);

  float structure = max(
      max(
        min(
          cylinder(p.xzy,1.1,12.),  //外缸
          max(
            opOnion(cylinder(p.xzy-vec3(0,0,14.),4.,2.), .2),  //顶部
            -cuboid(q-vec3(4.,14,0),vec3(1., 1., 2.))  //剪掉窗户
          )
        ),
        -min(
          cylinder(p.xzy,1.,13.),  //切下孔的中心（不使用Oponion，因为也想切断末端）
          cuboid(z-vec3(1.,0,0),vec3(.2, .3, .13)) //剪掉缝隙
        )
      ),
      -cuboid(p+vec3(0,7,1), vec3(.8,1.2,.8))  //切开门
  );

  vec3 l = vec3(p.x, p.y - iAnimElevatorHeight, p.z);

  float elevator = cylinder(l.xzy,1.,11.);  //电梯

  l.y = pModInterval(l.y, 1.5, -7., 7.);

  elevator = max(
    elevator,
    -torus(l,vec2(1.,.01))
  );

  vec3 k = vec3(p.x - .8, pModInterval(p.y-12.7, 20.5, -1., 0.), p.z +.9);

  float elevatorButton = sphere(k-vec3(0, .5, 0), .06);
  float buttonPost = min(
    cylinder(k.xzy, .05, .5),
    min(
      cuboid(k-vec3(0, .5, 0), vec3(.05,.1,.1)),
      elevatorButton
    )
  );
  updateSubMaterial(SUBMATERIAL_BRIGHT_RED, elevatorButton);
  updateSubMaterial(SUBMATERIAL_METAL, buttonPost);
  updateSubMaterial(SUBMATERIAL_YELLOW, elevator);

  float nearest = min(
    min(structure, min(buttonPost, elevator)),
    cuboid(p+vec3(0,10.3,3), vec3(1.1,2.,3.)) //底部升降机部分的平台
  );

  if (iGOFloppyDiskVisible) {
    float floppyNearest = gameObjectFloppy(ip - vec3(12.15, 22.31, 38.65));
    if (floppyNearest < nearest) {
      updateSubMaterial(SUBMATERIAL_BRIGHT_RED, floppyNearest);
      return floppyNearest;
    }
  }

  return nearest;
  // 叮当声
}

vec2 screenCoords;
float screen(vec3 p, vec3 screenPosition, vec2 size) {
  p -= screenPosition;
  float bounds = length(p) - 2.;
  if (bounds > .5)
    return bounds;
  p.xz *= rot(PI / 2.);
  screenCoords = (size - p.xy) / (size * 2.);
  float screen = cuboid(p, vec3(size.xy, 0.01));
  return screen;
}

float terrain(vec3 p) {
  vec3 d = abs(vec3(p.x, p.y + TERRAIN_OFFSET, p.z)) - vec3(TERRAIN_SIZE.x * .5, 0., TERRAIN_SIZE.z * .5);
  if (d.x < 0. && d.z < 0.) {
    d.y -= unpackFloat(textureLod(iHeightmap, p.xz / TERRAIN_SIZE.xz + .5, 0.)) * TERRAIN_SIZE.y;
  }
  return min(d.y, 0.0) + length(max(d, 0.0));
}

float nonTerrain(vec3 p) {
  float b = bridge(p - vec3(45, 1.7, 22.4), 10., 2.);
  float a = antenna(p - vec3(2, 10, 2));
  float m = monument(p - vec3(47.5, 3.5, 30.5));
  float pr = prison(p);
  vec3 oilrigCoords = p - vec3(26, 5, -58);
  oilrigCoords.xz *= rot(PI / 2. + 0.4);
  float o = oilrig(oilrigCoords);
  float ob = oilrigBridge(oilrigCoords);
  float aoc = antennaCable(oilrigCoords.zyx - vec3(-2, 9.7, 32.5));
  float guardTower = guardTower(p);
  float submarine = submarine(p - vec3(-46, -.5, -30));
  float structures = min(min(min(b, a), min(m, pr)), min(o, min(ob, min(guardTower, submarine))));

  if (aoc < structures) {
    updateSubMaterial(SUBMATERIAL_METAL, aoc);
    return aoc;
  }

  updateSubMaterial(SUBMATERIAL_CONCRETE, structures);
  return structures;
}

int material = MATERIAL_SKY;

float distanceToNearestSurface(vec3 p) {
  float t = terrain(p);
  if (t <= epsilon) {
    material = MATERIAL_TERRAIN;
    return t;
  }
  float n = nonTerrain(p);
  float s = screen(p, vec3(4.76, 14.42, 4), vec2(.45, .29));
  float sn = min(s, n);
  if (t < sn) {
    material = MATERIAL_TERRAIN;
    return t;
  }
  material = s <= n ? MATERIAL_SCREEN : MATERIAL_BUILDINGS;
  return sn;
}

vec3 computeNonTerrainNormal(vec3 p) {
  const vec2 S = vec2(0.001, 0);
  return normalize(vec3(nonTerrain(p + S.xyy), nonTerrain(p + S.yxy), nonTerrain(p + S.yyx)) - nonTerrain(p));
}

vec3 computeTerrainNormal(vec3 p, float dist) {
  vec2 S = vec2(mix(0.03, 0.001, min(dist / TERRAIN_SIZE.x, 1.)), 0);
  return normalize(vec3(terrain(p + S.xyy), terrain(p + S.yxy), terrain(p + S.yyx)) - terrain(p));
}

float rayTraceGround(vec3 p, vec3 dir) {
  float t = (-TERRAIN_OFFSET - p.y) / dir.y;
  return t >= 0. && t < HORIZON_DIST ? t : HORIZON_DIST;
}

float rayMarch(vec3 p, vec3 dir, float min_epsilon, float dist) {
  float result = HORIZON_DIST;
  float prevNear = min_epsilon;

  for (int i = 0;; i++) {
    vec3 hit = p + dir * dist;

    epsilon = min_epsilon * max(dist, 1.);

    if (hit.y <= UNDERGROUND_LEVEL || dist >= MAX_DIST) {
      float t = (-TERRAIN_OFFSET - p.y) / dir.y;
      if (t >= 0. && t < HORIZON_DIST) {
        material = MATERIAL_TERRAIN;
        return t;
      }
      break;  // 虚无...
    }

    if (hit.y > 45.) {
      break;  // 太高
    }

    float nearest = distanceToNearestSurface(hit);

    if (nearest < 0.) {
      dist -= prevNear;
      nearest = prevNear / 2.;
    }

    dist += nearest;

    if (nearest <= epsilon || i >= MAX_ITERATIONS) {
      return dist;
    }

    prevNear = nearest;
  }

  material = MATERIAL_SKY;
  return HORIZON_DIST;
}

#define SHADOW_ITERATIONS 50
float getShadow(vec3 p, float camDistance, vec3 n, float res) {
  float dist = clamp(camDistance * 0.005, 0.01, .1);  // 如果相机很远，则从表面开始

  p = p + n * dist;  // 通过正常 *跳出表面

  float maxHitY = iWaterLevel - epsilon * 2.;

  for (float i = 1.; i < float(SHADOW_ITERATIONS); i++) {
    vec3 hit = p + iSunDirection * dist;

    if (dist >= 80. || hit.y > 45. || hit.y < maxHitY || length(p) >= MAX_DIST) {
      break;  // 到目前为止什么都没有
    }

    float nearest = nonTerrain(hit);

    float shadowEpsilon = max(epsilon, 0.01 * min(1., dist) + i * (.01 / float(SHADOW_ITERATIONS)));
    if (nearest <= shadowEpsilon) {
      return 0.;  // 击中或内部。
    }

    res = min(res, 85. * nearest / dist);
    if (res < 0.078) {
      return 0.;  // 已经足够黑了。
    }

    dist += nearest + epsilon;
  }
  return res;
}

float rayTraceWater(vec3 p, vec3 dir) {
  float t = (iWaterLevel - p.y) / dir.y;
  return min(t >= 0. ? t : HORIZON_DIST, HORIZON_DIST);
}

// 灵感来自https://www.shadertoy.com/view/xl2xrw
vec3 waterFBM(vec2 p) {
  vec3 f = vec3(0);
  float tot = 0.;
  float a = 1.;

  float flow = 0.;
  float distToCameraRatio = (1. - length(iCameraPos.xz - p) / HORIZON_DIST);
  float octaves = 5. * distToCameraRatio * distToCameraRatio;
  for (float i = 0.; i < octaves; ++i) {
    p += iTime * .5;
    flow *= -.75;
    vec3 v = noiseDxy(p + sin(p.yx * .5 + iTime * .5) * .5);
    f += v * a;
    p += v.yz * .43;
    p *= 2.;
    tot += a;
    a *= .75;
  }
  return f / tot;
}

vec3 applyFog(vec3 rgb, float dist, vec3 rayDir) {
  float dRatio = min(dist / HORIZON_DIST, 1.);

  float fogAmount = clamp01(pow(dRatio, 3.5) + 1.0 - exp(-dist * 0.005));
  float sunAmount = max(dot(rayDir, iSunDirection), 0.0);
  vec3 fogColor = mix(COLOR_SKY, COLOR_SUN, pow(sunAmount, 10.0));
  return mix(rgb, fogColor, fogAmount);
}


// 此函数记录如何发现世界，并决定颜色的全过程
vec3 intersectWithWorld(vec3 p, vec3 dir) {
  vec4 packed = texelFetch(iPrerendered, ivec2(fragCoord * PRERENDERED_TEXTURE_SIZE / iResolution), 0);
  float unpacked = uintBitsToFloat(  // 查阅距离
      (uint(packed.x * 255.) << 24 | uint(packed.y * 255.) << 16 | uint(packed.z * 255.) << 8 | uint(packed.w * 255.)));

  float dist = rayMarch(p, dir, 0.001, unpacked);  // 询问距离
  float wdist = rayTraceWater(p, dir);  // 计算水面的交点

  vec3 color;
  vec3 normal = vec3(0, 1, 0);
  float mdist = dist;

  if (material == MATERIAL_SCREEN) {
    return iAnimAntennaRotation > 0. ? texture(iScreens, screenCoords).xyz : vec3(0);
  }

  vec3 hit = p + dir * dist;  // 计算撞到的三维坐标

  bool isWater = wdist < HORIZON_DIST && wdist < dist;  // 如果水面交点更近，那看到的就是水了
  vec3 waterColor;
  float waterOpacity = 0.;
  if (isWater) {
    waterOpacity = mix(0.2, 1., clamp01((dist - wdist) / TERRAIN_OFFSET));

    vec3 waterhit = p + dir * wdist;
    vec3 waterXYD = mix(vec3(0),
        waterFBM(waterhit.xz * (.7 - iWaterLevel * .02)) * (1. - length(waterhit) / (.9 * HORIZON_DIST)), waterOpacity);

    normal = normalize(vec3(waterXYD.y, 1., waterXYD.x));

    wdist -= abs(waterXYD.z) * waterOpacity * .6;
    mdist = wdist;

    waterColor = mix(vec3(.25, .52, .73), vec3(.15, .62, .83), clamp01(abs(waterXYD.z) - waterOpacity));
  }

  int mat = material;
  int submat = subMaterial;
  if (material == MATERIAL_SKY) {  // 天空
    color = COLOR_SKY;
  } else {  // 视线撞到了物体
    vec3 hitNormal;

    if (hit.y <= UNDERGROUND_LEVEL) {
      hitNormal = vec3(0, 1, 0);  // 撞到的是哪个方向（用于计算光线）
      color = vec3(1, 1, 1);
    } else {
      color = vec3(.8);

      switch (mat) {  // 从颜色盒里取颜色
        case MATERIAL_TERRAIN:
          hitNormal = computeTerrainNormal(hit, dist);

          color = mix(vec3(.93, .8, .64),
                      mix(vec3(.69 + texture(iNoise, hit.xz * 0.0001).x, .67, .65), vec3(.38, .52, .23),
                          dot(hitNormal, vec3(0, 1, 0))),
                      clamp01(hit.y * .5 - 1.)) +
              texture(iNoise, hit.xz * 0.15).x * 0.1 + texture(iNoise, hit.xz * 0.01).y * 0.1;
          ;
          break;
        case MATERIAL_BUILDINGS:
          hitNormal = computeNonTerrainNormal(hit);

          switch (submat) {
            case SUBMATERIAL_METAL: color = vec3(1); break;  // 额外的明亮
            case SUBMATERIAL_BRIGHT_RED: color = vec3(1, 0, 0); break;
            case SUBMATERIAL_DARK_RED: color = vec3(.5, 0, 0); break;
            case SUBMATERIAL_BLACK_PURPLE: color = vec3(.2, .1, .2); break;
            case SUBMATERIAL_YELLOW: color = vec3(1, .95, .8); break;
            case SUBMATERIAL_WOOD: color = .8 * vec3(.8, .6, .4); break;
            default:
              vec4 concrete = (texture(iNoise, hit.xy * .35) * hitNormal.z +
                  texture(iNoise, hit.yz * .35) * hitNormal.x + texture(iNoise, hit.xz * .35) * hitNormal.y - 0.5);
              color += 0.125 * (concrete.x - concrete.y + concrete.z - concrete.w);
              break;
          }
      }

      normal = normalize(mix(hitNormal, normal, waterOpacity));
    }
  }

  //+ 计算光照
  float specular = isWater || (mat == MATERIAL_BUILDINGS && submat > SUBMATERIAL_CONCRETE)
      ? pow(clamp01(dot(iSunDirection, reflect(dir, normal))), 50.)
      : 0.;

  float lambert1 = clamp01(dot(iSunDirection, normal));
  float lambert2 = clamp01(dot(iSunDirection * vec3(-1, 1, -1), normal));

  float lightIntensity = lambert1 + lambert2 * .15;
  if (mat == MATERIAL_TERRAIN) {
    lightIntensity = pow(lightIntensity * mix(.9, 1.02, lambert1 * lambert1), 1. + lambert1 * .6);
  }

  lightIntensity = mix(lightIntensity, lambert1, waterOpacity);

  float shadow = 1.;
  if (material != MATERIAL_SKY) {
    shadow = getShadow(p + dir * mdist, mdist, normal, 1.);
  }

  // 手电筒
  if (iFlashlightOn && dist < 20.) {
    float flashLightShadow = pow(clamp(dot(iCameraDir, dir), 0., 1.), 32.) * smoothstep(10., 0., dist);
    lightIntensity += flashLightShadow * max(dot(normal, -dir), 0.) * (1. - lightIntensity);
    shadow += flashLightShadow * (1. - shadow);
  }

  color = mix(color, waterColor, waterOpacity);
  color = (color * (COLOR_SUN * lightIntensity) + specular) * mix(0.38 + (1. - lightIntensity) * .2, 1., shadow);

  return applyFog(color, mdist, dir);
}

/**********************************************************************/
/* 碰撞着色器
/*******************************************************************************/

void main_c() {
  vec3 ray = vec3(0, 0, 1);
  ray.xz *= rot(fragCoord.x * (2. * PI / COLLISION_TEXTURE_SIZE) + PI);
  oColor = packFloat(.2 -
      distanceToNearestSurface(
          vec3(iCameraPos.x, iCameraPos.y + (fragCoord.y / (COLLISION_TEXTURE_SIZE * .5) - 1.) - .8, iCameraPos.z) +
          normalize(ray) * MIN_DIST));
}

/**********************************************************************/
/* Prerender着色器
/*******************************************************************************/

void main_p() {
  vec2 screen = fragCoord / (PRERENDERED_TEXTURE_SIZE * .5) - 1. + .5 / PRERENDERED_TEXTURE_SIZE;

  vec3 ray = normalize(iCameraMat3 * vec3(screen.x * -SCREEN_ASPECT_RATIO, screen.y, PROJECTION_LEN));

  float dist = rayMarch(iCameraPos, ray, 1.2 / PRERENDERED_TEXTURE_SIZE, MIN_DIST);

  uint packed = floatBitsToUint(dist >= MAX_DIST ? MAX_DIST : dist - epsilon);
  oColor = vec4(float((packed >> 24) & 0xffu) / 255., float((packed >> 16) & 0xffu) / 255.,
      float((packed >> 8) & 0xffu) / 255., float(packed & 0xffu) / 255.);
}

/**********************************************************************/
/* 主着色器
/*******************************************************************************/

// 主着色器
void main_m() {
  vec2 screen = fragCoord / (iResolution * .5) - 1.;

  vec3 ray = normalize(iCameraMat3 * vec3(screen.x * -SCREEN_ASPECT_RATIO, screen.y, PROJECTION_LEN));

  oColor = vec4(intersectWithWorld(iCameraPos, ray), 1);
}

/**********************************************************************/
/* 高度图着色器
/*******************************************************************************/

float heightmapCircle(vec2 coord, float centerX, float centerY, float radius, float smoothness) {
  vec2 dist = coord - vec2(centerX, centerY);
  return clamp01(1. - smoothstep(radius - (radius * smoothness), radius, dot(dist, dist) * 4.));
}


// main_heightmap 创造数字地图
void main_h() {
  vec2 coord = fragCoord / (iResolution * 0.5) - 1., size = vec2(1.3, 1.), derivative = vec2(0.);
  float heightA = 0., heightB = 1., persistence = 1., normalization = 0., octave = 1.;
  for (; octave < 11.;) {
    vec3 noisedxy = noiseDxy(21.1 + (coord * size) * rot(octave++ * 2.4));
    derivative += noisedxy.yz;
    heightA += persistence * (1. - noisedxy.x) / (1. + dot(derivative, derivative));
    heightB += persistence * (.5 - noisedxy.x);
    normalization += persistence;
    persistence *= 0.5;
    size *= 1.8;
  }
  heightA /= normalization;
  heightB *= .5;
  float tmask = (length((coord * (1.2 - heightB + heightA))) *
            clamp01(heightB + .55 - .5 * heightA * coord.x * (1. - coord.y * .5))),
        circles = heightmapCircle(coord, -.45, -.52, 1., 2.3) + heightmapCircle(coord, -.6, -.1, 1., 3.3) +
      heightmapCircle(coord, .6, -.7, 1., 5.) + heightmapCircle(coord, .84, .84, heightA, heightB * 5.);
  tmask = clamp01(1. - smin(tmask, 1. - mix(0., heightA * 2., circles), .05 + heightB * .5));
  vec2 distHV = 1. - abs(coord) + heightA * .04;
  tmask = smin(tmask, smin(distHV.x, distHV.y, 0.3) * 2., .1);
  oColor = packFloat(smin(heightA, tmask, 0.01) * 1.33 - .045);
}