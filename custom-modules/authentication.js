var express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    Users = require('../models/Users');

var bodyParser = require('body-parser');
var session = require('express-session');

passport.use(new LocalStrategy(
  function(username, password, done) {
    console.log('yo dawg');
     Users.findOne({ username: username }, function (err, user) {
      console.log('info: ', user);
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

router.post('/login', passport.authenticate('local', { 
  successRedirect: '/',
  failureRedirect: '/login.html' 
  })
);

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/login.html');
});


module.exports.config = function(app) {
  app.use(bodyParser.json());
  app.use(session({ 
    resave: false,
    saveUninitialized: false,
    secret: 'keyboard cat' 
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(router);
};


// As with any middleware it is quintessential to call next()
// if the user is authenticated
module.exports.isAuthenticated = function(loginPath, loginEndPoint) {
  loginPath = loginPath || '/login.html';
  loginEndPoint = loginEndPoint || '/login';

  return function(req, res, next) {
    console.log('url: ', req.url, loginPath, loginEndPoint);
    if(req.url === loginPath || req.url === loginEndPoint || req.isAuthenticated()) { console.log('move along'); return next(); }
    res.redirect('/login.html');
  };
};