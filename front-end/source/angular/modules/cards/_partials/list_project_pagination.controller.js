// ┌───────────────────────────────────────────────────────────────────────────┐ \\
// │ list_project_pagination.controller                                        │ \\
// ├───────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                               │ \\
// | Licensed under the Apache License, Version 2.0                            │ \\
// ├───────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI                         │ \\
// └───────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'underscore';

angular.module('modules.cards').controller('ListProjectPaginationController', [
  '$scope',
  '$rootScope',
  function ($scope, $rootScope) {
    const $scopeCards = angular.element(document.getElementById('cards-ctrl')).scope();

    /*---------- changePage ----------------*/
    $scope.changePage = function (index) {
      $rootScope.pagination.currentPage = index;
      $scopeCards.currentPage = index;
      $rootScope.pagination.startData = index * $scopeCards.perPage;
      $rootScope.pagination.endData = index * $scopeCards.perPage + $scopeCards.perPage;
    };

    /*---------- changePreviousPage ----------------*/
    $scope.changePreviousPage = function () {
      if ($rootScope.pagination.currentPage > 0) {
        $rootScope.pagination.currentPage--;
        $scope.changePage($rootScope.pagination.currentPage);
      }
    };

    /*---------- changeNextPage ----------------*/
    $scope.changeNextPage = function () {
      if ($rootScope.pagination.currentPage < $rootScope.pagination.totalPages - 1) {
        $rootScope.pagination.currentPage++;
        $scope.changePage($rootScope.pagination.currentPage);
      }
    };

    /*---------- changePerPage ----------------*/
    function _initPagination() {
      let val = 1;
      if (!_.isUndefined($scope.allFilesWithNoGrp[0])) {
        if (!_.isUndefined($scope.allFilesWithNoGrp[0].FileList)) {
          val = $scope.allFilesWithNoGrp[0].FileList.length;
        }
      }
      $rootScope.pagination = {
        Fmin: $scopeCards.Fmin,
        Fmax: $scopeCards.perPage,
        length: val,
        currentPage: $scopeCards.currentPage,
        startData: 0,
        endData: $scopeCards.perPage,
        totalPages: Math.ceil(val / $scopeCards.perPage),
        listPages: Array.apply(null, {
          length: Math.ceil(val / $scopeCards.perPage),
        }).map(Number.call, Number),
      };
    }

    $scope.changePerPage = function (perP) {
      $scopeCards.perPage = perP;
      _initPagination();
    };

    $scope.changePerPage($scopeCards.perPage);
  },
]);
