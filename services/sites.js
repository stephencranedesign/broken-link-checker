var Sites = require('../models/Sites.js');
var mongoose = require('mongoose'); // for drop function
var Promise = require('bluebird');

module.exports.findOneAndUpdate = function(query, update) {
    return Sites.findOneAndUpdate(query, update);
};

module.exports.create = function(site) {
    return Promise.resolve(Sites.create(site));
};

module.exports.findOne = function(query, filter) {
    return Sites.findOne(query, filter);
};

module.exports.update = function(query, update) {
    return Sites.update(query, update);
};

module.exports.find = function(query) {
    return Sites.find(query);
};

module.exports.remove = function(query, callback, errback) {

    if(query.host === null || query.host === 'all') query = { user: query.user };
    return Sites.remove(query);

};

module.exports.drop = function(callback) {
    Sites.remove(function(err, p){
        callback(err);
    });
};