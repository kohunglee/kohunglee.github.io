#include <GLUT/glut.h> // macOS 特有的 GLUT 头文件路径
#include <OpenGL/gl.h>  // OpenGL 头文件路径
#include <stdio.h>      // 用于 printf

// 全局变量，用于立方体的旋转角度
float angle = 0.0f;

// 顶点颜色数组 (R, G, B)
// 注意：每个面使用四边形 (GL_QUADS) 绘制，所以每个面需要4个顶点，每个顶点有颜色
GLfloat colors[6][3] = { // 6个面，每个面一个基础颜色
    {1.0, 0.0, 0.0}, // Red
    {0.0, 1.0, 0.0}, // Green
    {0.0, 0.0, 1.0}, // Blue
    {1.0, 1.0, 0.0}, // Yellow
    {0.0, 1.0, 1.0}, // Cyan
    {1.0, 0.0, 1.0}  // Magenta
};

// 立方体的顶点坐标
// 每组4个顶点定义一个面
GLfloat vertices[8][3] = {
    {-0.5, -0.5, -0.5}, // 0
    { 0.5, -0.5, -0.5}, // 1
    { 0.5,  0.5, -0.5}, // 2
    {-0.5,  0.5, -0.5}, // 3
    {-0.5, -0.5,  0.5}, // 4
    { 0.5, -0.5,  0.5}, // 5
    { 0.5,  0.5,  0.5}, // 6
    {-0.5,  0.5,  0.5}  // 7
};

// 定义立方体的六个面，每个面由4个顶点索引组成
// 顺序很重要，影响面的法线（背面剔除）和绘制顺序
GLint faces[6][4] = {
    {0, 3, 2, 1}, // Front face (note: faces are defined in counter-clockwise order for correct normal calc)
    {4, 5, 6, 7}, // Back face
    {0, 1, 5, 4}, // Bottom face
    {3, 7, 6, 2}, // Top face
    {0, 4, 7, 3}, // Left face
    {1, 2, 6, 5}  // Right face
};

// 绘制立方体的函数
void drawCube() {
    for (int i = 0; i < 6; i++) {
        glColor3fv(colors[i]); // 设置当前面的颜色
        glBegin(GL_QUADS);     // 开始绘制四边形
            for (int j = 0; j < 4; j++) {
                glVertex3fv(vertices[faces[i][j]]); // 使用索引绘制顶点
            }
        glEnd();               // 结束绘制
    }
}

// 渲染回调函数
void display() {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT); // 清除颜色和深度缓冲区
    glLoadIdentity(); // 重置模型视图矩阵

    // 设置相机位置
    // gluLookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ)
    gluLookAt(0.0, 0.0, 3.0,  // 摄像机位置 (Z轴方向，离原点3个单位)
              0.0, 0.0, 0.0,  // 观察点 (立方体中心)
              0.0, 1.0, 0.0); // 向上向量 (Y轴正方向)

    // 应用旋转变换
    glRotatef(angle, 1.0f, 1.0f, 0.0f); // 绕 (1,1,0) 向量旋转

    drawCube(); // 绘制立方体

    glutSwapBuffers(); // 交换缓冲区 (双缓冲，避免画面闪烁)
}

// 窗口大小改变时的回调函数
void reshape(int w, int h) {
    glViewport(0, 0, w, h); // 设置视口（绘制区域）
    glMatrixMode(GL_PROJECTION); // 切换到投影矩阵
    glLoadIdentity(); // 重置投影矩阵

    // 设置透视投影
    // gluPerspective(fovy, aspect, zNear, zFar)
    gluPerspective(45.0, (GLfloat)w / (GLfloat)h, 0.1, 100.0); // 45度视场角，宽高比，近裁剪面，远裁剪面

    glMatrixMode(GL_MODELVIEW); // 切换回模型视图矩阵
    glLoadIdentity(); // 重置模型视图矩阵
}

// 空闲时的回调函数，用于动画
void idle() {
    angle += 0.5f; // 每次空闲时旋转角度增加
    if (angle > 360.0f) {
        angle -= 360.0f; // 角度归零，避免溢出
    }
    glutPostRedisplay(); // 请求 GLUT 重新绘制窗口
}

// 初始化 OpenGL 设置
void initGL() {
    glClearColor(0.0f, 0.0f, 0.0f, 1.0f); // 设置背景颜色为黑色
    glEnable(GL_DEPTH_TEST); // 启用深度测试，使近处的物体遮挡远处的物体
    glShadeModel(GL_SMOOTH); // 启用平滑着色 (默认是 GL_FLAT)
}

int main(int argc, char** argv) {
    glutInit(&argc, argv); // 初始化 GLUT
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_DEPTH); // 双缓冲、RGB颜色、深度缓冲
    glutInitWindowSize(640, 480); // 设置窗口大小
    glutInitWindowPosition(100, 100); // 设置窗口位置
    glutCreateWindow("Rotating Cube - OpenGL (M1 Mac)"); // 创建窗口并设置标题

    initGL(); // 初始化 OpenGL

    glutDisplayFunc(display); // 注册显示回调函数
    glutReshapeFunc(reshape); // 注册窗口大小改变回调函数
    glutIdleFunc(idle);       // 注册空闲回调函数

    glutMainLoop(); // 进入 GLUT 事件循环

    return 0;
}