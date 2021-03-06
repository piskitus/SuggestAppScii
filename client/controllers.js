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

    $scope.register = function () {

         AuthService.GetInfoOneUser('server').then(function (data) {

             e_server = data.data[0].e;
             n_server = data.data[0].n;

      var keys = AuthService.generateKeys(256);
      var e = keys.publicKey.e.toString();
      var n = keys.publicKey.n.toString();
      var d = keys.privateKey.d.toString();
      var verify = false;

      var e_bigInt  = keys.publicKey.e;

       var publicKeyClient = e_bigInt ;

       console.log("esta es la e:"+ e_server);

       AuthService.Blind(publicKeyClient,e_server,n_server)
           .then(function(data) {

               var Key_signed_for_server = data;

               var Key_signed_for_server_String = Key_signed_for_server.toString();
               // initial values
               $scope.error = false;
               $scope.disabled = true;

               var cipher_e = CryptoJS.AES.encrypt(e, $scope.registerForm.password).toString()
               var cipher_n = CryptoJS.AES.encrypt(n, $scope.registerForm.password).toString();
               var cipher_d = CryptoJS.AES.encrypt(d, $scope.registerForm.password).toString();

                var cipher_Key_signed_for_server_String = CryptoJS.AES.encrypt(Key_signed_for_server_String, $scope.registerForm.password).toString();

               // call register from service
               AuthService.register($scope.registerForm.username, $scope.registerForm.password, cipher_e, cipher_n, cipher_d, cipher_Key_signed_for_server_String, verify)
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
         })
             .catch(function (err) {
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


///////////////////


            $scope.desncryptSuggestions = function(id, Key, HashSigned){

                var HashS = bigInt(hash(id,Key)).toString();

                if(HashSigned == HashS){

                    console.log('Esta verificado');


                AuthService.GetInfoOneUser('Boss').then(function (data) {

                    var n_boss_des= data.data[0].n;

                    var n_boss  = CryptoJS.AES.decrypt(n_boss_des.toString(), 'boss').toString(CryptoJS.enc.Utf8);

                    var privateKey = AuthService.mergePartsKey($scope.MakeArray());


                    var suggestBigInt = bigInt (id);

                        var ui = suggestBigInt.modPow(privateKey, n_boss);

                        var ui2 = ui.toString(16);

                        var ui3c = AuthService.hex2a(ui2);

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
                }
                else{
                    console.log('Este mensaje no esta verificado correctamente');
                    $scope.error = true;
                    $scope.errorMessage = "Esta sugerencia no está verificada, puede ser que no sean de un destino fiable";
                    $scope.disabled = false;
                    $scope.suggestForm = {};
                    return
                }

            };


            $scope.MakeArray = function () {

                Arrayparts.push($scope.configForm);

                console.log('Array parts: ' + Arrayparts);
                $scope.configForm = ' ';
                return Arrayparts;

            };



            $scope.MergeKeys= function () {

                var MergedKey = AuthService.mergePartsKey($scope.MakeArray());

                //Pido a la API todos los suggests
                $http.get('user/suggests').success(function(data){

                    $scope.suggets = data;

                })
                    .error(function(data){
                        console.log('Error: ' + data);
                    });

                $scope.TablaSuggestON=true;

                return MergedKey;

            }



        }]);

angular.module('myApp').controller('suggestController',
    ['$scope', '$location', 'AuthService',
        function ($scope, $location, AuthService) {
            // handle success
            var n_boss_des;
            var e_boss_des;


            $scope.suggest = function (name, message) {

                AuthService.GetInfoOneUser('Boss').then(function (data) {

                   e_boss_des = data.data[0].e;
                   n_boss_des = data.data[0].n;

                    var e_boss  = CryptoJS.AES.decrypt(e_boss_des.toString(), 'boss').toString(CryptoJS.enc.Utf8);
                    var n_boss  = CryptoJS.AES.decrypt(n_boss_des.toString(), 'boss').toString(CryptoJS.enc.Utf8);
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


                        var d_user_des = data.data[0].d;
                        var n_user_des = data.data[0].n;
                        var Key_signed_for_server_des = data.data[0].Key_signed_for_server;

                        var d_user  = CryptoJS.AES.decrypt(d_user_des.toString(), AuthService.getUserPass()).toString(CryptoJS.enc.Utf8);
                        var n_user  = CryptoJS.AES.decrypt(n_user_des.toString(), AuthService.getUserPass()).toString(CryptoJS.enc.Utf8);
                        var Key_signed_for_server  = CryptoJS.AES.decrypt(Key_signed_for_server_des.toString(), AuthService.getUserPass()).toString(CryptoJS.enc.Utf8);


                        var message_encrypt = AuthService.encrypt(message, e_boss, n_boss);

                        var HashS = bigInt(hash(message_encrypt.toString(),Key_signed_for_server));

                        var Hash = HashS.modPow(d_user, n_user);


                    AuthService.DoSuggest(message_encrypt.toString(), Key_signed_for_server, HashS.toString(), Hash.toString())
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

                    var d_boss_des =data.data[0].d.toString(16);

                    var secretKey  = CryptoJS.AES.decrypt(d_boss_des, 'boss').toString(CryptoJS.enc.Utf8);


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

                    var e_boss =data.data[0].d;

                    var secretKey  = CryptoJS.AES.decrypt(e_boss.toString(), 'boss').toString(CryptoJS.enc.Utf8);

                    var sharedSecret = secrets.share(secretKey, $scope.configForm.nClave, $scope.configForm.nMin);

                    $scope.SplitsharedSecret =  sharedSecret;


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