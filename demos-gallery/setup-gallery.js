function setupGallery(demosArray, demoCategoryArray, demoCaptionArray) {

    var chalkitWebSiteXprjson = "https://ifpen.github.io/chalk-it/xprjson";
    var chalkitEditor = "https://ifpen.github.io/chalk-it/hosted/index.html?projectUrl=" + chalkitWebSiteXprjson + '/';
    var chalkitViewer = "https://ifpen.github.io/chalk-it/hosted/index-view-2.720.8520.html?projectUrl=" + chalkitWebSiteXprjson + '/';
    var divDemo = ''

    function addCategories(cats) {
        var fc = '';
        for (var k = 0; k < cats.length; k++) {
            fc = fc + 'filter-' + cats[k] + ' ';
        }
        return fc;
    }

    demosTitleArray = demosArray;

    for (i = 0; i < demosArray.length; i++) {
        divDemo = divDemo +
            '<div class="col-lg-4 col-md-6 portfolio-item ' + addCategories(demoCategoryArray[i]) + '">' +
            '  <div class="portfolio-wrap">' +
            '      <h4>' + demosTitleArray[i] + '</h4>' +
            '    <img src="demos-gallery/portfolio/' + demosArray[i] + '.jpg" class="img-fluid" alt="">' +
            '    <div class="portfolio-info">' +
            '      <p></p>' +
            '    </div>' +
            '  </div>' +
            '  <div style="text-align: center; background: #ecf5ff">' +
            '    <a href="' + chalkitViewer + demosArray[i] + '.xprjson"' +
            '      target="_blank" data-title="' + demosArray[i] + '" class="link-preview" title="Preview" style="margin-right: 24px">' +
            '      <span>Preview <i class="ion ion-eye"></i></span>' +
            '    </a>' +
            '    <a href="' + chalkitEditor + demosArray[i] + '.xprjson"' +
            '      target="_blank" class="link-details" title = "Edit" style="margin-left: 24px">' +
            '      <span>Edit <i class="ion ion-android-open"></i></span>' +
            '    </a > ' +
            '  </div>' +
            '<p style="font-size: 14px">' + demoCaptionArray[i] + '</p>' +
            '</div>';
    }
    var demoZone = document.getElementById('demo-portfolio');
    demoZone.innerHTML = divDemo;
}