var Sites = require('../models/Sites.js');
var mongoose = require('mongoose'); // for drop function
var Promise = require('bluebird');

module.exports.findOneAndUpdate = function(query, update) {
    console.log('update: ', update);
    return Sites.findOneAndUpdate(query, update);
};

module.exports.create = function(site) {
    return Promise.resolve(Sites.create(site));
};

module.exports.findOne = function(query) {
    return Sites.findOne(query);
};

module.exports.update = function(query, update) {
    return Sites.update(query, update);
};

module.exports.list = function(user, callback, errback) {
    var query = { user: user };
    if(user === 'all') query = {};

    console.log('list: ', query);
    return Sites.find(query);
};

module.exports.remove = function(query, callback, errback) {

    if(query.url === null || query.url === 'all') query = { user: query.user };
    return Sites.remove(query);

};

module.exports.drop = function(callback) {
    Sites.remove(function(err, p){
        callback(err);
    });
};