var express = require('express');
var router = express.Router();
var passport = require('passport');
var bignum = require('bignum');

var User = require('../models/user.js');
var rsa_bignum = require('./rsa_bignum');

var d_Server = 75539539486598939391725124021581790869928610987864855829286443664541239505145;
var n_Server = 86862385502565790976514886707414917855848516922400707585729953267658893907197;
var e_Server = 65537;

router.get('/keys', function (req, res, next) {

  res.json({

    n: n_Server.toString(),
    e: e_Server.toString()

  });

});


//################################################################
//####    GET de todos los usuarios de la base de datos
//################################################################

router.get('/users', function (req, res) {
  User.find(
      function(err,users){
        if(err){
          res.send(err);
        }
        res.json(users);
      }
  );
});

//################################################################
//####    DELETE de un usuario de la base de datos
//################################################################

router.delete('/users/:user_id', function (req, res) {
  User.remove({_id: req.params.user_id}, function (err, user) {
    if (err) {
      res.send(err);
    }
    User.find(function (err, users) {
      if (err) {
        res.send(err)
      }
      res.json(users)
    });
  });
});




router.post('/register', function(req, res) {
  User.register(new User({ username: req.body.username, e:req.body.e, n: req.body.n, d: req.body.d, Key_signed_for_server: req.body.Key_signed_for_server}),
    req.body.password, function(err, account) {

    if (err) {
      return res.status(500).json({
        err: err
      });
    }
    passport.authenticate('local')(req, res, function () {
      return res.status(200).json({
        status: 'Registration successful!'
      });
    });
  });
});

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        err: info
      });
    }
    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).json({
          err: 'Could not log in user'
        });
      }
      res.status(200).json({
        status: 'Login successful!'
      });
    });
  })(req, res, next);
});

router.get('/logout', function(req, res) {
  req.logout();
  res.status(200).json({
    status: 'Bye!'
  });
});

router.get('/status', function(req, res) {
  if (!req.isAuthenticated()) {
    return res.status(200).json({
      status: false
    });
  }
  res.status(200).json({
    status: true
  });
});

router.post('/message/blind', function (req, res, next) {
  var d = d_Server;
  var n = n_Server;

  console.log('d del server: '+ d_Server+ "  n:  "+ n_Server);
  console.log('req: ', req.body.result);

  var message = req.body.result;

  console.log('Clave publica cegada', message);

  var mensajebignum = bignum (message, 16);

  console.log('Clave publica en bignum', mensajebignum);

  var mesfirma = mensajebignum.powm(d, n);

  console.log('mensaje firmado', mesfirma);

  res.status(200).send({signed:mesfirma.toString(),signed16:mesfirma.toString(16)});
});


module.exports = router;