// +--------------------------------------------------------------------+ \\
// ¦ htmlExport                                                         ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Copyright © 2016-2023 IFPEN                                        ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  ¦ \\
// +--------------------------------------------------------------------+ \\

var htmlExport = (function () {
  var exportOptions = 'ajustToTargetWindow';
  var checkExportOptions = true;
  var navBarNotification = false;
  var is_xDash = true;
  /*--------create html doc--------*/
  var createHtmlDoc = function (headText, bodyText, doc_impl, dashboardName) {
    var dt = doc_impl.createDocumentType('html', null, null),
      doc = doc_impl.createDocument(null, 'html', dt),
      doc_el = doc.documentElement,
      head = doc_el.appendChild(doc.createElement('head')),
      title = head.appendChild(doc.createElement('title')),
      charset_meta = head.appendChild(doc.createElement('meta')),
      body = doc_el.appendChild(doc.createElement('body'));
    body.setAttribute('ng-app', 'xCLOUD');

    doc_el.setAttribute('lang', 'en');

    title.appendChild(doc.createTextNode(dashboardName));
    charset_meta.setAttribute('charset', window.document.characterSet);
    charset_meta.setAttribute('name', 'viewport');
    charset_meta.setAttribute('content', 'width=device-width, initial-scale=1');

    var headNext = window.document.createElement('head');
    headNext.innerHTML = headText;
    var bodyNext = window.document.createElement('body');
    bodyNext.innerHTML = bodyText;

    for (var j = 0; j < headNext.childNodes.length; j++) {
      head.appendChild(doc.importNode(headNext.childNodes.item(j), true));
    }
    for (var i = 0; i < bodyNext.childNodes.length; i++) {
      body.appendChild(doc.importNode(bodyNext.childNodes.item(i), true));
    }

    var cleanedHTML = emptyDashboardDiv();
    body.appendChild(doc.importNode(cleanedHTML, true));

    return doc;
  };

  /*--------emptyDashboardDiv--------*/
  function emptyDashboardDiv() {
    var dashDiv = document.createElement('div');
    dashDiv.setAttribute('id', 'dashboard-zone');
    dashDiv.setAttribute('class', 'panel-body');
    dashDiv.setAttribute('style', 'padding: 0px');
    dashDiv.innerHTML =
      '<div id="DropperDroitec" class="dropperR" ng-app="xCLOUD"></div>';
    return dashDiv;
  }

  /*--------copy Head Content--------*/
  function copyHeadContent() {
    var scriptHeaderList = [];
    for (var t = 0; t < exportHeaderCss.length; t++) {
      var _urlBaseForExport = xDashConfig.urlBaseForExport;
      //AEF: fix bug in url css. commented for now to see what was it used for
      // if (exportHeaderCss.length < 2) {
      //     _urlBaseForExport = xDashConfig.urlBaseForExport + "assets/";
      // }
      scriptHeaderList.push(
        '<link rel="stylesheet" href="' + _urlBaseForExport + '' + exportHeaderCss[t] + '"></link>'
      );
    }
    for (t = 0; t < exportHeaderJs.length; t++) {
      scriptHeaderList.push(
        '<script charset="UTF-8" src="' + xDashConfig.urlBaseForExport + exportHeaderJs[t] + '"></script>'
      );
    }

    return scriptHeaderList.join('\n');
  }

  /*--------copy Body Content--------*/
  function copyBodyContent(xdashPrj) {
    var bodyText = '';
    var bodyText0 = [];
    var bodyText1 = [];
    var bodyText2 = [];
    var bodyText3 = [];
    var bodyText4 = [];

    let navBarNotification = htmlExport.navBarNotification;
    let showNavBar;

    if (!_.isUndefined(xdashPrj.navBarNotification)) {
      navBarNotification = xdashPrj.navBarNotification;
    }

    for (var t = 0; t < exportBodyJs.length; t++) {
      bodyText0.push('<script src="' + xDashConfig.urlBaseForExport + exportBodyJs[t] + '"></script>');
    }

    var jsonContent = 'jsonContent = ' + JSON.stringify(xdashPrj, null, '  ');

    if (xdashPrj.exportOptions == 'rowToPage' || xdashPrj.exportOptions == 'rowToTab') {
      showNavBar = true;
    } else {
      showNavBar = navBarNotification;
    }

    bodyText1.push(
      '',
      '<script>',
      '',
      'tabActive = "play";',
      'execOutsideEditor = true;',
      'urlBase = "' + xDashConfig.urlBaseForExport + '";',
      'navBarNotification = "' + navBarNotification + '" ;',
      'showNavBar = "' + showNavBar + '" ;',
      '$(function()',
      '{',
      ''
    );
    var bodyTextJson = '' + jsonContent + ';';
    bodyText2.push('');

    bodyText3.push('reconstructFoundations.loadXprjson(jsonContent);', '});', '</script>', '');

    if (showNavBar) {
      bodyText4.push(...runtimeToolbar.toolbar);
    }

    bodyText =
      bodyText0.join('\n') +
      bodyText1.join('\n') +
      bodyTextJson +
      bodyText2.join('\n') +
      bodyText3.join('\n') +
      bodyText4.join('\n');

    return bodyText;
  }

  /*--------create dashboard document--------*/
  function createDashboardDocument(name, xprjson) {
    var view = window;
    var docmt1 = view.document;
    var doc_impl = docmt1.implementation;
    var headText = copyHeadContent();
    var xdashPrj;
    if (_.isUndefined(xprjson)) {
      xdashPrj = xdash.serialize();
    } else {
      xdashPrj = xprjson;
    }
    var bodyText = copyBodyContent(xdashPrj);
    var doc = createHtmlDoc(headText, bodyText, doc_impl, name);
    var xml_serializer = new XMLSerializer();
    var txt = xml_serializer.serializeToString(doc);
    return txt;
  }

  /*--------preview dashboard--------*/
  function previewDashboard(xprjson, projectName, bNoExportModal) {
    const $rootScope = angular.element(document.body).scope().$root;
    const _projectName = $rootScope.xDashFullVersion ? projectName : $('#projectName').val() || 'Untitled';
    let param;
    if (!_.isUndefined(xprjson) && !_.isUndefined(_projectName)) {
      param = [xprjson, _projectName];
    }
    if (htmlExport.checkExportOptions || bNoExportModal) previewDashboardCallback(param);
  }

  /*--------save dashboard--------*/
  function saveDashboard() {
    saveDashboardCallback();
  }

  /*--------preview dashboard Callback--------*/
  function previewDashboardCallback(param) {
    var dashboardName;

    var xprjson;
    var projectName;
    if (!_.isUndefined(param)) {
      xprjson = param[0];
      projectName = param[1];
    }
    if (!_.isUndefined($('#select-export-settings')[0])) {
      htmlExport.exportOptions = $('#select-export-settings')[0].value;
    }
    if (!_.isUndefined($('#check-scale-export')[0])) {
      htmlExport.checkExportOptions = $('#check-scale-export')[0].checked;
    }
    if (_.isUndefined(projectName)) dashboardName = $('#projectName')[0].value;
    else dashboardName = projectName;

    var tab = window.open('about:blank', '_blank');
    var txt = createDashboardDocument(dashboardName, xprjson);
    tab.document.write(txt);
    tab.document.close();
    tab.focus();        
  }

  /*--------save Dashboard Callback--------*/
  function saveDashboardCallback() {
    //AEF: only for server
    var dashboardName = $('#projectName')[0].value;
    if (!_.isUndefined($('#select-export-settings')[0])) {
      htmlExport.exportOptions = $('#select-export-settings')[0].value;
    }
    if (!_.isUndefined($('#check-scale-export')[0])) {
      htmlExport.checkExportOptions = $('#check-scale-export')[0].checked;
    }

    selectDashboardName(dashboardName);
  }

  /*--------select Dashboard Name Settings--------*/
  function selectDashboardName(dashboardName) {
    var $body = angular.element(document.body);
    var $rootScope = $body.scope().$root;
    // $rootScope.infoPage.exportPage = true;
    // $rootScope.infoPage.name = dashboardName;
    // $rootScope.infoPage.title = "HTML page export";
    // $rootScope.infoPage.btnTxt = "Save";
    // $rootScope.infoPage.isPrivatePage = $rootScope.securedLink ? "True" : "False";
    // $rootScope.infoPage.isManagePageOpen = true;
    $rootScope.infoPage = {
      isPrivatePage: $rootScope.securedLink === 'True' ? true : false,
      name: dashboardName,
      title: 'HTML page export',
      btnTxt: 'Save',
      exportPage: true,
      isManagePageOpen: true,
    };

    //$rootScope.infoPage.isManagePageOpen = true;
  }

  /*--------select Dashboard Name Settings--------*/
  function selectDashboardNameOld(dashboardName) {
    swal.close();
    var fileType = 'page';
    setTimeout(function () {
      swal(
        {
          title: 'HTML File name',
          text: 'Save as',
          type: 'input',
          showConfirmButton: false,
          showConfirmButton1: true,
          showCancelButton: true,
          closeOnConfirm: false,
          closeOnConfirm1: false,
          confirmButtonText: 'Save',
          inputPlaceholder: 'please write file name here ...',
          inputValue: dashboardName,
        },
        function (inputValue) {
          if (inputValue === false) {
            return false; //cancel button
          }
          if (inputValue === '') {
            //empty input then ok button
            swal.showInputError('File name is required!');
            return false;
          }
          //here when input is not empty then ok button
          if (inputValue != null) {
            var txt = createDashboardDocument(dashboardName);
            if (is_xDash) datanodesManager.showLoadingIndicator(true);
            fileManager.getFileListExtended(fileType, inputValue, txt);
          }
        }
      );
    }, 200);
  }

  return {
    previewDashboardCallback: previewDashboardCallback,
    previewDashboard: previewDashboard,
    saveDashboard: saveDashboard,
    exportOptions: exportOptions,
    checkExportOptions: checkExportOptions,
    navBarNotification: navBarNotification,
    createDashboardDocument: createDashboardDocument,
  };
})();
