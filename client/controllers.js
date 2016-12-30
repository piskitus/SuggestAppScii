angular.module('myApp').controller('loginController',
  ['$scope', '$location', 'AuthService',
  function ($scope, $location, AuthService) {

    $scope.login = function () {


      // initial values
      $scope.error = false;
      $scope.disabled = true;

      // call login from service
      AuthService.login($scope.loginForm.username, $scope.loginForm.password)
        // handle success
        .then(function () {
          $location.path('/home');
          $scope.disabled = false;
          $scope.loginForm = {};
        })
        // handle error
        .catch(function () {
          $scope.error = true;
          $scope.errorMessage = "Invalid username and/or password";
          $scope.disabled = false;
          $scope.loginForm = {};
        });

    };

}]);

angular.module('myApp').controller('logoutController',
  ['$scope', '$location', 'AuthService',
  function ($scope, $location, AuthService) {

    $scope.logout = function () {

      // call logout from service
      AuthService.logout()
        .then(function () {
          $location.path('/main');
        });

    };

}]);

angular.module('myApp').controller('registerController',
  ['$scope', '$location', 'AuthService', '$http',
  function ($scope, $location, AuthService, $http) {

    var n_server;
    var e_server;

    $http.get('http://localhost:3000/user/keys').success(function (data) {

      n_server = bigInt(data.n);
      e_server = bigInt(data.e);
      console.log('numero n', n_server);

    })
        .error(function (data) {
          console.log('Error: ' + data);
        });

     $scope.register = function () {


      var keys = AuthService.generateKeys(256);
      var e = keys.publicKey.e.toString(16);
      var n = keys.publicKey.n.toString(16);
      var d = keys.privateKey.d.toString(16);

      var e_bigInt = new bigInt(keys.publicKey.e.toString(16),16);
      var n_bigInt  = new bigInt(keys.publicKey.n.toString(16),16);
      var d_bigInt  = new bigInt(keys.privateKey.d.toString(16),16);


       var publicKeyClient = d_bigInt ;
       console.log("esta es la e:"+ e_server);

       var Key_signed_for_server = AuthService.Blind(publicKeyClient,e_server, n_server);

       console.log("esta es la d2:"+ d_bigInt );
       console.log("esta es la d: "+ Key_signed_for_server);
       // initial values
       $scope.error = false;
       $scope.disabled = true;

      // call register from service
      AuthService.register($scope.registerForm.username, $scope.registerForm.password, e, n, d)
      // handle success
          .then(function () {
            $location.path('/login');
            $scope.disabled = false;
            $scope.registerForm = {};
          })
          // handle error
          .catch(function () {
            $scope.error = true;
            $scope.errorMessage = "Something went wrong!";
            $scope.disabled = false;
            $scope.registerForm = {};
          });

    }

}]);