var myApp = angular.module('myApp', ['ngRoute','ngCookies']);

myApp.config(function ($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'partials/main.html',
      access: {restricted: false}
    })
      .when('/home', {
        templateUrl: 'partials/home.html',
        access: {restricted: false}
      })
    .when('/login', {
      templateUrl: 'partials/login.html',
      controller: 'loginController',
      access: {restricted: false}
    })
    .when('/logout', {
      controller: 'logoutController',
      access: {restricted: true}
    })
    .when('/register', {
      templateUrl: 'partials/register.html',
      controller: 'registerController',
      access: {restricted: false}
    })
      .when('/users', {
          templateUrl: 'partials/users.html',
          controller: 'usersController',
          access: {restricted: true}
      })
      .when('/suggest', {
          templateUrl: 'partials/suggest.html',
          controller: 'suggestController',
          access: {restricted: true}
      })
      .when('/config', {
          templateUrl: 'partials/config.html',
          controller: 'configController',
          access: {restricted: true}
      })
      .when('/meeting', {
          templateUrl: 'partials/meeting.html',
          controller: 'meetingController',
          access: {restricted: true}
      })
    .otherwise({
      redirectTo: '/'
    });
});

myApp.run(function ($rootScope, $location, $route, AuthService) {
  $rootScope.$on('$routeChangeStart',
    function (event, next, current) {
      AuthService.getUserStatus()
      .then(function(){
        if (next.access.restricted && !AuthService.isLoggedIn()){
          $location.path('/login');
          $route.reload();
        }
      });
  });
});