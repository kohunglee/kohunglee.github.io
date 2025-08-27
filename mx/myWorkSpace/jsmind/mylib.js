// 这是我自己写的辅助库

const mylib = {
    // obj 转化成 markdown 格式
    toMarkdown: function (jsMindData) {
        const lines = [];
        function traverse(node, level) {
            const prefix = "#".repeat(level);
            lines.push(`${prefix} ${node.topic || ""}`);
            if (node.children && node.children.length > 0) {
                for (const child of node.children) {
                    traverse(child, level + 1);
                }
            }
        }
        const root = jsMindData.data ? jsMindData.data : jsMindData;
        traverse(root, 1);
        return lines.join("\n");
    },

    // markdown 转化成 obj
    meta : { name: "jsMind-intro", author: "hizzgdev@163.com", version: "0.1" },
    toObj: function (mdText) {
        const meta = this.meta;
        function generateId() {  // 短随机ID
            return Math.random().toString(16).substr(2, 4);
        }
        const lines = mdText.split(/\r?\n/).filter(l => l.trim() !== "");  // 按行拆分
        const nodes = lines.map(line => {  // 解析每行，并生成 level, topic 等
            const match = line.match(/^(#+)\s*(.*)$/);
            if (!match) return null;
            return {
                level: match[1].length,
                topic: match[2].trim(),
                id: generateId(),
                expanded: true,
                children: []
            };
        }).filter(Boolean);
        const root = { id: "root", topic: nodes[0]?.topic || "思维导图", expanded: true, children: [] };
        const stack = [root]; // 栈用于追踪当前层级
        for (let i = 1; i < nodes.length; i++) {
            const node = nodes[i];
            while (stack.length > node.level) {  // 如果当前节点的级别 <= 栈顶，则回退到合适的父节点
                stack.pop();
            }
            stack[stack.length - 1].children.push(node);  // 将当前节点加到栈顶的 children
            stack.push(node);  // 压栈
        }
        return {
            meta,
            format: "node_tree",
            data: root
        };
    },

    // 统计汉字数量
    countChineseCharacters : function (text) {
        const chineseCharRegex = /[\u4e00-\u9fa5]/g;
        const chineseChars = text.match(chineseCharRegex);
        return chineseChars ? chineseChars.length : 0;
    },
}