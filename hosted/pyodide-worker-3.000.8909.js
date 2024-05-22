var port="7854",xDashConfig={xDashBasicVersion:"true",disableRegistration:"false",disableLocalServer:"true",urlDoc:"https://ifpen.github.io/chalk-it/hosted/doc/",urlBase:"https://ifpen.github.io/chalk-it/hosted/",urlBaseForExport:"https://ifpen.github.io/chalk-it/hosted/",urlWebSite:"https://github.com/ifpen/Chalk-it/",jsonEditorDatanodes:"false",version:{major:3,minor:"000",dateStamp:8909,fullVersion:"3.000.8909",chalkitVersion:"0.5.0"},disableSchedulerLog:"false",disableSchedulerProfiling:"false",pyodide:{standard_pyodide_packages:"[]",micropip_pyodide_packages:"[]",pyodide_index:"https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",xdash_lib_url:""},copyright:"© 2016-2024 IFP Energies nouvelles"},xServConfig={url:"http://127.0.0.1:7854/",urlApi:null,urlApiFMI:null,urlxProxy:"https://xproxytest.azurewebsites.net/ProxyService.asmx/"},urlPython=void 0,urlxDashNodeServer=void 0,urlAdminApp=void 0,dateLastBuild="2024-05-22T15:51:40.248Z",urlBase="https://ifpen.github.io/chalk-it/hosted/",exportHeaderCss=["assets/all-css-runtime-3.000.8909.min.css"],exportHeaderJs=["header-all-js-runtime-3.000.8909.min.js"],exportBodyJs=["body-all-js-runtime-3.000.8909.min.js"],xdashEditorBodyJsList=["body-all-js-editor-3.000.8909.min.js"];!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).loadPyodide={})}(this,(function(e){"use strict";"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self&&self;var t={exports:{}},r={exports:{}};!function(e,t){e.exports=function(){function e(e){return e.charAt(0).toUpperCase()+e.substring(1)}function t(e){return function(){return this[e]}}var r=["isConstructor","isEval","isNative","isToplevel"],o=["columnNumber","lineNumber"],i=["fileName","functionName","source"],n=r.concat(o,i,["args"],["evalOrigin"]);function a(t){if(t)for(var r=0;r<n.length;r++)void 0!==t[n[r]]&&this["set"+e(n[r])](t[n[r]])}a.prototype={getArgs:function(){return this.args},setArgs:function(e){if("[object Array]"!==Object.prototype.toString.call(e))throw new TypeError("Args must be an Array");this.args=e},getEvalOrigin:function(){return this.evalOrigin},setEvalOrigin:function(e){if(e instanceof a)this.evalOrigin=e;else{if(!(e instanceof Object))throw new TypeError("Eval Origin must be an Object or StackFrame");this.evalOrigin=new a(e)}},toString:function(){var e=this.getFileName()||"",t=this.getLineNumber()||"",r=this.getColumnNumber()||"",o=this.getFunctionName()||"";return this.getIsEval()?e?"[eval] ("+e+":"+t+":"+r+")":"[eval]:"+t+":"+r:o?o+" ("+e+":"+t+":"+r+")":e+":"+t+":"+r}},a.fromString=function(e){var t=e.indexOf("("),r=e.lastIndexOf(")"),o=e.substring(0,t),i=e.substring(t+1,r).split(","),n=e.substring(r+1);if(0===n.indexOf("@"))var s=/@(.+?)(?::(\d+))?(?::(\d+))?$/.exec(n,""),l=s[1],c=s[2],d=s[3];return new a({functionName:o,args:i||void 0,fileName:l,lineNumber:c||void 0,columnNumber:d||void 0})};for(var s=0;s<r.length;s++)a.prototype["get"+e(r[s])]=t(r[s]),a.prototype["set"+e(r[s])]=function(e){return function(t){this[e]=Boolean(t)}}(r[s]);for(var l=0;l<o.length;l++)a.prototype["get"+e(o[l])]=t(o[l]),a.prototype["set"+e(o[l])]=function(e){return function(t){if(r=t,isNaN(parseFloat(r))||!isFinite(r))throw new TypeError(e+" must be a Number");var r;this[e]=Number(t)}}(o[l]);for(var c=0;c<i.length;c++)a.prototype["get"+e(i[c])]=t(i[c]),a.prototype["set"+e(i[c])]=function(e){return function(t){this[e]=String(t)}}(i[c]);return a}()}(r),function(e,t){var o,i,n,a;e.exports=(o=r.exports,i=/(^|@)\S+:\d+/,n=/^\s*at .*(\S+:\d+|\(native\))/m,a=/^(eval@)?(\[native code])?$/,{parse:function(e){if(void 0!==e.stacktrace||void 0!==e["opera#sourceloc"])return this.parseOpera(e);if(e.stack&&e.stack.match(n))return this.parseV8OrIE(e);if(e.stack)return this.parseFFOrSafari(e);throw new Error("Cannot parse given Error object")},extractLocation:function(e){if(-1===e.indexOf(":"))return[e];var t=/(.+?)(?::(\d+))?(?::(\d+))?$/.exec(e.replace(/[()]/g,""));return[t[1],t[2]||void 0,t[3]||void 0]},parseV8OrIE:function(e){return e.stack.split("\n").filter((function(e){return!!e.match(n)}),this).map((function(e){e.indexOf("(eval ")>-1&&(e=e.replace(/eval code/g,"eval").replace(/(\(eval at [^()]*)|(,.*$)/g,""));var t=e.replace(/^\s+/,"").replace(/\(eval code/g,"(").replace(/^.*?\s+/,""),r=t.match(/ (\(.+\)$)/);t=r?t.replace(r[0],""):t;var i=this.extractLocation(r?r[1]:t),n=r&&t||void 0,a=["eval","<anonymous>"].indexOf(i[0])>-1?void 0:i[0];return new o({functionName:n,fileName:a,lineNumber:i[1],columnNumber:i[2],source:e})}),this)},parseFFOrSafari:function(e){return e.stack.split("\n").filter((function(e){return!e.match(a)}),this).map((function(e){if(e.indexOf(" > eval")>-1&&(e=e.replace(/ line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g,":$1")),-1===e.indexOf("@")&&-1===e.indexOf(":"))return new o({functionName:e});var t=/((.*".+"[^@]*)?[^@]*)(?:@)/,r=e.match(t),i=r&&r[1]?r[1]:void 0,n=this.extractLocation(e.replace(t,""));return new o({functionName:i,fileName:n[0],lineNumber:n[1],columnNumber:n[2],source:e})}),this)},parseOpera:function(e){return!e.stacktrace||e.message.indexOf("\n")>-1&&e.message.split("\n").length>e.stacktrace.split("\n").length?this.parseOpera9(e):e.stack?this.parseOpera11(e):this.parseOpera10(e)},parseOpera9:function(e){for(var t=/Line (\d+).*script (?:in )?(\S+)/i,r=e.message.split("\n"),i=[],n=2,a=r.length;n<a;n+=2){var s=t.exec(r[n]);s&&i.push(new o({fileName:s[2],lineNumber:s[1],source:r[n]}))}return i},parseOpera10:function(e){for(var t=/Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i,r=e.stacktrace.split("\n"),i=[],n=0,a=r.length;n<a;n+=2){var s=t.exec(r[n]);s&&i.push(new o({functionName:s[3]||void 0,fileName:s[2],lineNumber:s[1],source:r[n]}))}return i},parseOpera11:function(e){return e.stack.split("\n").filter((function(e){return!!e.match(i)&&!e.match(/^Error created at/)}),this).map((function(e){var t,r=e.split("@"),i=this.extractLocation(r.pop()),n=r.shift()||"",a=n.replace(/<anonymous function(: (\w+))?>/,"$2").replace(/\([^)]*\)/g,"")||void 0;n.match(/\(([^)]*)\)/)&&(t=n.replace(/^[^(]+\(([^)]*)\)$/,"$1"));var s=void 0===t||"[arguments not available]"===t?void 0:t.split(",");return new o({functionName:a,args:s,fileName:i[0],lineNumber:i[1],columnNumber:i[2],source:e})}),this)}})}(t);var o=t.exports;const i="object"==typeof process&&"object"==typeof process.versions&&"string"==typeof process.versions.node&&void 0===process.browser;let n,a,s,l,c,d,u,f,p;if(d=i?function(e,t){return s.resolve(t||".",e)}:function(e,t){return void 0===t&&(t=location),new URL(e,t).toString()},i||(u="/"),f=i?async function(e,t){if(e.startsWith("file://")&&(e=e.slice(7)),e.includes("://")){let t=await a(e);if(!t.ok)throw new Error(`Failed to load '${e}': request failed.`);return new Uint8Array(await t.arrayBuffer())}{const t=await c.readFile(e);return new Uint8Array(t.buffer,t.byteOffset,t.byteLength)}}:async function(e,t){const r=new URL(e,location);let o=t?{integrity:t}:{},i=await fetch(r,o);if(!i.ok)throw new Error(`Failed to load '${r}': request failed.`);return new Uint8Array(await i.arrayBuffer())},globalThis.document)p=async e=>await import(e);else if(globalThis.importScripts)p=async e=>{try{globalThis.importScripts(e)}catch(t){if(!(t instanceof TypeError))throw t;await import(e)}};else{if(!i)throw new Error("Cannot determine runtime environment");p=async function(e){e.startsWith("file://")&&(e=e.slice(7)),e.includes("://")?l.runInThisContext(await(await a(e)).text()):await import(n.pathToFileURL(e).href)}}function m(e){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var t,r=e[Symbol.asyncIterator];return r?r.call(e):(e=function(e){var t="function"==typeof Symbol&&Symbol.iterator,r=t&&e[t],o=0;if(r)return r.call(e);if(e&&"number"==typeof e.length)return{next:function(){return e&&o>=e.length&&(e=void 0),{value:e&&e[o++],done:!e}}};throw new TypeError(t?"Object is not iterable.":"Symbol.iterator is not defined.")}(e),t={},o("next"),o("throw"),o("return"),t[Symbol.asyncIterator]=function(){return this},t);function o(r){t[r]=e[r]&&function(t){return new Promise((function(o,i){!function(e,t,r,o){Promise.resolve(o).then((function(t){e({value:t,done:r})}),t)}(o,i,(t=e[r](t)).done,t.value)}))}}}const y=async e=>{const t=[];await async function e(r){var o,i;try{for(var n,a=m(r.values());!(n=await a.next()).done;){const r=n.value;t.push(r),"directory"===r.kind&&await e(r)}}catch(e){o={error:e}}finally{try{n&&!n.done&&(i=a.return)&&await i.call(a)}finally{if(o)throw o.error}}}(e);const r=new Map;r.set(".",e);for(const o of t){const t=(await e.resolve(o)).join("/");r.set(t,o)}return r};async function h(e={}){await async function(){if(!i)return;if(n=(await import("url")).default,c=await import("fs/promises"),a=globalThis.fetch?fetch:(await import("node-fetch")).default,l=(await import("vm")).default,s=await import("path"),u=s.sep,"undefined"!=typeof require)return;const e={fs:await import("fs"),crypto:await import("crypto"),ws:await import("ws"),child_process:await import("child_process")};globalThis.require=function(t){return e[t]}}();let t=e.indexURL||function(){if("string"==typeof __dirname)return __dirname;let e;try{throw new Error}catch(t){e=t}let t=o.parse(e)[0].fileName;const r=t.lastIndexOf(u);if(-1===r)throw new Error("Could not extract indexURL path from pyodide module location");return t.slice(0,r)}();t=d(t),t.endsWith("/")||(t+="/"),e.indexURL=t;const r={fullStdLib:!1,jsglobals:globalThis,stdin:globalThis.prompt?globalThis.prompt:void 0,homedir:"/home/pyodide",lockFileURL:t+"repodata.json",args:[],_node_mounts:[],packageCacheDir:t},m=Object.assign(r,e),h=function(){let e={noImageDecoding:!0,noAudioDecoding:!0,noWasmDecoding:!1,preRun:[],quit:(t,r)=>{throw e.exited={status:t,toThrow:r},r}};return e}();h.print=m.stdout,h.printErr=m.stderr,h.arguments=m.args;const g={config:m};h.API=g,function(e,t){let r;r=null!=t.stdLibURL?t.stdLibURL:t.indexURL+"python_stdlib.zip",function(e,t){const r=f(t);e.preRun.push((()=>{const t=e._py_version_major(),o=e._py_version_minor();e.FS.mkdirTree("/lib"),e.FS.mkdirTree(`/lib/python${t}.${o}/site-packages`),e.addRunDependency("install-stdlib"),r.then((r=>{e.FS.writeFile(`/lib/python${t}${o}.zip`,r)})).catch((e=>{console.error("Error occurred while installing the standard library:"),console.error(e)})).finally((()=>{e.removeRunDependency("install-stdlib")}))}))}(e,r),function(e,t){e.preRun.push((function(){try{e.FS.mkdirTree(t)}catch(e){console.error(`Error occurred while making a home directory '${t}':`),console.error(e),console.error("Using '/' for a home directory instead"),t="/"}e.ENV.HOME=t,e.FS.chdir(t)}))}(e,t.homedir),function(e,t){e.preRun.push((()=>{for(const r of t)e.FS.mkdirTree(r),e.FS.mount(e.FS.filesystems.NODEFS,{root:r},r)}))}(e,t._node_mounts),e.preRun.push((()=>function(e){const t=e.FS,r=e.FS.filesystems.MEMFS,o=e.PATH,i={DIR_MODE:16895,FILE_MODE:33279,mount:function(e){if(!e.opts.fileSystemHandle)throw new Error("opts.fileSystemHandle is required");return r.mount.apply(null,arguments)},syncfs:async(e,t,r)=>{try{const o=i.getLocalSet(e),n=await i.getRemoteSet(e),a=t?n:o,s=t?o:n;await i.reconcile(e,a,s),r(null)}catch(e){r(e)}},getLocalSet:e=>{let r=Object.create(null);function i(e){return"."!==e&&".."!==e}function n(e){return t=>o.join2(e,t)}let a=t.readdir(e.mountpoint).filter(i).map(n(e.mountpoint));for(;a.length;){let e=a.pop(),o=t.stat(e);t.isDir(o.mode)&&a.push.apply(a,t.readdir(e).filter(i).map(n(e))),r[e]={timestamp:o.mtime,mode:o.mode}}return{type:"local",entries:r}},getRemoteSet:async e=>{const t=Object.create(null),r=await y(e.opts.fileSystemHandle);for(const[n,a]of r)"."!==n&&(t[o.join2(e.mountpoint,n)]={timestamp:"file"===a.kind?(await a.getFile()).lastModifiedDate:new Date,mode:"file"===a.kind?i.FILE_MODE:i.DIR_MODE});return{type:"remote",entries:t,handles:r}},loadLocalEntry:e=>{const o=t.lookupPath(e).node,i=t.stat(e);if(t.isDir(i.mode))return{timestamp:i.mtime,mode:i.mode};if(t.isFile(i.mode))return o.contents=r.getFileDataAsTypedArray(o),{timestamp:i.mtime,mode:i.mode,contents:o.contents};throw new Error("node type not supported")},storeLocalEntry:(e,r)=>{if(t.isDir(r.mode))t.mkdirTree(e,r.mode);else{if(!t.isFile(r.mode))throw new Error("node type not supported");t.writeFile(e,r.contents,{canOwn:!0})}t.chmod(e,r.mode),t.utime(e,r.timestamp,r.timestamp)},removeLocalEntry:e=>{var r=t.stat(e);t.isDir(r.mode)?t.rmdir(e):t.isFile(r.mode)&&t.unlink(e)},loadRemoteEntry:async e=>{if("file"===e.kind){const t=await e.getFile();return{contents:new Uint8Array(await t.arrayBuffer()),mode:i.FILE_MODE,timestamp:t.lastModifiedDate}}if("directory"===e.kind)return{mode:i.DIR_MODE,timestamp:new Date};throw new Error("unknown kind: "+e.kind)},storeRemoteEntry:async(e,r,i)=>{const n=e.get(o.dirname(r)),a=t.isFile(i.mode)?await n.getFileHandle(o.basename(r),{create:!0}):await n.getDirectoryHandle(o.basename(r),{create:!0});if("file"===a.kind){const e=await a.createWritable();await e.write(i.contents),await e.close()}e.set(r,a)},removeRemoteEntry:async(e,t)=>{const r=e.get(o.dirname(t));await r.removeEntry(o.basename(t)),e.delete(t)},reconcile:async(e,r,n)=>{let a=0;const s=[];Object.keys(r.entries).forEach((function(e){const o=r.entries[e],i=n.entries[e];(!i||t.isFile(o.mode)&&o.timestamp.getTime()>i.timestamp.getTime())&&(s.push(e),a++)})),s.sort();const l=[];if(Object.keys(n.entries).forEach((function(e){r.entries[e]||(l.push(e),a++)})),l.sort().reverse(),!a)return;const c="remote"===r.type?r.handles:n.handles;for(const t of s){const r=o.normalize(t.replace(e.mountpoint,"/")).substring(1);if("local"===n.type){const e=c.get(r),o=await i.loadRemoteEntry(e);i.storeLocalEntry(t,o)}else{const e=i.loadLocalEntry(t);await i.storeRemoteEntry(c,r,e)}}for(const t of l)if("local"===n.type)i.removeLocalEntry(t);else{const r=o.normalize(t.replace(e.mountpoint,"/")).substring(1);await i.removeRemoteEntry(c,r)}}};e.FS.filesystems.NATIVEFS_ASYNC=i}(e)))}(h,m);const w=new Promise((e=>h.postRun=e));if(h.locateFile=e=>m.indexURL+e,"function"!=typeof _createPyodideModule){const e=`${m.indexURL}pyodide.asm.js`;await p(e)}if(await _createPyodideModule(h),await w,h.exited)throw h.exited.toThrow;if("0.23.4"!==g.version)throw new Error(`Pyodide version does not match: '0.23.4' <==> '${g.version}'. If you updated the Pyodide version, make sure you also updated the 'indexURL' parameter passed to loadPyodide.`);h.locateFile=e=>{throw new Error("Didn't expect to load any more file_packager files!")};let[_,v]=g.rawRun("import _pyodide_core");_&&h.API.fatal_loading_error("Failed to import _pyodide_core\n",v);const b=function(e,t){e.runPythonInternal_dict=e._pyodide._base.eval_code("{}"),e.importlib=e.runPythonInternal("import importlib; importlib");let r=e.importlib.import_module;e.sys=r("sys"),e.sys.path.insert(0,t.homedir),e.os=r("os");let o=e.runPythonInternal("import __main__; __main__.__dict__"),i=e.runPythonInternal("import builtins; builtins.__dict__");var n;e.globals=(n=i,new Proxy(o,{get:(e,t)=>"get"===t?t=>{let r=e.get(t);return void 0===r&&(r=n.get(t)),r}:"has"===t?t=>e.has(t)||n.has(t):Reflect.get(e,t)}));let a=e._pyodide._importhook;a.register_js_finder.callKwargs({hook:function(e){"__all__"in e||Object.defineProperty(e,"__all__",{get:()=>s.toPy(Object.getOwnPropertyNames(e).filter((e=>"__all__"!==e))),enumerable:!1,configurable:!0})}}),a.register_js_module("js",t.jsglobals);let s=e.makePublicAPI();return a.register_js_module("pyodide_js",s),e.pyodide_py=r("pyodide"),e.pyodide_code=r("pyodide.code"),e.pyodide_ffi=r("pyodide.ffi"),e.package_loader=r("pyodide._package_loader"),e.sitepackages=e.package_loader.SITE_PACKAGES.__str__(),e.dsodir=e.package_loader.DSO_DIR.__str__(),e.defaultLdLibraryPath=[e.dsodir,e.sitepackages],e.os.environ.__setitem__("LD_LIBRARY_PATH",e.defaultLdLibraryPath.join(":")),s.pyodide_py=e.pyodide_py,s.globals=e.globals,s}(g,m);if(b.version.includes("dev")||g.setCdnUrl(`https://cdn.jsdelivr.net/pyodide/v${b.version}/full/`),await g.packageIndexReady,g._pyodide._importhook.register_module_not_found_hook(g._import_name_to_package_name,g.repodata_unvendored_stdlibs_and_test),"0.23.4"!==g.repodata_info.version)throw new Error("Lock file version doesn't match Pyodide version");return g.package_loader.init_loaded_packages(),m.fullStdLib&&await b.loadPackage(g.repodata_unvendored_stdlibs),g.initializeStreams(m.stdin,m.stdout,m.stderr),b}globalThis.loadPyodide=h,e.loadPyodide=h,e.version="0.23.4",Object.defineProperty(e,"__esModule",{value:!0})})),function(){var e,t,r,o={'"':'"',"\\":"\\","/":"/",b:"\b",f:"\f",n:"\n",r:"\r",t:"\t"},i=function(t){throw{name:"SyntaxError",message:t,at:e,text:r}},n=function(o){return t=r.charAt(e++)},a=function(o){o!==t&&i("Expected '"+o+"' instead of '"+t+"'"),t=r.charAt(e++)},s=function(){var e="";if("-"===t&&(e="-",a("-")),"I"===t)return a("I"),a("n"),a("f"),a("i"),a("n"),a("i"),a("t"),a("y"),-1/0;for(;t>="0"&&t<="9";)e+=t,n();if("."===t)for(e+=".";n()&&t>="0"&&t<="9";)e+=t;if("e"===t||"E"===t)for(e+=t,n(),"-"!==t&&"+"!==t||(e+=t,n());t>="0"&&t<="9";)e+=t,n();return+e},l=function(){var e,r,a,s="";if('"'===t)for(;n();){if('"'===t)return n(),s;if("\\"===t)if(n(),"u"===t){for(a=0,r=0;r<4&&(e=parseInt(n(),16),isFinite(e));r++)a=16*a+e;s+=String.fromCharCode(a)}else{if(!o[t])break;s+=o[t]}else s+=t}i("Bad string")},c=function(){for(;t&&t<=" ";)n()},d=function(){switch(c(),t){case"{":return function(){var e,r={};if("{"===t){if(a("{"),c(),"}"===t)return a("}"),r;for(;t;){if(e=l(),c(),a(":"),Object.hasOwnProperty.call(r,e)&&i('Duplicate key "'+e+'"'),r[e]=d(),c(),"}"===t)return a("}"),r;a(","),c()}}i("Bad object")}();case"[":return function(){var e=[];if("["===t){if(a("["),c(),"]"===t)return a("]"),e;for(;t;){if(e.push(d()),c(),"]"===t)return a("]"),e;a(","),c()}}i("Bad array")}();case'"':return l();case"-":return s();default:return t>="0"&&t<="9"?s():function(){switch(t){case"t":return a("t"),a("r"),a("u"),a("e"),!0;case"f":return a("f"),a("a"),a("l"),a("s"),a("e"),!1;case"n":return a("n"),a("u"),a("l"),a("l"),null;case"N":return a("N"),a("a"),a("N"),NaN;case"I":return a("I"),a("n"),a("f"),a("i"),a("n"),a("i"),a("t"),a("y"),1/0}i("Unexpected '"+t+"'")}()}};JSON.parseMore=function(o,n){var a;return r=o,e=0,t=" ",a=d(),c(),t&&i("Syntax error"),"function"==typeof n?function e(t,r){var o,i,a=t[r];if(a&&"object"==typeof a)for(o in a)Object.prototype.hasOwnProperty.call(a,o)&&(void 0!==(i=e(a,o))?a[o]=i:delete a[o]);return n.call(t,r,a)}({"":a},""):a}}(),console.log("Pyodide worker started");let pyodidePromise=null;async function _loadPyodide(e){const t=await loadPyodide({indexURL:xDashConfig.pyodide.pyodide_index});await t.loadPackage("micropip");const r=t.pyimport("micropip");try{await r.install(xDashConfig.pyodide.xdash_lib_url)}finally{r.destroy()}return t}async function _loadPackages(e){const t=e.standardPackages,r=e.micropipPackages;if(t.length){const e=await pyodidePromise;await e.loadPackage(t)}if(r.length){const e=(await pyodidePromise).pyimport("micropip");try{await e.install(r)}finally{e.destroy()}}}async function _runPythonAsync(e){const t=await pyodidePromise;let r;e.globals&&(r=t.toPy(e.globals));try{return await t.runPythonAsync(e.script,r?{globals:r}:void 0)}finally{r&&r.destroy()}}async function _getPyodideLoadedLibs(){const e=await pyodidePromise,t=[],r=[];return Object.entries(e.loadedPackages).forEach((([e,o])=>{"default channel"===o?t.push(e):"pypi"===o&&r.push(e)})),{standard:t,micropip:r}}function reply(e,t){self.postMessage({...t,id:e})}self.onmessage=async e=>{const{id:t,type:r,...o}=e.data;try{if("start"===r)pyodidePromise=await _loadPyodide(o),self.postMessage({result:"ok",id:t});else if("loadPackages"===r)await _loadPackages(o),self.postMessage({result:"ok",id:t});else if("run"===r){const e=JSON.parseMore(await _runPythonAsync(o));self.postMessage({...e,id:t})}else{const e=`Invalid message type: ${r}`;console.error(e),self.postMessage({error:e,id:t})}}catch(e){console.error(e),self.postMessage({error:e.message,id:t})}};
//# sourceMappingURL=pyodide-worker-3.000.8909.js.map
