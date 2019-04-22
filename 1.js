function observe(data, cb) {
  Object.keys(data).forEach(key => defineReactive(data, key, data[key], cb))
}

function defineReactive(data, key, value, cb) {

  const dep = new Dep()

  Object.defineProperty(data, key, {
    enumerable: true, //可以使用 for...in、Object.keys() 进行枚举
    configurable: true, // 是否可以删除目标属性或是否可以再次修改属性的特性（writable, configurable, enumerable）
    get: () => {
      if (Dep.target) {
        dep.addSub(Dep.target)
      }
      // 获取属性值
      return value
    },
    set: newValue => {
      // 修改属性值，触发回调（渲染）
      value = newValue
      cb()
    }
  })
}

// 将_data中的属性代理到实例上
function _proxy(data) {
  Object.keys(data).forEach(key => {
    Object.defineProperty(this, key, {
      configurable: true,
      enumerable: true,
      get: function proxyGetter() {
        // 通过实例直接访问
        return this._data[key]
      },
      set: function proxySetter(newValue) {
        // 通过实例直接修改
        this._data[key] = newValue
      }
    })
  })
}

class Vue {
  constructor(options) {
    // 传入的data，被赋给_data， _data被绑定至 vue 实例上，通过 实例._data访问或修改data中的属性值
    this._data = options.data
    // 对实例上的_data中的所有属性，进行 “双向绑定”
    observe(this._data, options.render)
    // 直接通过实例访问_data中的属性，而不是间接访问（需通过_data）
    _proxy.call(this, options.data)

    // 创建订阅者，此订阅者被存储至依赖收集类上（注意不是实例上）
    let watcher = new Watcher(this, undefined, options.render, undefined)
  }
}

let app = new Vue({
  data: {
    text: 'text内容'
  },
  render() {
    console.log('渲染了')
  }
})

console.log(app)


// 首先明确一点，按照目前的实现来看，只要data中的属性都会被 “defineReactive”（双向绑定），但是这样会产生一个问题，未被使用的属性，在修改其值的时候，任然会触发“cb”（render）的调用（重新渲染视图），显然这并不是我们想要的，因此我们需要做到依赖收集，只有视图所需要的才会需要被 “defineReactive”（双向绑定）

// 收集到的订阅者集合
class Dep {
  constructor() {
    this.subs = []
  }

  addSub(sub: Watcher) {
    this.subs.push(sub)
  }

  removeSub(sub: Watcher) {
    remove(this.subs. sub)
  }
  
  // 通知
  notify() {
    const subs = this.subs.slice()
    const l = subs.length
    for(let i = 0; i < l; i++) {
      subs[i].update()
    }
  }
}

function remove(array, item) {
  if (array.length) {
    const index = array.indexOf(item)
    if (index > -1) return array.splice(index, 1)
  }
}

// 订阅者
class Watcher{
  constructor(vm, expOrFn, cb, options) {
    this.cb = cb
    this.vm = vm
    // 依赖收集类的target属性，为订阅者
    Dep.target = this
    // 订阅者被创建时，会主动触发渲染
    this.cb.call(this.vm)
  }

  update() {
    this.cb.call(this.vm)
  }

}