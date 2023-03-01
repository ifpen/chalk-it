$.ajaxTransport("+binary", function(options, originalOptions, jqXHR) {
    // check for conditions and support for blob / arraybuffer response type
    if (window.FormData && ((options.dataType && (options.dataType == 'binary')) || (options.data && ((window.ArrayBuffer && options.data instanceof ArrayBuffer) || (window.Blob && options.data instanceof Blob))))) {
        return {
            // create new XMLHttpRequest
            send: function(headers, callback) {
                // setup all variables
                var xhr = new XMLHttpRequest(),
                    url = options.url,
                    type = options.type,
                    async = options.async || true,
                    // blob or arraybuffer. Default is blob
                    dataType = options.responseType || "blob",
                    data = options.data || null,
                    username = options.username || null,
                    password = options.password || null;

                xhr.addEventListener('load', function() {
                    var data = {};
                    data[options.dataType] = xhr.response;
                    // make callback and send data
                    callback(xhr.status, xhr.statusText, data, xhr.getAllResponseHeaders());
                });

                xhr.open(type, url, async, username, password);

                // setup custom headers
                for (var i in headers) {
                    xhr.setRequestHeader(i, headers[i]);
                }

                xhr.responseType = dataType;
                xhr.send(data);
            },
            abort: function() {
                //jqXHR.abort(); //AEF: comment this line to fix bug related to loop call of abort between jquery and utils.js "Maximum call stack size exceeded "
            }
        };
    }
});

// ABK
function truncateLongArray(jsonObj, jsonObjSize) {
    for (var prop in jsonObj) {
        if (typeof(jsonObj[prop]) == "object") {
            var jsonObj2 = jsonObj[prop];
            if (!_.isNull(jsonObj2) && !_.isUndefined(jsonObj2)) {
                if (jsonObj2.length > jsonObjSize) {
                    jsonObj2.length = jsonObjSize;
                    jsonObj2[jsonObj2.length - 1] = "... [preview truncated due to data big size]";
                }
            }
            truncateLongArray(jsonObj2, jsonObjSize);
        }
    }
}

function syntaxHighlight(json) {
    // sanity checks
    if (_.isUndefined(json)) return;

    //ABK
    var jsonObj = JSON.parse(json);
    var jsonObjSize = 20;
    var jsonSize = 100000;
    truncateLongArray(jsonObj, jsonObjSize);
    json = JSON.stringify(jsonObj, null, 2);
    //

    var bOverflow = false;
    // limit preview size
    if (json.length > jsonSize) {
        json = json.substring(0, jsonSize);
        bOverflow = true;
    }

    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    json = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + ' vignette">' + match + '</span>';
    });
    json = json.replace(/    /g, '&nbsp;&nbsp;&nbsp;&nbsp;');
    json = json.replace(/\n/g, '<br/>');

    //json = '<pre><code class="hljs json">'+json +'</code></pre>'

    if (bOverflow) {
        json = json + '<b>... [preview truncated due to data big size]</b><br/>'
    }

    return json;
}

function base64ArrayBuffer(arrayBuffer) {
    var base64 = ''
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    var bytes = new Uint8Array(arrayBuffer)
    var byteLength = bytes.byteLength
    var byteRemainder = byteLength % 3
    var mainLength = byteLength - byteRemainder

    var a, b, c, d
    var chunk

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
        d = chunk & 63 // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength]

        a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3) << 4 // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

        a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15) << 2 // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }

    return base64
}

function String2Uint8Array(s) {
    var bytes = new Uint8Array(s.length);
    for (var index = 0; index < s.length; index++) {
        bytes.set([s.charCodeAt(index)], index);
    }

    return bytes;
}

function String2Int8Array(s) {
    var bytes = new Int8Array(s.length);
    for (var index = 0; index < s.length; index++) {
        bytes.set([s.charCodeAt(index)], index);
    }

    return bytes;
}

function Path2FileName(fakeFilePath) {
    if (_.isUndefined(fakeFilePath)) {
        return '';
    }

    if (_.isEmpty(fakeFilePath)) {
        return '';
    }

    var lastBackslash = fakeFilePath.lastIndexOf('\\');
    var fileName = '';
    if (lastBackslash < fakeFilePath.length) {
        fileName = fakeFilePath.substring(lastBackslash + 1, fakeFilePath.length);
    } else {
        fileName = fakeFilePath;
    }

    return fileName;

}

function getRealMimeType(result) {
    var arr = (new Uint8Array(result)).subarray(0, 4);
    var header = '';
    var realMimeType;

    for (var i = 0; i < arr.length; i++) {
        header += arr[i].toString(16);
    }

    // magic numbers: http://www.garykessler.net/library/file_sigs.html
    switch (header) {
        case "89504e47":
            realMimeType = "image/png";
            break;
        case "47494638":
            realMimeType = "image/gif";
            break;
        case "ffd8ffDB":
        case "ffd8ffe0":
        case "ffd8ffe1":
        case "ffd8ffe2":
        case "ffd8ffe3":
        case "ffd8ffe8":
            realMimeType = "image/jpeg";
            break;
        default:
            realMimeType = "unknown"; // Or you can use the blob.type as fallback
            break;
    }

    return realMimeType;
}


// MBG : remove vh, vw, px and convert to number
// MBG : add securities
function rmUnit(w) {
    return Number(w.substring(0, w.length - 2));
}

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    }
    return result;
} // Fin de findGetParameter

function nFormatter(num, digits) {
    var si = [
        { value: 1, symbol: "" },
        { value: 1E3, symbol: "k" },
        { value: 1E6, symbol: "M" },
        { value: 1E9, symbol: "G" },
        { value: 1E12, symbol: "T" },
        { value: 1E15, symbol: "P" },
        { value: 1E18, symbol: "E" }
    ];
    var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var i;
    for (i = si.length - 1; i > 0; i--) {
        if (num >= si[i].value) {
            break;
        }
    }
    return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
}

// from https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Set

function isSuperset(set, subset) {
    for (var elem of subset) {
        if (!set.has(elem)) {
            return false;
        }
    }
    return true;
}

function union(setA, setB) {
    var union = new Set(setA);
    for (var elem of setB) {
        union.add(elem);
    }
    return union;
}

function intersection(setA, setB) {
    var intersection = new Set();
    for (var elem of setB) {
        if (setA.has(elem)) {
            intersection.add(elem);
        }
    }
    return intersection;
}

function difference(setA, setB) {
    var difference = new Set(setA);
    for (var elem of setB) {
        difference.delete(elem);
    }
    return difference;

}

// From : https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
function detectBrowser() {
    // Opera 8.0+
    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    if (isOpera) return 'Opera';

    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';
    if (isFirefox) return 'Firefox';

    // Safari 3.0+ "[object HTMLElementConstructor]" 
    var isSafari = /constructor/i.test(window.HTMLElement) || (function(p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));
    if (isSafari) return 'Safari';

    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/ false || !!document.documentMode;
    if (isIE) return 'IE';

    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia;
    if (isEdge) return 'Edge';

    // Chrome 1 - 71
    var isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
    if (isChrome) return 'Chrome';

    // Blink engine detection
    var isBlink = (isChrome || isOpera) && !!window.CSS;
}

// From https://stackoverflow.com/questions/29046635/javascript-es6-cross-browser-detection
function checkES6() {
    // ES 2015
    // Check the "arrowFunction": "(_=>_)"
    "use strict";

    try { eval("var foo = (x)=>x+1"); } catch (e) { return false; }
    return true;
}

//From https://github.com/Tokimon/es-feature-detection
function checkES7() {
    // ES 2016
    // "Exponentiation operator": "2**3"
    "use strict";

    try { eval("2**3"); } catch (e) { return false; }
    return true;
}

function checkES8() {
    // ES 2017
    // check async/await
    // async function f() { var a = await Promise.resolve(42); return a }; f()"
    "use strict";

    try { eval("async function f() { var a = await Promise.resolve(42); return a; } f();"); } catch (e) { return false; }
    return true;
}

function checkES9() {
    // ES 2018
    // Check Object Spread Properties
    // var a = {a:1}, b = {b:2}, c = { ...a, ...b }; var { ...d } = c;
    "use strict";

    try { eval("var a = {a:1}, b = {b:2}, c = { ...a, ...b }; var { ...d } = c;"); } catch (e) { return false; }
    return true;
}

function checkES10() {
    // ES 2019
    // Optional Catch Binding
    // try { throw '' } catch { return true; };
    "use strict";

    try { eval("try { throw '' } catch { return true; }"); } catch (e) { return false; }
    return true;
}

// ArrayBuffer to String
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

// String to ArrayBuffer
// source: http://stackoverflow.com/a/11058858
function str2ab(str) {
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

(function() {
    /**
     * Ajustement décimal d'un nombre
     *
     * @param {String}  type : Le type d'ajustement souhaité.
     * @param {Number}  value : le nombre à traité The number.
     * @param {Integer} exp  : l'exposant (le logarithme en base 10 de l'ajustement).
     * @returns {Number} la valeur ajustée.
     */
    function decimalAdjust(type, value, exp) {
        // Si la valeur de exp n'est pas définie ou vaut zéro...
        if (typeof exp === 'undefined' || +exp === 0) {
            return Math[type](value);
        }
        value = +value;
        exp = +exp;
        // Si la valeur n'est pas un nombre 
        // ou si exp n'est pas un entier...
        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
            return NaN;
        }
        // Si la valeur est négative
        if (value < 0) {
            return -decimalAdjust(type, -value, exp);
        }
        // Décalage
        value = value.toString().split('e');
        value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
        // Décalage inversé
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
    }

    // Arrondi décimal
    if (!Math.round10) {
        Math.round10 = function(value, exp) {
            return decimalAdjust('round', value, exp);
        };
    }
    // Arrondi décimal inférieur
    if (!Math.floor10) {
        Math.floor10 = function(value, exp) {
            return decimalAdjust('floor', value, exp);
        };
    }
    // Arrondi décimal supérieur
    if (!Math.ceil10) {
        Math.ceil10 = function(value, exp) {
            return decimalAdjust('ceil', value, exp);
        };
    }
})();