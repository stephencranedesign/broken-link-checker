var Resources = require('../models/Resources.js');
var mongoose = require('mongoose'); // for drop function
var Promise = require('bluebird');

module.exports.findOneAndUpdate = function(user, resource, callback, errback) {
	Resources.findOneAndUpdate({ _id: resource._id, user: user }, resource, { upsert: true }, function(err, doc) {
		if(err) {
			errback(err);
			return;
		}

		callback(doc);
	});
};

/* update */
module.exports.update = function(find, set, callback) {
	return new Promise(function(resolve, reject) {
		Resources.update(find, set, function(err, result) {
			if(err) {
				reject(err);
				return;
			};

			resolve(result);
		});
	});
};

module.exports.updateMany = function(filter, update) {
	return new Promise(function(resolve, reject) {
		Resources.collection.updateMany(filter, update, function(err, result) {
		  	if(err) {
		  		reject(err);
		  		return;
		  	}

		  	resolve(result);
	    });
	});
};

module.exports.insertMany = function(resources) {
	return new Promise(function(resolve, reject) {
		if(!resources.length) reject('resources empty');
		Resources.insertMany(resources, function(err, docs) {
			if(err) {
				reject(err);
				return;
			}

			console.log("Resources | insertMany");
			resolve(docs);
		});
	});
};

module.exports.list = function(user, url, callback, errback) {
	Resources.find({ user: user, _siteUrl: url }, function(err, items) {
        if (err) {
            errback(err);
            return;
        }
        callback(items);
    });
};

module.exports.listForSite = function(user, site) {
	return new Promise(function(resolve, reject) {
		Resources.find({ _siteUrl: site, user: user }, function(err, items) {
	        if (err) {
	            reject(err);
	            return;
	        }
	        resolve(items);
	    });
	});
};

module.exports.remove = function(query, callback, errback) {
	return Resources.remove(query).exec();

	// return new Promise(function(resolve, reject) {
	// 	Resources.remove(query, function(err) {
	// 		if(err) {
	// 			reject(err);
	// 			return;
	// 		}

	// 		resolve();
	// 	});
	// });
};

module.exports.getBrokenLinks = function(user, url) {
	return new Promise(function(resolve, reject) {
		Resources.find(
			{ _siteUrl: url, user: user, whiteListed: false }, 
			{ _id: 0, _siteUrl: 0, user: 0, whiteListed: 0 },
			function(err, docs) {
				if(err) {
					reject(err);
					return;
				}

				resolve(docs);
			}
		);
	});
};

module.exports.getWhiteListedLinks = function(user, url) {
	return new Promise(function(resolve, reject) {
		Resources.distinct('url',
			{ _siteUrl: url, user: user, whiteListed: true },
			function(err, docs) {
				if(err) {
					reject(err);
					return;
				}

				resolve(docs);
			}
		);
	});
};

module.exports.drop = function(callback) {
    Resources.remove(function(err, p){
        callback(err);
    });
};