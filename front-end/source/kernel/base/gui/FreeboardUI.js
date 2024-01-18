function FreeboardUI() {

  function showLoadingIndicator(show) {
    const $rootScope = angular.element(document.body).scope().$root; // 1
    if (show) {
      $rootScope.loadingBarStart();
    } else {
      $rootScope.loadingBarStop();
    }
  }

  // Public Functions
  return {
    showLoadingIndicator,
  };
}
