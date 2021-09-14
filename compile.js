class Compile {
    constructor(el, vm) {
        this.$vm = vm
        // $el挂载的就是需要处理的DOM
        this.$el = document.querySelector(el)
        // 将真实的DOM元素拷贝一份作为文档片段，之后进行分析
        const fragment = this.node2Fragment(this.$el)
        // 解析文档片段
        this.compileNode(fragment)
        // 将文档片段加入到真实的DOM中去
        this.$el.appendChild(fragment)
    }
    // https://developer.mozilla.org/zh-CN/search?q=querySelector
    // https://developer.mozilla.org/zh-CN/docs/Web/API/Node node对象
    node2Fragment(el) {
        // 创建空白文档片段
        const fragment = document.createDocumentFragment()
        let child
        // appendChild会把原来的child给移动到新的文档中，当el.firstChild为空时，
        // while也会结束 a = undefined  => 返回 undefined

        // appendChild 该方法是移动dom，而不是复制dom，所以被appendChild()移动到fragment中的dom会从原本的el中消失，直到el为null，停止while循环

        // 打印出的text节点是空白文节点，因此比预期看上去的节点多

        while((child = el.firstChild)) {
            fragment.appendChild(child);
        }
        return fragment
    }
    // 通过迭代循环来找出{{}}中的内容，v-xxx与@xxx的内容，并且单独处理
    compileNode(node) {
        const nodes = node.childNodes;
        // 类数组的循环
        // Array.from() 浅拷贝
        Array.from(nodes).forEach(node => {
            if (this.isElement(node)) {
                this.compileElement(node)
            } else if (this.isInterpolation(node)) {
                this.compileText(node)
            }
            node.childNodes.length > 0 && this.compileNode(node)
        });
    }
    // https://developer.mozilla.org/zh-CN/docs/Web/API/Node  Node.nodeType

    // nodetype 1 元素 2 属性 3 文本

    isElement(node) {
        return node.nodeType === 1;
    } 
    // 校验是否是文本节点 并且是大括号中的内容
    isInterpolation(node) {
        return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
    }
    compileText(node) {
        const reg = /\{\{(.*?)\}\}/g
        const string = node.textContent.match(reg)
        // 取出大括号中的内容，并且处理
        // RegExp.$1是RegExp的一个属性,指的是与正则表达式匹配的第一个 子匹配(以括号为标志)字符串
        // 以此类推，RegExp.$2，RegExp.$3，..RegExp.$99总共可以有99个匹配
        this.text(node, RegExp.$1)
    }
    compileElement(node) {
        const nodeAttrs = node.attributes;  // 返回指定节点的所有属性 type  v-model 等
        Array.from(nodeAttrs).forEach(arr => {
            if (arr.name.indexOf('v-') > -1) {
                this[`${arr.name.substring(2)}`](node, arr.value)
            }
            if (arr.name.indexOf('@') > -1) {
                this.eventHandle(node, arr.name.substring(1), arr.value)
            }
        })
    }
    // 因为是大括号里面的内容，所以沿用之前的逻辑，都加上watcher
    text(node, key) {
        new Watcher(this.$vm, key, () => {
            node.textContent = this.$vm[key]
        })
        // 第一次初始化界面， 不然如果不进行赋值操作，
        // 就不会触发watcher里面的回调函数
        node.textContent = this.$vm[key]
    }
    html(node, key) {
        new Watcher(this.$vm, key, () => {
            node.innerHTML = this.$vm[key]
        })
        node.innerHTML = this.$vm[key]
        
    }
    // 对@xxx事件的处理
    eventHandle(node, eventName, methodName) {
        node.addEventListener(eventName, () => {
            this.$vm.$methods[methodName].call(this.$vm)
        })
    }
    // v-modal的处理 不仅仅当赋值的时候回触发watcher，并且为input添加事件
    // input中的值去修改this.$data.$xxx的值，实现双向绑定
    modal(node, key) {
        console.log(node.value)
        new Watcher(this.$vm, key, () => {
            node.value = this.$vm[key]
        })
        node.value = this.$vm[key]
        node.addEventListener('input', (e) => {
            this.$vm[key] = e.target.value
        })
    }
}