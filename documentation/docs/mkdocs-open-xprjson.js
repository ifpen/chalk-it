
var xdashAddr = "";
var xdashDocAddr = "";
var connectString = "";
var bIsBasicVersion = false;
// please don't remove this line because it used by gulp to inject the new value of the above declarations **

xdashAddr = xdashAddr + "index.html";

// ensure protocol coherency to avoid browser security blocking
var currentProtocol = location.protocol;
if (!xdashDocAddr.includes(currentProtocol)) {
    var xdashDocAddrUrl = new URL(xdashDocAddr);
    var linkProtocol = xdashDocAddrUrl.protocol;
    xdashDocAddr = xdashDocAddr.replace(linkProtocol, currentProtocol);
}
if (!xdashAddr.includes(currentProtocol)) {
    var xdashAddrUrl = new URL(xdashAddr);
    var linkProtocol = xdashAddrUrl.protocol;
    xdashAddr = xdashAddr.replace(linkProtocol, currentProtocol);
}

function openXprjsonInNewTab(resource) {
    addr = xdashAddr + "?projectUrl=" + resource;
    window.open(addr, '_blank');
}

function handleXprjson(doc) {
    var anchors = doc.getElementsByTagName('a');
    var href;
    for (var i = 0; i < anchors.length; i++) {
        href = anchors[i].href;
        href = href.replace(location.origin, xdashDocAddr);
        if (href.includes('.full.xprjson') && bIsBasicVersion) {
            anchors[i].removeAttribute("href");
            anchors[i].setAttribute('style', 'color: #7f8c8d;');
        } else if (href.includes('xprjson')) {
            anchors[i].removeAttribute("href");
            anchors[i].setAttribute('onclick', 'openXprjsonInNewTab("' + href + '");');
            anchors[i].setAttribute('style', 'text-decoration: underline; cursor: pointer; padding: 5px 20px; background-color: #f8f8f8;');
            anchors[i].innerHTML = '<i class="fas fa-edit">&nbsp;</i>' + anchors[i].textContent;
        } else if ((href.includes('.js')) || (href.includes('.zip')) || (href.includes('.py'))) {
            anchors[i].setAttribute("href", href);
            anchors[i].setAttribute("target", "_blank");
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    var doc = document;
    handleXprjson(doc);
});