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
      console.log('numero e', n_server);

    })
        .error(function (data) {
          console.log('Error: ' + data);
        });

     $scope.register = function () {


      var keys = AuthService.generateKeys(256);
      var e = keys.publicKey.e.toString();
      var n = keys.publicKey.n.toString();
      var d = keys.privateKey.d.toString();
      var verify = false;

      var d_bigInt  = keys.privateKey.d;



       var publicKeyClient = d_bigInt ;
       console.log("esta es la e:"+ e_server);

       AuthService.Blind(publicKeyClient,e_server,n_server)
           .then(function(data) {
               var Key_signed_for_server = data;

               console.log("esta es la d2:"+ d_bigInt );
               console.log("esta es la key firmada por el server: "+ Key_signed_for_server);

               Key_signed_for_server_String = Key_signed_for_server.toString();
               // initial values
               $scope.error = false;
               $scope.disabled = true;

               // call register from service
               AuthService.register($scope.registerForm.username, $scope.registerForm.password, e, n, d, Key_signed_for_server_String, verify)
               // handle success
                   .then(function () {
                       // SI EL REGISTRO SE EFECTUA CORRECTAMENTE, HAGO EL LOGIN DIRECTAMENTE
                       AuthService.login($scope.registerForm.username, $scope.registerForm.password)
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
           })
           .catch(function(err) {
             // Tratar el error
         })



    }

}]);

//###############################################
//####      Controller de usuarios
//###############################################

angular.module('myApp').controller('usersController',
    ['$scope', '$http', 'AuthService',
        function ($scope, $http, AuthService) {

           $scope.newUser = {};
           $scope.users = {};
           $scope.selected = false;


            //Pido a la API todos los usuarios
            $http.get('user/users').success(function(data){
                $scope.users = data;
            })
            .error(function(data){
                console.log('Error: ' + data);
            });

            //Eliminar un Usuario
            $scope.deleteUser = function(id){
                $http.delete('user/users/'+ id)
                    .success(function(data){
                        $scope.newUser={};
                        $scope.users = data;
                        $scope.selected=false;
                        console.log(data);
                    })
                    .error(function(data){
                        console.log('Error: ' + data);
                    });
            };

            //Verificar usuario (update)
            $scope.verifyUser = function (id){
              $http.put('user/update/' + id, $scope.newUser).success(function(data){
                  $scope.newUser = {};
                  $scope.users = data;
                  $scope.selected=false;
                  console.log('Ok: ' + data);
              })
                  .error(function(data){
                      console.log('Error en verifyUser: ' + data);
              });
            };

            $scope.isLoggedInCookies = function () {

                return AuthService.isLoggedInCookies();

            };

            $scope.isAdmin = function () {
                return  'admin' == AuthService.getUserRole();

            };

            $scope.isBoss = function () {
                return  'boss' == AuthService.getUserRole();

            };

            $scope.getUserInfo = function () {

                return AuthService.isLoggedIn() ? AuthService.getUserInfo() : '';

            }

}]);

//###############################################
//####      Controller del Meeting
//###############################################

angular.module('myApp').controller('meetingController',
    ['$scope', '$http','AuthService',
        function ($scope, $http, AuthService) {

            $scope.newSuggest = '(Aquí aparecerán las sugerencias)';
            $scope.suggets = {};
            $scope.selected = false;
            var Arrayparts = [];
           // $scope.configForm ={};


            //Pido a la API todos los suggests
            $http.get('user/suggests').success(function(data){
                $scope.suggets = data;
                console.log(data);
            })
                .error(function(data){
                    console.log('Error: ' + data);
                });

            //Eliminar un Usuario
            $scope.deleteUser = function(id){
                $http.delete('user/users/'+ id)
                    .success(function(data){
                        $scope.newUser={};
                        $scope.users = data;
                        $scope.selected=false;
                        console.log(data);
                    })
                    .error(function(data){
                        console.log('Error: ' + data);
                    });
            };


            $scope.desncryptSuggestions = function(id){

                AuthService.GetInfoOneUser('Boss').then(function (data) {

                    d_boss = data.data[0].d;
                    n_boss = data.data[0].n;


                    var privateKey = AuthService.mergePartsKey($scope.MakeArray());
                    console.log("clave privada"+ privateKey);

                    suggestBigInt = bigInt (id);

                        var ui = suggestBigInt.modPow(privateKey, n_boss);

                        var ui2 = ui.toString(16);

                        var ui3c = AuthService.hex2a(ui2);

                        console.log('Eso es el mensaje desencriptado a string : ' + ui3c);
                                $scope.newSuggest = ui3c;
                                $scope.succes = true;
                                $scope.succesMessage = "Sugerencia desencriptada correctamente";
                                $scope.disabled = false;
                                $scope.suggestForm = {};
                })

                            // handle error
                            .catch(function (err) {
                            $scope.error = true;
                            $scope.errorMessage = "Error al descencriptar las sugerencias";
                            $scope.disabled = false;
                            $scope.suggestForm = {};
                        })

            };

            $scope.MakeArray = function () {

                Arrayparts.push($scope.configForm);

                console.log(Arrayparts);
                return Arrayparts;

            }



            $scope.MergeKeys= function () {

                var MergedKey = AuthService.mergePartsKey($scope.MakeArray());

                console.log(MergedKey);

                return MergedKey;

            }



        }]);

angular.module('myApp').controller('suggestController',
    ['$scope', '$location', 'AuthService',
        function ($scope, $location, AuthService) {
            // handle success
            var n_boss;
            var e_boss;
            var d_boss;


            $scope.suggest = function (name, message) {

                AuthService.GetInfoOneUser('Boss').then(function (data) {

                    e_boss = data.data[0].e;
                    d_boss = data.data[0].d;
                    n_boss = data.data[0].n;
                    AuthService.GetInfoOneUser(name).then(function (data) {
                        if (data.data[0].verify == false)
                        {
                            console.log('Esto no esta verificado');
                            $scope.error = true;
                            $scope.errorMessage = "No estás verificado, contacta con el admin (admin@admin.com)";
                            $scope.disabled = false;
                            $scope.suggestForm = {};
                            return
                        }

                        var d_user = data.data[0].d;
                        var n_user = data.data[0].n;

                        var Key_signed_for_server = data.data[0].Key_signed_for_server;

                    var message_encrypt = AuthService.encrypt(message, e_boss, n_boss);

                    // ESTO HAY QUE QUITARLO SOLO ES PARA QUE SE VEA QUE SE DESCIFRA BIEN :)

                    var ui = message_encrypt.modPow(d_boss, n_boss);

                    var ui2 = ui.toString(16);

                    var ui3c = AuthService.hex2a(ui2);

                    console.log('Eso es el mensaje desencriptado a string : ' + ui3c);
                        ///////////////
                        var HashToSend = bigInt(hash(message_encrypt,Key_signed_for_server));

                        var HashSigned = HashToSend.modPow(d_user, n_user);

                    AuthService.DoSuggest(message_encrypt.toString(), Key_signed_for_server, HashSigned.toString())
                    // handle success
                        .then(function () {
                            $scope.succes = true;
                            $scope.succesMessage = "Sugerencia registrada correctamente";
                            $scope.disabled = false;
                            $scope.suggestForm = {};
                        })
                        // handle error
                        .catch(function () {
                            $scope.error = true;
                            $scope.errorMessage = "Hola que tal esto esta mal >.<";
                            $scope.disabled = false;
                            $scope.suggestForm = {};
                        });
                    $scope.disabled = false;
                    $scope.suggestForm = {};

                })
                    .catch(function (err) {
                        // Tratar el error
                    })
                })
                    .catch(function (err) {
                        // Tratar el error
                    })

            };
            $scope.SplitPrivateKey = function () {

                AuthService.GetInfoOneUser('Boss').then(function (data) {

                var secretKey =data.data[0].d.toString(16);

                console.log('ESTA ES EN HEXA: '+ secretKey);

            })
            .catch(function (err) {
                // Tratar el error
            })


            }

        }]);

angular.module('myApp').controller('configController',
    ['$scope', '$location', 'AuthService',
        function ($scope, $location, AuthService) {
            // handle success

            $scope.SplitPrivateKey = function () {

                AuthService.GetInfoOneUser('Boss').then(function (data) {

                    var secretKey =data.data[0].d;

                    var sharedSecret = secrets.share(secretKey, $scope.configForm.nClave, $scope.configForm.nMin);

                    $scope.SplitsharedSecret =  sharedSecret


                })
                    .catch(function (err) {
                        // Tratar el error
                    })


            };

            $scope.maxNum = function () {

                if($scope.configForm.nClave<$scope.configForm.nMin){
                    $scope.error2 = true;
                    $scope.errorMessage2 = "El mínimo de claves tiene que ser menor que el número de claves "
                    $scope.disabled = false;
                }
                else{
                    $scope.SplitPrivateKey();
                    $scope.success = true;
                    $scope.successMessage = "Se han creado las claves correctamente";
                    $scope.disabled = false;
                }


            }

        }]);