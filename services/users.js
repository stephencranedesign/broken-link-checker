var Users = require('../models/Users.js');

function set(name, password, callback, errback) {
    console.log('set: ', name, password);
    get(name, password, function(user) {

        if(user !== false) {
            console.log('user already exists');
            callback('user already exists');
            return;
        }

        console.log('test', name, password);

        Users.create({ username: name, password: password }, function(err, user) {
            if (err) {
                errback(err);
                return;
            };

            callback(user.username);
            return;
        });
    }, function(err) {
        errback(err);
    });
};

function get(name, password, callback, errback) {
    Users.findOne({username: name, password: password}).lean().exec(function(err, user) {
        if(err) {
            errback(err);
            return;
        }

        console.log('get: ', user, !user);
        if(!user) callback(false);
        else callback(user.username);
    });
};

module.exports.set = set;
module.exports.get = get;
module.exports.list = function(callback, errback) {
    Users.find(function(err, items) {
        if (err) {
            errback(err);
            return;
        }
        callback(items);
        // mongoose.disconnect();
    });
};