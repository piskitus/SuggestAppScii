var myApp = angular.module('myApp', ['ngRoute']);

myApp.config(function ($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'partials/main.html',
      access: {restricted: false}
    })
      .when('/home', {
        templateUrl: 'partials/home.html',
        access: {restricted: true}
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
      .when('/restringido', {
          template: '<h1>A Esta página solo se puede acceder logueado!</h1>',
          access: {restricted: true}
      })
      .when('/norestringido', {
          template: '<h1>A esta página se puede acceder aunque no estés logueado</h1>',
          access: {restricted: false}
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