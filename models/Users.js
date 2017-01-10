var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
 
// Thanks to http://blog.matoski.com/articles/jwt-express-node-mongoose/
 
// set up a mongoose model
var UserSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

var preIndexQueue = [],
    indexed = false;

/* rework this to solve error.. */
UserSchema.pre('save', function (next) {
    var user = this;

    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                if(!indexed) preIndexQueue.push(user);
                next();
            });
        });
    } else {
        return next();
    }
});
 
UserSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

var User = mongoose.model('User', UserSchema);

User.on('index', function(err) {
  if (err) {
    return console.error(err);
  }

  indexed = true;
  preIndexQueue.forEach(reSave);
});

function reSave(err) {
    if (err) {
        return console.log(err);
    }
}

// user services
var services = {};
services.delete = function(name, callback) {
    User.remove({ name: name }, callback);

    // User.remove({ name: name }, function(err, result) {
    //     if(err || !result.ok) {
    //         return callback(err, result);
    //     }


    // });
};

services.drop = function(callback) {
    User.remove(function(err, p){
        callback(err);
    });
};
 
module.exports.model = User;
module.exports.services = services;