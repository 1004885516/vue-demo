class Vue {
    constructor(option) {
        this.$option = option;
        this.$data = option.data;
        this.$methods = option.methods;
        this.observer(this.$data);
        new Compile(option.el, this);
    }
    observer(obj) {
        if (!obj || typeof obj !== "object") {
            return;
        }
        Object.keys(obj).forEach(key => {
            this.definReactive(obj, key, obj[key]);
            this.proxyObj(key);
        })
    }
    definReactive(obj, key, value) {
        if (typeof value === 'object') {
            this.observer(value);
        }
        const dep = new Dep();
        Object.defineProperty(obj, key, {
            get() {
                Dep.target && dep.addDep(Dep.target);
                return value;
            },
            set(newValue) {
                if (newValue === value) {
                    return;
                }
                value = newValue;
                console.log(`${key}属性更新了: ${value}跟新了`);
                dep.notify();
            }
        });
    }
    proxyObj(key) {
        Object.defineProperty(this, key, {
            get() {
                console.log('proxyObj获取')
                return this.$data[key];
            },
            set(newVal) {
                console.log('proxyObj更新', newVal)
                this.$data[key] = newVal
            }
        })
        
    }
}

// Watcher 监听器
class Watcher {
    constructor(vm, key, cb) {
        this.vm = vm;
        this.key = key;
        this.cb = cb;
        // 将当前watcher实例指定到Dep静态属性target
        Dep.target = this;
        console.log('Dep.target---', Dep.target);
        this.vm[this.key]; // 触发getter，添加依赖
        Dep.target = null;
    }

    update() {
      // 执行new Watcher传递过来的回调函数，即data值改变时，需要执行的函数。
      this.cb.call(this.vm, this.vm[this.key]);
    }
}

// Dep：用来管理watcher
class Dep {
    constructor() {
        // 这里存放每个依赖的1个或多个watcher
        this.deps = [];
    }
    // 在deps中添加一个监听器对象
    addDep(dep) {
        this.deps.push(dep);
    }
    // 通知所有依赖去更新视图
    notify() {
        this.deps.forEach(dep => {
            dep.update()
        });
    }
}