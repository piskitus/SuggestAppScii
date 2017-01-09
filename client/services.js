angular.module('myApp').factory('AuthService',
  ['$q', '$timeout', '$http',
  function ($q, $timeout, $http) {

    // create user variable
    var user = null;
    var keyfirmado;

    // return available functions for use in the controllers
    return ({
      isLoggedIn: isLoggedIn,
      getUserStatus: getUserStatus,
      login: login,
      logout: logout,
      register: register,
      generateKeys :generateKeys,
      privateKey:privateKey,
      publicKey:publicKey,
      Blind :Blind,
      DoSuggest:DoSuggest,
      encrypt:encrypt,
      stringToHex:stringToHex,
      hex2a:hex2a,
      GetInfoOneUser:GetInfoOneUser
    });

    function isLoggedIn() {
      if(user) {
        return true;
      } else {
        return false;
      }
    }

    function getUserStatus() {
      return $http.get('/user/status')
      // handle success
      .success(function (data) {
        if(data.status){
          user = true;
        } else {
          user = false;
        }
      })
      // handle error
      .error(function (data) {
        user = false;
      });
    }

    function login(username, password) {

      // create a new instance of deferred
      var deferred = $q.defer();

      // send a post request to the server
      $http.post('/user/login',
        {username: username, password: password})
        // handle success
        .success(function (data, status) {
          if(status === 200 && data.status){
            user = true;
            deferred.resolve();
          } else {
            user = false;
            deferred.reject();
          }
        })
        // handle error
        .error(function (data) {
          user = false;
          deferred.reject();
        });

      // return promise object
      return deferred.promise;

    }

    function logout() {

      // create a new instance of deferred
      var deferred = $q.defer();

      // send a get request to the server
      $http.get('/user/logout')
        // handle success
        .success(function (data) {
          user = false;
          deferred.resolve();
        })
        // handle error
        .error(function (data) {
          user = false;
          deferred.reject();
        });

      // return promise object
      return deferred.promise;

    }

    function register(username, password,  e, n, d, Key_signed_for_server, verifica) {

      // create a new instance of deferred
      var deferred = $q.defer();
      // send a post request to the server
      $http.post('/user/register',
        {username: username, password: password, e:e, n:n, d:d, Key_signed_for_server:Key_signed_for_server, verify:verifica})
        // handle success
        .success(function (data, status) {
          if(status === 200 && data.status){
            deferred.resolve();
          } else {
            deferred.reject();
          }
        })
        // handle error
        .error(function (data) {
          deferred.reject();
        });

      // return promise object
      return deferred.promise;

    }

    function generateKeys (bitlength) {

      var p, q, n, phi, e, d, keys = {};
      this.bitlength = bitlength || 2048;
      console.log("Generating RSA keys of", this.bitlength, "bits");
      p = prime(this.bitlength / 2);
      do {
        q = prime(this.bitlength / 2);
      } while (q.compare(p) === 0);
      n = p.multiply(q);

      phi = p.subtract(1).multiply(q.subtract(1));

      e = bigInt(65537);
      d = bigInt(e).modInv(phi);

      keys.publicKey = new publicKey(this.bitlength, n, e);
      keys.privateKey = new privateKey(p, q, d, keys.publicKey);
      return keys;
    }

    function prime (bitLength) {
      var rnd = bigInt.zero;
      var isPrime = false;
      var two = new bigInt(2);

      while (!isPrime) {
        rnd = bigInt.randBetween(two.pow(bitLength - 1), two.pow(bitLength));
        if (rnd.isPrime()) {
          isPrime = true;
        }
      }
      return new bigInt(rnd);
    }

    function privateKey (p, q, d, publicKey) {
      this.p = p;
      this.q = q;
      this.d = d;
      this.publicKey = publicKey;
    }

    function publicKey (bits, n, e) {
      this.bits = bits;
      this.n = n;
      this.e = e;
    }

    function Blind(Kpub_Cliente,e_server,n_server) {

      var defered = $q.defer();

      console.log('Esta es la clave publica del cliente:',Kpub_Cliente);
      console.log('eee', e_server);
      console.log('nnnn', n_server);

      var bigrandom = makePrime(n_server);

      console.log('biginteger  ' +bigrandom);

      Kpub_Cliente_bigInt = Kpub_Cliente;

      console.log('Kpub_Cliente_bigInt', Kpub_Cliente_bigInt);

      var result = blindmessage(Kpub_Cliente_bigInt,bigrandom,e_server,n_server);

      console.log('clave publica cegada', result);

      $http.post('http://localhost:3000/user/message/blind', {"result" : result.toString(16)}).then(function(response) {

        var keyCegadoFirmado = new bigInt (response.data.signed16,16);

        console.log('clave publica cegada y firmada'+keyCegadoFirmado);

        console.log('n_server:' +n_server + 'bigrandom:  '+ bigrandom);

        var modinverso = bigrandom.modInv(n_server);

        keyfirmado = (keyCegadoFirmado.multiply(modinverso)).mod(n_server);

        console.log('MSG EN HEX: '+keyfirmado);

        var verify = keyfirmado.modPow(e_server,n_server);

        var verifytohex = verify;

        console.log("mi key" +verifytohex);

        defered.resolve(keyfirmado);

      }).catch(function(data) {
            console.log('Error: ' + data);
          });

      return defered.promise;
    }

    function blindmessage (Kpub_Cliente,random,e,n){
      return  (Kpub_Cliente.multiply(random.modPow(e,n))).mod(n);
    }

    function hex2a(hexx) {
      var hex = hexx.toString();//force conversion
      var str = '';
      for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      return str;
    }

    function makePrime(n_server) {

      var prime;

      var num_prime = new bigInt.randBetween(0, n_server);
      prime = num_prime.isPrime();
      while(prime == false)
      {
        num_prime = new bigInt.randBetween(0, n_server);
        prime = num_prime.isPrime();
      }

      return num_prime;

    }

    function DoSuggest(suggest, Key_signed_for_server, HashSigned) {

      // create a new instance of deferred
      var deferred = $q.defer();
      // send a post request to the server
      $http.post('http://localhost:3000/user/suggest', {"suggest":suggest, "Key_signed_for_server": Key_signed_for_server,"HashSigned":HashSigned })
           // handle success
          .success(function (data, status) {
            if(status === 200 && data.status){
              deferred.resolve();
            } else {
              deferred.reject();
            }
          })
          // handle error
          .error(function (data) {
            deferred.reject();
          });

      // return promise object
      return deferred.promise;

    }

    function encrypt(message,e,n) {

      var mhexa = stringToHex(message);

      var m = bigInt (mhexa , 16);

      return m.modPow(e, n);


    }

    function stringToHex (tmp) {
      var str = '',
          i = 0,
          tmp_len = tmp.length,
          c;

      for (; i < tmp_len; i += 1) {
        c = tmp.charCodeAt(i);
        str += d2h(c);
      }
      return str;
    }

    function d2h(d) {
      return d.toString(16);
    }

    function hex2a(hexx) {
      var hex = hexx.toString();//force conversion
      var str = '';
      for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));

      return str;
    }

    function GetInfoOneUser(name) {

      var deferred = $q.defer();

      $http.get('user/userdetail/' + name).then(function (data) {

       deferred.resolve(data);

      })
          .catch(function (data) {
            console.log('Error: ' + data);
          });

      return deferred.promise;

  }


  }]);