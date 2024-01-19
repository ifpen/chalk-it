function FreeboardUI() {
  const loadingIndicator = $(
    '<div class="wrapperloading"><div class="loading up" ></div><div class="loading down"></div></div>'
  );
  const loadingOverlay = $('<div id="loading-overlay">');
  let loadingDiv = $('');

  function showLoadingIndicator(show) {
    angular
      .element(document.body)
      .injector()
      .invoke(['$rootScope', function ($rootScope) {}]);
    const $rootScope = angular.element(document.body).scope().$root; // 1
    loadingDiv = $rootScope.xDashFullVersion ? loadingIndicator : loadingIndicator.add(loadingOverlay);

    if (show) {
      $rootScope.loadingBarStart();
      loadingDiv.fadeOut(0).appendTo('body').fadeIn(500);
    } else {
      $rootScope.loadingBarStop();
      loadingDiv.fadeOut(500).remove();
    }
  }

  // Public Functions
  return {
    showLoadingIndicator: function (show) {
      showLoadingIndicator(show);
    },
  };
}
