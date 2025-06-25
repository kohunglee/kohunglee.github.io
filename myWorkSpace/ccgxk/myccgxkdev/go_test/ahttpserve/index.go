// 管家的大宅子
package main

import (
	// 导入管家需要的工具：网络服务(http)和书写(fmt)能力。
	"fmt"
	"net/http"
)

// 这位是“处理”先生，专门负责接待客人（请求 r），并给出回应（w）。
func handler(w http.ResponseWriter, r *http.Request) {
	// 他用笔(w)在纸上写下：“您好，我是您的 Go 管家！”
	fmt.Fprintf(w, "您好，我是您的 Go 管家！")
}

func main() {
	// 管家接到指令：如果有人在前门("/")呼叫，就请“处理”先生去接待。
	http.HandleFunc("/", handler)

	// 管家站在 8080 号门前，开始认真倾听，等待客人的到来。
	http.ListenAndServe(":8080", nil)
}