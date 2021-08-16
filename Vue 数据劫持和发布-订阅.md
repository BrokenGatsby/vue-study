# Vue 数据劫持，订阅-发布模式源码流程

## 初始化执行

```javascript
function Vue (options) {
  
  this._init(options)
}

initMixin(Vue)
```

```javascript
// initMixin
function initMixin () {
  Vue.prototype._init = function () {
    const vm = this

    initState(vm) // 触发对数据进行“数据劫持”的设置

    if (vm.$options.el) {
      vm.$mount(vm.$options.el) // 触发了对 data 中数据的访问，进而触发订阅者的收集
    }
  }
}
```
```javascript
// initState
function initState (vm) {
	var opts = vm.$options
  if (opts.data) {
  	initData(vm) // 初始化 Vue 时，配置了 data 参数
  } else {
  	observe(vm._data = {}, true /* asRootData */) // 没有配置 data 参数，默认设置一个空对象
  }
}
```

```javascript
// initData
function initData (vm) {
  var data = vm.$options.data
  // 判断配置的 data 是否是 函数，函数的话执行 getData
  data = vm._data = typeof data === 'function'? getData(data, vm) : data || {};
  // 触发遍历 data 中的属性，设置 Object.defineProperty
  observe(data) 
}

// getData
function getData (data, vm) {
  data.call(vm, vm)
}
```

## Observe

```javascript
function observe () {
  var ob
  ob = new Observe()
  return ob
}

function Observe () {
  this.dep = new Dep()

	this.walk() // 触发 Object.defineProperty
}

Observe.prototype.walk = function (obj) {
  var keys = Object.keys(obj)
  for (var i = 0; i < keys.length; i++) {
  	defineReactive(obj, keys[i])
  }
}

function defineReactive (obj) {
	var dep = new Dep()
	Object.defineProperty(obj, key, {
		enumerable: true,
		configurable: true,
		get: function reactiveGetter () {
			if (Dep.target) {
				dep.depend() //通过订阅者收集中心，收集订阅者
			}
		},
		set: function reactiveSetter () {
			dep.notify() // 通过订阅者手机中心，发布更新
		}
	})
}

```

## Dep

```javascript
function Dep () {
	this.subs = [] // 订阅者存储
}

Dep.prototype.depend = function () {
	if (Dep.target) {
    Dep.target.addDep(this) // 将 订阅者收集中心实例传入 订阅者 的 addDep 方法中，在 订阅者 的 addDep 方法中，订阅者收集中心的 addSub 方法会被调用，同时 订阅者实例 将会作为参数进行传递，从而最终实现订阅者的收集
  }
}

Dep.prototype.addSub = function (sub) {
	this.subs.push(sub) // 将 订阅者 存储至 subs中
}

Dep.prototype.notify = function notify () {
	var subs = this.subs.slice()
  
  for (var i = 0; i < subs.length; i++) {
  	subs[i].update()
  }
}
```

在 Vue 初始化时，执行了 $mount 方法，进而触发了订阅者——Watcher的创建

```javascript
Vue.prototype.$mount = function () {
	return mountComponent(this)
}

var mount = Vue.prototype.$mount
Vue.prototype.$mount = function () {
  
  return mount.call(this)
}
```

```javascript
// mountComponent

function mountComponent (vm) {
  var updateComponent
  
  updateComponent = function () {
  	vm._update(vm._render(), hydrating)
  }
  // 创建 订阅者 实例
  new Watcher(vm, updateComponent)
}
```

## Watcher

```javascript
// Watcher

function Watcher (vm, expOrFn) {
  this.vm = vm
	
  this.getter = expOrFn // updateComponent
  
  this.get()
}

Watcher.prototype.get = function () {
  var vm = this.vm
	
  pushTarget(this) // 促使 Watcher 实例被存储至 Dep 的静态属性 target 上
  
  this.getter.call(vm) // 执行 updateComponent ，进而触发视图的更新与渲染，从而触发Object.defineProperty中的get，实现订阅者的收集
  
  popTarget()
}

Watcher.prototype.addDep = function (dep) {
	dep.addSub(this) // 将 订阅者实例 传入 订阅者收集中心的 addSub 方法中，并将 订阅者实力 作为参数进行传递，促使订阅者收集中心进行订阅者进行收集 
}

Watcher.prototype.update = function () {}

Dep.target = null
var targetStack = []
function pushTarget (target) {
  Dep.target = target // 订阅者实例存储至 Dep 的静态属性 target 上，用于判断 Watcher 实例时候创建成功
  targetStack.push(target)
}
function popTarget () {
  targetStack.pop();
  Dep.target = targetStack[targetStack.length - 1];
}
```

