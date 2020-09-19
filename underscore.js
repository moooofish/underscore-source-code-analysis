//     Underscore.js 1.9.2
//     https://underscorejs.org
//     (c) 2009-2018 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

/* 

  Underscore.js 的作用: fn(data) => newData

  数组方法都可以通过 for 去实现

  集合 数组 对象 对 key-value 的数据结构操作

  对有限集合类数据结构，核心上是使用 for 循环

  函数 函数的再度封装

  工具


  我觉得对有限集合数据的处理只有三个最本质的逻辑: 过滤 迭代 添加

  set 和 get => 过滤 迭代 添加 => 最终结果


  方法分类:
  1. 集合方法
  2. 数组方法
  3. 函数方法
  4. 对象方法
  5. 工具方法
  6. 链式语法

*/
/* 
  

*/
(function () {
  // Baseline setup
  // --------------

  // Establish the root object, `window` (`self`) in the browser, `global`
  // on the server, or `this` in some virtual machines. We use `self`
  // instead of `window` for `WebWorker` support.
  /* 
    根据运行环境，确定根对象
    browser       window
    node          global
    WebWorker     self
    一些虚拟机器中  this
    默认为一个空对象
  */
  var root =
    (typeof self == 'object' && self.self === self && self) ||
    (typeof global == 'object' && global.global === global && global) ||
    this ||
    {};

  // Save the previous value of the `_` variable.
  // 主要用在浏览器中
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  /* 
    将数组、对象和 Symbol 的原型对象存入变量，用于下文使用:

    var push = ArrayProto.push

  */
  var ArrayProto = Array.prototype,
    ObjProto = Object.prototype;
  var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

  // Create quick reference variables for speed access to core prototypes.
  /* 
    将原型对象上的方法提前存到变量里，方便下文使用，
    节省顺着原型链查找方法的过程，提高性能
  */
  var push = ArrayProto.push,
    slice = ArrayProto.slice,
    toString = ObjProto.toString,
    hasOwnProperty = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  /* 
    提前声明下文中要用到的类方法
  */
  var nativeIsArray = Array.isArray,
    nativeKeys = Object.keys,
    nativeCreate = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  // 声明一个构造函数
  var Ctor = function () {};

  // Create a safe reference to the Underscore object for use below.
  /* 
    underscore 工具库有两种调用方式
    一种是函数式的调用风格
    _.map(list, v => v);

    另一种是面向对象式链式调用方式
    _(list).map(v => v);
  
    最后一种
    _chain(list).map(v => v)
  */
  var _ = function (obj) {
    /* 
      obj 为 new _() 的情况，直接返回该实例
    */
    if (obj instanceof _) return obj;
    /* 
      当开发者使用 _([]) 这样的模式，
    */
    if (!(this instanceof _)) return new _(obj);
    /* 
      其它情况下, 将 obj 参数赋值给 _wrapped 属性
    */
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for their old module API. If we're in
  // the browser, add `_` as a global object.
  // (`nodeType` is checked to ensure that `module`
  // and `exports` are not HTML elements.)
  /* 
    这是 UMD 规范。

    定义不同环境下的导出方式
    1.CommonJS 规范
    2.AMD 规范
    3.直接暴露到全局
  */
  if (typeof exports != 'undefined' && !exports.nodeType) {
    if (typeof module != 'undefined' && !module.nodeType && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  //

  /* 
    underscore 当前的版本号是 1.9.2

    const _ = require('underscore');
    console.log(_.VERSION); // 1.9.2
  */
  _.VERSION = '1.9.2';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  /* 
    内部方法，作用: 优化传入的迭代、断言函数

    1.关于 context
    我们平常使用数组方法时，这个 context 参数一般不常用，它到底能干嘛？
    以原生js 数组方法 map(callback, thisArg)
    const subjects = ["math", "Chinese", "English"];

    const result = subjects.map(
      function(value, index) {
        return this[index];
      },
      [1, 2, 3]
    );

    console.log(res); // [1, 2, 3]

    而 optimizeCb 里的方法就是 thisArg, map 方法里的 this 指向的值


  */
  var optimizeCb = function (func, context, argCount) {
    /* 
      绝大多数情况下，不传 context, 直接返回原原本本传入的函数。
      不会走下面的 switch 流控制语句

    */
    if (context === void 0) return func;
    /* 
      当 context 不为 undefined 时
    */
    switch (argCount == null ? 3 : argCount) {
      /* 
        用在 _.times 方法中
        _.times = function(n, iteratee, context) {
          var accum = Array(Math.max(0, n));
          iteratee = optimizeCb(iteratee, context, 1);
          for (var i = 0; i < n; i++) accum[i] = iteratee(i);
          return accum;
        };
        只有传入的第一个参数有用
      */
      case 1:
        return function (value) {
          return func.call(context, value);
        };
      // The 2-argument case is omitted because we’re not using it.

      /* 
        一般都是这种情况，像 map、filter等等
      
      */
      case 3:
        return function (value, index, collection) {
          return func.call(context, value, index, collection);
        };
      /* 
        
          用在 reduce 方法里
        */
      case 4:
        return function (accumulator, value, index, collection) {
          return func.call(context, accumulator, value, index, collection);
        };
    }
    /* 
    
      只单纯改变执行上下文
    
    */
    return function () {
      return func.apply(context, arguments);
    };
  };

  var builtinIteratee;

  // An internal function to generate callbacks that can be applied to each
  // element in a collection, returning the desired result — either `identity`,
  // an arbitrary callback, a property matcher, or a property accessor.
  var cb = function (value, context, argCount) {
    if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
    /* 
      _.identity = value => value
      若 value 为 null、undefined, 则返回一个函数
    */
    if (value == null) return _.identity;
    /* 
      通常情况下，如果是函数类型，丢给 optimizeCb 处理
    */
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    /* 
      若 value 是 Object 类型而不是 Array 类型
    */
    if (_.isObject(value) && !_.isArray(value)) return _.matcher(value);
    /* 
      如果传入的是字符串或数组
      适用于对象数组

      const books = [{name: 'qin'}, {name: 'ee'}];

      console.log(_.map(books, "name")); // ['qin', 'ee']

    */
    return _.property(value);
  };

  // External wrapper for our callback generator. Users may customize
  // `_.iteratee` if they want additional predicate/iteratee shorthand styles.
  // This abstraction hides the internal-only argCount argument.
  _.iteratee = builtinIteratee = function (value, context) {
    return cb(value, context, Infinity);
  };

  // Some functions take a variable number of arguments, or a few expected
  // arguments at the beginning and then a variable number of values to operate
  // on. This helper accumulates all remaining arguments past the function’s
  // argument length (or an explicit `startIndex`), into an array that becomes
  // the last argument. Similar to ES6’s "rest parameter".
  var restArguments = function (func, startIndex) {
    /* 
      func.length 即为函数参数的个数
    */
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    /* 
      返回一个函数
    */
    return function () {
      var length = Math.max(arguments.length - startIndex, 0),
        /* 
        剩余参数组成一个数组
      */
        rest = Array(length),
        index = 0;
      for (; index < length; index++) {
        rest[index] = arguments[index + startIndex];
      }
      switch (startIndex) {
        case 0:
          return func.call(this, rest);
        case 1:
          return func.call(this, arguments[0], rest);
        case 2:
          return func.call(this, arguments[0], arguments[1], rest);
      }

      var args = Array(startIndex + 1);
      for (index = 0; index < startIndex; index++) {
        args[index] = arguments[index];
      }
      args[startIndex] = rest;
      return func.apply(this, args);
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function (prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor();
    Ctor.prototype = null;
    return result;
  };

  /* 
    利用闭包，返回获取对象某个属性值的函数

    用于获取一层对象的属性值，
    const person = { name: 'qin', age: 25 }
  */
  var shallowProperty = function (key) {
    return function (obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  /* 
    查看某个实例对象上的实例属性是否存在
  */
  var has = function (obj, path) {
    return obj != null && hasOwnProperty.call(obj, path);
  };

  /* 
    deepGet 方法要求 path 参数为数组类型
    
    相比 lodash, 兼容性一般般
  */
  var deepGet = function (obj, path) {
    var length = path.length;
    for (var i = 0; i < length; i++) {
      if (obj == null) return void 0;
      obj = obj[path[i]];
    }
    return length ? obj : void 0;
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object.
  // Related: https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = shallowProperty('length');
  /* 
    类数组判断条件:
    1.存在 length 属性;
    2.值为 number 类型，大于等于0， 小于机器允许的最大数组索引

    类数组:
    const arrayLike = {
      0: '1',
      1: '2',
      2: '3',
      length: 3
    }

  */
  var isArrayLike = function (collection) {
    var length = getLength(collection);
    return (
      typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX
    );
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  /* 
    我将其称为原子方法。扩展原生 forEach 方法。
    可遍历集合、数组和普通对象

    结合下文可以总结出: 有限集合迭代、过滤、添加的本质是 for 循环结构的灵活运用
  */
  _.each = _.forEach = function (obj, iteratee, context) {
    /* 
      不传 context 参数
      optimizeCb(iteratee, context) => iteratee
    */
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    /*
      处理类数组、数组的情况
    */
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      /*
        处理对象的情况
      */
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    /* 
      返回的 obj 是经过 iteratee 迭代操作后的原 obj,引用地址未变
    */
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  /* 
    与 _.each 区别在于，_.map 的返回值是一个全新的对象

  */
  _.map = _.collect = function (obj, iteratee, context) {
    /*
      map 方法首次用到了 cb 这个内部函数


      
    */
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length,
      results = Array(length);
    /* 
      此处的 for 循环是 _.map 方法 核心
      为 Array、Set, 那么 result = array[index]
      为 Object, 那么 result = object[key]
    */
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  var createReduce = function (dir) {
    // Wrap code that reassigns argument variables in a separate function than
    // the one that accesses `arguments.length` to avoid a perf hit. (#1991)
    var reducer = function (obj, iteratee, memo, initial) {
      var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        index = dir > 0 ? 0 : length - 1;
      if (!initial) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    };

    return function (obj, iteratee, memo, context) {
      var initial = arguments.length >= 3;
      return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
    };
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.

  /* 
    返回第一个通过 predicate 迭代函数真值检测的元素值
  */
  _.find = _.detect = function (obj, predicate, context) {
    /* 
      obj 为集合、数组或普通对象
    */
    var keyFinder = isArrayLike(obj) ? _.findIndex : _.findKey;
    var key = keyFinder(obj, predicate, context);
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.

  /* 
    _.filterKey = _.select = function(obj, predicate, context) {
      var results = [];
      predicate = cb(predicate, context);

      _.each(obj, function(value, index, list) {
        if (predicate(value, index, list)) results.push(key);
      });
      return results;
    }; 
  */

  /* 
    filter 与 reject 是一对相反的方法
  */
  _.filter = _.select = function (obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    /* 
      通过 for 循环，以新数组形式返回断言函数为真的元素
    
    */
    _.each(obj, function (value, index, list) {
      /* 
        符合要求，就将值 push 到新数组中
      */
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  /* 
    以新数组形式返回断言函数为假的元素
  */
  _.reject = function (obj, predicate, context) {
    /* 
      _.negate = function(predicate) {
        return function() {
          return !predicate.apply(this, arguments);
        };
      };
    
    */
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  /* 
    全为真的测试，只要存在一项通过断言函数为假，直接返回假
  */
  _.every = _.all = function (obj, predicate, context) {
    predicate = cb(predicate, context);
    // obj 参数要么为集合、数组或普通对象
    var keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length;

    /* 
      for 循环是同步阻塞式的
    */
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      // 从这里看是对其值的处理
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  /* 
    方法测试数组中是不是至少有 1 个元素通过了被提供的函数测试。
    它返回的是一个 Boolean 类型的值。
  */
  _.some = _.any = function (obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  /* 
    等同于原生 javascript 的 includes()
    只能找到基本数据类型，string，boolean, number

  */
  _.contains = _.includes = _.include = function (obj, item, fromIndex, guard) {
    // obj 若为对象类型，获取对象的属性值组成的组数
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;

    /* 
      NaN 无法判断
    */
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = restArguments(function (obj, path, args) {
    var contextPath, func;
    if (_.isFunction(path)) {
      func = path;
    } else if (_.isArray(path)) {
      contextPath = path.slice(0, -1);
      path = path[path.length - 1];
    }
    return _.map(obj, function (context) {
      var method = func;
      if (!method) {
        if (contextPath && contextPath.length) {
          context = deepGet(context, contextPath);
        }
        if (context == null) return void 0;
        method = context[path];
      }
      return method == null ? method : method.apply(context, args);
    });
  });

  // Convenience version of a common use case of `map`: fetching a property.
  /* 
    以为数组的形式返回对象数组中指定某种属性值，不能萃取多个
  */
  _.pluck = function (obj, key) {
    /* 
      key 可以是字符串或者数组
    */
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  /* 
    我理解为它用来过滤对象数组
  */
  _.where = function (obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  /* 
    返回对象数组中被过滤掉的那个对象
  */
  _.findWhere = function (obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function (obj, iteratee, context) {
    var result = -Infinity,
      lastComputed = -Infinity,
      value,
      computed;
    if (
      iteratee == null ||
      (typeof iteratee == 'number' && typeof obj[0] != 'object' && obj != null)
    ) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value != null && value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function (v, index, list) {
        computed = iteratee(v, index, list);
        if (
          computed > lastComputed ||
          (computed === -Infinity && result === -Infinity)
        ) {
          result = v;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function (obj, iteratee, context) {
    var result = Infinity,
      lastComputed = Infinity,
      value,
      computed;
    if (
      iteratee == null ||
      (typeof iteratee == 'number' && typeof obj[0] != 'object' && obj != null)
    ) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value != null && value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function (v, index, list) {
        computed = iteratee(v, index, list);
        if (
          computed < lastComputed ||
          (computed === Infinity && result === Infinity)
        ) {
          result = v;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection.
  /* 
    数组乱序方法

    const arrayOrder = array => array.sort(() => Math.random() - 1))

  */
  _.shuffle = function (obj) {
    return _.sample(obj, Infinity);
  };

  // Sample **n** random values from a collection using the modern version of the
  // [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  /* 
    从 list 中产生一个随机样本。传递一个数字表示从list中返回n个随机元素。否则将返回一个单一的随机项。
  
  */
  _.sample = function (obj, n, guard) {
    /* 
      如果没有传 n, 最后调用 _.random 方法返回随机的一个数
    */
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    // 对普通对象、数组
    var sample = isArrayLike(obj) ? _.clone(obj) : _.values(obj);
    var length = getLength(sample);
    n = Math.max(Math.min(n, length), 0);
    var last = length - 1;
    for (var index = 0; index < n; index++) {
      /* 
        拿前 n 个值填补空位
      */
      var rand = _.random(index, last);
      var temp = sample[index];
      sample[index] = sample[rand];
      sample[rand] = temp;
    }
    return sample.slice(0, n);
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function (obj, iteratee, context) {
    var index = 0;
    iteratee = cb(iteratee, context);
    return _.pluck(
      _.map(obj, function (value, key, list) {
        return {
          value: value,
          index: index++,
          criteria: iteratee(value, key, list)
        };
      }).sort(function (left, right) {
        var a = left.criteria;
        var b = right.criteria;
        if (a !== b) {
          if (a > b || a === void 0) return 1;
          if (a < b || b === void 0) return -1;
        }
        return left.index - right.index;
      }),
      'value'
    );
  };

  // An internal function used for aggregate "group by" operations.
  /* 
    作为一个内部函数，所起的作用取决于传的参数
  */
  var group = function (behavior, partition) {
    return function (obj, iteratee, context) {
      var result = partition ? [[], []] : {};
      iteratee = cb(iteratee, context);
      _.each(obj, function (value, index) {
        /* 
          迭代函数的返回值作为 key
        */
        var key = iteratee(value, index, obj);
        /* 

        */
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  /* 
    由传的 iteratee 方法决定对象的 key, key 的值是 Array 类型
  */
  _.groupBy = group(function (result, value, key) {
    if (has(result, key)) result[key].push(value);
    else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  /* 
    主要用于对象数组
  */
  _.indexBy = group(function (result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  /*  
    常用来统计集合里元素的个数
    For example:
    const words = ['a', 'b', 'a', 'c'];
    const ret = _.countBy(words, item => item);

    console.log('ret =', ret); // { a: 2, b: 1, c: 1 }
  */
  _.countBy = group(function (result, value, key) {
    if (has(result, key)) result[key]++;
    else result[key] = 1;
  });

  var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
  // Safely create a real, live array from anything iterable.
  /* 
      数组转换方法
    */
  _.toArray = function (obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (_.isString(obj)) {
      // Keep surrogate pair characters together
      return obj.match(reStrSymbol);
    }
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  /* 
    返回集合、数组的长度或对象的 key 的个数

    数组或类数组 => array.length
    对象 => keys(object).length
  */
  _.size = function (obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = group(function (result, value, pass) {
    result[pass ? 0 : 1].push(value);
  }, true);

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  /* 
    first、initial、last 和 rest 四个方法本质上是 slice 方法的灵活运用
    first() === slice(0,1) || array[0]
    initial === slice(1)
    last() === slice(array.length - 1)
    rest() === slice(1)
  */
  /* 
    返回数组的第一项， 传递参数 n, 则返回从第一个元素开始的 n 个元素
  */
  _.first = _.head = _.take = function (array, n, guard) {
    if (array == null || array.length < 1) return n == null ? void 0 : [];
    if (n == null || guard) return array[0];

    // 传递参数 n, 则返回从第一个元素开始的 n 个元素
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  /* 
    返回传入的 array 参数除最后一个元素外的其它全部元素
  */
  _.initial = function (array, n, guard) {
    return slice.call(
      array,
      0,
      Math.max(0, array.length - (n == null || guard ? 1 : n))
    );
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  /* 
    返回 array 中最后一个元素，传递 n 参数将返回数组中从最后一个元素开始的 n 个
  */
  _.last = function (array, n, guard) {
    if (array == null || array.length < 1) return n == null ? void 0 : [];
    if (n == null || guard) return array[array.length - 1];

    // 传递 n 参数将返回数组中从最后一个元素开始的 n 个
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  /* 
    返回余下的数
  */
  _.rest = _.tail = _.drop = function (array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  /* 
    以新数组形式返回过滤出为元素经过 Boolean 转换为 true 的元素
    false、null、0、''、undefined、NaN
  */
  _.compact = function (array) {
    /* 
      ['1', '2', '3'].map(value => parseInt(value)) // [1, 2, 3]
      ['1', '2', '3'].map(parseInt) // [1, NaN, NaN]
    */
    return _.filter(array, Boolean);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function (input, shallow, strict, output) {
    // 一般不会传 output 参数，默认空数组 []
    output = output || [];
    var idx = output.length;
    for (var i = 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        // Flatten current level of array or arguments object.
        if (shallow) {
          var j = 0,
            len = value.length;
          while (j < len) output[idx++] = value[j++];
        } else {
          flatten(value, shallow, strict, output);
          idx = output.length;
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    // 返回空数组
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  // 数组扁平化，如果传递 shallow 参数，数组将只减少一维的嵌套

  /* 
    _.flatten([1, [2], [3, [[4]]]]) => [1, 2, 3, 4];

    _.flatten([1, [2], [3, [[4]]]], true) => [1, 2, 3, [[4]]];
  */
  _.flatten = function (array, shallow) {
    return flatten(array, shallow, false);
  };

  /* 
    without 表示根据给定的 value 参数，过滤传入的 array 数组参数
    本质上仍然属于过滤这一大操作。可以用如下的方式实现

    const without = function(array, ...value) {
      const len = value.length;
      let result = array;
      while(--len > 0) {
        if (array.includes(value[len])) {
          result = result.filter(item => item !== value[len])
        }
      } 
      return result;
    }
  
  */
  // Return a version of the array that does not contain the specified value(s).
  _.without = restArguments(function (array, otherArrays) {
    return _.difference(array, otherArrays);
  });

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // The faster algorithm will not work with an iteratee if the iteratee
  // is not a one-to-one function, so providing an iteratee will disable
  // the faster algorithm.
  // Aliased as `unique`.
  /* 
    数组去重， 可以用 new Set() 数据结构来做
  */
  _.uniq = _.unique = function (array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
        computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted && !iteratee) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = restArguments(function (arrays) {
    return _.uniq(flatten(arrays, true, true));
  });

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  /* 
    集合、数组的交集， 与对象的 merge 本质上是一样的
    返回传入 arrays 数组交集

    _.intersection([1, 2, 4], [1, 2], [1]); // [1]
    _.intersection([1, 2, 4, 1]); // [1, 2, 4]
  */
  _.intersection = function (array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      /* 
        用传入的第一个数组的每一项与剩下的数组做是否存在的操作，
      */
      var item = array[i];
      // 第一个数组里是否有重复部分
      if (_.contains(result, item)) continue;
      var j;
      for (j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      // 当剩下的数组里都存在这个值时，就把这个值 push 到结果数组中
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = restArguments(function (array, rest) {
    rest = flatten(rest, true, true);
    return _.filter(array, function (value) {
      return !_.contains(rest, value);
    });
  });

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices.
  _.unzip = function (array) {
    var length = (array && _.max(array, getLength).length) || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = restArguments(_.unzip);

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values. Passing by pairs is the reverse of _.pairs.

  /* 
    将二维数组转为对象形式， 
    _.object([['a', 1], ['b', 2]]); // { a: 1, b: 2 }

    原生 JS 对象增加了 Object.fromEntries 方法，
  */

  _.object = function (list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions.
  /* 
    内部函数，用来返回断言函数为真的索引
    dir 的值为 1 或 -1
  */
  var createPredicateIndexFinder = function (dir) {
    return function (array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  };

  // Returns the first index on an array-like that passes a predicate test.
  /* 
    从左往右找
  */
  _.findIndex = createPredicateIndexFinder(1);
  /* 
    从右往左找
  */
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function (array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0,
      high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1;
      else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions.
  var createIndexFinder = function (dir, predicateFind, sortedIndex) {
    return function (array, item, idx) {
      var i = 0,
        length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
          i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
          length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (
        idx = dir > 0 ? i : length - 1;
        idx >= 0 && idx < length;
        idx += dir
      ) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](https://docs.python.org/library/functions.html#range).
  _.range = function (start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    if (!step) {
      step = stop < start ? -1 : 1;
    }

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Chunk a single array into multiple arrays, each containing `count` or fewer
  // items.
  _.chunk = function (array, count) {
    if (count == null || count < 1) return [];
    var result = [];
    var i = 0,
      length = array.length;
    while (i < length) {
      result.push(slice.call(array, i, (i += count)));
    }
    return result;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments.
  var executeBound = function (
    sourceFunc,
    boundFunc,
    context,
    callingContext,
    args
  ) {
    if (!(callingContext instanceof boundFunc))
      return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = restArguments(function (func, context, args) {
    if (!_.isFunction(func))
      throw new TypeError('Bind must be called on a function');
    var bound = restArguments(function (callArgs) {
      return executeBound(func, bound, context, this, args.concat(callArgs));
    });
    return bound;
  });

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder by default, allowing any combination of arguments to be
  // pre-filled. Set `_.partial.placeholder` for a custom placeholder argument.
  _.partial = restArguments(function (func, boundArgs) {
    var placeholder = _.partial.placeholder;
    var bound = function () {
      var position = 0,
        length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] =
          boundArgs[i] === placeholder ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  });

  _.partial.placeholder = _;

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = restArguments(function (obj, keys) {
    keys = flatten(keys, false, false);
    var index = keys.length;
    if (index < 1) throw new Error('bindAll must be passed function names');
    while (index--) {
      var key = keys[index];
      obj[key] = _.bind(obj[key], obj);
    }
  });

  // Memoize an expensive function by storing its results.
  /* 
    memoize 方法可以缓存某函数的计算结果， 返回的是一个函数，
    传入 key,可以获取属性值
  */
  _.memoize = function (func, hasher) {
    var memoize = function (key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  /* 
    延迟函数，其实就是 setTimeout 的运用，我认为没什么作用
    timer = setTimeout(() => {}, timeout)
  */
  _.delay = restArguments(function (func, wait, args) {
    return setTimeout(function () {
      return func.apply(null, args);
    }, wait);
  });

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function (func, wait, options) {
    var timeout, context, args, result;
    var previous = 0;
    if (!options) options = {};

    var later = function () {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };

    var throttled = function () {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };

    throttled.cancel = function () {
      clearTimeout(timeout);
      previous = 0;
      timeout = context = args = null;
    };

    return throttled;
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  /* 
    函数防抖

    const debounce = function(fn, wait, immediate) {
        let timer, result;

        const debounced = function() {
          if (immediate) {
            let callNow = !timer;
            if (timer) {
              clearTimeout(timer);
            }
            if (callNow) {
              result = fn.apply(this, [...arguments]);
            }
          }

          if (timer) {
            clearTimeout(timer);
          }
          timer = setTimeout(function() {
            fn.apply(this, [...arguments]);
          }, wait);

          return result;
        };

        return debounced;
      };

  */
  _.debounce = function (func, wait, immediate) {
    var timeout, result;

    var later = function (context, args) {
      timeout = null;
      if (args) result = func.apply(context, args);
    };

    var debounced = restArguments(function (args) {
      if (timeout) clearTimeout(timeout);
      if (immediate) {
        var callNow = !timeout;
        timeout = setTimeout(later, wait);
        if (callNow) result = func.apply(this, args);
      } else {
        timeout = _.delay(later, wait, this, args);
      }

      return result;
    });

    debounced.cancel = function () {
      clearTimeout(timeout);
      timeout = null;
    };

    return debounced;
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function (func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  /* 
    返回断言函数的互斥函数
    predicate 是断言函数，
    传递一个函数，返回传递函数的反值
  */
  _.negate = function (predicate) {
    return function () {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  /* 
    这个函数非常有用，与函数科里化有关
    它是一个从右往左的过程

  */
  _.compose = function () {
    var args = arguments;
    var start = args.length - 1;
    return function () {
      var i = start;
      /* 
        上一个函数的返回值是下一个函数的参数
      */
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  /* 
    返回一个函数，允许调用 n 次
  */
  _.after = function (times, func) {
    return function () {
      /* 
        当 times 为 1 时，程序执行不走 if 判断逻辑
      */
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function (times, func) {
    var memo;
    return function () {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  _.restArguments = restArguments;

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{ toString: null }.propertyIsEnumerable('toString');
  var nonEnumerableProps = [
    'valueOf',
    'isPrototypeOf',
    'toString',
    'propertyIsEnumerable',
    'hasOwnProperty',
    'toLocaleString'
  ];

  var collectNonEnumProps = function (obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto =
      (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  };

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`.
  _.keys = function (obj) {
    // 非对象，直接返回空数组
    if (!_.isObject(obj)) return [];
    // 执行环境里存在 Object.keys 方法， 返回 Object.keys(obj);
    if (nativeKeys) return nativeKeys(obj);
    /* 
      for in 和 Object.prototype.hasOwnProperty 集合获取对象的 key
      Object.prototype.hasOwnProperty 用来获取实例上的属性
    */
    var keys = [];
    for (var key in obj) if (has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  /* 
    for...in 可以遍历原型链上的所有属性
  */
  _.allKeys = function (obj) {
    //
    if (!_.isObject(obj)) return [];
    // 必须是普通对象
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  /* 
    等同于 Object.values()

  */
  _.values = function (obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    /* 
      for 循环是核心
    */
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object.
  // In contrast to _.map it returns an object.

  /* 
    等同上面的 _.map 方法
  
  */
  _.mapObject = function (obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = _.keys(obj),
      length = keys.length,
      results = {};
    for (var index = 0; index < length; index++) {
      var currentKey = keys[index];
      results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  // The opposite of _.object.
  /* 
    把一个对象转变为一个[key, value]形式的数组,其结果是一个二维数组

    _.pairs(obj) => [...[key, value]]

    相当于原生 JS 里的 Object.entries 方法
  */
  _.pairs = function (obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  /* 
    _.invert({'name': 'qin', 'age': 26}); // { 'qin':'name', '26': 'age' }
    我认为此方法实用性不高，并且要求 value 唯一且能转为字符串
  */
  _.invert = function (obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      // 等同于 result[value] = key
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`.
  /* 
    返回一个对象里所有的方法名, 而且是已经排序的

    _.functions = _.filterKey(obj, value => _.isFunction(value))
  */
  _.functions = _.methods = function (obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // An internal function for creating assigner functions.
  /* 

  _.extend(obj, {}) => obj
  */
  var createAssigner = function (keysFunc, defaults) {
    return function (obj) {
      var length = arguments.length;
      if (defaults) obj = Object(obj);
      /* 
        _.extend(obj) => obj 直接返回该 obj
      */
      if (length < 2 || obj == null) return obj;
      /* 
      
        [...argument] === [{},{},{}...]
      */
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
          keys = keysFunc(source),
          l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!defaults || obj[key] === void 0) obj[key] = source[key];
        }
      }
      /* 
        返回 merge 后的 obj
      
      */
      return obj;
    };
  };

  // Extend a given object with all the properties in passed-in object(s).
  /* 
    通过浅拷贝的方式 merge 所有可遍历的属性(包括原型链上)
  */
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s).
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  /* 
    通过浅拷贝的方式 merge 所有可遍历的属性
  */
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test.
  /* 
    通过断言函数返回值返回指定 key
  */

  _.findKey = function (obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj),
      key;
    /* 
        依旧通过 for 循环找出指定的 key
      */
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Internal pick helper function to determine if `obj` has key `key`.
  /* 
    in 操作符可以顺着原型链查找对象的某个属性是否存在。
    是一个内部方法
  */
  var keyInObj = function (value, key, obj) {
    return key in obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  /* 

    对对象的 key 进行过滤

  */
  _.pick = restArguments(function (obj, keys) {
    var result = {},
      iteratee = keys[0];
    if (obj == null) return result;
    /* 
      可以是函数或者字符串
    */
    if (_.isFunction(iteratee)) {
      if (keys.length > 1) iteratee = optimizeCb(iteratee, keys[1]);
      keys = _.allKeys(obj);
    } else {
      iteratee = keyInObj;
      keys = flatten(keys, false, false);
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  });

  // Return a copy of the object without the blacklisted properties.

  /* 
    返回一个object副本，只过滤出除去keys(有效的键组成的数组)参数指定的属性值。 或者接受一个判断函数，指定忽略哪个key。
  
    可以传字符串或函数
  */
  _.omit = restArguments(function (obj, keys) {
    var iteratee = keys[0],
      context;
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
      if (keys.length > 1) context = keys[1];
    } else {
      keys = _.map(flatten(keys, false, false), String);
      iteratee = function (value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  });

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function (prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  /* 
    浅拷贝
  */
  _.clone = function (obj) {
    if (!_.isObject(obj)) return obj;
    /* 
      obj 是数组类型就用 slice() 拷贝
      若为对象类型，就用 _.extend() 拷贝
    */
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  /* 
    这不就是一个普通的回调函数吗？
  */
  _.tap = function (obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  /* 
    判断一个对象有没有给定的 key: value 键值对
  */
  _.isMatch = function (object, attrs) {
    var keys = _.keys(attrs),
      length = keys.length;
    /* 
      object 为 null、undefined 时，直接返回 false
    */
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq, deepEq;
  eq = function (a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](https://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // `null` or `undefined` only equal to itself (strict comparison).
    if (a == null || b == null) return false;
    // `NaN`s are equivalent, but non-reflexive.
    if (a !== a) return b !== b;
    // Exhaust primitive checks
    var type = typeof a;
    if (type !== 'function' && type !== 'object' && typeof b != 'object')
      return false;
    return deepEq(a, b, aStack, bStack);
  };

  // Internal recursive comparison function for `isEqual`.
  deepEq = function (a, b, aStack, bStack) {
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN.
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
      case '[object Symbol]':
        return SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b);
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor,
        bCtor = b.constructor;
      if (
        aCtor !== bCtor &&
        !(
          _.isFunction(aCtor) &&
          aCtor instanceof aCtor &&
          _.isFunction(bCtor) &&
          bCtor instanceof bCtor
        ) &&
        'constructor' in a &&
        'constructor' in b
      ) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a),
        key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  /* 
    判断相等的方法很重要， 基本上所有的数据类型都可以判断
  */
  _.isEqual = function (a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  /* 
    空对象即为自己没有可遍历的对象
    可以用来判断数组、对象、类数组、字符串为空
  */
  _.isEmpty = function (obj) {
    if (obj == null) return true;
    if (
      isArrayLike(obj) &&
      (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))
    )
      return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  // 判断 DOM 元素对象， 实用性不高
  _.isElement = function (obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  /* 
    判断一个对象是不是数组
  */
  _.isArray =
    nativeIsArray ||
    function (obj) {
      return toString.call(obj) === '[object Array]';
    };

  // Is a given variable an object?
  /* 
    用来判断对象
    这个对象可以是函数、也可以是普通对象
  */
  _.isObject = function (obj) {
    var type = typeof obj;
    return type === 'function' || (type === 'object' && !!obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError, isMap, isWeakMap, isSet, isWeakSet.
  /* 
    判断内置对象类型
  */
  _.each(
    [
      'Arguments',
      'Function',
      'String',
      'Number',
      'Date',
      'RegExp',
      'Error',
      'Symbol',
      'Map',
      'WeakMap',
      'Set',
      'WeakSet'
    ],
    function (name) {
      _['is' + name] = function (obj) {
        return toString.call(obj) === '[object ' + name + ']';
      };
    }
  );

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function (obj) {
      return has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), Safari 8 (#1929), and PhantomJS (#2236).
  var nodelist = root.document && root.document.childNodes;
  if (
    typeof /./ != 'function' &&
    typeof Int8Array != 'object' &&
    typeof nodelist != 'function'
  ) {
    _.isFunction = function (obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  // 判断是否是无穷大或无穷小的数
  _.isFinite = function (obj) {
    return !_.isSymbol(obj) && isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`?
  /* 
    判断传入的值是不是 NaN
    相比于 Number.isNaN 方法，要求传入的参数必须是 Number 类型并且是 NaN 
  */
  _.isNaN = function (obj) {
    return _.isNumber(obj) && isNaN(obj);
  };

  // Is a given value a boolean?
  // 判断传入的的值是不是 Boolean 类型
  _.isBoolean = function (obj) {
    return (
      obj === true || obj === false || toString.call(obj) === '[object Boolean]'
    );
  };

  // Is a given value equal to null?
  /* 
    判断传入的值是不是 null 类型
    使用 === 就可以做全等的计算
  */
  _.isNull = function (obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  // 判断传入的值是不是 undefined 类型
  _.isUndefined = function (obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  /* 
    根据传入的 path, 判断传入的对象上是否有值
    path 即可以是字符串或者数组

    path 若为字符串，则只能传一个参数，判断对象一级属性
    若为数组，则判断多级嵌套属性
  */
  _.has = function (obj, path) {
    if (!_.isArray(path)) {
      return has(obj, path);
    }

    /* 
      通过 for 循环往下找对象
    */
    var length = path.length;
    for (var i = 0; i < length; i++) {
      var key = path[i];
      if (obj == null || !hasOwnProperty.call(obj, key)) {
        return false;
      }
      obj = obj[key];
    }
    return !!length;
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  /* 
    在浏览器中，var 声明的变量会成为 window 对象的属性，noConflict 方法可以解决此冲突

      index.html

      <script>
        var _ = 'in browser';
      </script>
      <script src="https://www.underscore.js"></script>
      <script>

        var underscore = _.noConflict();
        console.log(underscore.each);

      </script>
  
  */
  _.noConflict = function () {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  /* 
    只返回传入的第一个参数，有点过滤参数的意思
  */
  _.identity = function (value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  /* 
    可以看作保存结果的常量函数

    使用闭包缓存数据
  */
  _.constant = function (value) {
    return function () {
      return value;
    };
  };

  /* 
    空函数
    常用于 react/vue props 属性判断中
  */

  _.noop = function () {};

  // Creates a function that, when passed an object, will traverse that object’s
  // properties down the given `path`, specified as an array of keys or indexes.
  /* 

    获取对象的属性值
    其实这个方法没有 lodash 中的 get 方法好。


    在 underscore.js 中，我们只能这样使用 _.property 方法

    const person = {
      name: 'qin',
      address: {
        city: 'wuhan'
      }
    };


    _.property(['address', 'city'])(person) // 'wuhan'
    


  
  */
  _.property = function (path) {
    /* 
      path 不是数组，一般为字符串
    */
    if (!_.isArray(path)) {
      return shallowProperty(path);
    }
    /* 
      path 为数组
    */
    return function (obj) {
      return deepGet(obj, path);
    };
  };

  // Generates a function for a given object that returns a given property.
  /* 
    返回一个函数，传入属性, 获取属性值
  */
  _.propertyOf = function (obj) {
    if (obj == null) {
      return function () {};
    }
    return function (path) {
      return !_.isArray(path) ? obj[path] : deepGet(obj, path);
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  /* 
    返回一个断言函数，用来辨别给定的对象是否匹配 attrs 指定键/值属性
  */
  _.matcher = _.matches = function (attrs) {
    attrs = _.extendOwn({}, attrs);
    return function (obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  /* 
    没搞清楚这个方法有什么作用？
  */
  _.times = function (n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  /* 
    返回给定区间里的随机值
  */
  _.random = function (min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  /* 
    返回当前的时间，作用不大
    +new Date() => 1600314116751
  */
  _.now =
    Date.now ||
    function () {
      return new Date().getTime();
    };

  // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function (map) {
    var escaper = function (match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped.
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function (string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string)
        ? string.replace(replaceRegexp, escaper)
        : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // Traverses the children of `obj` along `path`. If a child is a function, it
  // is invoked with its parent as context. Returns the value of the final
  // child, or `fallback` if any child is undefined.
  /* 
    如果对象 object 中的属性 property 是函数, 则调用它, 否则, 返回它。
    感觉没什么用处
  */
  _.result = function (obj, path, fallback) {
    if (!_.isArray(path)) path = [path];
    var length = path.length;
    if (!length) {
      return _.isFunction(fallback) ? fallback.call(obj) : fallback;
    }
    for (var i = 0; i < length; i++) {
      var prop = obj == null ? void 0 : obj[path[i]];
      if (prop === void 0) {
        prop = fallback;
        i = length; // Ensure we don't continue iterating.
      }
      obj = _.isFunction(prop) ? prop.call(obj) : prop;
    }
    return obj;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function (prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function (match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function (text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp(
      [
        (settings.escape || noMatch).source,
        (settings.interpolate || noMatch).source,
        (settings.evaluate || noMatch).source
      ].join('|') + '|$',
      'g'
    );

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function (
      match,
      escape,
      interpolate,
      evaluate,
      offset
    ) {
      source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offset.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source =
      "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source +
      'return __p;\n';

    var render;
    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function (data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  /* 
    返回一个封装的对象，在封装的对象上调用方法会返回封装的对象本身，直到 value 
    方法调用为止

    chain 方法被调用，就会将 _ 实例的 _chain 属性设置为 true

    underscore 有三种调用方式
    1.函数式调用
    const { map } = require('underscore');

    map([1, 2, 3], v => v + 1); // [2, 3, 4]

    这种使用情况非常简单，我不在赘述

    2.原生 js 调用
    const _ = require('underscore');

    const result = _([1,2,3]).map(v => v + 1) // [2, 3, 4]

    此时 result 变成了纯粹的 Array 类型，只能使用原生 js 语法上的方法

    3.可以使用 underscore 所有方法的链式调用
    const _ = require('underscore');

    _chain([1, 2, 3]).map(v => v + 1).filter(v => v >= 3) // {_wrapped: Array(2), _chain: true}

  
  */
  _.chain = function (obj) {
    /* 
      这里的 _(obj) === new _(obj)
    */
    var instance = _(obj);
    // 设置 _chain 属性为 true
    instance._chain = true;
    // 返回创建的实例
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  /* 
    返回一个封装的对象，在封装的对象上调用方法会返回封装的对象本身，直到 value 
    方法调用为止
  
  */
  var chainResult = function (instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  /* 
    将各种方法添加到 _.prototype 对象上

  */
  _.mixin = function (obj) {
    _.each(_.functions(obj), function (name) {
      var func = (_[name] = obj[name]);
      _.prototype[name] = function () {
        var args = [this._wrapped];
        push.apply(args, arguments);
        /* 
          最后都要返回 _ 实例，才能启用链式调用
          this 指向 _.prototype
        */
        return chainResult(this, func.apply(_, args));
      };
    });

    /* 
      _ 是一个类
    */
    return _;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  /* 
    将 "pop", "push", "reverse", "shift", "sort", "splice", 
    "unshift" 等方法添加到原型对象上

  */
  _.each(
    ['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'],
    function (name) {
      var method = ArrayProto[name];
      _.prototype[name] = function () {
        var obj = this._wrapped;
        /* 
          比如使用 _(obj).push(item) 
        
        */
        method.apply(obj, arguments);
        if ((name === 'shift' || name === 'splice') && obj.length === 0)
          delete obj[0];
        return chainResult(this, obj);
      };
    }
  );

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function (name) {
    var method = ArrayProto[name];
    _.prototype[name] = function () {
      return chainResult(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  /* 
    为 _.prototype 对象增加 value 属性，值为传入的 obj 参数
    获取封装对象的最终值

    _({name: 'qin'}) => {name: 'qin'}
  */
  _.prototype.value = function () {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  /* 

  为 _.prototype 对象增加 valueOf、toJSON 属性，值为传入的 obj 参数
  */
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  /* 
    将传入的 obj 参数转为字符串类型
  */
  _.prototype.toString = function () {
    return String(this._wrapped);
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.

  /* 
  支持 amd 方式导出
  */
  if (typeof define == 'function' && define.amd) {
    define('underscore', [], function () {
      return _;
    });
  }
})();
