var Resources = require('../models/Resources.js');
var mongoose = require('mongoose'); // for drop function

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
	Resources.update(find, set, function(err, result) {
		if(err) {
			callback(err);
			return;
		};

		callback(null, result);
	});
};

module.exports.updateMany = function(filter, update, callback) {
	Resources.collection.updateMany(filter, update, function(err, result) {
	  	if(err) {
	  		callback(err);
	  		return;
	  	}

	  	callback(null, result);
  });
};

module.exports.insertMany = function(resources, callback, errback) {
	return new Promise(function(resolve, reject) {
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

module.exports.listForSite = function(user, site, callback, errback) {
	Resources.find({ _siteUrl: site, user: user }, function(err, items) {
        if (err) {
            errback(err);
            return;
        }
        callback(items);
    });
};

module.exports.remove = function(query, callback, errback) {
	Resources.remove(query, function(err) {
		if(err) {
			errback(err);
			return;
		}

		callback();
	});
};

module.exports.drop = function(callback) {
	Resources.remove(function(err, p){
        callback(err);
    });
};

module.exports.getBrokenLinks = function(user, url, callback, errback) {
	Resources.find(
		{ _siteUrl: url, user: user, isBroken: true }, 
		{ info: 1, _id: 0 }, 
		function(err, docs) {
			if(err) {
				errback(err);
				return;
			}

			callback(docs);
		}
	);
};

module.exports.nukeResourcesForPage = function(array, callback, errback) {
	var query = ["$or:["];
	array.forEach(function(id) {
		query.push("{_id:"+id+"},");
	});
	query.push("]");

	Resources.find().remove(query.join(""), function(err, doc) {
		if(err) {
			errback(err);
			return;
		}

		callback(doc);
	});
};

module.exports.drop = function(callback) {
    Resources.remove(function(err, p){
        callback(err);
    });
};