package main

import (
	"fyne.io/fyne/v2/app"    // 引入 Fyne 团队里的“项目经理”
	"fyne.io/fyne/v2/widget" // 引入 Fyne 团队里的“道具工匠”
)

func main() {
	// 1. 启动项目：项目经理 a 接到指令，准备开工！
	a := app.New()

	// 2. 设计舞台：项目经理指挥搭建一个名为“你好，舞台！”的窗户（舞台）。
	w := a.NewWindow("你好，舞台！")

	// 3. 制作道具：道具工匠被叫来，打造一个刻着“Hello World”字样的按钮。
	//    按钮被按下时会做什么？现在先让它什么都不做 `func() {}`。
	btn := widget.NewButton("Hello World 日本憨！", func() {})

	// 4. 布置场景：项目经理大手一挥，将这个按钮道具放置在舞台中央。
	w.SetContent(btn)

	// 5. 拉开帷幕：一切就绪！舞台灯光亮起，大戏开演，让观众看到这个窗口。
	w.ShowAndRun()
}