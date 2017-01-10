var express     = require('express');
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var passport    = require('passport');
var User        = require('../models/Users').model; // get the mongoose model
var UserServices = require('../models/Users').services;
var jwt         = require('jwt-simple');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt  = require('passport-jwt').ExtractJwt;
var appSecret   = "brokenlinkgenerator";
 
function usePassport(passport) {
  var opts = {};
  opts.secretOrKey = appSecret;
  opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
  passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    User.findOne({id: jwt_payload.id}, function(err, user) {
          if (err) {
              return done(err, false);
          }
          if (user) {
              done(null, user);
          } else {
              done(null, false);
          }
      });
  }));
};

function config(app) {
  // get our request parameters
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
   
  // log to console
  app.use(morgan('dev'));

  // Use the passport package in our application
  app.use(passport.initialize()); 

  // pass passport for configuration
  usePassport(passport); 
};
 
// bundle our routes
var apiRoutes = express.Router();
 
// create a new user account (POST http://localhost:8080/api/signup)
apiRoutes.post('/api/user/create', function(req, res) {
  if (!req.body.name || !req.body.password) {
    res.status(401);
    res.json({success: false, msg: 'Please pass name and password.'});
  } else {
    var newUser = new User({
      name: req.body.name,
      password: req.body.password
    });
    // save the user
    newUser.save(function(err) {
      if (err) {
        res.status(401);
        return res.json({success: false, msg: 'Username already exists.'});
      }
      res.status(200);
      res.json({success: true, msg: 'Successful created new user.'});
    });
  }
});

secure('/api/user/delete');
// create a new user account (POST http://localhost:8080/api/signup)
apiRoutes.post('/api/user/delete', function(req, res) {
  if (!req.body.name) {
    res.json({success: false, msg: 'Please pass name'});
  } else {
    // save the user
    UserServices.delete(req.body.name, function(err, result) {

      if (err) {
        return res.json({success: false, msg: err});
      }
      else if( !result.result.ok ) {
        return res.json({success: false, msg: "unknown error attempting to remove from db." }); 
      }
      else if (!result.result.n) {
        return res.json({success: false, msg: 'No user with supplied Name'});
      }

      res.json({success: true, msg: 'Successfully deleted user'});
    });
  }
});

// route to authenticate a user (POST http://localhost:8080/api/login)
apiRoutes.post('/api/authenticate', function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err) throw err;
 
    if (!user) {
      res.status(401);
      res.send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          var token = jwt.encode(user, appSecret);
          // return the information including token as JSON
          res.json({success: true, token: 'JWT ' + token});
        } else {
          res.status(401);
          res.send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});

// apiRoutes.use('/memberinfo', passport.authenticate('jwt', { session: false}), authenticateRoute);

function authenticateRoute(req, res, next) {
  var token = getToken(req.headers);
  if (token) {
      var decoded = jwt.decode(token, appSecret);
      User.findOne({
        name: decoded.name
      }, function(err, user) {
          if (err) throw err;
   
          if (!user) {
            res.status(401);
            return res.json({success: false, msg: 'Authentication failed. User not found.'});
          } else {
              next();
          }
      });
    } else {
      res.status(401);
      return res.json({success: false, msg: 'No token provided.'});
  }
}

function secure(endPoint) {
  apiRoutes.use(endPoint, passport.authenticate('jwt', { session: false}), authenticateRoute);
}
 
function getToken(headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

module.exports.config = config;
module.exports.routes = apiRoutes;
module.exports.secure = secure;
