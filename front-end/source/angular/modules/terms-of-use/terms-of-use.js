angular.module('termsofuse', [])
    .config(['$stateProvider',
        function ($stateProvider) {
            $stateProvider
                .state('termsofuse', {
                    notAuthenticate: true,
                    userAuthenticated: false,
                    abstract: true,
                    url: '/termsofuse',
                    templateUrl: ''

                });
        }]);
