// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ starter-browser-compatibility                                      │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

(function () {
  // from utils.js. To refactor
  function checkES9() {
    // ES 2018
    // Check Object Spread Properties
    // var a = {a:1}, b = {b:2}, c = { ...a, ...b }; var { ...d } = c;
    'use strict';

    try {
      eval('var a = {a:1}, b = {b:2}, c = { ...a, ...b }; var { ...d } = c;');
    } catch (e) {
      return false;
    }
    return true;
  }

  //stop fct
  window.arret = function () {
    try {
      window.stop();
    } catch (exception) {
      document.execCommand('Stop');
    }
  };

  // MBG : On va demander un support ES6 +
  // Voir https://www.w3schools.com/js/js_versions.asp
  // Voir https://en.wikipedia.org/wiki/Google_Chrome_version_history

  var minChromeVersion = 85;
  var minFirefoxVersion = 78;
  var minSafariVersion = 13;
  var minEdgeVersion = 88;

  //find browser and version fct
  function get_browser() {
    var ua = navigator.userAgent,
      tem,
      M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
      tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
      return { name: 'IE', version: tem[1] || '' };
    }
    if (M[1] === 'Chrome') {
      tem = ua.match(/\bOPR\/(\d+)/);
      //if (tem != null) { return { name: 'Opera', version: tem[1] }; }
      if (tem != null) {
        return { name: tem[1].replace('OPR', 'Opera'), version: tem[2] };
      }
      tem = ua.match(/\bEdge\/(\d+)/);
      if (tem != null) {
        return { name: 'Edge', version: tem[1] };
      }
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) {
      M.splice(1, 1, tem[1]);
    }
    return {
      name: M[0],
      version: M[1],
    };
  }

  //Prepare html page for message
  function preprocessPage() {
    // This is needed for now with newer version of chrome in order to display the DOM after window.stop()
    // the other solution is to use document.execCommand('Stop') instead
    document.open('text/html');
    document.writeln('<html></html>');
    document.close();
    //

    window.arret();
    document.clear();
    if (document.body == null) {
      document.body = document.createElement('body');
    }

    Mymessage =
      '<div style="margin:100px">' +
      '   <h2 style="text-align:center">' +
      title +
      '</h2>' +
      '   <p style="text-align:center">' +
      text1 +
      '</p>' +
      '   <p style="text-align:center">' +
      text2 +
      '</p>' +
      '</div>';
    document.body.innerHTML = Mymessage;
  }

  var browser = get_browser();

  var title = '';
  var text1 = '';
  var text2 = '';

  /*if ((browser.name === "Chrome" && parseInt(browser.version) < minChromeVersion) ||
        (browser.name === "Firefox" && parseInt(browser.version) < minFirefoxVersion) ||
        (browser.name === "Safari" && parseInt(browser.version) < minSafariVersion) ||
        (browser.name === "Edge" && parseInt(browser.version) < minEdgeVersion)) {*/
  if (!checkES9()) {
    // MBG 06/07/2021
    title = 'This version of "' + browser.name + '" is not compatible with Chalk\'it!';
    text1 = "Chalk'it loading is interrupted.";
    text2 = 'Please try with a recent version of ' + browser.name + ' than "v' + browser.version + '".';
    preprocessPage(title, text1, text2);
  } else if (
    browser.name !== 'Chrome' &&
    browser.name !== 'Firefox' &&
    browser.name !== 'Safari' &&
    browser.name != 'Edge'
  ) {
    //title = 'This browser "' + browser.name + '" is not compatible with Chalk\'it!';
    //text1 = 'Chalk\'it loading is interrupted.';
    //text2 = 'Please try with a recent version of Chrome, Firefox, Safari or Edge.';
    //preprocessPage(title, text1, text2);
  }
})();
