/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 92:
/***/ ((module, exports, __webpack_require__) => {

"use strict";


// ref: https://github.com/tc39/proposal-global
var getGlobal = function () {
	// the only reliable means to get the global object is
	// `Function('return this')()`
	// However, this causes CSP violations in Chrome apps.
	if (typeof self !== 'undefined') { return self; }
	if (typeof window !== 'undefined') { return window; }
	if (typeof __webpack_require__.g !== 'undefined') { return __webpack_require__.g; }
	throw new Error('unable to locate global object');
}

var globalObject = getGlobal();

module.exports = exports = globalObject.fetch;

// Needed for TypeScript and Webpack.
if (globalObject.fetch) {
	exports["default"] = globalObject.fetch.bind(globalObject);
}

exports.Headers = globalObject.Headers;
exports.Request = globalObject.Request;
exports.Response = globalObject.Response;


/***/ }),

/***/ 606:
/***/ ((module) => {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),

/***/ 271:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 498:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 912:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 425:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 624:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 464:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 190:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 363:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 633:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _typeof = (__webpack_require__(738)["default"]);
function _regeneratorRuntime() {
  "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */
  module.exports = _regeneratorRuntime = function _regeneratorRuntime() {
    return e;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports;
  var t,
    e = {},
    r = Object.prototype,
    n = r.hasOwnProperty,
    o = Object.defineProperty || function (t, e, r) {
      t[e] = r.value;
    },
    i = "function" == typeof Symbol ? Symbol : {},
    a = i.iterator || "@@iterator",
    c = i.asyncIterator || "@@asyncIterator",
    u = i.toStringTag || "@@toStringTag";
  function define(t, e, r) {
    return Object.defineProperty(t, e, {
      value: r,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }), t[e];
  }
  try {
    define({}, "");
  } catch (t) {
    define = function define(t, e, r) {
      return t[e] = r;
    };
  }
  function wrap(t, e, r, n) {
    var i = e && e.prototype instanceof Generator ? e : Generator,
      a = Object.create(i.prototype),
      c = new Context(n || []);
    return o(a, "_invoke", {
      value: makeInvokeMethod(t, r, c)
    }), a;
  }
  function tryCatch(t, e, r) {
    try {
      return {
        type: "normal",
        arg: t.call(e, r)
      };
    } catch (t) {
      return {
        type: "throw",
        arg: t
      };
    }
  }
  e.wrap = wrap;
  var h = "suspendedStart",
    l = "suspendedYield",
    f = "executing",
    s = "completed",
    y = {};
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  var p = {};
  define(p, a, function () {
    return this;
  });
  var d = Object.getPrototypeOf,
    v = d && d(d(values([])));
  v && v !== r && n.call(v, a) && (p = v);
  var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p);
  function defineIteratorMethods(t) {
    ["next", "throw", "return"].forEach(function (e) {
      define(t, e, function (t) {
        return this._invoke(e, t);
      });
    });
  }
  function AsyncIterator(t, e) {
    function invoke(r, o, i, a) {
      var c = tryCatch(t[r], t, o);
      if ("throw" !== c.type) {
        var u = c.arg,
          h = u.value;
        return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) {
          invoke("next", t, i, a);
        }, function (t) {
          invoke("throw", t, i, a);
        }) : e.resolve(h).then(function (t) {
          u.value = t, i(u);
        }, function (t) {
          return invoke("throw", t, i, a);
        });
      }
      a(c.arg);
    }
    var r;
    o(this, "_invoke", {
      value: function value(t, n) {
        function callInvokeWithMethodAndArg() {
          return new e(function (e, r) {
            invoke(t, n, e, r);
          });
        }
        return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
      }
    });
  }
  function makeInvokeMethod(e, r, n) {
    var o = h;
    return function (i, a) {
      if (o === f) throw Error("Generator is already running");
      if (o === s) {
        if ("throw" === i) throw a;
        return {
          value: t,
          done: !0
        };
      }
      for (n.method = i, n.arg = a;;) {
        var c = n.delegate;
        if (c) {
          var u = maybeInvokeDelegate(c, n);
          if (u) {
            if (u === y) continue;
            return u;
          }
        }
        if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) {
          if (o === h) throw o = s, n.arg;
          n.dispatchException(n.arg);
        } else "return" === n.method && n.abrupt("return", n.arg);
        o = f;
        var p = tryCatch(e, r, n);
        if ("normal" === p.type) {
          if (o = n.done ? s : l, p.arg === y) continue;
          return {
            value: p.arg,
            done: n.done
          };
        }
        "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg);
      }
    };
  }
  function maybeInvokeDelegate(e, r) {
    var n = r.method,
      o = e.iterator[n];
    if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y;
    var i = tryCatch(o, e.iterator, r.arg);
    if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y;
    var a = i.arg;
    return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y);
  }
  function pushTryEntry(t) {
    var e = {
      tryLoc: t[0]
    };
    1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e);
  }
  function resetTryEntry(t) {
    var e = t.completion || {};
    e.type = "normal", delete e.arg, t.completion = e;
  }
  function Context(t) {
    this.tryEntries = [{
      tryLoc: "root"
    }], t.forEach(pushTryEntry, this), this.reset(!0);
  }
  function values(e) {
    if (e || "" === e) {
      var r = e[a];
      if (r) return r.call(e);
      if ("function" == typeof e.next) return e;
      if (!isNaN(e.length)) {
        var o = -1,
          i = function next() {
            for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next;
            return next.value = t, next.done = !0, next;
          };
        return i.next = i;
      }
    }
    throw new TypeError(_typeof(e) + " is not iterable");
  }
  return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", {
    value: GeneratorFunctionPrototype,
    configurable: !0
  }), o(GeneratorFunctionPrototype, "constructor", {
    value: GeneratorFunction,
    configurable: !0
  }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) {
    var e = "function" == typeof t && t.constructor;
    return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name));
  }, e.mark = function (t) {
    return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t;
  }, e.awrap = function (t) {
    return {
      __await: t
    };
  }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () {
    return this;
  }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) {
    void 0 === i && (i = Promise);
    var a = new AsyncIterator(wrap(t, r, n, o), i);
    return e.isGeneratorFunction(r) ? a : a.next().then(function (t) {
      return t.done ? t.value : a.next();
    });
  }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () {
    return this;
  }), define(g, "toString", function () {
    return "[object Generator]";
  }), e.keys = function (t) {
    var e = Object(t),
      r = [];
    for (var n in e) r.push(n);
    return r.reverse(), function next() {
      for (; r.length;) {
        var t = r.pop();
        if (t in e) return next.value = t, next.done = !1, next;
      }
      return next.done = !0, next;
    };
  }, e.values = values, Context.prototype = {
    constructor: Context,
    reset: function reset(e) {
      if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t);
    },
    stop: function stop() {
      this.done = !0;
      var t = this.tryEntries[0].completion;
      if ("throw" === t.type) throw t.arg;
      return this.rval;
    },
    dispatchException: function dispatchException(e) {
      if (this.done) throw e;
      var r = this;
      function handle(n, o) {
        return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o;
      }
      for (var o = this.tryEntries.length - 1; o >= 0; --o) {
        var i = this.tryEntries[o],
          a = i.completion;
        if ("root" === i.tryLoc) return handle("end");
        if (i.tryLoc <= this.prev) {
          var c = n.call(i, "catchLoc"),
            u = n.call(i, "finallyLoc");
          if (c && u) {
            if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
            if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
          } else if (c) {
            if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
          } else {
            if (!u) throw Error("try statement without catch or finally");
            if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
          }
        }
      }
    },
    abrupt: function abrupt(t, e) {
      for (var r = this.tryEntries.length - 1; r >= 0; --r) {
        var o = this.tryEntries[r];
        if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
          var i = o;
          break;
        }
      }
      i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
      var a = i ? i.completion : {};
      return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a);
    },
    complete: function complete(t, e) {
      if ("throw" === t.type) throw t.arg;
      return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y;
    },
    finish: function finish(t) {
      for (var e = this.tryEntries.length - 1; e >= 0; --e) {
        var r = this.tryEntries[e];
        if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y;
      }
    },
    "catch": function _catch(t) {
      for (var e = this.tryEntries.length - 1; e >= 0; --e) {
        var r = this.tryEntries[e];
        if (r.tryLoc === t) {
          var n = r.completion;
          if ("throw" === n.type) {
            var o = n.arg;
            resetTryEntry(r);
          }
          return o;
        }
      }
      throw Error("illegal catch attempt");
    },
    delegateYield: function delegateYield(e, r, n) {
      return this.delegate = {
        iterator: values(e),
        resultName: r,
        nextLoc: n
      }, "next" === this.method && (this.arg = t), y;
    }
  }, e;
}
module.exports = _regeneratorRuntime, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 738:
/***/ ((module) => {

function _typeof(o) {
  "@babel/helpers - typeof";

  return module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports, _typeof(o);
}
module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 756:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// TODO(Babel 8): Remove this file.

var runtime = __webpack_require__(633)();
module.exports = runtime;

// Copied from https://github.com/facebook/regenerator/blob/main/packages/runtime/runtime.js#L736=
try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  if (typeof globalThis === "object") {
    globalThis.regeneratorRuntime = runtime;
  } else {
    Function("r", "regeneratorRuntime = r")(runtime);
  }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__webpack_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__webpack_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__webpack_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";

;// ./node_modules/@babel/runtime/helpers/esm/objectWithoutPropertiesLoose.js
function _objectWithoutPropertiesLoose(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (e.includes(n)) continue;
    t[n] = r[n];
  }
  return t;
}

;// ./node_modules/@babel/runtime/helpers/esm/objectWithoutProperties.js

function _objectWithoutProperties(e, t) {
  if (null == e) return {};
  var o,
    r,
    i = _objectWithoutPropertiesLoose(e, t);
  if (Object.getOwnPropertySymbols) {
    var s = Object.getOwnPropertySymbols(e);
    for (r = 0; r < s.length; r++) o = s[r], t.includes(o) || {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}

;// ./node_modules/@babel/runtime/helpers/esm/typeof.js
function _typeof(o) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof(o);
}

;// ./node_modules/@babel/runtime/helpers/esm/toPrimitive.js

function toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}

;// ./node_modules/@babel/runtime/helpers/esm/toPropertyKey.js


function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}

;// ./node_modules/@babel/runtime/helpers/esm/defineProperty.js

function _defineProperty(e, r, t) {
  return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}

;// ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js
function asyncGeneratorStep(n, t, e, r, o, a, c) {
  try {
    var i = n[a](c),
      u = i.value;
  } catch (n) {
    return void e(n);
  }
  i.done ? t(u) : Promise.resolve(u).then(r, o);
}
function asyncToGenerator_asyncToGenerator(n) {
  return function () {
    var t = this,
      e = arguments;
    return new Promise(function (r, o) {
      var a = n.apply(t, e);
      function _next(n) {
        asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
      }
      function _throw(n) {
        asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
      }
      _next(void 0);
    });
  };
}

// EXTERNAL MODULE: ./node_modules/@babel/runtime/regenerator/index.js
var regenerator = __webpack_require__(756);
var regenerator_default = /*#__PURE__*/__webpack_require__.n(regenerator);
;// ./thirdparty/json_parseMore.js

// Adapted from Crockford's JSON.parse (see https://github.com/douglascrockford/JSON-js)
// This version adds support for NaN, -Infinity and Infinity.

(function () {
  var at,
    // The index of the current character
    ch,
    // The current character
    escapee = {
      '"': '"',
      '\\': '\\',
      '/': '/',
      b: '\b',
      f: '\f',
      n: '\n',
      r: '\r',
      t: '\t'
    },
    text,
    error = function error(m) {
      throw {
        name: 'SyntaxError',
        message: m,
        at: at,
        text: text
      };
    },
    next = function next(c) {
      return ch = text.charAt(at++);
    },
    check = function check(c) {
      if (c !== ch) {
        error("Expected '" + c + "' instead of '" + ch + "'");
      }
      ch = text.charAt(at++);
    },
    number = function number() {
      var string = '';
      if (ch === '-') {
        string = '-';
        check('-');
      }
      if (ch === 'I') {
        check('I');
        check('n');
        check('f');
        check('i');
        check('n');
        check('i');
        check('t');
        check('y');
        return -Infinity;
      }
      while (ch >= '0' && ch <= '9') {
        string += ch;
        next();
      }
      if (ch === '.') {
        string += '.';
        while (next() && ch >= '0' && ch <= '9') {
          string += ch;
        }
      }
      if (ch === 'e' || ch === 'E') {
        string += ch;
        next();
        if (ch === '-' || ch === '+') {
          string += ch;
          next();
        }
        while (ch >= '0' && ch <= '9') {
          string += ch;
          next();
        }
      }
      return +string;
    },
    string = function string() {
      var hex,
        i,
        string = '',
        uffff;
      if (ch === '"') {
        while (next()) {
          if (ch === '"') {
            next();
            return string;
          }
          if (ch === '\\') {
            next();
            if (ch === 'u') {
              uffff = 0;
              for (i = 0; i < 4; i++) {
                hex = parseInt(next(), 16);
                if (!isFinite(hex)) {
                  break;
                }
                uffff = uffff * 16 + hex;
              }
              string += String.fromCharCode(uffff);
            } else if (escapee[ch]) {
              string += escapee[ch];
            } else {
              break;
            }
          } else {
            string += ch;
          }
        }
      }
      error("Bad string");
    },
    white = function white() {
      // Skip whitespace.
      while (ch && ch <= ' ') {
        next();
      }
    },
    word = function word() {
      switch (ch) {
        case 't':
          check('t');
          check('r');
          check('u');
          check('e');
          return true;
        case 'f':
          check('f');
          check('a');
          check('l');
          check('s');
          check('e');
          return false;
        case 'n':
          check('n');
          check('u');
          check('l');
          check('l');
          return null;
        case 'N':
          check('N');
          check('a');
          check('N');
          return NaN;
        case 'I':
          check('I');
          check('n');
          check('f');
          check('i');
          check('n');
          check('i');
          check('t');
          check('y');
          return Infinity;
      }
      error("Unexpected '" + ch + "'");
    },
    array = function array() {
      var array = [];
      if (ch === '[') {
        check('[');
        white();
        if (ch === ']') {
          check(']');
          return array; // empty array
        }
        while (ch) {
          array.push(value());
          white();
          if (ch === ']') {
            check(']');
            return array;
          }
          check(',');
          white();
        }
      }
      error("Bad array");
    },
    object = function object() {
      var key,
        object = {};
      if (ch === '{') {
        check('{');
        white();
        if (ch === '}') {
          check('}');
          return object; // empty object
        }
        while (ch) {
          key = string();
          white();
          check(':');
          if (Object.hasOwnProperty.call(object, key)) {
            error('Duplicate key "' + key + '"');
          }
          object[key] = value();
          white();
          if (ch === '}') {
            check('}');
            return object;
          }
          check(',');
          white();
        }
      }
      error("Bad object");
    };
  var value = function value() {
    white();
    switch (ch) {
      case '{':
        return object();
      case '[':
        return array();
      case '"':
        return string();
      case '-':
        return number();
      default:
        return ch >= '0' && ch <= '9' ? number() : word();
    }
  };
  JSON.parseMore = function (source, reviver) {
    var result;
    text = source;
    at = 0;
    ch = ' ';
    result = value();
    white();
    if (ch) {
      error("Syntax error");
    }
    return typeof reviver === 'function' ? function walk(holder, key) {
      var k,
        v,
        value = holder[key];
      if (value && _typeof(value) === 'object') {
        for (k in value) {
          if (Object.prototype.hasOwnProperty.call(value, k)) {
            v = walk(value, k);
            if (v !== undefined) {
              value[k] = v;
            } else {
              delete value[k];
            }
          }
        }
      }
      return reviver.call(holder, key, value);
    }({
      '': result
    }, '') : result;
  };
})();
;// ./node_modules/pyodide/pyodide.mjs
/* provided dependency */ var process = __webpack_require__(606);
"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self&&self;var StackFrame,FIREFOX_SAFARI_STACK_REGEXP,CHROME_IE_STACK_REGEXP,SAFARI_NATIVE_CODE_REGEXP,errorStackParser={exports:{}},stackframe={exports:{}};stackframe.exports=function(){function _isNumber(n){return!isNaN(parseFloat(n))&&isFinite(n)}function _capitalize(str){return str.charAt(0).toUpperCase()+str.substring(1)}function _getter(p){return function(){return this[p]}}var booleanProps=["isConstructor","isEval","isNative","isToplevel"],numericProps=["columnNumber","lineNumber"],stringProps=["fileName","functionName","source"],arrayProps=["args"],objectProps=["evalOrigin"],props=booleanProps.concat(numericProps,stringProps,arrayProps,objectProps);function StackFrame(obj){if(obj)for(var i=0;i<props.length;i++)void 0!==obj[props[i]]&&this["set"+_capitalize(props[i])](obj[props[i]])}StackFrame.prototype={getArgs:function(){return this.args},setArgs:function(v){if("[object Array]"!==Object.prototype.toString.call(v))throw new TypeError("Args must be an Array");this.args=v},getEvalOrigin:function(){return this.evalOrigin},setEvalOrigin:function(v){if(v instanceof StackFrame)this.evalOrigin=v;else{if(!(v instanceof Object))throw new TypeError("Eval Origin must be an Object or StackFrame");this.evalOrigin=new StackFrame(v)}},toString:function(){var fileName=this.getFileName()||"",lineNumber=this.getLineNumber()||"",columnNumber=this.getColumnNumber()||"",functionName=this.getFunctionName()||"";return this.getIsEval()?fileName?"[eval] ("+fileName+":"+lineNumber+":"+columnNumber+")":"[eval]:"+lineNumber+":"+columnNumber:functionName?functionName+" ("+fileName+":"+lineNumber+":"+columnNumber+")":fileName+":"+lineNumber+":"+columnNumber}},StackFrame.fromString=function(str){var argsStartIndex=str.indexOf("("),argsEndIndex=str.lastIndexOf(")"),functionName=str.substring(0,argsStartIndex),args=str.substring(argsStartIndex+1,argsEndIndex).split(","),locationString=str.substring(argsEndIndex+1);if(0===locationString.indexOf("@"))var parts=/@(.+?)(?::(\d+))?(?::(\d+))?$/.exec(locationString,""),fileName=parts[1],lineNumber=parts[2],columnNumber=parts[3];return new StackFrame({functionName:functionName,args:args||void 0,fileName:fileName,lineNumber:lineNumber||void 0,columnNumber:columnNumber||void 0})};for(var i=0;i<booleanProps.length;i++)StackFrame.prototype["get"+_capitalize(booleanProps[i])]=_getter(booleanProps[i]),StackFrame.prototype["set"+_capitalize(booleanProps[i])]=function(p){return function(v){this[p]=Boolean(v)}}(booleanProps[i]);for(var j=0;j<numericProps.length;j++)StackFrame.prototype["get"+_capitalize(numericProps[j])]=_getter(numericProps[j]),StackFrame.prototype["set"+_capitalize(numericProps[j])]=function(p){return function(v){if(!_isNumber(v))throw new TypeError(p+" must be a Number");this[p]=Number(v)}}(numericProps[j]);for(var k=0;k<stringProps.length;k++)StackFrame.prototype["get"+_capitalize(stringProps[k])]=_getter(stringProps[k]),StackFrame.prototype["set"+_capitalize(stringProps[k])]=function(p){return function(v){this[p]=String(v)}}(stringProps[k]);return StackFrame}();var ErrorStackParser=errorStackParser.exports=(StackFrame=stackframe.exports,FIREFOX_SAFARI_STACK_REGEXP=/(^|@)\S+:\d+/,CHROME_IE_STACK_REGEXP=/^\s*at .*(\S+:\d+|\(native\))/m,SAFARI_NATIVE_CODE_REGEXP=/^(eval@)?(\[native code])?$/,{parse:function(error){if(void 0!==error.stacktrace||void 0!==error["opera#sourceloc"])return this.parseOpera(error);if(error.stack&&error.stack.match(CHROME_IE_STACK_REGEXP))return this.parseV8OrIE(error);if(error.stack)return this.parseFFOrSafari(error);throw new Error("Cannot parse given Error object")},extractLocation:function(urlLike){if(-1===urlLike.indexOf(":"))return[urlLike];var parts=/(.+?)(?::(\d+))?(?::(\d+))?$/.exec(urlLike.replace(/[()]/g,""));return[parts[1],parts[2]||void 0,parts[3]||void 0]},parseV8OrIE:function(error){return error.stack.split("\n").filter((function(line){return!!line.match(CHROME_IE_STACK_REGEXP)}),this).map((function(line){line.indexOf("(eval ")>-1&&(line=line.replace(/eval code/g,"eval").replace(/(\(eval at [^()]*)|(,.*$)/g,""));var sanitizedLine=line.replace(/^\s+/,"").replace(/\(eval code/g,"(").replace(/^.*?\s+/,""),location=sanitizedLine.match(/ (\(.+\)$)/);sanitizedLine=location?sanitizedLine.replace(location[0],""):sanitizedLine;var locationParts=this.extractLocation(location?location[1]:sanitizedLine),functionName=location&&sanitizedLine||void 0,fileName=["eval","<anonymous>"].indexOf(locationParts[0])>-1?void 0:locationParts[0];return new StackFrame({functionName:functionName,fileName:fileName,lineNumber:locationParts[1],columnNumber:locationParts[2],source:line})}),this)},parseFFOrSafari:function(error){return error.stack.split("\n").filter((function(line){return!line.match(SAFARI_NATIVE_CODE_REGEXP)}),this).map((function(line){if(line.indexOf(" > eval")>-1&&(line=line.replace(/ line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g,":$1")),-1===line.indexOf("@")&&-1===line.indexOf(":"))return new StackFrame({functionName:line});var functionNameRegex=/((.*".+"[^@]*)?[^@]*)(?:@)/,matches=line.match(functionNameRegex),functionName=matches&&matches[1]?matches[1]:void 0,locationParts=this.extractLocation(line.replace(functionNameRegex,""));return new StackFrame({functionName:functionName,fileName:locationParts[0],lineNumber:locationParts[1],columnNumber:locationParts[2],source:line})}),this)},parseOpera:function(e){return!e.stacktrace||e.message.indexOf("\n")>-1&&e.message.split("\n").length>e.stacktrace.split("\n").length?this.parseOpera9(e):e.stack?this.parseOpera11(e):this.parseOpera10(e)},parseOpera9:function(e){for(var lineRE=/Line (\d+).*script (?:in )?(\S+)/i,lines=e.message.split("\n"),result=[],i=2,len=lines.length;i<len;i+=2){var match=lineRE.exec(lines[i]);match&&result.push(new StackFrame({fileName:match[2],lineNumber:match[1],source:lines[i]}))}return result},parseOpera10:function(e){for(var lineRE=/Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i,lines=e.stacktrace.split("\n"),result=[],i=0,len=lines.length;i<len;i+=2){var match=lineRE.exec(lines[i]);match&&result.push(new StackFrame({functionName:match[3]||void 0,fileName:match[2],lineNumber:match[1],source:lines[i]}))}return result},parseOpera11:function(error){return error.stack.split("\n").filter((function(line){return!!line.match(FIREFOX_SAFARI_STACK_REGEXP)&&!line.match(/^Error created at/)}),this).map((function(line){var argsRaw,tokens=line.split("@"),locationParts=this.extractLocation(tokens.pop()),functionCall=tokens.shift()||"",functionName=functionCall.replace(/<anonymous function(: (\w+))?>/,"$2").replace(/\([^)]*\)/g,"")||void 0;functionCall.match(/\(([^)]*)\)/)&&(argsRaw=functionCall.replace(/^[^(]+\(([^)]*)\)$/,"$1"));var args=void 0===argsRaw||"[arguments not available]"===argsRaw?void 0:argsRaw.split(",");return new StackFrame({functionName:functionName,args:args,fileName:locationParts[0],lineNumber:locationParts[1],columnNumber:locationParts[2],source:line})}),this)}});const IN_NODE="object"==typeof process&&"object"==typeof process.versions&&"string"==typeof process.versions.node&&void 0===process.browser;let nodeUrlMod,nodeFetch,nodePath,nodeVmMod,nodeFsPromisesMod,resolvePath,pathSep,loadBinaryFile,loadScript;if(resolvePath=IN_NODE?function(path,base){return nodePath.resolve(base||".",path)}:function(path,base){return void 0===base&&(base=location),new URL(path,base).toString()},IN_NODE||(pathSep="/"),loadBinaryFile=IN_NODE?async function(path,_file_sub_resource_hash){if(path.startsWith("file://")&&(path=path.slice("file://".length)),path.includes("://")){let response=await nodeFetch(path);if(!response.ok)throw new Error(`Failed to load '${path}': request failed.`);return new Uint8Array(await response.arrayBuffer())}{const data=await nodeFsPromisesMod.readFile(path);return new Uint8Array(data.buffer,data.byteOffset,data.byteLength)}}:async function(path,subResourceHash){const url=new URL(path,location);let options=subResourceHash?{integrity:subResourceHash}:{},response=await fetch(url,options);if(!response.ok)throw new Error(`Failed to load '${url}': request failed.`);return new Uint8Array(await response.arrayBuffer())},globalThis.document)loadScript=async url=>await import(/* webpackIgnore: true */url);else if(globalThis.importScripts)loadScript=async url=>{try{globalThis.importScripts(url)}catch(e){if(!(e instanceof TypeError))throw e;await import(/* webpackIgnore: true */url)}};else{if(!IN_NODE)throw new Error("Cannot determine runtime environment");loadScript=async function(url){url.startsWith("file://")&&(url=url.slice("file://".length));url.includes("://")?nodeVmMod.runInThisContext(await(await nodeFetch(url)).text()):await import(/* webpackIgnore: true */nodeUrlMod.pathToFileURL(url).href)}}function __values(o){var s="function"==typeof Symbol&&Symbol.iterator,m=s&&o[s],i=0;if(m)return m.call(o);if(o&&"number"==typeof o.length)return{next:function(){return o&&i>=o.length&&(o=void 0),{value:o&&o[i++],done:!o}}};throw new TypeError(s?"Object is not iterable.":"Symbol.iterator is not defined.")}function __asyncValues(o){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var i,m=o[Symbol.asyncIterator];return m?m.call(o):(o=__values(o),i={},verb("next"),verb("throw"),verb("return"),i[Symbol.asyncIterator]=function(){return this},i);function verb(n){i[n]=o[n]&&function(v){return new Promise((function(resolve,reject){(function(resolve,reject,d,v){Promise.resolve(v).then((function(v){resolve({value:v,done:d})}),reject)})(resolve,reject,(v=o[n](v)).done,v.value)}))}}}const getFsHandles=async dirHandle=>{const handles=[];await async function collect(curDirHandle){var e_1,_a;try{for(var _c,_b=__asyncValues(curDirHandle.values());!(_c=await _b.next()).done;){const entry=_c.value;handles.push(entry),"directory"===entry.kind&&await collect(entry)}}catch(e_1_1){e_1={error:e_1_1}}finally{try{_c&&!_c.done&&(_a=_b.return)&&await _a.call(_b)}finally{if(e_1)throw e_1.error}}}(dirHandle);const result=new Map;result.set(".",dirHandle);for(const handle of handles){const relativePath=(await dirHandle.resolve(handle)).join("/");result.set(relativePath,handle)}return result};function initializeFileSystem(Module,config){let stdLibURL;stdLibURL=null!=config.stdLibURL?config.stdLibURL:config.indexURL+"python_stdlib.zip",function(Module,stdlibURL){const stdlibPromise=loadBinaryFile(stdlibURL);Module.preRun.push((()=>{const pymajor=Module._py_version_major(),pyminor=Module._py_version_minor();Module.FS.mkdirTree("/lib"),Module.FS.mkdirTree(`/lib/python${pymajor}.${pyminor}/site-packages`),Module.addRunDependency("install-stdlib"),stdlibPromise.then((stdlib=>{Module.FS.writeFile(`/lib/python${pymajor}${pyminor}.zip`,stdlib)})).catch((e=>{console.error("Error occurred while installing the standard library:"),console.error(e)})).finally((()=>{Module.removeRunDependency("install-stdlib")}))}))}(Module,stdLibURL),function(Module,path){Module.preRun.push((function(){try{Module.FS.mkdirTree(path)}catch(e){console.error(`Error occurred while making a home directory '${path}':`),console.error(e),console.error("Using '/' for a home directory instead"),path="/"}Module.ENV.HOME=path,Module.FS.chdir(path)}))}(Module,config.homedir),function(Module,mounts){Module.preRun.push((()=>{for(const mount of mounts)Module.FS.mkdirTree(mount),Module.FS.mount(Module.FS.filesystems.NODEFS,{root:mount},mount)}))}(Module,config._node_mounts),Module.preRun.push((()=>function(module){const FS=module.FS,MEMFS=module.FS.filesystems.MEMFS,PATH=module.PATH,nativeFSAsync={DIR_MODE:16895,FILE_MODE:33279,mount:function(mount){if(!mount.opts.fileSystemHandle)throw new Error("opts.fileSystemHandle is required");return MEMFS.mount.apply(null,arguments)},syncfs:async(mount,populate,callback)=>{try{const local=nativeFSAsync.getLocalSet(mount),remote=await nativeFSAsync.getRemoteSet(mount),src=populate?remote:local,dst=populate?local:remote;await nativeFSAsync.reconcile(mount,src,dst),callback(null)}catch(e){callback(e)}},getLocalSet:mount=>{let entries=Object.create(null);function isRealDir(p){return"."!==p&&".."!==p}function toAbsolute(root){return p=>PATH.join2(root,p)}let check=FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));for(;check.length;){let path=check.pop(),stat=FS.stat(path);FS.isDir(stat.mode)&&check.push.apply(check,FS.readdir(path).filter(isRealDir).map(toAbsolute(path))),entries[path]={timestamp:stat.mtime,mode:stat.mode}}return{type:"local",entries:entries}},getRemoteSet:async mount=>{const entries=Object.create(null),handles=await getFsHandles(mount.opts.fileSystemHandle);for(const[path,handle]of handles)"."!==path&&(entries[PATH.join2(mount.mountpoint,path)]={timestamp:"file"===handle.kind?(await handle.getFile()).lastModifiedDate:new Date,mode:"file"===handle.kind?nativeFSAsync.FILE_MODE:nativeFSAsync.DIR_MODE});return{type:"remote",entries:entries,handles:handles}},loadLocalEntry:path=>{const node=FS.lookupPath(path).node,stat=FS.stat(path);if(FS.isDir(stat.mode))return{timestamp:stat.mtime,mode:stat.mode};if(FS.isFile(stat.mode))return node.contents=MEMFS.getFileDataAsTypedArray(node),{timestamp:stat.mtime,mode:stat.mode,contents:node.contents};throw new Error("node type not supported")},storeLocalEntry:(path,entry)=>{if(FS.isDir(entry.mode))FS.mkdirTree(path,entry.mode);else{if(!FS.isFile(entry.mode))throw new Error("node type not supported");FS.writeFile(path,entry.contents,{canOwn:!0})}FS.chmod(path,entry.mode),FS.utime(path,entry.timestamp,entry.timestamp)},removeLocalEntry:path=>{var stat=FS.stat(path);FS.isDir(stat.mode)?FS.rmdir(path):FS.isFile(stat.mode)&&FS.unlink(path)},loadRemoteEntry:async handle=>{if("file"===handle.kind){const file=await handle.getFile();return{contents:new Uint8Array(await file.arrayBuffer()),mode:nativeFSAsync.FILE_MODE,timestamp:file.lastModifiedDate}}if("directory"===handle.kind)return{mode:nativeFSAsync.DIR_MODE,timestamp:new Date};throw new Error("unknown kind: "+handle.kind)},storeRemoteEntry:async(handles,path,entry)=>{const parentDirHandle=handles.get(PATH.dirname(path)),handle=FS.isFile(entry.mode)?await parentDirHandle.getFileHandle(PATH.basename(path),{create:!0}):await parentDirHandle.getDirectoryHandle(PATH.basename(path),{create:!0});if("file"===handle.kind){const writable=await handle.createWritable();await writable.write(entry.contents),await writable.close()}handles.set(path,handle)},removeRemoteEntry:async(handles,path)=>{const parentDirHandle=handles.get(PATH.dirname(path));await parentDirHandle.removeEntry(PATH.basename(path)),handles.delete(path)},reconcile:async(mount,src,dst)=>{let total=0;const create=[];Object.keys(src.entries).forEach((function(key){const e=src.entries[key],e2=dst.entries[key];(!e2||FS.isFile(e.mode)&&e.timestamp.getTime()>e2.timestamp.getTime())&&(create.push(key),total++)})),create.sort();const remove=[];if(Object.keys(dst.entries).forEach((function(key){src.entries[key]||(remove.push(key),total++)})),remove.sort().reverse(),!total)return;const handles="remote"===src.type?src.handles:dst.handles;for(const path of create){const relPath=PATH.normalize(path.replace(mount.mountpoint,"/")).substring(1);if("local"===dst.type){const handle=handles.get(relPath),entry=await nativeFSAsync.loadRemoteEntry(handle);nativeFSAsync.storeLocalEntry(path,entry)}else{const entry=nativeFSAsync.loadLocalEntry(path);await nativeFSAsync.storeRemoteEntry(handles,relPath,entry)}}for(const path of remove)if("local"===dst.type)nativeFSAsync.removeLocalEntry(path);else{const relPath=PATH.normalize(path.replace(mount.mountpoint,"/")).substring(1);await nativeFSAsync.removeRemoteEntry(handles,relPath)}}};module.FS.filesystems.NATIVEFS_ASYNC=nativeFSAsync}(Module)))}const version="0.23.4";function finalizeBootstrap(API,config){API.runPythonInternal_dict=API._pyodide._base.eval_code("{}"),API.importlib=API.runPythonInternal("import importlib; importlib");let import_module=API.importlib.import_module;API.sys=import_module("sys"),API.sys.path.insert(0,config.homedir),API.os=import_module("os");let globals=API.runPythonInternal("import __main__; __main__.__dict__"),builtins=API.runPythonInternal("import builtins; builtins.__dict__");var builtins_dict;API.globals=(builtins_dict=builtins,new Proxy(globals,{get:(target,symbol)=>"get"===symbol?key=>{let result=target.get(key);return void 0===result&&(result=builtins_dict.get(key)),result}:"has"===symbol?key=>target.has(key)||builtins_dict.has(key):Reflect.get(target,symbol)}));let importhook=API._pyodide._importhook;importhook.register_js_finder.callKwargs({hook:function(o){"__all__"in o||Object.defineProperty(o,"__all__",{get:()=>pyodide.toPy(Object.getOwnPropertyNames(o).filter((name=>"__all__"!==name))),enumerable:!1,configurable:!0})}}),importhook.register_js_module("js",config.jsglobals);let pyodide=API.makePublicAPI();return importhook.register_js_module("pyodide_js",pyodide),API.pyodide_py=import_module("pyodide"),API.pyodide_code=import_module("pyodide.code"),API.pyodide_ffi=import_module("pyodide.ffi"),API.package_loader=import_module("pyodide._package_loader"),API.sitepackages=API.package_loader.SITE_PACKAGES.__str__(),API.dsodir=API.package_loader.DSO_DIR.__str__(),API.defaultLdLibraryPath=[API.dsodir,API.sitepackages],API.os.environ.__setitem__("LD_LIBRARY_PATH",API.defaultLdLibraryPath.join(":")),pyodide.pyodide_py=API.pyodide_py,pyodide.globals=API.globals,pyodide}async function loadPyodide(options={}){await async function(){if(!IN_NODE)return;if(nodeUrlMod=(await Promise.resolve(/* import() */).then(__webpack_require__.t.bind(__webpack_require__, 464, 19))).default,nodeFsPromisesMod=await Promise.resolve(/* import() */).then(__webpack_require__.t.bind(__webpack_require__, 425, 19)),nodeFetch=globalThis.fetch?fetch:(await Promise.resolve(/* import() */).then(__webpack_require__.t.bind(__webpack_require__, 92, 19))).default,nodeVmMod=(await Promise.resolve(/* import() */).then(__webpack_require__.t.bind(__webpack_require__, 190, 19))).default,nodePath=await Promise.resolve(/* import() */).then(__webpack_require__.t.bind(__webpack_require__, 624, 19)),pathSep=nodePath.sep,"undefined"!=typeof require)return;const node_modules={fs:await Promise.resolve(/* import() */).then(__webpack_require__.t.bind(__webpack_require__, 912, 19)),crypto:await Promise.resolve(/* import() */).then(__webpack_require__.t.bind(__webpack_require__, 498, 19)),ws:await Promise.resolve(/* import() */).then(__webpack_require__.t.bind(__webpack_require__, 363, 19)),child_process:await Promise.resolve(/* import() */).then(__webpack_require__.t.bind(__webpack_require__, 271, 19))};globalThis.require=function(mod){return node_modules[mod]}}();let indexURL=options.indexURL||function(){if("string"==typeof __dirname)return __dirname;let err;try{throw new Error}catch(e){err=e}let fileName=ErrorStackParser.parse(err)[0].fileName;const indexOfLastSlash=fileName.lastIndexOf(pathSep);if(-1===indexOfLastSlash)throw new Error("Could not extract indexURL path from pyodide module location");return fileName.slice(0,indexOfLastSlash)}();indexURL=resolvePath(indexURL),indexURL.endsWith("/")||(indexURL+="/"),options.indexURL=indexURL;const default_config={fullStdLib:!1,jsglobals:globalThis,stdin:globalThis.prompt?globalThis.prompt:void 0,homedir:"/home/pyodide",lockFileURL:indexURL+"repodata.json",args:[],_node_mounts:[],packageCacheDir:indexURL},config=Object.assign(default_config,options),Module=function(){let Module={noImageDecoding:!0,noAudioDecoding:!0,noWasmDecoding:!1,preRun:[],quit:(status,toThrow)=>{throw Module.exited={status:status,toThrow:toThrow},toThrow}};return Module}();Module.print=config.stdout,Module.printErr=config.stderr,Module.arguments=config.args;const API={config:config};Module.API=API,initializeFileSystem(Module,config);const moduleLoaded=new Promise((r=>Module.postRun=r));if(Module.locateFile=path=>config.indexURL+path,"function"!=typeof _createPyodideModule){const scriptSrc=`${config.indexURL}pyodide.asm.js`;await loadScript(scriptSrc)}if(await _createPyodideModule(Module),await moduleLoaded,Module.exited)throw Module.exited.toThrow;if("0.23.4"!==API.version)throw new Error(`Pyodide version does not match: '0.23.4' <==> '${API.version}'. If you updated the Pyodide version, make sure you also updated the 'indexURL' parameter passed to loadPyodide.`);Module.locateFile=path=>{throw new Error("Didn't expect to load any more file_packager files!")};let[err,captured_stderr]=API.rawRun("import _pyodide_core");err&&Module.API.fatal_loading_error("Failed to import _pyodide_core\n",captured_stderr);const pyodide=finalizeBootstrap(API,config);if(pyodide.version.includes("dev")||API.setCdnUrl(`https://cdn.jsdelivr.net/pyodide/v${pyodide.version}/full/`),await API.packageIndexReady,API._pyodide._importhook.register_module_not_found_hook(API._import_name_to_package_name,API.repodata_unvendored_stdlibs_and_test),"0.23.4"!==API.repodata_info.version)throw new Error("Lock file version doesn't match Pyodide version");return API.package_loader.init_loaded_packages(),config.fullStdLib&&await pyodide.loadPackage(API.repodata_unvendored_stdlibs),API.initializeStreams(config.stdin,config.stdout,config.stderr),pyodide}
//# sourceMappingURL=pyodide.mjs.map

;// ./source/config.js
var port = (/* unused pure expression or super */ null && ("7854"));
var xDashConfig = {"xDashBasicVersion":"true","disableRegistration":"false","disableLocalServer":"true","urlDoc":"https://ifpen.github.io/chalk-it/hosted/doc/","urlBase":"https://ifpen.github.io/chalk-it/hosted/","urlBaseForExport":"https://ifpen.github.io/chalk-it/hosted/","urlWebSite":"https://github.com/ifpen/chalk-it/","jsonEditorDatanodes":"false","version":{"major":4,"minor":"011","dateStamp":9183,"fullVersion":"4.011.9183","chalkitVersion":"0.8.1"},"disableSchedulerLog":"false","disableSchedulerProfiling":"false","pyodide":{"standard_pyodide_packages":"[]","micropip_pyodide_packages":"[]","pyodide_index":"https://cdn.jsdelivr.net/pyodide/v0.23.4/full/","xdash_lib_url":"https://ifpen.github.io/chalk-it/hosted/chalkit_python_api-0.0.5-py3-none-any.whl"},"copyright":"© 2016-2025 IFP Energies nouvelles"};
var xServConfig = {"urlApi":null,"urlApiFMI":null,"urlxProxy":"https://xproxytest.azurewebsites.net/ProxyService.asmx/"};
var urlPython = (/* unused pure expression or super */ null && (undefined));
var urlxDashNodeServer = (/* unused pure expression or super */ null && (undefined));
var urlAdminApp = (/* unused pure expression or super */ null && (undefined));
var dateLastBuild = (/* unused pure expression or super */ null && ("2025-02-20T22:20:33.292Z"));
var urlBase = (/* unused pure expression or super */ null && ("https://ifpen.github.io/chalk-it/hosted/"));
;// ./node_modules/babel-loader/lib/index.js!./source/kernel/base/pyodide-worker.js




var _excluded = ["id", "type"];

function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }



console.log('Pyodide worker started');
var pyodidePromise = null;
function _loadPyodide(_x) {
  return _loadPyodide2.apply(this, arguments);
}
function _loadPyodide2() {
  _loadPyodide2 = asyncToGenerator_asyncToGenerator(/*#__PURE__*/regenerator_default().mark(function _callee2(msg) {
    var pyodide, micropip;
    return regenerator_default().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return loadPyodide({
            indexURL: xDashConfig['pyodide'].pyodide_index
          });
        case 2:
          pyodide = _context2.sent;
          _context2.next = 5;
          return pyodide.loadPackage('micropip');
        case 5:
          micropip = pyodide.pyimport('micropip');
          _context2.prev = 6;
          _context2.next = 9;
          return micropip.install(xDashConfig['pyodide'].xdash_lib_url);
        case 9:
          _context2.prev = 9;
          micropip.destroy();
          return _context2.finish(9);
        case 12:
          return _context2.abrupt("return", pyodide);
        case 13:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[6,, 9, 12]]);
  }));
  return _loadPyodide2.apply(this, arguments);
}
function _loadPackages(_x2) {
  return _loadPackages2.apply(this, arguments);
}
function _loadPackages2() {
  _loadPackages2 = asyncToGenerator_asyncToGenerator(/*#__PURE__*/regenerator_default().mark(function _callee3(msg) {
    var missingStandardPackages, missingMicropipPackages, pyodide, _pyodide, micropip;
    return regenerator_default().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          missingStandardPackages = msg.standardPackages;
          missingMicropipPackages = msg.micropipPackages;
          if (!missingStandardPackages.length) {
            _context3.next = 8;
            break;
          }
          _context3.next = 5;
          return pyodidePromise;
        case 5:
          pyodide = _context3.sent;
          _context3.next = 8;
          return pyodide.loadPackage(missingStandardPackages);
        case 8:
          if (!missingMicropipPackages.length) {
            _context3.next = 19;
            break;
          }
          _context3.next = 11;
          return pyodidePromise;
        case 11:
          _pyodide = _context3.sent;
          micropip = _pyodide.pyimport('micropip');
          _context3.prev = 13;
          _context3.next = 16;
          return micropip.install(missingMicropipPackages);
        case 16:
          _context3.prev = 16;
          micropip.destroy();
          return _context3.finish(16);
        case 19:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[13,, 16, 19]]);
  }));
  return _loadPackages2.apply(this, arguments);
}
function _runPythonAsync(_x3) {
  return _runPythonAsync2.apply(this, arguments);
}
function _runPythonAsync2() {
  _runPythonAsync2 = asyncToGenerator_asyncToGenerator(/*#__PURE__*/regenerator_default().mark(function _callee4(msg) {
    var pyodide, globals;
    return regenerator_default().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return pyodidePromise;
        case 2:
          pyodide = _context4.sent;
          globals = undefined;
          if (msg.globals) {
            // TODO check whether JSON <-> is faster
            globals = pyodide.toPy(msg.globals);
          }
          _context4.prev = 5;
          _context4.next = 8;
          return pyodide.runPythonAsync(msg.script, globals ? {
            globals: globals
          } : undefined);
        case 8:
          return _context4.abrupt("return", _context4.sent);
        case 9:
          _context4.prev = 9;
          if (globals) {
            globals.destroy();
          }
          return _context4.finish(9);
        case 12:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[5,, 9, 12]]);
  }));
  return _runPythonAsync2.apply(this, arguments);
}
function _getPyodideLoadedLibs() {
  return _getPyodideLoadedLibs2.apply(this, arguments);
}
function _getPyodideLoadedLibs2() {
  _getPyodideLoadedLibs2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime.mark(function _callee5() {
    var pyodide, standard, micropip;
    return _regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return pyodidePromise;
        case 2:
          pyodide = _context5.sent;
          standard = [];
          micropip = [];
          Object.entries(pyodide.loadedPackages).forEach(function (_ref2) {
            var _ref3 = _slicedToArray(_ref2, 2),
              lib = _ref3[0],
              type = _ref3[1];
            if (type === 'default channel') {
              standard.push(lib);
            } else if (type === 'pypi') {
              micropip.push(lib);
            }
          });
          return _context5.abrupt("return", {
            standard: standard,
            micropip: micropip
          });
        case 7:
        case "end":
          return _context5.stop();
      }
    }, _callee5);
  }));
  return _getPyodideLoadedLibs2.apply(this, arguments);
}
function reply(id, msg) {
  self.postMessage(_objectSpread(_objectSpread({}, msg), {}, {
    id: id
  }));
}
self.onmessage = /*#__PURE__*/function () {
  var _ref = asyncToGenerator_asyncToGenerator(/*#__PURE__*/regenerator_default().mark(function _callee(event) {
    var _event$data, id, type, msg, result, error;
    return regenerator_default().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _event$data = event.data, id = _event$data.id, type = _event$data.type, msg = _objectWithoutProperties(_event$data, _excluded);
          _context.prev = 1;
          if (!(type === 'start')) {
            _context.next = 9;
            break;
          }
          _context.next = 5;
          return _loadPyodide(msg);
        case 5:
          pyodidePromise = _context.sent;
          self.postMessage({
            result: 'ok',
            id: id
          });
          _context.next = 27;
          break;
        case 9:
          if (!(type === 'loadPackages')) {
            _context.next = 15;
            break;
          }
          _context.next = 12;
          return _loadPackages(msg);
        case 12:
          self.postMessage({
            result: 'ok',
            id: id
          });
          _context.next = 27;
          break;
        case 15:
          if (!(type === 'run')) {
            _context.next = 24;
            break;
          }
          _context.t0 = JSON;
          _context.next = 19;
          return _runPythonAsync(msg);
        case 19:
          _context.t1 = _context.sent;
          result = _context.t0.parseMore.call(_context.t0, _context.t1);
          self.postMessage(_objectSpread(_objectSpread({}, result), {}, {
            id: id
          }));
          _context.next = 27;
          break;
        case 24:
          error = "Invalid message type: ".concat(type);
          console.error(error);
          self.postMessage({
            error: error,
            id: id
          });
        case 27:
          _context.next = 33;
          break;
        case 29:
          _context.prev = 29;
          _context.t2 = _context["catch"](1);
          console.error(_context.t2);
          self.postMessage({
            error: _context.t2.message,
            id: id
          });
        case 33:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[1, 29]]);
  }));
  return function (_x4) {
    return _ref.apply(this, arguments);
  };
}();
})();

/******/ })()
;