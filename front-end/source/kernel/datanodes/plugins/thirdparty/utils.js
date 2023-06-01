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

/**
 * Convert a data size in bytes to a string including a unit ('ko', 'Mo', etc.)
 * @param {number} [sizeBytes] 
 * @returns {string}
 */
function formatDataSize(sizeBytes) {
    if (!sizeBytes) {
        return "";
    }

    let unit = 1;
    let unitStr = "o";
    if (sizeBytes > 100_000_000) {
        unit = 1_000_000_000;
        unitStr = "Go"
    } else if (sizeBytes > 1_000_000) {
        unit = 1_000_000;
        unitStr = "Mo"
    } else if (sizeBytes > 1_000) {
        unit = 1_000;
        unitStr = "ko"
    }

    let size = sizeBytes / unit;
    size = Math.round(size * 100) / 100;

    return `${size}${unitStr}`;
}


DEFAULT_JSON_FORMAT = {
    maxLines: 20_000,
    maxChars: 2_000_000,
    maxDepth: 12,
    maxObjectKeys: 100,
    maxArrayLength: 100,
    maxStringLength: 120,
    maxLineWidth: 120,
    indentLength: 2,
}

// Format for small previews.
// Aims to be fast to format, to not slow the display or use too much memory. Also avoid having a ridiculous scrollbar.
// Also limits nested depth, array sizes, etc. to fit more of the object's general structure into the total size quota.
PREVIEW_JSON_FORMAT = {
    maxLines: 100,
    maxChars: 100_000,
    maxDepth: 8,
    maxObjectKeys: 20,
    maxArrayLength: 20,
    maxStringLength: 80,
    maxLineWidth: 100,
    indentLength: 2,
}

// Format to fully display JSON as the main focus of the view.
// Priorities are to have few limits, stay readable, and not have the page blow past its memory limit.
// The display getting a bit slow is acceptable.
VIEW_JSON_FORMAT = {
    maxLines: 50_000,
    maxChars: 5_000_000,
    // Single strings (displayed on the same line) are useless past a certain length as they get impossible to read
    maxStringLength: 50_000,
    maxLineWidth: 120,
    indentLength: 4,
}

/**
 * Convert JSON data to a HTMLElement-based representation
 * @param {*} data JSON object
 * @param {*} options limits and formating options
 * @returns {HTMLElement}  
 */
function formatJson(
    data,
    {
        maxLines, // maximum number of lines displayed
        maxChars, // maximum number of characters displayed (including indentations)
        maxDepth, // maximum depth displayed (nested objects/arrays)
        maxObjectKeys, // maximum number of keys displayed per object
        maxArrayLength, // maximum number of entries displayed per array
        maxStringLength, // maximum number of characters displayed per string (including object keys)
        maxLineWidth, // maximum line size bellow which arrays may be inlined
        indentLength, // indentation size
    } = DEFAULT_JSON_FORMAT) {
    // ** Note **
    // To make limits optionals, the implementation makes use of the fact that 'value > maximum' is not truthy when maximum is not defined.
    // This implies that the direction of inequalities involving 'maxYYY' matters.

    const prefixIncrementLen = indentLength ?? 2;
    const prefixIncrement = " ".repeat(prefixIncrementLen);

    function appendText(element, text, classes, lines, chars) {
        const span = document.createElement('span');
        span.classList.add(...classes);
        span.innerText = text;
        element.append(span);
        return { lines, chars: chars + text.length }
    }

    function canInlineArray(array, depth, prefixLength = 0) {
        if (!maxLineWidth) {
            return false;
        }

        let width = prefixLength + 2; // []
        let len = array.length;
        if (maxArrayLength < len) {
            len = maxArrayLength;
            width += 5; // ', ...'
        }

        let index = 0;
        while (width < maxLineWidth && index < len) {
            if (index !== 0) {
                width += 2; // ', ';
            }

            const item = array[index];
            if (item === null || item === undefined) {
                width += item === null ? 4 : 9;
            } else if (Array.isArray(item)) {
                if (item.length === 0) {
                    width += 2; // '[]'; 
                } else if (depth + 1 >= maxDepth) {
                    width += 5; // '[...]'; 
                } else {
                    return false;
                }
            } else if (typeof item === 'object') {
                const keys = Object.keys(item);
                if (keys.length === 0) {
                    width += 2; // '{}'; 
                } else if (depth + 1 >= maxDepth) {
                    width += 5; // '{...}'; 
                } else {
                    return false;
                }
            } else if (typeof item === 'string') {
                // Imperfect but good enough. We gloss over escape sequences.
                if (item.length > maxStringLength) {
                    width += maxStringLength + 5; // '"..."'; 
                } else {
                    width += item.length + 2; // len + quotes
                }
                width += item.length;
            } else if (typeof item === 'number') {
                width += item.toString().length;
            } else if (typeof item === 'boolean') {
                width += item ? 4 : 5; // true/false
            }

            index += 1;
        }

        return width <= maxLineWidth;
    }

    function appendArray(element, array, prefix, depth, lines, chars, lineStartLength) {
        if (array.length === 0) {
            element.appendChild(document.createTextNode('[]'));
            return { lines, chars: chars + 2 };
        }
        if (depth === maxDepth) {
            element.appendChild(document.createTextNode('[...]'));
            return { lines, chars: chars + 5 };
        }

        const inline = canInlineArray(array, depth, lineStartLength);
        let newLines = lines;
        let newChars = chars;

        element.appendChild(document.createTextNode('['));
        newChars += 1;

        if (!inline) {
            element.appendChild(document.createElement('br'));
            newLines += 1;
        }

        if (newLines >= maxLines || newChars >= maxChars) return { lines: newLines, chars: newChars };

        let len = array.length;
        const truncate = maxArrayLength < len;
        if (truncate) {
            len = maxArrayLength;
        }

        const newPrefix = prefix + prefixIncrement;
        for (let index = 0; index < len; index++) {
            const value = array[index];

            if (!inline) {
                element.appendChild(document.createTextNode(newPrefix));
                newChars += newPrefix.length;
            }
            ({ lines: newLines, chars: newChars } = append(element, value, newPrefix, depth + 1, newLines, newChars, newPrefix.length));
            if (newLines >= maxLines || newChars >= maxChars) return { lines: newLines, chars: newChars };

            if (inline) {
                if (index !== len - 1 || truncate) {
                    element.appendChild(document.createTextNode(', '));
                    newChars += 2;
                }
            } else {
                if (index !== len - 1 || truncate) {
                    element.appendChild(document.createTextNode(','));
                    newChars += 1;
                }
                element.appendChild(document.createElement('br'));
                newLines += 1;
            }
            if (newLines >= maxLines || newChars >= maxChars) return { lines: newLines, chars: newChars };
        }

        if (truncate) {
            const txt = inline ? '...' : (newPrefix + '...');
            element.appendChild(document.createTextNode(txt));
            newChars += txt.length;

            if (!inline) {
                element.appendChild(document.createElement('br'));
                newLines += 1;
            }
        }

        if (newLines >= maxLines || newChars >= maxChars) return { lines: newLines, chars: newChars };

        const txt = inline ? ']' : (prefix + ']');
        element.appendChild(document.createTextNode(txt));
        newChars += txt.length;

        return { lines: newLines, chars: newChars };
    }

    function appendObject(element, object, prefix, depth, lines, chars) {
        const entries = Object.entries(object);
        if (entries.length === 0) {
            element.appendChild(document.createTextNode('{}'));
            return { lines, chars: chars + 2 };
        }
        if (depth === maxDepth) {
            element.appendChild(document.createTextNode('{...}'));
            return { lines, chars: chars + 5 };
        }

        let newLines = lines;
        let newChars = chars;

        element.appendChild(document.createTextNode('{'));
        element.appendChild(document.createElement('br'));
        newChars += 1;
        newLines += 1;
        if (newLines >= maxLines || newChars >= maxChars) return { lines: newLines, chars: newChars };

        let len = entries.length;
        const truncate = maxObjectKeys < len;
        if (truncate) {
            len = maxObjectKeys;
        }

        const newPrefix = prefix + prefixIncrement;
        for (let index = 0; index < len; index++) {
            const [key, value] = entries[index];

            element.appendChild(document.createTextNode(newPrefix));
            newChars += newPrefix.length;

            const truncateKey = key.length > maxStringLength;
            let keyText = JSON.stringify(truncateKey ? key.substring(0, maxStringLength) : key);
            if (truncateKey) {
                keyText += '...';
            }
            ({ lines: newLines, chars: newChars } = appendText(element, keyText, ['vignette', 'key'], newLines, newChars));

            element.appendChild(document.createTextNode(': '));
            newChars += 2;

            ({ lines: newLines, chars: newChars } = append(element, value, newPrefix, depth + 1, newLines, newChars, newPrefix.length + keyText.length + 2));
            if (newLines >= maxLines || newChars >= maxChars) return { lines: newLines, chars: newChars };

            if (index !== len - 1 || truncate) {
                element.appendChild(document.createTextNode(','));
                newChars += 1;
            }

            element.appendChild(document.createElement('br'));
            newLines += 1;

            if (newLines >= maxLines || newChars >= maxChars) return { lines: newLines, chars: newChars };
        }

        if (truncate) {
            element.appendChild(document.createTextNode(prefix + '...'));
            element.appendChild(document.createElement('br'));
            newChars += prefix.length + 3;
            newLines += 1;
        }

        if (newLines >= maxLines || newChars >= maxChars) return { lines: newLines, chars: newChars };

        element.appendChild(document.createTextNode(`${prefix}}`));
        newChars += prefix.length + 1;
        return { lines: newLines, chars: newChars };
    }

    function append(element, json, prefix, depth, lines, chars, lineStartLength = 0) {
        if (lines >= maxLines || chars >= maxChars) {
            return { lines, chars };
        }

        if (json === null || json === undefined) {
            const text = json === null ? 'null' : 'undefined';
            return appendText(element, text, ['key', 'null'], lines, chars);
        } else if (Array.isArray(json)) {
            return appendArray(element, json, prefix, depth, lines, chars, lineStartLength);
        } else if (typeof json === 'object') {
            return appendObject(element, json, prefix, depth, lines, chars)
        } else if (typeof json === 'string') {
            const truncate = json.length > maxStringLength;
            let text = JSON.stringify(truncate ? json.substring(0, maxStringLength) : json);
            if (truncate) {
                text += '...';
            }
            return appendText(element, text, ['vignette', 'string'], lines, chars);
        } else if (typeof json === 'number') {
            const text = json.toString();
            return appendText(element, text, ['vignette', 'number'], lines, chars);
        } else if (typeof json === 'boolean') {
            const text = json ? 'true' : 'false';
            return appendText(element, text, ['vignette', 'boolean'], lines, chars);
        }
    }

    const span = document.createElement('span');
    span.style['white-space'] = 'pre';
    const { lines, chars } = append(span, data, "", 0, 0, 0);
    if (lines >= maxLines || chars >= maxChars) {
        const last = span.lastChild;
        if (!(last instanceof HTMLBRElement)) {
            span.appendChild(document.createElement('br'));
        }

        const b = document.createElement('b');
        b.innerText = '... [preview truncated due to excessive data size]';
        span.appendChild(b);
    }
    return span;
}

/**
 * Computes the actual size of base 64 encoded data
 * @param {string} b64str base 64 encoded data
 * @returns {number} data size in bytes
 */
function b64StrSize(b64str) {
    const len = b64str.length;
    let size = Math.ceil(len / 4 * 3);
    if (b64str.endsWith('==')) {
        size -= 2;
    } else if (b64str.endsWith('=')) {
        size -= 1;
    }
    return size;
}

function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode(parseInt(p1, 16));
    }));
}

// MIME types of images we expect the browser to be able to display
const BROWSER_SUPPORTED_IMAGES = [
    'image/apng',
    'image/avif',
    'image/bmp',
    'image/gif',
    'image/ico',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/webp',
];

// Displaying base64 encoded data beyond a few characters is clutter rather than usefulness
const MAX_BINARY_DATA_DISPLAY_CHARS = 10;

/**
 * Provides a minimalistic but hopefully helpful representation of some data. Handles binary data with a MIME type.
 * @param {*} data any JSON data
 * @param {*} options 
 * @returns {HTMLElement}
 */
function jsonDataToBasicHtmlElement(data, options = undefined) {
    if (typeof data === 'string') {
        const span = document.createElement('span');
        span.innerText = data;
        span.style['white-space'] = 'pre-wrap';
        return span;
    } else if (typeof data === 'number' || typeof data === 'boolean') {
        const span = document.createElement('span');
        span.innerText = String(data);
        return span;
    } else if (typeof data === 'object' && data.type && data.content) {
        if (data.type === "application/x-python-pickle") {
            const code = document.createElement('code');
            code.innerText = `<class '${data.name}'> ${formatDataSize(b64StrSize(data.content))}`;
            return code;
        }
        else if (['text/html', 'application/pdf'].includes(data.type)) {
            const iframe = document.createElement('iframe');
            iframe.src = `data:${data.type};base64,${data.isBinary ? data.content : b64EncodeUnicode(data.content)}`;
            iframe.style.height = '100%';
            iframe.style.width = '100%';
            return iframe;
        } else if (data.type.startsWith('text/')) {
            const monospace = data.type === 'text/csv';
            const element = document.createElement(monospace ? 'pre' : 'div');
            element.innerText = data.isBinary ? atob(data.content) : data.content;
            if (!monospace) {
                element.style['white-space'] = 'pre-wrap';
            }
            return element;
        } else if (data.isBinary) {
            if (BROWSER_SUPPORTED_IMAGES.includes(data.type)) {
                const img = document.createElement('img');
                img.src = `data:${data.type};base64,${data.content}`;
                img.style.height = '100%';
                img.style.width = '100%';
                img.style['object-fit'] = 'contain';
                return img;
            } else if (data.type.startsWith('video/') || data.type.startsWith('audio/')) {
                const element = document.createElement(data.type.startsWith('video/') ? 'video' : 'audio');
                element.src = `data:${data.type};base64,${data.content}`;
                element.controls = true;
                element.style.height = '100%';
                element.style.width = '100%';
                return element;
            } else {
                let dataStr = data.content;
                if (dataStr.length > MAX_BINARY_DATA_DISPLAY_CHARS) {
                    dataStr = dataStr.substring(0, MAX_BINARY_DATA_DISPLAY_CHARS) + '...';
                }

                const pre = document.createElement('pre');
                const value = { ...data, content: `${dataStr} <${formatDataSize(b64StrSize(data.content))}>` };
                pre.innerText = JSON.stringify(value, null, 2);
                return pre;
            }
        }
    }

    // application/octet-stream -> hex ?

    const span = document.createElement('span');
    span.appendChild(formatJson(data, options?.jsonFormat ?? DEFAULT_JSON_FORMAT));
    span.className = 'css-treeview';
    return span;
};


async function zipToObject(file, textExtensions = ["txt", "json", "xprjson", "xml", "svg", "html", "css"]) {
    let size = 0;
    let data = null;
    let name = undefined;
    let base64 = false;
    let type = 'application/x-zip-compressed';
    if(file instanceof File) {
        data = file;
        size = file.size;
        name = file.name;
        type = file.type;
    } else if (typeof file ==='string') {
        data = file;
        base64 = true;
    } else {
        type = file.type ?? type;
        name = file.name;
        data = file.content;
        base64 = true;
    }

    if(base64) {
        size = b64StrSize(data);
    }

    let fileSizeFormat = "";
    if (size < 1024) {
        fileSizeFormat = `${size} bytes`;
    } else if (size >= 1024 && size < 1_048_576) {
        fileSizeFormat = `${(size / 1024).toFixed(1)} KB`;
    } else if (size >= 1_048_576) {
        fileSizeFormat = `${(size / 1_048_576).toFixed(1)} MB`;
    }


    const zip = await JSZip.loadAsync(data, { base64 });
    const zipEntries = [];
    zip.forEach((relativePath, zipEntry) => zipEntries.push({relativePath, zipEntry}));

    const entries = await Promise.all(
        zipEntries
            .filter(entry => !entry.relativePath.endsWith('/'))
            .map(async entry => {
                const fileExtension = entry.relativePath.split('.').pop();
                const isBinary = !textExtensions.includes(fileExtension);
                const content = await entry.zipEntry.async(isBinary ? 'base64' : 'text');
                return {
                    name: entry.relativePath, 
                    content,
                    isBinary,
                };
            })
    );

    return {
        type,
        size: fileSizeFormat,
        name,
        entries,
    }
}

function decodeMimeType(mime) {
    if(mime) {
        const trimed = mime.trim();
        if(trimed) {
            const type = trimed.replace(/ *; *charset *=.*/i, '');
            const charsetMatch = trimed.match(/.*; *charset *=(.*)/i);
            const charset = charsetMatch ? charsetMatch[1] : undefined;
            return [type, charset];
        }
    }
    return [undefined, undefined];
}

function stripUndefined(object) {
    return Object.fromEntries(Object.entries(object).filter(([, v]) => v !== undefined));
}