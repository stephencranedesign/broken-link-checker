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

module.exports.insertMany = function(resources, callback, errback) {
	resources.forEach(function(resource) {
		console.log("status: ", resource.info.status);
		if(resource.info.status === "failed" || resource.info.status === "notfound") console.log("***brokenResource: ", resource);
	});
	Resources.insertMany(resources, function(err, docs) {
		if(err) {
			if(errback) errback(err);
			return;
		}

		console.log("Resources | insertMany");
		 if(callback) callback(docs);
	});
};

module.exports.list = function(user, callback, errback) {
	Resources.find({ user: user }, function(err, items) {
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
