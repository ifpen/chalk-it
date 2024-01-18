angular.module('loginuser', [])
    .run(['$rootScope', '$state', '$stateParams', function ($rootScope, $state, $stateParams) {

        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;


    }])
    .config(['$stateProvider',
        function ($stateProvider) {
            $stateProvider
                .state('login', {
                    notAuthenticate: true,
                    userAuthenticated: false,
                    abstract: true,
                    url: '/login',
                    templateUrl: ''

                });
        }]);
